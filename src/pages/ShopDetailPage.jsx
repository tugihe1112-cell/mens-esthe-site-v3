import { shopHref } from '../utils/brandGroups.js';
import React, { useState, useEffect } from 'react';
import { TAG_CATEGORIES as TAG_SOURCE } from '../data/constants';
import { TagFilterSidebar, TagFilterButton } from '../components/TagFilterSidebar.jsx';
import { useResponsiveFilterSheet } from '../hooks/useResponsiveFilterSheet.js';
import { authHeaders } from '../utils/supabaseRest';
import { buildTherapistReviewIndex, reviewsForTherapist, summarizeReviews, normalizeTherapistName } from '../utils/reviewIdentity.js';
import { useParams, Link, useNavigate } from '../compat/router';
import { useShopData } from '../contexts/DataContext.jsx';
import { useAppContext } from '../context/AppContext.tsx';
import { useAuth } from '../contexts/AuthContext.jsx'; 
import LazyImage from '../components/LazyImage.jsx';
import ModernReviewCard from '../components/ModernReviewCard.jsx';
import SeoHead from '../components/SeoHead.jsx';
import Header from '../components/Header.jsx';
import { getDisplayName, getTherapistDisplayName } from '../utils/shopHelpers';
import LocationLabel from '../components/LocationLabel.jsx';
import { joinFields, shapeShopRow, shopAreaList } from '../utils/shopFields';
import { trackEvent } from '../utils/analytics';
import siteStats from '../data/stats-latest.json';
import ShopStatusBanner from '../components/ShopStatusBanner.jsx';
import NeutralReviewNote from '../components/NeutralReviewNote.jsx';
import RatingFingerprint, { averageFingerprint } from '../components/RatingFingerprint.jsx';
import { splitNameReading } from '../utils/nameReading.js';

const PenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 20l4-1 11-11-3-3L5 16z" /></svg>
);
const HeartIcon = ({ filled = false }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);


// 左サイドバーのタグ絞り込み（SearchPage と同一定義。表記を割らないため必ず揃える）
// ⚠️ タグ定義をここに書き戻さないこと（src/data/constants.js が唯一の定義元）。
//    以前はローカル定義で、投稿画面(constants.js)と食い違っていた（「新人」が検索側にだけ存在）。
const TAG_CATEGORIES = TAG_SOURCE.map(c => ({ id: c.id, title: c.titleEn, tags: c.tags }));

const INITIAL_DISPLAY_COUNT = 12;
const LOAD_MORE_COUNT = 12;

export default function ShopDetailPage({
  ssrShop = null,
  ssrReviews = [],
  ssrTherapistCount = 0,
  ssrReviewedTherapists = [],
  ssrNearbyShops = [],
  ssrPrefecture = null,
  ssrArea = null,
  ssrNearbyScope = 'prefecture',
  ssrReviewCount = 0,
  ssrAvgRating = null,
  ssrGroupShopIds = null,
  renderSeo = true,
}) {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { shopById, getTherapistsByShopId, getReviewsByShopId, loadTherapistsForShop, loadReviewsForShop, roomCounts } = useShopData();
  const { toggleFavorite, favorites, toggleFavTherapist, favTherapists } = useAppContext();
  
  const { user, userPlan } = useAuth();
  const isPremiumUser = userPlan === 'premium' || userPlan === 'vip';

  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
  // キャスト一覧の絞り込み・並び替え（SearchPageと同じ操作感に揃える）
  const [castNameFilter, setCastNameFilter] = useState('');
  const [castSortOrder, setCastSortOrder] = useState('default'); // default | aiueo | reviews
  const [selectedTags, setSelectedTags] = useState([]);
  const { isOpen: isFilterOpen, open: openFilter, close: closeFilter, openerRef: filterOpenerRef, panelRef: filterPanelRef, dialogId: filterDialogId } = useResponsiveFilterSheet(shopId);
  // セラピスト名 → その人の口コミに付いたタグ集合
  const [reviewTagMap, setReviewTagMap] = useState({});

  // 🔒 ロック1：完全個室化ステート（※変数名は cloudShop のまま残して、後半のエラーを完全回避！）
  const [cloudShop, setCloudShop] = useState(null);
  const [cloudTherapists, setCloudTherapists] = useState(null);
  // 公開口コミはSSR値から開始し、認証確定後にRLSで読める最新行へ更新する。
  // これにより初期HTMLにも実本文が入り、件数表示と空状態が矛盾しない。
  const [cloudReviews, setCloudReviews] = useState(ssrReviews || []);
  const [isFetching, setIsFetching] = useState(true);

  // レビューページネーション
  const REVIEW_PAGE_SIZE = 20;
  const [reviewOffset, setReviewOffset] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false);

  // セラピスト別口コミ件数 { name → count }
  // ⚠️ F04: キーは therapist_id（正規化名ではない）。
  const [therapistReviewCounts, setTherapistReviewCounts] = useState({});
  // ⚠️ F05: 未取得と0件を区別する。取得前に「0件」と描かない。
  const [countsReady, setCountsReady] = useState(false);

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

        // 1. 店舗データ（住所などの表示用）。後続の処理が失敗しても表示できるよう、届き次第セットする。
        const shopPromise = fetch(`${url}/rest/v1/shops?id=eq.${shopId}&select=*`, { headers, cache: 'no-store' })
          .then((r) => r.json())
          .then((shopData) => {
            if (isMounted && Array.isArray(shopData) && shopData.length > 0) setCloudShop(shopData[0]);
            return shopData;
          })
          // ⚠️ SSRのIDで先へ進む経路ではこの結果を待たないので、失敗を握っておく（未処理の例外にしない）。
          //    店舗データが取れなくても在籍一覧は取りに行く（表示は SSR と共有箱の店舗情報で足りる）。
          .catch((err) => { console.error('shop fetch failed', err); return null; });

        // 2. 在籍を取る店舗ID（系列があれば系列全店）
        // 🚩 2026-09-23（速度）: SSRが同じIDを計算済みなら、それを使って**すぐ**在籍を取りに行く。
        //    以前は「店舗→系列→在籍」を順番に待ち、在籍一覧（このページの主役）が2往復ぶん遅れていた。
        //    ⚠️ SSRの値は「この店のページとして描いたもの」だけ使う（別の店へ移った直後の古いpropsを使わない）。
        //    無いとき（SSR失敗・別経路から来た）は従来どおり店舗→系列の順に取る。
        let therapistShopIds = [shopId];
        const ssrIdsUsable = ssrShop?.id === shopId
          && Array.isArray(ssrGroupShopIds) && ssrGroupShopIds.length > 0 && ssrGroupShopIds.includes(shopId);
        if (ssrIdsUsable) {
          therapistShopIds = ssrGroupShopIds;
        } else {
          const shopData = await shopPromise;
          const groupId = shopData?.[0]?.group_id;
          if (groupId) {
            const groupShopsRes = await fetch(`${url}/rest/v1/shops?group_id=eq.${groupId}&select=id`, { headers, cache: 'no-store' });
            const groupShops = await groupShopsRes.json();
            if (Array.isArray(groupShops) && groupShops.length > 0) {
              therapistShopIds = groupShops.map(s => s.id);
            }
          }
        }
        // 🚩 **写真の有無で絞らない**（2026-09-16）。
        //    以前は `image_url=not.is.null` で写真がある人だけ取っていた。その結果、
        //    店舗情報の「在籍N人」（SSRの全行カウント）と一覧の「全N人」（写真ありだけ）が
        //    **同じ画面で食い違い**、極端な例では Finale (フィナーレ) が
        //    「在籍 356 人」と「全0人／在籍セラピスト情報はありません」を並べて出していた。
        //    実測: 店舗ページが出る725店のうち355店でずれ、**112店・4,418人ぶんが一覧ゼロ**。
        //    その4,418行は非表示0・最終確認日なし0・180日超は42行だけ＝**確認できている実在の人**で、
        //    写真が無いだけだった。口コミ投稿フォームでは前から選べる人たちでもある。
        //    ⇒ 表に出す。写真が無い行は LazyImage が頭文字のプレースホルダを出す。
        const therapistQuery = `shop_id=in.(${therapistShopIds.join(',')})`;

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

        // セラピスト別口コミ件数（軽量）
        // ⚠️ 2026-09-08（FIXES.md F04）: therapist_id と shop_id も取る。
        //    名前だけでは系列店の同名の別人を1人に束ねてしまう。
        const countFetchUrl = reviewShopIds.length > 1
          ? `${url}/rest/v1/reviews?shop_id=in.(${reviewShopIds.join(',')})&select=therapist_id,shop_id,therapist_name,tags`
          : `${url}/rest/v1/reviews?shop_id=eq.${shopId}&select=therapist_id,shop_id,therapist_name,tags`;

        const [tData, rData, cData] = await Promise.all([
          tRes.json(),
          rRes.json(),
          fetch(countFetchUrl, { headers, cache: 'no-store' }).then(r => r.json()),
        ]);

        if (isMounted) {
          if (Array.isArray(tData)) {
            // ⚠️ ここでも画像で絞らない（上の therapistQuery と同じ理由）。
            //    絞ると取得を直した意味が消える＝「直したつもりで直っていない」になる。
            setCloudTherapists(tData.filter((t) => t.is_active !== false));
          }
          if (Array.isArray(rData)) {
            setCloudReviews(rData);
            setHasMoreReviews(rData.length === REVIEW_PAGE_SIZE);
            setReviewOffset(REVIEW_PAGE_SIZE);
          }
          if (Array.isArray(cData) && Array.isArray(tData)) {
            // ⚠️ F04: キーは therapist_id。名前キーは同名の別人を混ぜる。
            const roster = tData.map((t) => ({ id: t.id, shop_id: t.shop_id, name: t.name }));
            const index = buildTherapistReviewIndex(cData, roster);
            const counts = {};
            const tagMap = {};
            for (const t of roster) {
              const summary = summarizeReviews(reviewsForTherapist(index, t.id));
              counts[t.id] = summary.count;
              tagMap[t.id] = summary.tags;
            }
            setTherapistReviewCounts(counts);
            setReviewTagMap(tagMap);
            setCountsReady(true);
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
  }, [shopId, ssrGroupShopIds, ssrShop?.id]);

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
    // 🚩 **重複排除より前に、写真ありを先頭へ並べる。**
    //    下の filter は同じ名前の**先に来たほうを残す**（先勝ち）。
    //    写真なしの行が先に来ると、同じ人の写真あり行が捨てられて
    //    **写真を持っている人が写真なしで表示される**。
    //    写真の有無で絞るのをやめた（2026-09-16）ことで初めて起こるようになった事故。
    const hasImage = (t) => Boolean(String(t?.image_url ?? t?.image ?? '').trim());
    const ordered = [...(source || [])].sort((a, b) => Number(hasImage(b)) - Number(hasImage(a)));
    const seen = new Set();
    return ordered.filter((therapist) => {
      // ⚠️ 独自の正規化を書かない。ここだけ半角/全角・大文字小文字を畳まないと
      //    「ｱｲ」と「アイ」が別人として2枚並ぶ。人物同定は reviewIdentity に一本化する。
      const key = normalizeTherapistName(therapist.name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [cloudTherapists, getTherapistsByShopId, shopId]);
  const reviews = cloudReviews.length > 0 ? cloudReviews : (getReviewsByShopId ? getReviewsByShopId(shopId, isPremiumUser) : []);
  const isFavorite = shop ? favorites.includes(shop.id) : false;

  // ⚠️ 2026-09-30: ここにあった「店舗IDから特別なロゴを出す」処理（ゆるスパ系・メンエスグループ系）は削除した。
  //    指していた画像は旧画像置き場（Supabase Storage）で、2026-06-30 に R2 へ移したあとは 400 を返し、
  //    その2系列の店だけ壊れた画像を出していた。店の画像は image_url（R2）だけを使う。

  // 名前で絞り込み → 並び替え → 表示件数で切る（SearchPageと同じ流れ）
  // ⚠️ 人物の同定は reviewIdentity に一本化する（独自の正規化を書かない）。
  //    空白を除くだけでは半角/全角・大文字小文字が畳まれず、「ｱｲ」と「アイ」が別人になる。
  const normName = (s) => normalizeTherapistName(s);
  const tagCounts = React.useMemo(() => {
    const counts = {};
    TAG_CATEGORIES.forEach(cat => cat.tags.forEach(t => { counts[t] = 0; }));
    for (const t of therapists) {
      const tags = reviewTagMap[t.id] || new Set();
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

  const sortedTherapists = React.useMemo(() => {
    let list = [...therapists];
    if (selectedTags.length > 0) {
      list = list.filter((t) => {
        const tags = reviewTagMap[t.id] || new Set();
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
      list.sort((a, b) => (therapistReviewCounts[b.id] || 0) - (therapistReviewCounts[a.id] || 0));
    } else {
      // 既定（標準）は写真ありを先に。プレースホルダばかりが先頭に並ぶのを避ける。
      // ⚠️ 五十音・口コミ順のときは**並べ替えない**。利用者が指定した順を写真の有無で崩さない。
      list.sort((a, b) => Number(Boolean(String(b?.image_url ?? b?.image ?? '').trim()))
        - Number(Boolean(String(a?.image_url ?? a?.image ?? '').trim())));
    }
    return list;
  }, [therapists, castNameFilter, castSortOrder, therapistReviewCounts, selectedTags, reviewTagMap]);

  const visibleTherapists = sortedTherapists.slice(0, displayCount);
  const hasMore = displayCount < sortedTherapists.length;
  const handleLoadMore = () => setDisplayCount(prev => prev + LOAD_MORE_COUNT);

  // ✨ すべてのHook（useState, useEffect）が終わったので、ここで初めて安全に早期リターン！
  if (isFetching && !shop) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300 animate-pulse">読み込み中…</div>;
  if (!shop) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">店舗が見つかりませんでした</div>;

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
  // F06-C: 実際に使った集合の名前だけを見出しに出す。
  const nearbyScopeName = ssrNearbyScope === 'area' ? ssrArea : ssrPrefecture;
  const nearbyHeading = nearbyScopeName ? `${nearbyScopeName}の他の店舗` : '他の店舗';
  const seoTherapistCount = Math.max(ssrTherapistCount || 0, therapists.length);
  const seoTitle = reviewCount > 0 ? `${shop.name}の口コミ${reviewCount}件・セラピスト評判` : shop.name;
  const seoDesc = reviewCount > 0
    ? `${shop.name}の口コミ${reviewCount}件（平均★${avgRating}）。${seoLocation ? `${seoLocation}の` : ''}在籍セラピスト${seoTherapistCount}名の評判・体験談をチェック。`
    : `${shop.name}${seoLocation ? `（${seoLocation}）` : ''}の店舗情報。在籍セラピスト${seoTherapistCount}名。`;

  const handlePostReview = () => {
    navigate(`/shops/${shop.id}/review`);
  };
  // この店の採点の形（見出しに出す）。表示中の口コミから作る＝SSRの口コミと同じ母集団。
  const shopFingerprint = averageFingerprint(reviews);
  // 見出しは店名と読み（括弧の中のかな）を分けて組む＝読みが途中で折り返さない
  const headName = splitNameReading(getDisplayName(shop.name, shop));

  return (
    <div className="bg-slate-950 min-h-screen pb-24 md:pb-16 text-slate-200 font-sans relative">
      <Header />
      {renderSeo && (
        <SeoHead
          title={seoTitle}
          description={seoDesc}
          path={`/shops/${shop.id}`}
          image={`/api/og?shop=${encodeURIComponent(shop.name)}&sub=${encodeURIComponent(seoDesc.slice(0, 40))}&image=${encodeURIComponent(shop.image_url || shop.image || '')}`}
        />
      )}
      {renderSeo && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
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
      }) }} />}

      {/* 1. 店の見出し（デザインA案「夜の文芸誌」2026-09-30）
          PCは「店の画像｜店名・点数・在籍｜採点の形」の3列、スマホは縦に積む。
          🐛 店の画像の見せ方（2026-08-20 実測で特定）
             ・店舗画像は 2026-07-06 の一括リサイズで**全て最大600px**
             ・横長のロゴ／キャンペーンバナー（600x285等）が多く、object-cover で切ると文字の断片だけが出る
             【対処】背景はぼかした複製で埋め、本体は object-contain で全体を見せる。
             ⚠️ object-cover に戻さないこと（D-008）。 */}
      <section className="max-w-[1200px] mx-auto px-4 md:px-6 pt-20">
        <div className="flex items-center justify-between gap-3">
          <nav aria-label="パンくず" className="flex min-w-0 items-center gap-2 text-xs text-slate-400">
            <Link to="/" className="inline-flex min-h-11 items-center hover:text-white transition">ホーム</Link>
            {seoPrefecture && (
              <>
                <span className="text-slate-600" aria-hidden="true">/</span>
                <span className="shrink-0">{seoPrefecture}</span>
              </>
            )}
            <span className="text-slate-600" aria-hidden="true">/</span>
            <span className="truncate text-slate-300">{getDisplayName(shop.name, shop)}</span>
          </nav>
          <button
            onClick={() => navigate(-1)}
            aria-label="前のページに戻る"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm border border-slate-700 px-3.5 text-sm font-bold text-slate-200 transition hover:border-slate-500 active:scale-95"
          >
            <span className="text-base leading-none" aria-hidden="true">←</span> 戻る
          </button>
        </div>

        <div className={`mt-4 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:gap-8 ${shopFingerprint ? 'lg:grid-cols-[320px_minmax(0,1fr)_300px]' : ''} lg:items-center`}>
          {/* 店の画像 */}
          <div className="relative aspect-[16/9] md:aspect-[4/3] overflow-hidden border border-slate-700 bg-slate-900">
            <LazyImage
              src={shop.image_url || shop.image}
              alt=""
              className="absolute inset-0 w-full h-full scale-110 blur-2xl opacity-40"
              imgClassName="w-full h-full object-cover"
            />
            {/* ⚠️ object-contain は **imgClassName** で渡すこと。className はラッパーdivに付くだけで
                <img> には届かない（2026-08-20 にここで「直したつもりで直っていない」事故） */}
            <div className="absolute inset-0 flex items-center justify-center p-5">
              <LazyImage
                src={shop.image_url || shop.image}
                alt={shop.name}
                className="w-full h-full"
                imgClassName="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {/* 店名・点数・在籍 */}
          <div className="min-w-0">
            {/* ⚠️ 市区・エリアが両方とも無い店舗が65店ある。空の行を出さない。 */}
            {joinFields(shop.city, shopAreaList(shop)) && (
              <p className="text-xs tracking-[0.12em] text-slate-400">
                {joinFields(shop.city, shopAreaList(shop))}
              </p>
            )}
            <h1 className="mt-1 font-mincho text-[32px] md:text-[44px] font-bold leading-[1.15] text-slate-50 break-words">
              {headName.main}
              {headName.reading && <span className="mt-1 block font-sans text-sm font-normal tracking-[0.12em] text-slate-400">{headName.reading}</span>}
            </h1>
            {/* 閉店・営業未確認の帯。店名のすぐ下＝見落としようがない位置に置く。
                判定と文言は src/utils/shopStatus.js にしかない。 */}
            <ShopStatusBanner shop={shop} className="mt-3 text-left" />
            {/* 住所が無い店舗は614店（56%）。LocationLabelが空なら描画しないので「📍」だけ残らない。 */}
            <LocationLabel
              className="mt-2 text-xs text-slate-400 line-clamp-2"
              parts={[shop.address || joinFields(shop.prefecture, shop.city, shopAreaList(shop))]}
            />

            {/* ⚠️ 収集元サイトの `raw_data.rating` は使わない（shapeShopRow が構造的に落としている）。
                必ず**実際の口コミから算出した平均**だけを出す。
                🚩 口コミが0件のときは点数を出さない（「★ New」を出していた・2026-09-15）。D-010。 */}
            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-4 border-t border-slate-800 pt-4">
              {avgRating && (
                <div>
                  <dt className="text-[11px] tracking-[0.12em] text-slate-400">平均（口コミ{reviewCount}件）</dt>
                  <dd className="mt-1 font-numeral text-[40px] font-semibold leading-[0.9] text-slate-50">{avgRating}</dd>
                </div>
              )}
              {ssrTherapistCount > 0 && (
                <div>
                  <dt className="text-[11px] tracking-[0.12em] text-slate-400">在籍</dt>
                  <dd className="mt-1 text-slate-50"><span className="font-numeral text-[40px] font-semibold leading-[0.9]">{ssrTherapistCount.toLocaleString()}</span><span className="ml-1 text-xs text-slate-400">名</span></dd>
                </div>
              )}
              {(shop.business_hours || shop.raw_data?.hours) && (
                <div className="min-w-0">
                  <dt className="text-[11px] tracking-[0.12em] text-slate-400">営業時間</dt>
                  <dd className="mt-2 text-sm text-slate-100">{shop.business_hours || shop.raw_data?.hours}</dd>
                </div>
              )}
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={handlePostReview}
                className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-pink-500 px-5 text-sm font-bold text-slate-950 transition hover:bg-pink-400 active:scale-95"
              >
                <PenIcon /> この店の口コミを書く
              </button>
              <button
                onClick={() => user ? toggleFavorite(shop.id) : navigate(`/login?redirect=${encodeURIComponent(`/shops/${shop.id}`)}`)}
                aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
                aria-pressed={isFavorite}
                className={`inline-flex min-h-11 items-center gap-2 rounded-sm border px-4 text-sm font-bold transition ${isFavorite ? 'border-pink-500 text-pink-300' : 'border-slate-700 text-slate-200 hover:border-slate-500'}`}
              >
                <HeartIcon filled={isFavorite} />
                <span className="hidden sm:inline">{isFavorite ? 'お気に入り済み' : 'お気に入り'}</span>
              </button>
            </div>
          </div>

          {/* この店の採点の形（口コミの6項目の平均）。点数の付いた口コミが無ければ出さない。 */}
          {shopFingerprint && (
            <div className="md:col-span-2 lg:col-span-1">
              <RatingFingerprint
                values={shopFingerprint.values}
                decimals={1}
                caption={`口コミ${shopFingerprint.count}件の採点の形（この店の「指紋」）`}
              />
            </div>
          )}
        </div>
      </section>

      {/* 2. セクションナビ（旧タブUI）
          ⚠️ 2026-08: タブ切替を廃止し1ページに全セクションを積む形へ（D-001）。
             ただし内部リンク/canonical/JSON-LDは /shops/:id のまま維持する。ナビはアンカースクロール。 */}
      <div className="sticky top-14 md:top-20 z-40 mt-8 border-y border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="flex max-w-[1200px] mx-auto items-center gap-6 overflow-x-auto px-4 md:gap-8 md:px-6">
          {([
            { key: 'cast', label: '在籍セラピスト' },
            { key: 'review', label: reviewCount > 0 ? `口コミ ${reviewCount}` : '口コミ' },
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
              className="inline-flex min-h-12 shrink-0 items-center border-b-2 border-transparent text-sm text-slate-300 transition hover:border-pink-500 hover:text-white"
            >
              {tab.label}
            </a>
          ))}
          {/* D-003: 口コミを読む前に「広告ではない」と分かるように（PCだけ。スマホは口コミ欄に出す） */}
          <NeutralReviewNote className="ml-auto hidden shrink-0 lg:flex" />
        </div>
      </div>

      {/* 3. Content Area */}
      {/* ⚠️ U05: PCのコンテンツ幅を1200pxへ（左タグ＋一覧が窮屈だった） */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-10 min-h-[50vh] flex flex-col gap-12 md:gap-16">

        <section id="sec-info" className="scroll-mt-32 order-3">
          <div className="space-y-12">
            <div className="border-t border-slate-700 pt-6">
              <h2 className="font-mincho text-2xl font-bold text-slate-50">店舗情報</h2>

              <dl className="mt-5 divide-y divide-slate-800 border-y border-slate-800">
                {/* 在籍セラピスト数＝全1,098店が持つ固有の実データ。まずこれを出す */}
                {ssrTherapistCount > 0 && (
                  <div className="grid grid-cols-[88px_1fr] md:grid-cols-[140px_1fr] items-baseline gap-3 py-4">
                    <dt className="text-xs tracking-[0.12em] text-slate-400">在籍</dt>
                    <dd className="text-sm md:text-base text-slate-50">
                      <span className="font-numeral text-2xl">{ssrTherapistCount.toLocaleString()}</span> 人
                      {ssrReviewCount > 0 && (
                        <span className="text-slate-400 text-xs ml-3">
                          口コミ {ssrReviewCount}件{ssrAvgRating ? `・平均${ssrAvgRating}` : ''}
                        </span>
                      )}
                    </dd>
                  </div>
                )}
                {/* ⚠️「営業時間情報なし」は行き止まりなので、データがある時だけ出す */}
                {(shop.business_hours || shop.raw_data?.hours) && (
                  <div className="grid grid-cols-[88px_1fr] md:grid-cols-[140px_1fr] items-baseline gap-3 py-4">
                    <dt className="text-xs tracking-[0.12em] text-slate-400">営業時間</dt>
                    <dd className="text-sm md:text-base text-slate-50">{shop.business_hours || shop.raw_data?.hours}</dd>
                  </div>
                )}
                <div className="grid grid-cols-[88px_1fr] md:grid-cols-[140px_1fr] items-baseline gap-3 py-4">
                  <dt className="text-xs tracking-[0.12em] text-slate-400">料金</dt>
                  <dd className="text-sm md:text-base text-slate-50 w-full">{shop?.price_system ? (
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
            <div key={min} className="flex justify-between items-baseline border-b border-slate-800 pb-2 last:border-0 last:pb-0">
              <span className="text-slate-300">{min}分</span>
              <span className="font-numeral text-lg text-slate-50">¥{Number(price).toLocaleString()}</span>
            </div>
          ));
      }
      // 旧フォーマット "70分:12500\n90分:15000"
      const str = typeof ps === 'string' ? ps : JSON.stringify(ps);
      return str.split('\n').filter(Boolean).map((line, idx) => {
        const parts = line.split(':');
        return (
          <div key={idx} className="flex justify-between items-baseline border-b border-slate-800 pb-2 last:border-0 last:pb-0">
            <span className="text-slate-300">{parts[0]}</span>
            <span className="text-slate-50">{parts[1] || ''}</span>
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
    <div className="border border-slate-800 p-3">
      <p className="text-xs text-slate-400 mb-2">
        全国のメンズエステ料金相場（メンエスマップ調べ・{siteStats?.coverage?.priceSampleShops || 0}店の実測中央値）
      </p>
      <div className="flex gap-4">
        <div className="flex-1 flex justify-between items-baseline border-b border-slate-800 pb-1">
          <span className="text-slate-400 text-xs">60分</span>
          <span className="font-numeral text-lg text-slate-50">¥{(siteStats?.nationalPrice?.median60 || 0).toLocaleString()}</span>
        </div>
        <div className="flex-1 flex justify-between items-baseline border-b border-slate-800 pb-1">
          <span className="text-slate-400 text-xs">90分</span>
          <span className="font-numeral text-lg text-slate-50">¥{(siteStats?.nationalPrice?.median90 || 0).toLocaleString()}</span>
        </div>
      </div>
      <Link to="/stats" className="inline-block mt-2 text-xs font-bold text-pink-400 hover:text-pink-300">
        エリア別の相場を見る →
      </Link>
    </div>
    {(shop.website_url || shop.url || shop?.raw_data?.url) && (
      <p className="text-xs text-slate-400">最新の料金は公式サイトでご確認ください。</p>
    )}
  </div>
)}
                </dd>
                </div>
                {(shop.phone_number || shop.raw_data?.phone) && (
                  <div className="grid grid-cols-[88px_1fr] md:grid-cols-[140px_1fr] items-baseline gap-3 py-4">
                    <dt className="text-xs tracking-[0.12em] text-slate-400">電話</dt>
                    <dd className="font-numeral text-lg text-slate-50 tracking-wide">
                       <a href={`tel:${shop.phone_number || shop.raw_data?.phone}`} onClick={() => trackEvent('click_outbound', { link_type: 'phone', shop_id: shop.id, shop_name: shop.name })} className="hover:text-pink-400 transition">{shop.phone_number || shop.raw_data?.phone}</a>
                    </dd>
                  </div>
                )}
                {/* ⚠️ 住所が無い店舗が614店（56%）。無条件で出すと
                    「ACCESS」というラベルの右が空白のままになる（営業時間・TELと同じ扱いに揃える）。
                    住所が無くても都道府県・市区までは出せることが多いのでフォールバックする。 */}
                {joinFields(shop.address || joinFields(shop.prefecture, shop.city, shopAreaList(shop))) && (
                  <div className="grid grid-cols-[88px_1fr] md:grid-cols-[140px_1fr] items-baseline gap-3 py-4">
                    <dt className="text-xs tracking-[0.12em] text-slate-400">所在地</dt>
                    <dd className="text-sm md:text-base text-slate-200 leading-relaxed">
                      {shop.address || joinFields(shop.prefecture, shop.city, shopAreaList(shop))}
                    </dd>
                  </div>
                )}
              </dl>
              
              <div className="mt-6">
                 <a href={shop.url || shop.website_url || shop.raw_data?.url || shop.raw_data?.websiteUrl || '#'} target="_blank" rel="noreferrer" onClick={() => trackEvent('click_outbound', { link_type: 'official', shop_id: shop.id, shop_name: shop.name })} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm border border-slate-500 px-6 text-sm font-bold text-slate-50 transition hover:border-slate-300 sm:w-auto">
                   公式サイトで最新情報を見る <span aria-hidden="true">↗</span>
                 </a>
              </div>
            </div>

            {/* 口コミがあるセラピスト＝読ませる価値のある内部リンク（SSRで出力＝クローラーも辿れる） */}
            {ssrReviewedTherapists.length > 0 && (
              <div className="border-t border-slate-700 pt-6">
                <h2 className="font-mincho text-xl font-bold text-slate-50">この店で口コミがあるセラピスト</h2>
                <p className="mt-1 text-xs text-slate-400">実際に行った人の体験談が読めます</p>
                <ul className="mt-3 grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                  {ssrReviewedTherapists.map((t) => (
                    <li key={t.id} className="border-b border-slate-800">
                      <Link
                        to={`/shops/${shop.id}/threads/${t.id}`}
                        className="flex min-h-12 items-center justify-between gap-3 text-sm text-slate-100 transition hover:text-pink-300"
                      >
                        <span className="truncate font-mincho text-base font-bold">{t.name}</span>
                        {t.rating != null && <span className="shrink-0 font-numeral text-lg text-slate-50">{Number(t.rating).toFixed(1)}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 他の店舗＝比較したい人の回遊先＋クロール経路（孤立ページ化の解消）
                ⚠️ F06-C: 見出しは ssrNearbyScope が示す実際の集合（同エリア/同県）に合わせる。
                距離を測っていないので「近く」とは書かない。 */}
            {ssrNearbyShops.length > 0 && (
              <div className="border-t border-slate-700 pt-6">
                <h2 className="font-mincho text-xl font-bold text-slate-50">
                  {nearbyHeading}
                </h2>
                <p className="mt-1 text-xs text-slate-400">他の店舗も比較する</p>
                <ul className="mt-3 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                  {ssrNearbyShops.map((s) => (
                    <li key={s.id} className="border-b border-slate-800">
                      <Link
                        to={shopHref(s, roomCounts)}
                        className="flex min-h-12 items-center justify-between gap-3 text-sm text-slate-200 transition hover:text-pink-300"
                      >
                        <span className="truncate">{getDisplayName(s.name, s)}</span>
                        <span aria-hidden="true" className="text-slate-500">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
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
            {/* 🚩 タグの列は部品（TagFilterSidebar）に一本化した（2026-09-20）。
                   ブランドページと**同じものを描く**。片方だけ古くならないようにするため。 */}
            <TagFilterSidebar
              tagCounts={tagCounts}
              selectedTags={selectedTags}
              isOpen={isFilterOpen}
              onClose={closeFilter}
              panelRef={filterPanelRef}
              dialogId={filterDialogId}
              onToggle={(tag) => {
                setDisplayCount(INITIAL_DISPLAY_COUNT);
                setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
              }}
              onClear={() => { setSelectedTags([]); setDisplayCount(INITIAL_DISPLAY_COUNT); }}
            />

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 min-w-0">
             {/* ⚠️ スマホの絞り込みボタンも条件で出し分けない（PCの列と同じ扱い）。 */}
             <TagFilterButton selectedCount={selectedTags.length} onOpen={openFilter} openerRef={filterOpenerRef} isOpen={isFilterOpen} dialogId={filterDialogId} />
             <div className="mb-5 flex items-end justify-between gap-3 border-b border-slate-700 pb-3">
               <h2 className="font-mincho text-2xl font-bold text-slate-50">在籍セラピスト</h2>
               <span className="shrink-0 text-xs text-slate-400">
                 {castNameFilter ? <><span className="font-numeral text-xl text-slate-50">{sortedTherapists.length}</span> / </> : null}全<span className="font-numeral text-xl text-slate-50">{therapists.length}</span>人
               </span>
             </div>

             {/* 絞り込み＋並び替え（SearchPageと同じ操作感） */}
             {therapists.length > 6 && (
               <div className="flex flex-col sm:flex-row gap-2 mb-6">
                 <div className="relative flex-1">
                   <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="M16 16l4 4" /></svg>
                   <input
                     type="text"
                     value={castNameFilter}
                     onChange={(e) => { setCastNameFilter(e.target.value); setDisplayCount(INITIAL_DISPLAY_COUNT); }}
                     placeholder="セラピスト名で絞り込み"
                     aria-label="セラピスト名で絞り込み"
                     className="w-full min-h-11 bg-slate-900 border border-slate-700 rounded-sm pl-9 pr-9 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:border-pink-500/60"
                   />
                   {castNameFilter && (
                     <button onClick={() => setCastNameFilter('')} aria-label="名前の絞り込みを消す" className="absolute right-1 top-1/2 -translate-y-1/2 min-h-9 min-w-9 text-slate-400 hover:text-white text-sm">✕</button>
                   )}
                 </div>
                 <div role="group" aria-label="並び替え" className="flex shrink-0 divide-x divide-slate-700 border border-slate-700 rounded-sm">
                   {[
                     { key: 'default', label: '標準' },
                     { key: 'aiueo', label: '五十音' },
                     { key: 'reviews', label: '口コミ順' },
                   ].map((o) => (
                     <button
                       key={o.key}
                       onClick={() => { setCastSortOrder(o.key); setDisplayCount(INITIAL_DISPLAY_COUNT); }}
                       aria-pressed={castSortOrder === o.key}
                       className={`min-h-11 flex-1 px-4 text-xs transition whitespace-nowrap ${
                         castSortOrder === o.key ? 'bg-slate-800 font-bold text-slate-50' : 'text-slate-400 hover:text-white'
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
                 <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                   {visibleTherapists.map(t => {
                     const cnt = countsReady ? therapistReviewCounts[t.id] : undefined;
                     const fav = favTherapists.includes(`${shop.id}_${t.id}`);
                     const spec = [t.tall && `T${t.tall}`, t.cup && `${t.cup}カップ`].filter(Boolean).join(' / ');
                     return (
                       <Link key={t.id} to={`/shops/${shop.id}/threads/${t.id}`} className="group flex min-w-0 flex-col gap-2">
                         <div className="relative aspect-[3/4] overflow-hidden border border-slate-700 bg-slate-900">
                           <LazyImage src={t.image_url || t.image} alt={t.name} className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
                           {cnt > 0 && (
                             <span className="absolute left-2 top-2 border border-pink-500 bg-slate-950 px-2 py-0.5 text-[11px] text-pink-300">口コミ {cnt}</span>
                           )}
                           <button
                             onClick={(e) => {
                               e.preventDefault();
                               if (user) toggleFavTherapist(`${shop.id}_${t.id}`);
                               else navigate(`/login?redirect=${encodeURIComponent(`/shops/${shop.id}`)}`);
                             }}
                             aria-label={fav ? 'お気に入りから外す' : 'お気に入りに入れる'}
                             aria-pressed={fav}
                             className={`absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center bg-slate-950/60 transition hover:text-pink-300 ${fav ? 'text-pink-400' : 'text-slate-100'}`}
                           >
                             <HeartIcon filled={fav} />
                           </button>
                           {t.isNew && <span className="absolute bottom-2 left-2 bg-pink-500 px-1.5 py-0.5 text-[11px] font-bold text-slate-950">NEW</span>}
                         </div>
                         <div className="flex items-baseline justify-between gap-2">
                           {/* ⚠️ 店名は外して出す。この一覧はその店のページなので、
                               全カードに同じ店名が繰り返されるだけで人名が読みにくい
                               （「瑠香 -るか- Marvelous -マーベラス-」が180行あった）。 */}
                           <h3 className="truncate font-mincho text-base font-bold text-slate-50 group-hover:text-pink-300">{getTherapistDisplayName(t.name, shop?.name)}</h3>
                           {t.age && <span className="shrink-0 text-xs text-slate-400">{t.age}歳</span>}
                         </div>
                         {spec && <p className="-mt-1 text-xs text-slate-400">{spec}</p>}
                       </Link>
                     );
                   })}
                 </div>
                 {hasMore && (
                    <div className="mt-10 text-center">
                      <button
                        onClick={handleLoadMore}
                        className="inline-flex min-h-11 items-center rounded-sm border border-slate-600 px-8 text-sm font-bold text-slate-200 transition hover:border-slate-400 hover:text-white"
                      >
                        もっと見る（あと{sortedTherapists.length - displayCount}人）
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
            <div className="flex items-end justify-between gap-3 border-b border-slate-700 pb-3">
               <h2 className="font-mincho text-2xl font-bold text-slate-50">
                 口コミ
                 {reviewCount > 0 && <span className="ml-2 font-numeral text-xl font-medium text-slate-400">{reviewCount}</span>}
               </h2>
               <button
                  onClick={handlePostReview}
                  className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-pink-500 px-4 text-sm font-bold text-pink-200 transition hover:bg-pink-500/10 active:scale-95"
               >
                 <PenIcon /> 書く
               </button>
            </div>
            {/* D-003: 口コミを読む場所で「広告ではない」と分かるように（2026-09-23） */}
            <NeutralReviewNote className="mt-3 mb-2" />

            {reviews.length > 0 ? (
               <div className="relative">
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
                     className="w-full min-h-12 rounded-sm border border-slate-600 text-sm font-bold text-slate-200 transition hover:border-slate-400 disabled:opacity-50"
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
               <div className="mt-4 border border-slate-700 bg-slate-900 px-5 py-7">
                 <p className="font-mincho text-xl font-bold leading-[1.5] text-slate-50">まだ口コミがありません。<br />最初の体験を、<br className="sm:hidden" />次の人の判断材料に。</p>
                 <p className="mt-2 text-[13px] leading-relaxed text-slate-300"><span className="text-slate-50">200字で3日間・700字で7日間</span>、口コミが読み放題</p>
                 <button
                   onClick={handlePostReview}
                   className="mt-5 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-sm bg-pink-500 px-6 text-[15px] font-bold text-slate-950 transition hover:bg-pink-400 active:scale-[0.98] sm:w-auto"
                 >
                   <PenIcon /> 最初の口コミを書く
                 </button>
               </div>
            )}
          </div>
        </section>

        {/* 出勤 */}
        {cloudShop?.schedule_url && (
        <section id="sec-schedule" className="scroll-mt-32 order-4">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="border-b border-slate-700 pb-3">
              <h2 className="font-mincho text-2xl font-bold text-slate-50">出勤スケジュール</h2>
            </div>
            {/* ⚠️ 2026-09-08（FIXES.md F07）: ここは常時75vhの外部iframeだった。
                本番では灰色のエラー表示になっていた＝当サイトのCSPが `default-src 'self'` で
                frame-src を持たないため、外部の出勤表は構造的に読み込めない。
                公式の出勤URL自体はHEAD 200を返しており、壊れているのは埋め込みの方。
                🚫 CSPを緩めたり frame-src https: を足したりして通すことはしない。
                   外部埋め込みの再実装は別要件として扱う。
                ここでは公式サイトへ1操作で行けるコンパクトな案内カードにする。 */}
            <div className="mt-4 border border-slate-700 bg-slate-900 p-5 md:p-6">
              <p className="text-sm font-bold text-slate-50 mb-1">{getDisplayName(shop.name, shop)}の出勤</p>
              <p className="text-[13px] text-slate-400 mb-4">最新の出勤は公式サイトで確認できます。</p>
              <a
                href={cloudShop.schedule_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('click_outbound', { link_type: 'schedule', shop_id: shop.id, shop_name: shop.name })}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-12 px-6 rounded-sm border border-slate-500 text-slate-50 font-bold text-sm transition hover:border-slate-300"
              >
                公式サイトで出勤を確認
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <p className="text-[13px] text-slate-400 mt-3">外部サイト（店舗の公式ページ）が新しいタブで開きます。</p>
            </div>
          </div>
        </section>
        )}

      </div>
    </div>
  );
}
