/**
 * verify_listing_candidates.mjs — 新人候補を「公式の在籍一覧の画面に見えているか」で1人ずつ確かめる（読むだけ）
 *
 *   node scripts/maintenance/verify_listing_candidates.mjs --file=outputs/roster-audit/new-therapists-YYYY-MM-DD.json \
 *     --site=estheking.jp=https://www.estheking.jp/staff/ [--site=...]
 *
 * 出力: 入力と同じ形の JSON（指定したサイトだけ・確かめられた候補だけ）を <入力>.verified.json に書く。
 *       register_new_therapists.mjs --file=<それ> --max-per-site=N で登録する。
 *
 * 【なぜ（2026-09-26）】 1サイトで新人が60人を超えた11サイトは、読み取りの失敗を疑って足さなかった。
 *  調べると、公式の一覧の人数は拾った人数とほぼ合っていた（rhea 155・estheking 201・namexspa 666 など）が、
 *  一覧に「隠れた欄（卒業・休業など）」があると、画面に見えない人まで新人として足してしまう。
 *  → 在籍一覧のページ（ページ送りも辿る）を手元の Chrome で組み立て、**画面に見えている**人物リンクだけを集め、
 *    候補の人物ページのURLがその中にある人だけ残す。
 *
 * 【安全装置】 知らない引数は止める。一覧から人物リンクが5件未満ならそのサイトは全員外す（読み取りの失敗）。
 */
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
for (const a of args) if (!/^(--file=.+|--site=[^=]+=https?:\/\/.+)$/.test(a)) { console.error(`❌ 知らない引数です: ${a}`); process.exit(1); }
const FILE = args.find((a) => a.startsWith('--file='))?.slice(7);
const SITES = args.filter((a) => a.startsWith('--site=')).map((a) => { const v = a.slice(7); const i = v.indexOf('='); return { domain: v.slice(0, i), listing: v.slice(i + 1) }; });
if (!FILE || !SITES.length) { console.error('使い方: --file=... --site=<ドメイン>=<在籍一覧のURL> [...]'); process.exit(1); }

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const MAX_PAGES = 15;
const norm = (u) => {
  try {
    const x = new URL(u);
    x.hash = '';
    const keep = [...x.searchParams.entries()].filter(([k]) => /^(id|uid|sid|gid|lid|cast|_uid)$/i.test(k)).sort();
    x.search = keep.length ? `?${keep.map(([k, v]) => `${k}=${v}`).join('&')}` : '';
    return `${x.hostname.replace(/^www\./, '')}${x.pathname.replace(/\/+$/, '')}${x.search}`.toLowerCase();
  } catch { return ''; }
};

const data = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const out = [];
for (const s of SITES) {
  const r = data.results.find((x) => x.domain === s.domain);
  if (!r) { console.log(`${s.domain}: 入力にありません`); continue; }
  const visible = new Set();
  const queue = [s.listing]; const done = new Set();
  const listingPath = new URL(s.listing).pathname.replace(/\/+$/, '');
  while (queue.length && done.size < MAX_PAGES) {
    const u = queue.shift();
    if (done.has(u)) continue;
    done.add(u);
    const p = await browser.newPage(); await p.setUserAgent(UA);
    try {
      await p.goto(u, { waitUntil: 'networkidle2', timeout: 60000 });
      for (let i = 0; i < 25; i++) { await p.evaluate(() => window.scrollBy(0, 2000)); await new Promise((res) => setTimeout(res, 250)); }
      const got = await p.evaluate((lp) => {
        const isVisible = (el) => {
          const st = getComputedStyle(el);
          if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return false;
          const rect = el.getBoundingClientRect();
          return rect.width > 2 && rect.height > 2;
        };
        const people = []; const pages = [];
        for (const a of document.querySelectorAll('a[href]')) {
          if (!a.href.startsWith(location.origin)) continue;
          const path = new URL(a.href).pathname.replace(/\/+$/, '');
          // ページ送り（同じ一覧の2ページ目以降）
          if ((path.startsWith(`${lp}/page/`) || (path === lp && /[?&](p|page|pg)=\d+/.test(a.href)))) { pages.push(a.href); continue; }
          const img = a.querySelector('img');
          const target = img || a;
          if (isVisible(target)) people.push(a.href);
        }
        return { people, pages };
      }, listingPath);
      for (const h of got.people) visible.add(norm(h));
      for (const h of got.pages) if (!done.has(h)) queue.push(h);
    } catch (e) { console.log(`  ${u}: 読めません（${e.message.slice(0, 60)}）`); }
    await p.close();
  }
  const keep = (list) => list.filter((x) => visible.has(norm(x.profileUrl)));
  const newPeople = keep(r.newPeople); const revive = keep(r.revive);
  const ok = visible.size >= 5;
  console.log(`${s.domain.padEnd(26)} 一覧 ${done.size}ページ・画面に見える人物リンク ${String(visible.size).padStart(4)} ／ 新人候補 ${r.newPeople.length} → 一覧に見える ${newPeople.length}（外す ${r.newPeople.length - newPeople.length}）${ok ? '' : '  ← 人物リンク5件未満＝全員外す'}`);
  out.push({ ...r, listing: s.listing, listingPages: [...done], visibleLinks: visible.size, newPeople: ok ? newPeople : [], revive: ok ? revive : [] });
}
await browser.close();
const outPath = FILE.replace(/\.json$/, '.verified.json');
fs.writeFileSync(outPath, JSON.stringify({ at: new Date().toISOString(), from: FILE, results: out }, null, 1));
console.log(`→ ${outPath}`);
