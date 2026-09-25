/**
 * collect_new_therapists.mjs — 公式にいて DB にいない人（新人）を、名前・写真つきで集める（読むだけ）
 *
 *   node scripts/maintenance/collect_new_therapists.mjs --file=outputs/roster-audit/audit-YYYY-MM-DD.json [--file=...]
 *
 * 出力: outputs/roster-audit/new-therapists-<日付>.json（register_new_therapists.mjs が読む）
 *
 * 【対象】 brand_roster_audit.mjs で「使える」と判定し、一致率60%以上のサイトだけ（読み取りが確かなサイト）。
 * 【読み方】 audit で読んだ在籍一覧のページを読み直し、**人物ページへのリンクの中に写真があるもの**だけを
 *  「名前・写真・人物ページ」の組として拾う（見出しや説明文だけの候補は使わない＝名前でない文字を人として足さない）。
 *  画面を組み立ててから読んだサイト（method: text）は、手元の Chrome を裏で動かして同じように拾う。
 * 【新人の判定】 同じブランド（同じ公式サイト＝同じドメインの全ルーム）の DB の行に、同じ名前（nameKey）が
 *  **在籍中で1件も無い**人。退店扱いの行に同じ名前があれば「戻った人」として分ける（新しく足さず、戻す）。
 * 【除外】 人ではない枠（体験入店・スタッフ・シークレット・「×」「＆」で組んだ枠・新人セラピスト出勤予定 など）、
 *  2文字未満・13文字以上、写真の無い組。
 * 【2026-09-25 追加】
 *  ・名前は rosterNameClean で整える（サイト共通の頭の文字・キャッチコピー・読み仮名を外し、名前の形にならないものは捨てる）。
 *  ・**人物ページのURLの形**を、DBに在籍中の人（照合で一致した人）のリンクの形と比べる。同じ形のリンクが
 *    在籍中の人で3件以上ないものは使わない。1回目の集計で日記の題（「台風」「お久しぶりです」）やタグ（「清楚系」
 *    「未経験」）が人として拾われていたため。在籍中の人と同じ種類のリンク＝同じ在籍一覧の人、とみなす。
 */
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { rootDomainOf } from '../lib/sourceProvenance.mjs';
import { cleanRosterName, detectSitePrefix, selfTestRosterNameClean } from '../lib/rosterNameClean.mjs';

const args = process.argv.slice(2);
for (const a of args) if (!/^--file=.+$/.test(a)) { console.error(`❌ 知らない引数です: ${a}`); process.exit(1); }
const FILES = args.map((a) => a.slice(7));
if (!FILES.length) { console.error('使い方: --file=outputs/roster-audit/audit-YYYY-MM-DD.json'); process.exit(1); }

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } });
{
  const problems = selfTestRosterNameClean();
  if (problems.length) { console.error('❌ 名前の整え方が壊れています:', problems); process.exit(1); }
}
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

// brand_roster_audit.mjs と同じ整え方（照合用）
function nameKey(raw) {
  let s = String(raw || '').normalize('NFKC');
  s = s.replace(/さんの(写真|画像|プロフィール)$/, '').replace(/(セラピスト|セラピ)$/, '');
  s = s.replace(/[（(【\[〔～~〜].*?[）)】\]〕～~〜]/g, '');
  s = s.replace(/\d{2}\s*(歳|才)/g, '').replace(/T\.?\s*\d{3}.*$/i, '');
  s = s.replace(/^(新人|NEW|体験|本日出勤|出勤中)[\s:：・]*/i, '');
  s = s.replace(/[\s　・,，、。.!！?？♡♥★☆◆◇♦︎※]/g, '');
  s = s.replace(/(bluesky|twitter|instagram|tiktok|x|sns)$/i, '').replace(/0?\d$/, '');
  return s.toLowerCase();
}
const NOT_PERSON = /(体験入店|スタッフ|シークレット|パネルNG|健康管理|新人セラピスト|出勤予定|出勤中|募集|求人|ロゴ|logo|banner|バナー|noimage|no_image|now ?printing|coming ?soon|[×＆&]|セット|ペア|割引|キャンペーン|イベント|コース|料金|予約)/i;
const PLACEHOLDER_IMG = /(no-?image|noimage|now_?printing|comingsoon|np\.jpg|spacer|dummy|blank)/i;
const PROFILE_HINT = /(profile|cast|girl|gals|therapist|staff|lady|detail|uid=|id=|GirlInfo|\/\d{1,6}\/?$)/i;

// 人物ページのURLの形（数字を含む段・2段目以降の最後の段は「*」）。/cast/123 と /cast/yui は「cast/*」、/blog/2024/xx は別の形
function urlTemplate(u) {
  try {
    const x = new URL(u);
    const segs = x.pathname.split('/').filter(Boolean);
    const t = segs.map((seg, i) => (/\d/.test(seg) || (i === segs.length - 1 && segs.length > 1) ? '*' : seg));
    const q = [...new Set(x.searchParams.keys())].sort().map((k) => `${k}=*`).join('&');
    return `${x.hostname.replace(/^www\./, '')}/${t.join('/')}${q ? `?${q}` : ''}`;
  } catch { return ''; }
}
const MIN_TEMPLATE_MATCHES = 3;
function castIdOf(href) {
  try {
    const u = new URL(href);
    return u.searchParams.get('id') || u.searchParams.get('uid') || u.searchParams.get('cast') || u.pathname.split('/').filter(Boolean).pop();
  } catch { return null; }
}
function pairsFromHtml(html, base) {
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
async function getHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ja' }, signal: AbortSignal.timeout(20000) });
  const buf = Buffer.from(await res.arrayBuffer());
  const head = buf.slice(0, 3000).toString('latin1');
  const cs = (res.headers.get('content-type') || '').match(/charset=([\w-]+)/i)?.[1] || head.match(/charset=["']?([\w-]+)/i)?.[1] || 'utf-8';
  return new TextDecoder(/shift_?jis|sjis/i.test(cs) ? 'shift_jis' : /euc-jp/i.test(cs) ? 'euc-jp' : 'utf-8').decode(buf);
}

// ── 対象サイト ─────────────────────────────────────────
const byDomain = new Map();
for (const f of FILES) for (const r of JSON.parse(fs.readFileSync(f, 'utf-8')).results) {
  if (r.usable && (r.matchRate ?? 0) >= 0.6) byDomain.set(r.domain, r);   // 後のファイルが優先
}
const sites = [...byDomain.values()];

// ── DB（対象ドメインの全ルームの行）────────────────────────
const shops = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase.from('shops').select('id,website_url,group_id').range(from, from + 999);
  if (error) { console.error('❌', error.message); process.exit(1); }
  shops.push(...data); if (data.length < 1000) break;
}
const shopsByDomain = new Map();
for (const s of shops) { const d = rootDomainOf(s.website_url); if (d) (shopsByDomain.get(d) || shopsByDomain.set(d, []).get(d)).push(s); }

let puppeteer = null; let browser = null;
const results = [];
for (const r of sites) {
  const domainShops = shopsByDomain.get(r.domain) || [];
  // 同じブランド（group_id）の別ドメインのルームも含める（D-014: 名簿はブランドで1つ）
  const groups = new Set(domainShops.map((s) => s.group_id).filter(Boolean));
  const brandShops = shops.filter((s) => domainShops.includes(s) || (s.group_id && groups.has(s.group_id)));
  const rows = [];
  for (const s of brandShops) {
    const { data } = await supabase.from('therapists').select('id,shop_id,name,is_active').eq('shop_id', s.id);
    rows.push(...(data || []));
  }
  const active = new Set(rows.filter((t) => t.is_active !== false).map((t) => nameKey(t.name)));
  const inactive = new Map(rows.filter((t) => t.is_active === false).map((t) => [nameKey(t.name), t]));
  let pairs = [];
  for (const p of r.pages || []) {
    try {
      let html;
      if (r.method === 'text') {
        if (!browser) { puppeteer = (await import('puppeteer-core')).default; browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' }); }
        const pg = await browser.newPage(); await pg.setUserAgent(UA);
        await pg.goto(p, { waitUntil: 'networkidle2', timeout: 45000 });
        for (let k = 0; k < 8; k++) { await pg.evaluate(() => window.scrollBy(0, 1500)); await new Promise((res) => setTimeout(res, 300)); }
        html = await pg.content(); await pg.close();
      } else html = await getHtml(p);
      pairs.push(...pairsFromHtml(html, p));
    } catch { /* 次へ */ }
  }
  const prefix = detectSitePrefix(pairs.map((x) => x.raw));
  const seen = new Set(); const seenMatched = new Set();
  const matchedTpl = new Map();
  const cand = [];
  let rejectedName = 0;
  for (const x of pairs) {
    if (NOT_PERSON.test(x.raw) || PLACEHOLDER_IMG.test(x.imgUrl)) continue;
    const name = cleanRosterName(x.raw, prefix);
    const key = name ? nameKey(name) : nameKey(x.raw);
    const tpl = urlTemplate(x.profileUrl);
    if (active.has(key) || active.has(nameKey(x.raw))) {
      if (!seenMatched.has(key)) { seenMatched.add(key); matchedTpl.set(tpl, (matchedTpl.get(tpl) || 0) + 1); }
      continue;
    }
    if (!name) { rejectedName += 1; continue; }
    if (!key || key.length < 2 || seen.has(key)) continue;
    seen.add(key);
    cand.push({ name, key, tpl, imgUrl: x.imgUrl, profileUrl: x.profileUrl, castId: castIdOf(x.profileUrl) });
  }
  const tplOk = (t) => (matchedTpl.get(t) || 0) >= MIN_TEMPLATE_MATCHES;
  const newPeople = []; const revive = []; const droppedByTemplate = [];
  for (const c of cand) {
    if (!tplOk(c.tpl)) { droppedByTemplate.push(c.name); continue; }
    if (inactive.has(c.key)) revive.push({ ...c, therapistId: inactive.get(c.key).id }); else newPeople.push(c);
  }
  // 足す先＝同じドメインのルームのうち在籍の行が一番多いルーム（ブランドページで全員まとめて出る）
  const counts = domainShops.map((s) => [s.id, rows.filter((t) => t.shop_id === s.id && t.is_active !== false).length]).sort((a, b) => b[1] - a[1]);
  results.push({ domain: r.domain, website: r.website, rosterPages: r.pages, addTo: counts[0]?.[0], pairs: pairs.length, cleaned: true, prefix, matched: seenMatched.size, matchedTemplates: Object.fromEntries(matchedTpl), rejectedName, droppedByTemplate, newPeople, revive });
  console.log(`${r.domain.padEnd(34)} 組 ${String(pairs.length).padStart(4)}  在籍と一致 ${String(seenMatched.size).padStart(3)}  新人 ${String(newPeople.length).padStart(3)}  戻った人 ${String(revive.length).padStart(3)}  リンクの形が違い外す ${String(droppedByTemplate.length).padStart(3)}  → ${counts[0]?.[0] || '?'}`);
}
if (browser) await browser.close();
const tot = (k) => results.reduce((n, r) => n + r[k].length, 0);
console.log(`\n${results.length}サイト: 新人 ${tot('newPeople')}人・戻った人 ${tot('revive')}人`);
const out = path.join('outputs/roster-audit', `new-therapists-${new Date().toISOString().slice(0, 10)}.json`);
fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), files: FILES, results }, null, 1));
console.log(`→ ${out}`);
