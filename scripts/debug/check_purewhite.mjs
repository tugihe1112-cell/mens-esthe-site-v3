import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

// DB確認
const { data } = await supabase.from('shops').select('id,name,image_url,price_system').eq('id','kyoto_senbon_sanjo_pure_white').single();
console.log('DB:', JSON.stringify(data));

// OGP/ロゴ確認
const res = await fetch('http://purewhite-aroma.com', { headers: ua });
const html = await res.text();
const $ = cheerio.load(html);
console.log('og:image:', $('meta[property="og:image"]').attr('content'));
$('img').slice(0, 8).each((_, el) => console.log(`img: [${$(el).attr('alt')}] ${$(el).attr('src')}`));
