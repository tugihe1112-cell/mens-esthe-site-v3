/**
 * 店舗の公式URL欠落と、在籍セラピスト名簿の最終確認日を毎日監視する。
 * 画像が配信できるかだけでなく「古い在籍情報を正常に表示し続ける」事故を検知する。
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function env(key) {
  if (process.env[key]) return process.env[key];
  try {
    const source = fs.readFileSync('.env', 'utf8');
    return source.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '') || '';
  } catch {
    return '';
  }
}

const supabaseUrl = env('VITE_SUPABASE_URL');
const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Supabaseのサーバー接続情報がありません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const WEBSITE_MISSING_MAX_PCT = Number(process.env.SHOP_WEBSITE_MISSING_MAX_PCT || 1);
const STALE_180_MAX_PCT = Number(process.env.THERAPIST_STALE_180_MAX_PCT || 5);

async function countOf(table, configure = (query) => query) {
  const { count, error } = await configure(
    supabase.from(table).select('id', { count: 'exact', head: true }),
  );
  if (error) throw new Error(`${table}: ${error.message}`);
  return count || 0;
}

async function main() {
  const staleBefore = new Date(Date.now() - 180 * 86_400_000).toISOString();
  const [
    shopTotal,
    websiteNull,
    websiteBlank,
    scheduleNull,
    scheduleBlank,
    activeTotal,
    missingLastSeen,
    stale180,
  ] = await Promise.all([
    countOf('shops'),
    countOf('shops', (q) => q.is('website_url', null)),
    countOf('shops', (q) => q.eq('website_url', '')),
    countOf('shops', (q) => q.is('schedule_url', null)),
    countOf('shops', (q) => q.eq('schedule_url', '')),
    countOf('therapists', (q) => q.or('is_active.is.null,is_active.eq.true')),
    countOf('therapists', (q) => q.or('is_active.is.null,is_active.eq.true').is('last_seen_at', null)),
    countOf('therapists', (q) => q.or('is_active.is.null,is_active.eq.true').lt('last_seen_at', staleBefore)),
  ]);

  const missingWebsite = websiteNull + websiteBlank;
  const missingSchedule = scheduleNull + scheduleBlank;
  const websiteMissingPct = shopTotal ? missingWebsite / shopTotal * 100 : 0;
  const stale180Pct = activeTotal ? stale180 / activeTotal * 100 : 0;

  console.log('■ 店舗ソース');
  console.log(`  公式URLなし ${missingWebsite}/${shopTotal}店 (${websiteMissingPct.toFixed(1)}%)`);
  console.log(`  スケジュールURLなし ${missingSchedule}/${shopTotal}店`);
  console.log('■ 在籍名簿の鮮度');
  console.log(`  最終確認日なし ${missingLastSeen}/${activeTotal}名`);
  console.log(`  180日超未確認 ${stale180}/${activeTotal}名 (${stale180Pct.toFixed(1)}%)`);

  const failures = [];
  if (websiteMissingPct > WEBSITE_MISSING_MAX_PCT) {
    failures.push(`公式URLなしが${websiteMissingPct.toFixed(1)}%（上限${WEBSITE_MISSING_MAX_PCT}%）`);
  }
  if (missingLastSeen > 0) failures.push(`在籍中なのにlast_seen_atが無いセラピストが${missingLastSeen}名`);
  if (stale180Pct > STALE_180_MAX_PCT) {
    failures.push(`180日超未確認の在籍セラピストが${stale180Pct.toFixed(1)}%（上限${STALE_180_MAX_PCT}%）`);
  }

  if (failures.length) {
    console.error('\n🚨 データ鮮度チェック失敗:');
    failures.forEach((failure) => console.error(`  - ${failure}`));
    process.exit(1);
  }
  console.log('\n✅ データ鮮度チェック OK');
}

main().catch((error) => {
  console.error('❌', error.message);
  process.exit(1);
});
