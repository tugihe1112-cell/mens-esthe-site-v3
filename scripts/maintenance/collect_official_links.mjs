/**
 * collect_official_links.mjs — セラピストの公式プロフィールのURLと、店の公式の在籍一覧のURLを集める（読むだけ・DBは書かない）
 *
 *   node scripts/maintenance/collect_official_links.mjs [--domains=a.com,b.com] [--limit=N] [--audit=outputs/roster-audit/audit-X.json,...]
 *     --audit= を付けるとその照合結果だけを材料にする（付けなければ outputs/roster-audit/audit-*.json 全部）
 *
 * 出力: outputs/official-links/plan-<日付>.json（apply_official_links.mjs が読む）
 *
 * 【なぜ（2026-10-05）】 okabayashi「できたらセラピストのリンクがいいけど無理ならセラピストページのリンクでいいから…店のね公式の」。
 *   口コミを読んで会いたくなった人を、その人の公式プロフィール（出勤・予約の入口）へ直接送りたい。
 *   DB には公式プロフィールのURLがほぼ無かった（在籍5.7万人中107人）。在籍一覧のURLも持っていなかった。
 * 【材料】 毎月の名簿照合（brand_roster_audit / deep_roster_audit）の結果 outputs/roster-audit/audit-*.json の
 *   「在籍一覧として読んだページ（pages）」。サイトごとに一番新しい結果を使う（使える判定のものを優先）。
 * 【拾い方】 collect_new_therapists.mjs と同じ（scripts/lib/rosterPairs.mjs）＝人物ページへのリンクの中に写真があるものだけを
 *   「名前・人物ページ」の組として拾い、DBの在籍中の人と名前（nameKey）で突き合わせる。
 * ⚠️ 確かなものだけ使う:
 *   ・人物ページのURLの形（cast/* など）が、照合で一致した人の中で3人以上同じもの（日記・タグのリンクを人のページとしない）
 *   ・公式サイトと同じホスト（またはサブドメイン）＝ポータル・SNSへは送らない（src/utils/officialLinks.js と同じ判定）
 *   ・同じ名前に違う人物ページが2つ以上ある（同名の別人・重複）ときは使わない
 *   ・同じブランドの複数ルームに同じ人の行があるときは、全部に同じURL（D-014: 同じ人）
 * ⚠️ 在籍一覧のURLは、照合で読んだページのうち公式サイトのトップ以外の最初のページ（トップに一覧がある店は持たない＝公式サイトへ）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { rootDomainOf } from '../lib/sourceProvenance.mjs';
import { cleanRosterName, detectSitePrefix, selfTestRosterNameClean } from '../lib/rosterNameClean.mjs';
import { UA, nameKey, NOT_PERSON, PLACEHOLDER_IMG, urlTemplate, MIN_TEMPLATE_MATCHES, pairsFromHtml, getHtml } from '../lib/rosterPairs.mjs';
import { sameOfficialSite, safeHttpUrl } from '../../src/utils/officialLinks.js';

const args = process.argv.slice(2);
for (const a of args) if (!/^--(domains|limit|audit)=.+$/.test(a)) { console.error(`❌ 知らない引数です: ${a}`); process.exit(1); }
const AUDITS = args.filter((a) => a.startsWith('--audit=')).flatMap((a) => a.slice(8).split(',')).map((f) => f.trim()).filter(Boolean);
const ONLY = new Set(args.filter((a) => a.startsWith('--domains=')).flatMap((a) => a.slice(10).split(',')).map((d) => d.trim()).filter(Boolean));
const LIMIT = Number(args.find((a) => a.startsWith('--limit='))?.slice(8) || 0);

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } });
{
  const problems = selfTestRosterNameClean();
  if (problems.length) { console.error('❌ 名前の整え方が壊れています:', problems); process.exit(1); }
}

// ── 材料: 照合の結果（サイトごとに一番新しいもの・使える判定を優先）──────────
const AUDIT_DIR = 'outputs/roster-audit';
const byDomain = new Map();
const auditFiles = AUDITS.length ? AUDITS : fs.readdirSync(AUDIT_DIR).filter((x) => /^audit-.*\.json$/.test(x)).sort().map((f) => path.join(AUDIT_DIR, f));
for (const f of auditFiles) {
  let j; try { j = JSON.parse(fs.readFileSync(f, 'utf-8')); } catch { if (AUDITS.length) { console.error(`❌ 読めません: ${f}`); process.exit(1); } continue; }
  for (const r of j.results || []) {
    if (!r?.domain || !(r.pages || []).length) continue;
    const prev = byDomain.get(r.domain);
    if (!prev || r.usable || !prev.usable) byDomain.set(r.domain, r);
  }
}
let sites = [...byDomain.values()].filter((r) => !ONLY.size || ONLY.has(r.domain));
if (LIMIT) sites = sites.slice(0, LIMIT);

// ── DB ─────────────────────────────────────────────────
async function all(table, cols) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(cols).range(from, from + 999);
    if (error) { console.error('❌', table, error.message); process.exit(1); }
    out.push(...data); if (data.length < 1000) break;
  }
  return out;
}
const shops = await all('shops', 'id,website_url,group_id,roster_url:raw_data->>rosterUrl');
const shopsByDomain = new Map();
for (const s of shops) { const d = rootDomainOf(s.website_url); if (d) (shopsByDomain.get(d) || shopsByDomain.set(d, []).get(d)).push(s); }

const pathOf = (u) => { try { const x = new URL(u); return x.pathname.replace(/\/+$/, '') + x.search; } catch { return null; } };
const isTop = (u, website) => sameOfficialSite(u, website) && ['', '/index.html', '/index.php', '/top', '/home'].includes(pathOf(u) || '');

let browserP = null;
async function render(url) {
  if (!browserP) {
    browserP = (async () => {
      const puppeteer = (await import('puppeteer-core')).default;
      return puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
    })();
  }
  const browser = await browserP;
  const pg = await browser.newPage();
  pg.on('dialog', (d) => d.dismiss().catch(() => {}));
  try {
    await pg.setUserAgent(UA);
    await pg.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    for (let k = 0; k < 10; k++) { await pg.evaluate(() => window.scrollBy(0, 1500)); await new Promise((res) => setTimeout(res, 300)); }
    return await pg.content();
  } finally { await pg.close().catch(() => {}); }
}

const results = [];
const startedAt = Date.now();
let doneCount = 0;
// 3サイトずつ同時に読む（1サイトずつだと全部で1時間かかる）。結果は読んだ順ではなく元の順に並べ直す。
async function processSite(r, order) {
  // 1つのドメインを別々の店が使っているサイト（men-este.com のサブドメインなど）は、読んだサイトと同じホストの店だけ
  const website0 = safeHttpUrl(r.website);
  // 照合の結果は、1つのドメインを別々の店が使うサイトではホスト名（candy-s-candy.men-es.jp）で、それ以外はドメインで来る。
  // 店はドメインで引いてからホストで絞る（2026-10-05 まではホスト名の結果を引けず、Candy Spa・Aroma Terrace 名古屋などを黙って飛ばしていた）
  const root = rootDomainOf(website0 || '') || rootDomainOf(r.domain);
  const domainShops = (shopsByDomain.get(root) || []).filter((s) => !website0 || sameOfficialSite(s.website_url, website0));
  if (!domainShops.length) return;
  const website = website0 || safeHttpUrl(domainShops[0].website_url);
  const groups = new Set(domainShops.map((s) => s.group_id).filter(Boolean));
  const brandShops = shops.filter((s) => domainShops.includes(s) || (s.group_id && groups.has(s.group_id)));
  const rows = [];
  for (const s of brandShops) {
    const { data } = await supabase.from('therapists').select('id,shop_id,name,is_active,profile_url:raw_data->>profileUrl').eq('shop_id', s.id);
    rows.push(...(data || []).filter((t) => t.is_active !== false));
  }
  const byKey = new Map();
  for (const t of rows) { const k = nameKey(t.name); if (k) (byKey.get(k) || byKey.set(k, []).get(k)).push(t); }

  let pairs = [];
  for (const p of r.pages || []) {
    try {
      const html = r.method === 'text' ? await render(p) : await getHtml(p);
      pairs.push(...pairsFromHtml(html, p));
    } catch { /* 次へ */ }
  }
  const prefix = detectSitePrefix(pairs.map((x) => x.raw));
  // 名前 → 人物ページ（同じ名前に違うページが2つ以上なら使わない）
  const urlsByKey = new Map();
  for (const x of pairs) {
    const body = prefix && String(x.raw).normalize('NFKC').replace(/[\s　]+/g, ' ').trim().startsWith(prefix)
      ? String(x.raw).normalize('NFKC').replace(/[\s　]+/g, ' ').trim().slice(prefix.length) : x.raw;
    if (NOT_PERSON.test(body) || PLACEHOLDER_IMG.test(x.imgUrl)) continue;
    const name = cleanRosterName(x.raw, prefix);
    const keys = [...new Set([name ? nameKey(name) : null, nameKey(x.raw)].filter(Boolean))];
    // 一覧の名前に店名やルーム名が後ろに付く形（「おと 極みのミセス HITO NO YOME〜」「ゆな　日本橋」）は、
    // 完全一致しないときだけ先頭の語（姓名に分かれていれば先頭2語）で照合し直す
    const toks = String(body).normalize('NFKC').trim().split(/[\s　]+/).filter(Boolean);
    const loose = [toks.length > 2 ? nameKey(toks[0] + toks[1]) : null, nameKey(toks[0] || '')].filter((k) => k && k.length >= 2);
    const key = keys.find((k) => byKey.has(k)) || loose.find((k) => byKey.has(k));
    if (!key) continue;
    const u = safeHttpUrl(x.profileUrl);
    if (!u || !website || !sameOfficialSite(u, website) || isTop(u, website)) continue;
    (urlsByKey.get(key) || urlsByKey.set(key, new Set()).get(key)).add(u.replace(/#.*$/, ''));
  }
  const tplCount = new Map();
  for (const set of urlsByKey.values()) if (set.size === 1) { const t = urlTemplate([...set][0]); tplCount.set(t, (tplCount.get(t) || 0) + 1); }
  const okTpl = new Set([...tplCount].filter(([, n]) => n >= MIN_TEMPLATE_MATCHES).map(([t]) => t));
  const therapists = [];
  let ambiguous = 0; let offTemplate = 0;
  // 違う人に同じURLが付く（「一覧へ戻る」など人のページではないリンク）なら使わない
  const keysByUrl = new Map();
  for (const [key, set] of urlsByKey) if (set.size === 1) { const u = [...set][0]; keysByUrl.set(u, (keysByUrl.get(u) || 0) + 1); }
  for (const [key, set] of urlsByKey) {
    if (set.size !== 1) { ambiguous += 1; continue; }
    const url = [...set][0];
    if (keysByUrl.get(url) > 1) { ambiguous += 1; continue; }
    if (!okTpl.has(urlTemplate(url))) { offTemplate += 1; continue; }
    for (const t of byKey.get(key)) therapists.push({ id: t.id, shop_id: t.shop_id, name: t.name, profileUrl: url, before: t.profile_url || null });
  }
  // 在籍一覧のURL（トップ以外の最初のページ）。トップに一覧がある店は持たない
  const rosterPage = (r.pages || []).map(safeHttpUrl).find((u) => u && website && sameOfficialSite(u, website) && !isTop(u, website)) || null;
  const shopRows = rosterPage ? domainShops.map((s) => ({ id: s.id, rosterUrl: rosterPage, before: s.roster_url || null })) : [];
  const people = new Set(rows.map((t) => nameKey(t.name))).size;
  doneCount += 1;
  const i = doneCount;
  results.push({ order, domain: r.domain, website, method: r.method || 'html', pages: r.pages, pairs: pairs.length, people, matched: urlsByKey.size, okTemplates: [...okTpl], ambiguous, offTemplate, therapists, shops: shopRows });
  const el = Math.round((Date.now() - startedAt) / 1000);
  console.log(`[${i}/${sites.length} ${el}s] ${r.domain.padEnd(34)} 組 ${String(pairs.length).padStart(4)}  在籍 ${String(people).padStart(3)}人  プロフィール ${String(new Set(therapists.map((t) => nameKey(t.name))).size).padStart(3)}人  一覧 ${rosterPage ? 'あり' : '－'}${ambiguous ? `  同名で外す ${ambiguous}` : ''}${offTemplate ? `  形が違い外す ${offTemplate}` : ''}`);
}
let nextSite = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (nextSite < sites.length) {
    const k = nextSite++;
    try { await processSite(sites[k], k); } catch (e) { console.log(`  ⚠️ ${sites[k].domain}: ${e.message}`); }
  }
}));
results.sort((a, b) => a.order - b.order);
if (browserP) await (await browserP).close();

const nT = results.reduce((n, r) => n + r.therapists.length, 0);
const nS = results.reduce((n, r) => n + r.shops.length, 0);
const changedT = results.reduce((n, r) => n + r.therapists.filter((t) => t.before && t.before !== t.profileUrl).length, 0);
console.log(`\n${results.length}サイト: 公式プロフィール ${nT}行（うち今の値と違う ${changedT}行）・在籍一覧 ${nS}店`);
fs.mkdirSync('outputs/official-links', { recursive: true });
const out = path.join('outputs/official-links', `plan-${new Date().toISOString().slice(0, 10)}.json`);
fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), results }, null, 1));
console.log(`→ ${out}`);
