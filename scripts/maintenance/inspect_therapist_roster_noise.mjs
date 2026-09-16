/**
 * inspect_therapist_roster_noise.mjs — 在籍名簿に「人ではないもの」が混ざっていないか測る【読むだけ】
 *
 * 【読むだけ】本番DBを1行も変更しない。
 *
 * 【なぜ必要か（2026-09-16）】
 * `/brands/g_brand_the_half` の在籍セラピスト一覧に **「THE HALF五反田店」**＝**店名そのもの**が
 * 1人として並んでいた。既存の `clean_therapist_names.mjs` は「新人」「体験入店割」のような
 * **装飾・告知**を対象にしており、**店名が人として入っている型は見ていない**。
 *
 * 【2か所に効く】
 *  ① 表示: `buildBrandRoster` は **is_active!==false かつ画像あり**の行だけ並べる。
 *     画像付きのノイズは**実際に顔写真の枠として画面に出る**。
 *  ② 件数: 「セラピストN名」は**画像の有無に関係なく**名前がある行を数える（人単位で重複排除）。
 *     つまり画像が無いノイズでも**N名を水増しする**。
 *  ⇒ 両方を別々に数える。直す価値は「表示に出ている数」で判断すること。
 *
 * 🚩【最初の版で見立てを外した（2026-09-16）】
 *  「店名と一致する＝人ではない」が本命だと思って作ったが、実測したら**逆**だった。
 *    ・自分の店名を含む183行は「瑠香 -るか- Marvelous -マーベラス-」のような**実在の人**で、
 *      表示名に店名が付いているだけ。**消したら本物のセラピストが消える。**
 *    ・他店名と完全一致した36行は**全部「みやび」**。店名に「みやび」があるせいで、
 *      よくある源氏名が丸ごと引っかかっていた（店名の最低文字数を3にしていたのが甘かった）。
 *    ・本命は「〜店」「〜ROOM」で終わる18行＝**部屋の名前が人として並んでいた**ほうだった。
 *  ⇒ 段の意味を分け直し、**消す/直す のやり方が違うものを混ぜない**ようにした。
 *
 * 【判定】綴りの禁止リストではなく、shopsテーブルと**出現の仕方**で見る。
 *   ① 部屋・店舗の呼び名が人として入っている（「〜店」「〜ROOM」等で終わる）… **消す対象**
 *   ② 人名に店名が付いている（「◯◯ -よみ- 店名」）… **消さない。表示名から店名を外す**
 *   ④ 素材・部品の名前が人として入っている（「背景画像」等）… **消す対象**
 *      🚩 2026-09-16、ルレーヴの在籍一覧に「**背景画像**」が人として並んでいた。
 *         「〜ROOM」で終わらないので①では拾えなかった。**2店目を目で見て初めて見つかった。**
 *         ⇒ 一覧だけ作って満足せず、必ず実物を見ること。
 *      ⚠️ ここだけは**語のリスト**で見ている（構造的な手がかりが無いため）。
 *         リストに無い言い方は素通りする。**これは網羅ではない。**
 *   ③ 他店の名前と完全一致 … 店名が**珍しい**ときだけ。
 *      ⚠️ よくある源氏名（多数の無関係な店に同じ名前の人が居る）は除外する。
 *         「多くの店に同じ名前の人が居る」＝それは店の識別子ではなく**人名**。
 *  ⚠️ 装飾付きの人名（「大型新人☆小春ねいろ」等）はここでは扱わない。
 *     そちらは `clean_therapist_names.mjs` の担当。判定を2か所に書かないため。
 *
 * 実行:
 *   node scripts/maintenance/inspect_therapist_roster_noise.mjs
 *   node scripts/maintenance/inspect_therapist_roster_noise.mjs --tsv=outputs/xxx.tsv
 *     … ①と④を `delete_therapists.mjs` が読める形で書き出す（手で写して取り違えないため）。
 *        ⚠️ 書き出しても消えない。消すのは delete_therapists.mjs（下見が既定）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { normName } from '../lib/brandNameMatch.mjs';

function env(name) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && m[1] === name) return m[2].replace(/^["']|["']$/g, '');
  }
  return process.env[name];
}
const sb = createClient(env('VITE_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

// ⚠️ PostgREST は1回に最大1000行しか返さない。range で最後まで繰る。
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

const tsvArg = process.argv.slice(2).find((a) => a.startsWith('--tsv='));

const shops = await fetchAll('shops', 'id, name');
const therapists = await fetchAll('therapists', 'id, shop_id, name, image_url, is_active');

const shopNameById = new Map(shops.map((s) => [s.id, s.name || '']));
const shopNameIndex = new Map();
for (const s of shops) {
  const key = normName(s.name);
  if (key.length < 3) continue;
  if (!shopNameIndex.has(key)) shopNameIndex.set(key, []);
  shopNameIndex.get(key).push(s.id);
}

// 🚩 同じ名前が**いくつの無関係な店**に居るかを数える。
//    「みやび」のように多数の店に居る名前は、店の識別子ではなく**よくある源氏名**。
//    店名と一致しても、それは偶然であって「店名が人として入っている」ではない。
const shopsUsingName = new Map();
for (const t of therapists) {
  const n = normName(t.name);
  if (!n) continue;
  if (!shopsUsingName.has(n)) shopsUsingName.set(n, new Set());
  shopsUsingName.get(n).add(t.shop_id);
}
const COMMON_NAME_MIN_SHOPS = 3;

const BRANCH_SUFFIX = /(店|ルーム|room|支店)$/i;
// ⚠️ 語のリスト＝**網羅ではない**。取り込み元のページ部品がそのまま名前になったもの。
//    増やすときは、必ず実際に見つけたものだけを足すこと（想像で足さない）。
const ASSET_WORDS = /^(背景画像|背景|メイン画像|トップ画像|ロゴ|バナー|サンプル|画像|写真|no ?image|noimage|dummy|ダミー)$/i;

const shown = (t) => t.is_active !== false && String(t.image_url ?? '').trim() !== '';

const buckets = { room: [], asset: [], decorated: [], otherShop: [] };
for (const t of therapists) {
  const n = normName(t.name);
  if (!n) continue;
  // ① 部屋・店舗の呼び名。
  if (BRANCH_SUFFIX.test(String(t.name ?? '').trim())) { buckets.room.push(t); continue; }
  // ④ 取り込み元のページ部品がそのまま名前になったもの。
  if (ASSET_WORDS.test(String(t.name ?? '').trim())) { buckets.asset.push(t); continue; }
  // ② 人名に自分の店の名前が付いている。消さずに表示名から外す。
  const own = normName(shopNameById.get(t.shop_id));
  if (own.length >= 3 && n !== own && n.includes(own)) { buckets.decorated.push(t); continue; }
  // ③ 他店の名前と完全一致。ただし**よくある源氏名は除く**。
  const hit = shopNameIndex.get(n);
  const spread = shopsUsingName.get(n)?.size || 0;
  if (hit && !hit.includes(t.shop_id) && spread < COMMON_NAME_MIN_SHOPS) { buckets.otherShop.push(t); }
}

console.log(`shops ${shops.length}件 ／ therapists ${therapists.length}行（うち画面に出る条件を満たす ${therapists.filter(shown).length}行）\n`);

const labels = {
  room: '① 部屋・店舗の呼び名が人として並んでいる … **消す対象**',
  asset: '④ 素材・部品の名前が人として並んでいる … **消す対象**（語のリスト＝網羅ではない）',
  decorated: '② 人名に店名が付いている … **消さない。表示名から店名を外す**',
  otherShop: '③ 他店の名前と完全一致（よくある源氏名は除外済み）… 要確認',
};
for (const key of ['room', 'asset', 'decorated', 'otherShop']) {
  const list = buckets[key];
  const visible = list.filter(shown);
  console.log(`━━ ${labels[key]} … ${list.length}行（うち**画面に出ている** ${visible.length}行）━━`);
  if (!list.length) { console.log('   （該当なし）\n'); continue; }
  for (const t of list.slice(0, 15)) {
    console.log(`   ${shown(t) ? '👁 表示中' : '  非表示'} 「${t.name}」 ← ${shopNameById.get(t.shop_id) || '?'} [${t.shop_id}]`);
  }
  if (list.length > 15) console.log(`   …他 ${list.length - 15}行`);
  console.log('');
}

console.log('━━ まとめ ━━');
console.log(`   ① 消す対象（部屋・店舗の呼び名）… ${buckets.room.length}行 ／ 画面に出ている ${buckets.room.filter(shown).length}行`);
console.log(`   ④ 消す対象（素材・部品の名前）… ${buckets.asset.length}行 ／ 画面に出ている ${buckets.asset.filter(shown).length}行`);
console.log(`   ② 表示名を直す対象（人名＋店名）… ${buckets.decorated.length}行 ／ 画面に出ている ${buckets.decorated.filter(shown).length}行`);
console.log(`   ③ 要確認 … ${buckets.otherShop.length}行 ／ 画面に出ている ${buckets.otherShop.filter(shown).length}行`);
console.log('');
console.log(`   ⚠️ ②は**実在の人**。消さないこと。`);
console.log(`   ⚠️ 画像が無い行も「セラピストN名」の数には入る（水増しする）。`);
console.log(`   ⚠️ ①も一覧をそのまま消さず、店のページで実物を見てから決めること。`);

if (tsvArg) {
  const out = tsvArg.slice('--tsv='.length);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const lines = [
    '# 人ではないセラピスト行（部屋・店舗の呼び名）',
    `# ${new Date().toISOString()} inspect_therapist_roster_noise.mjs が書き出した`,
    '# ⚠️ 消す前に、店のページで実物（写真と並び）を見ること。',
    '# ── ① 部屋・店舗の呼び名 ──',
    ...buckets.room.map((t) => `${t.id}\t${String(t.name ?? '').trim()}\t# ${shopNameById.get(t.shop_id) || '?'} [${t.shop_id}]`),
    '# ── ④ 素材・部品の名前 ──',
    ...buckets.asset.map((t) => `${t.id}\t${String(t.name ?? '').trim()}\t# ${shopNameById.get(t.shop_id) || '?'} [${t.shop_id}]`),
  ];
  fs.writeFileSync(out, `${lines.join('\n')}\n`, 'utf8');
  console.log(`\n📝 ①${buckets.room.length}件 + ④${buckets.asset.length}件 を書き出しました: ${out}`);
  console.log('   次: node scripts/maintenance/delete_therapists.mjs --file=' + out);
}
