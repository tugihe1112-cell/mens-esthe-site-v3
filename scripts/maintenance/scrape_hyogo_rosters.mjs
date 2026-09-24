/**
 * scrape_hyogo_rosters.mjs — 兵庫の未登録20店の在籍名簿を公式サイトから読む（読むだけ）
 *
 *   node scripts/maintenance/scrape_hyogo_rosters.mjs [--only=<key>]
 *
 * 出力: outputs/hyogo-2026-09-24/rosters.json
 *   { shops: [{ key, shop: {...}, rosterUrl, pageTitle, therapists: [{ name, castId, imgUrl, note }], skipped: [...] }] }
 *
 * 【なぜ2段に分けるか】
 *  取った名簿を目で見てから登録する（register_hyogo_shops.mjs が この JSON を読む）。
 *  DB にも R2 にも書かない。取り直しは何度でもできる。
 *
 * 【対象の決め方（2026-09-24 CLAUDE.md の作業ログ）】
 *  メンズエステマガジンの兵庫3エリア（神戸三宮・姫路・西宮尼崎）で「人気」（ランキング）に載り、
 *  公式URLでも店名でも DB に無かった20店。エリアは公式サイトのタイトルに書かれた地名（県内だけ・先頭が本拠）。
 *  公式に地名が1つしか無い店は mens-mg の所在地表記。県外のルーム（PRINCE 梅田・KNIT 北浜）は入れない（9/22 のルール）。
 */
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { isSuspiciousTherapistName } from '../lib/therapistImageQuality.mjs';
import { ASSET_WORDS } from '../lib/rosterNoiseRules.mjs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const OUT_DIR = 'outputs/hyogo-2026-09-24';

const args = process.argv.slice(2);
for (const a of args) {
  if (!/^--only=/.test(a)) { console.error(`❌ 知らない引数です: ${a}`); process.exit(1); }
}
const ONLY = args.find((a) => a.startsWith('--only='))?.slice(7);

// 名簿の中で人ではないもの（実際に見つけた語）
// 「体験入店2」のように番号が付くこともある（フェアリータッチで実際にあった）。
const NOT_A_PERSON = /^(スタッフ|パネルNG|健康管理|体験入店|シークレット|新人|本日出勤|お知らせ|求人|募集中?)\d*$/;
// 「うさぎ＆もみじ＆あんず」＝複数人のセット枠（KNIT で実際にあった）。1人の名前ではない。
const GROUP_SLOT = /[＆&]/;

const abs = (u, base) => new URL(u, base).href;
const clean = (s) => String(s || '').replace(/[\s　]+/g, ' ').trim();

async function getHtml(url, { sjis = false } = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'ja', Accept: 'text/html' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return new TextDecoder(sjis ? 'shift_jis' : 'utf-8').decode(buf);
}

// ── 店ごとの読み方 ─────────────────────────────────────────
// 返り値: [{ name, castId, imgUrl, note? }]
const wcmsGals = (base) => ($) => $('img[data-original*="/wcms/gals/images/"]').map((_, e) => {
  const src = $(e).attr('data-original');
  return { name: clean($(e).attr('alt')).replace(/セラピスト$/, ''), castId: src.match(/images\/(\d+)\//)?.[1], imgUrl: abs(src, base) };
}).get();

const photosAlt = (base) => ($) => $('img[src*="/photos/"]').map((_, e) => {
  const src = $(e).attr('src');
  return { name: clean($(e).attr('alt')), castId: src.match(/photos\/(\d+)\//)?.[1], imgUrl: abs(src, base).split('?')[0] };
}).get();

const castThumb = (base, nameOf, keep = () => true) => ($) => $('img[src*="upload/cast/thumb_"]').map((_, e) => {
  const src = $(e).attr('src');
  const alt = clean($(e).attr('alt'));
  const id = src.match(/thumb_(\d+)\./)?.[1];
  if (!id || !keep(alt)) return null;
  return { name: nameOf(alt), castId: id, imgUrl: `${new URL(base).origin}/upload/cast/thumb_${id}.jpg`, note: alt };
}).get().filter(Boolean);

// リンク（a.therapist_meta）は空で、写真は同じ枠の中の兄弟要素にある。
const picGirl = (base) => ($) => $('a.therapist_meta[href*="GirlInfo"]').map((_, a) => {
  const id = $(a).attr('href').match(/User_Id\/(\d+)/)?.[1];
  const img = $(a).parent().find('.therapist_img img').first();
  if (!id || !img.length) return null;
  const src = img.attr('src') || '';
  return { name: clean(img.attr('alt')), castId: id, imgUrl: /\/pic\/girl\//.test(src) ? abs(src, base) : null };
}).get().filter(Boolean);

const bgSpacer = (base, nameOf) => ($) => $('img[style*="background-image"]').map((_, e) => {
  const u = ($(e).attr('style') || '').match(/url\(['"]?([^'")]+)/)?.[1];
  const id = u?.match(/ml_11_1_(\d+)/)?.[1];
  if (!u || !id) return null;
  return { name: nameOf($, e), castId: id, imgUrl: abs(u, base) };
}).get().filter(Boolean);

const SHOPS = [
  // ── 神戸三宮 ──
  { key: 'yurikago', shop: { id: 'hyogo_sannomiya_yurikago', name: 'ゆりかご 神戸', website_url: 'https://yurikago-kobe.com/', prefecture: '兵庫県', city: '三宮', area: ['三宮', '尼崎'], address: '兵庫県神戸市中央区旭通5-1-16' },
    rosterUrl: 'https://yurikago-kobe.com/staff.php',
    parse: ($) => $('img[src*="images_staff"]').map((_, e) => ({ name: clean($(e).attr('alt')), castId: $(e).attr('src').match(/images_staff\/(\d+)\//)?.[1], imgUrl: abs($(e).attr('src'), 'https://yurikago-kobe.com/') })).get() },
  { key: 'shironeko', shop: { id: 'hyogo_sannomiya_shironeko', name: '白ねこエステ', website_url: 'https://kobe-refle.com/', prefecture: '兵庫県', city: '三宮', area: '三宮' },
    rosterUrl: 'https://kobe-refle.com/archives/staff',
    parse: ($) => $('#staff_list article').map((_, e) => {
      const href = $(e).find('a').attr('href') || '';
      return { name: clean($(e).find('h2').text()), castId: href.split('/').filter(Boolean).pop(), imgUrl: $(e).find('[data-back]').attr('data-back') || null };
    }).get() },
  { key: 'uchiage', shop: { id: 'hyogo_sannomiya_uchiage_hanabi', name: '打上花火 神戸三宮・姫路ルーム', website_url: 'https://uchiagemenseste.jp/top', prefecture: '兵庫県', city: '三宮', area: ['三宮', '姫路'] },
    rosterUrl: 'https://uchiagemenseste.jp/cast/',
    // 大阪・兵庫・岡山の全ルームが1ページで、人ごとにルーム名が付いている（alt 末尾）。
    // ブランドは梅田ルーム（登録済み）と同じ1つにまとめる（D-014）。このレコードには兵庫の2ルーム
    // （神戸三宮・姫路）の人を入れる。大阪の人は梅田レコード側の名簿（2026-06時点・要照合）にいる。
    parse: castThumb('https://uchiagemenseste.jp/', (alt) => alt.replace(/^打上花火\s*/, '').replace(/\s*(神戸三宮|姫路)\s*$/, ''), (alt) => /(神戸三宮|姫路)\s*$/.test(alt)) },
  // ── 姫路 ──
  { key: 'melty_himeji', shop: { id: 'hyogo_himeji_mrs_melty', name: 'Mrs.melty 姫路 (ミセスメルティー)', website_url: 'https://melty-himeji.com/', prefecture: '兵庫県', city: '姫路', area: '姫路' },
    rosterUrl: 'https://melty-himeji.com/gals/', parse: wcmsGals('https://melty-himeji.com/') },
  { key: 'az', shop: { id: 'hyogo_himeji_az', name: 'AZ (アズ)', website_url: 'https://az-himeji.com/', prefecture: '兵庫県', city: '姫路', area: '姫路' },
    rosterUrl: 'https://az-himeji.com/lady.php',
    parse: ($) => $('img[src*="es-pack.jp/shop/azhimeji/images"]').map((_, e) => ({ name: clean($(e).attr('alt')).replace(/\s*AZ$/, ''), castId: $(e).attr('src').match(/images\/(\d+)\./)?.[1], imgUrl: $(e).attr('src') })).get() },
  { key: 'rosa', shop: { id: 'hyogo_kakogawa_rosa', name: 'ROSA (ロッサ)', website_url: 'http://www.spa-rosa.net/', prefecture: '兵庫県', city: '加古川', area: '加古川' },
    rosterUrl: 'http://www.spa-rosa.net/staff/',
    parse: bgSpacer('http://www.spa-rosa.net/', ($, e) => clean($(e).closest('.item').find('.info a').first().text()).replace(/セラピスト$/, '')) },
  { key: 'itadaki', shop: { id: 'hyogo_himeji_itadaki_spa', name: 'ITADAKI SPA (頂スパ)', website_url: 'https://itadakispa.net/', prefecture: '兵庫県', city: '姫路', area: '姫路' },
    rosterUrl: 'https://itadakispa.net/list/', parse: wcmsGals('https://itadakispa.net/') },
  { key: 'onerose', shop: { id: 'hyogo_himeji_one_rose', name: 'One Rose (ワンローズ)', website_url: 'https://onerose-esthe.net/', prefecture: '兵庫県', city: '姫路', area: '姫路' },
    rosterUrl: 'https://onerose-esthe.net/girl', parse: photosAlt('https://onerose-esthe.net/') },
  { key: 'angel', shop: { id: 'hyogo_himeji_aroma_angel', name: 'Aroma Angel (アロマエンジェル)', website_url: 'https://www.aloma-angel.com/', prefecture: '兵庫県', city: '姫路', area: '姫路' },
    rosterUrl: 'https://www.aloma-angel.com/girlslist.cgi', sjis: true,
    parse: ($) => $('img[src*="data/girls/"]').map((_, e) => {
      const src = $(e).attr('src');
      return { name: clean($(e).attr('alt')), castId: src.match(/girls\/(\d+)\//)?.[1], imgUrl: abs(src, 'https://www.aloma-angel.com/'), note: clean($(e).closest('a').text()) };
    }).get() },
  { key: 'starlight', shop: { id: 'hyogo_himeji_starlight', name: 'STARLIGHT (スターライト)', website_url: 'https://esthe-starlight.net/', prefecture: '兵庫県', city: '姫路', area: ['姫路', '明石', '三宮'] },
    rosterUrl: 'https://esthe-starlight.net/gals/', parse: wcmsGals('https://esthe-starlight.net/') },
  { key: 'beauty', shop: { id: 'hyogo_himeji_mrs_beauty_line', name: 'Mrs Beauty Line (ミセスビューティーライン)', website_url: 'https://mrs-beauty-line.com/', prefecture: '兵庫県', city: '姫路', area: '姫路' },
    rosterUrl: 'https://mrs-beauty-line.com/girl', parse: photosAlt('https://mrs-beauty-line.com/') },
  // ── 西宮・尼崎・芦屋 ──
  { key: 'prince', shop: { id: 'hyogo_amagasaki_prince', name: 'PRINCE (プリンス) 尼崎ルーム', website_url: 'https://www.osaka-prince.com/', prefecture: '兵庫県', city: '尼崎', area: '尼崎' },
    rosterUrl: 'https://www.osaka-prince.com/cast/',
    parse: castThumb('https://www.osaka-prince.com/', (alt) => alt.split(/\s/).pop()) },
  { key: 'larus', shop: { id: 'hyogo_ashiya_larus', name: 'Larus (ラルス)', website_url: 'https://www.larusspa.com/', prefecture: '兵庫県', city: '芦屋', area: ['芦屋', '西宮'] },
    rosterUrl: 'https://www.larusspa.com/staff/',
    parse: bgSpacer('https://www.larusspa.com/', ($, e) => clean($(e).attr('alt')).replace(/さんの写真$/, '')) },
  { key: 'dea', shop: { id: 'hyogo_nishinomiya_dea', name: 'DEA (デーア)', website_url: 'https://dea-private-salon.com/', prefecture: '兵庫県', city: '西宮', area: '西宮', address: '兵庫県西宮市本町12-12' },
    rosterUrl: 'https://dea-private-salon.com/therapist',
    parse: ($) => $('.item').map((_, e) => {
      const href = $(e).find('a').attr('href') || '';
      const name = clean($(e).find('.itemName').text()).replace(/\s*[（(]\d+歳[)）]\s*$/, '');
      return name ? { name, castId: href.match(/therapist\/(\d+)/)?.[1], imgUrl: $(e).find('img').attr('src') || null } : null;
    }).get().filter(Boolean) },
  { key: 'knit', shop: { id: 'hyogo_amagasaki_knit', name: 'KNIT (ニット)', website_url: 'https://knit-esthe.com/', prefecture: '兵庫県', city: '尼崎', area: ['尼崎', '三宮'] },
    rosterUrl: 'https://knit-esthe.com/girllist', parse: picGirl('https://knit-esthe.com/') },
  { key: 'rich', shop: { id: 'hyogo_amagasaki_aroma_rich', name: 'Aroma Rich (アロマリッチ) 尼崎', website_url: 'https://aroma-rich.jp/', prefecture: '兵庫県', city: '尼崎', area: '尼崎' },
    rosterUrl: 'https://aroma-rich.jp/girllist', parse: picGirl('https://aroma-rich.jp/') },
  { key: 'runway', shop: { id: 'hyogo_nishinomiya_kobe_runway', name: 'KoBe Runway (コウベランウェイ)', website_url: 'https://oil-dobaken.com/', prefecture: '兵庫県', city: '西宮', area: '西宮' },
    rosterUrl: 'https://oil-dobaken.com/girl', parse: photosAlt('https://oil-dobaken.com/') },
  { key: 'arespa', shop: { id: 'hyogo_amagasaki_arespa', name: 'ARESPA (アレスパ)', website_url: 'https://shein-esthe.com/', prefecture: '兵庫県', city: '尼崎', area: ['尼崎', '神戸', '西宮'] },
    rosterUrl: 'https://shein-esthe.com/girllist', parse: picGirl('https://shein-esthe.com/') },
  { key: 'fairy', shop: { id: 'hyogo_nishinomiya_fairy_touch', name: 'フェアリータッチ', website_url: 'https://fairy-touch.com/', prefecture: '兵庫県', city: '西宮', area: ['西宮', '明石'] },
    rosterUrl: 'https://fairy-touch.com/staff.html',
    parse: ($) => $('li.c-list-therapist-LT__item').map((_, e) => {
      const href = $(e).find('a').attr('href') || '';
      const src = $(e).find('figure img').first().attr('src');
      const name = clean($(e).find('.c-list-therapist-LT__name span').first().text());
      return name ? { name, castId: href.match(/\?(\d+)/)?.[1], imgUrl: src ? abs(src, 'https://fairy-touch.com/') : null } : null;
    }).get().filter(Boolean) },
  { key: 'seethrough', shop: { id: 'hyogo_amagasaki_seethrough', name: 'シースルー', website_url: 'https://amagasaki-seethrough.com/', prefecture: '兵庫県', city: '尼崎', area: '尼崎' },
    rosterUrl: 'https://amagasaki-seethrough.com/cast/',
    parse: castThumb('https://amagasaki-seethrough.com/', (alt) => alt.replace(/^シースルー\s*/, '').replace(/さん$/, '')) },
];

function tidy(list) {
  const kept = [];
  const skipped = [];
  const seen = new Map();
  for (const t of list) {
    const name = clean(t.name);
    if (!name) { skipped.push({ ...t, reason: '名前なし' }); continue; }
    if (NOT_A_PERSON.test(name) || ASSET_WORDS.test(name) || isSuspiciousTherapistName(name)) { skipped.push({ ...t, name, reason: '人ではない' }); continue; }
    if (GROUP_SLOT.test(name)) { skipped.push({ ...t, name, reason: '複数人のセット枠' }); continue; }
    if (t.imgUrl && /\/np\.jpg|noimage|no_image|now_?printing|comingsoon/i.test(t.imgUrl)) t.imgUrl = null;
    // 同じ人が2回載る（ページ内の重複表示）は1回に。castIdが違う同名は別人なので「2」を付ける。
    const prev = seen.get(name);
    if (prev) {
      if (prev.castId && prev.castId === t.castId) continue;
      let n = 2;
      while (seen.has(`${name}${n}`)) n += 1;
      const renamed = `${name}${n}`;
      seen.set(renamed, t);
      kept.push({ ...t, name: renamed, note: [t.note, `同名の別人（castId ${prev.castId} / ${t.castId}）`].filter(Boolean).join(' / ') });
      continue;
    }
    seen.set(name, t);
    kept.push({ ...t, name });
  }
  return { kept, skipped };
}

const result = { scrapedAt: new Date().toISOString(), shops: [] };
for (const s of SHOPS) {
  if (ONLY && s.key !== ONLY) continue;
  try {
    const html = await getHtml(s.rosterUrl, { sjis: s.sjis });
    const $ = cheerio.load(html);
    const { kept, skipped } = tidy(s.parse($));
    const withImg = kept.filter((t) => t.imgUrl).length;
    console.log(`${kept.length >= 3 ? '✅' : '⚠️'} ${s.key.padEnd(13)} ${String(kept.length).padStart(3)}名（写真 ${withImg}）除外 ${skipped.length}  ${s.shop.name}`);
    result.shops.push({ key: s.key, shop: s.shop, rosterUrl: s.rosterUrl, pageTitle: clean($('title').first().text()), therapists: kept, skipped });
  } catch (e) {
    console.log(`❌ ${s.key.padEnd(13)} ${e.message}`);
    result.shops.push({ key: s.key, shop: s.shop, rosterUrl: s.rosterUrl, error: e.message, therapists: [], skipped: [] });
  }
}
fs.mkdirSync(OUT_DIR, { recursive: true });
const out = path.join(OUT_DIR, ONLY ? `rosters-${ONLY}.json` : 'rosters.json');
fs.writeFileSync(out, JSON.stringify(result, null, 1));
console.log(`\n→ ${out}`);
