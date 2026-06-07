/**
 * ADAMAS (中野) 画像修正スクリプト
 * wp-content/uploads はホットリンク保護あり → Referer付きでStorage移行
 *
 * 実行:
 *   node scripts/maintenance/fix_adamas_images.mjs --dry-run
 *   node scripts/maintenance/fix_adamas_images.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const SHOP_ID = 'tokyo_nakano_nakano_adamas';
const BASE = 'https://a-adamas.com';

const THERAPISTS = [
  { name: '葉月ななみ', src: 'https://a-adamas.com/wp-content/uploads/2025/08/49529a346bd67407f473a19805d4beed.jpg' },
  { name: '並木いろは', src: 'https://a-adamas.com/wp-content/uploads/2024/10/546598baf2e72b448d3b02bbe9eb46c0.jpg' },
  { name: '戸田ゆいか', src: 'https://a-adamas.com/wp-content/uploads/2026/04/S__62939139.jpg' },
  { name: '花園いずみ', src: 'https://a-adamas.com/wp-content/uploads/2024/03/a311eaf9452da5501f569077c3de737c.jpg' },
  { name: '村瀬あゆみ', src: 'https://a-adamas.com/wp-content/uploads/2026/01/IMG_9438.jpeg' },
  { name: '美咲めいさ', src: 'https://a-adamas.com/wp-content/uploads/2025/08/d602bf90a39e5b5aee9a6389b3dcc369.jpg' },
  { name: '柴崎みらい', src: 'https://a-adamas.com/wp-content/uploads/2026/03/d1a6d7867d587966d412cea69723dd4f.jpg' },
  { name: '水城じゅり', src: 'https://a-adamas.com/wp-content/uploads/2025/07/0d1a20d96d026094c84d1c77eeef230b.jpg' },
  { name: '瀧本あんな', src: 'https://a-adamas.com/wp-content/uploads/2026/04/ee091277c8ee56b7ff17bd7c4a6b3f71.jpg' },
  { name: '浜辺りお',   src: 'https://a-adamas.com/wp-content/uploads/2026/04/da8fb5f869dc9c901dde849578d31586.jpg' },
  { name: '楠すず',     src: 'https://a-adamas.com/wp-content/uploads/2026/02/35af2fab13ad24a547fdda3f330abad0.jpg' },
  { name: '音島ひとみ', src: 'https://a-adamas.com/wp-content/uploads/2026/05/9a5e4f6e934172594542bc5bf0f6a7ac.jpg' },
  { name: '上原あかり', src: 'https://a-adamas.com/wp-content/uploads/2026/03/ca3df5427b58a8d73c69d18c0c4fa31d.jpg' },
  { name: '川井もな',   src: 'https://a-adamas.com/wp-content/uploads/2025/05/d1e1b63e62deeed99013bbcc2cfd8af0.jpg' },
  { name: '白花うい',   src: 'https://a-adamas.com/wp-content/uploads/2025/06/d08c2c1204fb291810db8ac544c74700.jpg' },
  { name: '七海えみか', src: 'https://a-adamas.com/wp-content/uploads/2024/03/58f632d6bd3988c9990e89a3fd4950c8.jpg' },
  { name: '咲間ゆの',   src: 'https://a-adamas.com/wp-content/uploads/2024/07/eb17bc0d0befc300ac4295672075f2a0.jpg' },
  { name: '水野ゆめ',   src: 'https://a-adamas.com/wp-content/uploads/2024/03/e217963fc74f45bfc5333d4667aa5526.jpg' },
  { name: '柊まどか',   src: 'https://a-adamas.com/wp-content/uploads/2026/04/33f8a5b8ea629ac48de86a13afd6c79d.jpg' },
  { name: '白咲るな',   src: 'https://a-adamas.com/wp-content/uploads/2025/01/9cc40936af5ff5d0e1f5079f1bf74af7.jpg' },
  { name: '姫野えま',   src: 'https://a-adamas.com/wp-content/uploads/2025/11/IMG_8984.jpeg' },
  { name: '仁科みあ',   src: 'https://a-adamas.com/wp-content/uploads/2025/09/IMG_2316.jpeg' },
  { name: '士道あやめ', src: 'https://a-adamas.com/wp-content/uploads/2026/02/d0f13afe7b6acd966cca48f6b9887644.jpg' },
  { name: '音羽うた',   src: 'https://a-adamas.com/wp-content/uploads/2025/05/d1585553c410dccfb8e4c2a8d4d8e082.jpg' },
];

async function uploadImage(imgUrl, key) {
  try {
    const res = await fetch(imgUrl, {
      headers: {
        'Referer': BASE + '/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('.').pop().split('?')[0].toLowerCase();
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const storageKey = `${key}.${ext === 'jpeg' ? 'jpg' : ext}`;
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write('!'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(storageKey);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function main() {
  console.log(`=== ADAMAS 画像修正 (DRY_RUN=${DRY_RUN}) ===`);
  console.log(`対象: ${THERAPISTS.length}名\n`);

  if (DRY_RUN) {
    THERAPISTS.forEach(t => console.log(`  [DRY] ${t.name} → ${t.src}`));
    return;
  }

  let upd = 0, skip = 0, err = 0;
  for (const t of THERAPISTS) {
    const tid = `${SHOP_ID}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (!ex) { process.stdout.write('?'); err++; continue; }
    if (ex.image_url && !ex.image_url.includes('spacer')) { process.stdout.write('='); skip++; continue; }

    const basename = t.src.split('/').pop().replace(/\.[^.]+$/, '');
    const key = `adamas_${basename}`;
    const url = await uploadImage(t.src, key);

    if (url) {
      const { error: updErr } = await supabase.from('therapists').update({ image_url: url }).eq('id', tid);
      if (updErr) { console.error(`\n✗ ${t.name}: ${updErr.message}`); err++; }
      else { process.stdout.write('+'); upd++; }
    } else {
      err++;
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n\n=== 完了 ===`);
  console.log(`更新: ${upd} / スキップ: ${skip} / エラー: ${err}`);
}
main().catch(console.error);
