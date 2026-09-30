import React, { useEffect, useMemo } from 'react';
import { authHeaders } from '../utils/supabaseRest';
import { supabase } from '../lib/supabase';
import { useParams, Link, useNavigate } from '../compat/router';
import { useShopData } from '../contexts/DataContext.jsx';
import { useAppContext } from '../context/AppContext.tsx';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import LazyImage from '../components/LazyImage.jsx';
import ModernReviewCard from '../components/ModernReviewCard.jsx';
import ReviewListWithRestriction from '../components/ReviewListWithRestriction.jsx';
import SeoHead from '../components/SeoHead.jsx';
import Header from '../components/Header.jsx';
import { getDisplayName } from '../utils/shopHelpers';
import { shopHref } from '../utils/brandGroups.js';
import { trackEvent } from '../utils/analytics';
import { useReturnTo } from '../utils/useReturnTo';
import { withReturnTo } from '../utils/authRedirect.js';
import { trackRegisterCtaClick } from '../utils/registerAnalytics';
import { filterReviewsForPerson } from '../utils/reviewIdentity.js';
import { isNotListed, NOT_LISTED_LABEL, NOT_LISTED_NOTE } from '../utils/therapistStatus.js';
import NeutralReviewNote from '../components/NeutralReviewNote.jsx';
import RatingFingerprint, { averageFingerprint } from '../components/RatingFingerprint.jsx';

const PenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 20l4-1 11-11-3-3L5 16z" /></svg>
);

// ローディング中の骨組み（全画面テキスト→スケルトンで"個人サイト感"を除去）
function ThreadSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 pb-32">
      <Header />
      <div className="max-w-3xl mx-auto px-4 pt-20 space-y-5">
        <div className="h-4 w-1/2 bg-slate-800 animate-pulse" />
        <div className="flex gap-4">
          <div className="w-[40%] max-w-[220px] bg-slate-800 animate-pulse" style={{ aspectRatio: '3 / 4', maxHeight: '320px' }} />
          <div className="flex-1 space-y-3 py-4">
            <div className="h-4 w-2/3 bg-slate-800 rounded animate-pulse" />
            <div className="h-7 w-1/2 bg-slate-800 rounded animate-pulse" />
            <div className="h-5 w-3/4 bg-slate-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-32 bg-slate-900 animate-pulse" />
        <div className="h-48 bg-slate-900 animate-pulse" />
      </div>
    </div>
  );
}

const EMPTY_REVIEWS = [];

export default function ThreadDetailPage({
  ssrShop = null,
  ssrTherapist = null,
  ssrReviews = EMPTY_REVIEWS,
  renderSeo = true,
}) {
  const { shopId, threadId } = useParams();
  const navigate = useNavigate();
  const { shopById, therapistById, reviews, roomCounts} = useShopData();
  const { favTherapists, toggleFavTherapist } = useAppContext();
  const { user } = useAuth();
  const { addToHistory } = useRecentlyViewed();

  // SSRで取得済みのデータを初期値に（クライアントの取り直し待ちを排除＝即・完全描画、写真チラつき解消）
  const [cloudShop, setCloudShop] = React.useState(ssrShop);
  const [cloudTherapist, setCloudTherapist] = React.useState(ssrTherapist);
  const [cloudTherapistReviews, setCloudTherapistReviews] = React.useState(ssrReviews || []);
  const [isLoading, setIsLoading] = React.useState(!ssrTherapist); // SSRデータがあればローディング不要

  // クライアント遷移（別セラピストへ）で再マウントされないため、新しいSSRデータが来たら即反映
  React.useEffect(() => {
    setCloudShop(ssrShop);
    setCloudTherapist(ssrTherapist);
    setCloudTherapistReviews(ssrReviews || []);
    setIsLoading(!ssrTherapist);
  }, [threadId, ssrShop, ssrTherapist, ssrReviews]);

  React.useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      // SSRデータが無いときだけスケルトンを出す（SSRデータがあれば裏で静かに更新＝チラつかせない）
      if (!ssrTherapist) setIsLoading(true);
      try {
        // ⚠️ 2026-09-23（速度）: **未ログインでSSRの中身があるときは取り直さない。**
        //    この取り直しは「ログイン中の人にだけ見える口コミ」（本人・閲覧権・管理者。RLSで決まる）を
        //    足すためのもの。未ログインで取れるのはSSRと同じ公開口コミだけなので、
        //    開くたびに通信6本（実測で最後の応答まで約1.2秒）が丸ごと無駄になっていた。
        //    ログイン中は今までどおり取り直す（下の authHeaders がセッションのJWTを載せる）。
        if (ssrTherapist) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData?.session) return;
        }
        const url = process.env.VITE_SUPABASE_URL;
        const key = process.env.VITE_SUPABASE_ANON_KEY;
        if (!url || !key) return;
        // ⚠️ 2026-08-12: anonキー固定だと TO authenticated のRLSが発火せず、
        //    本人・credits保有者・VIP・管理者に非公開口コミが返らない。
        const headers = await authHeaders();
        // id/名前は `,` や `&` を含みうるので必ずURLエンコードする（未エンコードだとクエリが壊れて取得できない）
        const encShopId = encodeURIComponent(shopId);
        const encThreadId = encodeURIComponent(threadId);

        // 1. ショップ取得
        const shopRes = await fetch(`${url}/rest/v1/shops?id=eq.${encShopId}&select=*`, { headers });
        const shopData = await shopRes.json();
        if (shopData && shopData.length > 0 && isMounted) setCloudShop(shopData[0]);

        // 2. セラピスト取得 (IDで検索)
        let tRes = await fetch(`${url}/rest/v1/therapists?id=eq.${encThreadId}&select=*`, { headers });
        let tData = await tRes.json();

        // 3. IDで見つからなければ、名前（URLの最後の部分）で検索
        if (!tData || tData.length === 0) {
          const extractedName = threadId.includes('_') ? threadId.split('_').pop() : threadId;
          tRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${encShopId}&name=eq.${encodeURIComponent(extractedName)}&select=*`, { headers });
          tData = await tRes.json();
        }

        let therapistName = null;
        if (tData && tData.length > 0 && isMounted) {
          setCloudTherapist(tData[0]);
          therapistName = tData[0].name;
        }

        // 4. 店舗の口コミを取得し、クライアント側でセラピスト名を正規化マッチング
        if (therapistName) {
          const shopForReview = shopData?.[0];
          const groupId = shopForReview?.group_id;

          // group_idがあれば系列店全店、なければ単店舗
          let reviewShopIds = [shopId];
          if (groupId) {
            const grpRes = await fetch(`${url}/rest/v1/shops?group_id=eq.${groupId}&select=id`, { headers });
            const grpData = await grpRes.json();
            if (Array.isArray(grpData) && grpData.length > 0) reviewShopIds = grpData.map(s => s.id);
          }

          const reviewQuery = reviewShopIds.length > 1
            ? `shop_id=in.(${reviewShopIds.join(',')})&`
            : `shop_id=eq.${shopId}&`;

          const rRes = await fetch(
            `${url}/rest/v1/reviews?${reviewQuery}order=created_at.desc&select=*`,
            { headers }
          );
          const rData = await rRes.json();
          if (Array.isArray(rData) && isMounted) {
            // ⚠️ 2026-09-08（FIXES.md F04）: ここは**名前だけ**で照合していた。
            //    系列全店から取っているので、同名の別人の口コミがそのまま混ざる。
            //    契約は src/utils/reviewIdentity.js に一本化した
            //    （IDがあるものはID完全一致だけ／IDが無い旧口コミは同名1人のときだけ）。
            // ⚠️ 2026-09-13: SSRは系列店の本人ぶんまで出すのに、ここが本人ID1つだけで
            //    絞り直していると、開いた直後に出た口コミがJS実行後に消える。
            //    同一人物の判定は reviewIdentity.js の契約5（同じ系列＋正規化名一致）。
            const rosterRes = await fetch(
              `${url}/rest/v1/therapists?${reviewQuery}select=id,shop_id,name`,
              { headers }
            );
            const rosterData = await rosterRes.json();
            const roster = Array.isArray(rosterData) ? rosterData : [];
            setCloudTherapistReviews(
              filterReviewsForPerson(
                rData,
                { id: threadId, shop_id: shopId, name: therapistName },
                roster,
                roster
              )
            );
          }
        }
      } catch(e) {
        console.error(e);
      } finally {
        if (isMounted) setIsLoading(false); // データ取得完了
      }
    };
    if (shopId && threadId) fetchData();
    return () => { isMounted = false; };
  }, [shopId, threadId, ssrTherapist]);

  const shop = cloudShop || (shopById ? shopById[shopId] : null);
  let therapist = cloudTherapist || (therapistById ? therapistById[threadId] : null);

  // ⚠️ 2026-09-09: 退店した人のページは口コミごと残る（公開済みURLを殺さないため）が、
  //    画面には**何も表示していなかった**＝訪問者は現役だと思って店へ行く。
  //    根拠にできるのは「店舗の最新の在籍一覧に居ない」という事実だけで、
  //    退店なのか休業なのか収集失敗なのかは我々には分からない。
  //    だから断定せず「在籍一覧にない」と書く（根拠のない表示をしない、D-010と同じ考え方）。
  //    判定材料は2つ: is_active=false（行は残っているが非在籍）／
  //    raw_data.archived=true（名簿から行ごと消え、SSRが口コミから復元したページ）。
  const notListed = isNotListed(therapist);

  // 🔥 AI自動生成対応：公式リストにいなくても、クチコミがあれば「仮想プロフィール」を自動で作る！
  if (!therapist && reviews) {
    const hasReviews = reviews.some(r => r.therapistId === threadId || r.threadId === threadId || r.therapist_id === threadId);
    if (hasReviews) {
      const extractedName = threadId.split('_').pop(); // IDから名前部分を抽出
      therapist = {
        id: threadId,
        name: extractedName,
        image: '', // 写真はないので空
        age: null,
        T: null
      };
    }
  }

  const uniqueKey = shop && therapist ? `${shop.id}_${therapist.id || therapist.name}` : '';
  const isFav = uniqueKey ? favTherapists.includes(uniqueKey) : false;

  // 2. すべてのHook（useEffect / useMemo）をEarly Returnより前に配置！
  useEffect(() => {
    if (therapist && shop && uniqueKey) {
      addToHistory({
        id: uniqueKey,
        therapistId: therapist.id,
        shopId: shop.id,
        name: therapist.name,
        image: therapist.image_url || therapist.image,
        image_url: therapist.image_url || therapist.image,
        shopName: shop.name,
        subText: shop.name,
        type: 'therapist',
        link: `/shops/${shop.id}/threads/${therapist.id}`,
      });
    }
  }, [uniqueKey, therapist, shop, addToHistory]);

  // B-1: 追いCTA（読み終えた瞬間＝投稿動機の最高点）。スクロールで出す。
  const [showStickyCta, setShowStickyCta] = React.useState(false);
  useEffect(() => {
    const onScroll = () => setShowStickyCta(window.scrollY > 450);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ⚠️ U04: 読了案内（RegisterInvite）の主ボタンが画面に見えている間は固定CTAを隠す。
  //    同じ意味のボタンが2つ重なって本文を覆うのを避けるため。
  //    **スクロールごとにstateを更新しない**ので IntersectionObserver を使う。
  const [inviteVisible, setInviteVisible] = React.useState(false);
  const threadReturnTo = useReturnTo();
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    const el = document.querySelector('[data-cta="review-end"]');
    if (!el) { setInviteVisible(false); return; }
    const io = new IntersectionObserver(
      (entries) => setInviteVisible(entries.some((e) => e.isIntersecting)),
      { rootMargin: '0px 0px -80px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [cloudTherapistReviews, reviews, threadId, user]);

  // 直接取得した口コミを優先、なければDataContextのreviewsからフォールバック
  const therapistReviews = useMemo(() => {
    if (cloudTherapistReviews.length > 0) return cloudTherapistReviews;
    if (!shop || !therapist || !reviews) return [];
    // ⚠️ F04: 名前一致（`r.therapist_name === therapist.name`）で拾い直さない。
    //    IDが違う同名の別人が混ざる。IDが無い旧データだけ契約に従って拾う。
    // DataContext側は系列の名簿を持っていないので、ここでは本人ぶんだけ。
    // 系列店を含む一覧は上のクラウド取得（cloudTherapistReviews）が担う。
    return filterReviewsForPerson(reviews, { id: threadId, shop_id: shopId, name: therapist.name }, [
      { id: threadId, shop_id: shopId, name: therapist.name },
    ], []);
  }, [cloudTherapistReviews, reviews, threadId, therapist, shop, shopId]);

  // 閲覧カウント（クライアント発火・fire-and-forget）。
  // gSSPから移したことでページをCDNキャッシュ可能に。botはJS非実行で自然除外。
  const trackedThreadRef = React.useRef(null);
  React.useEffect(() => {
    if (trackedThreadRef.current === threadId) return;
    const ids = (therapistReviews || []).map((r) => r.id).filter(Boolean);
    if (ids.length === 0) return;
    trackedThreadRef.current = threadId;
    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
      keepalive: true,
    }).catch(() => {});
  }, [therapistReviews, threadId]);

  const stats = useMemo(() => {
    if (therapistReviews.length === 0) return null;
    const keys = ['cleanliness', 'looks', 'style', 'service', 'massage', 'intimacy'];
    const sums = Object.fromEntries(keys.map((k) => [k, 0]));
    let ratingSum = 0;
    for (const r of therapistReviews) {
      const d = r.detailed_ratings || r.detailedRatings || {};
      for (const k of keys) sums[k] += Number(d[k] ?? r.rating ?? 3);
      ratingSum += Number(r.rating || 0);
    }
    const count = therapistReviews.length;
    const avgOf = (k) => sums[k] / count;
    return {
      count,
      avg: (ratingSum / count).toFixed(1),
      axes: [
        { label: '清潔感', val: avgOf('cleanliness') },
        { label: 'ルックス', val: avgOf('looks') },
        { label: 'スタイル', val: avgOf('style') },
        { label: '接客', val: avgOf('service') },
        { label: 'マッサージ', val: avgOf('massage') },
        { label: '密着', val: avgOf('intimacy') },
      ],
    };
  }, [therapistReviews]);

  // 3. Hookの処理が終わったあとに、初めて Loading / Not Found の判定を行う！
  if (!shopById || !therapistById) return <ThreadSkeleton />;

  if (!shop || !therapist) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4 px-6 text-center">
        <Header />
        <p className="text-slate-300 font-bold">セラピストが見つかりませんでした</p>
        <button onClick={() => navigate(-1)} className="text-pink-400 font-bold underline">前のページに戻る</button>
      </div>
    );
  }

  // 場所・年齢は欠損することがあるので、空なら丸ごと省く（「（undefined undefined）」「年齢:undefined歳」を出さない）
  const shopPlace = [shop.prefecture, shop.city].filter(Boolean).join(' ');
  // ⚠️ 在籍一覧に居ない人に「在籍情報を確認できます」と書かない。
  const seoDesc = notListed
    ? `${getDisplayName(shop.name, shop)}${shopPlace ? `（${shopPlace}）` : ''}の${therapist.name}さんのページ。現在は在籍一覧に掲載されていません。過去に利用者が投稿した口コミ・評価・体験談を確認できます。`
    : `${getDisplayName(shop.name, shop)}${shopPlace ? `（${shopPlace}）` : ''}のセラピスト、${therapist.name}さんのプロフィール。${therapist.age ? `年齢:${therapist.age}歳。` : ''}在籍情報、利用者が投稿した口コミ・評価、施術や接客の体験談をメンエスマップで確認できます。`;

  const handlePostReview = (placement) => {
    trackEvent('click_write_from_thread', {
      shop_id: shopId,
      therapist_id: threadId,
      placement,
    });
    navigate(`/shops/${shopId}/threads/${threadId}/review`);
  };



  // データ到着までスケルトンを出してエラーを阻止する
  if (isLoading) return <ThreadSkeleton />;

  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200 font-sans">
      <Header />
      {renderSeo && (
        <SeoHead
          title={`${therapist.name} | ${getDisplayName(shop.name, shop)}`}
          description={seoDesc}
          path={`/shops/${shopId}/threads/${threadId}`}
        />
      )}

      {/* 構造化データ: セラピスト口コミ（公開分のみ）→ 検索結果に★リッチリザルト */}
      {renderSeo && therapistReviews.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HealthAndBeautyBusiness",
          "name": `${getDisplayName(shop.name, shop)} ${therapist.name}`,
          "url": `https://www.mens-esthe-map.jp/shops/${shopId}/threads/${threadId}`,
          "image": therapist.image_url || therapist.image || undefined,
          "address": {
            "@type": "PostalAddress",
            "addressRegion": shop.prefecture || undefined,
            "addressLocality": shop.city || undefined,
            "addressCountry": "JP"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": (therapistReviews.reduce((s, r) => s + Number(r.rating || 0), 0) / therapistReviews.length).toFixed(1),
            "reviewCount": therapistReviews.length,
            "bestRating": 5,
            "worstRating": 1
          },
          "review": therapistReviews
            .filter(r => r.is_public === true || r.user_id === 'owner_manual')
            .slice(0, 5)
            .map(r => ({
              "@type": "Review",
              "author": { "@type": "Person", "name": r.user_name || r.userName || "匿名" },
              "datePublished": (r.created_at || r.timestamp || '').slice(0, 10) || undefined,
              "reviewRating": { "@type": "Rating", "ratingValue": Number(r.rating || 0), "bestRating": 5, "worstRating": 1 },
              "reviewBody": (r.content || '').slice(0, 1500)
            }))
        }) }} />
      )}

      {/* --- ページ本体：見出し（写真・名前・点数）→ 採点の形 → 口コミ（デザインA案「夜の文芸誌」2026-09-30） ---
          ⚠️ 写真は左40%・最大220px（スマホで口コミ1件目を最初の画面に入れるため・2026-08-14）。 */}
      <div className="max-w-3xl mx-auto px-4 pt-20 relative z-30 space-y-6">
        {/* 戻る＋お気に入り */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} aria-label="前のページに戻る" className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-slate-700 px-3.5 text-sm font-bold text-slate-200 transition hover:border-slate-500 active:scale-95">
            <span className="text-base leading-none" aria-hidden="true">←</span> 戻る
          </button>
          <button
            onClick={() => user ? toggleFavTherapist(uniqueKey) : navigate(`/login?redirect=${encodeURIComponent(`/shops/${shopId}/threads/${threadId}`)}`)}
            aria-label={isFav ? 'お気に入りから外す' : 'お気に入りに入れる'}
            aria-pressed={isFav}
            className={`flex h-10 w-10 items-center justify-center rounded-sm border transition active:scale-90 ${isFav ? 'border-pink-500 text-pink-400' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>
        </div>

        {/* パンくず（JSON-LDのBreadcrumbListと視覚を一致） */}
        <nav aria-label="パンくず" className="-my-3 flex items-center gap-2 text-xs text-slate-400">
          <Link to="/" className="inline-flex min-h-11 items-center hover:text-white transition">ホーム</Link>
          <span className="text-slate-600" aria-hidden="true">/</span>
          <Link to={shopHref(shop || { id: shopId }, roomCounts)} className="inline-flex min-h-11 min-w-0 max-w-[45%] items-center hover:text-white transition"><span className="truncate">{getDisplayName(shop.name, shop)}</span></Link>
          <span className="text-slate-600" aria-hidden="true">/</span>
          <span className="text-slate-300 truncate max-w-[35%]">{therapist.name}</span>
        </nav>

        {/* 見出し：写真左40% ＋ 店・名前・点数 */}
        <div className="flex gap-4 sm:gap-6">
          <div className="w-[40%] max-w-[220px] shrink-0">
            <div className="relative max-h-[220px] sm:max-h-[320px] overflow-hidden border border-slate-700 bg-slate-900" style={{ aspectRatio: '3 / 4' }}>
              {(therapist.image_url || therapist.image) ? (
                <LazyImage src={therapist.image_url || therapist.image} alt={therapist.name} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm text-slate-500 tracking-widest">写真なし</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <Link to={shopHref(shop || { id: shopId }, roomCounts)} className="inline-flex min-h-11 items-center text-xs tracking-[0.12em] text-slate-400 hover:text-white transition min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500">
              <span className="truncate">{getDisplayName(shop.name, shop)}{shopPlace && ` · ${shop.city || shop.prefecture}`}</span>
            </Link>
            <h1 className="font-mincho text-[30px] md:text-[40px] font-bold text-slate-50 leading-[1.15] mb-3 break-words">
              {therapist.name}
              {notListed && (
                <span className="ml-2 align-middle inline-flex items-center rounded-sm border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 font-sans font-bold text-amber-200" style={{ fontSize: '12px' }}>
                  {NOT_LISTED_LABEL}
                </span>
              )}
            </h1>
            {notListed && (
              <p className="mb-3 border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-amber-100" style={{ fontSize: '13px', lineHeight: 1.7 }}>
                {NOT_LISTED_NOTE}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {therapist.age && <span className="px-2.5 py-0.5 rounded-full border border-slate-700 text-[11px] text-slate-200">{therapist.age}歳</span>}
              {therapist.T && <span className="px-2.5 py-0.5 rounded-full border border-slate-700 text-[11px] text-slate-200">身長{therapist.T}cm</span>}
              {therapist.cup && <span className="px-2.5 py-0.5 rounded-full border border-slate-700 text-[11px] text-slate-200">{therapist.cup}カップ</span>}
              {therapist.types?.[0] && <span className="px-2.5 py-0.5 rounded-full border border-slate-700 text-[11px] text-slate-200">{therapist.types[0]}</span>}
            </div>
            {stats ? (
              <div className="flex items-end gap-2.5">
                <span className="font-numeral text-[48px] font-semibold leading-[0.85] text-slate-50" aria-label={`平均 ${stats.avg}（5点満点）`}>{stats.avg}</span>
                <span className="flex flex-col gap-0.5 pb-0.5 text-xs text-slate-400"><span>/ 5</span><span>{stats.count}件の実体験レポート</span></span>
              </div>
            ) : (
              <div className="text-xs text-slate-500">まだ評価がありません</div>
            )}
          </div>
        </div>

        {/* 採点の形（平均）。口コミが1件のときは下の口コミに同じ図が出るので、2件以上のときだけ。 */}
        {stats && stats.count >= 2 && averageFingerprint(therapistReviews) && (
          <section className="border-t border-slate-800 pt-6">
            <h2 className="font-mincho text-lg font-bold text-slate-50">
              採点の形<span className="ml-2 font-sans text-xs font-normal text-slate-400">{stats.count}件の平均</span>
            </h2>
            <RatingFingerprint values={averageFingerprint(therapistReviews)?.values} decimals={1} className="mt-3" />
          </section>
        )}

        {/* --- 口コミ --- */}
        <section className="pt-2">
          <div className="flex items-end justify-between gap-3 border-b border-slate-700 pb-3">
            <h2 className="font-mincho text-2xl font-bold text-slate-50">
              口コミ
              {therapistReviews.length > 0 && (
                <span className="ml-2 font-numeral text-xl font-medium text-slate-400">{therapistReviews.length}</span>
              )}
            </h2>
            <button
              onClick={() => handlePostReview('review_header')}
              className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-pink-500 px-4 text-sm font-bold text-pink-200 transition hover:bg-pink-500/10 active:scale-95"
            >
              <PenIcon /> 書く
            </button>
          </div>
          {/* D-003: 口コミを読む場所で「広告ではない」と分かるように（2026-09-23） */}
          <NeutralReviewNote className="mt-3 mb-2" />

          {therapistReviews.length > 0 ? (
            <ReviewListWithRestriction reviews={therapistReviews} shopId={shopId} therapistId={threadId} />
          ) : (
            <div className="mt-4 border border-slate-700 bg-slate-900 px-5 py-7">
              <p className="font-mincho text-xl font-bold leading-[1.5] text-slate-50">まだ口コミがありません。<br />最初の体験を、<br className="sm:hidden" />次の人の判断材料に。</p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-300"><span className="text-slate-50">200字で3日間・700字で7日間</span>、口コミが読み放題</p>
              <button
                onClick={() => handlePostReview('empty_state')}
                className="mt-5 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-sm bg-pink-500 px-6 text-[15px] font-bold text-slate-950 transition hover:bg-pink-400 active:scale-[0.98] sm:w-auto"
              >
                <PenIcon /> 最初の口コミを書く
              </button>
              {/* ⚠️ 投稿ページに入る前の段階で「途中でやめられる」ことを伝える（2026-08-18）。
                     ここで「700字も書くのか、面倒だ」と思われたらページにすら来ない。
                     下書き機能は存在するだけでは意味がなく、**着手前に知られている**必要がある。 */}
              <p className="mt-3 text-[12px] text-slate-400">
                書きかけは自動保存されます。一度に書き切らなくて大丈夫です
              </p>
            </div>
          )}
        </section>
      </div>

      {/* B-1: 追いCTA（スクロールで出るsticky）。
          ⚠️ U04: 未登録には投稿ではなく**登録**を出す（投稿は登録より遠い操作）。
             登録済みの対象指定つき投稿導線は従来どおり維持する。
             読了案内が見えている間は出さない（同じ意味のボタンを重ねない）。 */}
      {showStickyCta && !inviteVisible && (
        <div className="fixed left-0 right-0 z-40 px-4 pointer-events-none" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}>
          {user ? (
            <button
              onClick={() => handlePostReview('sticky')}
              className="pointer-events-auto w-full max-w-2xl mx-auto flex items-center justify-center gap-2 rounded-sm bg-pink-500 py-3.5 text-sm font-bold text-slate-950 shadow-[0_10px_30px_rgba(0,0,0,0.55)] transition hover:bg-pink-400 active:scale-[0.98]"
            >
              <PenIcon />{therapist.name}の口コミを書く
              <span className="whitespace-nowrap rounded-sm bg-slate-950/15 px-2 py-0.5 text-[11px] font-bold">最大7日間</span>
            </button>
          ) : (
            <Link
              to={withReturnTo('/register', threadReturnTo, { source: 'review_end' })}
              onClick={() => { trackEvent('click_paywall_cta', { target: 'register', source: 'sticky' }); trackRegisterCtaClick('review_end'); }}
              className="pointer-events-auto w-full max-w-2xl mx-auto flex items-center justify-center gap-2 rounded-sm bg-pink-500 py-3.5 text-sm font-bold text-slate-950 shadow-[0_10px_30px_rgba(0,0,0,0.55)] transition hover:bg-pink-400 active:scale-[0.98]"
            >
              無料登録する
              <span className="whitespace-nowrap rounded-sm bg-slate-950/15 px-2 py-0.5 text-[11px] font-bold">3日間読み放題</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
