/**
 * ノイズ画像セラピスト削除
 * 求人サイト・外部サービスの画像が混入したセラピストを削除
 * 実行: node scripts/maintenance/delete_noise_images.mjs [shop_id]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = process.argv[2] || 'osaka_umeda_madam_gentleman';

// ノイズ画像URLのパターン
const NOISE_IMAGE_PATTERNS = [
  /relaxjob/i,
  /kyujin|recruit|job|求人/i,
  /banner|bnr/i,
  /icon_new|icon_exp|icon_check|icon_rank/i,
  /noimage|no-image|no_image/i,
];

// ノイズ名前のパターン
const NOISE_NAME_PATTERNS = /^(体験入店|見習い|研修|スタッフ募集|求人|リラクジョブ|体入|NEW|new|お知らせ|ランキング|キャンペーン|予約|ご予約)$/i;

console.log(`[${SHOP_ID}] セラピスト一覧確認中...`);
const { data: therapists, error } = await supabase
  .from('therapists')
  .select('id, name, image_url')
  .eq('shop_id', SHOP_ID);

if (error) { console.error('取得エラー:', error.message); process.exit(1); }

console.log(`総数: ${therapists.length}名`);

let deleted = 0;
for (const t of therapists) {
  const isNoiseImage = t.image_url && NOISE_IMAGE_PATTERNS.some(p => p.test(t.image_url));
  const isNoiseName = NOISE_NAME_PATTERNS.test(t.name);
  const hasNoJapanese = !/[ぁ-んァ-ヾ一-龯]/.test(t.name);
  const tooLong = t.name.length > 15;

  if (isNoiseImage || isNoiseName) {
    console.log(`🗑️  削除: ${t.name} | ${t.image_url?.slice(0, 60) || 'no image'}`);
    const { error: delErr } = await supabase.from('therapists').delete().eq('id', t.id);
    if (!delErr) deleted++;
  } else if (isNoiseName || (hasNoJapanese && tooLong)) {
    console.log(`⚠️  要確認: ${t.name}`);
  }
}

console.log(`\n✅ 削除: ${deleted}件 / ${therapists.length}件中`);

// 残りのセラピスト一覧表示
const { data: remaining } = await supabase
  .from('therapists')
  .select('id, name, age, height, image_url')
  .eq('shop_id', SHOP_ID)
  .order('name');

console.log(`\n残り: ${remaining?.length}名`);
remaining?.filter(t => !t.image_url || t.image_url.includes('relaxjob') || t.image_url.includes('recruit'))
  .forEach(t => console.log(`  ⚠️ 画像なし/ノイズ: ${t.name}`));
