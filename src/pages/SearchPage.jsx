import React, { useState, useMemo, useEffect, useRef, useTransition } from 'react';
import { TAG_CATEGORIES as TAG_SOURCE } from '../data/constants';
import { useSearchParams, Link } from '../compat/router';
import { useShopData } from '../contexts/DataContext.jsx';
import { supabase } from '../lib/supabase';
import { buildTherapistReviewIndex, reviewsForTherapist, summarizeReviews } from '../utils/reviewIdentity.js';
import LazyImage from '../components/LazyImage.jsx';
import { TherapistCardSkeleton } from '../components/ui/Skeleton.jsx';
import Header from '../components/Header.jsx';
import SeoHead from '../components/SeoHead.jsx';
import LocationLabel from '../components/LocationLabel.jsx';
import { normalizeForSearch, rankShops } from '../utils/searchMatch';
import { trackEvent } from '../utils/analytics';

// ─── ファジー店舗検索ユーティリティ ────────────────────────────
// ⚠️ ロジック本体は src/utils/searchMatch.js に切り出してある（CIでテストするため）。
//    ここに戻すとテストできなくなり、2026-08-22 の「セルで検索しても出てこない」
//    （語境界に〜が入っておらず477店が影響しうる）型の不具合を検出できなくなる。
// ─────────────────────────────────────────────────────────────

// 店舗情報カード（検索結果用）
function ShopCard({ shop, onSelect }) {
  const [open, setOpen] = React.useState(false);

  // price_system を整形
  const priceLines = React.useMemo(() => {
    if (!shop.price_system) return [];
    const ps = shop.price_system;
    if (typeof ps === 'string') return ps.split('\n').filter(l => l.trim()).slice(0, 5);
    if (Array.isArray(ps)) return ps.slice(0, 5);
    if (typeof ps === 'object') return Object.entries(ps).map(([k, v]) => `${k}: ${v}`).slice(0, 5);
    return [];
  }, [shop.price_system]);

  // 店舗名をクリックしたら、検索結果を中継せず正規店舗ページへ進む。
  // 店舗ページ自体にキャスト一覧があるため機能を失わず、内部リンク評価も本命URLへ集約できる。
  const shopDetailUrl = `/shops/${shop.id}`;

  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden transition-all">
      {/* 上段: 基本情報 */}
      <Link to={shopDetailUrl} onClick={() => onSelect && onSelect(shop)} className="flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors">
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 block">
          {shop.image_url
            ? <img src={shop.image_url} alt={shop.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-2xl">🏢</div>
          }
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-white font-bold text-sm block truncate">
            {shop.name}
          </span>
          <LocationLabel as="div" className="text-xs text-slate-500 mt-0.5" parts={[shop.prefecture, shop.city]} />
          {shop.business_hours && (
            <div className="text-xs text-slate-400 mt-0.5">🕐 {shop.business_hours}</div>
          )}
        </div>
        <span className="flex-shrink-0 text-slate-400 text-lg ml-1">›</span>
      </Link>
      {/* 詳細トグルボタン（別行） */}
      {(shop.price_system || shop.website_url || shop.schedule_url) && (
        <div className="px-4 pb-3 -mt-1">
          <button
            onClick={() => setOpen(v => !v)}
            className="text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition font-bold"
          >
            {open ? '閉じる ▴' : 'スケジュール・料金 ▾'}
          </button>
        </div>
      )}

      {/* 展開パネル */}
      {open && (
        <div className="border-t border-white/5 p-4 space-y-4 bg-slate-900">

          {/* ボタン群 */}
          <div className="flex flex-wrap gap-2">
            {shop.website_url && (
              <a href={shop.website_url} target="_blank" rel="noreferrer"
                onClick={() => trackEvent('click_outbound', { link_type: 'official', shop_id: shop.id, shop_name: shop.name })}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-full transition border border-white/10">
                🌐 公式サイト
              </a>
            )}
            {shop.schedule_url && (
              <a href={shop.schedule_url} target="_blank" rel="noreferrer"
                onClick={() => trackEvent('click_outbound', { link_type: 'schedule', shop_id: shop.id, shop_name: shop.name })}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-full transition border border-white/10">
                ↗ 別タブで開く
              </a>
            )}
            {shop.phone_number && (
              <a href={`tel:${shop.phone_number}`}
                onClick={() => trackEvent('click_outbound', { link_type: 'phone', shop_id: shop.id, shop_name: shop.name })}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-full transition border border-white/10">
                📞 {shop.phone_number}
              </a>
            )}
          </div>

          {/* 出勤スケジュール埋め込み */}
          {shop.schedule_url && (
            <div>
              <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                出勤スケジュール
              </div>
              <div className="rounded-xl overflow-hidden border border-white/5 bg-slate-800/30">
                <iframe
                  src={shop.schedule_url}
                  className="w-full h-[340px] md:h-[480px]"
                  style={{ border: 'none' }}
                  title={`${shop.name} 出勤スケジュール`}
                  loading="lazy"
                />
                <div className="p-2 text-center border-t border-white/5">
                  <a href={shop.schedule_url} target="_blank" rel="noreferrer"
                    className="text-xs text-slate-500 hover:text-pink-400 transition">
                    スケジュールページを別タブで開く ↗
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 料金システム */}
          {priceLines.length > 0 && (
            <div>
              <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                料金システム
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5 text-xs text-slate-300 space-y-1.5">
                {priceLines.map((line, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-pink-500 flex-shrink-0 mt-0.5">•</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ⚠️ タグ定義をここに書き戻さないこと（src/data/constants.js が唯一の定義元）。
//    以前はローカル定義で、投稿画面(constants.js)と食い違っていた（「新人」が検索側にだけ存在）。
const TAG_CATEGORIES = TAG_SOURCE.map(c => ({ id: c.id, title: c.titleEn, tags: c.tags }));

const ITEMS_PER_PAGE = 24;

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// 未検索時の「注目セラピスト」は、取得順のままだと同じ店舗・地域に偏る。
// 各店舗2名まで → 都道府県ごとのラウンドロビンにして、一覧として見る価値を持たせる。
function buildFeaturedTherapistPool(rows, shops, limit = 240) {
  const shopMap = new Map((shops || []).map(shop => [shop.id, shop]));
  const byShop = new Map();

  for (const therapist of rows || []) {
    if (!therapist?.id || !therapist?.name || !therapist?.shop_id || !shopMap.has(therapist.shop_id)) continue;
    const shopRows = byShop.get(therapist.shop_id) || [];
    if (shopRows.length >= 2) continue;
    shopRows.push(therapist);
    byShop.set(therapist.shop_id, shopRows);
  }

  const byPrefecture = new Map();
  for (const [shopId, therapists] of byShop) {
    const shop = shopMap.get(shopId);
    const prefecture = shop?.prefecture || shop?.city || 'その他';
    const prefectureRows = byPrefecture.get(prefecture) || [];
    prefectureRows.push(...therapists);
    byPrefecture.set(prefecture, prefectureRows);
  }

  const prefecturePools = [...byPrefecture.entries()]
    .sort(([left], [right]) => left.localeCompare(right, 'ja'))
    .map(([, therapists]) => therapists);
  const result = [];
  const seenNames = new Set();

  for (let round = 0; result.length < limit; round += 1) {
    let added = false;
    for (const pool of prefecturePools) {
      const therapist = pool[round];
      if (!therapist) continue;
      added = true;
      const normalizedName = therapist.name.replace(/[\s　]/g, '');
      if (!normalizedName || seenNames.has(normalizedName)) continue;
      seenNames.add(normalizedName);
      result.push(therapist);
      if (result.length >= limit) break;
    }
    if (!added) break;
  }

  return result;
}

// ⚠️ U05: 320〜639px=2列 / 640〜1023px=3列 / 1024〜1279px=4列 / 1280px〜=5列。
//    Tailwind の sm=640 / lg=1024 / xl=1280 がそのまま境界になる。
//    間隔はスマホ12px・PC20px。列数を画面ごとに別定義せず1か所に置く。
const GRID_CLASS = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-5';

export default function SearchPage({ renderSeo = true }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { shops, shopById } = useShopData();

  // --- URLパラメータから初期値を取得（旧 ?q= も shopQuery に統合）---
  const initShopId = searchParams.get('shopId') || '';
  const initShop = searchParams.get('shop') || searchParams.get('q') || '';
  const initCast = searchParams.get('cast') || '';
  const initTags = searchParams.get('tags') ? searchParams.get('tags').split(',') : [];

  const [shopInput, setShopInput] = useState(initShop);
  const [castInput, setCastInput] = useState(initCast);
  const [selectedTags, setSelectedTags] = useState(initTags);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mobileSearchMode, setMobileSearchMode] = useState(initCast && !initShop ? 'cast' : 'shop');
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [isPending, startTransition] = useTransition();

  // ⚠️ 2026-09-08（DESIGN.md U05）削除: 結果上部の3本目「キャスト名で絞り込み」。
  //    上部の「セラピスト名」入力と役割が重複し、両方に別々の語を入れると
  //    AND条件になって0件になる（利用者にはどちらが効いているか見えない）。
  //    人物名の入力は castInput に一本化した。
  const [castSortOrder, setCastSortOrder] = useState('default'); // 'default' | 'aiueo' | 'reviews' | 'rating'

  // ⚠️ U05: スマホのタグシートはモーダル。背景スクロール停止に加えて
  //    Escapeで閉じる／開いた瞬間に中へfocus／Tabがシートの外へ出ない／
  //    閉じたら開いたボタンへfocusを戻す、まで揃えないとキーボードで抜け出せなくなる。
  const filterSheetRef = useRef(null);
  const filterOpenerRef = useRef(null);
  useEffect(() => {
    if (!isFilterOpen || typeof document === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    // ⚠️ cleanup の時点で ref.current は別のノードを指しうるので、effect内で控える。
    const opener = filterOpenerRef.current || document.activeElement;
    document.body.style.overflow = 'hidden';

    const focusables = () => Array.from(
      filterSheetRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || []
    ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

    focusables()[0]?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); setIsFilterOpen(false); return; }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, [isFilterOpen]);

  const shopQuery = useDebounce(shopInput, 150);
  const castQuery = useDebounce(castInput, 150);

  // --- DBフェッチ ---
  const [serverTherapists, setServerTherapists] = useState([]);
  const [isFetchingDB, setIsFetchingDB] = useState(true);
  // ⚠️ 2026-09-08（FIXES.md F04）: キーを**正規化した名前**から **therapist_id** に変えた。
  //    名前キーは別店舗・同一店舗の同名を1人に潰し、件数・評価・タグが別人と混ざる。
  const [reviewCountMap, setReviewCountMap] = useState({}); // { therapistId: count }
  const [reviewTagMap, setReviewTagMap] = useState({}); // { therapistId: Set<tag> }
  const [ratingMap, setRatingMap] = useState({}); // { therapistId: avgRating|null }
  // ⚠️ FIXES.md F05: 「まだ取れていない」と「0件」を区別する。
  //    未取得を0件と表示すると、口コミがある人まで「0」に見える。
  const [countsReady, setCountsReady] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  // ⚠️ 2026-09-09: 「キャスト 1000件」と表示されていたが、これは取得上限そのものだった。
  //    ちょうど上限の数字を件数として出すと、実際の母数を偽ることになる
  //    （2026-08-05にサイトマップが1,000件で切れて98店欠落したのと同じ型）。
  //    上限に達したときは「○件以上」と書く。
  const [resultCapped, setResultCapped] = useState(false);

  // shopId指定時はDBから正式な店舗名を解決してshopInputに反映
  // （店名の表記揺れで空表示になる問題を回避＝リンクは shopId で飛ばすのが確実）
  useEffect(() => {
    if (initShopId && shopById && shopById[initShopId]?.name) {
      setShopInput(shopById[initShopId].name);
    }
  }, [initShopId, shopById]);

  // URLパラメータを同期
  useEffect(() => {
    startTransition(() => {
      const params = {};
      if (shopInput) {
        params.shop = shopInput;
      } else if (initShopId) {
        // ⚠️ shopId はまだ店名に解決できていない間は**URLに残す**。
        //    店舗データ(DataContext)の読み込みは非同期なので、初回レンダー時点では
        //    上の解決effectがまだ店名をセットできていない。ここで消すと
        //    読み込み完了時に shopId が失われ、**絞り込みが効かないまま全件表示**になる
        //    （2026-08-22、無限ループを直した直後にこの状態が露出した）。
        params.shopId = initShopId;
      }
      if (castInput) params.cast = castInput;
      if (selectedTags.length > 0) params.tags = selectedTags.join(',');
      setSearchParams(params, { replace: true });
    });
  }, [shopInput, castInput, selectedTags, setSearchParams, initShopId]);

  // displayCount をリセット
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [shopQuery, castQuery, selectedTags, castSortOrder]);

  // DB フェッチ本体
  useEffect(() => {
    if (shops.length === 0) return undefined;

    // ⚠️ 古いリクエストの結果で新しい結果を上書きしないためのフラグ。
    //    これが無いと、検索条件が変わったときに**遅いほうの応答が後から勝つ**。
    //    実例(2026-08-22): /search?shopId=... を開くと
    //      ① shopInput が空の初回 → 注目セラピスト800件を取得（重い）
    //      ② 店名が解決されて → シルクのキャストを取得（軽い・先に返る）
    //    ①が後から返って②を上書きし、「この店舗のキャスト一覧 54件」と出ているのに
    //    中身は那覇・熊本・金沢のセラピスト、という状態になっていた。
    let cancelled = false;

    const fetch = async () => {
      setIsFetchingDB(true);
      setFetchError(false);
      let cappedAt = 0; // この検索で使った取得上限（達したかどうかの判定に使う）
      try {
        const sq = shopQuery.trim().toLowerCase();
        const cq = castQuery.trim();

        // スペース・カナ正規化ユーティリティ（カタカナ→ひらがな変換含む）
        const normName = (s) => normalizeForSearch((s || '').replace(/[\s　]/g, ''));
        const normCq = normName(cq);
        // スペースで分割したパーツ（「西園寺 未来」→ ['西園寺','未来']）
        const cqParts = cq.trim().split(/[\s　]+/).filter(Boolean);

        // DB クエリにキャスト名フィルターを付与するヘルパー
        // スペースありの場合: 各パーツを AND ilike（DB側で「西園寺」AND「未来」→ 「西園寺未来」にヒット）
        // スペースなしの場合: 前半文字をprefixに使い広めに取得 → クライアントで normName 照合
        const applyNameFilter = (q) => {
          if (cqParts.length > 1) {
            let r = q;
            for (const part of cqParts) r = r.ilike('name', `%${part}%`);
            return r;
          } else {
            // 前半2文字以上でprefix検索（スペースなし検索で「西園寺 未来」を拾うため）
            const prefix = normCq.slice(0, Math.max(2, Math.ceil(normCq.length / 2)));
            return prefix.length >= 2
              ? q.ilike('name', `%${prefix}%`)
              : q.ilike('name', `%${normCq}%`);
          }
        };

        // 店舗クエリがある場合、マッチする shop_id リストを作成（関連度順）
        // ⚠️ 上位100件しかDBに問い合わせないので、**関連度順**であることが重要。
        //    以前は素の filter（DB順）だったため、関連の薄い店で枠が埋まる恐れがあった。
        const matchedShopIds = sq
          ? rankShops(shops, shopQuery).map(s => s.id)
          : null; // null = 絞り込みなし

        let data = [];

        if (!sq && !cq) {
          // 両方空 → ホームの「注目セラピスト > もっと見る」の遷移先として一覧を表示。
          // 最近登録された写真あり在籍者を広めに取得し、店舗・地域分散はクライアントで行う。
          const { data: d, error } = await supabase
            .from('therapists')
            .select('id, shop_id, name, image_url, is_active, created_at')
            .not('image_url', 'is', null)
            .neq('image_url', '')
            .or('is_active.is.null,is_active.eq.true')
            .order('created_at', { ascending: false })
            .order('id', { ascending: true })
            .limit(800);
          if (error) throw error;
          cappedAt = (d || []).length >= 800 ? 800 : 0;
          data = buildFeaturedTherapistPool(d || [], shops);

        } else if (sq && !cq) {
          // 店舗のみ → マッチ店舗のキャスト全員
          if (matchedShopIds.length === 0) {
            data = [];
          } else {
            // ⚠️ F05: Supabase の error を無視して `d || []` にすると、
            //    通信失敗が「この条件では見つかりませんでした」になる。必ず投げる。
            const { data: d, error } = await supabase
              .from('therapists')
              .select('id, shop_id, name, image_url, raw_data, is_active')
              .in('shop_id', matchedShopIds.slice(0, 100))
              .not('image_url', 'is', null)
              .neq('image_url', '')
              .or('is_active.is.null,is_active.eq.true')
              .limit(1000);
            if (error) throw error;
            cappedAt = (d || []).length >= 1000 ? 1000 : 0;
            data = d || [];
          }

        } else if (!sq && cq) {
          // キャストのみ → 名前正規化検索
          let q = supabase
            .from('therapists')
            .select('id, shop_id, name, image_url, raw_data, is_active')
            .not('image_url', 'is', null)
            .neq('image_url', '')
            .or('is_active.is.null,is_active.eq.true');
          q = applyNameFilter(q);
          const { data: d, error } = await q.limit(500);
          if (error) throw error;
          cappedAt = (d || []).length >= 500 ? 500 : 0;
          // クライアント側でスペース除去して完全照合
          data = (d || []).filter(t => normName(t.name).includes(normCq));

        } else {
          // 両方あり → 店舗キャスト全員取得 → クライアントで名前照合
          if (matchedShopIds.length === 0) {
            data = [];
          } else {
            const { data: d, error } = await supabase
              .from('therapists')
              .select('id, shop_id, name, image_url, raw_data, is_active')
              .in('shop_id', matchedShopIds.slice(0, 100))
              .not('image_url', 'is', null)
              .neq('image_url', '')
              .or('is_active.is.null,is_active.eq.true')
              .limit(1000);
            if (error) throw error;
            cappedAt = (d || []).length >= 1000 ? 1000 : 0;
            data = (d || []).filter(t => normName(t.name).includes(normCq));
          }
        }

        if (cancelled) return; // 条件が変わっている＝この結果はもう古い
        const formatted = (data || []).map(d => ({
          ...d.raw_data,
          id: d.id,
          shop_id: d.shop_id,
          name: d.name || d.raw_data?.name,
          image_url: d.image_url || d.raw_data?.image_url,
        }));
        setServerTherapists(formatted);
        setResultCapped(cappedAt > 0);
      } catch (e) {
        // ⚠️ F05: 失敗を空配列に丸めない。既存の結果を残し、再読み込みを出す。
        if (!cancelled) { console.error('検索エラー:', e); setFetchError(true); }
      } finally {
        if (!cancelled) setIsFetchingDB(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [shopQuery, castQuery, shops, retryToken]);

  // セラピスト別口コミ件数・タグ・評価取得（serverTherapistsが更新されたら実行）
  // ⚠️ 2026-09-08（FIXES.md F04）: 集計キーを therapist_id にした。
  //    以前は `therapist_name` を空白除去しただけの文字列をキーにしており、
  //    別店舗の同名・同一店舗の同名が同じバケツに入っていた。
  //    割り当ての契約は src/utils/reviewIdentity.js に一本化している。
  useEffect(() => {
    if (!serverTherapists.length) {
      setReviewCountMap({}); setReviewTagMap({}); setRatingMap({}); setCountsReady(false);
      return undefined;
    }
    const shopIds = [...new Set(serverTherapists.map(t => t.shop_id).filter(Boolean))];
    if (!shopIds.length) return undefined;
    // ⚠️ ここも上のフェッチと同じ理由でキャンセルが要る（古い店舗の口コミ集計が
    //    新しい検索結果に被さると、件数バッジやタグ件数が別店舗のものになる）
    let cancelled = false;
    setCountsReady(false);
    supabase
      .from('reviews')
      .select('therapist_id, shop_id, therapist_name, tags, rating')
      .in('shop_id', shopIds.slice(0, 50))
      .then(({ data, error }) => {
        if (cancelled) return;
        // ⚠️ F05: 失敗したら countsReady を立てない（未取得を0件と表示しない）。
        if (error) { console.error('口コミ件数取得エラー:', error); return; }
        if (!data) return;
        const index = buildTherapistReviewIndex(data, serverTherapists);
        const counts = {};
        const tagMap = {};
        const ratings = {};
        for (const t of serverTherapists) {
          const summary = summarizeReviews(reviewsForTherapist(index, t.id));
          counts[t.id] = summary.count;
          tagMap[t.id] = summary.tags;
          ratings[t.id] = summary.rating; // 評価0件は null（0.0と表示しない）
        }
        setReviewCountMap(counts);
        setReviewTagMap(tagMap);
        setRatingMap(ratings);
        setCountsReady(true);
      });
    return () => { cancelled = true; };
  }, [serverTherapists]);

  // 店舗セクション（関連度順：語一致 > 語頭一致 > タイポ許容）
  // ⚠️ 必ず rankShops を使うこと。素の filter だとDB登録順のまま並び、
  //    「メンズエステセル」で目的の店が20件中の下のほうに埋もれる
  //    （実際にオーナーから「一番上にそれが出てこない」と指摘された）。
  const matchingShops = useMemo(() => {
    if (!shopQuery.trim()) return [];
    return rankShops(shops, shopQuery).slice(0, 20);
  }, [shopQuery, shops]);

  // キャスト絞り込み（タグ）
  const filteredTherapists = useMemo(() => {
    if (!serverTherapists.length) return [];
    let results = serverTherapists;

    // タグ絞り込み（口コミのtagsを参照）。キーは therapist_id（F04）。
    if (selectedTags.length > 0) {
      results = results.filter(t => {
        const reviewTags = reviewTagMap[t.id] || new Set();
        return selectedTags.every(sel => reviewTags.has(sel));
      });
    }

    return results;
  }, [serverTherapists, selectedTags, reviewTagMap]);

  // ソート（件数・評価は F04 の集計と同じ therapist_id キーを使う）
  const sortedFilteredTherapists = useMemo(() => {
    let results = filteredTherapists;
    if (castSortOrder === 'aiueo') {
      results = [...results].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
    } else if (castSortOrder === 'reviews') {
      results = [...results].sort((a, b) => (reviewCountMap[b.id] || 0) - (reviewCountMap[a.id] || 0));
    } else if (castSortOrder === 'rating') {
      results = [...results].sort((a, b) => (ratingMap[b.id] || 0) - (ratingMap[a.id] || 0));
    }
    return results;
  }, [filteredTherapists, castSortOrder, reviewCountMap, ratingMap]);

  // ⚠️ 2026-09-08（FIXES.md F04）: 「同名を1枚にまとめる」をやめ、**同一IDだけ**まとめる。
  //    同名の別人（別店舗・同一店舗いずれも）が1枚のカードに統合され、
  //    写真・件数・評価が混ざっていた。異なる人物IDは別カードとして残し、
  //    店舗名・地域で区別できるようにする。
  const deduplicatedTherapists = useMemo(() => {
    const seen = new Map(); // therapistId -> index in result
    const result = [];
    for (const t of sortedFilteredTherapists) {
      const key = String(t.id ?? '');
      if (seen.has(key)) {
        const idx = seen.get(key);
        result[idx]._extraShopIds.push(t.shop_id);
        // 写真がなければ写真ありのレコードに差し替え
        if (!result[idx].image_url && t.image_url) {
          result[idx] = { ...t, _extraShopIds: result[idx]._extraShopIds };
        }
      } else {
        seen.set(key, result.length);
        result.push({ ...t, _extraShopIds: [] });
      }
    }
    return result;
  }, [sortedFilteredTherapists]);

  const visibleTherapists = useMemo(() =>
    deduplicatedTherapists.slice(0, displayCount),
    [deduplicatedTherapists, displayCount]
  );

  const tagCounts = useMemo(() => {
    const counts = {};
    TAG_CATEGORIES.forEach(cat => cat.tags.forEach(t => { counts[t] = 0; }));
    for (const t of serverTherapists) {
      const reviewTags = reviewTagMap[t.id] || new Set();
      for (const tag of reviewTags) {
        if (counts[tag] !== undefined) counts[tag]++;
      }
    }
    return counts;
  }, [serverTherapists, reviewTagMap]);

  const hasAvailableTags = useMemo(
    () => selectedTags.length > 0 || Object.values(tagCounts).some(count => count > 0),
    [selectedTags, tagCounts]
  );

  const isLoading = isPending || isFetchingDB;
  const isFeaturedBrowse = !shopQuery.trim() && !castQuery.trim();

  const clearAll = () => {
    setShopInput('');
    setCastInput('');
    setSelectedTags([]);
    setIsFilterOpen(false);
  };

  // 状態サマリー用テキスト
  const statusText = useMemo(() => {
    const parts = [];
    if (shopQuery) parts.push(`店舗「${shopQuery}」`);
    if (castQuery) parts.push(`キャスト「${castQuery}」`);
    if (selectedTags.length) parts.push(`タグ: ${selectedTags.join('・')}`);
    return parts.length ? parts.join(' × ') : 'キャスト検索';
  }, [shopQuery, castQuery, selectedTags]);

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-28 md:pb-16 text-slate-200 font-sans">
      {renderSeo && (
        <SeoHead
          title="キャスト検索"
          description="セラピスト名・店舗名でメンズエステを検索。出勤スケジュール・体験口コミ・料金を一括確認できます。全国580店舗以上対応。"
          path="/search"
        />
      )}
      <Header />
      {/* ⚠️ U05: 見えないH1をやめ、画面上部に可視のH1を置く。
             利用者にとっての「このページは何か」と、機械が読む見出しを一致させる。 */}
      <h1 className="max-w-7xl mx-auto px-4 pt-5 font-black text-white tracking-tight" style={{ fontSize: '28px', lineHeight: 1.3 }}>
        セラピストを探す
      </h1>

      {/* ===== 検索エリア ===== */}
      <div className="bg-slate-950 border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 space-y-3">

          {/* デスクトップ: 店舗とキャストを同時に見せる */}
          <div className="hidden sm:flex gap-3">

            {/* 🏢 店舗・エリア検索 */}
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none">🏢</span>
              <input
                type="text"
                value={shopInput}
                onChange={e => setShopInput(e.target.value)}
                placeholder="店舗名・エリアで検索..."
                className="w-full bg-slate-900/60 border border-white/10 rounded-full pl-10 pr-10 py-2.5 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
              />
              {shopInput && (
                <button
                  onClick={() => setShopInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >✕</button>
              )}
            </div>

            {/* 中央の「×」区切り */}
            <div className="hidden sm:flex items-center text-slate-600 font-bold text-sm flex-shrink-0">×</div>

            {/* 💃 キャスト名検索 */}
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none">💃</span>
              <input
                type="text"
                value={castInput}
                onChange={e => setCastInput(e.target.value)}
                placeholder="キャスト名で検索..."
                className="w-full bg-slate-900/60 border border-white/10 rounded-full pl-10 pr-10 py-2.5 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
              {castInput && (
                <button
                  onClick={() => setCastInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >✕</button>
              )}
            </div>

          </div>

          {/* モバイル: 検索対象を切り替え、入力欄を1本に集約 */}
          <div className="sm:hidden space-y-2.5">
            <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-slate-900/70 p-1" role="group" aria-label="検索対象">
              {[
                { key: 'shop', label: '🏢 店舗・エリア' },
                { key: 'cast', label: '💃 セラピスト' },
              ].map(option => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setMobileSearchMode(option.key)}
                  aria-pressed={mobileSearchMode === option.key}
                  className={`min-h-9 rounded-xl px-3 text-xs font-black transition ${
                    mobileSearchMode === option.key
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none">
                {mobileSearchMode === 'shop' ? '🏢' : '💃'}
              </span>
              <input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                value={mobileSearchMode === 'shop' ? shopInput : castInput}
                onChange={e => mobileSearchMode === 'shop' ? setShopInput(e.target.value) : setCastInput(e.target.value)}
                placeholder={mobileSearchMode === 'shop' ? '店舗名・エリアで検索' : 'セラピスト名で検索'}
                aria-label={mobileSearchMode === 'shop' ? '店舗名・エリアで検索' : 'セラピスト名で検索'}
                className="w-full min-h-11 rounded-2xl border border-white/10 bg-slate-900/80 py-2.5 pl-10 pr-11 text-sm font-bold text-white placeholder-slate-500 transition focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
              {(mobileSearchMode === 'shop' ? shopInput : castInput) && (
                <button
                  type="button"
                  onClick={() => mobileSearchMode === 'shop' ? setShopInput('') : setCastInput('')}
                  aria-label="入力を消す"
                  className="absolute right-3 top-1/2 flex min-h-8 min-w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-400"
                >
                  ✕
                </button>
              )}
            </div>

            {!isFeaturedBrowse && hasAvailableTags && (
              <button
                type="button"
                ref={filterOpenerRef}
                onClick={() => setIsFilterOpen(true)}
                className="min-h-10 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-bold text-white"
              >
                ⚙ 条件で絞り込む {selectedTags.length > 0 && `(${selectedTags.length})`}
              </button>
            )}
          </div>

          {/* ステータスライン */}
          {!isFeaturedBrowse && <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-xs font-bold text-slate-400 truncate">{statusText}</p>
              <p className="text-xs text-pink-400 font-bold">
                {isLoading
                  ? '検索中...'
                  : `店舗 ${matchingShops.length}件・キャスト ${deduplicatedTherapists.length.toLocaleString()}件${resultCapped ? '以上' : ''}`}
              </p>
            </div>
            {(shopInput || castInput || selectedTags.length > 0) && (
              <button
                onClick={clearAll}
                className="min-h-8 text-xs sm:text-xs text-slate-500 hover:text-white underline underline-offset-4 font-bold ml-4 flex-shrink-0"
              >
                すべてクリア
              </button>
            )}
          </div>}

          {/* アクティブタグ */}
          {selectedTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {selectedTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                  className="flex-shrink-0 bg-pink-600 text-white pl-3 pr-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-pink-500 transition"
                >
                  {tag}
                  <span className="bg-black/20 rounded-full w-4 h-4 flex items-center justify-center">✕</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== メインコンテンツ ===== */}
      <div className={`max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8 gap-8 items-start ${isFeaturedBrowse ? 'block' : 'grid lg:grid-cols-[260px_1fr]'}`}>

        {/* 左: タグフィルター */}
        {!isFeaturedBrowse && isFilterOpen && (
          <button
            type="button"
            aria-label="絞り込みを閉じる"
            onClick={() => setIsFilterOpen(false)}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm lg:hidden"
          />
        )}
        {!isFeaturedBrowse && <aside
          ref={filterSheetRef}
          role={isFilterOpen ? 'dialog' : undefined}
          aria-modal={isFilterOpen ? 'true' : undefined}
          aria-labelledby={isFilterOpen ? 'mobile-filter-title' : undefined}
          className={`${isFilterOpen ? 'block' : 'hidden'} fixed inset-x-0 bottom-0 z-[80] max-h-[82vh] space-y-4 overflow-y-auto rounded-t-3xl border-t border-white/10 bg-slate-950 p-4 shadow-2xl lg:sticky lg:inset-auto lg:top-36 lg:z-auto lg:block lg:max-h-none lg:space-y-6 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
        >
          <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-2 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur lg:hidden">
            <div>
              <p id="mobile-filter-title" className="text-sm font-black text-white">条件で絞り込む</p>
              <p className="mt-0.5 text-xs text-slate-500">口コミに付いた特徴タグから選択</p>
            </div>
            <button
              type="button"
              onClick={() => setIsFilterOpen(false)}
              className="min-h-10 rounded-xl bg-white px-4 text-xs font-black text-slate-950"
            >
              完了
            </button>
          </div>
          {TAG_CATEGORIES.map(category => (
            <div key={category.id} className="bg-slate-900/40 backdrop-blur rounded-2xl lg:rounded-3xl p-4 lg:p-5 border border-white/5 shadow-xl">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                {category.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                {category.tags.map(tag => {
                  const count = tagCounts[tag] || 0;
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        if (isSelected) setSelectedTags(prev => prev.filter(t => t !== tag));
                        else if (count > 0) setSelectedTags(prev => [...prev, tag]);
                      }}
                      disabled={count === 0 && !isSelected}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
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
        </aside>}

        {/* 右: 検索結果 */}
        <main className="min-h-[50vh] space-y-10">

          {/* 🏢 マッチした店舗 */}
          {matchingShops.length > 0 && (
            <section>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                マッチした店舗
                <span className="text-pink-400 font-bold normal-case">{matchingShops.length}件</span>
              </h2>
              <div className="space-y-3">
                {matchingShops.map(shop => (
                  <ShopCard key={shop.id} shop={shop} onSelect={(s) => {
                    setShopInput(s.name);
                    setCastInput('');
                    setServerTherapists([]);   // 古い結果を即クリア
                    setIsFetchingDB(true);     // 押した瞬間にスケルトン表示（debounce待ちの空白をなくす）
                    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} />
                ))}
              </div>
            </section>
          )}

          {/* 💃 マッチしたキャスト */}
          <section>
            {/* ⚠️ U05: 効いている条件を結果の上に**解除できるチップ**で出す。
                タグを選んだまま人物名を変えると、条件が隠れたまま残って0件の理由が分からなくなる。 */}
            {(shopInput || castInput || selectedTags.length > 0) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="ui-help">条件</span>
                {shopInput && (
                  <button type="button" onClick={() => setShopInput('')} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-white/15 bg-slate-900 px-3 font-bold text-white" style={{ fontSize: '13px' }}>
                    店舗・エリア「{shopInput}」<span aria-hidden="true">×</span><span className="sr-only">を解除</span>
                  </button>
                )}
                {castInput && (
                  <button type="button" onClick={() => setCastInput('')} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-white/15 bg-slate-900 px-3 font-bold text-white" style={{ fontSize: '13px' }}>
                    セラピスト名「{castInput}」<span aria-hidden="true">×</span><span className="sr-only">を解除</span>
                  </button>
                )}
                {selectedTags.map((tag) => (
                  <button key={tag} type="button" onClick={() => setSelectedTags((prev) => prev.filter((x) => x !== tag))} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-pink-500/30 bg-pink-500/10 px-3 font-bold text-pink-100" style={{ fontSize: '13px' }}>
                    {tag}<span aria-hidden="true">×</span><span className="sr-only">を解除</span>
                  </button>
                ))}
                <button type="button" onClick={clearAll} className="ui-link inline-flex min-h-11 items-center px-2" style={{ fontSize: '13px' }}>すべて解除</button>
              </div>
            )}

            {/* ⚠️ FIXES.md F05: 通信失敗を「見つかりませんでした」と混同しない。
                既存の結果は消さず、再読み込みだけを出す。 */}
            {fetchError && (
              <div role="alert" className="mb-4 rounded-xl border border-rose-500/50 bg-rose-500/10 p-3">
                <p className="ui-error">読み込めませんでした</p>
                <button
                  type="button"
                  onClick={() => setRetryToken((n) => n + 1)}
                  className="ui-link mt-1.5 inline-flex min-h-11 items-center font-bold"
                  style={{ fontSize: '13px' }}
                >
                  再読み込み
                </button>
              </div>
            )}

            {(isFeaturedBrowse || matchingShops.length > 0 || castQuery) && (
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                {isFeaturedBrowse ? '注目セラピスト' : shopQuery && castQuery ? 'この店舗のキャスト絞り込み結果' : shopQuery ? 'この店舗のキャスト一覧' : 'キャスト検索結果'}
                {!isLoading && <span className="text-purple-400 font-bold normal-case">{deduplicatedTherapists.length}件</span>}
              </h2>
            )}

            {isFeaturedBrowse && !isLoading && visibleTherapists.length > 0 && (
              <div className="mb-4 sm:mb-6 flex items-center gap-2.5 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/50 to-slate-900/70 px-3 py-2.5 sm:items-start sm:gap-3 sm:px-4 sm:py-3">
                <span className="text-base sm:text-xl leading-none">✨</span>
                <div>
                  {/* ⚠️ U05: 「店舗・地域が偏らないように表示しています」は実装の説明で、
                      利用者が次にする操作の助けにならないので削除した。 */}
                  <p className="text-xs sm:text-sm font-black text-white">気になるセラピストから探せます</p>
                </div>
              </div>
            )}

            {/* キャスト内絞り込み・ソートバー */}
            {filteredTherapists.length > 0 && (
              <div className="mb-6">
                {/* ⚠️ 2026-09-08（U05）削除: 3本目の「キャスト名で絞り込み」入力。
                    上部の「セラピスト名」と重複し、両方に別の語を入れるとAND条件で必ず0件になる。
                    人物名の入力は castInput（上部）に一本化した。 */}
                {/* ソートボタン */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  <span className="text-xs text-slate-500 font-black shrink-0">並び替え</span>
                  {[
                    { key: 'default', label: 'デフォルト', mobileLabel: '標準' },
                    { key: 'aiueo',   label: 'あ 五十音', mobileLabel: '五十音' },
                    { key: 'reviews', label: '💬 口コミ多い', mobileLabel: '💬 口コミ' },
                    { key: 'rating',  label: '⭐ 評価高い', mobileLabel: '⭐ 評価' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setCastSortOrder(opt.key)}
                      className={`shrink-0 min-h-9 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                        castSortOrder === opt.key
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-500/30'
                          : 'bg-slate-800/80 text-slate-500 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <span className="sm:hidden">{opt.mobileLabel}</span>
                      <span className="hidden sm:inline">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              {isLoading ? (
                <div className={GRID_CLASS}>
                  {Array.from({ length: 8 }).map((_, i) => <TherapistCardSkeleton key={i} />)}
                </div>
              ) : visibleTherapists.length > 0 ? (
                <>
                  <div className={GRID_CLASS}>
                    {/* リストにいないセラピストの口コミカード（店舗指定時のみ） */}
                    {/* ⚠️ 2026-09-08（FIXES.md F05）: `matchingShops[0]` を無条件に指定していた。
                        「新宿」のような地域検索では複数店舗に一致するので、
                        投稿画面が**関係のない先頭店舗に固定**される。
                        明示された店舗が1つに定まるときだけ指定し、それ以外は店舗選択へ送る。 */}
                    {shopQuery && matchingShops.length >= 1 && (
                      <Link
                        to={matchingShops.length === 1 || initShopId
                          ? `/post-review?shopId=${initShopId || matchingShops[0].id}&customMode=true`
                          : '/post-review?customMode=true'}
                        className="group relative block bg-slate-900/60 rounded-[1.5rem] overflow-hidden border border-dashed border-purple-500/30 hover:border-purple-500/70 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/20 hover:-translate-y-1"
                      >
                        <div className="aspect-[3/4] flex flex-col items-center justify-center gap-3 p-4">
                          <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                            ✏️
                          </div>
                          <div className="text-center">
                            <p className="text-white font-black text-sm leading-tight">リストに<br />いない</p>
                            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">新人・未登録の<br />セラピストの口コミ</p>
                          </div>
                        </div>
                      </Link>
                    )}
                    {visibleTherapists.map((t, idx) => {
                      const shop = shopById[t.shop_id];
                      const showWriteToRead = idx === 12 || (isFeaturedBrowse && idx === 10);
                      const writeToReadVisibility = !isFeaturedBrowse
                        ? 'flex'
                        : idx === 10
                          ? 'flex md:hidden xl:flex'
                          : 'hidden md:flex xl:hidden';
                      return (
                        <React.Fragment key={t.id}>
                        {/* 2/3/4/5列それぞれで行を崩さない枚数の後にW2R帯を挿入 */}
                        {showWriteToRead && (
                          <Link
                            to="/post-review"
                            className={`col-span-2 md:col-span-3 ${isFeaturedBrowse ? 'xl:col-span-5' : 'xl:col-span-4'} ${writeToReadVisibility} flex-col items-start justify-between gap-3 bg-gradient-to-r from-purple-900/70 to-pink-900/50 border border-purple-500/30 rounded-2xl px-4 sm:px-5 py-4 hover:border-purple-400/50 transition-all group sm:flex-row sm:items-center`}
                          >
                            <div>
                              <p className="text-white font-black text-sm">口コミを書くと、みんなの口コミが読み放題になります</p>
                              <p className="text-purple-300 text-xs mt-0.5">200字で3日・700字で7日の閲覧権を即時付与</p>
                            </div>
                            <span className="w-full shrink-0 rounded-xl bg-pink-600 px-4 py-2 text-center text-xs font-black text-white transition group-hover:bg-pink-500 sm:w-auto whitespace-nowrap">口コミを書く →</span>
                          </Link>
                        )}
                        <Link
                          to={`/shops/${t.shop_id}/threads/${t.id}`}
                          className="group relative block bg-slate-900 rounded-2xl sm:rounded-[1.5rem] overflow-hidden border border-white/5 hover:border-pink-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-900/20 hover:-translate-y-1"
                        >
                          {/* ⚠️ U05: 名前・店舗・地域は**写真の下の単色面**へ置く。
                              写真の上に重ねると、明るい画像や顔の位置次第で読めなくなる
                              （読める文字を写真の明暗に依存させない）。
                              写真の上に置くのは操作だけ。件数・評価も下の面へ移した。 */}
                          <div className="aspect-[3/4] overflow-hidden relative bg-slate-800">
                            <LazyImage src={t.image_url || t.image} alt={t.name} width={400} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                          </div>
                          <div className="bg-slate-900 border-t border-white/5 p-2.5 sm:p-3">
                            <h3 className="font-black text-white line-clamp-2" style={{ fontSize: '16px', lineHeight: 1.4 }}>{t.name}</h3>
                            <p className="mt-1 text-slate-300 line-clamp-2" style={{ fontSize: '13px', lineHeight: 1.5 }}>
                              {t._extraShopIds?.length > 0
                                ? `${shop?.name || ''} 他${t._extraShopIds.length}店舗`
                                : shop ? [shop.area || shop.city, shop.name].filter(Boolean).join(' | ') : ''}
                            </p>
                            {/* ⚠️ F04/F05: 件数はこの人物IDで実際に数えた公開データだけ。
                                取得できていない間は**何も出さない**（0件と表示しない）。 */}
                            {countsReady && reviewCountMap[t.id] > 0 && (
                              <p className="mt-1.5 flex items-center gap-2 text-slate-300" style={{ fontSize: '13px' }}>
                                <span className="font-bold text-pink-300">口コミ{reviewCountMap[t.id]}件</span>
                                {ratingMap[t.id] != null && (
                                  <span className="font-bold text-amber-300">★ {ratingMap[t.id].toFixed(1)}</span>
                                )}
                              </p>
                            )}
                            {t.age ? <p className="mt-1 text-slate-400" style={{ fontSize: '13px' }}>{t.age}歳</p> : null}
                          </div>
                        </Link>
                        </React.Fragment>
                      );
                    })}
                  </div>
                  {visibleTherapists.length < deduplicatedTherapists.length && (
                    <div className="mt-8 sm:mt-10 text-center">
                      <button
                        onClick={() => setDisplayCount(n => n + ITEMS_PER_PAGE)}
                        className="w-full sm:w-auto bg-slate-800 text-white px-8 py-3.5 sm:py-3 rounded-2xl sm:rounded-full font-bold hover:bg-slate-700 transition border border-white/10"
                      >
                        もっと見る（残り{deduplicatedTherapists.length - visibleTherapists.length}件）
                      </button>
                    </div>
                  )}
                </>
              ) : (
                !isLoading && matchingShops.length === 0 && (shopQuery || castQuery || selectedTags.length > 0) && (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-5 border border-white/5">
                      <span className="text-3xl opacity-50">🕵️</span>
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">見つかりませんでした</h3>
                    <p className="text-slate-400 text-sm mb-6">条件を変えて検索してみてください。</p>
                    <button onClick={clearAll} className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold text-sm hover:bg-slate-200 transition">
                      条件をクリア
                    </button>
                  </div>
                )
              )}
            </div>
          </section>
        </main>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
