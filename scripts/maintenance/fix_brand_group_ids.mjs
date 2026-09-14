/**
 * fix_brand_group_ids.mjs — 同じブランドなのに group_id が割れているのを揃える
 *
 * 【なぜ必要か（2026-09-14）】
 * 一覧をブランド単位にまとめたところ、銀座に「Ginza Rich」が2枚、
 * 東京に「ANAICHI」が2枚出た。**まとめる仕組みは正しく動いていて、
 * まとめる鍵（group_id）が入っていないだけ**だった。
 *   Ginza Rich  g_brand_ginza_rich（69人） / group_idなし（72人）
 *   らんぷ      赤羽・北千住・大宮・川越・所沢・三ノ輪 が4通りのgroup_id
 *
 * ⚠️ **同じ名前でも別経営がある。名前だけで揃えてはいけない。**
 *    実測で、公式サイトのドメインが完全に別のものが3ブランドあった:
 *      M SPA      愛知 m-spa.net        / 東京 mspasalon.com
 *      Queendom   埼玉 omiya-mens-este.net / 茨城 queendom-mito.com
 *      ミセス美オーラ 大阪 mrs-viaura.com / 岡山 viaura.jp / 静岡 viaura-hamamatsu.com
 *    これらは**揃えない**。この道具は「人が確認した対応表」しか受け取らない。
 *
 * ⚠️ group_id は口コミの共有範囲そのもの。揃えると口コミが系列全体に出る。
 *    だから対象店と移動先グループの口コミ件数を必ず表示し、
 *    人が見てから --apply する。
 *
 * 【安全装置】
 *  1. 既定は下見(dry-run)。`--apply` が要る
 *  2. 変更前の group_id をJSONへ書き出してから更新
 *  3. shop_id は完全一致のみ。存在しないidが1つでもあれば**1件も書き換えずに中止**
 *  4. 対応表は `--file` のTSVでしか受け取らない（名前からの自動判定はしない）
 *
 * 実行:
 *   node scripts/maintenance/fix_brand_group_ids.mjs --file=outputs/brand-group-ids.tsv
 *   node scripts/maintenance/fix_brand_group_ids.mjs --file=outputs/brand-group-ids.tsv --apply
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function env(key) {
  if (process.env[key]) return process.env[key];
  try {
    const source = fs.readFileSync('.env', 'utf8');
    return source.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '') || '';
  } catch { return ''; }
}

const supabaseUrl = env('VITE_SUPABASE_URL');
const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Supabaseのサーバー接続情報がありません（.env の VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const fileArg = args.find((a) => a.startsWith('--file='));
if (!fileArg) {
  console.error('使い方: node scripts/maintenance/fix_brand_group_ids.mjs --file=<対応表.tsv> [--apply]');
  console.error('  対応表の形式: shop_id <TAB> 新しいgroup_id（# で始まる行はコメント）');
  process.exit(1);
}

const pairs = [];
for (const line of fs.readFileSync(fileArg.slice('--file='.length), 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const [shopId, gid] = t.split('\t');
  if (!shopId || !gid) { console.error(`❌ 行の形式が違います: ${t}`); process.exit(1); }
  pairs.push({ shopId: shopId.trim(), gid: gid.trim() });
}
if (pairs.length === 0) { console.error('❌ 対応表が空です'); process.exit(1); }

const BACKUP_DIR = 'outputs/brand-group-ids';

async function run() {
  const ids = pairs.map((p) => p.shopId);
  const { data: shops, error } = await supabase
    .from('shops').select('id, name, group_id, website_url').in('id', ids);
  if (error) throw error;
  const byId = new Map((shops || []).map((s) => [s.id, s]));

  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) {
    console.error(`❌ 存在しないshop_idがあります（1件も書き換えずに中止）:\n  ${missing.join('\n  ')}`);
    process.exit(1);
  }

  // 口コミ件数は「揃えると何が見えるようになるか」を人が判断するために出す
  const targetGids = [...new Set(pairs.map((p) => p.gid))];
  const { data: groupShops, error: gerr } = await supabase
    .from('shops').select('id, group_id').in('group_id', targetGids);
  if (gerr) throw gerr;
  const shopIdsInTargets = [...new Set([...(groupShops || []).map((s) => s.id), ...ids])];
  const { count: reviewCount, error: rerr } = await supabase
    .from('reviews').select('id', { count: 'exact', head: true }).in('shop_id', shopIdsInTargets);
  if (rerr) throw rerr;

  const planned = [];
  const byGid = new Map();
  for (const { shopId, gid } of pairs) {
    const shop = byId.get(shopId);
    if ((shop.group_id || '') === gid) { console.log(`⏭️  変更なし: ${shop.name} [${shopId}]`); continue; }
    planned.push({ shop, gid });
    if (!byGid.has(gid)) byGid.set(gid, []);
    byGid.get(gid).push(shop);
  }

  for (const [gid, list] of byGid) {
    console.log(`\n■ ${gid}`);
    for (const s of list) {
      console.log(`   ${s.name} [${s.id}]`);
      console.log(`      ${s.group_id || '(group_idなし)'} → ${gid}   ${s.website_url || ''}`);
    }
  }
  console.log(`\n--- 対象 ${planned.length}件 / 関係する口コミ ${reviewCount ?? 0}件 ---`);
  console.log('⚠️ group_id は口コミの共有範囲です。揃えると口コミが系列全体に出ます。');

  if (!APPLY) {
    console.log('\nこれは下見です。実行するには --apply を付けてください。');
    console.log('⚠️ 公式サイトのドメインが別なら、同じ名前でも揃えないこと（別経営の可能性）。');
    return;
  }
  if (planned.length === 0) { console.log('\n変更するものはありません。'); return; }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `group-ids-${stamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(planned.map((p) => ({ before: p.shop, newGroupId: p.gid })), null, 2));
  console.log(`\n📦 バックアップ: ${backupPath}`);

  for (const { shop, gid } of planned) {
    const { error: uerr } = await supabase.from('shops').update({ group_id: gid }).eq('id', shop.id);
    if (uerr) { console.error(`❌ 更新失敗: ${shop.name} [${shop.id}] — ${uerr.message}`); process.exitCode = 1; continue; }
    console.log(`✅ ${shop.name} [${shop.id}] → ${gid}`);
  }
}

run().catch((e) => { console.error('❌', e); process.exit(1); });
