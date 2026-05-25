/**
 * schedule_url が iframe 埋め込み可能か確認
 * X-Frame-Options ヘッダーをチェックする
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: shops } = await supabase
  .from('shops')
  .select('id, name, schedule_url')
  .not('schedule_url', 'is', null)
  .limit(20);

console.log(`schedule_url あり店舗 ${shops?.length}件をチェック\n`);

for (const shop of shops || []) {
  try {
    const res = await fetch(shop.schedule_url, { method: 'HEAD', redirect: 'follow' });
    const xfo = res.headers.get('x-frame-options') || '';
    const csp = res.headers.get('content-security-policy') || '';

    const blocked = xfo.toLowerCase().includes('deny') ||
                    xfo.toLowerCase().includes('sameorigin') ||
                    csp.includes('frame-ancestors');

    const mark = blocked ? '❌ 埋め込み不可' : '✅ 埋め込み可能';
    console.log(`${mark}  ${shop.name}`);
    if (xfo) console.log(`       X-Frame-Options: ${xfo}`);
  } catch (e) {
    console.log(`⚠️  接続失敗  ${shop.name} (${e.message})`);
  }
}
