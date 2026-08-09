/**
 * Vercel サーバーレス関数 — 店舗一覧（軽量版）
 * GET /api/shops-lite
 *
 * 【なぜ作ったか（2026-08-09 速度改善）】
 * DataContext がブラウザから Supabase を直接叩き、全1,098店を raw_data 込みで取得していた。
 * 実測すると raw_data は1店あたり 11,880 バイトで、そのうち **11,435バイト（96%）が
 * `raw_data.threads`**＝106人ぶんの「古いセラピスト重複データ」だった。
 * これを1,098店ぶん = 推定12MB前後、**全ユーザーが全ページで**ダウンロードしてJSONパースしていた。
 * （threads の中身は therapists テーブルから別途取得している本物と重複しており、
 *   getTherapistsByShopId では fromTable の後ろに連結されるだけ＝むしろ重複表示の温床だった）
 *
 * 【この関数がやること】
 * 1. Service Role でサーバー側（hnd1＝Supabaseと同じ東京）で全店取得
 * 2. `raw_data.threads` を落とす（それ以外のキーは触らない＝画面の shape は不変）
 * 3. CDN にキャッシュさせて返す → 2回目以降のユーザーは Supabase に触らず CDN から即取得
 *
 * 【キャッシュを長めにしてよい理由】
 * 2026-07の「真っ黒ページ」事故は *HTML* を長く stale にしたのが原因（HTMLはビルドIDに紐づく
 * JSチャンクを指すため、古いHTML＋消えたJS＝404で起動不能になった）。
 * これは **HTMLではなく純粋なデータJSON** で、ビルドIDと一切結合していない。
 * よって長めのキャッシュで事故は再発しない。店舗データの更新頻度は日単位なので10分で十分。
 */
import { createClient } from '@supabase/supabase-js';

const PAGE = 1000;

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  try {
    // ⚠️ 全件取得は必ず range() でページングする。
    //    PostgREST は max-rows(既定1000)が優先され、素の select は1,000行で頭打ちになり
    //    掲載1,098店のうち約98店がエラーも出さず欠落する（サイトマップで潰したのと同じバグ）。
    const rows = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('shops')
        .select(
          'id, group_id, name, raw_data, website_url, schedule_url, phone_number, business_hours, price_system, image_url'
        )
        .order('id')
        .range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      rows.push(...data);
      if (data.length < PAGE) break;
      if (rows.length >= 50000) break; // 暴走ガード
    }

    // raw_data.threads だけを落とす（他のキーは一切触らない）
    let strippedBytes = 0;
    const shops = rows.map((r) => {
      const raw = r.raw_data;
      if (raw && Array.isArray(raw.threads) && raw.threads.length) {
        strippedBytes += JSON.stringify(raw.threads).length;
        const { threads, ...rest } = raw;
        return { ...r, raw_data: rest };
      }
      return r;
    });

    // 10分キャッシュ + 30分 stale許容（データJSONなのでHTMLのようなビルドID結合が無い＝安全）
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // 効果測定用（ブラウザのレスポンスヘッダで削減量が見える）
    res.setHeader('X-Shops-Count', String(shops.length));
    res.setHeader('X-Stripped-KB', String(Math.round(strippedBytes / 1024)));
    return res.status(200).json(shops);
  } catch (e) {
    console.error('[api/shops-lite]', e && e.message);
    // 失敗時はキャッシュさせない（クライアントは直接Supabaseにフォールバックする）
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ error: 'failed' });
  }
}
