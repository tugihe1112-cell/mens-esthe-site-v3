import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { useSearchParams, Link } from '../compat/router';
import { useShopData } from '../contexts/DataContext.jsx';
import { supabase } from '../lib/supabase';
import LazyImage from '../components/LazyImage.jsx';
import { TherapistCardSkeleton } from '../components/ui/Skeleton.jsx';
import Header from '../components/Header.jsx';
import SeoHead from '../components/SeoHead.jsx';
import { trackEvent } from '../utils/analytics';

// ─── ファジー店舗検索ユーティリティ ────────────────────────────
// 1. 小文字カタカナ → 大文字カタカナ正規化
// 2. カタカナ → ひらがな変換（「ウィニングヘブン」→「ういにんぐへぶん」）
// 3. バイグラム類似度でタイポ許容（wining → winning）
const SMALL_KATA = { 'ァ':'ア','ィ':'イ','ゥ':'ウ','ェ':'エ','ォ':'オ','ッ':'ツ','ャ':'ヤ','ュ':'ユ','ョ':'ヨ','ヮ':'ワ','ヵ':'カ','ヶ':'ケ' };
const SMALL_HIRA = { 'ぁ':'あ','ぃ':'い','ぅ':'う','ぇ':'え','ぉ':'お','っ':'つ','ゃ':'や','ゅ':'ゆ','ょ':'よ','ゎ':'わ' };

function normalizeForSearch(s) {
  if (!s) return '';
  let r = s.toLowerCase();
  r = r.replace(/[ァィゥェォッャュョヮヵヶ]/g, c => SMALL_KATA[c] || c);
  r = r.replace(/[ぁぃぅぇぉっゃゅょゎ]/g, c => SMALL_HIRA[c] || c);
  // カタカナ → ひらがな（アイウ... → あいう...）
  r = r.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
  return r;
}

function bigramScore(normTarget, token) {
  // 1. 語境界マッチを最優先（"reve" が "revere" の途中にヒットしないよう）
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordBoundary = new RegExp(
    `(?:^|[\\s\\(\\)\\[\\]・／\\-])${esc}(?=[\\s\\(\\)\\[\\]・／\\-]|$)`
  );
  if (wordBoundary.test(normTarget)) return 1.0;

  // 2. 部分文字列マッチはスコア0.5に抑制（0.7閾値を下回る → 単独ではマッチしない）
  if (normTarget.includes(token)) return 0.5;

  // 3. バイグラム類似度（タイポ許容）
  if (token.length < 3) return 0.0;
  const bigrams = new Set();
  for (let i = 0; i < token.length - 1; i++) bigrams.add(token.slice(i, i + 2));
  let hits = 0;
  for (const bg of bigrams) { if (normTarget.includes(bg)) hits++; }
  return hits / bigrams.size;
}

// クエリの全トークンが店舗にマッチするか（バイグラム類似度0.7以上で許容）
function shopFuzzyMatch(shop, query) {
  const aStr = (s) => Array.isArray(s.area) ? s.area.join(' ') : (s.area || '');
  const normTarget = normalizeForSearch(
    [shop.name, aStr(shop), shop.city, shop.address, shop.area_id].filter(Boolean).join(' ')
  );
  const tokens = normalizeForSearch(query).split(/\s+/).filter(Boolean);
  return tokens.length > 0 && tokens.every(t => bigramScore(normTarget, t) >= 0.7);
}
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

  // 店舗名をクリックするとキャスト一覧を表示（SearchPageのshop=パラメータに渡す）
  const shopSearchUrl = `/search?shop=${encodeURIComponent(shop.name)}&shopId=${shop.id}`;

  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden transition-all">
      {/* 上段: 基本情報 */}
      <Link to={shopSearchUrl} onClick={() => onSelect && onSelect(shop)} className="flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors">
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
          <div className="text-xs text-slate-500 mt-0.5">📍 {shop.prefecture}{shop.city}</div>
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
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
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
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
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

const TAG_CATEGORIES = [
  { title: "BODY TYPE", id: "body", tags: ["スレンダー", "グラマー", "巨乳", "美脚", "小柄", "高身長"] },
  { title: "ATMOSPHERE", id: "vibe", tags: ["可愛い系", "美人系", "清楚系", "ギャル系", "お姉さん系"] },
  { title: "AGE GROUP", id: "age", tags: ["10代", "20代前半", "20代後半", "30代", "40代"] },
  { title: "ATTRIBUTES", id: "attr", tags: ["色白", "健康的", "ベテラン", "外国人", "新人"] }
];

const ITEMS_PER_PAGE = 24;

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { shops, shopById } = useShopData();

  // --- URLパラメータから初期値を取得（旧 ?q= も shopQuery に統合）---
  const initShop = searchParams.get('shop') || searchParams.get('q') || '';
  const initCast = searchParams.get('cast') || '';
  const initTags = searchParams.get('tags') ? searchParams.get('tags').split(',') : [];

  const [shopInput, setShopInput] = useState(initShop);
  const [castInput, setCastInput] = useState(initCast);
  const [selectedTags, setSelectedTags] = useState(initTags);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [isPending, startTransition] = useTransition();

  // キャスト結果内の名前フィルター・ソート
  const [castNameFilter, setCastNameFilter] = useState('');
  const [castSortOrder, setCastSortOrder] = useState('default'); // 'default' | 'aiueo' | 'reviews' | 'rating'

  const shopQuery = useDebounce(shopInput, 150);
  const castQuery = useDebounce(castInput, 150);

  // --- DBフェッチ ---
  const [serverTherapists, setServerTherapists] = useState([]);
  const [isFetchingDB, setIsFetchingDB] = useState(true);
  const [reviewCountMap, setReviewCountMap] = useState({}); // { normalizedName: count }
  const [reviewTagMap, setReviewTagMap] = useState({}); // { normalizedName: Set<tag> }
  const [ratingMap, setRatingMap] = useState({}); // { normalizedName: avgRating }

  // URLパラメータを同期
  useEffect(() => {
    startTransition(() => {
      const params = {};
      if (shopInput) params.shop = shopInput;
      if (castInput) params.cast = castInput;
      if (selectedTags.length > 0) params.tags = selectedTags.join(',');
      setSearchParams(params, { replace: true });
    });
  }, [shopInput, castInput, selectedTags]);

  // displayCount をリセット
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [shopQuery, castQuery, selectedTags, castNameFilter, castSortOrder]);

  // DB フェッチ本体
  useEffect(() => {
    if (shops.length === 0) return;

    const fetch = async () => {
      setIsFetchingDB(true);
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

        // 店舗クエリがある場合、マッチする shop_id リストを作成（ファジーマッチ）
        const matchedShopIds = sq
          ? shops.filter(s => shopFuzzyMatch(s, shopQuery)).map(s => s.id)
          : null; // null = 絞り込みなし

        let data = [];

        if (!sq && !cq) {
          // 両方空 → 何も表示しない（プロンプトUIを出す）
          data = [];

        } else if (sq && !cq) {
          // 店舗のみ → マッチ店舗のキャスト全員
          if (matchedShopIds.length === 0) {
            data = [];
          } else {
            const { data: d } = await supabase
              .from('therapists')
              .select('id, shop_id, name, image_url, raw_data')
              .in('shop_id', matchedShopIds.slice(0, 100))
              .limit(1000);
            data = d || [];
          }

        } else if (!sq && cq) {
          // キャストのみ → 名前正規化検索
          let q = supabase
            .from('therapists')
            .select('id, shop_id, name, image_url, raw_data');
          q = applyNameFilter(q);
          const { data: d } = await q.limit(500);
          // クライアント側でスペース除去して完全照合
          data = (d || []).filter(t => normName(t.name).includes(normCq));

        } else {
          // 両方あり → 店舗キャスト全員取得 → クライアントで名前照合
          if (matchedShopIds.length === 0) {
            data = [];
          } else {
            const { data: d } = await supabase
              .from('therapists')
              .select('id, shop_id, name, image_url, raw_data')
              .in('shop_id', matchedShopIds.slice(0, 100))
              .limit(1000);
            data = (d || []).filter(t => normName(t.name).includes(normCq));
          }
        }

        const formatted = (data || []).map(d => ({
          ...d.raw_data,
          id: d.id,
          shop_id: d.shop_id,
          name: d.name || d.raw_data?.name,
          image_url: d.image_url || d.raw_data?.image_url,
        }));
        setServerTherapists(formatted);
      } catch (e) {
        console.error('検索エラー:', e);
      } finally {
        setIsFetchingDB(false);
      }
    };

    fetch();
  }, [shopQuery, castQuery, shops]);

  // セラピスト別口コミ件数・タグ・評価取得（serverTherapistsが更新されたら実行）
  useEffect(() => {
    if (!serverTherapists.length) { setReviewCountMap({}); setReviewTagMap({}); setRatingMap({}); return; }
    const shopIds = [...new Set(serverTherapists.map(t => t.shop_id).filter(Boolean))];
    if (!shopIds.length) return;
    supabase
      .from('reviews')
      .select('therapist_name, tags, rating')
      .in('shop_id', shopIds.slice(0, 50))
      .then(({ data, error }) => {
        if (error) { console.error('口コミ件数取得エラー:', error); return; }
        if (!data) return;
        const norm = (s) => (s || '').replace(/[\s　]/g, '');
        const counts = {};
        const tagMap = {};
        const ratingSums = {};
        const ratingCounts = {};
        data.forEach(r => {
          const n = norm(r.therapist_name);
          if (n) {
            counts[n] = (counts[n] || 0) + 1;
            if (!tagMap[n]) tagMap[n] = new Set();
            (r.tags || []).forEach(tag => tagMap[n].add(tag));
            if (r.rating) {
              ratingSums[n] = (ratingSums[n] || 0) + Number(r.rating);
              ratingCounts[n] = (ratingCounts[n] || 0) + 1;
            }
          }
        });
        const avgRatings = {};
        Object.keys(ratingSums).forEach(n => { avgRatings[n] = ratingSums[n] / ratingCounts[n]; });
        setReviewCountMap(counts);
        setReviewTagMap(tagMap);
        setRatingMap(avgRatings);
      });
  }, [serverTherapists]);

  // 店舗セクション（ファジーマッチ：カナ正規化＋タイポ許容）
  const matchingShops = useMemo(() => {
    if (!shopQuery.trim()) return [];
    return shops.filter(s => shopFuzzyMatch(s, shopQuery)).slice(0, 20);
  }, [shopQuery, shops]);

  // キャスト絞り込み（タグ）
  const filteredTherapists = useMemo(() => {
    if (!serverTherapists.length) return [];
    let results = serverTherapists;

    // タグ絞り込み（口コミのtagsを参照）
    if (selectedTags.length > 0) {
      const norm = (s) => (s || '').replace(/[\s　]/g, '');
      results = results.filter(t => {
        const reviewTags = reviewTagMap[norm(t.name)] || new Set();
        return selectedTags.every(sel => reviewTags.has(sel));
      });
    }

    return results;
  }, [serverTherapists, selectedTags, reviewTagMap]);

  // キャスト名フィルター + ソート
  const sortedFilteredTherapists = useMemo(() => {
    let results = filteredTherapists;

    // キャスト結果内の名前フィルター
    if (castNameFilter.trim()) {
      const f = normalizeForSearch(castNameFilter.trim());
      results = results.filter(t => normalizeForSearch(t.name || '').includes(f));
    }

    // ソート
    const norm = (s) => (s || '').replace(/[\s　]/g, '');
    if (castSortOrder === 'aiueo') {
      results = [...results].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
    } else if (castSortOrder === 'reviews') {
      results = [...results].sort((a, b) => {
        const ca = reviewCountMap[norm(a.name)] || 0;
        const cb = reviewCountMap[norm(b.name)] || 0;
        return cb - ca;
      });
    } else if (castSortOrder === 'rating') {
      results = [...results].sort((a, b) => {
        const ra = ratingMap[norm(a.name)] || 0;
        const rb = ratingMap[norm(b.name)] || 0;
        return rb - ra;
      });
    }

    return results;
  }, [filteredTherapists, castNameFilter, castSortOrder, reviewCountMap, ratingMap]);

  // 同名キャストを1枚にまとめる（複数店舗展開ブランドで同じ人が重複表示されるのを防ぐ）
  const deduplicatedTherapists = useMemo(() => {
    const norm = (s) => (s || '').replace(/[\s　]/g, '');
    const seen = new Map(); // normName -> index in result
    const result = [];
    for (const t of sortedFilteredTherapists) {
      const key = norm(t.name);
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
    const norm = (s) => (s || '').replace(/[\s　]/g, '');
    for (const t of serverTherapists) {
      const reviewTags = reviewTagMap[norm(t.name)] || new Set();
      for (const tag of reviewTags) {
        if (counts[tag] !== undefined) counts[tag]++;
      }
    }
    return counts;
  }, [serverTherapists, reviewTagMap]);

  const isLoading = isPending || isFetchingDB;

  const clearAll = () => {
    setShopInput('');
    setCastInput('');
    setSelectedTags([]);
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
      <SeoHead
        title="キャスト検索"
        description="セラピスト名・店舗名でメンズエステを検索。出勤スケジュール・体験口コミ・料金を一括確認できます。全国580店舗以上対応。"
        path="/search"
      />
      <Header />

      {/* ===== 検索エリア ===== */}
      <div className="bg-slate-950 border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">

          {/* 2つの検索バー */}
          <div className="flex flex-col sm:flex-row gap-3">

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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                >✕</button>
              )}
            </div>

            {/* 絞り込みボタン（モバイル） */}
            <button
              onClick={() => setIsFilterOpen(v => !v)}
              className={`sm:hidden px-4 py-2 rounded-full text-xs font-bold border transition ${isFilterOpen ? 'bg-white text-slate-900 border-white' : 'bg-white/10 text-white border-white/10'}`}
            >
              絞り込み {selectedTags.length > 0 && `(${selectedTags.length})`}
            </button>
          </div>

          {/* ステータスライン */}
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-xs font-bold text-slate-400 truncate">{statusText}</p>
              <p className="text-[10px] text-pink-400 font-bold">
                {isLoading
                  ? '検索中...'
                  : (!shopQuery.trim() && !castQuery.trim())
                    ? 'キャスト名または店舗名を入力'
                    : `店舗 ${matchingShops.length}件・キャスト ${deduplicatedTherapists.length}件`}
              </p>
            </div>
            {(shopInput || castInput || selectedTags.length > 0) && (
              <button
                onClick={clearAll}
                className="text-[10px] text-slate-500 hover:text-white underline font-bold ml-4 flex-shrink-0"
              >
                すべてクリア
              </button>
            )}
          </div>

          {/* アクティブタグ */}
          {selectedTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {selectedTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                  className="flex-shrink-0 bg-pink-600 text-white pl-3 pr-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 hover:bg-pink-500 transition"
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
      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[260px_1fr] gap-8 items-start">

        {/* 左: タグフィルター */}
        <aside className={`${isFilterOpen ? 'block' : 'hidden'} lg:block space-y-6 lg:sticky lg:top-36`}>
          <button
            onClick={() => setIsFilterOpen(v => !v)}
            className="lg:hidden w-full text-center text-xs text-slate-500 mb-2"
          >
            閉じる
          </button>
          {TAG_CATEGORIES.map(category => (
            <div key={category.id} className="bg-slate-900/40 backdrop-blur rounded-3xl p-5 border border-white/5 shadow-xl">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
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
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
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
        </aside>

        {/* 右: 検索結果 */}
        <main className="min-h-[50vh] space-y-10">

          {/* 🏢 マッチした店舗 */}
          {matchingShops.length > 0 && (
            <section>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
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
            {(matchingShops.length > 0 || castQuery) && (
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                {shopQuery && castQuery ? 'この店舗のキャスト絞り込み結果' : shopQuery ? 'この店舗のキャスト一覧' : 'キャスト検索結果'}
                {!isLoading && <span className="text-purple-400 font-bold normal-case">{deduplicatedTherapists.length}件</span>}
              </h2>
            )}

            {/* キャスト内絞り込み・ソートバー */}
            {filteredTherapists.length > 0 && (
              <div className="mb-6">
                {/* 名前検索 */}
                <div className="relative mb-3">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400/60 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <input
                    type="text"
                    value={castNameFilter}
                    onChange={e => setCastNameFilter(e.target.value)}
                    placeholder="キャスト名で絞り込み..."
                    className="w-full bg-gradient-to-r from-slate-900 to-slate-800 border border-pink-500/20 rounded-2xl pl-11 pr-10 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 focus:shadow-lg focus:shadow-pink-500/10 transition-all"
                  />
                  {castNameFilter && (
                    <button onClick={() => setCastNameFilter('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-pink-400 transition">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {/* ソートボタン */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-600 font-black tracking-widest uppercase shrink-0">SORT</span>
                  {[
                    { key: 'default', label: 'デフォルト' },
                    { key: 'aiueo',   label: 'あ 五十音' },
                    { key: 'reviews', label: '💬 口コミ多い' },
                    { key: 'rating',  label: '⭐ 評価高い' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setCastSortOrder(opt.key)}
                      className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 ${
                        castSortOrder === opt.key
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-500/30'
                          : 'bg-slate-800/80 text-slate-500 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              {/* クエリ未入力時のプロンプト */}
              {!shopQuery.trim() && !castQuery.trim() && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-5xl mb-5">🔍</div>
                  <p className="text-white font-black text-lg mb-2">キャスト名か店舗名を入力してください</p>
                  <p className="text-slate-500 text-sm">例:「あかり」「シルク」「銀座」</p>
                </div>
              )}

              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                  {Array.from({ length: 8 }).map((_, i) => <TherapistCardSkeleton key={i} />)}
                </div>
              ) : visibleTherapists.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                    {/* リストにいないセラピストの口コミカード（店舗指定時のみ） */}
                    {shopQuery && matchingShops.length >= 1 && (
                      <Link
                        to={`/post-review?shopId=${matchingShops[0].id}&customMode=true`}
                        className="group relative block bg-slate-900/60 rounded-[1.5rem] overflow-hidden border border-dashed border-purple-500/30 hover:border-purple-500/70 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/20 hover:-translate-y-1"
                      >
                        <div className="aspect-[3/4] flex flex-col items-center justify-center gap-3 p-4">
                          <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                            ✏️
                          </div>
                          <div className="text-center">
                            <p className="text-white font-black text-sm leading-tight">リストに<br />いない</p>
                            <p className="text-slate-500 text-[10px] mt-1.5 leading-relaxed">新人・未登録の<br />セラピストの口コミ</p>
                          </div>
                        </div>
                      </Link>
                    )}
                    {visibleTherapists.map((t, idx) => {
                      const shop = shopById[t.shop_id];
                      return (
                        <React.Fragment key={t.id}>
                        {/* 12枚目の後にW2R帯を挿入 */}
                        {idx === 11 && (
                          <Link
                            to="/post-review"
                            className="col-span-2 md:col-span-3 lg:col-span-4 flex items-center justify-between gap-4 bg-gradient-to-r from-purple-900/70 to-pink-900/50 border border-purple-500/30 rounded-2xl px-5 py-4 hover:border-purple-400/50 transition-all group"
                          >
                            <div>
                              <p className="text-white font-black text-sm">口コミを書くと、みんなの口コミが読み放題になります</p>
                              <p className="text-purple-300 text-xs mt-0.5">体験談（700文字以上）を投稿 → 7日間の閲覧権を即時自動付与</p>
                            </div>
                            <span className="shrink-0 text-white bg-pink-600 group-hover:bg-pink-500 font-black text-xs px-4 py-2 rounded-xl transition whitespace-nowrap">口コミを書く →</span>
                          </Link>
                        )}
                        <Link
                          to={`/shops/${t.shop_id}/threads/${t.id}`}
                          className="group relative block bg-slate-900 rounded-[1.5rem] overflow-hidden border border-white/5 hover:border-pink-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-900/20 hover:-translate-y-1"
                        >
                          <div className="aspect-[3/4] overflow-hidden relative">
                            <LazyImage src={t.image_url || t.image} alt={t.name} width={400} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90 group-hover:opacity-60 transition duration-500"></div>
                            {(() => {
                              const cnt = reviewCountMap[(t.name || '').replace(/[\s　]/g, '')];
                              return cnt > 0 ? (
                                <div className="absolute top-2 right-2 bg-pink-500 text-white text-[11px] font-black px-2 py-1 rounded-full shadow-lg shadow-pink-500/50 flex items-center gap-1">
                                  💬 {cnt}
                                </div>
                              ) : null;
                            })()}
                            <div className="absolute bottom-0 left-0 w-full p-3">
                              <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 group-hover:bg-white/10 transition duration-300">
                                <div className="flex items-center gap-1 mb-1">
                                  {t.age && <span className="bg-black/40 px-1.5 py-0.5 rounded text-[9px] font-bold text-white border border-white/10">{t.age}歳</span>}
                                </div>
                                <h3 className="text-white font-black text-base leading-tight truncate">{t.name}</h3>
                                <p className="text-[10px] text-slate-300 font-bold truncate flex items-center gap-1 mt-1">
                                  <span className="text-pink-500">📍</span>
                                  {t._extraShopIds?.length > 0
                                    ? `${shop?.name || ''} 他${t._extraShopIds.length}店舗`
                                    : shop ? `${shop.area || shop.city} | ${shop.name}` : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                        </React.Fragment>
                      );
                    })}
                  </div>
                  {visibleTherapists.length < deduplicatedTherapists.length && (
                    <div className="mt-10 text-center">
                      <button
                        onClick={() => setDisplayCount(n => n + ITEMS_PER_PAGE)}
                        className="bg-slate-800 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-700 transition border border-white/10"
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
