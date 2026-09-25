/**
 * brand_roster_audit.mjs — ブランドの公式名簿を読んで、DB の在籍者と照合する（読むだけ・DBに書かない）
 *
 *   node scripts/maintenance/brand_roster_audit.mjs [--top=100] [--days=120] [--domain=example.com] [--render]
 *
 * 出力: outputs/roster-audit/audit-<日付>.json（照合ツール reconcile_brand_rosters.mjs が読む）
 *
 * 【なぜ（2026-09-25）】
 *  在籍者の最終確認日は 3月4,713／4月17,416／5月14,961／6月19,097人で、ほぼ全員が取り込んだまま一度も確認されていない。
 *  放っておくと名簿の監視（180日超 5%）は10〜12月に赤が広がり続け、画面でも辞めた人が在籍中として出続ける。
 *  D-014（名簿はブランドで1つ）に沿って、**公式サイト（ドメイン）単位**で1回読めば全ルームの行を照合できる。
 *
 * 【読み方】店ごとに作りが違うので、決め打ちせず広く拾ってから DB と突き合わせる。
 *  1. トップページから在籍一覧らしいページを探す（cast/therapist/girl/staff/lady/gals/list など）。ページ送りも最大10ページ。
 *  2. 人物ページへのリンクの中の画像の alt・見出し・文字、「〇〇さんの写真」などから名前の候補を集める。
 *  3. 候補を整える（店名・「セラピスト」・年齢・身長・新人などの札を外す）。
 *  4. DB の名前（同じ形に整えたもの）と突き合わせる。
 *
 * 【どこまで信じるか】
 *  名簿を取りこぼすと、在籍している人を退店扱いにしてしまう。そこで次の両方を満たすサイトだけを「使える」とする:
 *   ・DB の在籍者のうち公式で見つかった人が 40% 以上、かつ 5人以上
 *   ・公式で読めた人数が DB の在籍者数の 30% 以上
 *  満たさないサイトは「要確認」として一覧に残す（自動では何もしない）。
 *
 * 【--render（2026-09-25 追加）】 1回目で「要確認」「読めない」になったサイトだけ、手元の Chrome を裏で動かし
 *  画面を組み立て終わった状態で読み直す（後から画面を組み立てるサイト＝Aroma Lunabelle・小悪魔スパ など）。
 *  照合は名前をタグから拾わず、**DB の名前が公式ページの文字の中に出てくるか**で見る（書き方の違いに左右されにくい）。
 *  1文字の名前は他の文字に紛れて判定できないので、確認にも退店にも入れない。読んだ文字は texts/<domain>.txt に残し、
 *  reconcile_brand_rosters.mjs の念押し確認にも使う。
 */
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { rootDomainOf } from '../lib/sourceProvenance.mjs';

const args = process.argv.slice(2);
for (const a of args) if (!/^(--top=\d+|--days=\d+|--domain=[\w.-]+|--render)$/.test(a)) { console.error(`❌ 知らない引数です: ${a}`); process.exit(1); }
const TOP = Number(args.find((a) => a.startsWith('--top='))?.slice(6) || 100);
const DAYS = Number(args.find((a) => a.startsWith('--days='))?.slice(7) || 120);
const ONLY = args.find((a) => a.startsWith('--domain='))?.slice(9);
const RENDER = args.includes('--render');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } });
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

// ── 名前をそろえる（照合用）──────────────────────────────
export function nameKey(raw) {
  let s = String(raw || '').normalize('NFKC');
  s = s.replace(/さんの(写真|画像|プロフィール)$/, '').replace(/(セラピスト|セラピ)$/, '');
  s = s.replace(/[（(【\[〔～~〜].*?[）)】\]〕～~〜]/g, '');        // 読み仮名・札
  s = s.replace(/\d{2}\s*(歳|才)/g, '').replace(/T\.?\s*\d{3}.*$/i, '');
  s = s.replace(/^(新人|NEW|体験|本日出勤|出勤中)[\s:：・]*/i, '');
  s = s.replace(/[\s　・,，、。.!！?？♡♥★☆◆◇♦︎※]/g, '');
  // 2枚目の写真・SNS の alt（「白石るな02」「常盤るかbluesky」）の混ざりものを外す（AROMA more で実際にあった）
  s = s.replace(/(bluesky|twitter|instagram|tiktok|x|sns)$/i, '').replace(/0?\d$/, '');
  return s.toLowerCase();
}
const NOISE = /^(スタッフ|パネルNG|健康管理|体験入店\d*|シークレット|新人|本日出勤|お知らせ|求人|募集|ロゴ|logo|banner|バナー|トップ|top|home|ホーム|セラピスト|一覧|もっと見る|詳細|予約|line|twitter|x|instagram|noimage|nowprinting|comingsoon)$/i;
const plausible = (k) => k.length >= 1 && k.length <= 12 && !NOISE.test(k) && /[ぁ-んァ-ヶー一-龯々a-z]/.test(k) && !/[0-9]{3,}|円|分|http|www|\.(jpg|png)/.test(k);

async function getHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ja', Accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const head = buf.slice(0, 3000).toString('latin1');
  const cs = (res.headers.get('content-type') || '').match(/charset=([\w-]+)/i)?.[1] || head.match(/charset=["']?([\w-]+)/i)?.[1] || 'utf-8';
  const enc = /shift_?jis|sjis|x-sjis/i.test(cs) ? 'shift_jis' : /euc-jp/i.test(cs) ? 'euc-jp' : 'utf-8';
  return { html: new TextDecoder(enc).decode(buf), url: res.url };
}

const ROSTER_HINT = /(cast|therapist|girl|girls|gals|staff|lady|ladies|member|list|profile|セラピスト|在籍)/i;
const PROFILE_HINT = /(profile|cast|girl|gals|therapist|staff|lady|detail|uid=|id=|GirlInfo|\/\d{1,6}\/?$)/i;

function candidatesFrom($) {
  const out = new Set();
  const add = (v) => { const k = nameKey(v); if (plausible(k)) out.add(k); };
  $('a').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (!PROFILE_HINT.test(href)) return;
    $(a).find('img').each((__, img) => add($(img).attr('alt')));
    $(a).find('h2,h3,h4,.name,[class*=name]').each((__, h) => add($(h).children().length ? $(h).contents().first().text() : $(h).text()));
  });
  $('img[alt*="さんの写真"], img[alt*="セラピスト"]').each((_, img) => add($(img).attr('alt')));
  $('[class*=name] > span:first-child, .c-list-therapist-LT__name span:first-child, .therapist_name, .itemName').each((_, e) => add($(e).contents().first().text()));
  return out;
}

async function readRoster(website) {
  const top = await getHtml(website);
  const $t = cheerio.load(top.html);
  const origin = new URL(top.url).origin;
  const links = [...new Set($t('a').map((_, a) => $t(a).attr('href')).get().filter(Boolean)
    .map((h) => { try { return new URL(h, top.url).href; } catch { return null; } })
    .filter((h) => h && h.startsWith(origin) && ROSTER_HINT.test(new URL(h).pathname + new URL(h).search) && !/(recruit|blog|diary|news|schedule|system|price|access|review)/i.test(h)))];
  // 人物ページ（個別）より一覧ページを優先: パスが短いものから最大3つ
  const listPages = links.filter((h) => !/(uid=|id=\d|\/\d{2,}\/?$|detail|GirlInfo)/i.test(h)).sort((a, b) => a.length - b.length).slice(0, 3);
  const pages = [top.url, ...listPages];
  const names = new Set();
  const visited = new Set();
  for (const p of pages) {
    let url = p;
    for (let i = 0; i < 10 && url && !visited.has(url); i++) {
      visited.add(url);
      let got;
      try { got = await getHtml(url); } catch { break; }
      const $ = cheerio.load(got.html);
      for (const n of candidatesFrom($)) names.add(n);
      const next = $('a').filter((_, a) => /^(次|next|›|»|>)/i.test($(a).text().trim()) || /[?&/](page|p)[=/]\d+/.test($(a).attr('href') || '')).map((_, a) => $(a).attr('href')).get()
        .map((h) => { try { return new URL(h, got.url).href; } catch { return null; } }).find((h) => h && !visited.has(h) && h.startsWith(origin));
      url = next;
    }
  }
  return { names, pages: [...visited] };
}

// ── DB: 最終確認が古い在籍者をドメインごとに ─────────────────
const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase.from('therapists').select('id,shop_id,name,last_seen_at,is_active').or('is_active.is.null,is_active.eq.true').range(from, from + 999);
  if (error) { console.error('❌ DBを読めません:', error.message); process.exit(1); }
  rows.push(...data);
  if (data.length < 1000) break;
}
const shops = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase.from('shops').select('id,name,website_url,group_id').range(from, from + 999);
  if (error) { console.error('❌ DBを読めません:', error.message); process.exit(1); }
  shops.push(...data);
  if (data.length < 1000) break;
}
const shopById = new Map(shops.map((s) => [s.id, s]));
const cutoff = Date.now() - DAYS * 86400000;
const byDomain = new Map();
for (const r of rows) {
  const s = shopById.get(r.shop_id);
  const d = rootDomainOf(s?.website_url);
  if (!d) continue;
  const g = byDomain.get(d) || { domain: d, website: s.website_url, rows: [], old: 0 };
  g.rows.push(r);
  if (!r.last_seen_at || new Date(r.last_seen_at).getTime() < cutoff) g.old += 1;
  byDomain.set(d, g);
}
let targets = [...byDomain.values()].filter((g) => g.old > 0).sort((a, b) => b.old - a.old);
if (ONLY) targets = targets.filter((g) => g.domain === ONLY);
else targets = targets.slice(0, TOP);

// ── 照合 ─────────────────────────────────────────────
const results = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < targets.length) {
    const g = targets[i++];
    const dbKeys = new Map();
    for (const r of g.rows) { const k = nameKey(r.name); if (k) (dbKeys.get(k) || dbKeys.set(k, []).get(k)).push(r); }
    const res = { domain: g.domain, website: g.website, shops: [...new Set(g.rows.map((r) => r.shop_id))], dbPeople: dbKeys.size, dbRows: g.rows.length, oldRows: g.old };
    try {
      const { names, pages } = await readRoster(g.website);
      const matched = [...dbKeys.keys()].filter((k) => names.has(k));
      const missing = [...dbKeys.keys()].filter((k) => !names.has(k));
      const newNames = [...names].filter((k) => !dbKeys.has(k));
      res.pages = pages;
      res.officialPeople = names.size;
      res.matchedPeople = matched.length;
      res.matchRate = dbKeys.size ? +(matched.length / dbKeys.size).toFixed(2) : 0;
      res.usable = matched.length >= 5 && res.matchRate >= 0.4 && names.size >= dbKeys.size * 0.3;
      res.confirmRows = matched.flatMap((k) => dbKeys.get(k)).map((r) => r.id);
      res.departRows = missing.flatMap((k) => dbKeys.get(k)).map((r) => r.id);
      res.missingPeople = missing;
      res.newPeople = newNames;
    } catch (e) {
      res.error = e.message;
      res.usable = false;
    }
    results.push(res);
    const mark = res.error ? '❌' : res.usable ? '✅' : '⚠️';
    console.log(`${mark} ${g.domain.padEnd(34)} DB ${String(res.dbPeople).padStart(4)}人(${res.shops.length}ルーム) 公式 ${String(res.officialPeople ?? '-').padStart(4)} 一致 ${String(res.matchedPeople ?? '-').padStart(4)} (${res.matchRate ?? '-'})${res.error ? ' ' + res.error : ''}`);
  }
}));

// ── 2回目: 画面を組み立ててから読み、名前が文字に出てくるかで照合（--render）──────────
const flatT = (v) => String(v || '').normalize('NFKC').replace(/[\s\u3000]/g, '').toLowerCase();
const variants = (name) => {
  const a = flatT(name);
  const b = a.replace(/[（(【\[〔～~〜].*?[）)】\]〕～~〜]/g, '').replace(/\d+$/, '');
  return [...new Set([a, b, nameKey(name)])].filter((x) => x.length >= 2);
};
async function renderTexts(browser, website) {
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  const texts = [];
  const visited = [];
  const grab = async (url) => {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    for (let k = 0; k < 6; k++) { await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight)); await new Promise((r) => setTimeout(r, 600)); }
    visited.push(page.url());
    texts.push(await page.evaluate(() => document.body.innerText + '\n' + [...document.images].map((i) => i.alt || '').join('\n')));
  };
  try {
    await grab(website);
    const origin = new URL(page.url()).origin;
    const links = [...new Set(await page.$$eval('a', (as) => as.map((a) => a.href)))]
      .filter((h) => h.startsWith(origin) && ROSTER_HINT.test(h.replace(origin, '')) && !/(recruit|blog|diary|news|schedule|system|price|access|review|uid=|id=\d|\/\d{2,}\/?$|detail|GirlInfo)/i.test(h))
      .sort((x, y) => x.length - y.length).slice(0, 3);
    for (const l of links) { try { await grab(l); } catch { /* 次へ */ } }
  } finally { await page.close(); }
  return { text: texts.join('\n'), pages: visited };
}
if (RENDER) {
  const puppeteer = (await import('puppeteer-core')).default;
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  fs.mkdirSync('outputs/roster-audit/texts', { recursive: true });
  const retry = results.filter((r) => !r.usable && !/HTTP 40[134]/.test(r.error || ''));
  console.log(`\n── 2回目（画面を組み立ててから読む）: ${retry.length}サイト`);
  let j = 0;
  await Promise.all(Array.from({ length: 2 }, async () => {
    while (j < retry.length) {
      const res = retry[j++];
      const g = targets.find((t) => t.domain === res.domain);
      try {
        const { text, pages } = await renderTexts(browser, g.website);
        const T = flatT(text);
        fs.writeFileSync(path.join('outputs/roster-audit/texts', `${res.domain}.txt`), T);
        const people = new Map();
        for (const r of g.rows) { const k = nameKey(r.name); if (k) (people.get(k) || people.set(k, { rows: [], vs: variants(r.name) }).get(k)).rows.push(r); }
        const judged = [...people.entries()].filter(([, v]) => v.vs.length > 0);
        const found = judged.filter(([, v]) => v.vs.some((x) => T.includes(x)));
        const notFound = judged.filter(([, v]) => !v.vs.some((x) => T.includes(x)));
        const rate = judged.length ? +(found.length / judged.length).toFixed(2) : 0;
        Object.assign(res, {
          method: 'text', pages, error: undefined,
          officialPeople: null, matchedPeople: found.length, matchRate: rate,
          usable: found.length >= 5 && rate >= 0.4,
          confirmRows: found.flatMap(([, v]) => v.rows.map((r) => r.id)),
          departRows: notFound.flatMap(([, v]) => v.rows.map((r) => r.id)),
          missingPeople: notFound.map(([k]) => k), newPeople: [],
          unjudgedPeople: people.size - judged.length,
        });
      } catch (e) { res.renderError = e.message; }
      const mark = res.usable ? '✅' : '⚠️';
      console.log(`${mark} ${res.domain.padEnd(34)} DB ${String(res.dbPeople).padStart(4)}人 文字に出る ${String(res.matchedPeople ?? '-').padStart(4)} (${res.matchRate ?? '-'})${res.renderError ? ' ' + res.renderError : ''}`);
    }
  }));
  await browser.close();
}

const usable = results.filter((r) => r.usable);
const sum = (arr, k) => arr.reduce((n, r) => n + (r[k]?.length ?? r[k] ?? 0), 0);
console.log(`\n対象 ${results.length}サイト: 使える ${usable.length}／要確認 ${results.filter((r) => !r.usable && !r.error).length}／読めない ${results.filter((r) => r.error).length}`);
console.log(`使えるサイトで: 在籍確認できる行 ${sum(usable, 'confirmRows')}・公式にいない行 ${sum(usable, 'departRows')}（DBの古い行 ${usable.reduce((n, r) => n + r.oldRows, 0)}）`);
fs.mkdirSync('outputs/roster-audit', { recursive: true });
const out = path.join('outputs/roster-audit', `audit-${new Date().toISOString().slice(0, 10)}${ONLY ? '-' + ONLY : ''}.json`);
fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), days: DAYS, results }, null, 1));
console.log(`→ ${out}`);
