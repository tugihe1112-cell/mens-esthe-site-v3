// Supabase Storageの孤立ファイル削除（R2移行後のクリーンアップ）
// DBのimage_urlがどれもSupabase Storageを指していない今、Storage上の全ファイルは孤立＝安全に削除可。
// 念のため「DBが今も参照しているパス」だけは保護する（保護されるのは通常0件）。
// 実行: node scripts/maintenance/delete_supabase_orphans.mjs [--dry-run]
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const SB_URL = getEnv('VITE_SUPABASE_URL');
const supabase = createClient(SB_URL, getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const DRY = process.argv.includes('--dry-run');

const HOST = (SB_URL || '').replace(/^https?:\/\//, '');
const PUBLIC_MARK = '/storage/v1/object/public/';

// DBが今もSupabase Storageを参照しているキー（bucket/path）を集める＝保護対象
async function referencedKeys() {
  const set = new Set();
  for (const table of ['therapists', 'shops']) {
    let from = 0; const PAGE = 1000;
    while (true) {
      const { data, error } = await supabase.from(table).select('image_url')
        .ilike('image_url', `%${HOST}${PUBLIC_MARK}%`).range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data || !data.length) break;
      for (const r of data) {
        const u = (r.image_url || '').split('?')[0];
        const i = u.indexOf(PUBLIC_MARK);
        if (i >= 0) set.add(u.slice(i + PUBLIC_MARK.length));
      }
      if (data.length < PAGE) break;
      from += PAGE;
    }
  }
  return set;
}

async function listBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw new Error('listBuckets: ' + error.message);
  return data.map((b) => b.name);
}

async function listBucketFiles(bucket) {
  const out = [];
  async function walk(prefix) {
    let offset = 0; const LIMIT = 1000;
    while (true) {
      const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: LIMIT, offset, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`);
      if (!data || !data.length) break;
      for (const it of data) {
        const full = prefix ? `${prefix}/${it.name}` : it.name;
        if (!it.id) await walk(full); else out.push(full);
      }
      if (data.length < LIMIT) break;
      offset += LIMIT;
    }
  }
  await walk('');
  return out;
}

async function main() {
  console.log(`=== Supabase孤立ファイル削除 (${DRY ? 'DRY-RUN' : '本番'}) ===`);
  const referenced = await referencedKeys();
  console.log(`DBが今もSupabase Storageを参照しているキー: ${referenced.size}件（これは保護＝削除しない）`);
  const buckets = await listBuckets();
  let del = 0, prot = 0;
  for (const bucket of buckets) {
    let files;
    try { files = await listBucketFiles(bucket); } catch (e) { console.log(`  ${bucket}: list失敗 ${e.message}`); continue; }
    const orphans = files.filter((p) => !referenced.has(`${bucket}/${p}`));
    prot += files.length - orphans.length;
    console.log(`${bucket}: 全${files.length} / 孤立(削除対象)${orphans.length} / 参照中(保護)${files.length - orphans.length}`);
    if (DRY) { if (orphans.length) console.log('  [DRY]例:', orphans.slice(0, 5).join(', ')); continue; }
    for (let i = 0; i < orphans.length; i += 500) {
      const chunk = orphans.slice(i, i + 500);
      const { error } = await supabase.storage.from(bucket).remove(chunk);
      if (error) { console.log('  削除エラー', bucket, error.message); continue; }
      del += chunk.length; process.stdout.write(`\r  ${bucket} 削除 ${del}   `);
    }
    if (orphans.length && !DRY) process.stdout.write('\n');
  }
  console.log(`✅ ${DRY ? '[DRY]削除予定' : '削除'} ${DRY ? (0) : del}件 / 参照保護 ${prot}件`);
  if (!DRY) console.log('  → Supabase Usage の Storage がさらに下がる（Free枠の余裕UP）。反映に最大1時間。');
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
