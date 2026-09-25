/**
 * fix_uchiage_hanabi_rooms.mjs — 打上花火（ブランド g_brand_uchiage_hanabi）のルームと名簿を公式に合わせる
 *
 *   node scripts/maintenance/fix_uchiage_hanabi_rooms.mjs          （下見・何も書かない）
 *   node scripts/maintenance/fix_uchiage_hanabi_rooms.mjs --live   （書き込む）
 *
 * 【なぜ（2026-09-25）】
 *  公式の店舗一覧は「日本橋店・神戸三宮店・姫路店・岡山店」で梅田店は無い（/system/ のフッター）。
 *  DB の大阪レコードは「打上花火 梅田ルーム」のままで、名簿138名は 2026-06 時点・全員写真なし。
 *  しかも138名は当時の**ブランド全体の名簿**で、名前の頭に「打上花火 」が付いたまま（例「打上花火 なる」）。
 *  そのため今の公式名簿と1人も一致せず、ブランドページでは「打上花火 なる」と「なる」が別人として数えられていた（262名＝水増し）。
 *  公式の在籍一覧は人ごとにルーム名が付いている（大阪側は「日本橋」36名・「大阪」1名、岡山8名）。
 *
 * 【やること】（D-014: 名簿はブランドで1つ・地名は検索用）
 *  1. 大阪レコード（id は変えない）の店名とエリアを「日本橋」に直す。raw_data は city・area だけ書き換える。
 *  2. 名前の頭の「打上花火 」を外す（全行）。そのうえで大阪レコードの名簿を公式の大阪側と突き合わせる（planReconcile）
 *     ・いる人 → 在籍を確認（last_seen_at を進める）。写真が空なら公式の写真を付ける
 *     ・いない人 → 退店扱い（is_active=false）。削除はしない・last_seen_at は触らない
 *       （神戸三宮・姫路・岡山にいる人はそちらのルームの行で出る＝ブランドページで二重に出なくなる）
 *     ・公式にいて DB にいない人 → 追加
 *  3. 岡山ルームを同じブランドのレコードとして足し、岡山の人を入れる。
 *  神戸三宮・姫路の人は 2026-09-25 に兵庫レコード（hyogo_sannomiya_uchiage_hanabi）へ登録済み。
 *
 * 【安全装置】 既定は下見／書き換える前の行を outputs/roster-reconcile/ に保存（書けなければ中止）／
 *  名簿が取れない・大阪側が0名なら何もしない（planReconcile が拒否）／書いたあと読み直して照合。
 */
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { planReconcile, selfTestReconcile, normName } from '../lib/rosterReconcile.mjs';
import { scopedImageKey } from '../lib/sourceProvenance.mjs';

const args = process.argv.slice(2);
for (const a of args) if (a !== '--live') { console.error(`❌ 知らない引数です: ${a}`); process.exit(1); }
const LIVE = args.includes('--live');

const SITE = 'https://uchiagemenseste.jp/top';
const ROSTER = 'https://uchiagemenseste.jp/cast/';
const GROUP = 'g_brand_uchiage_hanabi';
const OSAKA_ID = 'osaka_umeda_打上花火梅田ルーム';
const OSAKA_NEW = { name: '打上花火 日本橋ルーム', city: '日本橋', area: '日本橋' };
const OKAYAMA = { id: 'okayama_okayama_uchiage_hanabi', name: '打上花火 岡山ルーム', prefecture: '岡山県', city: '岡山', area: '岡山' };
const OSAKA_ROOMS = ['日本橋', '大阪'];

{
  const problems = selfTestReconcile();
  if (problems.length) { console.error('❌ 在籍照合の判定が壊れています:', problems); process.exit(1); }
}

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } });

// ── 公式の在籍一覧（人ごとのルーム付き）─────────────────────────
const html = await fetch(ROSTER, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(25000) }).then((r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
});
const $ = cheerio.load(html);
const casts = $('img[src*="upload/cast/thumb_"]').map((_, e) => {
  const alt = String($(e).attr('alt') || '').replace(/[\s　]+/g, ' ').trim();
  const m = alt.match(/^打上花火\s+(.+?)\s+(\S+)$/);
  const id = $(e).attr('src').match(/thumb_(\d+)\./)?.[1];
  return m && id ? { name: m[1], room: m[2], castId: id, imgUrl: `https://uchiagemenseste.jp/upload/cast/thumb_${id}.jpg` } : null;
}).get().filter(Boolean);
const byRoom = casts.reduce((acc, c) => ((acc[c.room] ||= []).push(c), acc), {});
console.log('公式の在籍（ルーム別）:', Object.fromEntries(Object.entries(byRoom).map(([k, v]) => [k, v.length])));

const dedupe = (list) => {
  const seen = new Set();
  return list.filter((c) => { const k = normName(c.name); if (seen.has(k)) return false; seen.add(k); return true; });
};
const osakaCasts = dedupe(OSAKA_ROOMS.flatMap((r) => byRoom[r] || []));
const okayamaCasts = dedupe(byRoom['岡山'] || []);

// ── DB の現状 ─────────────────────────────────────────
const { data: shopRow, error: se } = await supabase.from('shops').select('id,name,group_id,raw_data').eq('id', OSAKA_ID).maybeSingle();
if (se || !shopRow) { console.error('❌ 大阪レコードを読めません:', se?.message || '無い'); process.exit(1); }
if (shopRow.group_id !== GROUP) { console.error(`❌ 大阪レコードの group_id が ${shopRow.group_id}（想定 ${GROUP}）`); process.exit(1); }
const { data: rows, error: te } = await supabase.from('therapists').select('*').eq('shop_id', OSAKA_ID);
if (te) { console.error('❌ 名簿を読めません:', te.message); process.exit(1); }
const { data: okExists } = await supabase.from('shops').select('id').eq('id', OKAYAMA.id);
if (okExists?.length) { console.error(`❌ ${OKAYAMA.id} は既にある`); process.exit(1); }

const stripBrand = (n) => String(n || '').replace(/^打上花火[\s\u3000]+/, '').trim();
const renamed = rows.filter((t) => stripBrand(t.name) !== t.name);
const cleanRows = rows.map((t) => ({ ...t, name: stripBrand(t.name) }));
const plan = planReconcile({ rows: cleanRows, activeNames: osakaCasts.map((c) => c.name) });
if (plan.refused) { console.error('❌ 照合しません:', plan.refused); process.exit(1); }
const castByName = new Map(osakaCasts.map((c) => [normName(c.name), c]));
const photoFill = plan.confirm.filter((t) => !t.image_url && castByName.get(normName(t.name)));
const toAdd = plan.unmatchedNames.map((n) => castByName.get(n)).filter(Boolean);

console.log(`\n${LIVE ? '🔴 本番書き込み' : '🟢 下見（何も書きません）'}`);
console.log(`1. 大阪レコード: 「${shopRow.name}」[${JSON.stringify(shopRow.raw_data?.area)}] → 「${OSAKA_NEW.name}」[${OSAKA_NEW.area}]`);
console.log(`2. 名前の頭の「打上花火 」を外す: ${renamed.length}行（例: ${renamed.slice(0, 3).map((t) => `${t.name}→${stripBrand(t.name)}`).join('、')}）`);
console.log(`   大阪の名簿（DB ${rows.length}名 ↔ 公式 ${osakaCasts.length}名）: 在籍確認 ${plan.confirm.length}（うち写真を付ける ${photoFill.length}）・退店扱い ${plan.depart.length}・追加 ${toAdd.length}`);
console.log(`   在籍確認: ${plan.confirm.map((t) => t.name).join('、') || 'なし'}`);
console.log(`   追加: ${toAdd.map((c) => c.name).join('、') || 'なし'}`);
console.log(`3. 岡山ルームを追加: ${OKAYAMA.id}（${okayamaCasts.length}名: ${okayamaCasts.map((c) => c.name).join('、')}）`);
if (!LIVE) { console.log('\n→ 本番に書くときは --live を付けて同じコマンドを流す。'); process.exit(0); }

// ── 書き込み ─────────────────────────────────────────
const { uploadImage } = await import('../lib/r2Upload.mjs');
const now = new Date().toISOString();
fs.mkdirSync('outputs/roster-reconcile', { recursive: true });
const backupPath = path.join('outputs/roster-reconcile', `uchiage-hanabi-${now.replace(/[:.]/g, '-')}.json`);
try {
  fs.writeFileSync(backupPath, JSON.stringify({ at: now, shop: shopRow, therapists: rows, plan: { depart: plan.depart.map((t) => t.id), confirm: plan.confirm.map((t) => t.id), add: toAdd.map((c) => c.name) } }, null, 1));
} catch (e) { console.error('❌ バックアップを書けないので中止:', e.message); process.exit(1); }

const photo = async (shopId, c) => uploadImage(c.imgUrl, scopedImageKey({ shopId, castId: c.castId, sourceUrl: c.imgUrl }), SITE, 'therapist-images', { officialWebsiteUrl: SITE, sourcePageUrl: ROSTER });
const fail = (msg) => { console.error(`❌ ${msg}（バックアップ: ${backupPath}）`); process.exit(1); };

// 1. 店名とエリア
{
  const raw = { ...(shopRow.raw_data || {}), city: OSAKA_NEW.city, area: OSAKA_NEW.area };
  const { error } = await supabase.from('shops').update({ name: OSAKA_NEW.name, raw_data: raw }).eq('id', OSAKA_ID);
  if (error) fail(`大阪レコードを直せません: ${error.message}`);
  console.log(`✅ 大阪レコード → ${OSAKA_NEW.name}`);
}
// 2. 名簿
for (let i = 0; i < plan.depart.length; i += 100) {
  const { error } = await supabase.from('therapists').update({ is_active: false }).in('id', plan.depart.slice(i, i + 100).map((t) => t.id));
  if (error) fail(`退店扱いにできません: ${error.message}`);
}
for (const t of renamed) {
  const { error } = await supabase.from('therapists').update({ name: stripBrand(t.name) }).eq('id', t.id);
  if (error) fail(`名前を直せません（${t.name}）: ${error.message}`);
}
for (const t of plan.confirm) {
  const patch = { is_active: true, last_seen_at: now };
  if (!t.image_url) { const c = castByName.get(normName(t.name)); if (c) patch.image_url = await photo(OSAKA_ID, c); }
  const { error } = await supabase.from('therapists').update(patch).eq('id', t.id);
  if (error) fail(`在籍確認を書けません（${t.name}）: ${error.message}`);
}
if (toAdd.length) {
  const add = [];
  for (const c of toAdd) add.push({ id: `${OSAKA_ID}_${c.name}`, shop_id: OSAKA_ID, name: c.name, image_url: await photo(OSAKA_ID, c), is_active: true, last_seen_at: now });
  const { error } = await supabase.from('therapists').insert(add);
  if (error) fail(`追加できません: ${error.message}`);
}
console.log(`✅ 大阪の名簿: 名前を直した ${renamed.length}・在籍確認 ${plan.confirm.length}・退店扱い ${plan.depart.length}・追加 ${toAdd.length}`);
// 3. 岡山
{
  const { error } = await supabase.from('shops').insert({ id: OKAYAMA.id, name: OKAYAMA.name, website_url: SITE, group_id: GROUP, raw_data: { prefecture: OKAYAMA.prefecture, city: OKAYAMA.city, area: OKAYAMA.area } });
  if (error) fail(`岡山ルームを作れません: ${error.message}`);
  const add = [];
  for (const c of okayamaCasts) add.push({ id: `${OKAYAMA.id}_${c.name}`, shop_id: OKAYAMA.id, name: c.name, image_url: await photo(OKAYAMA.id, c), is_active: true, last_seen_at: now });
  if (add.length) { const { error: e2 } = await supabase.from('therapists').insert(add); if (e2) fail(`岡山の名簿を書けません: ${e2.message}`); }
  console.log(`✅ 岡山ルーム: ${add.length}名`);
}
// 読み直し
const { data: after } = await supabase.from('therapists').select('id,name,is_active').eq('shop_id', OSAKA_ID);
const stillPrefixed = after.filter((t) => /^打上花火/.test(t.name)).length;
const active = after.filter((t) => t.is_active !== false).length;
const { count: okCount } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', OKAYAMA.id);
const expectActive = plan.confirm.length + toAdd.length;
console.log(`\n読み直し: 大阪 在籍 ${active}/${expectActive}（全${after.length}行）・頭に「打上花火」が残る行 ${stillPrefixed}・岡山 ${okCount}/${okayamaCasts.length}`);
console.log(`バックアップ: ${backupPath}`);
if (active !== expectActive || okCount !== okayamaCasts.length || stillPrefixed) fail('予定と合いません');
console.log('✅ 予定どおり');
