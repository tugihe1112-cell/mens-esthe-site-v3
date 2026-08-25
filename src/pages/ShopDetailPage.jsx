import React, { useState, useEffect } from 'react';
import { authHeaders } from '../utils/supabaseRest';
import { useParams, Link, useNavigate } from '../compat/router';
import { useShopData } from '../contexts/DataContext.jsx';
import { useAppContext } from '../context/AppContext.tsx';
import { useAuth } from '../contexts/AuthContext.jsx'; 
import LazyImage from '../components/LazyImage.jsx';
import ModernReviewCard from '../components/ModernReviewCard.jsx';
import SeoHead from '../components/SeoHead.jsx';
import Header from '../components/Header.jsx';
import { getDisplayName } from '../utils/shopHelpers';
import LocationLabel from '../components/LocationLabel.jsx';
import { joinFields, shapeShopRow } from '../utils/shopFields';
import { trackEvent } from '../utils/analytics';
import siteStats from '../data/stats-latest.json';

// 左サイドバーのタグ絞り込み（SearchPage と同一定義。表記を割らないため必ず揃える）
const TAG_CATEGORIES = [
  { title: "BODY TYPE", id: "body", tags: ["スレンダー", "グラマー", "巨乳", "美脚", "小柄", "高身長"] },
  { title: "ATMOSPHERE", id: "vibe", tags: ["可愛い系", "美人系", "清楚系", "ギャル系", "お姉さん系"] },
  { title: "AGE GROUP", id: "age", tags: ["10代", "20代前半", "20代後半", "30代", "40代"] },
  { title: "ATTRIBUTES", id: "attr", tags: ["色白", "健康的", "ベテラン", "外国人", "新人"] }
];

const INITIAL_DISPLAY_COUNT = 12;
const LOAD_MORE_COUNT = 12;

export default function ShopDetailPage({
  ssrShop = null,
  ssrTherapistCount = 0,
  ssrReviewedTherapists = [],
  ssrNearbyShops = [],
  ssrPrefecture = null,
  ssrArea = null,
  ssrReviewCount = 0,
  ssrAvgRating = null,
}) {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { shopById, getTherapistsByShopId, getReviewsByShopId, loadTherapistsForShop, loadReviewsForShop } = useShopData();
  const { toggleFavorite, favorites, toggleFavTherapist, favTherapists } = useAppContext();
  
  const { user, userPlan } = useAuth();
  const isPremiumUser = userPlan === 'premium' || userPlan === 'vip';

  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
  // キャスト一覧の絞り込み・並び替え（SearchPageと同じ操作感に揃える）
  const [castNameFilter, setCastNameFilter] = useState('');
  const [castSortOrder, setCastSortOrder] = useState('default'); // default | aiueo | reviews
  const [selectedTags, setSelectedTags] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // セラピスト名 → その人の口コミに付いたタグ集合
  const [reviewTagMap, setReviewTagMap] = useState({});

  // 🔒 ロック1：完全個室化ステート（※変数名は cloudShop のまま残して、後半のエラーを完全回避！）
  const [cloudShop, setCloudShop] = useState(null);
  const [cloudTherapists, setCloudTherapists] = useState(null);
  const [cloudReviews, setCloudReviews] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  // レビューページネーション
  const REVIEW_PAGE_SIZE = 20;
  const [reviewOffset, setReviewOffset] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false);

  // セラピスト別口コミ件数 { name → count }
  const [therapistReviewCounts, setTherapistReviewCounts] = useState({});

  useEffect(() => {
    if (!shopId) return;
    let isMounted = true;
    
    const fetchAllData = async () => {
      setIsFetching(true);
      try {
        const url = process.env.VITE_SUPABASE_URL;
        const key = process.env.VITE_SUPABASE_ANON_KEY;
        if (!url || !key) return;
        // ⚠️ 2026-08-12: anonキー固定だと TO authenticated のRLSが発火せず、
        //    12_適用後に本人・credits保有者・VIPへ非公開口コミが返らなくなる。
        const headers = await authHeaders();

        // 1. 先に店舗データだけを取得してブランドIDを確定させる
        const shopRes = await fetch(`${url}/rest/v1/shops?id=eq.${shopId}&select=*`, { headers, cache: 'no-store' });
        const shopData = await shopRes.json();

        // 店舗データは即座にセット（後続の処理が失敗しても表示できるように）
        if (isMounted && Array.isArray(shopData) && shopData.length > 0) {
          setCloudShop(shopData[0]);
        }

        const groupId = shopData?.[0]?.group_id;

        // group_idが同じ店舗のIDを先に取得してからセラピストを取得
        let therapistShopIds = [shopId];
        if (groupId) {
          const groupShopsRes = await fetch(`${url}/rest/v1/shops?group_id=eq.${groupId}&select=id`, { headers, cache: 'no-store' });
          const groupShops = await groupShopsRes.json();
          if (Array.isArray(groupShops) && groupShops.length > 0) {
            therapistShopIds = groupShops.map(s => s.id);
          }
        }
        // 写真グリッドでは、画像を確認できる在籍プロフィールだけを返す。
        // 写真なし行は口コミ投稿フォーム側では引き続き選択できる。
        const therapistQuery = `shop_id=in.(${therapistShopIds.join(',')})&image_url=not.is.null`;

        // 2. group_id がある場合は系列店全店の口コミを取得（最新20件のみ）
        const reviewShopIds = therapistShopIds;
        const reviewBase = reviewShopIds.length > 1
          ? `${url}/rest/v1/reviews?shop_id=in.(${reviewShopIds.join(',')})`
          : `${url}/rest/v1/reviews?shop_id=eq.${shopId}`;
        const reviewFetchUrl = `${reviewBase}&select=*&order=created_at.desc&limit=${REVIEW_PAGE_SIZE}&offset=0`;

        const [tRes, rRes] = await Promise.all([
          fetch(`${url}/rest/v1/therapists?select=*&${therapistQuery}`, { headers, cache: 'no-store' }),
          fetch(reviewFetchUrl, { headers, cache: 'no-store' })
        ]);

        // セラピスト別口コミ件数（therapist_name列のみ取得・軽量）
        const countFetchUrl = reviewShopIds.length > 1
          ? `${url}/rest/v1/reviews?shop_id=in.(${reviewShopIds.join(',')})&select=therapist_name,tags`
          : `${url}/rest/v1/reviews?shop_id=eq.${shopId}&select=therapist_name,tags`;

        const [tData, rData, cData] = await Promise.all([
          tRes.json(),
          rRes.json(),
          fetch(countFetchUrl, { headers, cache: 'no-store' }).then(r => r.json()),
        ]);

        if (isMounted) {
          if (Array.isArray(tData)) {
            setCloudTherapists(tData.filter((t) => t.image_url?.trim() && t.is_active !== false));
          }
          if (Array.isArray(rData)) {
            setCloudReviews(rData);
            setHasMoreReviews(rData.length === REVIEW_PAGE_SIZE);
            setReviewOffset(REVIEW_PAGE_SIZE);
          }
          if (Array.isArray(cData)) {
            const norm = (s) => (s || '').replace(/[\s　]/g, '');
            const counts = {};
            const tagMap = {};
            cData.forEach(r => {
              const n = norm(r.therapist_name);
              if (!n) return;
              counts[n] = (counts[n] || 0) + 1;
              if (Array.isArray(r.tags)) {
                if (!tagMap[n]) tagMap[n] = new Set();
                r.tags.forEach(t => tagMap[n].add(t));
              }
            });
            setTherapistReviewCounts(counts);
            setReviewTagMap(tagMap);
          }
        }
      } catch (err) {
        console.error("Cloud fetch failed", err);
      } finally {
        if (isMounted) setIsFetching(false);
      }
    };
    fetchAllData();
    return () => { isMounted = false; };
  }, [shopId]);

  // 追加のレビューを取得（プレミアム用ページネーション）
  const loadMoreReviews = async () => {
    if (isLoadingMoreReviews || !hasMoreReviews) return;
    setIsLoadingMoreReviews(true);
    try {
      const url = process.env.VITE_SUPABASE_URL;
      const key = process.env.VITE_SUPABASE_ANON_KEY;
      // ⚠️ 追加読み込みも同様にセッションJWTを送る（anon固定だとRLSが発火しない）
      const headers = await authHeaders();
      const shop = cloudShop;
      if (!shop) return;

      // group_id がある場合は系列店全店分
      let shopIds = [shopId];
      if (shop.group_id) {
        const grpRes = await fetch(`${url}/rest/v1/shops?group_id=eq.${shop.group_id}&select=id`, { headers });
        const grpData = await grpRes.json();
        if (Array.isArray(grpData) && grpData.length > 0) shopIds = grpData.map(s => s.id);
      }
      const base = shopIds.length > 1
        ? `${url}/rest/v1/reviews?shop_id=in.(${shopIds.join(',')})`
        : `${url}/rest/v1/reviews?shop_id=eq.${shopId}`;
      const fetchUrl = `${base}&select=*&order=created_at.desc&limit=${REVIEW_PAGE_SIZE}&offset=${reviewOffset}`;
      const res = await fetch(fetchUrl, { headers });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCloudReviews(prev => [...prev, ...data]);
        setHasMoreReviews(data.length === REVIEW_PAGE_SIZE);
        setReviewOffset(prev => prev + REVIEW_PAGE_SIZE);
      }
    } catch (e) {
      console.error('loadMoreReviews error', e);
    } finally {
      setIsLoadingMoreReviews(false);
    }
  };

  // 共有箱(Context)はあくまで「保険」。基本は直接取ってきた cloudShop を使う。
  // ⚠️ cloudShop は `select=*` の**生レコード**で raw_data が入れ子のまま。
  //    以前はこれをそのまま使っていたため、住所・市区・エリア・都道府県が
  //    **全1,099店で undefined** になり画面から消えていた（DBには入っている）。
  //    必ず shapeShopRow を通して展開すること。
  const shop = React.useMemo(
    () => shapeShopRow(cloudShop) || (shopById ? shopById[shopId] : null) || ssrShop,
    [cloudShop, shopById, shopId, ssrShop],
  );
  // グループ店舗で同一セラピストが複数店舗に登録されている場合に重複除去。
  // 直接取得がまだ空の間だけContextを保険にし、安定した配列参照を後続memoへ渡す。
  const therapists = React.useMemo(() => {
    const source = Array.isArray(cloudTherapists) && cloudTherapists.length > 0
      ? cloudTherapists
      : (getTherapistsByShopId ? getTherapistsByShopId(shopId) : []);
    const seen = new Set();
    return (source || []).filter((therapist) => {
      const key = (therapist.name || '').replace(/[\s　]/g, '').trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [cloudTherapists, getTherapistsByShopId, shopId]);
  const reviews = cloudReviews.length > 0 ? cloudReviews : (getReviewsByShopId ? getReviewsByShopId(shopId, isPremiumUser) : []);
  const isFavorite = shop ? favorites.includes(shop.id) : false;

  // 🌟 店舗IDからロゴ画像を判定するロジック
  let logoUrl = null;
  if (shopId?.includes('yuruspa') || shop?.brand_id === 'yuruspa') {
    logoUrl = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/yuruspa.png';
  } else if (shopId?.includes('mens_esthe_group') || shopId?.includes('menes_group') || shop?.brand_id === 'mens_esthe_group') {
    logoUrl = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/menesgroup.png';
  }

  // 名前で絞り込み → 並び替え → 表示件数で切る（SearchPageと同じ流れ）
  const normName = (s) => (s || '').replace(/[\s　]/g, '');
  const tagCounts = React.useMemo(() => {
    const counts = {};
    TAG_CATEGORIES.forEach(cat => cat.tags.forEach(t => { counts[t] = 0; }));
    for (const t of therapists) {
      const tags = reviewTagMap[normName(t.name)] || new Set();
      for (const tag of tags) if (counts[tag] !== undefined) counts[tag]++;
    }
    return counts;
  }, [therapists, reviewTagMap]);
  // 🚫 `hasAvailableTags`（タグ0件ならサイドバーを隠す分岐）は**廃止した**（2026-08-20）。
  //    復活させないこと。理由:
  //      ・D-001 は「/shops/:id は常に 左タグサイドバー＋キャスト一覧」というオーナー確定事項。
  //        タグ件数が0でもレイアウトは変えない（SearchPageと同じ挙動。口コミが増えれば自然に機能する）。
  //      ・`a7f7681`（2026-08-21 スマホUI改修）でこの分岐が後から入り、
  //        口コミ0件の店舗だけレイアウトが別物になった。**開発時によく見る口コミありの店では
  //        再現しない**ため、「直したはずなのにまた壊れている」が繰り返される原因になった。
  //      ・**レイアウトを1種類にすれば、この揺れは構造的に起きない。**
  //    ⚠️「タグが全部(0)だと無意味だから隠そう」という判断は、過去に却下されている。
  //      実装せず okabayashi に確認すること。

  // スマホのタグ絞り込みはボトムシートで出す。開いている間に背面が
  // スクロールすると現在位置を見失うため、SearchPageと同様に固定する。
  useEffect(() => {
    if (!isFilterOpen || typeof document === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isFilterOpen]);

  const sortedTherapists = React.useMemo(() => {
    let list = [...therapists];
    if (selectedTags.length > 0) {
      list = list.filter((t) => {
        const tags = reviewTagMap[normName(t.name)] || new Set();
        return selectedTags.every((sel) => tags.has(sel));
      });
    }
    if (castNameFilter.trim()) {
      const f = normName(castNameFilter);
      list = list.filter((t) => normName(t.name).includes(f));
    }
    if (castSortOrder === 'aiueo') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
    } else if (castSortOrder === 'reviews') {
      list.sort((a, b) => (therapistReviewCounts[normName(b.name)] || 0) - (therapistReviewCounts[normName(a.name)] || 0));
    }
    return list;
  }, [therapists, castNameFilter, castSortOrder, therapistReviewCounts, selectedTags, reviewTagMap]);

  const visibleTherapists = sortedTherapists.slice(0, displayCount);
  const hasMore = displayCount < sortedTherapists.length;
  const handleLoadMore = () => setDisplayCount(prev => prev + LOAD_MORE_COUNT);

  // ✨ すべてのHook（useState, useEffect）が終わったので、ここで初めて安全に早期リターン！
  if (isFetching && !shop) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest animate-pulse">LOADING...</div>;
  if (!shop) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Shop not found</div>;

  // Tier 2-3: 件数入りタイトル/descriptionでCTR改善（SSRラッパーと同じ形式で揃える）
  // クライアント取得は最新20件までなので、SSRで数えた全件数を下回らせない。
  // また shops の地域情報は raw_data 内にある店舗が多く、直下カラムだけを読むと
  // description に `undefinedundefined` が露出する。SSRの正規化済み値まで順にフォールバックする。
  const reviewCount = Math.max(ssrReviewCount || 0, cloudReviews.length);
  const clientAvgRating = cloudReviews.length > 0
    ? (cloudReviews.reduce((s, r) => s + (r.rating || 0), 0) / cloudReviews.length).toFixed(1)
    : null;
  const avgRating = ssrAvgRating || clientAvgRating;
  const seoPrefecture = shop.prefecture || shop.raw_data?.prefecture || ssrPrefecture || '';
  const seoArea = shop.city || shop.raw_data?.city || shop.area ||
    (Array.isArray(shop.raw_data?.area) ? shop.raw_data.area[0] : shop.raw_data?.area) || ssrArea || '';
  const seoLocation = [seoPrefecture, seoArea].filter(Boolean).join(' ');
  const seoTherapistCount = Math.max(ssrTherapistCount || 0, therapists.length);
  const seoTitle = reviewCount > 0 ? `${shop.name}の口コミ${reviewCount}件・セラピスト評判` : shop.name;
  const seoDesc = reviewCount > 0
    ? `${shop.name}の口コミ${reviewCount}件（平均★${avgRating}）。${seoLocation ? `${seoLocation}の` : ''}在籍セラピスト${seoTherapistCount}名の評判・体験談をチェック。`
    : `${shop.name}${seoLocation ? `（${seoLocation}）` : ''}の店舗情報。在籍セラピスト${seoTherapistCount}名。`;

  const handlePostReview = () => {
    navigate(`/shops/${shop.id}/review`);
  };

  return (
    <div className="bg-slate-950 min-h-screen pb-24 md:pb-16 text-slate-200 font-sans relative">
      <Header />
      <SeoHead
        title={seoTitle}
        description={seoDesc}
        path={`/shops/${shop.id}`}
        image={`/api/og?shop=${encodeURIComponent(shop.name)}&sub=${encodeURIComponent(seoDesc.slice(0, 40))}&image=${encodeURIComponent(shop.image_url || shop.image || '')}`}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HealthAndBeautyBusiness",
        "name": shop.name,
        "description": seoDesc,
        "url": shop.website_url || shop.raw_data?.url || `https://www.mens-esthe-map.jp/shops/${shop.id}`,
        "image": shop.image_url || shop.image || undefined,
        "address": {
          "@type": "PostalAddress",
          "addressRegion": seoPrefecture || undefined,
          "addressLocality": seoArea || undefined,
          "addressCountry": "JP"
        },
        "telephone": shop.phone_number || shop.raw_data?.phone || undefined,
        "aggregateRating": cloudReviews.length > 0 ? {
          "@type": "AggregateRating",
          "ratingValue": (cloudReviews.reduce((s, r) => s + (r.rating || 0), 0) / cloudReviews.length).toFixed(1),
          "reviewCount": cloudReviews.length,
          "bestRating": 5,
          "worstRating": 1
        } : undefined
      }) }} />

      {/* 1. Cinematic Hero Header */}
      <div className="relative h-[360px] sm:h-[45vh] md:h-[55vh] w-full overflow-hidden group">
         <button
           onClick={() => navigate(-1)}
           aria-label="前のページに戻る"
           /* 共通ヘッダー（ロゴ・左上）と重ならないようヘッダー下に配置 */
           className="absolute top-16 md:top-20 left-4 z-40 inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-black/50 backdrop-blur-md text-white text-sm font-bold border border-white/15 hover:bg-black/70 transition active:scale-95"
         >
           <span className="text-base leading-none">←</span> 戻る
         </button>

         {/* 🐛 ヒーローが「壊れて見える」真因（2026-08-20 実測で特定）
             ・店舗画像は 2026-07-06 の一括リサイズで**全て最大600px**に縮小済み
             ・PCのヒーローは幅約1,700px ＝ **2.8倍に拡大**していた
             ・さらに object-cover なので、横長のロゴ／キャンペーンバナー（600x285等）は
               上下を大きく切り取られ、文字の断片だけが巨大に表示される
             → 実測: ユニーク756枚のうち横長(aspect≥2.2)が245枚、低解像度(<200px)が129枚。
               つまり**半数以上がこの拡大＋切り取りで破綻する形**だった。
             【対処】背景はぼかした複製で埋め、本体は object-contain で原寸を超えない範囲に収める。
             これで横長バナーでも正方形ロゴでも切れず・ボケず・意図した見た目になる。
             ⚠️ object-cover に戻さないこと。戻すと同じ事故が再発する。 */}
         <div className="absolute inset-0">
           {/* 背景: ぼかして暗くした複製。拡大のボケはぼかしで意図的な演出になる */}
           <LazyImage
             src={shop.image_url || shop.image}
             alt=""
             className="w-full h-full scale-110 blur-2xl opacity-40"
             imgClassName="w-full h-full object-cover"
           />
           {/* 本体: 切り取らずに全体を見せる。
               ⚠️ object-contain は **imgClassName** で渡すこと。className はラッパーdivに付くだけで
                  <img> には届かない（2026-08-20 にここで「直したつもりで直っていない」事故） */}
           <div className="absolute inset-0 flex items-center justify-center px-6 pt-24 pb-28">
             <LazyImage
               src={shop.image_url || shop.image}
               alt={shop.name}
               className="w-full h-full max-w-[720px] transition-transform duration-1000 group-hover:scale-105"
               imgClassName="w-full h-full object-contain drop-shadow-2xl"
             />
           </div>
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30"></div>
         </div>

         <div className="absolute bottom-0 left-0 w-full p-4 md:p-10 z-20">
           <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-end justify-between gap-3 md:gap-6">
             <div className="flex-1">
               <div className="flex flex-wrap gap-2 mb-3">
                 {/* ⚠️ 市区・エリアが両方とも無い店舗が65店ある。
                     無条件で描くと中身の無い「空のピンクの箱」だけが出る（2026-08-22に本番で発生）。 */}
                 {joinFields(shop.city, shop.area) && (
                   <span className="px-2.5 py-0.5 rounded-md bg-pink-600/80 backdrop-blur text-white text-[10px] font-bold tracking-widest uppercase border border-white/10">
                     {joinFields(shop.city, shop.area)}
                   </span>
                 )}
                 {shop.group_id && (
                   <span className="px-2.5 py-0.5 rounded-md bg-blue-600/80 backdrop-blur text-white text-[10px] font-bold tracking-widest uppercase border border-white/10">
                     GROUP STORE
                   </span>
                 )}
               </div>
               {logoUrl && (<div className="mb-4 flex justify-center"><img src={logoUrl} alt="Brand Logo" className="h-16 md:h-20 w-auto object-contain" /></div>)}
              <h1 className="text-3xl md:text-6xl font-black text-white leading-tight mb-2 drop-shadow-xl tracking-tight line-clamp-2">
                 {getDisplayName(shop.name)}
               </h1>
               <div className="flex items-start gap-3 text-slate-300 text-xs md:text-sm font-medium">
                 {/* 住所が無い店舗は614店（56%）。LocationLabelが空なら描画しないので「📍」だけ残らない。
                     住所が無くても都道府県・市区までは出せることが多いのでフォールバックする。 */}
                 <LocationLabel
                   className="line-clamp-2"
                   parts={[shop.address || joinFields(shop.prefecture, shop.city, shop.area)]}
                 />
                 {/* ⚠️ 収集元サイトの `raw_data.rating` は使わない（shapeShopRow が構造的に落としている）。
                     ★>0 を持つ39店は当サイトの口コミが全て0件で、出すと「口コミ0件なのに★4.7」になる。
                     必ず**実際の口コミから算出した平均**だけを表示する。 */}
                 <span className="text-yellow-400 font-bold shrink-0">★ {avgRating || 'New'}</span>
               </div>
             </div>

             <div className="flex gap-2 self-start md:self-auto">
               <button 
                  onClick={() => user ? toggleFavorite(shop.id) : navigate(`/login?redirect=${encodeURIComponent(`/shops/${shop.id}`)}`)}
                  aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
                  className={`min-h-11 min-w-11 flex items-center justify-center gap-2 px-3 md:px-6 md:py-3 rounded-full font-bold transition shadow-lg backdrop-blur-sm ${
                    isFavorite 
                      ? 'bg-pink-600 text-white border border-pink-500' 
                      : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  }`}
                >
                  <span className="md:hidden">{isFavorite ? '❤️' : '🤍'}</span>
                  <span className="hidden md:inline">{isFavorite ? 'Saved ❤️' : 'Save'}</span>
                </button>
               <button 
                 onClick={handlePostReview}
                 className="min-h-11 flex bg-white text-slate-950 px-4 md:px-6 md:py-3 rounded-full font-black shadow-lg hover:bg-pink-500 hover:text-white transition-all transform hover:-translate-y-1 items-center gap-2 text-sm"
               >
                 <span>✍️</span> 口コミを書く
               </button>
             </div>
           </div>
         </div>
      </div>

      {/* 2. セクションナビ（旧タブUI）
          ⚠️ 2026-08: タブ切替を廃止し1ページに全セクションを積む形へ。
             理由: okabayashiの方針で「タブ型の店舗ページは使わない」＝SearchPage型（キャスト一覧が主役）に寄せる。
             ただし内部リンク/canonical/JSON-LDは /shops/:id のまま維持する（7月の索引崩落から復旧させた
             1,098ページへのクロール経路をここで切らないため）。ナビはアンカースクロールに変更。 */}
      <div className="sticky top-14 md:top-20 z-40 bg-slate-950/95 backdrop-blur border-b border-white/5 shadow-lg">
        <div className="flex max-w-4xl mx-auto">
          {([
            { key: 'cast', label: 'キャスト' },
            { key: 'review', label: '口コミ' },
            { key: 'info', label: '店舗情報' },
            ...(cloudShop?.schedule_url ? [{ key: 'schedule', label: '出勤' }] : []),
          ]).map((tab) => (
            <a
              key={tab.key}
              href={`#sec-${tab.key}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`sec-${tab.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="flex-1 py-3 md:py-4 text-xs md:text-sm font-black tracking-wider text-slate-400 hover:text-white transition-all text-center"
            >
              {tab.label}
            </a>
          ))}
        </div>
      </div>

      {/* 3. Content Area */}
      <div className="max-w-4xl mx-auto px-4 py-5 md:py-8 min-h-[50vh] flex flex-col gap-8 md:gap-12">
        
        <section id="sec-info" className="scroll-mt-32 order-3">
          <div className="space-y-8">
             <div className="md:hidden">
                <button 
                  onClick={handlePostReview}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 rounded-xl font-black shadow-lg shadow-pink-900/30 flex items-center justify-center gap-2"
                >
                  <span>✍️</span> このお店のクチコミを書く
                </button>
            </div>

            
            
            
            {/* ▼ サイト＆キャスト＆スケジュールリンク (洗練版・3ボタン) ▼ */}
            {(shop.url || shop.websiteUrl || shop.website_url || shop?.raw_data?.url || shop?.raw_data?.website || cloudShop?.schedule_url) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                {cloudShop?.schedule_url && (
              <button onClick={() => document.getElementById('sec-schedule')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 transition group shadow-lg">
                <span className="text-xl opacity-60 group-hover:opacity-100 transition">📅</span>
                <div className="text-left flex-1">
                  {/* 英語ラベル＋9pxだった。日本語＋11pxに（2026-08-17） */}
                  <div className="text-[11px] text-slate-400 font-bold mb-0.5">出勤スケジュール</div>
                  <div className="text-xs font-bold text-slate-200 tracking-wide group-hover:text-green-400 transition">出勤情報</div>
                </div>
              </button>
            )}
              </div>
            )}
<div className="bg-slate-900/50 rounded-3xl p-6 md:p-8 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                   SHOP INFORMATION
                 </h3>
              </div>

              <dl className="space-y-6">
                {/* 在籍セラピスト数＝全1,098店が持つ固有の実データ。まずこれを出す */}
                {ssrTherapistCount > 0 && (
                  <div className="grid grid-cols-[80px_1fr] md:grid-cols-[120px_1fr] items-baseline">
                    <dt className="text-[10px] md:text-xs font-bold text-slate-500 tracking-widest">在籍</dt>
                    <dd className="text-sm md:text-base font-bold text-white">
                      <span className="text-pink-400 text-lg md:text-xl">{ssrTherapistCount.toLocaleString()}</span> 人
                      {ssrReviewCount > 0 && (
                        <span className="text-slate-400 font-normal text-xs ml-3">
                          口コミ {ssrReviewCount}件{ssrAvgRating ? `・平均★${ssrAvgRating}` : ''}
                        </span>
                      )}
                    </dd>
                  </div>
                )}
                {/* ⚠️「営業時間情報なし」は行き止まりなので、データがある時だけ出す */}
                {(shop.business_hours || shop.raw_data?.hours) && (
                  <div className="grid grid-cols-[80px_1fr] md:grid-cols-[120px_1fr] items-baseline">
                    <dt className="text-[10px] md:text-xs font-bold text-slate-500 tracking-widest">営業時間</dt>
                    <dd className="text-sm md:text-base font-bold text-white">{shop.business_hours || shop.raw_data?.hours}</dd>
                  </div>
                )}
                <div className="grid grid-cols-[80px_1fr] md:grid-cols-[120px_1fr] items-baseline">
                  <dt className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">PRICE</dt>
                  <dd className="text-sm md:text-base text-white w-full bg-slate-800/50 p-4 rounded-xl border border-white/5">{shop?.price_system ? (
  <div className="flex flex-col space-y-3 w-full">
    {(() => {
      let ps = shop.price_system;
      // 文字列で来た場合はJSONパースを試みる
      if (typeof ps === 'string') {
        try { ps = JSON.parse(ps); } catch {}
      }
      // オブジェクト形式: {"70": 12500, "90": 15000, ...}
      if (ps && typeof ps === 'object' && !Array.isArray(ps)) {
        return Object.entries(ps)
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([min, price]) => (
            <div key={min} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <span className="text-slate-300">{min}分</span>
              <span className="text-white font-bold tracking-wider">¥{Number(price).toLocaleString()}</span>
            </div>
          ));
      }
      // 旧フォーマット "70分:12500\n90分:15000"
      const str = typeof ps === 'string' ? ps : JSON.stringify(ps);
      return str.split('\n').filter(Boolean).map((line, idx) => {
        const parts = line.split(':');
        return (
          <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
            <span className="text-slate-300">{parts[0]}</span>
            <span className="text-white font-bold tracking-wider">{parts[1] || ''}</span>
          </div>
        );
      });
    })()}
  </div>
) : (
  /* ⚠️「料金情報なし」だけでは行き止まり。掲載1,098店のうち料金が取れているのは487店で、
     残りは公式サイトにしか無い。そこで /stats の実測相場（メンエスマップ調べ）を出し、
     「相場感 → 公式で確認」という次の行動まで繋ぐ。 */
  <div className="space-y-3">
    <p className="text-slate-300 text-sm">この店舗の料金は未掲載です。</p>
    <div className="rounded-xl bg-black/20 border border-white/5 p-3">
      <p className="text-[10px] text-slate-500 font-bold tracking-wider mb-2">
        全国のメンズエステ料金相場（メンエスマップ調べ・{siteStats?.coverage?.priceSampleShops || 0}店の実測中央値）
      </p>
      <div className="flex gap-4">
        <div className="flex-1 flex justify-between items-center border-b border-white/5 pb-1">
          <span className="text-slate-400 text-xs">60分</span>
          <span className="text-white font-bold">¥{(siteStats?.nationalPrice?.median60 || 0).toLocaleString()}</span>
        </div>
        <div className="flex-1 flex justify-between items-center border-b border-white/5 pb-1">
          <span className="text-slate-400 text-xs">90分</span>
          <span className="text-white font-bold">¥{(siteStats?.nationalPrice?.median90 || 0).toLocaleString()}</span>
        </div>
      </div>
      <Link to="/stats" className="inline-block mt-2 text-[11px] font-bold text-pink-400 hover:text-pink-300">
        エリア別の相場を見る →
      </Link>
    </div>
    {(shop.website_url || shop.url || shop?.raw_data?.url) && (
      <p className="text-[11px] text-slate-500">最新の料金は公式サイトでご確認ください。</p>
    )}
  </div>
)}
                </dd>
                </div>
                {(shop.phone_number || shop.raw_data?.phone) && (
                  <div className="grid grid-cols-[80px_1fr] md:grid-cols-[120px_1fr] items-baseline">
                    <dt className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">TEL</dt>
                    <dd className="text-sm md:text-base font-bold text-white tracking-widest">
                       <a href={`tel:${shop.phone_number || shop.raw_data?.phone}`} onClick={() => trackEvent('click_outbound', { link_type: 'phone', shop_id: shop.id, shop_name: shop.name })} className="hover:text-pink-400 transition">{shop.phone_number || shop.raw_data?.phone}</a>
                    </dd>
                  </div>
                )}
                {/* ⚠️ 住所が無い店舗が614店（56%）。無条件で出すと
                    「ACCESS」というラベルの右が空白のままになる（営業時間・TELと同じ扱いに揃える）。
                    住所が無くても都道府県・市区までは出せることが多いのでフォールバックする。 */}
                {joinFields(shop.address || joinFields(shop.prefecture, shop.city, shop.area)) && (
                  <div className="grid grid-cols-[80px_1fr] md:grid-cols-[120px_1fr] items-baseline">
                    <dt className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">ACCESS</dt>
                    <dd className="text-sm md:text-base text-slate-300 leading-relaxed">
                      {shop.address || joinFields(shop.prefecture, shop.city, shop.area)}
                    </dd>
                  </div>
                )}
              </dl>
              
              <div className="mt-8">
                 <a href={shop.url || shop.website_url || shop.raw_data?.url || shop.raw_data?.websiteUrl || '#'} target="_blank" rel="noreferrer" onClick={() => trackEvent('click_outbound', { link_type: 'official', shop_id: shop.id, shop_name: shop.name })} className="block w-full bg-white text-slate-900 hover:bg-slate-200 py-4 rounded-xl text-sm font-black text-center transition shadow-lg tracking-widest uppercase">
                   Official Website ↗
                 </a>
              </div>
            </div>

            {/* 口コミがあるセラピスト＝読ませる価値のある内部リンク（SSRで出力＝クローラーも辿れる） */}
            {ssrReviewedTherapists.length > 0 && (
              <div className="bg-slate-900/50 rounded-3xl p-6 md:p-8 border border-white/5">
                <h3 className="text-sm font-black text-white mb-1">この店で口コミがあるセラピスト</h3>
                <p className="text-[11px] text-slate-500 mb-4">実際に行った人の体験談が読めます</p>
                <div className="flex flex-wrap gap-2">
                  {ssrReviewedTherapists.map((t) => (
                    <Link
                      key={t.id}
                      to={`/shops/${shop.id}/threads/${t.id}`}
                      className="inline-flex items-center gap-2 bg-slate-800/70 hover:bg-slate-700 border border-white/10 hover:border-pink-500/40 rounded-full px-4 py-2 text-xs font-bold text-slate-200 hover:text-white transition"
                    >
                      {t.name}
                      {t.rating != null && <span className="text-yellow-400">★{Number(t.rating).toFixed(1)}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 同エリアの他店＝比較したい人の回遊先＋クロール経路（孤立ページ化の解消） */}
            {ssrNearbyShops.length > 0 && (
              <div className="bg-slate-900/50 rounded-3xl p-6 md:p-8 border border-white/5">
                <h3 className="text-sm font-black text-white mb-1">
                  {ssrArea ? `${ssrArea}の他のメンズエステ` : `${ssrPrefecture || ''}の他のメンズエステ`}
                </h3>
                <p className="text-[11px] text-slate-500 mb-4">近くの店舗と比べてみる</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ssrNearbyShops.map((s) => (
                    <Link
                      key={s.id}
                      to={`/shops/${s.id}`}
                      className="flex items-center justify-between bg-slate-800/50 hover:bg-slate-700/60 border border-white/5 hover:border-pink-500/30 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 hover:text-white transition"
                    >
                      <span className="truncate">{getDisplayName(s.name)}</span>
                      <span className="text-slate-600">›</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="sec-cast" className="scroll-mt-32 order-1">
          {/* 左タグサイドバー＋右キャスト一覧＝SearchPageと同じレイアウト（オーナー確定デザイン・D-001）
              ⚠️ このレイアウトは**全店舗で常に同じ**。条件で出し分けないこと。
                 2026-08-21 に「タグ0件なら隠す」分岐が入り、口コミ0件の店舗だけ別レイアウトになって
                 オーナーから3回同じ指摘を受けた。**分岐を作らないこと自体が再発防止**。 */}
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
            {isFilterOpen && (
              <button
                type="button"
                aria-label="絞り込みを閉じる"
                onClick={() => setIsFilterOpen(false)}
                className="fixed inset-0 z-[65] bg-black/70 backdrop-blur-sm lg:hidden"
              />
            )}
            <aside className={`${isFilterOpen ? 'fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-[70] block max-h-[78vh] overflow-y-auto rounded-3xl bg-slate-950 p-4 border border-white/10 shadow-2xl' : 'hidden'} lg:z-auto lg:block lg:max-h-none lg:overflow-visible lg:rounded-none lg:bg-transparent lg:p-0 lg:border-0 lg:shadow-none space-y-4 lg:sticky lg:top-36 self-start`}>
            <div className="lg:hidden sticky top-0 -mx-1 -mt-1 mb-2 flex items-center justify-between rounded-2xl bg-slate-950/95 px-2 py-2 backdrop-blur">
              <div>
                <p className="text-sm font-black text-white">タグで絞り込む</p>
                <p className="text-[10px] text-slate-500">口コミに付いたタグから選べます</p>
              </div>
              <button onClick={() => setIsFilterOpen(false)} className="min-w-11 min-h-11 rounded-full bg-slate-800 text-white text-xl" aria-label="閉じる">×</button>
            </div>
            {TAG_CATEGORIES.map((category) => (
              <div key={category.id} className="bg-slate-900/40 backdrop-blur rounded-2xl p-4 border border-white/5">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                  {category.title}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {category.tags.map((tag) => {
                    const count = tagCounts[tag] || 0;
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          setDisplayCount(INITIAL_DISPLAY_COUNT);
                          if (isSelected) setSelectedTags((prev) => prev.filter((t) => t !== tag));
                          else if (count > 0) setSelectedTags((prev) => [...prev, tag]);
                        }}
                        disabled={count === 0 && !isSelected}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                          isSelected
                            ? 'bg-pink-600 border-pink-500 text-white'
                            : count === 0
                              ? 'bg-transparent border-slate-800 text-slate-700 cursor-not-allowed'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {tag} <span className="opacity-50">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {selectedTags.length > 0 && (
              <button onClick={() => { setSelectedTags([]); setDisplayCount(INITIAL_DISPLAY_COUNT); }} className="w-full py-2 rounded-xl bg-slate-800 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition">
                絞り込みを解除
              </button>
            )}
          </aside>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 min-w-0">
             {/* スマホの絞り込みボタンも常に出す（PCのサイドバーと同じ扱い・条件で出し分けない） */}
             {(
               <button onClick={() => setIsFilterOpen(true)} className="lg:hidden w-full min-h-11 mb-4 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-slate-300">
                 🔎 タグで絞り込む{selectedTags.length > 0 ? `（${selectedTags.length}）` : ''}
               </button>
             )}
             <div className="flex items-center justify-between mb-6 px-1">
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                 THERAPISTS
               </h3>
               <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-slate-300">
                 {castNameFilter ? `${sortedTherapists.length} / ` : ''}全{therapists.length}人
               </span>
             </div>

             {/* 絞り込み＋並び替え（SearchPageと同じ操作感） */}
             {therapists.length > 6 && (
               <div className="flex flex-col sm:flex-row gap-2 mb-5">
                 <div className="relative flex-1">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                   <input
                     type="text"
                     value={castNameFilter}
                     onChange={(e) => { setCastNameFilter(e.target.value); setDisplayCount(INITIAL_DISPLAY_COUNT); }}
                     placeholder="セラピスト名で絞り込み"
                     className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50"
                   />
                   {castNameFilter && (
                     <button onClick={() => setCastNameFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-sm">✕</button>
                   )}
                 </div>
                 <div className="flex gap-1.5">
                   {[
                     { key: 'default', label: '標準' },
                     { key: 'aiueo', label: '五十音' },
                     { key: 'reviews', label: '💬 口コミ順' },
                   ].map((o) => (
                     <button
                       key={o.key}
                       onClick={() => { setCastSortOrder(o.key); setDisplayCount(INITIAL_DISPLAY_COUNT); }}
                       className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition whitespace-nowrap ${
                         castSortOrder === o.key
                           ? 'bg-pink-600 border-pink-500 text-white'
                           : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                       }`}
                     >
                       {o.label}
                     </button>
                   ))}
                 </div>
               </div>
             )}

             {therapists.length > 0 ? (
               <>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {visibleTherapists.map(t => (
                     <Link key={t.id} to={`/shops/${shop.id}/threads/${t.id}`} className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-pink-500/50 transition-all duration-300">
                         <div className="aspect-[3/4] relative overflow-hidden">
                           <LazyImage src={t.image_url || t.image} alt={t.name} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                           <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-60"></div>
                           <div className="absolute top-2 left-2 flex flex-col gap-1">
                              {t.age && <span className="bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">{t.age}歳</span>}
                           </div>
                           <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                             {(() => {
                               const cnt = therapistReviewCounts[(t.name || '').replace(/[\s　]/g, '')];
                               return cnt > 0 ? (
                                 <span className="bg-pink-500 text-white text-[11px] font-black px-2 py-1 rounded-full shadow-lg shadow-pink-500/50 flex items-center gap-1">
                                   💬 {cnt}
                                 </span>
                               ) : null;
                             })()}
                             <button
                               onClick={(e) => {
                                 e.preventDefault();
                                 if (user) toggleFavTherapist(`${shop.id}_${t.id}`);
                                 else navigate(`/login?redirect=${encodeURIComponent(`/shops/${shop.id}`)}`);
                               }}
                               className="w-8 h-8 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-lg hover:bg-pink-600 transition"
                             >
                               {favTherapists.includes(`${shop.id}_${t.id}`) ? '❤️' : '🤍'}
                             </button>
                           </div>
                         </div>
                         <div className="absolute bottom-0 left-0 w-full p-3">
                           <div className="flex items-end justify-between">
                             <div>
                               <h4 className="text-white font-bold text-base leading-tight">{t.name}</h4>
                               <p className="text-[10px] text-slate-400 mt-0.5">T{t.tall || '-'} / B{t.cup || '-'}</p>
                             </div>
                             {t.isNew && <span className="text-[9px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">NEW</span>}
                           </div>
                         </div>
                     </Link>
                   ))}
                 </div>
                 {hasMore && (
                    <div className="mt-12 text-center">
                      <button 
                        onClick={handleLoadMore}
                        className="px-8 py-3 rounded-full bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 hover:text-white transition border border-white/5"
                      >
                        もっと見る (+{sortedTherapists.length - displayCount})
                      </button>
                    </div>
                 )}
               </>
             ) : (
                <div className="py-20 text-center text-slate-500 text-sm">
                   在籍セラピスト情報はありません
                </div>
             )}
             {therapists.length > 0 && sortedTherapists.length === 0 && (
               <div className="py-16 text-center text-slate-500 text-sm">
                 条件に一致するセラピストが見つかりません
               </div>
             )}
          </div>
          </div>
        </section>

        {/* 口コミ */}
        <section id="sec-review" className="scroll-mt-32 order-2">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
            <div className="flex items-center justify-between mb-6 px-1">
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                 REVIEWS
               </h3>
               <button 
                  onClick={handlePostReview}
                  className="bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold text-white border border-white/10 transition flex items-center gap-2"
               >
                 <span>✍️</span> 投稿する
               </button>
            </div>

            {reviews.length > 0 ? (
               <div className="space-y-4 relative">
                 {/* ⚠️ 2026-08-12: 以前は `shouldBlur = idx > 0 && !isPremiumUser` で
                     **2件目以降を一律ぼかし**ていた。isPremiumUser は premium/vip しか見ておらず、
                     W2Rで閲覧権(credits)を得た人が対象外だった＝700字書いても読めない行き止まり。
                     12_適用後はDBのRLS（reviews_public_read / own / entitled / admin）が
                     「読める行だけ返す」正本になるため、**UI側の一律ぼかしは撤去**する。
                     個々の口コミ内の本文ロックは ModernReviewCard 側が
                     is_public / credits / plan / owner_manual を見て判定する。 */}
                 {reviews.map((review, idx) => (
                   <ModernReviewCard key={review.id || idx} review={review} />
                 ))}

                 {/* さらに読み込む（プラン限定をやめ、続きがあれば誰でも押せる。
                     読める行かどうかはDB側が決める） */}
                 {hasMoreReviews && (
                   <button
                     onClick={loadMoreReviews}
                     disabled={isLoadingMoreReviews}
                     className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition disabled:opacity-50"
                   >
                     {isLoadingMoreReviews ? '読み込み中...' : 'さらに読み込む'}
                   </button>
                 )}

                 {/* ⚠️ 2026-08-12撤去: 「続きはプレミアム限定（月額500円）」のオーバーレイ。
                     ①credits保有者もブロックしていた ②表示価格が戦略決定（¥980）と矛盾
                     ③課金は2026年内に開始しない決定（playbook/decisions.md D-004）。
                     読める/読めないの判定はDBのRLSと ModernReviewCard に一本化する。 */}
               </div>
            ) : (
               <div className="py-20 text-center bg-slate-900/50 rounded-3xl border border-white/5 border-dashed">
                 <p className="text-slate-500 font-bold mb-4">まだクチコミがありません</p>
                 <button 
                   onClick={handlePostReview}
                   className="text-pink-400 font-bold text-sm hover:underline"
                 >
                   一番乗りで投稿する →
                 </button>
               </div>
            )}
          </div>
        </section>

        {/* 出勤 */}
        {cloudShop?.schedule_url && (
        <section id="sec-schedule" className="scroll-mt-32 order-4">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                SCHEDULE
              </h3>
              <a
                href={cloudShop.schedule_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                別タブで開く ↗
              </a>
            </div>
            <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-900" style={{ height: '75vh' }}>
              <iframe
                src={cloudShop.schedule_url}
                title="出勤スケジュール"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
            <div className="mt-4 flex justify-center">
              <a
                href={cloudShop.schedule_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 border border-white/10 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                表示されない場合は公式サイトで確認
              </a>
            </div>
          </div>
        </section>
        )}

      </div>
    </div>
  );
}
