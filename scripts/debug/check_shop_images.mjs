/**
 * 店舗画像未設定チェック
 * 実行: node scripts/debug/check_shop_images.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: shops } = await supabase.from('shops').select('id, name, image_url').order('id');

const noImage = shops.filter(s => !s.image_url);
const hasImage = shops.filter(s => s.image_url);

console.log(`✅ 画像あり: ${hasImage.length}店舗`);
console.log(`❌ 画像なし: ${noImage.length}店舗\n`);

noImage.forEach(s => console.log(`  [${s.id}] ${s.name}`));
