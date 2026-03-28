const fs = require('fs');
const filePath = 'src/contexts/DataContext.jsx';

console.log('🚑 Writing the FINAL WORKING DataContext.jsx...');

const content = `import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// コンテキスト作成
const ShopContext = createContext();

// フック
export const useShopData = () => useContext(ShopContext);

// ★ここが重要: App.jsxが探している名前 "DataProvider" に統一
export const DataProvider = ({ children }) => {
  const [shops, setShops] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(null);

  // 1. データ読み込み (起動時に1回だけ実行)
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🚀 Fetching data...");
        const timestamp = Date.now(); // キャッシュ回避
        
        // publicフォルダからデータを取得
        const [shopsRes, therapistsRes, reviewsRes, versionRes] = await Promise.all([
          fetch('/data/all_shops.json?v=' + timestamp),
          fetch('/data/therapists.json?v=' + timestamp),
          fetch('/data/reviews.json?v=' + timestamp).catch(() => ({ json: () => [] })),
          fetch('/data/version.json?v=' + timestamp).catch(() => ({ json: () => ({ version: timestamp }) }))
        ]);

        const shopsData = await shopsRes.json();
        const therapistsData = await therapistsRes.json();
        const reviewsData = await reviewsRes.json();
        const versionData = await versionRes.json();

        console.log(\`✅ Loaded: Shops=\${shopsData.length}, Therapists=\${therapistsData.length}\`);

        setShops(shopsData);
        setTherapists(therapistsData);
        setVersion(versionData.version);

        // クチコミのマージ (LocalStorage + Server)
        try {
          const localReviews = JSON.parse(localStorage.getItem('mens_esthe_local_reviews') || '[]');
          const merged = [...localReviews, ...reviewsData].sort((a, b) => 
            new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
          );
          setReviews(merged);
        } catch (e) {
          console.error("Merge error:", e);
          setReviews(reviewsData);
        }

      } catch (error) {
        console.error('❌ Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. クチコミ投稿機能
  const addReview = useCallback((newReview) => {
    console.log("📝 Adding review:", newReview);
    setReviews(prev => [newReview, ...prev]);
    try {
      const localData = JSON.parse(localStorage.getItem('mens_esthe_local_reviews') || '[]');
      localData.push(newReview);
      localStorage.setItem('mens_esthe_local_reviews', JSON.stringify(localData));
    } catch (e) { console.error("LS Error:", e); }
  }, []);

  // 3. ヘルパー関数
  const shopById = shops.reduce((acc, shop) => { acc[shop.id] = shop; return acc; }, {});
  const therapistById = therapists.reduce((acc, t) => { acc[t.id] = t; return acc; }, {});
  
  // ★重要: データ側の shop_id と一致させる
  const getTherapistsByShopId = (shopId) => {
    return therapists.filter(t => t.shop_id === shopId);
  };

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

fs.writeFileSync(filePath, content);
console.log('🎉 DataContext has been fixed correctly as "DataProvider".');
