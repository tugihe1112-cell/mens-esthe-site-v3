import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

// 北海道 既登録チェック
const { data: existing } = await supabase.from('shops')
  .select('id,name,website_url')
  .or("raw_data->>prefecture.eq.北海道,id.like.hokkaido%");

console.log('=== 北海道 既登録店舗 ===');
if (!existing?.length) {
  console.log('0件（未登録）');
} else {
  existing.forEach(s => console.log(`  ${s.id} | ${s.name} | ${s.website_url}`));
}

// ドメインで照合
const domains = [
  'latte-sapporo.com',
  'chocolat-esthe.com',
  'esthetic-labo.net',
  'belleliser.com',
  'aroma-ria.com',
  'coscosmenes.com',
  'flan-sapporo.com',
  'goddess-bless.com',
  'idoldream.officialblog.jp',
  'madamnote.ap1hp.com',
];

console.log('\n=== ドメイン照合 ===');
for (const domain of domains) {
  const { data } = await supabase.from('shops').select('id,name').ilike('website_url', `%${domain}%`);
  console.log(`  ${domain}: ${data?.length ? data.map(s=>s.id).join(',') : '❌ 未登録'}`);
}
