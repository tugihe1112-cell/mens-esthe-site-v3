/**
 * POST /api/track-view  { ids: [reviewId, ...] }
 * セラピストページの閲覧カウント（週次リテンションメールの集計元）。
 *
 * 以前はセラピストページの getServerSideProps 内で increment していたが、
 * それだとページをCDNキャッシュできない（gSSPが走らない＝カウントされない）。
 * 閲覧カウントをこのクライアント発火のAPIに逃がすことで:
 *   - セラピストページを s-maxage でCDNキャッシュ可能にする（体感速度UP・戻るも速く）
 *   - bot は JS を実行しないので、クライアント発火＝自然に人間のみ集計（精度もむしろ改善）
 * service role を使うのでRLSを気にせず確実に increment できる。
 */
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(204).end();

    // 念のため明白なbot UAは弾く（通常クライアントJSはbot非実行なので基本は人間のみ）
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    if (/bot|crawl|spider|slurp|bing|google|yandex|baidu|duckduck|facebookexternalhit|embedly/.test(ua)) {
      return res.status(204).end();
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    await supabase.rpc('increment_review_views', { ids: ids.slice(0, 50) });
    return res.status(204).end();
  } catch (e) {
    // 集計失敗は表示・機能に影響させない
    return res.status(204).end();
  }
}
