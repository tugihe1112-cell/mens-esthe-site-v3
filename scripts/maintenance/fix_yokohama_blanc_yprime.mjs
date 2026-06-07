/**
 * fix_yokohama_blanc_yprime.mjs
 * THE BLANC(31名)・Y PRIME(36名) のセラピスト登録（Chrome取得データ）
 * 実行: node scripts/maintenance/fix_yokohama_blanc_yprime.mjs [--dry-run]
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

const S3 = 'https://y-prime-yokohama-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1';

// ── THE BLANC (caskan CDN, 31名) ──────────────────────────────────────────────
const BLANC = [
  { name: '南乃きい',   img: 'https://cdn2-caskan.com/caskan/img/cast/1737969213_7180891.jpg' },
  { name: '春はる',     img: 'https://cdn2-caskan.com/caskan/img/cast/1776664666_6506278.jpg' },
  { name: '甘味カリン', img: 'https://cdn2-caskan.com/caskan/img/cast/1739962208_0409256.jpg' },
  { name: '如月なな',   img: 'https://cdn2-caskan.com/caskan/img/cast/1769337160_3576289.jpg' },
  { name: '神木りさ',   img: 'https://cdn2-caskan.com/caskan/img/cast/1762240523_7019912.jpg' },
  { name: '源サナ',     img: 'https://cdn2-caskan.com/caskan/img/cast/1739270153_3774880.jpg' },
  { name: '美園ゆあ',   img: 'https://cdn2-caskan.com/caskan/img/cast/1738644546_1069354.jpg' },
  { name: '一条あき',   img: 'https://cdn2-caskan.com/caskan/img/cast/1761123006_1073136.jpg' },
  { name: '甘露あめ',   img: 'https://cdn2-caskan.com/caskan/img/cast/1737006254_8184215.jpg' },
  { name: '星野ねね',   img: 'https://cdn2-caskan.com/caskan/img/cast/1770264606_7528404.jpg' },
  { name: 'ひびき',     img: 'https://cdn2-caskan.com/caskan/img/cast/1773720807_2282918.jpg' },
  { name: '成美かんな', img: 'https://cdn2-caskan.com/caskan/img/cast/1737534032_0551813.jpg' },
  { name: '蒼井ゆの',   img: 'https://cdn2-caskan.com/caskan/img/cast/1752489027_5595944.jpg' },
  { name: '水野かなえ', img: 'https://cdn2-caskan.com/caskan/img/cast/1746876906_9615574.jpg' },
  { name: '綾瀬めぐみ', img: 'https://cdn2-caskan.com/caskan/img/cast/1754615601_2640869.jpg' },
  { name: '藤崎みな',   img: 'https://cdn2-caskan.com/caskan/img/cast/1752489133_7683861.jpg' },
  { name: '星せいら',   img: 'https://cdn2-caskan.com/caskan/img/cast/1762325661_0791902.jpg' },
  { name: '桜井かほ',   img: 'https://cdn2-caskan.com/caskan/img/cast/1775213283_2491426.jpg' },
  { name: '美咲ゆい',   img: 'https://cdn2-caskan.com/caskan/img/cast/1770614796_8665452.jpg' },
  { name: '廣瀬すずは', img: 'https://cdn2-caskan.com/caskan/img/cast/1771906099_9889779.jpg' },
  { name: '美月める',   img: 'https://cdn2-caskan.com/caskan/img/cast/1775269664_5094362.jpg' },
  { name: '神楽あゆ',   img: 'https://cdn2-caskan.com/caskan/img/cast/1770016821_9402275.jpg' },
  { name: '柏木しずく', img: 'https://cdn2-caskan.com/caskan/img/cast/1773629437_3558778.jpg' },
  { name: '芹沢みれい', img: 'https://cdn2-caskan.com/caskan/img/cast/1773629562_2853012.jpg' },
  { name: '有村ありあ', img: 'https://cdn2-caskan.com/caskan/img/cast/1773056069_3172792.jpg' },
  { name: '福原もも',   img: 'https://cdn2-caskan.com/caskan/img/cast/1780215519_8496588.jpg' },
  { name: '神崎ほたる', img: 'https://cdn2-caskan.com/caskan/img/cast/1780729419_8214681.jpg' },
  { name: '今井あや',   img: 'https://cdn2-caskan.com/caskan/img/cast/1773629109_8515480.jpg' },
  { name: '神谷あいり', img: 'https://cdn2-caskan.com/caskan/img/cast/1774935354_0700666.jpg' },
  { name: '乙女ありす', img: 'https://cdn2-caskan.com/caskan/img/cast/1761982564_3311015.jpg' },
  { name: '宮城ゆめ',   img: 'https://cdn2-caskan.com/caskan/img/cast/1753236566_6437546.jpg' },
];

// ── Y PRIME (S3バケット, 36名) ────────────────────────────────────────────────
const YPRIME = [
  { name: '小桜ひより', img: `${S3}/86/d81105a3-67e5-4e94-9cd2-73d4a5f3397f.jpg` },
  { name: '柊みのり',   img: `${S3}/84/7119d548-2c5f-4428-b87f-5f01781a1175.jpg` },
  { name: '藤原るる',   img: `${S3}/83/92eb0766-51fe-4d24-8d19-7182eff7c251.jpg` },
  { name: '櫻井みな',   img: `${S3}/81/d5709d67-7c16-4d96-8b73-f05da2a1bedc.jpg` },
  { name: '織元ゆず',   img: `${S3}/79/0d1e8419-cc36-4990-b1e3-770f94396f2a.jpg` },
  { name: '水城すい',   img: `${S3}/80/36ab3c4d-f1c1-4611-83d0-04a523cdc2af.jpg` },
  { name: '天羽おとは', img: `${S3}/78/628cc017-6640-4207-928b-c233ded48b34.jpg` },
  { name: '小森まな',   img: `${S3}/73/3bb1f1a0-0f0a-4819-a368-dbe79c3fe122.jpg` },
  { name: '椎名るい',   img: `${S3}/72/18f93e7c-b1ee-417a-b233-6001c92b0d11.jpg` },
  { name: '胡桃かりん', img: `${S3}/69/abf0bc50-4e94-4c39-b735-1b9ae8985e91.jpg` },
  { name: '愛乃みう',   img: `${S3}/68/31bbff15-7299-449b-9508-3b5b208476e1.jpg` },
  { name: '後藤まゆ',   img: `${S3}/67/631d1785-3909-4466-9455-c498b0123a36.jpg` },
  { name: '水瀬こころ', img: `${S3}/65/f7798839-e827-4f8a-ba5c-8090c020ba40.jpg` },
  { name: '渋谷さち',   img: `${S3}/64/f29c68e3-22fd-47f6-afb3-dd08f59a2e2b.jpg` },
  { name: '宇佐美りの', img: `${S3}/56/fc983b5c-e0ff-4ed6-866a-3fb513d2fc7c.jpg` },
  { name: '蜜羽うる',   img: `${S3}/75/f3f1fbfd-8cfd-4f06-8e6c-e2d3880ec85b.jpg` },
  { name: '横山みなみ', img: `${S3}/5/736091dc-a029-4744-9c41-18dffb2fd823.jpg` },
  { name: '星月ゆず',   img: `${S3}/10/414ebfa4-23eb-45e7-87a3-de44a983376d.jpg` },
  { name: '月城れい',   img: `${S3}/13/6a215844-5348-4223-8f5a-7c61c81d2d11.jpg` },
  { name: '高月るな',   img: `${S3}/14/8784eddf-1079-475d-a886-e5c0fdbcfb07.jpg` },
  { name: '小島ゆう',   img: `${S3}/15/9485d80b-1277-4dde-990a-01f0b3f62d47.jpg` },
  { name: '永瀬なぎ',   img: `${S3}/16/a86d9d72-a9e0-47ae-9945-95e30082081a.jpg` },
  { name: '前田ももか', img: `${S3}/17/bd85791a-629d-44b5-9d3c-e79996ef209a.jpg` },
  { name: '森澤かや',   img: `${S3}/20/123779fe-91f3-4ece-a445-68463a16b2de.jpg` },
  { name: '七海このは', img: `${S3}/21/6344a01d-02d6-4d0e-93b1-7504cdb1956c.jpg` },
  { name: '白咲みゆう', img: `${S3}/23/a918d4ff-ed8f-4918-85ba-0699a356a8c2.jpg` },
  { name: '竹内りょう', img: `${S3}/24/afa525eb-4f00-4e46-b2ba-7e7b48f05531.jpg` },
  { name: '葉月りいさ', img: `${S3}/25/51eea8a7-9438-4207-9c0c-96029384e261.jpg` },
  { name: '冬月しろは', img: `${S3}/27/45698cf2-a056-4373-90ee-7dfcf6c7ab3c.jpg` },
  { name: '久保さくら', img: `${S3}/28/05fb1fbd-cb46-4a70-b615-0895a2a8e0d7.jpg` },
  { name: '川口ゆり',   img: `${S3}/29/c6d60851-811c-41a3-be47-cb0d9a149e83.jpg` },
  { name: '朝倉まお',   img: `${S3}/30/9eaeaba5-3c29-47fd-a380-f284aedef820.jpg` },
  { name: '石橋うみ',   img: `${S3}/32/d4a3d15a-8bc7-49ab-a10f-fef3382cb97e.jpg` },
  { name: '桜庭ゆあ',   img: `${S3}/33/550405f8-7e9e-4a5a-a1af-8e2d2215399f.jpg` },
  { name: '一条ゆうこ', img: `${S3}/71/0097d208-3bfc-4e0f-8653-970c5ac4f9ad.jpg` },
  { name: '涼宮あさみ', img: `${S3}/85/00b5230d-229f-4ea4-8dcc-99cfaab84954.jpg` },
];

const insert = async (shopId, therapists) => {
  const withPhoto = therapists.filter(t => t.img).length;
  console.log(`\n=== ${shopId} ===`);
  console.log(`${therapists.length}名 (写真: ${withPhoto})`);
  if (DRY) {
    therapists.slice(0, 3).forEach(t => console.log(`  DRY: ${t.name} ${t.img ? '📷' : ''}`));
    return;
  }
  for (let i = 0; i < therapists.length; i += 50) {
    const batch = therapists.slice(i, i + 50).map(t => ({
      id: `${shopId}_${t.name}`,
      shop_id: shopId,
      name: t.name,
      image_url: t.img || null,
    }));
    const { error } = await supabase.from('therapists').upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    if (error) console.error(`  ERROR: ${error.message}`);
    else console.log(`  batch ${Math.floor(i / 50) + 1} OK`);
  }
};

async function main() {
  console.log(DRY ? '=== DRY RUN ===' : '=== LIVE RUN ===');
  await insert('kanagawa_yokohama_the_blanc', BLANC);
  await insert('kanagawa_yokohama_y_prime', YPRIME);
  console.log('\n=== 完了 ===');
}

main().catch(console.error);
