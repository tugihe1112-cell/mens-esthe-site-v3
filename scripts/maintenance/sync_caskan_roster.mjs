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
for (const a of args) if (!/^(--shop=[\w-]+|--list=https?:\/\/\S+|--link=.+|--live|--allow-mass-depart)$/.test(a)) { console.error(`❌ 知らない引数です: ${a}`); process.exit(1); }
const SHOP_ID = args.find((a) => a.startsWith('--shop='))?.slice(7);
const LIST = args.find((a) => a.startsWith('--list='))?.slice(7);
const LIVE = args.includes('--live');
const MASS = args.includes('--allow-mass-depart');
const LINK = args.find((a) => a.startsWith('--link='))?.slice(7);
const LINK_RE = LINK ? new RegExp(LINK) : null;
if (!SHOP_ID || !LIST) { console.error('使い方: --shop=<shop_id> --list=<在籍一覧のURL> [--live] [--allow-mass-depart]'); process.exit(1); }
selfTestRosterNameClean();
selfTestDepartRows();

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } });
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const key = (s) => String(s || '').normalize('NFKC').replace(/[（(【\[].*?[）)】\]]/g, '').replace(/[\s　・]/g, '').toLowerCase();

// ── 店 ────────────────────────────────────────
const { data: shop, error: se } = await supabase.from('shops').select('id,name,website_url').eq('id', SHOP_ID).maybeSingle();
if (se) { console.error('❌ DBを読めません', se.message); process.exit(1); }
if (!shop) { console.error(`❌ 店がありません: ${SHOP_ID}`); process.exit(1); }
assertOfficialRosterSource({ officialWebsiteUrl: shop.website_url, rosterUrl: LIST });

// ── 公式の在籍一覧 ─────────────────────────────
const res = await fetch(LIST, { headers: { 'User-Agent': UA } });
if (!res.ok) { console.error(`❌ 公式の一覧を開けません: ${res.status}`); process.exit(1); }
const $ = cheerio.load(await res.text());
const official = []; const seen = new Set(); const rejected = [];
if (LINK_RE) $('a[href]').each((_, el) => {
  const href = $(el).attr('href') || '';
  const castId = href.match(LINK_RE)?.[1];
  if (!castId) return;
  const img = $(el).find('img').first();
  const raw = (img.attr('alt') || $(el).text() || '').trim();
  const name = cleanRosterName(raw);
  if (seen.has(castId)) { const o = official.find((x) => x.castId === castId); if (o && !o.imgUrl) { const src2 = img.attr('data-src') || img.attr('data-original') || img.attr('src') || ''; if (src2 && !/comingsoon|noimage|now[-_ ]?printing|no_image|spacer/i.test(src2)) o.imgUrl = new URL(src2, LIST).href; } return; }
  seen.add(castId);
  if (!name) { if (raw) rejected.push(raw); return; }
  const src = img.attr('data-src') || img.attr('data-original') || img.attr('src') || '';
  const imgUrl = src && !/comingsoon|noimage|now[-_ ]?printing|no_image|spacer/i.test(src) ? new URL(src, LIST).href : null;
  official.push({ castId, name, imgUrl, profileUrl: new URL(href, LIST).href });
});
else $('.therapist-datas-each').each((_, el) => {
  const a = $(el).find('a.therapist-datas-name').first();
  const castId = (a.attr('href') || '').match(/\/therapist\/(\d+)/)?.[1];
  const raw = a.text().trim() || $(el).find('img.therapist-data-each-tmb').attr('alt') || '';
  if (!castId || seen.has(castId)) return;
  seen.add(castId);
  const name = cleanRosterName(raw);
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
const add = official.filter((o) => !byKey.has(key(o.name)));
const depart = rows.filter((r) => r.is_active !== false && !officialKeys.has(key(r.name)));
const activeNow = rows.filter((r) => r.is_active !== false).length;
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
const ok = official.every((o) => activeKeys.has(key(o.name))) && active.every((r) => officialKeys.has(key(r.name)));
console.log(`読み直し: 在籍 ${active.length}行（公式 ${official.length}人）・写真あり ${active.filter((r) => r.image_url).length}・退店扱いで残っている行 ${after.length - active.length}（今回消した ${split.remove.length}）`);
console.log(ok ? '✅ 公式と一致' : '❌ 公式と一致しません');
if (!ok) process.exit(1);
