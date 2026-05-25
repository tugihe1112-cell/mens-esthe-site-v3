/**
 * schedule_url 未設定の残り10店舗を調査
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const IDS = [
  '60026',
  'miyagi_sendai_arena_spa',
  'miyagi_sendai_aroma_rich',
  'tokyo_setagaya_urasanesu_shimokita',
  'osaka_umeda_my_mama_spa',
  'tokyo_candy_spa',
  'tokyo_dispatch_outside_no_brand',
  'tokyo_shibuya_urasanes',
  '60339',
  'tokyo_shinjuku_shinjuku_natural_organic_spa',
];

const { data } = await supabase
  .from('shops')
  .select('id, name, website_url, raw_data')
  .in('id', IDS);

const tryUrl = async (url) => {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch { return false; }
};

// 店舗ごとに試すパターン
const EXTRA_PATTERNS = [
  '/schedule/', '/schedule.html', '/scheduleList.html', '/schedule.php',
  '/s/', '/s/schedule/', '/cast/', '/cast/schedule/',
  '/girls/schedule/', '/girl/', '/top/',
];

for (const shop of data || []) {
  const raw = shop.raw_data || {};
  const base = (shop.website_url || raw.url || raw.website || '').replace(/\/$/, '');
  console.log(`\n📍 ${shop.name} (${shop.id})`);
  console.log(`   website: ${base || '不明'}`);
  if (raw.schedule_url) console.log(`   raw_data.schedule_url: ${raw.schedule_url}`);

  if (!base) { console.log('   ❌ URLなし'); continue; }

  for (const pat of EXTRA_PATTERNS) {
    const url = base + pat;
    const ok = await tryUrl(url);
    if (ok) { console.log(`   ✅ ${url}`); }
  }
}
