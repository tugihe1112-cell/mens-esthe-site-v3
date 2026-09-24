/**
 * register_hyogo_shops.mjs — scrape_hyogo_rosters.mjs が書き出した名簿を登録する
 *
 *   node scripts/maintenance/register_hyogo_shops.mjs            （下見・何も書かない）
 *   node scripts/maintenance/register_hyogo_shops.mjs --live     （店舗・セラピスト・画像を書き込む）
 *   オプション: --file=<rosters.json>（既定 outputs/hyogo-2026-09-24/rosters.json）
 *
 * 【安全装置】
 *  1. 既定は下見。`--live` が要る（知らない引数はその場で止める）。
 *  2. 登録する店の id か 公式サイト（ドメイン）が DB に1件でもあれば、**1件も書かない**。
 *  3. 名簿のページが店の公式サイト配下であることを確かめる（assertOfficialRosterSource）。
 *  4. 画像は R2 へ（Supabase Storage に上げない）。キーは店ごとに分ける（scopedImageKey）。
 *     取れない・写真でない画像は image_url を空にする（別の画像で埋めない）。
 *  5. 書いた店舗 id・セラピスト id を outputs/added-shops/ に JSON で残す（消すときの手掛かり）。
 *  6. 書いたあと読み直して、店舗数・人数が予定と合うか確かめる。
 *
 * 【ブランドのまとめ方（D-014・2026-09-24 追記）】
 *  名簿はブランドで1つ。ルームの地名は検索用。同じブランドの既存レコードは同じ group_id にまとめ、
 *  県外のルームは地名だけのレコード（名簿なし）を同じ group_id で置く。下の PLAN に書く。
 *
 * 【入れないもの】営業時間・料金・電話は空のまま（確かめていない値を作らない＝D-010の考え方）。
 */
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { assertOfficialRosterSource, rootDomainOf, scopedImageKey } from '../lib/sourceProvenance.mjs';

const args = process.argv.slice(2);
for (const a of args) {
  if (!/^(--live|--file=.+)$/.test(a)) { console.error(`❌ 知らない引数です: ${a}`); process.exit(1); }
}
const LIVE = args.includes('--live');
const FILE = args.find((a) => a.startsWith('--file='))?.slice(7) || 'outputs/hyogo-2026-09-24/rosters.json';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } });

const data = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
const shops = data.shops.filter((s) => !s.error && s.therapists.length > 0);
const failed = data.shops.filter((s) => s.error || s.therapists.length === 0);
if (failed.length) {
  console.error(`❌ 名簿が取れていない店があります: ${failed.map((s) => s.key).join(', ')}（取り直してから実行すること）`);
  process.exit(1);
}

// ── ブランドのまとめ（D-014）────────────────────────────────
// key → group_id。書いていない店は単独店（g_solo_<id>）。
const GROUP_OF = {
  uchiage: 'g_brand_uchiage_hanabi', // 梅田ルーム（登録済み）と同じブランド。人ごとにルームが明記されている
  prince: 'g_brand_prince',          // 梅田・尼崎の共通名簿
  knit: 'g_brand_knit',              // 三宮・尼崎・大阪北浜
  melty_himeji: 'g_brand_mrs_melty', // 神戸（登録済み・melty-salon.com）と公式サイトが互いにリンク
};
// 県外のルーム＝地名のためだけのレコード（名簿なし）。
const EXTRA_ROOMS = [
  { id: 'osaka_umeda_prince', name: 'PRINCE (プリンス) 梅田ルーム', website_url: 'https://www.osaka-prince.com/', prefecture: '大阪府', city: '梅田', area: '梅田', group_id: 'g_brand_prince' },
  { id: 'osaka_kitahama_knit', name: 'KNIT (ニット) 北浜ルーム', website_url: 'https://knit-esthe.com/', prefecture: '大阪府', city: '北浜', area: '北浜', group_id: 'g_brand_knit' },
];
// 既存レコードの group_id だけを変える（他の列は触らない）。from が今の値と違えば全体を止める。
const EXISTING_GROUP_UPDATES = [
  { id: 'osaka_umeda_打上花火梅田ルーム', from: null, to: 'g_brand_uchiage_hanabi' },
  { id: 'hyogo_sannomiya_mrs_melty', from: 'g_solo_hyogo_sannomiya_mrs_melty', to: 'g_brand_mrs_melty' },
];
const groupOf = (s) => GROUP_OF[s.key] || `g_solo_${s.shop.id}`;

// ── 事前チェック（DBを読むだけ）─────────────────────────────
const ids = [...shops.map((s) => s.shop.id), ...EXTRA_ROOMS.map((r) => r.id)];
const { data: sameId, error: e1 } = await supabase.from('shops').select('id').in('id', ids);
if (e1) { console.error('❌ DBを読めません:', e1.message); process.exit(1); }
const allShops = [];
for (let from = 0; ; from += 1000) {
  const { data: rows, error } = await supabase.from('shops').select('id,name,website_url').range(from, from + 999);
  if (error) { console.error('❌ DBを読めません:', error.message); process.exit(1); }
  allShops.push(...rows);
  if (rows.length < 1000) break;
}
const byDomain = new Map();
for (const r of allShops) {
  const d = rootDomainOf(r.website_url);
  if (d) (byDomain.get(d) || byDomain.set(d, []).get(d)).push(r);
}
const conflicts = [];
for (const s of shops) {
  if (sameId?.some((r) => r.id === s.shop.id)) conflicts.push(`${s.shop.id}: 同じ id が既にある`);
  const d = rootDomainOf(s.shop.website_url);
  // 同じブランドにまとめる既存レコード（EXISTING_GROUP_UPDATES）は衝突ではない。
  const known = (byDomain.get(d) || []).filter((r) => !EXISTING_GROUP_UPDATES.some((u) => u.id === r.id));
  if (known.length) conflicts.push(`${s.shop.id}: 同じ公式サイトの店がある（${known.map((r) => r.id).join(', ')}）`);
  try {
    assertOfficialRosterSource({ officialWebsiteUrl: s.shop.website_url, rosterUrl: s.rosterUrl });
  } catch (e) { conflicts.push(`${s.shop.id}: ${e.message}`); }
  const names = new Set();
  for (const t of s.therapists) {
    if (names.has(t.name)) conflicts.push(`${s.shop.id}: 名簿に同じ名前が2回（${t.name}）`);
    names.add(t.name);
  }
}
for (const r of EXTRA_ROOMS) {
  if (sameId?.some((x) => x.id === r.id)) conflicts.push(`${r.id}: 同じ id が既にある`);
  const d = rootDomainOf(r.website_url);
  if ((byDomain.get(d) || []).length) conflicts.push(`${r.id}: 同じ公式サイトの店がある（${byDomain.get(d).map((x) => x.id).join(', ')}）`);
}
const { data: existingRows, error: e2 } = await supabase.from('shops').select('id,group_id').in('id', EXISTING_GROUP_UPDATES.map((u) => u.id));
if (e2) { console.error('❌ DBを読めません:', e2.message); process.exit(1); }
for (const u of EXISTING_GROUP_UPDATES) {
  const row = existingRows.find((r) => r.id === u.id);
  if (!row) conflicts.push(`${u.id}: まとめる相手の既存レコードが無い`);
  else if ((row.group_id ?? null) !== u.from) conflicts.push(`${u.id}: group_id が想定（${u.from}）と違う（${row.group_id}）`);
}
const newGroups = [...new Set([...Object.values(GROUP_OF), ...EXTRA_ROOMS.map((r) => r.group_id)])];
const { data: groupUsers } = await supabase.from('shops').select('id,group_id').in('group_id', newGroups);
for (const g of groupUsers || []) conflicts.push(`${g.group_id}: 既に別の店（${g.id}）が使っている group_id`);

if (conflicts.length) {
  console.error('❌ 書き込みを中止します（1件も書いていません）:');
  conflicts.forEach((c) => console.error('  -', c));
  process.exit(1);
}

// ── 計画を表示 ─────────────────────────────────────────
const total = shops.reduce((n, s) => n + s.therapists.length, 0);
const withImg = shops.reduce((n, s) => n + s.therapists.filter((t) => t.imgUrl).length, 0);
console.log(`\n${LIVE ? '🔴 本番書き込み' : '🟢 下見（何も書きません）'}: 店舗 ${shops.length}件・セラピスト ${total}名（写真の元あり ${withImg}名）\n`);
for (const s of shops) {
  const area = Array.isArray(s.shop.area) ? s.shop.area.join('|') : s.shop.area;
  const n = s.therapists.length;
  const img = s.therapists.filter((t) => t.imgUrl).length;
  console.log(`  ${s.shop.id.padEnd(32)} ${String(n).padStart(3)}名（写真${String(img).padStart(3)}） ${s.shop.prefecture} ${s.shop.city} [${area}]  ${s.shop.name}${GROUP_OF[s.key] ? `  ← ${GROUP_OF[s.key]}` : ''}`);
  console.log(`      例: ${s.therapists.slice(0, 8).map((t) => t.name).join('、')}`);
}
console.log('\n  県外ルーム（地名だけ・名簿なし）:');
for (const r of EXTRA_ROOMS) console.log(`  ${r.id.padEnd(32)}   0名            ${r.prefecture} ${r.city}  ${r.name}  ← ${r.group_id}`);
console.log('\n  既存レコードの group_id を変える（他の列は触らない）:');
for (const u of EXISTING_GROUP_UPDATES) console.log(`  ${u.id}: ${u.from} → ${u.to}`);
if (!LIVE) {
  console.log('\n→ 本番に書くときは --live を付けて同じコマンドを流す。');
  process.exit(0);
}

// ── 書き込み ─────────────────────────────────────────
const { uploadImage } = await import('../lib/r2Upload.mjs'); // R2設定を読むのは本番のときだけ
const ogImage = async (url) => {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const $ = cheerio.load(await res.text());
    const u = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
    return u ? new URL(u, res.url).href : null;
  } catch { return null; }
};

const now = new Date().toISOString();
const created = { at: now, file: FILE, shops: [], therapists: [], groupUpdates: [] };
const backupDir = 'outputs/added-shops';
fs.mkdirSync(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `hyogo-${now.replace(/[:.]/g, '-')}.json`);
const saveBackup = () => fs.writeFileSync(backupPath, JSON.stringify(created, null, 1));

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

for (const s of shops) {
  const shop = s.shop;
  const og = await ogImage(shop.website_url);
  const logo = og ? await uploadImage(og, `${shop.id}_${og.split('/').pop().split('?')[0] || 'og.jpg'}`, shop.website_url, 'shop-logos') : null;
  const raw = { prefecture: shop.prefecture, city: shop.city, area: shop.area };
  if (shop.address) raw.address = shop.address;
  const { error: se } = await supabase.from('shops').insert({
    id: shop.id, name: shop.name, website_url: shop.website_url, image_url: logo,
    group_id: groupOf(s), raw_data: raw,
  });
  if (se) { console.error(`❌ ${shop.id}: 店舗を書けませんでした（${se.message}）。ここで止めます。`); saveBackup(); process.exit(1); }
  created.shops.push(shop.id);
  saveBackup();

  const rows = await pool(s.therapists, 4, async (t) => {
    let image = null;
    if (t.imgUrl) {
      const key = scopedImageKey({ shopId: shop.id, castId: t.castId || t.name, sourceUrl: t.imgUrl });
      image = await uploadImage(t.imgUrl, key, shop.website_url, 'therapist-images', {
        officialWebsiteUrl: shop.website_url, sourcePageUrl: s.rosterUrl,
      });
    }
    return { id: `${shop.id}_${t.name}`, shop_id: shop.id, name: t.name, image_url: image, is_active: true, last_seen_at: now };
  });
  const { error: te } = await supabase.from('therapists').insert(rows);
  if (te) { console.error(`❌ ${shop.id}: セラピストを書けませんでした（${te.message}）。ここで止めます。`); saveBackup(); process.exit(1); }
  created.therapists.push(...rows.map((r) => r.id));
  saveBackup();
  console.log(`✅ ${shop.id}: ${rows.length}名（写真 ${rows.filter((r) => r.image_url).length}）・店の画像 ${logo ? 'あり' : 'なし'}`);
}

for (const r of EXTRA_ROOMS) {
  const { error } = await supabase.from('shops').insert({
    id: r.id, name: r.name, website_url: r.website_url, group_id: r.group_id,
    raw_data: { prefecture: r.prefecture, city: r.city, area: r.area },
  });
  if (error) { console.error(`❌ ${r.id}: 書けませんでした（${error.message}）。ここで止めます。`); saveBackup(); process.exit(1); }
  created.shops.push(r.id);
  saveBackup();
  console.log(`✅ ${r.id}: 県外ルーム（地名だけ）`);
}
for (const u of EXISTING_GROUP_UPDATES) {
  let q = supabase.from('shops').update({ group_id: u.to }).eq('id', u.id);
  q = u.from === null ? q.is('group_id', null) : q.eq('group_id', u.from);
  const { data: upd, error } = await q.select('id');
  if (error || !upd?.length) { console.error(`❌ ${u.id}: group_id を変えられませんでした（${error?.message || '0件'}）。ここで止めます。`); saveBackup(); process.exit(1); }
  created.groupUpdates.push(u);
  saveBackup();
  console.log(`✅ ${u.id}: group_id ${u.from} → ${u.to}`);
}

// ── 読み直して照合 ─────────────────────────────────────
const { count: shopCount } = await supabase.from('shops').select('id', { count: 'exact', head: true }).in('id', ids);
let therapistCount = 0;
for (const id of ids) {
  const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', id);
  therapistCount += count || 0;
}
const { data: grp } = await supabase.from('shops').select('id,group_id').in('id', EXISTING_GROUP_UPDATES.map((u) => u.id));
const groupsOk = EXISTING_GROUP_UPDATES.every((u) => grp?.find((r) => r.id === u.id)?.group_id === u.to);
console.log(`\n読み直し: 店舗 ${shopCount}/${ids.length}・セラピスト ${therapistCount}/${total}・既存の group_id ${groupsOk ? 'OK' : 'NG'}`);
console.log(`バックアップ: ${backupPath}`);
if (shopCount !== ids.length || therapistCount !== total || !groupsOk) { console.error('❌ 予定と合いません。上の記録を確認すること。'); process.exit(1); }
console.log('✅ 予定どおり');
