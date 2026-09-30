/**
 * scrape_new_shop_rosters.mjs — 新しく登録する店の公式サイトから名簿を読み、register_hyogo_shops.mjs が読む形で書き出す（読むだけ・DBに書かない）
 *
 *   node scripts/maintenance/scrape_new_shop_rosters.mjs --config=outputs/new-shops-2026-09-29/config.json
 *   オプション: --only=<key,key>（その店だけ読み直して、既存の出力に上書き）
 *
 * 【なぜ（2026-09-29）】 兵庫の20店（9/24）は店ごとに読み方を書いた（scrape_hyogo_rosters.mjs）。岐阜・三重・兵庫の注目店で
 *  30店あり、同じことを店ごとに書くと手で写す誤りが増える。9/27〜9/28 に77サイトを揃えた sync_caskan_roster.mjs と同じ考え方で、
 *  「人物ページへのリンク＋写真」が同じ形で並ぶいちばん大きい固まりを在籍一覧とみなす。
 *
 * 【config の形】 { label, prefecture?, shops: [{ key, id, name, website_url, prefecture, city, area:[..], address?,
 *                   list?: URL か URL の配列（在籍一覧。無ければよくある場所を順に試す）, link?: 人物リンクの正規表現,
 *                   minNames?: 最低人数（既定5） }], groupOf?, extraRooms?, existingGroupUpdates? }
 *  groupOf / extraRooms / existingGroupUpdates はそのまま出力に写す（register が読む）。
 *
 * 【安全装置】
 *  - 名簿のページが公式サイトと同じドメインのときだけ採る（assertOfficialRosterSource と同じ判定）。
 *  - 名前は cleanRosterName（名前の形にならないものは捨てる）。準備中の画像は写真にしない（名前だけ）。
 *  - 同じ名前が2回出たら後のほうを捨てる（一覧と「本日の出勤」の両方に出る店がある）。
 *  - 人数が minNames 未満なら「取れていない」として書く（register は名簿の無い店があると止まる）。
 */
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { rootDomainOf } from '../lib/sourceProvenance.mjs';
import { cleanRosterName, detectSitePrefix, selfTestRosterNameClean } from '../lib/rosterNameClean.mjs';

const args = process.argv.slice(2);
for (const a of args) if (!/^--(config|only)=.+$/.test(a)) { console.error(`❌ 知らない引数です: ${a}`); process.exit(1); }
const CONFIG = args.find((a) => a.startsWith('--config='))?.slice(9);
if (!CONFIG) { console.error('使い方: --config=<config.json> [--only=key,key]'); process.exit(1); }
const ONLY = new Set((args.find((a) => a.startsWith('--only='))?.slice(7) || '').split(',').filter(Boolean));
{ const p = selfTestRosterNameClean(); if (p.length) { console.error('❌ 名前の整え方が壊れています:', p); process.exit(1); } }

const cfg = JSON.parse(fs.readFileSync(CONFIG, 'utf-8'));
const OUT = path.join(path.dirname(CONFIG), 'rosters.json');
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf-8')) : null;

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const PATHS = ['/cast/', '/cast', '/therapist/', '/therapist', '/therapists/', '/staff/', '/staff', '/staff.html', '/staff.php', '/girl/', '/girl', '/girls/', '/gals/', '/lady/', '/cast.html', '/therapist.html', '/cast.php', '/therapist.php', '/model/', '/profile/', '/member/', '/model.html', '/girllist', '/itemList.html', ''];
const PLACEHOLDER = /(no-?image|noimage|now[-_ ]?printing|comingsoon|coming_soon|np\.jpg|spacer|dummy|blank|noimg|nophoto|default)/i;
const NOT_PERSON = /(体験入店|スタッフ|パネルNG|健康管理|出勤予定|募集|求人|ロゴ|logo|banner|バナー|[×＆&]|セット|ペア|割引|キャンペーン|イベント|コース|料金|予約)/i;

const { default: puppeteer } = await import('puppeteer-core');
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-certificate-errors'] });

// 画面を組み立ててから、下まで少しずつスクロールして（20人ずつ続きを読む一覧がある）、リンクごとに 名前の候補・写真・行き先 を拾う
async function readPage(url) {
  const page = await browser.newPage();
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  await page.setUserAgent(UA);
  try {
    const res = await Promise.race([page.goto(url, { waitUntil: 'networkidle2', timeout: 40000 }), new Promise((_, j) => setTimeout(() => j(new Error('時間切れ')), 45000))]);
    if (!res || res.status() >= 400) return { status: res?.status() || 0, finalUrl: page.url(), items: [] };
    for (let k = 0; k < 14; k++) { await page.evaluate(() => window.scrollBy(0, 1800)); await new Promise((r) => setTimeout(r, 300)); }
    const items = await Promise.race([page.evaluate(() => {
      const bg = (el) => { const m = (el.getAttribute('style') || '').match(/url\(['"]?([^'")]+)/) || getComputedStyle(el).backgroundImage.match(/url\(['"]?([^'")]+)/); return m ? m[1] : ''; };
      const imgSrc = (img) => {
        const s = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src') || img.getAttribute('lazy-src') || img.currentSrc || img.getAttribute('src') || '';
        return /spacer|blank|transparent|data:image/.test(s) ? (bg(img) || s) : s;
      };
      const out = [];
      for (const a of document.querySelectorAll('a[href]')) {
        if (!a.href.startsWith(location.origin)) continue;
        const img = a.querySelector('img');
        let src = img ? imgSrc(img) : '';
        if (!src) { const b = [a, ...a.querySelectorAll('*')].map(bg).find(Boolean); src = b || ''; }
        const alt = img?.getAttribute('alt') || '';
        // 画面に並んでいても、スクロールで浮き出る演出の途中（visibility:hidden）だと innerText が空になる（Aimer feel・2026-09-30）。
        // 場所を取っている（幅がある＝display:none ではない）リンクだけ textContent で読む。卒業・休業などの隠れた欄は拾わない。
        const shown = a.getBoundingClientRect().width > 0;
        const txt = (el) => (el ? (el.innerText || (shown ? el.textContent : '') || '') : '');
        let head = txt(a.querySelector('h2,h3,h4,h5,[class*=name],[class*=Name]'));
        // 名前がリンクの外（写真のリンクの隣の欄）にある一覧（First Class Platinum・2026-09-30）。
        // 親をたどって、ほかの人のリンクを含まない範囲にある名前の欄だけ使う。
        // 数えるのは同じサイトへのリンクだけ（カードの中の X・Instagram のリンクは数えない＝OMS大垣）。
        // 写真もリンクの外にある一覧（空のリンクをカードに重ねる作り＝OMS大垣）は、同じ範囲の写真を使う。
        if ((!head || !src) && shown) {
          for (let p = a.parentElement, k = 0; p && k < 4; p = p.parentElement, k += 1) {
            if (new Set([...p.querySelectorAll('a[href]')].map((x) => x.href).filter((h) => h.startsWith(location.origin))).size > 2) break;
            const n = p.querySelector('[class*=name],[class*=Name]');
            if (!n) continue;
            if (!head) head = txt(n);
            if (!src) { const im = p.querySelector('img'); src = im ? imgSrc(im) : ''; }
            break;
          }
        }
        const line = txt(a).trim().split('\n').map((x) => x.trim()).filter(Boolean)[0] || '';
        out.push({ href: a.href, src: src ? new URL(src, location.href).href : '', alt, head: head.trim().split('\n')[0] || '', line });
      }
      return out;
    }), new Promise((_, j) => setTimeout(() => j(new Error('読み取りが返らない')), 30000))]);
    return { status: res.status(), finalUrl: page.url(), title: await page.title(), items };
  } catch (e) { return { status: 0, error: e.message, items: [] }; } finally { await page.close().catch(() => {}); }
}

// 番号そのものが名前の無い引数になっているリンク（「profile.html?12369」＝Mrs.X1）は「?*」にまとめる
const tplOf = (u) => { try { const x = new URL(u); const segs = x.pathname.split('/').filter(Boolean); const t = segs.map((s, i) => (/\d/.test(s) || (i === segs.length - 1 && segs.length > 1) ? '*' : s)); const q = [...new Set([...x.searchParams.keys()].map((k) => (/^\d+$/.test(k) ? '*' : k)))].sort().map((k) => `${k}=*`).join('&'); return `/${t.join('/')}${q ? `?${q}` : ''}`; } catch { return ''; } };
const castIdOf = (href) => { try { const u = new URL(href); return u.searchParams.get('id') || u.searchParams.get('uid') || u.searchParams.get('sid') || u.searchParams.get('gid') || u.searchParams.get('lid') || u.searchParams.get('cast') || u.pathname.split('/').filter(Boolean).pop(); } catch { return null; } };

// 同じ形のリンクの固まりごとに名前を整え、いちばん多く名前が取れた固まりを在籍一覧とする
// stripRe＝その店だけの飾り（「あずさ 極みのミセス」の店名＝名前の後ろ・2026-09-30）を名前から外す
function pickRoster(items, linkRe, stripRe = null) {
  const groups = new Map();
  for (const it of items) {
    if (linkRe && !linkRe.test(it.href)) continue;
    const t = tplOf(it.href);
    if (!t.includes('*')) continue;
    (groups.get(t) || groups.set(t, []).get(t)).push(it);
  }
  let best = null;
  for (const [tpl, list] of groups) {
    const byHref = new Map();
    for (const it of list) { const p = byHref.get(it.href) || { href: it.href, src: '', labels: [] }; if (!p.src && it.src && !PLACEHOLDER.test(it.src)) p.src = it.src; p.labels.push(...[it.alt, it.head, it.line].map((l) => (stripRe && l ? l.replace(stripRe, '').trim() : l))); byHref.set(it.href, p); }
    const raws = [...byHref.values()].map((p) => p.labels.find(Boolean) || '');
    const prefix = detectSitePrefix(raws);
    const people = []; const seen = new Set();
    for (const p of byHref.values()) {
      const name = p.labels.filter(Boolean).map((l) => (NOT_PERSON.test(l.replace(prefix, '')) ? null : cleanRosterName(l, prefix))).find(Boolean);
      if (!name || seen.has(name.replace(/ /g, ''))) continue;
      seen.add(name.replace(/ /g, ''));
      people.push({ name, castId: castIdOf(p.href), imgUrl: p.src || null, profileUrl: p.href });
    }
    if (!best || people.length > best.people.length) best = { tpl, prefix, people };
  }
  return best;
}

const results = [];
for (const s of cfg.shops) {
  if (ONLY.size && !ONLY.has(s.key)) { const old = prev?.shops.find((x) => x.key === s.key); if (old) results.push(old); continue; }
  const base = new URL(s.website_url).origin;
  // 在籍一覧が無く、毎日の出勤のお知らせにしか名前が出ない店（AROMA CLINIC 四日市＝「石井 花 (26) 10：00～14：00」・2026-09-29）。
  // 指定したページの文字から名前だけ集める（写真は付けない＝誰の写真か分からない）。THE THERAPIST CLUB（9/28）と同じ扱い。
  if (s.textPages) {
    const re = new RegExp(s.textRe, 'g'); const names = new Map();
    for (const u of s.textPages) {
      if (rootDomainOf(u) !== rootDomainOf(s.website_url)) { console.error(`❌ ${s.key}: 公式の外のページ ${u}`); process.exit(1); }
      const html = await (await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) })).text();
      const text = cheerio.load(html)(s.textSel || 'body').text().replace(/\s+/g, ' ');
      for (const m of text.matchAll(re)) { const n = cleanRosterName(m[1]); if (n && !names.has(n.replace(/ /g, ''))) names.set(n.replace(/ /g, ''), n); }
    }
    const people = [...names.values()].map((name) => ({ name, castId: null, imgUrl: null }));
    const ok = people.length >= (s.minNames ?? 5);
    const shop = { id: s.id, name: s.name, website_url: s.website_url, prefecture: s.prefecture, city: s.city, area: s.area };
    results.push({ key: s.key, shop, rosterUrl: s.textPages[0], pageTitle: null, linkShape: 'text', prefix: '', therapists: ok ? people : [], error: ok ? undefined : `名簿が取れない（${people.length}人）` });
    console.log(`${ok ? '✅' : '❌'} ${s.key.padEnd(26)} ${String(people.length).padStart(3)}人（写真  0） 出勤のお知らせ ${s.textPages.length}ページ  例: ${people.slice(0, 8).map((p) => p.name).join('・')}`);
    continue;
  }
  const lists = s.list ? [].concat(s.list) : PATHS.map((p) => base + p);
  const linkRe = s.link ? new RegExp(s.link) : null;
  const stripRe = s.strip ? new RegExp(s.strip) : null;
  let chosen = null;
  for (const url of lists) {
    const r = await readPage(url);
    if (!r.items.length) continue;
    if (rootDomainOf(r.finalUrl) !== rootDomainOf(s.website_url)) continue;   // 公式の外へ飛んだページは使わない
    const best = pickRoster(r.items, linkRe, stripRe);
    if (best && (!chosen || best.people.length > chosen.people.length)) chosen = { ...best, url: r.finalUrl, title: r.title };
    if (s.list && chosen) continue;          // 一覧を指定したときは全部読んで合わせる（ページ送り）
    if (chosen && chosen.people.length >= 8) break;
  }
  if (s.list && [].concat(s.list).length > 1 && chosen) {
    // 複数ページを指定したときは、各ページの一覧を足し合わせる
    const all = new Map();
    for (const url of [].concat(s.list)) { const r = await readPage(url); const b = pickRoster(r.items, linkRe, stripRe); for (const p of b?.people || []) if (!all.has(p.name.replace(/ /g, ''))) all.set(p.name.replace(/ /g, ''), p); }
    chosen.people = [...all.values()];
  }
  const min = s.minNames ?? 5;
  const ok = chosen && chosen.people.length >= min;
  const shop = { id: s.id, name: s.name, website_url: s.website_url, prefecture: s.prefecture, city: s.city, area: s.area };
  if (s.address) shop.address = s.address;
  results.push({ key: s.key, shop, rosterUrl: chosen?.url || null, pageTitle: chosen?.title || null, linkShape: chosen?.tpl || null, prefix: chosen?.prefix || '',
    therapists: ok ? chosen.people.map(({ name, castId, imgUrl }) => ({ name, castId, imgUrl })) : [], error: ok ? undefined : `名簿が取れない（${chosen?.people.length || 0}人）` });
  const n = chosen?.people.length || 0; const img = chosen?.people.filter((p) => p.imgUrl).length || 0;
  console.log(`${ok ? '✅' : '❌'} ${s.key.padEnd(26)} ${String(n).padStart(3)}人（写真${String(img).padStart(3)}） ${chosen?.url || '-'}  ${chosen?.tpl || ''}  例: ${(chosen?.people || []).slice(0, 6).map((p) => p.name).join('・')}`);
}
await browser.close();
const out = { scrapedAt: new Date().toISOString(), label: cfg.label, groupOf: cfg.groupOf || {}, extraRooms: cfg.extraRooms || [], existingGroupUpdates: cfg.existingGroupUpdates || [], shops: results };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`\n→ ${OUT}（取れた ${results.filter((r) => !r.error).length}/${results.length} 店）`);
