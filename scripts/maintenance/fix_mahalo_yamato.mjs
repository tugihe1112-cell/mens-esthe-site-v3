/**
 * fix_mahalo_yamato.mjs
 * mahalo 大和 9名登録（web_fetchから取得したデータ）
 * 実行: node scripts/maintenance/fix_mahalo_yamato.mjs [--dry-run]
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

const BASE = 'https://mahalo-esthe.com/photo/';

const THERAPISTS = [
  { name: '一色',   img: `${BASE}202601010831186955b246595d8.jpg` },
  { name: '蒼井',   img: `${BASE}202512290646596951a553cc20a.jpg` },
  { name: '乙葉',   img: `${BASE}202601010154346955554a1a566.jpg` },
  { name: '皐月',   img: `${BASE}202601010202516955573b63a0b.jpg` },
  { name: '夏目',   img: `${BASE}202601010804416955ac09bdfb5.jpg` },
  { name: '香椎',   img: `${BASE}20260101020525695557d51a1e5.jpg` },
  { name: '早乙女', img: `${BASE}2026010102105869555922d1928.jpg` },
  { name: '由井',   img: `${BASE}202601010808516955ad0312546.jpg` },
  { name: '葉月',   img: `${BASE}202601010812236955add7e4c14.jpg` },
];

async function main() {
  const shopId = 'kanagawa_yamato_mahalo';
  console.log(DRY ? '=== DRY RUN ===' : '=== LIVE RUN ===');
  console.log(`\n=== mahalo 大和 (${THERAPISTS.length}名) ===`);

  if (DRY) {
    THERAPISTS.forEach(t => console.log(`  DRY: ${t.name} 📷`));
    return;
  }

  const batch = THERAPISTS.map(t => ({
    id: `${shopId}_${t.name}`,
    shop_id: shopId,
    name: t.name,
    image_url: t.img,
  }));
  const { error } = await supabase.from('therapists').upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
  if (error) console.error(`  ERROR: ${error.message}`);
  else console.log(`  batch OK: ${batch.length}件`);

  console.log('\n=== 完了 ===');
}

main().catch(console.error);
