/**
 * inspect_brand_room_consistency.mjs — 同じブランドのルームで営業時間・料金・URLが揃っているか測る【読むだけ】
 *
 * 【読むだけ】本番DBを1行も変更しない。
 *
 * 【なぜ必要か（2026-09-19）】
 * D-014で多ルームのブランドの店舗ページをブランドページへ301したが、ブランドページには
 * **営業時間・料金・所在地・出勤スケジュールが無い**（店舗ページにはある）。
 * 移植するとき「ブランド共通で1つ出す」か「ルームごとに出す」かを決める必要がある。
 * ⚠️ その判断は**ルームごとに値が違うかどうか**で決まる。推測ではなく数える。
 *
 * 【測ること】2ルーム以上のブランドで、ルーム間で値が割れている項目と、その割れ方。
 *  ⚠️ 空とそれ以外の差は「割れ」に数えない（片方が未入力なだけ）。
 *     本当に困るのは**両方に値があって違う**とき。そこだけを「衝突」として数える。
 *
 * 実行: node scripts/maintenance/inspect_brand_room_consistency.mjs
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
// ⚠️ 判定は画面と同じものを使う。ここで別の ならし を書くと
//    「画面は揃っていると言い、ツールは割れていると言う」になる（2026-09-19に実際そうなりかけた）。
import { brandCommonValue } from '../../src/utils/brandGroups.js';

function env(name) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && m[1] === name) return m[2].replace(/^["']|["']$/g, '');
  }
  return process.env[name];
}
const sb = createClient(env('VITE_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

async function fetchAll(table, columns) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(columns).range(from, from + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

const shops = await fetchAll('shops', 'id, name, group_id, business_hours, price_system, website_url, schedule_url, raw_data');
const groups = new Map();
for (const s of shops) {
  if (!s.group_id) continue;
  if (!groups.has(s.group_id)) groups.set(s.group_id, []);
  groups.get(s.group_id).push(s);
}

const FIELDS = [
  ['business_hours', '営業時間', (s) => s.business_hours ?? s.raw_data?.hours],
  ['price_system', '料金', (s) => s.price_system ?? s.raw_data?.price],
  ['website_url', '公式URL', (s) => s.website_url ?? s.raw_data?.websiteUrl],
  ['schedule_url', '出勤URL', (s) => s.schedule_url],
  ['address', '住所', (s) => s.raw_data?.address],
];

// 🚩 末尾スラッシュ・波ダッシュの違いは**衝突に数えない**（表記ゆれであって値の違いではない）。
//    最初の版はこれを揃えずに数え、公式URLの衝突を14%と出していたが、
//    中身は `https://aroma-ella.com` と `https://aroma-ella.com/` のような差が大半だった。
const stats = Object.fromEntries(FIELDS.map(([k]) => [k, { 衝突: 0, 全員同じ: 0, 誰も無い: 0, 一部だけ有る: 0, 例: [] }]));
let multi = 0;

for (const [gid, rooms] of groups) {
  if (rooms.length < 2) continue;
  multi += 1;
  for (const [key, label, get] of FIELDS) {
    const st = stats[key];
    const r = brandCommonValue(rooms, get);
    const raw = rooms.map(get);
    if (r.status === 'none') st.誰も無い += 1;
    else if (r.status === 'same') { if (raw.every((v) => String(v ?? '').trim())) st.全員同じ += 1; else st.一部だけ有る += 1; }
    else {
      st.衝突 += 1;
      if (st.例.length < 3) {
        const uniq = [...new Set(raw.filter(Boolean).map((v) => String(v).replace(/\s+/g, '')))];
        st.例.push({ gid, name: rooms[0].name, 種類数: r.count, 値: uniq.slice(0, 3).map((v) => v.slice(0, 40)) });
      }
    }
  }
}

console.log(`2ルーム以上のブランド ${multi}件\n`);
console.log('項目ごとの揃い方（衝突＝両方に値があって違う）');
for (const [key, label] of FIELDS) {
  const st = stats[key];
  const pct = multi ? (st.衝突 / multi * 100).toFixed(0) : 0;
  console.log(`\n■ ${label}`);
  console.log(`   衝突 ${st.衝突}件 (${pct}%) ／ 全員同じ ${st.全員同じ}件 ／ 一部だけ有る ${st.一部だけ有る}件 ／ 誰も無い ${st.誰も無い}件`);
  for (const e of st.例) {
    console.log(`     例: ${e.name} [${e.gid}] … ${e.種類数}種`);
    e.値.forEach((v) => console.log(`         「${v}」`));
  }
}
console.log('\n⚠️ 衝突が少なければ「ブランド共通で1つ出す」で足りる。多ければルームごとに出す必要がある。');
console.log('⚠️ この道具は数えるだけ。どちらにするかは人が決めること。');
