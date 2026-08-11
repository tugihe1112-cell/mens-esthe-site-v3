import { supabase } from '../lib/supabase';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ShopContext = createContext();
export const useShopData = () => useContext(ShopContext);

export const DataProvider = ({ children }) => {
  const [shops, setShops] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(Date.now());

  const [loadedShopIds, setLoadedShopIds] = useState(new Set());
  const [loadedReviewShopIds, setLoadedReviewShopIds] = useState(new Set());

  useEffect(() => {
    // ── フォールバック: ブラウザから直接Supabaseを叩く従来経路 ──
    // ⚠️ 全件取得は必ず range() でページングすること。
    //    PostgREST はサーバー側の max-rows（既定1000）が優先されるため、
    //    limit も range も付けない素の select は 1,000 行で頭打ちになり、
    //    掲載1,098店のうち約98店がエラーも警告も出さずに欠落していた
    //    （サイトマップで潰したのと同じバグ。api/sitemap.xml.js と同方式に揃える）。
    //    .order('id') は range のページ境界で取りこぼし/重複を出さないために必須。
    //    NOTE: price_system / business_hours / phone_number は初回selectから外して
    //    軽量化したかったが、SearchPage の ShopCard（検索結果の「詳細▾」で料金・
    //    営業時間・電話を出す）が DataContext の shops から直接読んでいるため外せない。
    //    外すと検索結果の詳細パネルが無言で空になる。
    const fetchDirectFromSupabase = async () => {
      const PAGE = 1000;
      const out = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from('shops')
          .select('id, group_id, name, raw_data, website_url, schedule_url, phone_number, business_hours, price_system, image_url')
          .order('id')
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        out.push(...data);
        if (data.length < PAGE) break;
        if (out.length >= 50000) break; // 暴走ガード
      }
      return out;
    };

    const fetchInitialData = async () => {
      try {
        // ── 速度改善(2026-08-09) ──
        // まず /api/shops-lite（サーバー側で raw_data.threads を落としCDNキャッシュ済み）を試す。
        // threads は raw_data の96%を占める古い重複セラピストデータで、
        // 全ユーザーが全ページで推定12MBをDL+JSONパースしていた＝体感速度の主犯。
        // API側が落ちた場合だけ従来どおりブラウザから直接Supabaseを叩く（機能は落とさない）。
        let shopsData = [];
        try {
          const r = await fetch('/api/shops-lite');
          if (!r.ok) throw new Error('shops-lite ' + r.status);
          const j = await r.json();
          if (!Array.isArray(j) || j.length === 0) throw new Error('shops-lite empty');
          shopsData = j;
        } catch (liteErr) {
          console.warn('⚠️ /api/shops-lite 失敗 → 直接Supabaseにフォールバック:', liteErr.message);
          shopsData = await fetchDirectFromSupabase();
        }

        if (shopsData.length) {
          setShops(shopsData.map(d => {
            const raw = d.raw_data || {};
            return {
              ...raw,
              // raw_data.area が文字列でない場合（オブジェクト等）はundefinedに正規化
              area: typeof raw.area === 'string' ? raw.area : undefined,
              id: d.id,
              group_id: d.group_id,
              name: d.name,
              image_url: d.image_url,
              website_url: d.website_url,
              schedule_url: d.schedule_url,
              phone_number: d.phone_number,
              business_hours: d.business_hours,
              price_system: d.price_system,
            };
          }));
        }
      } catch (error) {
        console.error('❌ Failed to fetch initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const getBrandName = useCallback((shopName) => {
    if (!shopName) return '';
    let n = shopName;
    n = n.replace(/[（(].*?[)）]/g, '');
    n = n.replace(/\s+[^\s]+(店|ルーム|FC.*)$/g, '');
    if (n.includes('リンダスパ')) return 'LINDA SPA';
    return n.trim().toUpperCase();
  }, []);

    const getBrandShopIds = useCallback((shopId) => {
    const currentShop = shops.find(s => s.id === shopId);
    if (!currentShop) return [shopId];
    // group_id で束ねる（同ブランド全店舗のレビューを吸収）
    if (currentShop.group_id) {
      const relatedIds = shops
        .filter(s => s.group_id === currentShop.group_id)
        .map(s => s.id);
      return relatedIds.length > 0 ? relatedIds : [shopId];
    }
    // group_idがない場合はbrandIdで束ねる
    if (currentShop.brandId) {
      const relatedIds = shops
        .filter(s => s.brandId === currentShop.brandId)
        .map(s => s.id);
      return relatedIds.length > 0 ? relatedIds : [shopId];
    }
    return [shopId];
  }, [shops]);

  const loadTherapistsForShop = useCallback(async (shopId) => {
    if (!shopId || loadedShopIds.has(shopId)) return;
    const brandIds = getBrandShopIds(shopId);
    try {
      const { data, error } = await supabase.from('therapists').select('*').in('shop_id', brandIds);
      if (error) throw error;
      if (data) {
        const newTherapists = data.map(d => ({ ...(d.raw_data || {}), ...d }));
        setTherapists(prev => {
          const merged = [...prev, ...newTherapists];
          return Array.from(new Map(merged.filter(t => t.name).map(t => [t.name, t])).values());
        });
        setLoadedShopIds(prev => {
          const newSet = new Set(prev);
          brandIds.forEach(id => newSet.add(id));
          return newSet;
        });
      }
    } catch (error) { console.error(`❌ セラピスト取得エラー:`, error); }
  }, [loadedShopIds, getBrandShopIds]);

  const loadReviewsForShop = useCallback(async (shopId) => {
    if (!shopId || loadedReviewShopIds.has(shopId)) return;
    const brandIds = getBrandShopIds(shopId);
    try {
      const { data, error } = await supabase.from('reviews').select('*').in('shop_id', brandIds).order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      if (data) {
        const formattedReviews = data.map(r => ({
          ...r,
          createdAt: r.created_at,
          date: r.created_at,
          reviewerName: r.user_name,
          score: r.rating,
          text: r.content,
          review_text: r.content
        }));
        setReviews(prev => {
          const merged = [...prev, ...formattedReviews];
          const uniqueById = Array.from(new Map(merged.map(r => [r.id, r])).values());
          return uniqueById.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        });
        setLoadedReviewShopIds(prev => {
          const newSet = new Set(prev);
          brandIds.forEach(id => newSet.add(id));
          return newSet;
        });
      }
    } catch (error) { console.error(`❌ クチコミ取得エラー:`, error); }
  }, [loadedReviewShopIds, getBrandShopIds]);

  const addReview = useCallback(async (newReview) => {
    // ⚠️ 2026-08-12 修正: 以前は (a)INSERT前に楽観的に画面へ追加し (b)エラーを
    //    `catch (e) { console.error(e) }` で握りつぶしていた。
    //    そのため **保存に失敗しても呼び出し側は成功扱い**になり、ユーザーには
    //    「投稿完了」画面が出るのに1件も保存されない、という最悪の壊れ方をしていた。
    //    公開INSERTポリシー（anonでも書ける穴）を閉じると、セッション切れ等で
    //    RLSに弾かれるケースが現実に発生するため、ここを直さずに閉じてはいけない。
    //    → 先にINSERTし、成功したときだけ画面に反映する。失敗は必ず throw する。
    const { error } = await supabase.from('reviews').insert([{
        id: newReview.id || `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        shop_id: newReview.shop_id || newReview.shopId || 'unknown',
        shop_name: newReview.shop_name || newReview.shopName || null,
        therapist_id: newReview.therapist_id || newReview.therapistId || null,
        therapist_name: newReview.therapist_name || newReview.therapistName || null,
        user_id: newReview.user_id || newReview.userId || 'anonymous',
        user_name: newReview.user_name || newReview.userName || newReview.user || '名無しさん',
        rating: newReview.rating || newReview.score || 5,
        course: newReview.course || null,
        detailed_ratings: newReview.detailed_ratings || newReview.detailedRatings || null,
        tags: newReview.tags || null,
        content: newReview.content || newReview.text || '',
      }]);

    if (error) {
      console.error('[addReview] 保存に失敗:', error);
      // RLSに弾かれた場合は原因が分かるメッセージにする（セッション切れが典型）
      const isRls = /row-level security|violates row-level|42501/i.test(
        `${error.message || ''} ${error.code || ''}`
      );
      const e = new Error(
        isRls
          ? 'ログインの有効期限が切れている可能性があります。再度ログインしてから投稿してください。'
          : `口コミの保存に失敗しました（${error.message || '原因不明'}）`
      );
      e.cause = error;
      throw e;
    }

    // 保存に成功したときだけ画面に反映する
    setReviews(prev => [newReview, ...prev]);
  }, []);

  const shopById = useMemo(() => {
    return shops.reduce((acc, shop) => { acc[shop.id] = shop; return acc; }, {});
  }, [shops]);

  const therapistById = useMemo(() => {
    return therapists.reduce((acc, t) => { if (t.id) acc[t.id] = t; return acc; }, {});
  }, [therapists]);
  
  const getTherapistsByShopId = useCallback((shopId) => {
    const brandIds = getBrandShopIds(shopId);
    const fromTable = therapists.filter(t => brandIds.includes(t.shop_id) || brandIds.includes(t.shopId));
    
    const shop = shopById[shopId];
    let fromRaw = [];
    
    // 🌟 ここが最大の修正ポイント: 箱の中(raw_data)ではなく、直接展開された(shop.therapists)を最優先で探す！
    const shopTherapists = shop?.therapists || shop?.raw_data?.therapists;
    const shopThreads = shop?.threads || shop?.raw_data?.threads;
    
    if (shopTherapists && Array.isArray(shopTherapists)) {
      fromRaw = shopTherapists.map(t => {
        if (typeof t === 'string') {
          const nameParts = t.split('_');
          const cleanName = nameParts.length > 1 ? nameParts.pop() : t;
          return { 
            id: t, 
            name: cleanName, 
            therapistName: cleanName, 
            shopName: shop?.name || '',
            image: therapists.find(dbT => dbT.name === cleanName || dbT.id === t)?.image || therapists.find(dbT => dbT.name === cleanName || dbT.id === t)?.image_url || null
          };
        }
        return t;
      });
    } else if (shopThreads && Array.isArray(shopThreads)) {
      fromRaw = shopThreads;
    }

    return [...fromTable, ...fromRaw];
  }, [therapists, getBrandShopIds, shopById]);

  // 🌟【データ隠蔽セキュリティ】画面に渡す直前にダミー文字へすり替える！
  const getReviewsByShopId = useCallback((shopId, isPremiumUser = false) => {
    const brandIds = getBrandShopIds(shopId);
    const shopReviews = reviews.filter(r => brandIds.includes(r.shop_id) || brandIds.includes(r.shopId));
    
    return shopReviews.map((r, index) => {
      // 2件目以降 ＆ 無料会員 の場合は、中身を強制上書き
      if (index > 0 && !isPremiumUser) {
        return {
          ...r,
          text: '🔒 このクチコミはプレミアム会員限定です。登録してリアルな評価を確認しましょう！',
          review_text: '🔒 このクチコミはプレミアム会員限定です。登録してリアルな評価を確認しましょう！'
        };
      }
      return r;
    });
  }, [reviews, getBrandShopIds]);

  const value = {
    shops, therapists, reviews, loading,
    shopById, therapistById, getTherapistsByShopId, getReviewsByShopId,
    version, addReview, loadTherapistsForShop, loadReviewsForShop
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};
