/**
 * inspect_brand_rooms.mjs — あるブランド（group_id）の全ルームを、レコードの中身ごと見る【読むだけ】
 *
 * 【読むだけ】本番DBを1行も変更しない。
 *
 * 【なぜ必要か（2026-09-16）】
 * THE HALF は公式に5ルームあるのに、うちには2件しかレコードが無かった。
 * 足りないルームを足すには、**既にあるルームのレコードがどういう形か**を先に見る必要がある。
 * 推測で列を埋めると、表示だけ通って中身が欠けた行ができる。
 *
 * 【見るもの】列名・値・group_id・公式URL・画像の有無・is_active。
 *  ⚠️ 値は長いものを切り詰めて表示する。**切り詰めた値をそのまま新レコードにコピーしないこと。**
 *
 * 【セラピスト名の裏取りも出す】
 * raw_data.therapists は**取り込み元の文字列の配列**で、therapists テーブルの実体とは別物。
 * 2026-09-16、THE HALF 恵比寿の raw_data.therapists が
 * 「横須賀める・鎌倉つばさ・逗子もも・平塚はな・小田原れい・箱根さくら・熱海みさき」と
 * **神奈川〜静岡の地名が地理順に並ぶ**形をしていた（恵比寿の店なのに）。
 * 架空データの疑いがあるが、**疑いだけで消してはいけない**ので、
 * 名前ごとに「テーブルに実在するか／画像があるか／is_active か」を突き合わせて出す。
 *
 * 実行:
 *   node scripts/maintenance/inspect_brand_rooms.mjs --id=tokyo_shibuya_the_half
 *   node scripts/maintenance/inspect_brand_rooms.mjs --id=a,b,c   （カンマ区切りで複数）
 *   node scripts/maintenance/inspect_brand_rooms.mjs --group=g_brand_xxx
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function env(name) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && m[1] === name) return m[2].replace(/^["']|["']$/g, '');
  }
  return process.env[name];
}
const sb = createClient(env('VITE_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

const args = process.argv.slice(2);
const getArg = (k) => (args.find((a) => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=');
const seedIds = getArg('id').split(',').map((v) => v.trim()).filter(Boolean);
const groupArg = getArg('group');

if (!seedIds.length && !groupArg) {
  console.error('❌ --id=<店舗id> か --group=<group_id> のどちらかを指定してください');
  process.exit(1);
}

// 起点の店から group_id を集める。
// ⚠️ 起点が複数でも、group_id が違えば**別のブランド**。混ぜずに全部まとめて出す。
const groupIds = new Set(groupArg ? [groupArg] : []);
const looseIds = [];
for (const id of seedIds) {
  const { data, error } = await sb.from('shops').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) { console.error(`❌ 店舗が見つかりません: ${id}`); process.exit(1); }
  console.log(`■ 起点: ${data.name} [${data.id}]`);
  console.log(`   group_id: ${data.group_id ?? '（無し）'}`);
  if (data.group_id) {
    groupIds.add(data.group_id);
    // 🚩 `g_solo_` で始まる group_id は「この店だけのブランド」＝**他店と繋がっていない**印。
    //    同じ名前・同じ公式サイトの店が別レコードにあるのに solo のままなら、
    //    サイト上は**無関係な別の店**として並んでいる（ブランドページが1枚にならない）。
    if (String(data.group_id).startsWith('g_solo_')) {
      console.log('   ⚠️ 単独店あつかいです（g_solo_）。同名の別レコードとは繋がっていません。');
    }
  } else {
    looseIds.push(data.id);
    console.log('   ⚠️ group_id がありません。');
  }
  console.log('');
}

let rooms = [];
if (groupIds.size) {
  const { data, error } = await sb.from('shops').select('*').in('group_id', [...groupIds]);
  if (error) throw error;
  rooms = data || [];
}
if (looseIds.length) {
  const { data, error } = await sb.from('shops').select('*').in('id', looseIds);
  if (error) throw error;
  rooms = rooms.concat(data || []);
}
const groupId = [...groupIds].join(' / ') || '(単独)';

const short = (v) => {
  if (v === null || v === undefined) return '（空）';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return s.length > 160 ? `${s.slice(0, 160)}…(全${s.length}文字)` : s;
};

console.log(`━━ group_id=${groupId} のルーム ${rooms.length}件 ━━\n`);
for (const r of rooms) {
  console.log(`■ ${r.name} [${r.id}]`);
  for (const [k, v] of Object.entries(r)) {
    if (k === 'raw_data') continue;
    console.log(`   ${k}: ${short(v)}`);
  }
  const raw = r.raw_data || {};
  console.log('   raw_data:');
  for (const [k, v] of Object.entries(raw)) {
    console.log(`      ${k}: ${short(v)}`);
  }
  console.log('');
}

// 口コミ件数も見る（ルームを足す/畳む判断に効く）
const ids = rooms.map((r) => r.id);
const { data: revs, error: e3 } = await sb.from('reviews').select('shop_id').in('shop_id', ids);
if (e3) throw e3;
const count = {};
for (const rv of revs || []) count[rv.shop_id] = (count[rv.shop_id] || 0) + 1;
console.log('━━ 口コミ件数 ━━');
for (const id of ids) console.log(`   ${id}: ${count[id] || 0}件`);

// ── raw_data.therapists の裏取り ────────────────────────────────────
// raw_data.therapists は取り込み元の**文字列の配列**。therapists テーブルの実体とは別物。
// 「名前が並んでいる」ことは「その人が居る」根拠にならないので、1件ずつ突き合わせる。
// ⚠️ ここで "実在しない" と出ても、それだけで消してはいけない。
//    取り込みの取りこぼしかもしれない。判断材料であって判決ではない。
console.log('\n━━ raw_data.therapists の裏取り ━━');
const { data: tRows, error: e4 } = await sb
  .from('therapists').select('id, shop_id, name, image_url, is_active').in('shop_id', ids);
if (e4) throw e4;

for (const r of rooms) {
  const listed = Array.isArray(r.raw_data?.therapists) ? r.raw_data.therapists : [];
  const mine = (tRows || []).filter((t) => t.shop_id === r.id);
  console.log(`\n■ ${r.name} [${r.id}]`);
  console.log(`   raw_data.therapists: ${listed.length}件 ／ therapistsテーブル: ${mine.length}件`);
  if (!listed.length && !mine.length) { console.log('   （どちらも空）'); continue; }

  // 名前の突き合わせ。raw側は "unknown_さくら" のような接頭辞が付くことがある。
  const strip = (v) => String(v ?? '').replace(/^unknown_/, '').trim();
  const byName = new Map();
  for (const t of mine) byName.set(strip(t.name), t);

  let missing = 0, noImage = 0, inactive = 0;
  for (const raw of listed) {
    const name = strip(raw);
    const t = byName.get(name);
    if (!t) { missing += 1; console.log(`   ❌ ${name} … テーブルに居ない`); continue; }
    const flags = [];
    if (!String(t.image_url ?? '').trim()) { flags.push('画像なし'); noImage += 1; }
    if (t.is_active === false) { flags.push('非表示'); inactive += 1; }
    if (flags.length) console.log(`   ⚠️ ${name} … ${flags.join(' / ')}`);
  }
  // テーブルにだけ居る人（raw 側に載っていない）も出す
  const listedSet = new Set(listed.map(strip));
  const onlyTable = mine.filter((t) => !listedSet.has(strip(t.name)));
  console.log(`   → 居ない:${missing}件 画像なし:${noImage}件 非表示:${inactive}件 ／ テーブルにだけ居る:${onlyTable.length}件`);
  if (listed.length && missing === listed.length) {
    console.log('   🚩 raw_data に並んでいる名前が**1人もテーブルに居ない**。取り込み元の文字列がそのまま残っているだけの可能性。');
  }
}
