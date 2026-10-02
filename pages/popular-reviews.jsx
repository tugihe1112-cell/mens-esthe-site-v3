/**
 * /popular-reviews — 公開口コミ一覧（SSR）
 *
 * サイトマップに載せる口コミハブなので、JavaScript実行前のHTMLにも
 * 口コミ本文の抜粋と店舗・セラピストの正規URLを必ず含める。
 */
import React from 'react';
import { createServerSupabase } from '../server/supabaseServer';
import PopularReviewsPage from '../src/pages/PopularReviewsPage';
import { normalizeTherapistName } from '../src/utils/reviewIdentity.js';

const PAGE_SIZE = 20;
const normName = normalizeTherapistName;

export async function getServerSideProps({ res }) {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  try {
    const supabase = createServerSupabase(process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id, shop_id, therapist_id, therapist_name, rating, tags, content, course, user_name, created_at, like_count')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (reviewsError) throw reviewsError;
    if (!Array.isArray(reviews)) throw new Error('Invalid public review response');

    const shopIds = [...new Set((reviews || []).map((review) => review.shop_id).filter(Boolean))];
    const therapistIds = [...new Set((reviews || []).map((review) => review.therapist_id).filter(Boolean))];
    const [shopLookup, therapistLookup] = await Promise.allSettled([
      shopIds.length
        ? supabase.from('shops').select('id, name, raw_data').in('id', shopIds)
        : Promise.resolve({ data: [], error: null }),
      therapistIds.length
        ? supabase.from('therapists').select('id, name, image_url, shop_id, is_active').in('id', therapistIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    // 店名や写真だけの失敗では、正常に取得できた口コミを捨てない。
    const shops = shopLookup.status === 'fulfilled' && !shopLookup.value.error && Array.isArray(shopLookup.value.data)
      ? shopLookup.value.data : [];
    const therapists = therapistLookup.status === 'fulfilled' && !therapistLookup.value.error && Array.isArray(therapistLookup.value.data)
      ? therapistLookup.value.data : [];

    const initialShopMap = Object.fromEntries(shops.map((shop) => {
      const area = Array.isArray(shop.raw_data?.area) ? shop.raw_data.area[0] : shop.raw_data?.area;
      return [shop.id, {
        name: shop.name,
        prefecture: shop.raw_data?.prefecture || '',
        area: area || '',
      }];
    }));

    const initialTherapistMap = {};
    for (const therapist of therapists) {
      initialTherapistMap[therapist.id] = therapist;
      initialTherapistMap[`${therapist.shop_id}|${normName(therapist.name)}`] = therapist;
    }

    return {
      props: {
        initialReviews: reviews || [],
        initialShopMap,
        initialTherapistMap,
        initialHasMore: (reviews || []).length === PAGE_SIZE,
        initialLoadError: false,
      },
    };
  } catch (error) {
    console.error('[SSR PopularReviews]', error.message);
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '120');
    return {
      props: {
        initialReviews: [],
        initialShopMap: {},
        initialTherapistMap: {},
        initialHasMore: false,
        initialLoadError: true,
      },
    };
  }
}

export default function PopularReviewsSSRPage(props) {
  return <PopularReviewsPage {...props} />;
}
