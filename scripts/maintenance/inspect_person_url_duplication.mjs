/**
 * inspect_person_url_duplication.mjs — 人物ページのURLが何枚重複しているかを測る（読むだけ）
 *
 * 【何を決めるための数字か】
 * 人物ページの中身は既に人単位（reviewIdentity の samePersonTherapistIds で系列の口コミを合流）。
 * 残る問題は**URLだけ**＝同じ人が所属ルームの数だけ `/shops/<shop>/threads/<therapist>` を持つ。
 *
 * サイトマップに出るのは「その shop_id に口コミが付いた人物」だけなので、
 *   重複URL = 同じ人物が**2つ以上のルームで口コミを受けている**ケース
 * これが0なら、新しいルート `/therapists/:id` を今作っても消せる重複は無い
 * （＝canonicalを揃えるだけで足りる）。多いなら D-014 と同じ型で集約する価値がある。
 *
 * 【読むだけ】本番DBを1行も変更しない。
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const norm = (v) => String(v ?? '').normalize('NFKC').replace(/[\s　]/g, '').toLowerCase();

async function all(table, select) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(select).range(from, from + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

const shops = await all('shops', 'id, group_id');
const brandOf = new Map(shops.map((s) => [s.id, s.group_id || s.id]));

const reviews = (await all('reviews', 'id, shop_id, therapist_id, therapist_name, is_public, user_id'))
  .filter((r) => r.is_public === true || r.user_id === 'owner_manual')
  .filter((r) => r.therapist_id);

// サイトマップに出るURL = (shop_id, therapist_id) の組
const urlPairs = new Set(reviews.map((r) => `${r.shop_id}|${r.therapist_id}`));

// 人物 = ブランド + 正規化名
const byPerson = new Map();
for (const r of reviews) {
  const key = `${brandOf.get(r.shop_id) || r.shop_id}::${norm(r.therapist_name)}`;
  if (!byPerson.has(key)) byPerson.set(key, new Set());
  byPerson.get(key).add(`${r.shop_id}|${r.therapist_id}`);
}

const dup = [...byPerson.entries()].filter(([, urls]) => urls.size > 1);

console.log(`公開口コミ（人物指名あり）: ${reviews.length}件`);
console.log(`人物ページURL（サイトマップに出る組）: ${urlPairs.size}枚`);
console.log(`実際の人数（ブランド＋正規化名）  : ${byPerson.size}人`);
console.log(`\n🚩 同じ人が2枚以上のURLを持っているケース: ${dup.length}人`);
for (const [key, urls] of dup) {
  console.log(`\n  ${key}`);
  for (const u of urls) console.log(`     /shops/${u.split('|')[0]}/threads/${u.split('|')[1]}`);
}
console.log(`\n→ 消せる重複URL: ${urlPairs.size - byPerson.size}枚`);
