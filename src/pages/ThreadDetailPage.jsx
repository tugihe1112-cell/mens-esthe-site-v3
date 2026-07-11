import React, { useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from '../compat/router';
import { useShopData } from '../contexts/DataContext.jsx';
import { useAppContext } from '../context/AppContext.tsx';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed.js';
import LazyImage from '../components/LazyImage.jsx';
import ModernReviewCard from '../components/ModernReviewCard.jsx';
import ReviewListWithRestriction from '../components/ReviewListWithRestriction.jsx';
import SeoHead from '../components/SeoHead.jsx';
import { getDisplayName } from '../utils/shopHelpers';

// ローディング中の骨組み（全画面テキスト→スケルトンで"個人サイト感"を除去）
function ThreadSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 pb-32">
      <div className="max-w-2xl mx-auto px-4 pt-20 space-y-6">
        <div className="h-4 w-1/2 bg-slate-800 rounded animate-pulse" />
        <div className="flex gap-4">
          <div className="w-[40%] max-w-[200px] bg-slate-800 rounded-2xl animate-pulse" style={{ aspectRatio: '3 / 4', maxHeight: '320px' }} />
          <div className="flex-1 space-y-3 py-4">
            <div className="h-4 w-2/3 bg-slate-800 rounded animate-pulse" />
            <div className="h-7 w-1/2 bg-slate-800 rounded animate-pulse" />
            <div className="h-5 w-3/4 bg-slate-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-32 bg-slate-900 rounded-2xl animate-pulse" />
        <div className="h-48 bg-slate-900 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

export default function ThreadDetailPage({ ssrShop = null, ssrTherapist = null, ssrReviews = [] }) {
  const { shopId, threadId } = useParams();
  const navigate = useNavigate();
  const { shopById, therapistById, reviews } = useShopData();
  const { favTherapists, toggleFavTherapist } = useAppContext();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  React.useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      // SSRデータが無いときだけスケルトンを出す（SSRデータがあれば裏で静かに更新＝チラつかせない）
      if (!ssrTherapist) setIsLoading(true);
      try {
        const url = process.env.VITE_SUPABASE_URL;
        const key = process.env.VITE_SUPABASE_ANON_KEY;
        if (!url || !key) return;
        const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };
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
          const normName = therapistName.replace(/[\s　]/g, '');
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
            // スペース除去して正規化マッチング
            const matched = rData.filter(r =>
              r.therapist_name && r.therapist_name.replace(/[\s　]/g, '') === normName
            );
            setCloudTherapistReviews(matched);
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
  }, [shopId, threadId]);

  const shop = cloudShop || (shopById ? shopById[shopId] : null);
  let therapist = cloudTherapist || (therapistById ? therapistById[threadId] : null);

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
        image: therapist.image,
        shopName: shop.name
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

  // 直接取得した口コミを優先、なければDataContextのreviewsからフォールバック
  const therapistReviews = useMemo(() => {
    if (cloudTherapistReviews.length > 0) return cloudTherapistReviews;
    if (!shop || !therapist || !reviews) return [];
    return reviews.filter(r =>
      (r.therapistId === threadId) ||
      (r.threadId === threadId) ||
      (r.therapist_id === threadId) ||
      (r.therapist_name === therapist.name) ||
      (r.therapistName === therapist.name)
    );
  }, [cloudTherapistReviews, reviews, threadId, therapist?.name, shopId, shop?.group_id]);

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
        <p className="text-slate-300 font-bold">セラピストが見つかりませんでした</p>
        <button onClick={() => navigate(-1)} className="text-pink-400 font-bold underline">前のページに戻る</button>
      </div>
    );
  }

  const seoDesc = `${shop.name}（${shop.prefecture} ${shop.city}）のセラピスト、${therapist.name}さんのプロフィールとクチコミ。年齢:${therapist.age}歳。`;

  const handlePostReview = () => {
    navigate(`/shops/${shopId}/threads/${threadId}/review`);
  };



  // データ到着までスケルトンを出してエラーを阻止する
  if (isLoading) return <ThreadSkeleton />;

  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200 font-sans">
      <SeoHead
        title={`${therapist.name} | ${shop.name}`}
        description={seoDesc}
        path={`/shops/${shopId}/threads/${threadId}`}
      />

      {/* 構造化データ: セラピスト口コミ（公開分のみ）→ 検索結果に★リッチリザルト */}
      {therapistReviews.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HealthAndBeautyBusiness",
          "name": `${getDisplayName(shop.name)} ${therapist.name}`,
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

      {/* --- ページ本体：コンパクトヘッダー＋評価サマリ＋口コミ（口コミ1件目をファーストビューに） --- */}
      <div className="max-w-2xl mx-auto px-4 pt-20 relative z-30 space-y-6">
        {/* 戻る＋お気に入り */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} aria-label="前のページに戻る" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white/10 text-white text-sm font-bold border border-white/15 hover:bg-white/20 transition active:scale-95">
            <span className="text-base leading-none">←</span> 戻る
          </button>
          <button onClick={() => toggleFavTherapist(uniqueKey)} aria-label="お気に入り" className={`w-10 h-10 rounded-full flex items-center justify-center border transition active:scale-90 ${isFav ? 'bg-pink-600/80 border-pink-500 text-white' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
            <span className="text-xl">{isFav ? '❤️' : '🤍'}</span>
          </button>
        </div>

        {/* パンくず（JSON-LDのBreadcrumbListと視覚を一致） */}
        <nav aria-label="パンくず" className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
          <Link to="/" className="hover:text-white transition">ホーム</Link>
          <span className="text-slate-600">›</span>
          <Link to={`/search?shopId=${shopId}`} className="hover:text-white transition truncate max-w-[45%]">{getDisplayName(shop.name)}</Link>
          <span className="text-slate-600">›</span>
          <span className="text-slate-200 font-bold truncate max-w-[35%]">{therapist.name}</span>
        </nav>

        {/* コンパクトヘッダー：写真左40% ＋ 名前/店舗/評価サマリ右 */}
        <div className="flex gap-4">
          <div className="w-[40%] max-w-[200px] shrink-0">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900" style={{ aspectRatio: '3 / 4', maxHeight: '320px' }}>
              {(therapist.image_url || therapist.image) ? (
                <LazyImage src={therapist.image_url || therapist.image} alt={therapist.name} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-slate-600 tracking-widest">写真なし</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <Link to={`/search?shopId=${shopId}`} className="inline-flex items-center gap-1.5 mb-2 text-sm font-bold text-slate-400 hover:text-white transition min-w-0">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] shrink-0">🏢</span>
              <span className="truncate">{getDisplayName(shop.name)}</span>
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 break-words">{therapist.name}</h1>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {therapist.age && <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-[11px] font-bold text-white">{therapist.age}歳</span>}
              {therapist.T && <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-[11px] font-bold text-white">身長{therapist.T}cm</span>}
              {therapist.cup && <span className="px-2.5 py-0.5 rounded-full bg-pink-600/20 border border-pink-500/30 text-[11px] font-bold text-pink-300">{therapist.cup}カップ</span>}
              {therapist.types?.[0] && <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-[11px] font-bold text-slate-200">{therapist.types[0]}</span>}
            </div>
            {stats ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">★ {stats.avg}</span>
                <span className="text-xs text-slate-400 font-bold">（{stats.count}件の実体験レポ）</span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-bold">まだ評価がありません</div>
            )}
          </div>
        </div>

        {/* 店舗ページへの明示ボタン（料金・出勤・他セラピストを見たい人向け） */}
        <Link
          to={`/search?shopId=${shopId}`}
          className="flex items-center justify-between gap-3 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-pink-500/40 px-4 py-3 transition group"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm shrink-0">🏢</span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-white truncate">{getDisplayName(shop.name)}</span>
              <span className="block text-[11px] text-slate-400">料金・出勤・在籍セラピストを見る</span>
            </span>
          </span>
          <span className="text-pink-400 font-black shrink-0 group-hover:translate-x-0.5 transition-transform">›</span>
        </Link>

        {/* 評価サマリバー（6軸の平均）。口コミが1件のときは下の口コミカードと同じ内容になり重複するので、2件以上のときだけ表示 */}
        {stats && stats.count >= 2 && (
          <section className="bg-slate-900/60 rounded-2xl p-5 border border-white/10">
            <h2 className="text-xs font-bold text-slate-400 mb-4">評価の内訳（{stats.count}件の平均）</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {stats.axes.map((a) => (
                <div key={a.label} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold w-14 text-slate-400 shrink-0">{a.label}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-700 ease-out" style={{ width: `${Math.min((a.val / 5) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-white w-7 text-right">{a.val.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- クチコミセクション --- */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span className="text-pink-500">💬</span>
              クチコミ
              {therapistReviews.length > 0 && (
                <span className="text-slate-500 text-sm font-bold">({therapistReviews.length})</span>
              )}
            </h3>
            <button
              onClick={handlePostReview}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black py-2 px-5 rounded-full shadow-lg shadow-pink-600/30 active:scale-95 transition-all duration-300 flex items-center gap-2 text-sm"
            >
              <span>✍️</span> 書く
            </button>
          </div>

          {therapistReviews.length > 0 ? (
            <ReviewListWithRestriction reviews={therapistReviews} />
          ) : (
            <div className="text-center py-10 px-4 bg-slate-900/40 rounded-2xl border border-dashed border-purple-800/50">
              <p className="text-white font-black text-base mb-1">まだ口コミがありません</p>
              <p className="text-purple-300 text-xs font-bold mb-4">最初のレポを書くと<span className="text-white">即7日間読み放題</span>（先行者特典）</p>
              <button
                onClick={handlePostReview}
                className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black py-3 px-8 rounded-full shadow-lg shadow-pink-600/30 active:scale-95 transition-all duration-300 inline-flex items-center gap-2 mx-auto"
              >
                <span>✍️</span> 最初の口コミを書く
              </button>
            </div>
          )}
        </section>
      </div>

      {/* B-1: 追いCTA（スクロールで出るsticky）＝口コミを読み終えた直後に投稿へ誘導 */}
      {showStickyCta && (
        <div className="fixed left-0 right-0 z-40 px-4 pointer-events-none" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}>
          <button
            onClick={handlePostReview}
            className="pointer-events-auto w-full max-w-2xl mx-auto flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black py-3.5 rounded-2xl shadow-2xl shadow-pink-900/50 active:scale-[0.98] transition text-sm"
          >
            <span>✍️</span>{therapist.name}の口コミを書く
            <span className="text-[11px] font-bold bg-white/20 rounded-full px-2 py-0.5 whitespace-nowrap">7日間読み放題</span>
          </button>
        </div>
      )}
    </div>
  );
}
