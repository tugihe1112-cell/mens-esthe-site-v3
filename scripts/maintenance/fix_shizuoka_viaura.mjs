/**
 * Fix: ミセス美オーラ — 95名全員登録+画像付与 (gallery/{id}/girls_img_1.jpg パターン)
 * 実行: node scripts/maintenance/fix_shizuoka_viaura.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const SHOP_ID = 'shizuoka_hamamatsu_viaura';
const BASE_URL = 'https://viaura-hamamatsu.com';

// 95 therapists collected from Chrome (name★reading → use name only)
const THERAPISTS = [
  { name: '小鳥遊', id: '474' },
  { name: '西',     id: '473' },
  { name: '本城',   id: '475' },
  { name: '花梨',   id: '472' },
  { name: '二階堂', id: '470' },
  { name: '楠木',   id: '469' },
  { name: '源',     id: '468' },
  { name: '月美',   id: '467' },
  { name: '瑠依',   id: '465' },
  { name: '水城',   id: '466' },
  { name: '志尊',   id: '464' },
  { name: '田原',   id: '463' },
  { name: '平良',   id: '461' },
  { name: '枢木',   id: '460' },
  { name: '鈴野',   id: '459' },
  { name: '北川',   id: '262' },
  { name: '泉輝',   id: '270' },
  { name: '松本',   id: '364' },
  { name: '井川',   id: '220' },
  { name: '椎名',   id: '318' },
  { name: '朝日',   id: '411' },
  { name: '千念',   id: '373' },
  { name: '小町',   id: '403' },
  { name: '苗木',   id: '383' },
  { name: '橋本',   id: '278' },
  { name: '岩田',   id: '371' },
  { name: '周防',   id: '428' },
  { name: '葉月',   id: '316' },
  { name: '伊織',   id: '382' },
  { name: '樹里',   id: '355' },
  { name: '大森',   id: '452' },
  { name: '栗山',   id: '301' },
  { name: '凪',     id: '446' },
  { name: '片岡',   id: '285' },
  { name: '片瀬',   id: '317' },
  { name: '後藤',   id: '443' },
  { name: '菖蒲',   id: '458' },
  { name: '志摩',   id: '385' },
  { name: '友菜',   id: '424' },
  { name: '結生',   id: '235' },
  { name: '友坂',   id: '441' },
  { name: '千景',   id: '254' },
  { name: '横山',   id: '451' },
  { name: '七瀬',   id: '387' },
  { name: '真菜',   id: '435' },
  { name: '晴美',   id: '360' },
  { name: '河合',   id: '394' },
  { name: '瀬奈',   id: '444' },
  { name: '千葉',   id: '366' },
  { name: '松村',   id: '219' },
  { name: '尾崎',   id: '363' },
  { name: '美波',   id: '322' },
  { name: '平井',   id: '409' },
  { name: '美咲',   id: '416' },
  { name: '大原',   id: '438' },
  { name: '愛川',   id: '328' },
  { name: '吉野',   id: '319' },
  { name: '板倉',   id: '277' },
  { name: '由良',   id: '420' },
  { name: '相田',   id: '445' },
  { name: '美衣名', id: '454' },
  { name: '長谷川', id: '380' },
  { name: '彩咲',   id: '296' },
  { name: '百合',   id: '405' },
  { name: '宮本',   id: '336' },
  { name: '永瀬',   id: '427' },
  { name: '若槻',   id: '390' },
  { name: '真夜',   id: '455' },
  { name: '須田',   id: '439' },
  { name: '橘',     id: '339' },
  { name: '山根',   id: '399' },
  { name: '目黒',   id: '369' },
  { name: '中村',   id: '297' },
  { name: '桜',     id: '376' },
  { name: '高橋',   id: '395' },
  { name: '未来',   id: '418' },
  { name: '最上',   id: '430' },
  { name: '柊',     id: '348' },
  { name: '綾瀬',   id: '353' },
  { name: '黒木',   id: '426' },
  { name: '三原',   id: '311' },
  { name: '神宮寺', id: '423' },
  { name: '加奈',   id: '419' },
  { name: '響',     id: '378' },
  { name: '百瀬',   id: '218' },
  { name: '椿',     id: '252' },
  { name: '竹山',   id: '349' },
  { name: '深瀬',   id: '256' },
  { name: '浜崎',   id: '386' },
  { name: '環奈',   id: '421' },
  { name: '葵',     id: '456' },
  { name: '綾波',   id: '457' },
  { name: '安斉',   id: '321' },
  { name: '梓',     id: '448' },
  { name: '向日葵', id: '115' },
];

async function uploadImage(url, fileKey) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': BASE_URL + '/',
      }
    });
    if (!res.ok) {
      console.log(`  ⚠️ fetch ${res.status}: ${url}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = 'jpg';
    const path = `${fileKey}.${ext}`;
    const { error } = await supabase.storage
      .from('therapist-images')
      .upload(path, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.log(`  ⚠️ storage: ${error.message}`); return null; }
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(path);
    return publicUrl;
  } catch (e) {
    console.log(`  ⚠️ error: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log(`💆 ミセス美オーラ 95名 登録+画像付与 (${isDryRun ? 'DRY RUN' : '本実行'})`);

  const { data: existing } = await supabase
    .from('therapists')
    .select('id, name, image_url')
    .eq('shop_id', SHOP_ID);
  const existingMap = new Map((existing || []).map(t => [t.name, t]));
  console.log(`既存: ${existingMap.size}名`);

  let inserted = 0, updated = 0, skipped = 0;

  for (const t of THERAPISTS) {
    const imgUrl = `${BASE_URL}/img/gallery/${t.id}/girls_img_1.jpg`;
    const fileKey = `viaura_${t.id}`;
    const therapistId = `${SHOP_ID}_${t.name}`;
    const ex = existingMap.get(t.name);

    if (ex && ex.image_url) {
      console.log(`  = ${t.name} (既存+画像あり スキップ)`);
      skipped++;
      continue;
    }

    const action = ex ? '画像更新' : '新規登録';
    console.log(`  ${ex ? 'u' : '+'} ${t.name} (id=${t.id}) ${action}`);
    if (isDryRun) continue;

    const storageUrl = await uploadImage(imgUrl, fileKey);
    console.log(`    画像: ${storageUrl ? '✅' : '❌ null'}`);

    if (ex) {
      // Update existing record's image_url
      const { error } = await supabase
        .from('therapists')
        .update({ image_url: storageUrl })
        .eq('id', ex.id);
      if (error) console.log(`    DBエラー: ${error.message}`);
      else updated++;
    } else {
      const { error } = await supabase.from('therapists').upsert({
        id: therapistId,
        shop_id: SHOP_ID,
        name: t.name,
        image_url: storageUrl,
      });
      if (error) console.log(`    DBエラー: ${error.message}`);
      else inserted++;
    }
  }

  console.log(`\n✅ 完了: 新規+${inserted} 更新u${updated} スキップ=${skipped}`);
}

main().catch(console.error);
