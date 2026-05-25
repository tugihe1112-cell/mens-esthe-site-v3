/**
 * 残り10店舗をGETリクエストで再試行
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const tryGet = async (url) => {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(6000) });
    return res.ok ? url : null;
  } catch { return null; }
};

// 各店舗の追加パターン（GET）
const CHECKS = [
  // ARENA SPA - /s 自体がスケジュール
  { id: 'miyagi_sendai_arena_spa', urls: ['https://arena-spa.com/s/', 'https://arena-spa.com/schedule/', 'https://arena-spa.com/cast/'] },
  // Aroma Rich
  { id: 'miyagi_sendai_aroma_rich', urls: ['https://rich-sendai.com/schedule/', 'https://rich-sendai.com/s/', 'https://rich-sendai.com/cast/', 'https://rich-sendai.com/schedule.html', 'https://rich-sendai.com/girls/'] },
  // UraSanEsu 2店舗 (同じサイト)
  { id: 'tokyo_setagaya_urasanesu_shimokita', urls: ['https://shimoesu.com/schedule/', 'https://shimoesu.com/s/', 'https://shimoesu.com/cast/'] },
  { id: 'tokyo_shibuya_urasanes', urls: ['https://shimoesu.com/schedule/', 'https://shimoesu.com/s/', 'https://shimoesu.com/cast/'] },
  // Mirajour - /itemList.html に対応して /scheduleList.html?
  { id: '60026', urls: ['https://total-beauty-salon.net/scheduleList.html', 'https://total-beauty-salon.net/schedule/', 'https://total-beauty-salon.net/schedule.html', 'https://total-beauty-salon.net/s/'] },
  // ムーブプラス
  { id: '60339', urls: ['https://move-plus.site/schedule/', 'https://move-plus.site/s/', 'https://move-plus.site/cast/', 'https://move-plus.site/schedule.html'] },
  // 僕のママスパ (Wix)
  { id: 'osaka_umeda_my_mama_spa', urls: ['https://higashiyama1250.wixsite.com/home/schedule', 'https://higashiyama1250.wixsite.com/home/blank'] },
  // Natural Organic Spa - website_url未設定だが実URLは判明
  { id: 'tokyo_shinjuku_shinjuku_natural_organic_spa', urls: ['https://naturalorganicspa-sjk.com/schedule/', 'https://naturalorganicspa-sjk.com/schedule.php', 'https://naturalorganicspa-sjk.com/s/', 'https://naturalorganicspa-sjk.com/cast/'] },
];

for (const { id, urls } of CHECKS) {
  const { data } = await supabase.from('shops').select('name').eq('id', id).single();
  console.log(`\n📍 ${data?.name} (${id})`);
  for (const url of urls) {
    const result = await tryGet(url);
    if (result) console.log(`   ✅ ${url}`);
    else console.log(`   ❌ ${url}`);
  }
}

console.log('\n📍 キャンディスパ → website_url不明のため手動確認が必要');
console.log('📍 No Brand → no-brand.jp サイトダウン中のため対応不可');
