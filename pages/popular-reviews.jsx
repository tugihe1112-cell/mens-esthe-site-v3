/**
 * /popular-reviews — 公開口コミ一覧（SSR）
 *
 * サイトマップに載せる口コミハブなので、JavaScript実行前のHTMLにも
 * 口コミ本文の抜粋と店舗・セラピストの正規URLを必ず含める。
 */
import React from 'react';
import { createClient } from '@supabase/supabase-js';
import PopularReviewsPage from '../src/pages/PopularReviewsPage';

const PAGE_SIZE = 20;
const normName = (value) => String(value || '').replace(/[\s　]/g, '');

export async function getServerSideProps({ res }) {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );

  try {
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id, shop_id, therapist_id, therapist_name, rating, tags, content, course, user_name, created_at, like_count')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (reviewsError) throw reviewsError;

    const shopIds = [...new Set((reviews || []).map((review) => review.shop_id).filter(Boolean))];
    const therapistIds = [...new Set((reviews || []).map((review) => review.therapist_id).filter(Boolean))];
    const [shopsResult, therapistsResult] = await Promise.all([
      shopIds.length
        ? supabase.from('shops').select('id, name, raw_data').in('id', shopIds)
        : Promise.resolve({ data: [], error: null }),
      therapistIds.length
        ? supabase.from('therapists').select('id, name, image_url, shop_id').in('id', therapistIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (shopsResult.error) throw shopsResult.error;
    if (therapistsResult.error) throw therapistsResult.error;

    const initialShopMap = Object.fromEntries((shopsResult.data || []).map((shop) => {
      const area = Array.isArray(shop.raw_data?.area) ? shop.raw_data.area[0] : shop.raw_data?.area;
      return [shop.id, {
        name: shop.name,
        prefecture: shop.raw_data?.prefecture || '',
        area: area || '',
      }];
    }));

    const initialTherapistMap = {};
    for (const therapist of therapistsResult.data || []) {
      initialTherapistMap[therapist.id] = therapist;
      initialTherapistMap[`${therapist.shop_id}|${normName(therapist.name)}`] = therapist;
    }

    return {
      props: {
        initialReviews: reviews || [],
        initialShopMap,
        initialTherapistMap,
        initialHasMore: (reviews || []).length === PAGE_SIZE,
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
      },
    };
  }
}

export default function PopularReviewsSSRPage(props) {
  return <PopularReviewsPage {...props} />;
}
