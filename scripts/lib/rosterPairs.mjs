/**
 * rosterPairs.mjs — 公式の在籍一覧から「名前・写真・人物ページ」の組を拾う部品（読むだけ）。
 * collect_new_therapists.mjs（新人を集める）と collect_official_links.mjs（公式プロフィールのURLを集める）が使う。
 * 2026-10-05 に collect_new_therapists.mjs から切り出した（同じ拾い方・同じ名前の整え方を2か所に書かないため）。
 */
import * as cheerio from 'cheerio';

export const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

// brand_roster_audit.mjs と同じ整え方（照合用）
export function nameKey(raw) {
  let s = String(raw || '').normalize('NFKC');
  s = s.replace(/さんの(写真|画像|プロフィール)$/, '').replace(/(セラピスト|セラピ)$/, '');
  s = s.replace(/[（(【\[〔～~〜].*?[）)】\]〕～~〜]/g, '');
  s = s.replace(/\d{2}\s*(歳|才)/g, '').replace(/T\.?\s*\d{3}.*$/i, '');
  s = s.replace(/^(新人|NEW|体験|本日出勤|出勤中)[\s:：・]*/i, '');
  s = s.replace(/[\s　・,，、。.!！?？♡♥★☆◆◇♦︎※]/g, '');
  s = s.replace(/(bluesky|twitter|instagram|tiktok|x|sns)$/i, '').replace(/0?\d$/, '');
  return s.toLowerCase();
}
export const NOT_PERSON = /(体験入店|スタッフ|シークレット|パネルNG|健康管理|新人セラピスト|出勤予定|出勤中|募集|求人|ロゴ|logo|banner|バナー|noimage|no_image|now ?printing|coming ?soon|[×＆&]|セット|ペア|割引|キャンペーン|イベント|コース|料金|予約)/i;
export const PLACEHOLDER_IMG = /(no-?image|noimage|now_?printing|comingsoon|np\.jpg|spacer|dummy|blank)/i;
export const PROFILE_HINT = /(profile|cast|girl|gals|therapist|staff|lady|detail|uid=|id=|GirlInfo|\/\d{1,6}\/?$)/i;

// 人物ページのURLの形（数字を含む段・2段目以降の最後の段は「*」）。/cast/123 と /cast/yui は「cast/*」、/blog/2024/xx は別の形
export function urlTemplate(u) {
  try {
    const x = new URL(u);
    const segs = x.pathname.split('/').filter(Boolean);
    const t = segs.map((seg, i) => (/\d/.test(seg) || (i === segs.length - 1 && segs.length > 1) ? '*' : seg));
    const q = [...new Set(x.searchParams.keys())].sort().map((k) => `${k}=*`).join('&');
    return `${x.hostname.replace(/^www\./, '')}/${t.join('/')}${q ? `?${q}` : ''}`;
  } catch { return ''; }
}
export const MIN_TEMPLATE_MATCHES = 3;
export function castIdOf(href) {
  try {
    const u = new URL(href);
    return u.searchParams.get('id') || u.searchParams.get('uid') || u.searchParams.get('sid') || u.searchParams.get('gid') || u.searchParams.get('lid') || u.searchParams.get('cast') || u.pathname.split('/').filter(Boolean).pop();
  } catch { return null; }
}
export function pairsFromHtml(html, base) {
  const $ = cheerio.load(html);
  const out = [];
  $('a').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (!PROFILE_HINT.test(href)) return;
    const img = $(a).find('img').first();
    const bg = $(a).find('[style*="background-image"]').first().attr('style') || $(a).attr('style') || '';
    let src = img.attr('data-src') || img.attr('data-original') || img.attr('data-lazy-src') || img.attr('src') || bg.match(/url\(['"]?([^'")]+)/)?.[1] || '';
    if (/spacer/.test(src) && img.attr('style')) src = img.attr('style').match(/url\(['"]?([^'")]+)/)?.[1] || src;
    const label = img.attr('alt') || $(a).find('h2,h3,h4,[class*=name]').first().contents().first().text() || '';
    if (!src || !label) return;
    try { out.push({ raw: label, imgUrl: new URL(src, base).href, profileUrl: new URL(href, base).href }); } catch { /* 無視 */ }
  });
  return out;
}
export async function getHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ja' }, signal: AbortSignal.timeout(20000) });
  const buf = Buffer.from(await res.arrayBuffer());
  const head = buf.slice(0, 3000).toString('latin1');
  const cs = (res.headers.get('content-type') || '').match(/charset=([\w-]+)/i)?.[1] || head.match(/charset=["']?([\w-]+)/i)?.[1] || 'utf-8';
  return new TextDecoder(/shift_?jis|sjis/i.test(cs) ? 'shift_jis' : /euc-jp/i.test(cs) ? 'euc-jp' : 'utf-8').decode(buf);
}
