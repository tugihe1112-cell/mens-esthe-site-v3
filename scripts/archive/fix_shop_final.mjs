import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
let code = fs.readFileSync(filePath, 'utf-8');

const startStr = "const [activeTab, setActiveTab] = useState('top');";
const endStr = "const seoDesc = ";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newCode = `const [activeTab, setActiveTab] = useState('top');
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
  const [reviewDisplayCount, setReviewDisplayCount] = useState(10); // 🚨 Hookルール違反を防ぐため一番上に移動！

  // 🔒 ロック1：完全個室化ステート（※変数名は cloudShop のまま残して、後半のエラーを完全回避！）
  const [cloudShop, setCloudShop] = useState(null);
  const [cloudTherapists, setCloudTherapists] = useState(null);
  const [cloudReviews, setCloudReviews] = useState(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!shopId) return;
    let isMounted = true;
    
    const fetchAllData = async () => {
      setIsFetching(true);
      try {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!url || !key) return;
        const headers = { 'apikey': key, 'Authorization': \`Bearer \${key}\` };
        
        // 店舗・キャスト・クチコミを並列で一気にSupabaseから直接取得！
        const [shopRes, tRes, rRes] = await Promise.all([
          fetch(\`\${url}/rest/v1/shops?id=eq.\${shopId}&select=*\`, { headers }),
          fetch(\`\${url}/rest/v1/therapists?shop_id=eq.\${shopId}&select=*\`, { headers }),
          fetch(\`\${url}/rest/v1/reviews?shop_id=eq.\${shopId}&select=*\`, { headers })
        ]);
        
        const [shopData, tData, rData] = await Promise.all([
          shopRes.json(), tRes.json(), rRes.json()
        ]);
        
        if (isMounted) {
          if (shopData && shopData.length > 0) setCloudShop(shopData[0]);
          if (tData && tData.length > 0) setCloudTherapists(tData);
          if (rData && rData.length > 0) setCloudReviews(rData);
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

  // 共有箱(Context)はあくまで「保険」。基本は直接取ってきた cloudShop を使う
  const shop = cloudShop || (shopById ? shopById[shopId] : null);
  const therapists = cloudTherapists || (getTherapistsByShopId ? getTherapistsByShopId(shopId) : []) || [];
  const reviews = cloudReviews || (getReviewsByShopId ? getReviewsByShopId(shopId, isPremiumUser) : []) || [];
  const isFavorite = shop ? favorites.includes(shop.id) : false;

  const visibleReviews = reviews.slice(0, reviewDisplayCount);
  const visibleTherapists = therapists.slice(0, displayCount);
  const hasMore = displayCount < therapists.length;
  const handleLoadMore = () => setDisplayCount(prev => prev + LOAD_MORE_COUNT);

  // ✨ すべてのHook（useState, useEffect）が終わったので、ここで初めて安全に早期リターン！
  if (isFetching && !shop) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest animate-pulse">LOADING...</div>;
  if (!shop) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Shop not found</div>;

  `;
  
  code = code.substring(0, startIndex) + newCode + code.substring(endIndex);
  fs.writeFileSync(filePath, code);
  console.log("✅ 修正完了！変数の名前を統一し、完璧な個室化ロックをかけました。");
} else {
  console.log("❌ 置換対象のコードが見つかりませんでした。");
}
