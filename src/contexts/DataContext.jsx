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
    const fetchInitialData = async () => {
      try {
        const { data: shopsData, error } = await supabase.from('shops').select('id, group_id, name, raw_data, website_url, schedule_url, phone_number, business_hours, price_system, image_url');
        if (error) throw error;
        if (shopsData) {
          setShops(shopsData.map(d => ({ ...d.raw_data, id: d.id, group_id: d.group_id, name: d.name, image_url: d.image_url, website_url: d.website_url, schedule_url: d.schedule_url, phone_number: d.phone_number, business_hours: d.business_hours, price_system: d.price_system })));
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
    setReviews(prev => [newReview, ...prev]);
    try {
      await supabase.from('reviews').insert([{
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
    } catch (e) { console.error(e); }
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
