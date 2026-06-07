/**
 * fix_noi_shinyokohama.mjs
 * NOI 新横浜 35名登録（Chrome取得データ）
 * 実行: node scripts/maintenance/fix_noi_shinyokohama.mjs [--dry-run]
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(
  getEnv('VITE_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')
);
const DRY = process.argv.includes('--dry-run');

const BASE = 'https://noi-esthe.com/manage/image/up/';

const THERAPISTS = [
  { name: '月島しの',   img: `${BASE}20260603165839_3563644804_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '白咲みさ',   img: `${BASE}20260602215124_1630251252_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '桜井ゆい',   img: `${BASE}20260602215137_1672351834_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '星野ななせ', img: `${BASE}20260602215150_3874652260_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '佐々木　あおい', img: `${BASE}20260602215208_35152676_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '鏡音るな',   img: `${BASE}20260602215220_2194953480_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '橋本りんね', img: `${BASE}20260602215233_7024254372_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '上妻れみ',   img: `${BASE}20260602215246_3559754846_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '二階堂まや', img: `${BASE}20260602215259_6701255236_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '上條あすか', img: `${BASE}20260602215313_2804255924_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '美南かすみ', img: `${BASE}20260602215326_2709556682_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '西野なつき', img: `${BASE}20260602215335_4827357360_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '桜庭みおり', img: `${BASE}20260602215345_3516257904_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '姫宮りのん', img: `${BASE}20260602215407_7064058390_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '夢乃めい',   img: `${BASE}20260602215419_7627359646_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '神楽あむ',   img: `${BASE}20260602215433_2241860320_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '白石すず',   img: `${BASE}20260602215441_9113360644_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '照井める',   img: `${BASE}20260602215456_753660998_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '恋叶ちろり', img: `${BASE}20260602215514_7029333684_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '佐藤るぅ',   img: `${BASE}20260602215534_8481334682_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '藤宮しの',   img: `${BASE}20260602215546_4599535142_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '和泉しずか', img: `${BASE}20260602215559_3680735502_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '吉高ふうか', img: `${BASE}20260602215617_4871436214_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '成瀬るい',   img: `${BASE}20260602215633_4939437128_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '乙川ここあ', img: `${BASE}20260602215645_6135937488_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '加藤つむぎ', img: `${BASE}20260602215703_557637836_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '七瀬りこ',   img: `${BASE}20260602215727_8629139086_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '新井ゆり',   img: `${BASE}20260602215738_1951939576_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '朝陽ほのか', img: `${BASE}20260602215746_9237339818_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '木下やよい', img: `${BASE}20260602215809_1848140336_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '目黒れい',   img: `${BASE}20260602215821_2007241262_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '神代せつな', img: `${BASE}20260602215830_1419041814_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '水鏡まゆ',   img: `${BASE}20260602215840_521142170_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '明日原のの', img: `${BASE}20260602215849_7489442426_cast_subphoto_img_url_1_w500xh750.webp` },
  { name: '佐倉なぎさ', img: `${BASE}20260602215908_3890242784_cast_subphoto_img_url_1_w500xh750.webp` },
];

async function main() {
  const shopId = 'kanagawa_shinyokohama_noi';
  console.log(DRY ? '=== DRY RUN ===' : '=== LIVE RUN ===');
  console.log(`\n=== NOI 新横浜 (${THERAPISTS.length}名) ===`);

  if (DRY) {
    THERAPISTS.slice(0, 3).forEach(t => console.log(`  DRY: ${t.name} 📷`));
    return;
  }

  // 既存の "出勤中" ノイズレコードを削除
  const { error: delErr } = await supabase
    .from('therapists')
    .delete()
    .eq('shop_id', shopId)
    .eq('name', '出勤中');
  if (delErr) console.error('  削除エラー:', delErr.message);
  else console.log('  ノイズ("出勤中")削除OK');

  for (let i = 0; i < THERAPISTS.length; i += 50) {
    const batch = THERAPISTS.slice(i, i + 50).map(t => ({
      id: `${shopId}_${t.name}`,
      shop_id: shopId,
      name: t.name,
      image_url: t.img,
    }));
    const { error } = await supabase.from('therapists').upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    if (error) console.error(`  ERROR: ${error.message}`);
    else console.log(`  batch ${Math.floor(i / 50) + 1} OK: ${batch.length}件`);
  }
  console.log('\n=== 完了 ===');
}

main().catch(console.error);
