/**
 * 店舗の公式URL欠落と、在籍セラピスト名簿の最終確認日を毎日監視する。
 * 画像が配信できるかだけでなく「古い在籍情報を正常に表示し続ける」事故を検知する。
 *
 * 【2026-09-16 追加】無関係な店が1つのブランドに混ざっていないかも毎日見る。
 *  `group_id` が `other` という文字列だったせいで、本番の `/brands/other` が
 *  「THE HALF ／ 2ルーム ／ セラピスト229名」（THE HALF 113名 + キャンディスパ 116名）に
 *  なっていた。D-014により `/shops/tokyo_candy_spa` はその THE HALF のページへ301していた。
 *  **壊れた形でも画面は正常に描画される**ので、ページを見ても気づけない。
 *  取り込みがまた置き場所の無い値を書いたら翌日ここで出す。
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { classifyGroup, selfTestMatching } from '../lib/brandNameMatch.mjs';

// ── 何を見るか（2026-09-21 分割）────────────────────────────────────
// 以前は4つの判定を毎日まとめて走らせ、画像監視（image-health.yml）の1ステップにしていた。
// ところが「180日超未確認」は**ゆっくり進む劣化**で、名簿を取り直すまで毎日赤になる。
// 同じワークフローの赤なので、**本当に画像が壊れても同じ失敗メールになって見分けがつかない**
// （実際、失敗通知はゴミ箱に溜まっていた）。基準は緩めずに、見る頻度で分ける:
//   integrity … 取り込み1回で壊れうるもの（毎日）: 公式URLなし率／最終確認日なし／無関係な店の混入
//   staleness … 日単位では動かないもの（週1・roster-freshness.yml）: 180日超未確認の率
// 指定なしは両方（手元で全部見るとき）。**知らない値はその場で止める**
// （2026-09-20、知らない引数を黙って捨てる道具で、指定したつもりの検査が走らなかった）。
const CHECK_GROUPS = ['integrity', 'staleness'];
function parseChecks(argv) {
  const arg = argv.find((a) => a.startsWith('--checks='));
  const unknownFlags = argv.filter((a) => a.startsWith('--') && !a.startsWith('--checks='));
  if (unknownFlags.length) throw new Error(`知らない引数: ${unknownFlags.join(' ')}（使えるのは --checks=${CHECK_GROUPS.join(',')}）`);
  if (!arg) return new Set(CHECK_GROUPS);
  const picked = arg.slice('--checks='.length).split(',').map((v) => v.trim()).filter(Boolean);
  const bad = picked.filter((v) => !CHECK_GROUPS.includes(v));
  if (!picked.length || bad.length) {
    throw new Error(`--checks の値が不正: ${bad.join(',') || '(空)'}（使えるのは ${CHECK_GROUPS.join(',')}）`);
  }
  return new Set(picked);
}
let CHECKS;
try {
  CHECKS = parseChecks(process.argv.slice(2));
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}

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

// 🚩 突き合わせ方の自己診断は**DBに触る前**。壊れていたら監視そのものを失敗させる。
//    「同じブランドを無関係と言う」監視は、黙って通る監視より害が大きい。
{
  const problems = selfTestMatching();
  if (problems.length) {
    console.error('❌ ブランド突き合わせの判定が壊れています（scripts/lib/brandNameMatch.mjs）:');
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }
}

const WEBSITE_MISSING_MAX_PCT = Number(process.env.SHOP_WEBSITE_MISSING_MAX_PCT || 1);
const STALE_180_MAX_PCT = Number(process.env.THERAPIST_STALE_180_MAX_PCT || 5);

async function countOf(table, configure = (query) => query) {
  const { count, error } = await configure(
    supabase.from(table).select('id', { count: 'exact', head: true }),
  );
  if (error) throw new Error(`${table}: ${error.message}`);
  return count || 0;
}

// ⚠️ PostgREST は1回に最大1000行しか返さない。range で最後まで繰る。
async function fetchAllShops() {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from('shops').select('id, group_id, name').range(from, from + 999);
    if (error) throw new Error(`shops: ${error.message}`);
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function findMixedGroups() {
  const shops = await fetchAllShops();
  const groups = new Map();
  for (const s of shops) {
    if (!s.group_id) continue;
    if (!groups.has(s.group_id)) groups.set(s.group_id, []);
    groups.get(s.group_id).push(s);
  }
  const mixed = [];
  for (const [gid, rooms] of groups) {
    // ⚠️ 'renamed'（改名・2ブランド運営の疑い）では**落とさない**。
    //    人が公式サイトを見て決めることで、機械が毎日赤くする種類の話ではない。
    //    落とすのは 'mixed'（名前もidも共通部分が無い＝明らかな混入）だけ。
    if (classifyGroup({ gid, rooms }).verdict === 'mixed') mixed.push({ gid, rooms });
  }
  return mixed;
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

  console.log(`■ 見る範囲: ${[...CHECKS].join(', ')}`);
  if (CHECKS.has('integrity')) {
    console.log('■ 店舗ソース');
    console.log(`  公式URLなし ${missingWebsite}/${shopTotal}店 (${websiteMissingPct.toFixed(1)}%)`);
    console.log(`  スケジュールURLなし ${missingSchedule}/${shopTotal}店`);
    console.log('■ 在籍名簿（取り込みの不備）');
    console.log(`  最終確認日なし ${missingLastSeen}/${activeTotal}名`);
  }
  if (CHECKS.has('staleness')) {
    console.log('■ 在籍名簿の鮮度');
    console.log(`  180日超未確認 ${stale180}/${activeTotal}名 (${stale180Pct.toFixed(1)}%)`);
  }

  const mixedGroups = CHECKS.has('integrity') ? await findMixedGroups() : [];
  if (CHECKS.has('integrity')) {
    console.log('■ ブランドのまとまり');
    console.log(`  無関係な店が混ざっているブランド ${mixedGroups.length}件`);
    for (const g of mixedGroups) {
      console.log(`    group_id=${g.gid}: ${g.rooms.map((r) => r.name).join(' ／ ')}`);
    }
  }

  const failures = [];
  for (const g of mixedGroups) {
    failures.push(
      `group_id=${g.gid} に無関係な店が混ざっています（${g.rooms.map((r) => `${r.name}[${r.id}]`).join(' / ')}）`
      + ' … /brands/' + g.gid + ' で在籍者が混ざり、店舗URLが別の店へ301します',
    );
  }
  if (CHECKS.has('integrity')) {
    if (websiteMissingPct > WEBSITE_MISSING_MAX_PCT) {
      failures.push(`公式URLなしが${websiteMissingPct.toFixed(1)}%（上限${WEBSITE_MISSING_MAX_PCT}%）`);
    }
    if (missingLastSeen > 0) failures.push(`在籍中なのにlast_seen_atが無いセラピストが${missingLastSeen}名`);
  }
  if (CHECKS.has('staleness') && stale180Pct > STALE_180_MAX_PCT) {
    failures.push(`180日超未確認の在籍セラピストが${stale180Pct.toFixed(1)}%（上限${STALE_180_MAX_PCT}%）`
      + ' … 名簿の取り直しは scripts/maintenance/reconcile_therapists.mjs（確認できた人の last_seen_at が進む）');
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
