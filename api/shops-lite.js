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
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'server configuration error' });
  }
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

    // 画面が使っていない raw_data のキーを落とす
    //
    // 【2026-08-22 実測】okabayashi「スマホでページ送りが遅い」
    //   このAPIの応答は **1,406KB**、取得に最長 2,975ms かかっていた。
    //   ページ全体の転送量のうち圧倒的な支配要因で、JSは186KBに過ぎない。
    //   内訳を測ると raw_data が 966KB で、その中身は
    //     therapists 544KB / reviews 47KB / description 44KB / system 41KB
    //   ＝ **どれも画面のコードから一度も参照されていない**（grepで確認）。
    //   これらを落として **1,406KB → 648KB（54%削減）** になる。
    //
    // ⚠️ ここに列挙するのは「コード内に参照が無いことを確認したキー」だけにすること。
    //    使っているキーを消すと、画面から情報が静かに消える（＝住所が全店で消えた事故と同型）。
    // ⚠️ therapists は DataContext のフォールバックに使われているが、
    //    本物は therapists テーブルから取得しており、抽出20店すべてでDB側に在籍者が存在した。
    //    また古い収集データなので、連結すると重複表示の温床になる（threads と同じ理由）。
    // ⚠️ rating / reviewCount は収集元サイトの値。D-010 で表示禁止（shapeShopRow も落とす）。
    const DROP_KEYS = [
      'threads',        // 旧セラピスト重複データ
      'therapists',     // 同上（本物は therapists テーブル）
      'reviews',        // 旧埋め込み口コミ（本物は reviews テーブル）
      'description',    // 未使用
      'system',         // 未使用（料金は price_system 列を使う）
      'nearestStation', // 未使用（最寄駅は address に含まれる）
      'price',          // 未使用
      'isPremium',      // 未使用
      'rating',         // D-010: 収集元の評価は表示しない
      'reviewCount',    // 同上
      'websiteUrl',     // website_url 列と重複
    ];

    let strippedBytes = 0;
    const shops = rows.map((r) => {
      const raw = r.raw_data;
      if (!raw || typeof raw !== 'object') return r;
      let hit = false;
      const rest = {};
      for (const [k, v] of Object.entries(raw)) {
        if (DROP_KEYS.includes(k)) {
          if (v !== undefined && v !== null) strippedBytes += JSON.stringify(v).length;
          hit = true;
          continue;
        }
        rest[k] = v;
      }
      return hit ? { ...r, raw_data: rest } : r;
    });

    // 10分キャッシュ + 30分 stale許容（データJSONなのでHTMLのようなビルドID結合が無い＝安全）
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // 効果測定用（ブラウザのレスポンスヘッダで削減量と現在のサイズが見える）
    // ⚠️ ここが再び1MBを超えたら、raw_data に重いキーが増えた合図。
    //    スマホの体感速度に直結するので DROP_KEYS を見直すこと。
    const body = JSON.stringify(shops);
    res.setHeader('X-Shops-Count', String(shops.length));
    res.setHeader('X-Stripped-KB', String(Math.round(strippedBytes / 1024)));
    res.setHeader('X-Payload-KB', String(Math.round(body.length / 1024)));
    return res.status(200).send(body);
  } catch (e) {
    console.error('[api/shops-lite]', e && e.message);
    // 失敗時はキャッシュさせない（クライアントは直接Supabaseにフォールバックする）
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ error: 'failed' });
  }
}
