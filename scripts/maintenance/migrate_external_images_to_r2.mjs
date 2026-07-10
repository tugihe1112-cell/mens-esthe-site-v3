/**
 * migrate_external_images_to_r2.mjs — 残りの外部URL画像をR2へ再移行
 *
 * 棚卸し(check_external_image_urls.mjs)で判明した「まだ外部CDNのURLのままの画像」
 * （therapists約39,000・shops約1,000）をR2へ移す。フロントがwsrv.nl経由で
 * 遅い/失敗していた元凶を根絶する。取得できない画像は image_url=null（NO IMAGE表示）。
 *
 * ※CORSはブラウザの制約でありNodeのサーバーfetchには効かない。Referer(店のwebsite_url)＋UAで大半は取れる。
 *
 * 前提: .env に VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / R2_*（r2Upload.mjsが使用）
 * 実行:
 *   node scripts/maintenance/migrate_external_images_to_r2.mjs --dry-run              # 対象件数だけ表示（DB/R2に触れない）
 *   node scripts/maintenance/migrate_external_images_to_r2.mjs --table=shops --limit=50  # まず少数でテスト
 *   node scripts/maintenance/migrate_external_images_to_r2.mjs --table=shops           # 店舗(1000件)から
 *   node scripts/maintenance/migrate_external_images_to_r2.mjs --table=therapists      # セラピスト(4万件・時間かかる)
 *   （--table 省略で therapists→shops 両方）
 * オプション: --limit=N（先頭N件だけ）/ --concurrency=N（並行数・既定8）
 *
 * 冪等: 対象は「外部URLの行」だけ。成功でR2 URL・失敗でnullに変わるので、再実行すると残りだけ処理する。
 */
import fs from 'fs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { uploadImage } from '../lib/r2Upload.mjs';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const LIMIT = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || 0);
const CONC = Number(args.find((a) => a.startsWith('--concurrency='))?.split('=')[1] || 8);
const TABLE_ARG = args.find((a) => a.startsWith('--table='))?.split('=')[1] || 'both';

const R2 = ['.r2.dev', 'r2.cloudflarestorage.com'];
const isR2 = (u) => R2.some((d) => u.includes(d));
const isExternal = (u) => u && !isR2(u);

const extOf = (u) => {
  const m = (u.split('?')[0].split('#')[0].split('.').pop() || '').toLowerCase();
  return ['jpg', 'jpeg', 'jfif', 'png', 'webp', 'gif'].includes(m) ? (m === 'jpeg' ? 'jpg' : m) : 'jpg';
};
// 元URLのハッシュでキー生成＝ドメイン跨ぎの basename衝突(例 1.jpg)を回避・同一URLは同一キー(dedup)
const keyFor = (u) => `mig_${crypto.createHash('sha1').update(u).digest('hex').slice(0, 20)}.${extOf(u)}`;

async function fetchAll(table, columns) {
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + PAGE - 1);
    if (error) throw new Error(`${table} fetch: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

// 並行数を絞ってタスクを処理
async function runPool(items, worker, concurrency) {
  let i = 0;
  const results = { ok: 0, nulled: 0, err: 0 };
  async function next() {
    while (i < items.length) {
      const idx = i++;
      try { await worker(items[idx], results); }
      catch (e) { results.err++; }
      if ((results.ok + results.nulled + results.err) % 200 === 0) {
        console.log(`  進捗 ${results.ok + results.nulled + results.err}/${items.length}  (R2化:${results.ok} null化:${results.nulled} 例外:${results.err})`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next));
  return results;
}

async function migrateTherapists() {
  console.log('\n=== therapists ===');
  const shops = await fetchAll('shops', 'id, website_url');
  const refererByShop = Object.fromEntries(shops.map((s) => [s.id, s.website_url || null]));
  const all = await fetchAll('therapists', 'id, shop_id, image_url');
  let targets = all.filter((r) => isExternal((r.image_url || '').trim()));
  if (LIMIT) targets = targets.slice(0, LIMIT);
  console.log(`  外部URL対象: ${targets.length}件${LIMIT ? `（--limit=${LIMIT}）` : ''}`);
  if (DRY) { console.log('  🟡 dry-run: 実行しません'); return; }

  const res = await runPool(targets, async (r, results) => {
    const src = (r.image_url || '').trim();
    const referer = refererByShop[r.shop_id] || null;
    let newUrl = null;
    try { newUrl = await uploadImage(src, keyFor(src), referer, 'therapist-images'); } catch { newUrl = null; }
    await supabase.from('therapists').update({ image_url: newUrl }).eq('id', r.id);
    if (newUrl) results.ok++; else results.nulled++;
  }, CONC);
  console.log(`  完了: R2化 ${res.ok} / null化 ${res.nulled} / 例外 ${res.err}`);
}

async function migrateShops() {
  console.log('\n=== shops ===');
  const all = await fetchAll('shops', 'id, image_url, website_url');
  let targets = all.filter((r) => isExternal((r.image_url || '').trim()));
  if (LIMIT) targets = targets.slice(0, LIMIT);
  console.log(`  外部URL対象: ${targets.length}件${LIMIT ? `（--limit=${LIMIT}）` : ''}`);
  if (DRY) { console.log('  🟡 dry-run: 実行しません'); return; }

  const res = await runPool(targets, async (r, results) => {
    const src = (r.image_url || '').trim();
    let newUrl = null;
    try { newUrl = await uploadImage(src, keyFor(src), r.website_url || null, 'shop-logos'); } catch { newUrl = null; }
    await supabase.from('shops').update({ image_url: newUrl }).eq('id', r.id);
    if (newUrl) results.ok++; else results.nulled++;
  }, CONC);
  console.log(`  完了: R2化 ${res.ok} / null化 ${res.nulled} / 例外 ${res.err}`);
}

async function main() {
  console.log(`\n🖼  外部画像→R2 再移行  ${DRY ? '[DRY-RUN]' : ''}  並行:${CONC}`);
  if (TABLE_ARG === 'shops') { await migrateShops(); }
  else if (TABLE_ARG === 'therapists') { await migrateTherapists(); }
  else { await migrateShops(); await migrateTherapists(); }
  console.log('\n✅ 終了。再実行すると残り（新たに失敗した物など）だけ処理します。\n');
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
