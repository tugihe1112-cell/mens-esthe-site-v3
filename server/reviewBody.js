/**
 * ホームの口コミカードを「その場で全文を開く」ための本文（GET /api/shops-lite?view=review&id=<口コミID> の中身）
 *
 * 【なぜ（2026-10-05）】 最初はブラウザから Supabase へ直接取りに行っていたが、okabayashi「スマホでうまく行ってない
 *   気がする／遅いだけ？／折りたたみが開いて見れない」。DB はしばらく使われないと1回目の返事に数秒〜最大9.6秒かかり
 *   （2026-09-24 実測）、しかも取得に時間の上限が無かった＝返事が来なければ骨組みのまま永久に開かない。
 *   外部ドメイン（supabase.co）への通信を止める広告ブロッカーでも開かない。
 *   → 自分のドメインの関数で返し、CDN に置く。1人目が取った本文は、次の人には CDN から即返る
 *     （最新1件はみんな同じ口コミなので、ほぼ常に CDN から）。
 *
 * 🚩 独立した関数にしない（Vercel 無料プランは1デプロイ12関数まで＝server/siteCounts.js の注記）。shops-lite に同居。
 * ⚠️ 公開口コミだけ（is_public=true）。ホームに出るのは公開口コミだけなので、匿名キーで読む（画面と同じ見え方）。
 * ⚠️ 成功の応答は res.end で返し、ETag を付けない（ETag を付けると 304 になって CDN に溜まらない＝shops-lite と同じ）。
 * ⚠️ 失敗は 503 + no-store（CDN に失敗を置かない）。見つからないは 404（短くだけ置く）。文言は固定。
 */
import { createServerSupabase } from './supabaseServer.js';

const ID_MAX = 200;

export async function sendReviewBody(req, res) {
  const id = typeof req.query?.id === 'string' ? req.query.id : '';
  if (!id || id.length > ID_MAX) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'bad id' });
  }
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'server configuration error' });
  }
  try {
    const supabase = createServerSupabase(process.env.VITE_SUPABASE_ANON_KEY);
    const { data, error } = await supabase
      .from('reviews')
      .select('id, story_sections, content')
      .eq('id', id)
      .eq('is_public', true)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      return res.status(404).json({ error: 'not found' });
    }
    // 10分は取り直さない。期限切れから1日は手元の版を即返しつつ裏で取り直す（待つ人はいない）。
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const body = JSON.stringify({ id: data.id, storySections: data.story_sections || null, content: data.content || '' });
    // 🚩 res.send() / res.json() で返さない（ETag が付く）。
    res.statusCode = 200;
    return res.end(body);
  } catch (e) {
    console.error('[api/shops-lite?view=review]', e && e.message);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'review body unavailable' });
  }
}
