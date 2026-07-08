/**
 * check_owner_therapist_images.mjs
 * owner_manual口コミが付いているセラピストの image_url が
 * DBに実在するのか（=写真あり）／nullなのか（=写真そのものが無い）を確定する。
 *
 * 「写真なし」表示の原因が (A)描画バグ/未デプロイ か (B)そもそも写真データが無い か を切り分ける。
 *
 * 実行: node scripts/debug/check_owner_therapist_images.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function main() {
  // owner_manual 口コミの (shop_id, therapist_id, therapist_name) を集める
  const { data: revs, error } = await supabase
    .from('reviews')
    .select('shop_id, therapist_id, therapist_name')
    .eq('user_id', 'owner_manual');
  if (error) { console.error('❌ reviews取得失敗:', error.message); process.exit(1); }

  // ユニーク化
  const seen = new Set();
  const targets = [];
  for (const r of revs) {
    const key = `${r.shop_id}|${r.therapist_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push(r);
  }

  console.log(`\n owner_manual口コミのセラピスト ${targets.length}名の写真状況\n`);
  let withImg = 0, nullImg = 0, notFound = 0;

  for (const t of targets) {
    // therapist_id で引く（無ければ shop_id×名前でも試す）
    let row = null;
    if (t.therapist_id) {
      const { data } = await supabase.from('therapists').select('id, name, image_url').eq('id', t.therapist_id).maybeSingle();
      row = data;
    }
    if (!row && t.therapist_name) {
      const { data } = await supabase.from('therapists')
        .select('id, name, image_url')
        .eq('shop_id', t.shop_id)
        .eq('name', t.therapist_name)
        .maybeSingle();
      row = data;
    }

    if (!row) { notFound++; console.log(`  ❓ [${t.shop_id}] ${t.therapist_name} (id=${t.therapist_id}) → therapistsテーブルに該当行なし`); continue; }
    const has = !!(row.image_url && String(row.image_url).trim());
    if (has) { withImg++; console.log(`  ✅ ${row.name} → 写真あり: ${row.image_url}`); }
    else { nullImg++; console.log(`  🚫 ${row.name} (id=${row.id}) → image_url が null/空 ＝写真データ無し`); }
  }

  console.log(`\n── 集計 ── 写真あり:${withImg} / 写真なし(null):${nullImg} / 行なし:${notFound}`);
  console.log('判定: 「写真あり」なのにサイトで「写真なし」表示なら＝描画バグ/未デプロイ。');
  console.log('      「image_url null」なら＝写真データ自体が無い（取り込みが必要）。\n');
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
