/**
 * deep_roster_audit.mjs — brand_roster_audit.mjs で「要確認」「読めない」になったサイトを、一覧ページを広く探して読み直す（読むだけ）
 *
 *   node scripts/maintenance/deep_roster_audit.mjs --from=outputs/roster-audit/audit-YYYY-MM-DD.json [--domain=example.com] [--skip=a.com,b.com]
 *
 * 出力: outputs/roster-audit/audit-<日付>-deep.json（reconcile_brand_rosters.mjs がそのまま読む形）
 *       読んだ文字は outputs/roster-audit/texts/<domain>.txt（reconcile の念押し確認に使う）
 *
 * 【なぜ（2026-09-26）】 2回目の照合で残った49サイトのうち、多くは一覧ページに辿り着けていなかった
 *  （トップページだけ読んで一致0＝Aroma Lunabelle・DAHLIA・EREN など）。brand_roster_audit の --render は
 *  トップから一覧らしいリンクを最大3つ辿るだけで、ページ送りも見ていなかった。
 *
 * 【読み方】 手元の Chrome で画面を組み立ててから読む。
 *  1. トップページの全リンクから一覧の候補を集める（URL か文字に cast/therapist/staff/girl/gals/lady/member/
 *     在籍/セラピスト/キャスト/女の子 など）。よくある一覧のURL（/cast/ /therapist/ /staff/ …）も足す。最大10候補。
 *  2. 候補を1つずつ組み立て、**DB の名前が画面の文字に何人出てくるか**を数え、いちばん多いページを一覧とする。
 *  3. その一覧のページ送り（/page/2/・?p=2・「次へ」）を最大12ページ辿り、文字をまとめる。
 *  4. 照合は brand_roster_audit の --render と同じ（名前が文字に出るか・1文字の名前は判定しない）。
 *  「使える」の基準も同じ（一致5人以上かつ40%以上）。reconcile 側で 60%未満は在籍確認だけ・退店60%超は何もしない。
 *
 * 【固まらないように（2026-09-26 に1サイトで6時間止まった）】 goto の timeout は読み込みにしか効かず、
 *  alert() などのダイアログが出ると page.evaluate が永久に返らない。→ ダイアログは閉じる・1ページ90秒・1サイト8分で打ち切る。
 *  結果は1サイト終わるごとにファイルへ書く（止まっても済んだ分は残る）。--resume で済んだサイトを飛ばして続きから。
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';
import { rootDomainOf } from '../lib/sourceProvenance.mjs';

const args = process.argv.slice(2);
for (const a of args) if (!/^(--from=.+|--domain=[\w.-]+|--skip=[\w.,-]+|--resume)$/.test(a)) { console.error(`❌ 知らない引数です: ${a}`); process.exit(1); }
const FROM = args.find((a) => a.startsWith('--from='))?.slice(7);
const ONLY = args.find((a) => a.startsWith('--domain='))?.slice(9);
const RESUME = args.includes('--resume');
const SKIP = new Set((args.find((a) => a.startsWith('--skip='))?.slice(7) || '').split(',').filter(Boolean));
if (!FROM && !ONLY) { console.error('使い方: --from=outputs/roster-audit/audit-YYYY-MM-DD.json（要確認・読めないサイトを対象）または --domain=...'); process.exit(1); }

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } });
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const DAYS = 120;

// brand_roster_audit.mjs と同じ整え方
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
const flatT = (v) => String(v || '').normalize('NFKC').replace(/[\s　]/g, '').toLowerCase();
const variants = (name) => {
  const a = flatT(name);
  const b = a.replace(/[（(【\[〔～~〜].*?[）)】\]〕～~〜]/g, '').replace(/\d+$/, '');
  return [...new Set([a, b, nameKey(name)])].filter((x) => x.length >= 2);
};

const LIST_HINT = /(cast|therapist|staff|girl|gal|lady|ladies|member|companion|lineup|zaiseki|profile_list|list)/i;
const LIST_TEXT = /(セラピスト|キャスト|在籍|女の子|女性一覧|THERAPIST|CAST|GIRLS?|STAFF|LADY|LADIES|MEMBER)/i;
const NOT_LIST = /(recruit|求人|blog|diary|日記|news|schedule|スケジュール|出勤|system|price|料金|access|アクセス|review|口コミ|contact|faq|uid=|id=\d|\/\d{2,}\/?$|detail|GirlInfo|\.(jpg|png|pdf)$)/i;
const COMMON_PATHS = ['/cast/', '/therapist/', '/therapists/', '/staff/', '/girls/', '/girl/', '/gals/', '/lady/', '/cast.html', '/therapist.html', '/staff.html', '/cast.php', '/staff.php', '/therapist.php'];

// ── DB（ドメインごとの在籍者）──────────────────────────
const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase.from('therapists').select('id,shop_id,name,last_seen_at,is_active').or('is_active.is.null,is_active.eq.true').range(from, from + 999);
  if (error) { console.error('❌ DBを読めません:', error.message); process.exit(1); }
  rows.push(...data); if (data.length < 1000) break;
}
const shops = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase.from('shops').select('id,website_url').range(from, from + 999);
  if (error) { console.error('❌ DBを読めません:', error.message); process.exit(1); }
  shops.push(...data); if (data.length < 1000) break;
}
const shopById = new Map(shops.map((s) => [s.id, s]));
const cutoff = Date.now() - DAYS * 86400000;
const byDomain = new Map();
for (const r of rows) {
  const s = shopById.get(r.shop_id); const d = rootDomainOf(s?.website_url);
  if (!d) continue;
  const g = byDomain.get(d) || { domain: d, website: s.website_url, rows: [], old: 0 };
  g.rows.push(r);
  if (!r.last_seen_at || new Date(r.last_seen_at).getTime() < cutoff) g.old += 1;
  byDomain.set(d, g);
}
let domains;
if (ONLY) domains = [ONLY];
else domains = JSON.parse(fs.readFileSync(FROM, 'utf-8')).results.filter((r) => !r.usable).map((r) => r.domain);
domains = domains.filter((d) => !SKIP.has(d) && byDomain.get(d)?.old > 0);

// ── 読む ─────────────────────────────────────────────
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const PAGE_MS = 90000;
const SITE_MS = 8 * 60000;
const withTimeout = (p, ms, label) => {
  let t;
  return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${label}（${ms / 1000}秒）で打ち切り`)), ms); })]).finally(() => clearTimeout(t));
};
async function render(url) {
  const page = await browser.newPage();
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  await page.setUserAgent(UA);
  try {
    return await withTimeout((async () => {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
      for (let k = 0; k < 8; k++) { await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight)); await new Promise((r) => setTimeout(r, 500)); }
      return await page.evaluate(() => ({
        url: location.href,
        text: document.body.innerText + '\n' + [...document.images].map((i) => i.alt || '').join('\n'),
        links: [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.href, text: (a.innerText || a.querySelector('img')?.alt || '').trim().slice(0, 40) })),
      }));
    })(), PAGE_MS, 'ページの読み込み');
  } finally { await withTimeout(page.close(), 10000, 'ページを閉じる').catch(() => {}); }
}
const hitsOf = (T, people) => people.filter(([, v]) => v.vs.some((x) => T.includes(x))).length;

fs.mkdirSync('outputs/roster-audit/texts', { recursive: true });
const out = path.join('outputs/roster-audit', `audit-${new Date().toISOString().slice(0, 10)}-deep${ONLY ? '-' + ONLY : ''}.json`);
const results = [];
if (RESUME && fs.existsSync(out)) {
  results.push(...JSON.parse(fs.readFileSync(out, 'utf-8')).results.filter((r) => !r.error));
  const done = new Set(results.map((r) => r.domain));
  domains = domains.filter((d) => !done.has(d));
  console.log(`--resume: 済み ${done.size}サイトを飛ばす・残り ${domains.length}サイト`);
}
const save = () => fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), days: DAYS, results }, null, 1));
let idx = 0;
await Promise.all(Array.from({ length: 2 }, async () => {
  while (idx < domains.length) {
    const d = domains[idx++];
    const g = byDomain.get(d);
    const people = new Map();
    for (const r of g.rows) { const k = nameKey(r.name); if (k) (people.get(k) || people.set(k, { rows: [], vs: variants(r.name) }).get(k)).rows.push(r); }
    const judged = [...people.entries()].filter(([, v]) => v.vs.length > 0);
    const res = { domain: d, website: g.website, shops: [...new Set(g.rows.map((r) => r.shop_id))], dbPeople: people.size, dbRows: g.rows.length, oldRows: g.old, method: 'text', officialPeople: null };
    try { await withTimeout((async () => {
      const top = await render(g.website);
      const origin = new URL(top.url).origin;
      const cand = new Map();
      for (const l of top.links) {
        if (!l.href.startsWith(origin)) continue;
        const h = l.href.replace(/#.*/, '');
        const pathq = h.slice(origin.length);
        if (NOT_LIST.test(pathq)) continue;
        if (LIST_HINT.test(pathq) || LIST_TEXT.test(l.text)) cand.set(h, (cand.get(h) || 0) + (LIST_TEXT.test(l.text) ? 2 : 1));
      }
      for (const p of COMMON_PATHS) if (![...cand.keys()].some((h) => h.slice(origin.length).replace(/\/$/, '') === p.replace(/\/$/, ''))) cand.set(origin + p, 0);
      const list = [...cand.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length).slice(0, 10).map(([h]) => h);
      let best = { url: top.url, text: top.text, hits: hitsOf(flatT(top.text), judged), links: top.links };
      const tried = [top.url];
      for (const u of list) {
        let got; try { got = await render(u); } catch { continue; }
        if (tried.includes(got.url)) continue;
        tried.push(got.url);
        const h = hitsOf(flatT(got.text), judged);
        if (h > best.hits) best = { url: got.url, text: got.text, hits: h, links: got.links };
      }
      // 一覧のページ送り
      const texts = [best.text]; const pages = [best.url];
      const bestPath = new URL(best.url).pathname.replace(/\/+$/, '');
      const queue = best.links.map((l) => l.href).filter((h) => h.startsWith(origin) && (new URL(h).pathname.startsWith(`${bestPath}/page/`) || (new URL(h).pathname.replace(/\/+$/, '') === bestPath && /[?&](p|page|pg)=\d+/.test(h))));
      for (const u of [...new Set(queue)]) {
        if (pages.length >= 12 || pages.includes(u)) continue;
        try { const got = await render(u); texts.push(got.text); pages.push(got.url); } catch { /* 次へ */ }
      }
      if (res.error) return; // 1サイトの打ち切り後に遅れて返ってきた分は捨てる
      const T = flatT(texts.join('\n'));
      fs.writeFileSync(path.join('outputs/roster-audit/texts', `${d}.txt`), T);
      const found = judged.filter(([, v]) => v.vs.some((x) => T.includes(x)));
      const notFound = judged.filter(([, v]) => !v.vs.some((x) => T.includes(x)));
      const rate = judged.length ? +(found.length / judged.length).toFixed(2) : 0;
      Object.assign(res, {
        pages, tried: tried.length, matchedPeople: found.length, matchRate: rate,
        usable: found.length >= 5 && rate >= 0.4,
        confirmRows: found.flatMap(([, v]) => v.rows.map((r) => r.id)),
        departRows: notFound.flatMap(([, v]) => v.rows.map((r) => r.id)),
        missingPeople: notFound.map(([k]) => k), newPeople: [],
        unjudgedPeople: people.size - judged.length,
      });
    })(), SITE_MS, '1サイト'); } catch (e) { res.error = e.message.slice(0, 120); res.usable = false; }
    results.push(res);
    save();
    const mark = res.error ? '❌' : res.usable ? '✅' : '⚠️';
    console.log(`${mark} ${d.padEnd(30)} DB ${String(res.dbPeople).padStart(4)}人 古い行 ${String(res.oldRows).padStart(4)} 文字に出る ${String(res.matchedPeople ?? '-').padStart(4)} (${res.matchRate ?? '-'}) 一覧 ${res.pages?.[0] || '-'}（${res.pages?.length || 0}ページ）${res.error ? ' ' + res.error : ''}`);
  }
}));
await browser.close();
const usable = results.filter((r) => r.usable);
console.log(`\n対象 ${results.length}サイト: 使える ${usable.length}／要確認 ${results.filter((r) => !r.usable && !r.error).length}／読めない ${results.filter((r) => r.error).length}`);
save();
console.log(`→ ${out}`);
