/**
 * schedule_url が未設定の54店舗に対して
 * 1. 同一ドメインの姉妹店のschedule_urlを参照
 * 2. 共通パターン（/schedule/ など）を試す
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// schedule_url がない店舗
const { data: noSchedule } = await supabase
  .from('shops')
  .select('id, name, website_url')
  .is('schedule_url', null);

// schedule_url がある店舗（参照用）
const { data: withSchedule } = await supabase
  .from('shops')
  .select('id, name, website_url, schedule_url')
  .not('schedule_url', 'is', null);

// ドメイン抽出
const getDomain = (url) => {
  try { return new URL(url).hostname; } catch { return null; }
};

// ドメイン→schedule_urlのマップ（既存店舗から）
const domainToSchedule = {};
for (const s of withSchedule || []) {
  const d = getDomain(s.website_url);
  if (d && !domainToSchedule[d]) domainToSchedule[d] = [];
  if (d) domainToSchedule[d].push(s.schedule_url);
}

// 共通パターン候補
const COMMON_PATTERNS = ['/schedule/', '/s/', '/cast/schedule/', '/schedule.html', '/cast/', '/girls/schedule/'];

const tryUrl = async (url) => {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(5000) });
    return res.ok ? url : null;
  } catch { return null; }
};

console.log(`=== schedule_url 未設定 ${noSchedule?.length}店舗の候補調査 ===\n`);

const suggestions = [];

for (const shop of noSchedule || []) {
  const domain = getDomain(shop.website_url);
  const base = shop.website_url?.replace(/\/$/, '') || '';

  // 姉妹店参照
  const sisterSchedules = domain ? domainToSchedule[domain] : null;
  if (sisterSchedules?.length) {
    // 姉妹店のschedule_urlのベースドメインが同じなら流用候補
    const uniqueSisterUrls = [...new Set(sisterSchedules)];
    console.log(`✅ [姉妹店参照] ${shop.name}`);
    uniqueSisterUrls.forEach(u => console.log(`   候補: ${u}`));
    suggestions.push({ shop, type: 'sister', urls: uniqueSisterUrls });
    continue;
  }

  if (!base) {
    console.log(`⚠️  [URL不明] ${shop.name}`);
    suggestions.push({ shop, type: 'unknown', urls: [] });
    continue;
  }

  // 共通パターン試行
  console.log(`🔍 [パターン試行] ${shop.name} (${base})`);
  const found = [];
  for (const pattern of COMMON_PATTERNS) {
    const candidate = base + pattern;
    const result = await tryUrl(candidate);
    if (result) {
      console.log(`   ✅ ${candidate}`);
      found.push(candidate);
      break; // 最初に見つかったものを使用
    }
  }
  if (!found.length) {
    console.log(`   ❌ 自動検出不可 → 手動確認が必要`);
  }
  suggestions.push({ shop, type: 'pattern', urls: found });
}

// サマリー
console.log('\n=== サマリー ===');
const sister = suggestions.filter(s => s.type === 'sister');
const pattern = suggestions.filter(s => s.type === 'pattern' && s.urls.length);
const manual = suggestions.filter(s => s.type === 'unknown' || (s.type === 'pattern' && !s.urls.length));

console.log(`姉妹店参照で解決: ${sister.length}件`);
console.log(`パターン検出: ${pattern.length}件`);
console.log(`手動確認必要: ${manual.length}件`);
manual.forEach(s => console.log(`  - ${s.shop.name} | ${s.shop.website_url || 'URL不明'}`));
