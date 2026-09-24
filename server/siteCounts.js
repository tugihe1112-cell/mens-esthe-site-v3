/**
 * トップの「掲載N店舗／在籍N人」の件数を数えてCDNに置く（GET /api/shops-lite?view=counts の中身）
 *
 * 🚩 独立した関数（api/site-counts.js）にしない（2026-09-24 本番のデプロイ失敗）。
 *    Vercel の無料プラン（Hobby）は `api/` の関数が1デプロイ12本まで。既に12本あり、13本目を足したら
 *    「No more than 12 Serverless Functions」でデプロイが失敗した（本番は前の版のまま）。
 *    ⇒ 同じ仕組み（CDNに置く）で返せる店舗一覧の関数に同居させる。`api/` にファイルを足す前に本数を数えること
 *      （check_core_safety_guards が12本を超えたら止める）。
 *
 * 【なぜ作ったか（2026-09-24 本番のDB記録で確認）】
 * トップのSSRは表示のたびにセラピスト56,625行を数えていた。この数え上げ1本で
 * **DBの実行時間全体の53%**（平均1.3秒・冷えた状態で2〜4秒・打ち切り1日17回）。
 * UptimeRobot が5分おきにトップを開くので、5分おきに冷えた状態で数え、トップの待ち時間になっていた。
 *
 * 最初は「トップの関数のメモリに30分持つ」で直した（b00e150）が、**関数は返答のあと止まる**ことがあり、
 * 期限が切れたあと裏で数え直した結果が次の表示で使われず、数え直しを繰り返していた
 * （本番のログ: 05:52〜06:19 の約30分に6回。直す前とほぼ同じ回数）。
 * 数え上げは冷えた状態で2.6〜4.4秒かかり、表示の中で待ちきれる長さでもなかった。
 *
 * 【この関数がやること】
 * 数えた結果を **CDNに置く**。期限（30分）が切れても、CDNは手元の版を即返しつつ裏でこの関数を呼んで取り直す。
 * 取り直しはCDNがこの関数の返答を最後まで待つので、関数が止まって結果が失われることがない。
 * トップはここ（CDN）から件数を読むだけ＝トップの表示が数え上げを待つことはない（デプロイ直後の1回を除く）。
 *
 * ⚠️ 数える条件はトップと同じ（shops は全件・therapists は is_active が null か true）。anon key で数える
 *    （画面の読み取りと同じ見え方）。数えた数字だけを返す（推計＝count:'planned' にしない）。
 * ⚠️ 成功の応答は res.end で返し、ETag を付けない（api/shops-lite.js と同じ理由。
 *    ETag を付けると、前の版を持つ人の問い合わせが 304 になってCDNに溜まらない）。
 * ⚠️ 失敗したら 503 + no-store（CDNに失敗を置かない）。文言は固定（内部の例外文を返さない）。
 */
import { createClient } from '@supabase/supabase-js';

/** api/shops-lite.js から呼ぶ（GET/HEAD の確認は呼び出し側で済んでいる）。 */
export async function sendSiteCounts(req, res) {
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'server configuration error' });
  }
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
  );

  try {
    const [shopsRes, therapistsRes] = await Promise.all([
      supabase.from('shops').select('id', { count: 'exact', head: true }),
      supabase.from('therapists')
        .select('id', { count: 'exact', head: true })
        .or('is_active.is.null,is_active.eq.true'),
    ]);
    if (shopsRes.error) throw shopsRes.error;
    if (therapistsRes.error) throw therapistsRes.error;
    const totalShops = shopsRes.count;
    const totalTherapists = therapistsRes.count;
    if (!Number.isInteger(totalShops) || !Number.isInteger(totalTherapists)) throw new Error('count missing');

    // 30分は取り直さない（数え上げは30分に1回まで）。期限切れから1日は手元の版を即返しつつ裏で取り直す（待つ人はいない）。
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const body = JSON.stringify({ totalShops, totalTherapists, countedAt: new Date().toISOString() });
    // 🚩 res.send() / res.json() で返さない（ETag が付く＝上の注記）。check_ssr_helpers が検査する。
    res.statusCode = 200;
    return res.end(body);
  } catch (e) {
    console.error('[api/shops-lite?view=counts]', e && e.message);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'count failed' });
  }
}
