/**
 * Fix: ゆりかご浜松 — 40名に画像付与 (galImage/{id}/w160.jpg パターン)
 * 実行: node scripts/maintenance/fix_shizuoka_yurikago.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const SHOP_ID = 'shizuoka_hamamatsu_yurikago';
const BASE_URL = 'https://www.yurikago-hamamatsu.com';

// 40 therapists collected from Chrome (galImage pattern)
const THERAPISTS = [
  { name: 'あずさ',       id: '408' },
  { name: 'うずら',       id: '422' },
  { name: 'あやの',       id: '370' },
  { name: 'おりな',       id: '369' },
  { name: 'いくみ',       id: '393' },
  { name: 'うみ',         id: '417' },
  { name: 'いまる',       id: '288' },
  { name: 'おと',         id: '271' },
  { name: 'えま',         id: '419' },
  { name: 'いちか',       id: '245' },
  { name: 'あすか',       id: '213' },
  { name: 'あき',         id: '421' },
  { name: 'あやみ',       id: '201' },
  { name: 'あやべ',       id: '168' },
  { name: 'あづき',       id: '84'  },
  { name: '友菜-ゆな',    id: '29'  },
  { name: 'かほ',         id: '374' },
  { name: 'くみ',         id: '405' },
  { name: 'かなえ',       id: '399' },
  { name: 'くるみ',       id: '197' },
  { name: 'さら',         id: '414' },
  { name: 'とわ',         id: '412' },
  { name: 'ななせ',       id: '46'  },
  { name: 'ひじり',       id: '382' },
  { name: 'ほたる',       id: '256' },
  { name: 'ほなみ',       id: '420' },
  { name: 'みほ',         id: '411' },
  { name: 'まさみ',       id: '354' },
  { name: 'みわ',         id: '396' },
  { name: 'まな',         id: '413' },
  { name: 'まりあ',       id: '195' },
  { name: 'もみじ',       id: '268' },
  { name: 'みつき',       id: '240' },
  { name: 'みゆ',         id: '415' },
  { name: 'ゆず',         id: '210' },
  { name: '由香里-ゆかり', id: '395' },
  { name: 'ゆりな',       id: '351' },
  { name: 'れおな',       id: '326' },
  { name: 'りえ',         id: '372' },
  { name: 'わか',         id: '409' },
];

async function uploadImage(url, fileKey) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': BASE_URL + '/therapist/',
      }
    });
    if (!res.ok) {
      console.log(`  ⚠️ fetch ${res.status}: ${url}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const path = `${fileKey}.jpg`;
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
  console.log(`🌸 ゆりかご浜松 画像付与 (${isDryRun ? 'DRY RUN' : '本実行'})`);

  const { data: existing } = await supabase
    .from('therapists')
    .select('id, name, image_url')
    .eq('shop_id', SHOP_ID);
  const existingMap = new Map((existing || []).map(t => [t.name, t]));
  console.log(`既存: ${existingMap.size}名`);

  let updated = 0, inserted = 0, skipped = 0, errors = 0;

  for (const t of THERAPISTS) {
    const imgUrl = `${BASE_URL}/userImgShop/galImage/${t.id}/w160.jpg`;
    const fileKey = `yurikago_${t.id}`;
    const ex = existingMap.get(t.name);

    if (ex && ex.image_url) {
      console.log(`  = ${t.name} (画像あり スキップ)`);
      skipped++;
      continue;
    }

    if (ex) {
      console.log(`  u ${t.name} (画像更新)`);
    } else {
      console.log(`  + ${t.name} (新規登録)`);
    }
    if (isDryRun) continue;

    const storageUrl = await uploadImage(imgUrl, fileKey);
    console.log(`    画像: ${storageUrl ? '✅' : '❌ null'}`);

    if (ex) {
      const { error } = await supabase
        .from('therapists')
        .update({ image_url: storageUrl })
        .eq('id', ex.id);
      if (error) { console.log(`    DBエラー: ${error.message}`); errors++; }
      else updated++;
    } else {
      const { error } = await supabase.from('therapists').upsert({
        id: `${SHOP_ID}_${t.name}`,
        shop_id: SHOP_ID,
        name: t.name,
        image_url: storageUrl,
      });
      if (error) { console.log(`    DBエラー: ${error.message}`); errors++; }
      else inserted++;
    }
  }

  console.log(`\n✅ 完了: 新規+${inserted} 更新u${updated} スキップ=${skipped} エラー=${errors}`);
}

main().catch(console.error);
