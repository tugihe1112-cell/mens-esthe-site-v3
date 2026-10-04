import { SSR_DB_TIMEOUT_MS } from './supabaseServer.js';
import { PREF_TO_SLUG } from '../src/data/areaLinks.js';
import {
  groupReviewsByPref, buildLatestFeed, summarizeReviewIndex, FEED_FETCH, REVIEW_INDEX_LIMIT,
} from '../src/utils/homeReviews.js';
import { getDisplayName } from '../src/utils/shopHelpers.js';

const PLACEHOLDER_NAMES = new Set(['owner_manual', 'mensest_user', 'menesthe_import', 'menesthe_rewritten', '匿名', '']);

function isTransient(result) {
  const error = result?.error;
  // 時間切れは再試行で10秒の上限を延ばさない。恒久的な4xxも再試行しない。
  if (/abort|timeout|timed out|cancel/i.test(`${error?.name || ''} ${error?.message || ''} ${error?.hint || ''}`)) return false;
  return result?.status === 0 || [408, 425, 429].includes(result?.status) || result?.status >= 500;
}

async function readQuery(makeQuery, { signal = AbortSignal.timeout(SSR_DB_TIMEOUT_MS), retryOnce = false, retryDelayMs = 100 } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    let result;
    try {
      // SDK自身の再試行を止め、最大2回を同じ時間枠で行う。
      result = await makeQuery().retry(false).abortSignal(signal);
    } catch (error) {
      result = { data: null, error, status: 0 };
    }
    if (!result?.error && Array.isArray(result?.data)) return result;
    if (!result?.error) return { ...result, data: null, error: new Error('Invalid home review response') };
    if (attempt > 0 || !retryOnce || signal.aborted || !isTransient(result)) return result;
    if (retryDelayMs > 0) await new Promise(resolve => {
      const done = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', done);
        resolve();
      };
      const timer = setTimeout(done, retryDelayMs);
      signal.addEventListener('abort', done, { once: true });
    });
    if (signal.aborted) return result;
  }
}

/** 公開口コミの取得失敗を、正常な0件と区別する。本文は120字の抜粋だけをSSRへ渡す。 */
export async function loadHomeReviews(supabase, { timeoutMs = SSR_DB_TIMEOUT_MS, retryDelayMs = 100 } = {}) {
  // 再試行を含めて10秒まで。遅い問い合わせをもう一度10秒待つことはしない。
  const signal = AbortSignal.timeout(timeoutMs);
  const [reviewResult, indexResult] = await Promise.all([
    readQuery(() => supabase.from('reviews')
      .select('id, shop_id, therapist_id, therapist_name, rating, content, created_at, detailed_ratings, user_name, course')
      .eq('is_public', true)
      .not('therapist_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(FEED_FETCH), { signal, retryOnce: true, retryDelayMs }),
    // 索引の失敗は件数を不明にするだけ。取得できた本文を捨てない。
    readQuery(() => supabase.from('reviews')
      .select('shop_id, created_at', { count: 'exact' })
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(REVIEW_INDEX_LIMIT), { signal }),
  ]);
  if (reviewResult.error) {
    console.error('Home public reviews unavailable', { status: reviewResult.status, code: reviewResult.error.code || null });
    return { latestReviews: [], reviewsByPref: [], reviewStats: null, reviewLoadFailed: true };
  }

  const revs = reviewResult.data;
  const indexRows = indexResult.error ? [] : indexResult.data;
  const shopIds = [...new Set([...revs, ...indexRows].map(r => r.shop_id).filter(Boolean))];
  const therapistIds = [...new Set(revs.map(r => r.therapist_id).filter(Boolean))];
  // `.in()`はURLに全IDが載るので、店舗の所在地は従来どおり分割して読む。
  const shopChunks = [];
  for (let i = 0; i < shopIds.length; i += 150) shopChunks.push(shopIds.slice(i, i + 150));
  const [shopResults, therapistResult] = await Promise.all([
    Promise.all(shopChunks.map(ids => readQuery(() => supabase.from('shops')
      .select('id, name, group_id, website_url, schedule_url, roster_url:raw_data->>rosterUrl, prefecture:raw_data->>prefecture, area:raw_data->area, city:raw_data->>city')
      .in('id', ids)))),
    therapistIds.length ? readQuery(() => supabase.from('therapists')
      .select('id, image_url, is_active, profile_url:raw_data->>profileUrl').in('id', therapistIds)) : Promise.resolve({ data: [], error: null }),
  ]);
  const shopLookupOk = shopResults.every(result => !result.error);
  const shopById = Object.fromEntries(shopResults.flatMap(result => result.error ? [] : result.data).map(shop => [shop.id, shop]));
  const therapists = therapistResult.error ? [] : therapistResult.data;
  const therapistById = Object.fromEntries(therapists.map(therapist => [therapist.id, therapist]));
  const mapped = revs.map(r => {
    const shop = shopById[r.shop_id];
    const therapist = therapistById[r.therapist_id];
    return {
      id: r.id,
      shopId: r.shop_id,
      therapistId: r.therapist_id,
      therapistName: r.therapist_name || '',
      shopName: typeof shop?.name === 'string' ? getDisplayName(shop.name, shop) : '',
      prefecture: shop?.prefecture || null,
      area: (Array.isArray(shop?.area) ? shop.area[0] : shop?.area) || null,
      rating: r.rating || null,
      image: therapist?.image_url || null,
      // 写真・在籍情報の取得失敗は「退店済み」とみなさない。
      notListed: !therapistResult.error && (!therapist || therapist.is_active === false),
      snippet: String(r.content || '').replace(/\s+/g, '').slice(0, 120),
      detailedRatings: r.detailed_ratings || null,
      userName: PLACEHOLDER_NAMES.has(r.user_name) ? null : (r.user_name || null),
      course: r.course || null,
      createdAt: r.created_at || null,
      // 公式サイトへの道（開いた口コミの中に出す・src/utils/officialLinks.js）。無ければ null。
      groupId: shop?.group_id || null,
      shopWebsiteUrl: shop?.website_url || null,
      shopScheduleUrl: shop?.schedule_url || null,
      shopRosterUrl: shop?.roster_url || null,
      profileUrl: therapist?.profile_url || null,
    };
  });
  const summary = summarizeReviewIndex(indexResult.error ? null : indexRows, {
    total: indexResult.error ? null : indexResult.count,
    prefOf: shopId => shopById[shopId]?.prefecture || null,
  });
  return {
    latestReviews: buildLatestFeed(mapped),
    reviewsByPref: groupReviewsByPref(mapped, {
      slugOf: pref => PREF_TO_SLUG[pref],
      totals: shopLookupOk ? summary.prefTotals : null,
    }),
    reviewStats: { total: summary.total, recent: summary.recent },
    reviewLoadFailed: false,
  };
}
