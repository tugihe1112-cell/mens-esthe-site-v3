/**
 * add_shop.mjs — 店舗（ルーム）レコードを新規に作る
 *
 * 使い方:
 *   node scripts/maintenance/add_shop.mjs --file=rooms.tsv          （下見）
 *   node scripts/maintenance/add_shop.mjs --file=rooms.tsv --apply  （実行）
 *
 * 【TSVの形式】1行1店。`#` で始まる行はコメント。空欄は `-`。
 *   <id>\t<店名>\t<都道府県>\t<市区>\t<エリア>\t<住所>\t<公式URL>\t<group_id>
 *   エリアは `|` 区切りで複数書ける（update_shop_location.mjs と同じ。先頭が代表）。
 *
 * 【なぜ必要か（2026-09-16）】
 * THE HALF は公式 /access/ に5ルーム（五反田・新橋・麻布十番/六本木・恵比寿/中目黒・横浜）あるのに、
 * うちには2件しかレコードが無く、**新橋・六本木・横浜はその地名で検索しても出てこない**。
 * D-014 で支店レコードの存在理由は**地名**になったので、地名ぶんのレコードが要る。
 * ⚠️ 既存レコードのエリア欄に足す逃げ道は、**県をまたぐと使えない**
 *    （神奈川の横浜を東京都のレコードに入れることになる）。
 *
 * 【作ったレコードに何が起きるか（先に知っておくこと）】
 *  ・D-014により**店舗ページ自体は301でブランドページへ飛ぶ**（ルームが2つ以上のブランドなので）。
 *  ・効果は「その地名で検索に出る」「/area/<県> にこのブランドが並ぶ」の2点。
 *  ・在籍セラピストも口コミも**ブランド単位**なので、空のルームを足しても中身は薄くならない。
 *
 * 【安全装置】
 *  1. 既定は**下見**。`--apply` が要る。
 *  2. **idが既にあれば中止**（1件でも衝突したら1件も作らない）。上書き事故を構造的に防ぐ。
 *  3. `group_id` は**既に存在するものだけ**を受け付ける。打ち間違いで孤児ブランドを作らない。
 *     （新しいブランドを起こすときは先に既存レコードの group_id を決めること）
 *  4. 都道府県を47件の一覧と照合する。
 *  5. 作ったidを JSONへ書き出す（消すときの手掛かり）。
 *  6. 作成後に読み直して、実際に入ったことを確認する。
 *
 * 【入れないもの】
 *  ⚠️ 営業時間・料金・画像・セラピストは**空のままにする**。
 *     同じブランドの別ルームからコピーしない＝確かめていない値を作らない（D-010の考え方）。
 *     実際、THE HALF 恵比寿は五反田の住所とロゴをコピーされた状態で登録されていた。
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
if (!url || !key) { console.error('❌ .env に VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY がありません'); process.exit(1); }
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const PREFECTURES = ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const fileArg = args.find((a) => a.startsWith('--file='));
if (!fileArg) {
  console.error('使い方: node scripts/maintenance/add_shop.mjs --file=<rooms.tsv> [--apply]');
  console.error('  形式: id <TAB> 店名 <TAB> 都道府県 <TAB> 市区 <TAB> エリア <TAB> 住所 <TAB> 公式URL <TAB> group_id');
  process.exit(1);
}

const KEEP = '-';
const rows = [];
for (const line of fs.readFileSync(fileArg.slice('--file='.length), 'utf8').split('\n')) {
  const t = line.replace(/\r$/, '');
  if (!t.trim() || t.trim().startsWith('#')) continue;
  const f = t.split('\t').map((v) => v.trim());
  if (f.length < 8) { console.error(`❌ 列が足りない行（8列必要）: ${t}`); process.exit(1); }
  const [id, name, prefecture, city, area, address, website, groupId] = f;
  rows.push({ id, name, prefecture, city, area, address, website, groupId });
}
if (!rows.length) { console.error('❌ 対象が0件です'); process.exit(1); }

const problems = [];
// 2. idの衝突
const { data: existing, error: e1 } = await supabase.from('shops').select('id, name').in('id', rows.map((r) => r.id));
if (e1) { console.error('❌ 既存idの確認に失敗:', e1.message); process.exit(1); }
for (const s of existing || []) problems.push(`idが既にある: ${s.id}（${s.name}）… 新規作成ではなく更新の道具を使うこと`);

// 3. group_id の実在
const groupIds = [...new Set(rows.map((r) => r.groupId).filter((v) => v && v !== KEEP))];
const { data: groups, error: e2 } = await supabase.from('shops').select('group_id').in('group_id', groupIds);
if (e2) { console.error('❌ group_idの確認に失敗:', e2.message); process.exit(1); }
const known = new Set((groups || []).map((g) => g.group_id));
for (const g of groupIds) if (!known.has(g)) problems.push(`group_id が存在しない: ${g}（打ち間違いだと孤児のブランドができます）`);

// 4. 都道府県
for (const r of rows) if (!PREFECTURES.includes(r.prefecture)) problems.push(`都道府県が不正: ${r.id} … 「${r.prefecture}」`);

const payloads = rows.map((r) => {
  const areas = String(r.area || '').split('|').map((v) => v.trim()).filter(Boolean);
  return {
    id: r.id,
    name: r.name,
    group_id: r.groupId === KEEP ? null : r.groupId,
    website_url: r.website === KEEP ? null : r.website,
    // ⚠️ 営業時間・料金・画像・セラピストは入れない（確かめていない値を作らない）
    raw_data: {
      id: r.id,
      name: r.name,
      prefecture: r.prefecture,
      city: r.city === KEEP ? undefined : r.city,
      area: areas.length > 1 ? areas : (areas[0] || undefined),
      address: r.address === KEEP ? undefined : r.address,
      websiteUrl: r.website === KEEP ? undefined : r.website,
      threads: [],
    },
  };
});

console.log(`--- 作成する ${payloads.length}件 ---\n`);
for (const p of payloads) {
  console.log(`■ ${p.name} [${p.id}]`);
  console.log(`   group_id: ${p.group_id}`);
  console.log(`   ${p.raw_data.prefecture} ${p.raw_data.city ?? ''} ／ エリア: ${Array.isArray(p.raw_data.area) ? p.raw_data.area.join('・') : p.raw_data.area ?? '—'}`);
  console.log(`   住所: ${p.raw_data.address ?? '—'}`);
  console.log(`   公式: ${p.website_url ?? '—'}`);
  console.log(`   ⚠️ 営業時間・料金・画像・セラピストは空（コピーしない）`);
}

if (problems.length) {
  console.error('\n❌ 問題があるので1件も作りません:');
  problems.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}

if (!APPLY) {
  console.log('\nこれは下見です。実行するには --apply を付けてください。');
  console.log('⚠️ 作ったレコードの店舗ページは D-014 により**301でブランドページへ飛びます**。');
  console.log('   狙いは「その地名で検索に出る」「/area/<県> にこのブランドが並ぶ」の2点です。');
  process.exit(0);
}

const dir = 'outputs/added-shops';
fs.mkdirSync(dir, { recursive: true });
const backup = path.join(dir, `added-shops-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(backup, JSON.stringify(payloads, null, 2), 'utf8');
console.log(`\n📦 作成内容: ${backup}`);

const { error: e3 } = await supabase.from('shops').insert(payloads);
if (e3) { console.error('❌ 作成に失敗:', e3.message); process.exit(1); }

const { data: check, error: e4 } = await supabase.from('shops').select('id, name, group_id').in('id', rows.map((r) => r.id));
if (e4) { console.error('❌ 確認に失敗:', e4.message); process.exit(1); }
if ((check || []).length !== payloads.length) {
  console.error(`❌ ${payloads.length}件のうち ${check?.length ?? 0}件しか入っていません`);
  process.exit(1);
}
for (const s of check) console.log(`✅ ${s.name} [${s.id}] group_id=${s.group_id}`);
console.log('\n※ 直したあと: 対象の地名で検索して出てくることと、/brands/<group_id> のルーム欄に増えたことを確認してください。');
