import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

// ゆりかご を名前で検索
const { data: yurikago } = await supabase.from('shops').select('id,name,website_url,image_url').ilike('name', '%ゆりかご%');
console.log('ゆりかご DB:', JSON.stringify(yurikago));

// Pure White のセラピスト確認（画像あるか）
const { data: pwTherapists } = await supabase.from('therapists').select('id,name,image_url').eq('shop_id','kyoto_senbon_sanjo_pure_white').limit(5);
console.log('\nPure White therapists (先頭5):', JSON.stringify(pwTherapists));

// Pure White /cast/ ページ構造
console.log('\n=== Pure White /cast/ ===');
const r1 = await fetch('https://purewhite-aroma.com/cast/', { headers: ua });
const h1 = await r1.text();
const $1 = cheerio.load(h1);
console.log('img数:', $1('img').length);
$1('img').slice(0,8).each((_, el) => console.log(`  [${$1(el).attr('alt')}] ${$1(el).attr('src')?.slice(0,80)}`));
console.log('a[href*=cast] 先頭5:', $1('a[href*="cast"]').map((_,el)=>$1(el).attr('href')).get().slice(0,5));

// ゆりかご /therapist/ ページ構造
console.log('\n=== ゆりかご /therapist/ ===');
const r2 = await fetch('https://yurikago-kyoto.com/therapist/', { headers: ua });
const h2 = await r2.text();
const $2 = cheerio.load(h2);
console.log('status:', r2.status);
console.log('img数:', $2('img').length);
$2('img').slice(0,8).each((_, el) => console.log(`  [${$2(el).attr('alt')}] ${$2(el).attr('src')?.slice(0,80)}`));
const cms = h2.includes('caskan') ? 'caskan' : h2.includes('3days') ? '3days' : h2.includes('men-es.jp') ? 'men-es' : h2.includes('wp-content') ? 'wordpress' : h2.includes('wcms') ? 'wcms' : 'generic';
console.log('CMS:', cms);
