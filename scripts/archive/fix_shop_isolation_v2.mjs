import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
let code = fs.readFileSync(filePath, 'utf-8');

const startStr = "const [activeTab, setActiveTab] = useState('top');";
const endStr = "const handlePostReview = () => {";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newCode = `const [activeTab, setActiveTab] = useState('top');
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
  const [reviewDisplayCount, setReviewDisplayCount] = useState(10); // 🚨 フックをすべて上部に移動！

  // 🔒 ロック1：完全個室化ステート（他ページに一切依存しない）
  const [localShop, setLocalShop] = useState(null);
  const [localTherapists, setLocalTherapists] = useState([]);
  const [localReviews, setLocalReviews] = useState([]);
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
        
        const [shopRes, tRes, rRes] = await Promise.all([
          fetch(\`\${url}/rest/v1/shops?id=eq.\${shopId}&select=*\`, { headers }),
          fetch(\`\${url}/rest/v1/therapists?shop_id=eq.\${shopId}&select=*\`, { headers }),
          fetch(\`\${url}/rest/v1/reviews?shop_id=eq.\${shopId}&select=*\`, { headers })
        ]);
        
        const [shopData, tData, rData] = await Promise.all([
          shopRes.json(), tRes.json(), rRes.json()
        ]);
        
        if (isMounted) {
          if (shopData && shopData.length > 0) setLocalShop(shopData[0]);
          if (tData && tData.length > 0) setLocalTherapists(tData);
          if (rData && rData.length > 0) setLocalReviews(rData);
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

  // データ統合（ローカルを優先）
  const shop = localShop || (shopById ? shopById[shopId] : null);
  const therapists = localTherapists.length > 0 ? localTherapists : (getTherapistsByShopId ? getTherapistsByShopId(shopId) : []);
  const reviews = localReviews.length > 0 ? localReviews : ((getReviewsByShopId ? getReviewsByShopId(shopId, isPremiumUser) : []) || []);
  const isFavorite = shop ? favorites.includes(shop.id) : false;

  const visibleReviews = reviews.slice(0, reviewDisplayCount);
  const visibleTherapists = therapists.slice(0, displayCount);
  const hasMore = displayCount < therapists.length;
  const handleLoadMore = () => setDisplayCount(prev => prev + LOAD_MORE_COUNT);

  const seoDesc = shop ? \`\${shop.name}（\${shop.prefecture} \${shop.city}）の店舗情報。在籍セラピスト\${therapists.length}名。\` : '';

  // ✨ すべてのHook（useState, useEffect）の定義が終わったこの場所で、初めてLoading判定を行う！
  if (isFetching && !shop) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest animate-pulse">LOADING...</div>;
  if (!shop) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Shop not found</div>;

  `;
  
  code = code.substring(0, startIndex) + newCode + code.substring(endIndex);
  fs.writeFileSync(filePath, code);
  console.log("✅ 修正完了！フックの順番を守りつつ、強固な完全個室化ロックをかけました。");
} else {
  console.log("❌ 置換対象のコードが見つかりませんでした。");
}
