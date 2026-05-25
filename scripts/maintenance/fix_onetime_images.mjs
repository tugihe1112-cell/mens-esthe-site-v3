/**
 * ONE time セラピスト写真URL更新
 * トップページから取得した名前→写真URLマップでDBを更新
 * 実行: node scripts/maintenance/fix_onetime_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (DRY_RUN) console.log('[DRY RUN]\n');

const SHOP_ID = 'miyagi_sendai_onetime';

// トップページから取得した 名前 → 写真URL マップ
const IMAGE_MAP = {
  "あや": "https://onetime-sendai.com/upload/cast/129_17695033581.jpg",
  "なぎ": "https://onetime-sendai.com/upload/cast/110_17332005631.jpg",
  "あすか": "https://onetime-sendai.com/upload/cast/121_17485834321.jpg",
  "ゆあ": "https://onetime-sendai.com/upload/cast/119_17587182203.jpg",
  "ちあき": "https://onetime-sendai.com/upload/cast/123_17584685133.jpg",
  "四宮": "https://onetime-sendai.com/upload/cast/137_17760249041.jpg",
  "るる": "https://onetime-sendai.com/upload/cast/136_17758177331.jpg",
  "なぎさ": "https://onetime-sendai.com/upload/cast/134_17754682241.jpg",
  "ゆか": "https://onetime-sendai.com/upload/cast/133_17736169761.jpg",
  "あい": "https://onetime-sendai.com/upload/cast/132_17716739621.jpg",
  "なつ": "https://onetime-sendai.com/upload/cast/131_17712342302.jpg",
  "もも": "https://onetime-sendai.com/upload/cast/130_17709784851.jpg",
  "うらら": "https://onetime-sendai.com/upload/cast/126_17615456551.jpg",
  "相川（アイカワ）": "https://onetime-sendai.com/upload/cast/23_16836287154.jpg",
  "こころ": "https://onetime-sendai.com/upload/cast/41_17308930333.jpg",
  "まみ": "https://onetime-sendai.com/upload/cast/108_17292611721.jpg",
  "うみ": "https://onetime-sendai.com/upload/cast/109_17310782441.jpg",
  "成瀬 (ナルセ)": "https://onetime-sendai.com/upload/cast/49_16973570271.jpg",
  "菅野 (カンノ)": "https://onetime-sendai.com/upload/cast/66_17105399441.jpg",
  "あみ": "https://onetime-sendai.com/upload/cast/100_17254107621.jpg",
  "りょう": "https://onetime-sendai.com/upload/cast/116_17441440341.jpg",
  "みつき": "https://onetime-sendai.com/upload/cast/120_17488506081.jpg",
  "そら": "https://onetime-sendai.com/upload/cast/122_17537699471.jpg",
  "はる": "https://onetime-sendai.com/upload/cast/125_17590423631.jpg",
  "杏奈（アンナ）": "https://onetime-sendai.com/upload/cast/45_16948482741.jpg",
};

let updated = 0, notFound = 0;

for (const [name, imgUrl] of Object.entries(IMAGE_MAP)) {
  const id = `${SHOP_ID}_${name}`;
  console.log(`${name} → ${imgUrl}`);
  if (DRY_RUN) continue;

  const { error } = await supabase.from('therapists')
    .update({ image_url: imgUrl })
    .eq('id', id);

  if (error) { console.error(`  ❌ ${error.message}`); notFound++; }
  else        { console.log(`  ✅`); updated++; }
}

if (!DRY_RUN) console.log(`\n完了: 更新 ${updated}名, エラー ${notFound}名`);
