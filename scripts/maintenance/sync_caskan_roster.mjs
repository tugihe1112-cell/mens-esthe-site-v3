/**
 * sync_caskan_roster.mjs — 公式サイトが caskan の在籍一覧（/therapist）の店で、DB の名簿を公式に揃える
 *
 *   node scripts/maintenance/sync_caskan_roster.mjs --shop=<shop_id> --list=<在籍一覧のURL>            （下見）
 *   node scripts/maintenance/sync_caskan_roster.mjs --shop=<shop_id> --list=<URL> --live                （書き込み）
 *   … --allow-mass-depart   退店扱いが在籍の60%を超えても書く（オーナーが「公式に揃えて」と決めた店だけ）
 *
 * 【なぜ（2026-09-27）】 aroma-giraffe・spa-d は公式の一覧を最後まで読めているのに、DB の名簿が3〜5月の取り込みのままで
 *  公式にいない人が DB の在籍の6〜7割（79人・53人）いた。reconcile_brand_rosters.mjs は「退店扱い60%超は何もしない」ので
 *  止まっていた。okabayashi「公式に揃えて」。KIWAMI TOKYO も公式サイトが移って名簿が旧サイトのまま（okabayashi「はい」）。
 *  3店とも公式は caskan（一覧に名前・写真・人物ページのリンクがそのまま入っている）なので1つの道具にした。
 *
 * 【やること】 公式の一覧（`.therapist-datas-each`）から名前（cleanRosterName で整える＝「七瀬 るな(NEW)」→「七瀬 るな」）・写真・人物IDを読み、
 *  DB の同じ店の行と名前で突き合わせる（空白・全角半角・括弧の中を無視）。
 *  いる人＝在籍確認（退店扱いなら戻す・写真が無ければ付ける）／いない人＝追加（写真は店ごとのキーでR2へ）／DBにしかいない人＝退店扱い（削除しない）。
 *
 * 【caskan 以外の一覧（2026-09-27）】 `--link=<人物ページのリンクの正規表現（番号を()で囲む）>` を付けると、そのリンクの中の画像の説明文（無ければリンクの文字）を名前にする。
 *  例: MADAME聖子 `--list=https://madame-seiko.com/girl --link='profile\?lid=(\d+)'`（説明文「あんり　9/24入店」→「あんり」）。
 *
 * 【--strip=<正規表現>（2026-09-27）】 そのサイトだけの飾り（「れあ 先生」の「 先生」、「ーひとみ」の頭の「ー」など）を、名前を整える前に外す。
 * 【文字だけで並ぶ一覧（2026-09-27・博多人妻）】 `--render --click=もっと見る --text=<名前を()で囲んだ正規表現>` で、「もっと見る」を押し切ってから
 *  画面の文字から名前を拾う（人物リンクも写真の説明文も無いサイト）。写真は取れないので追加する人は名前だけ。
 *  `--db-strip=<正規表現>` は照合のときだけ DB の名前から外す文字（「近藤夫人_久留米」の「_久留米」）。
 * 【写真の説明文だけに名前が並ぶ一覧（2026-09-27・CAMERON・Aroma Fairy）】 `--img-alts --exclude=<札の正規表現>` で、ページの画像の説明文から名前を拾う
 *  （「SSクラス」「Twitter有り」のような札・店名の画像は --exclude と名前の整え方で外す）。写真はその画像。
 * 【--render（2026-09-27）】 後から画面を組み立てるサイトは、手元の Chrome で組み立ててから（下までスクロールして）読む。
 * 【名前がリンクの外にあるカード（2026-09-28・サウダージ東京・MITSUBACHI）】 `--card=<1人分の枠のCSS> --name-sel=<枠の中の名前のCSS>` で、
 *  枠ごとに名前（「なごみ(28)」）・写真（img か、リンクの背景画像 background-image）・人物ページのリンク（--link があればそれに合うもの）を読む。
 *  「ご新規様イベント」のような人でない枠は名前の整え方と --exclude で外す。
 * 【--no-add（2026-09-28）】 同じブランドの2つ目以降のルームでは、公式にだけいる人を足さない（在籍確認と退店だけ）。
 *  ブランドページはルームの名簿をまとめて1つに出す（D-014）ので、新人は1つのルームに足せば出る＝同じ人をルームの数だけ足さない。
 *  ブランドのルームが2つ以上ある店にしか使えない。
 * 【--profile-name=<CSS>（2026-09-28・Moana 溝の口）】 一覧に名前が無く写真と人物ページのリンクだけが並ぶとき、--link に合う人物ページを1つずつ開いて
 *  そのCSS（例 h1）の文字を名前にする。写真は一覧の画像。
 *
 * 【安全装置】 知らない引数は止める。公式が5人未満なら中止。退店扱いが在籍の60%超は --allow-mass-depart が無ければ中止。
 *  書く前に今の行をJSONへ保存。書いた後に読み直して公式と照合。写真が準備中画像（comingsoon など）なら付けない。
 */
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { uploadImage } from '../lib/r2Upload.mjs';
import { scopedImageKey, assertOfficialRosterSource } from '../lib/sourceProvenance.mjs';
import { cleanRosterName, selfTestRosterNameClean } from '../lib/rosterNameClean.mjs';
import { loadReviewedKeys, splitDeparting, applyDeparture, selfTestDepartRows } from '../lib/departRows.mjs';

const args = process.argv.slice(2);
for (const a of args) if (!/^(--shop=\S+|--list=https?:\/\/\S+|--link=.+|--strip=.+|--text=.+|--click=.+|--tabs=.+|--db-strip=.+|--img-alts|--exclude=.+|--card=.+|--name-sel=.+|--no-add|--confirm-only|--profile-name=.+|--live|--allow-mass-depart|--render)$/.test(a)) { console.error(`❌ 知らない引数です: ${a}`); process.exit(1); }
const SHOP_ID = args.find((a) => a.startsWith('--shop='))?.slice(7);
const LIST = args.find((a) => a.startsWith('--list='))?.slice(7);
const LIVE = args.includes('--live');
const MASS = args.includes('--allow-mass-depart');
const LINK = args.find((a) => a.startsWith('--link='))?.slice(7);
const RENDER = args.includes('--render');
const STRIP = args.find((a) => a.startsWith('--strip='))?.slice(8);
const STRIP_RE = STRIP ? new RegExp(STRIP, 'g') : null;
const TEXT = args.find((a) => a.startsWith('--text='))?.slice(7);
const CLICK = args.find((a) => a.startsWith('--click='))?.slice(8);
const DB_STRIP = args.find((a) => a.startsWith('--db-strip='))?.slice(11);
// 店ごとの切り替え（博多店／久留米店）がある一覧は、切り替えを1つずつ押して全部読む。押さないと最初の店しか出ない＝残りの店の人を「公式にいない」と消してしまう（2026-09-27 博多人妻で実際に起きかけた）
const IMG_ALTS = args.includes('--img-alts');
const EXCLUDE = args.find((a) => a.startsWith('--exclude='))?.slice(10);
const EXCLUDE_RE = EXCLUDE ? new RegExp(EXCLUDE) : null;
const TABS = args.find((a) => a.startsWith('--tabs='))?.slice(7).split(',').filter(Boolean) || [];
const CARD = args.find((a) => a.startsWith('--card='))?.slice(7);
const NAME_SEL = args.find((a) => a.startsWith('--name-sel='))?.slice(11);
const NO_ADD = args.includes('--no-add');
// 公式が「1週間の出勤予定」しか出していない（在籍一覧が無い）サイト＝載っていない人が辞めたとは言えない。載っている人の在籍確認だけにする（みやび 伊勢崎・2026-09-28）
const CONFIRM_ONLY = args.includes('--confirm-only');
const PROFILE_NAME = args.find((a) => a.startsWith('--profile-name='))?.slice(15);
if (PROFILE_NAME && !args.some((a) => a.startsWith('--link='))) { console.error('❌ --profile-name は --link と一緒に使う'); process.exit(1); }
if (NAME_SEL && !CARD) { console.error('❌ --name-sel は --card と一緒に使う'); process.exit(1); }
if ((TEXT || CLICK) && !RENDER) { console.error('❌ --text / --click は --render と一緒に使う'); process.exit(1); }
const LINK_RE = LINK ? new RegExp(LINK) : null;
if (!SHOP_ID || !LIST) { console.error('使い方: --shop=<shop_id> --list=<在籍一覧のURL> [--live] [--allow-mass-depart]'); process.exit(1); }
selfTestRosterNameClean();
selfTestDepartRows();

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } });
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const key = (s) => String(s || '').normalize('NFKC').replace(DB_STRIP ? new RegExp(DB_STRIP, 'g') : /$^/, '').replace(/[（(【\[].*?[）)】\]]/g, '').replace(/[\s　・]/g, '').toLowerCase();
// 1文字の名前（泉・渚・蛍★ほたる・蒼【あおい】）。cleanRosterName は拾い物の雑音を避けるため2文字以上しか通さないが、
// 人物ページへのリンクに付いた名前なら1文字でも本物（ミセス美オーラ・倉敷Roman で実際に捨てていた＝2026-09-27）。
// 1文字の名前を捨てると、DB にいるその人が「公式にいない」と判定されて消えてしまう。
// 名前に付いた絵文字・向きの制御文字・飾りの記号（「しずく❄」「さや🐼ྀི」＝FORTY FIVE・2026-09-28）は外してから整える。
// 付いたままだと名前の形にならず捨てられ、DB にいるその人が「公式にいない」と判定されて消えてしまう。
const DECOR = /[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Cf}\p{Variation_Selector}\p{Script=Tibetan}\p{Regional_Indicator}]/gu;
const nameOf = (raw00) => {
  // そのサイトの飾り（--strip）を先に外す（WHITE ROSE の「可愛さ満点🌹ここ」は 🌹 までを外す＝絵文字を先に消すと区切りが無くなる）
  const raw1 = STRIP_RE ? String(raw00 || '').normalize('NFKC').replace(STRIP_RE, '').trim() : String(raw00 || '');
  // ★☆♡♥♦ は名前と読み・売り文句の区切りなので残す（「蛍★ほたる」→「蛍」。消すと「蛍ほたる」になる）
  const raw = raw1.replace(DECOR, (c) => (/[★☆♡♥♦]/.test(c) ? c : '')).trim();
  const c = cleanRosterName(raw);
  if (c) return c;
  const t = String(raw || '').normalize('NFKC').replace(/[（(【\[].*?[）)】\]]/g, '').split(/[★☆♡♥〜~\s　]/u)[0].trim();
  return /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]$/u.test(t) ? t : null;
};

// 画像の場所。<img src="spacer300x450.png" style="background-image:url(/images/ml_11_1_10470.jpg)"> のように
// 透明の画像を置いて写真を背景に入れるサイトがある（Everything 目黒・2026-09-28）。そのときは背景の方を写真にする。
const imgSrcOf = (img) => {
  const src = img.attr('data-src') || img.attr('data-original') || img.attr('data-lazy-src') || img.attr('lazy-src') || img.attr('src') || '';
  if (src && !/spacer|blank|transparent/i.test(src)) return src;
  return (img.attr('style') || '').match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/)?.[1] || src;
};

// ── 店 ────────────────────────────────────────
const { data: shop, error: se } = await supabase.from('shops').select('id,name,website_url').eq('id', SHOP_ID).maybeSingle();
if (se) { console.error('❌ DBを読めません', se.message); process.exit(1); }
if (!shop) { console.error(`❌ 店がありません: ${SHOP_ID}`); process.exit(1); }
assertOfficialRosterSource({ officialWebsiteUrl: shop.website_url, rosterUrl: LIST });

// ── 公式の在籍一覧 ─────────────────────────────
let listHtml;
if (RENDER) {
  const puppeteer = (await import('puppeteer-core')).default;
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  try {
    const page = await browser.newPage();
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    await page.setUserAgent(UA);
    const r = await page.goto(LIST, { waitUntil: 'networkidle2', timeout: 60000 });
    if (!r || r.status() >= 400) { console.error(`❌ 公式の一覧を開けません: ${r?.status()}`); process.exit(1); }
    for (let i = 0; i < 20; i++) { await page.evaluate(() => window.scrollBy(0, 2500)); await new Promise((x) => setTimeout(x, 300)); }
    const clickText = (label) => page.evaluate((l) => {
      const el = [...document.querySelectorAll('button,a,li,div,span')].find((e) => (e.innerText || '').trim() === l && e.offsetParent !== null);
      if (!el) return false; el.click(); return true;
    }, label);
    const loadMore = async () => {
      if (!CLICK) return;
      for (let n = 0; n < 60; n++) {
        if (!(await clickText(CLICK))) break;
        await new Promise((x) => setTimeout(x, 1200));
        await page.evaluate(() => window.scrollBy(0, 5000));
      }
    };
    const texts = []; const htmls = [];
    for (const tab of TABS.length ? TABS : [null]) {
      if (tab) {
        if (!(await clickText(tab))) { console.error(`❌ 切り替え「${tab}」が見つからない`); process.exit(1); }
        await new Promise((x) => setTimeout(x, 2000));
      }
      await loadMore();
      texts.push(await page.evaluate(() => document.body.innerText));
      htmls.push(await page.content());
    }
    listHtml = htmls.join('\n');
    if (TEXT) globalThis.__listText = texts.join('\n');
  } finally { await browser.close(); }
} else {
  const res = await fetch(LIST, { headers: { 'User-Agent': UA } });
  if (!res.ok) { console.error(`❌ 公式の一覧を開けません: ${res.status}`); process.exit(1); }
  // 文字コードを見分けて読む（2026-09-27）: ミセス美オーラ浜松は Shift_JIS で、UTF-8 として読んだ昔の取り込みの名前が DB で文字化けしていた
  const buf = Buffer.from(await res.arrayBuffer());
  const head = buf.subarray(0, 4000).toString('latin1');
  const cs = ((res.headers.get('content-type') || '').match(/charset=([\w-]+)/i)?.[1] || head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] || 'utf-8').toLowerCase();
  const enc = /shift[_-]?jis|sjis|x-sjis|windows-31j|cp932/.test(cs) ? 'shift_jis' : /euc-?jp/.test(cs) ? 'euc-jp' : 'utf-8';
  listHtml = new TextDecoder(enc).decode(buf);
  if (enc !== 'utf-8') console.log(`  文字コード: ${enc}`);
}
const $ = cheerio.load(listHtml);
const official = []; const seen = new Set(); const rejected = [];
const photoOnly = new Map(); // 名前の無いリンクの写真（id → 写真）
if (IMG_ALTS) {
  $('img').each((_, el) => {
    const alt = ($(el).attr('alt') || '').trim();
    if (!alt || (EXCLUDE_RE && EXCLUDE_RE.test(alt))) return;
    const name = nameOf(alt);
    if (!name) { rejected.push(alt); return; }
    if (seen.has(key(name))) return;
    seen.add(key(name));
    const src = imgSrcOf($(el));
    const imgUrl = src && !/comingsoon|noimage|now[-_ ]?printing|no_image|spacer/i.test(src) ? new URL(src, LIST).href : null;
    official.push({ castId: (src.match(/(\d{2,})/g) || []).pop() || `i${official.length + 1}`, name, imgUrl, profileUrl: LIST });
  });
} else if (TEXT) {
  const re = new RegExp(TEXT, 'g');
  for (const m of String(globalThis.__listText || '').matchAll(re)) {
    const raw = m[1] || m[0];
    const name = nameOf(raw);
    if (!name) { rejected.push(raw); continue; }
    if (seen.has(key(name))) continue;
    seen.add(key(name));
    official.push({ castId: `t${official.length + 1}`, name, imgUrl: null, profileUrl: LIST });
  }
} else if (CARD) {
  const BAD_IMG = /(new|icon|badge|today|syukkin|shukkin|label|mark|sns|spacer|comingsoon|noimage|now[-_ ]?printing|no_image)/i;
  $(CARD).each((i, el) => {
    const c = $(el);
    // 枠そのものがリンク（<a>）のことがある（ARROW京都）＝中だけでなく枠自身も見る
    const a = c.find('a[href]').addBack('a[href]').toArray().map((x) => $(x)).find((x) => !LINK_RE || LINK_RE.test(x.attr('href') || ''));
    const href = a?.attr('href') || '';
    const raw = (NAME_SEL ? c.find(NAME_SEL).first().text() : c.find('img').toArray().map((x) => $(x).attr('alt')).find((t) => nameOf(t)) || '').replace(/\s+/g, ' ').trim();
    if (!raw || (EXCLUDE_RE && EXCLUDE_RE.test(raw))) return;
    const castId = (LINK_RE ? href.match(LINK_RE)?.[1] : null) || href || `c${i}`;
    if (seen.has(castId)) return;
    seen.add(castId);
    const name = nameOf(raw);
    if (!name) { rejected.push(raw); return; }
    // 同じ人が「おすすめ」と一覧の2か所に別のリンクで出るサイトがある（ARROW京都・2026-09-28）＝同じ名前は1人として数える
    if (official.some((o) => key(o.name) === key(name))) return;
    const imgSrc = c.find('img').toArray().map((x) => imgSrcOf($(x))).find((s) => s && !BAD_IMG.test(s));
    const bg = c.find('[style*="background"]').toArray().map((x) => ($(x).attr('style') || '').match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/)?.[1]).find((s) => s && !BAD_IMG.test(s));
    const src = imgSrc || bg || '';
    official.push({ castId, name, imgUrl: src ? new URL(src, LIST).href : null, profileUrl: href ? new URL(href, LIST).href : LIST });
  });
} else if (LINK_RE && PROFILE_NAME) {
  // 一覧に名前が無く、写真と人物ページのリンクだけが並ぶサイト（Moana 溝の口＝URL は /therapist/mako・2026-09-28）。人物ページを1つずつ開いて名前を読む
  const items = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const castId = href.match(LINK_RE)?.[1];
    if (!castId || seen.has(castId)) return;
    seen.add(castId);
    const src = $(el).find('img').toArray().map((x) => imgSrcOf($(x))).find((s) => s && !/(new|icon|badge|comingsoon|noimage|now[-_ ]?printing|no_image|spacer)/i.test(s)) || '';
    items.push({ castId, href: new URL(href, LIST).href, src });
  });
  for (const it of items) {
    let raw = '';
    try { raw = cheerio.load(await (await fetch(it.href, { headers: { 'User-Agent': UA } })).text())(PROFILE_NAME).first().text().replace(/\s+/g, ' ').trim(); } catch (e) { rejected.push(`${it.href}（${e.message.slice(0, 30)}）`); continue; }
    if (EXCLUDE_RE && EXCLUDE_RE.test(raw)) continue;
    const name = nameOf(raw);
    if (!name) { rejected.push(raw || it.href); continue; }
    official.push({ castId: it.castId, name, imgUrl: it.src ? new URL(it.src, LIST).href : null, profileUrl: it.href });
    await new Promise((x) => setTimeout(x, 250));
  }
} else if (LINK_RE) $('a[href]').each((_, el) => {
  const href = $(el).attr('href') || '';
  const castId = href.match(LINK_RE)?.[1];
  if (!castId) return;
  // リンクの中の画像を全部見る（最初の画像が「本日出勤」「NEW」の札のサイトがある＝luxeaz・riraku-hug・2026-09-27）。
  // 名前として通る説明文を持つ画像を写真に、無ければリンクの文字の行から名前を取る。
  const imgs = $(el).find('img').toArray().map((x) => $(x));
  let img = imgs.find((x) => nameOf(x.attr('alt'))) || null;
  let raw = img ? img.attr('alt') : '';
  if (!img) {
    // リンクの中の文字を部品ごとに見る（HTMLの文字には改行が無いことがある＝MANDOM・2026-09-27）
    const parts = $(el).find('*').addBack().contents().toArray().filter((n) => n.type === 'text').map((n) => $(n).text().trim()).filter(Boolean);
    raw = parts.find((t) => nameOf(t)) || parts.join(' ');
    img = imgs.find((x) => !/(new|icon|badge|today|syukkin|shukkin|label|mark|sns)/i.test(x.attr('src') || '')) || imgs[0] || $('<img>');
  }
  const name = nameOf(raw);
  const src0 = imgSrcOf(img);
  const imgHere = src0 && !/comingsoon|noimage|now[-_ ]?printing|no_image|spacer/i.test(src0) ? new URL(src0, LIST).href : null;
  if (seen.has(castId)) { const o = official.find((x) => x.castId === castId); if (o && !o.imgUrl) o.imgUrl = imgHere; return; }
  // 1人に「写真だけのリンク」と「名前だけのリンク」が別々にあるサイト（ぼくがバナナ・2026-09-28）。
  // 名前の無いリンクで id を取ってしまうと、後の名前のリンクが読まれず、その人が「公式にいない」と判定されて消える。
  // 名前の無いリンクは写真だけ預けておき、名前のあるリンクで1人として数える。
  if (!name) { if (raw) rejected.push(raw); if (imgHere && !photoOnly.has(castId)) photoOnly.set(castId, imgHere); return; }
  seen.add(castId);
  official.push({ castId, name, imgUrl: imgHere || photoOnly.get(castId) || null, profileUrl: new URL(href, LIST).href });
});
else $('.therapist-datas-each').each((_, el) => {
  const a = $(el).find('a.therapist-datas-name').first();
  const castId = (a.attr('href') || '').match(/\/therapist\/(\d+)/)?.[1];
  const raw = a.text().trim() || $(el).find('img.therapist-data-each-tmb').attr('alt') || '';
  if (!castId || seen.has(castId)) return;
  seen.add(castId);
  const name = nameOf(raw);
  if (!name) { rejected.push(raw); return; }
  const src = $(el).find('img.therapist-data-each-tmb').attr('src') || '';
  const imgUrl = src && !/comingsoon|noimage|now[-_ ]?printing|no_image/i.test(src) ? new URL(src, LIST).href : null;
  official.push({ castId, name, imgUrl, profileUrl: new URL(a.attr('href'), LIST).href });
});
console.log(`■ ${shop.name} [${SHOP_ID}]\n公式の一覧: ${official.length}人（写真あり ${official.filter((o) => o.imgUrl).length}）${rejected.length ? `・名前でないので外した ${rejected.length}: ${rejected.join(' / ')}` : ''}`);
if (official.length < 5) { console.error('❌ 公式が5人未満＝読み取りの失敗とみて中止'); process.exit(1); }
const dup = official.map((o) => key(o.name)).filter((k, i, arr) => arr.indexOf(k) !== i);
if (dup.length) { console.error(`❌ 公式に同じ名前が複数: ${[...new Set(dup)].join(',')}`); process.exit(1); }

// ── DB ────────────────────────────────────────
const { data: rows, error: te } = await supabase.from('therapists').select('id,shop_id,name,image_url,is_active,last_seen_at').eq('shop_id', SHOP_ID);
if (te) { console.error('❌ 名簿を読めません', te.message); process.exit(1); }
const byKey = new Map();
for (const r of rows) { const k = key(r.name); (byKey.get(k) || byKey.set(k, []).get(k)).push(r); }
const officialKeys = new Set(official.map((o) => key(o.name)));
const ids = new Set(rows.map((r) => r.id));

const confirm = official.filter((o) => byKey.has(key(o.name)));
const add = NO_ADD || CONFIRM_ONLY ? [] : official.filter((o) => !byKey.has(key(o.name)));
if (NO_ADD) {
  const { data: me } = await supabase.from('shops').select('group_id').eq('id', SHOP_ID).maybeSingle();
  const { count } = me?.group_id ? await supabase.from('shops').select('id', { count: 'exact', head: true }).eq('group_id', me.group_id) : { count: 0 };
  if (!(count >= 2)) { console.error('❌ --no-add はブランドのルームが2つ以上ある店だけ（新人がどのルームにも入らなくなる）'); process.exit(1); }
  console.log(`（--no-add: 公式にだけいる ${official.length - confirm.length}人はこのルームには足さない＝同じブランドの別のルームに足す）`);
}
let depart = CONFIRM_ONLY ? [] : rows.filter((r) => r.is_active !== false && !officialKeys.has(key(r.name)));
const activeNow = rows.filter((r) => r.is_active !== false).length;
// 【念押し（2026-09-28）】 消す前に、公式の一覧ページを手元の Chrome で組み立てて下まで少しずつスクロールし（続きを読み込む一覧がある）、
// 名前が画面の文字か写真の説明文のどこかに出る人は消さない。
// ⚠️ わたしのおうち・WHITE ROSE・超レベチは一覧が20人ずつ後から読み込まれる作りで、普通に読むと最初の20人しか取れず、
//    残りの在籍中の人を「公式にいない」と判定して消していた（2026-09-28 に見つけて戻した）。
//    短い名前が別の人の名前の一部に当たって残ることはあるが、消し過ぎるより残す方を選ぶ。
const keptIds = new Set();
if (depart.length) {
  let page = '';
  try {
    const puppeteer = (await import('puppeteer-core')).default;
    const br = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
    try {
      const pg = await br.newPage(); pg.on('dialog', (d) => d.dismiss().catch(() => {}));
      await pg.setUserAgent(UA);
      await pg.goto(LIST, { waitUntil: 'networkidle2', timeout: 60000 });
      for (let i = 0; i < 40; i++) { await pg.evaluate(() => window.scrollBy(0, 1500)); await new Promise((x) => setTimeout(x, 350)); }
      page = await pg.evaluate(() => document.body.innerText + ' ' + [...document.images].map((i) => i.alt).join(' '));
    } finally { await br.close(); }
  } catch (e) { console.error(`❌ 念押しのために公式の一覧を開けません（${e.message.slice(0, 60)}）＝誰も消さずに中止`); process.exit(1); }
  const pageKey = key(page);
  const kept = depart.filter((r) => key(r.name).length >= 2 && pageKey.includes(key(r.name)));
  if (kept.length) console.log(`名前が公式ページのどこかに出るので消さない ${kept.length}: ${kept.map((r) => r.name).join('・')}`);
  for (const r of kept) keptIds.add(r.id);
  depart = depart.filter((r) => !kept.includes(r));
}
const { data: revs } = await supabase.from('reviews').select('therapist_id').eq('shop_id', SHOP_ID);
const reviewed = new Set((revs || []).map((r) => r.therapist_id));
const clash = add.filter((o) => ids.has(`${SHOP_ID}_${o.name}`));
if (clash.length) { console.error(`❌ 追加する人の id が既存の行と重なる: ${clash.map((o) => o.name).join(',')}`); process.exit(1); }

console.log(`DB: 在籍 ${activeNow}行（全 ${rows.length}行）`);
console.log(`在籍確認 ${confirm.length}（退店扱いから戻す ${confirm.filter((o) => byKey.get(key(o.name)).some((r) => r.is_active === false)).length}）`);
console.log(`追加 ${add.length}（写真あり ${add.filter((o) => o.imgUrl).length}）: ${add.map((o) => o.name).join('・')}`);
console.log(`退店扱い ${depart.length}（在籍の ${activeNow ? Math.round((depart.length / activeNow) * 100) : 0}%）${depart.some((r) => reviewed.has(r.id)) ? ` ・口コミあり: ${depart.filter((r) => reviewed.has(r.id)).map((r) => r.name).join('・')}` : '・口コミあり 0'}`);
const reviewedKeys = await loadReviewedKeys(supabase);
const split = splitDeparting(depart, reviewedKeys);
console.log(`  退店の扱い（D-016）: 消す ${split.remove.length}行 ／ 口コミがあるので消さず退店扱い ${split.mark.length}行`);
if (activeNow && depart.length / activeNow > 0.6 && !MASS) { console.error('❌ 退店扱いが在籍の60%超。オーナーが「公式に揃えて」と決めた店だけ --allow-mass-depart で書く'); process.exit(1); }
if (!LIVE) { console.log('🟢 下見です。書くときは --live'); process.exit(0); }

// ── 書く ──────────────────────────────────────
const now = new Date().toISOString();
fs.mkdirSync('outputs/roster-reconcile', { recursive: true });
const backup = path.join('outputs/roster-reconcile', `caskan-${SHOP_ID}-${now.replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(backup, JSON.stringify({ at: now, list: LIST, shop, therapists: rows }, null, 1));
console.log(`📦 バックアップ ${backup}`);
const img = async (o) => {
  if (!o.imgUrl) return null;
  try { return await uploadImage(o.imgUrl, scopedImageKey({ shopId: SHOP_ID, castId: o.castId, sourceUrl: o.imgUrl }), shop.website_url, 'therapist-images', { officialWebsiteUrl: shop.website_url, sourcePageUrl: o.profileUrl }); }
  catch (e) { console.log(`  写真なしで登録: ${o.name}（${e.message.slice(0, 60)}）`); return null; }
};
for (const o of confirm) {
  for (const r of byKey.get(key(o.name))) {
    const patch = { is_active: true, last_seen_at: now };
    if (!r.image_url) patch.image_url = await img(o);
    const { error } = await supabase.from('therapists').update(patch).eq('id', r.id);
    if (error) { console.error('❌', o.name, error.message); process.exit(1); }
  }
}
const newRows = [];
for (const o of add) newRows.push({ id: `${SHOP_ID}_${o.name}`, shop_id: SHOP_ID, name: o.name, image_url: await img(o), is_active: true, last_seen_at: now });
if (newRows.length) { const { error } = await supabase.from('therapists').insert(newRows); if (error) { console.error('❌ 追加できません', error.message); process.exit(1); } }
if (depart.length) {
  try { await applyDeparture(supabase, depart, reviewedKeys, backup.replace(/\.json$/, '-departed.json')); }
  catch (e) { console.error(`❌ ${e.message}`); process.exit(1); }
}

// ── 読み直し ──────────────────────────────────
const { data: after } = await supabase.from('therapists').select('id,name,image_url,is_active').eq('shop_id', SHOP_ID);
const active = after.filter((r) => r.is_active !== false);
const activeKeys = new Set(active.map((r) => key(r.name)));
const ok = (NO_ADD || CONFIRM_ONLY ? confirm : official).every((o) => activeKeys.has(key(o.name))) && (CONFIRM_ONLY || active.every((r) => officialKeys.has(key(r.name)) || keptIds.has(r.id)));
console.log(`読み直し: 在籍 ${active.length}行（公式 ${official.length}人）・写真あり ${active.filter((r) => r.image_url).length}・退店扱いで残っている行 ${after.length - active.length}（今回消した ${split.remove.length}）`);
console.log(ok ? '✅ 公式と一致' : '❌ 公式と一致しません');
if (!ok) process.exit(1);
