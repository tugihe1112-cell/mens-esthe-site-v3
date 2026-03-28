const fs = require('fs');
const path = require('path');

const filePath = 'src/contexts/DataContext.jsx';

console.log('🚑 Overwriting DataContext.jsx with CORRECT full code...');

// 完全に正しいコードで上書きする（パッチ処理はもうしない）
const correctContent = `import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ShopContext = createContext();

export const useShopData = () => useContext(ShopContext);

export const ShopProvider = ({ children }) => {
  const [shops, setShops] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(null);

  // マスタデータ読み込み & クチコミ統合
  useEffect(() => {
    const fetchData = async () => {
      try {
        const timestamp = Date.now();
        const [shopsRes, therapistsRes, reviewsRes, versionRes] = await Promise.all([
          fetch('/data/all_shops.json?v=' + timestamp).catch(() => ({ json: () => [] })),
          fetch('/data/therapists.json?v=' + timestamp).catch(() => ({ json: () => [] })),
          fetch('/data/reviews.json?v=' + timestamp).catch(() => ({ json: () => [] })),
          fetch('/data/version.json?v=' + timestamp).catch(() => ({ json: () => ({ version: timestamp }) }))
        ]);

        const shopsData = await shopsRes.json();
        const therapistsData = await therapistsRes.json();
        const reviewsData = await reviewsRes.json();
        const versionData = await versionRes.json();

        setShops(shopsData);
        setTherapists(therapistsData);
        setVersion(versionData.version);

        // --- クチコミ統合ロジック (JSON + LocalStorage) ---
        try {
          const localReviews = JSON.parse(localStorage.getItem('mens_esthe_local_reviews') || '[]');
          // 日付順にマージ
          const mergedReviews = [...localReviews, ...reviewsData].sort((a, b) => 
            new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
          );
          setReviews(mergedReviews);
        } catch (e) {
          console.error("Failed to merge reviews:", e);
          setReviews(reviewsData);
        }
        // ---------------------------------------------

      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- 投稿機能 (LocalStorage保存) ---
  const addReview = useCallback((newReview) => {
    console.log("📝 Adding new review:", newReview);
    
    setReviews(prev => [newReview, ...prev]);

    try {
      const localData = JSON.parse(localStorage.getItem('mens_esthe_local_reviews') || '[]');
      localData.push(newReview);
      localStorage.setItem('mens_esthe_local_reviews', JSON.stringify(localData));
    } catch (e) {
      console.error("Failed to save to LocalStorage:", e);
    }
  }, []);

  // ヘルパー関数
  const shopById = shops.reduce((acc, shop) => {
    acc[shop.id] = shop;
    return acc;
  }, {});

  const therapistById = therapists.reduce((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {});

  const getTherapistsByShopId = (shopId) => {
    return therapists.filter(t => t.shop_id === shopId);
  };

  // ★ ここが消えていたためスライドショーが死んでいました。正しく公開します。
  const value = {
    shops,
    therapists,
    reviews,
    loading,
    shopById,
    therapistById,
    getTherapistsByShopId,
    version,
    addReview 
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};
`;

fs.writeFileSync(filePath, correctContent);
console.log('✅ DataContext restored completely.');
