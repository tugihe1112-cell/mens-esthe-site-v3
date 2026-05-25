import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// 1. 10ct RESORTの誤ったセラピスト確認
const { data: t10ct } = await supabase.from('therapists').select('id,name').eq('shop_id','hyogo_sannomiya_10ct_resort');
console.log('10ct RESORT therapists:', JSON.stringify(t10ct));

// 2. KOBE QUEENの店舗画像候補
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };
const res = await fetch('https://kobe-queen.net/', { headers: ua });
const html = await res.text();
const $ = cheerio.load(html);
console.log('\nKOBE QUEEN OGP image:', $('meta[property="og:image"]').attr('content'));
const imgs = [];
$('img').each((_, el) => { const s = $(el).attr('src'); if (s) imgs.push(s); });
console.log('KOBE QUEEN images:', imgs.slice(0, 15));
