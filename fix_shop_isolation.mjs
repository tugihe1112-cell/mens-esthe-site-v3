import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
let code = fs.readFileSync(filePath, 'utf-8');

const startStr = "const [activeTab, setActiveTab] = useState('top');";
const endStr = "const isFavorite = favorites.includes(shop.id);";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newCode = `const [activeTab, setActiveTab] = useState('top');
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

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

  // 共有箱(Context)はあくまで「保険」としてだけ扱う
  const shop = localShop || (shopById ? shopById[shopId] : null);
  const therapists = localTherapists.length > 0 ? localTherapists : (getTherapistsByShopId ? getTherapistsByShopId(shopId) : []);
  // クチコミはプレミアム会員用のフィルター関数があれば優先し、無ければ直接取得した生データを使う
  const reviews = (getReviewsByShopId ? getReviewsByShopId(shopId, isPremiumUser) : null) || localReviews || [];

  // 🔒 致命的なバグの修正：Contextが空っぽでも、ローカルの取得が終われば絶対に画面を表示する！
  if (isFetching && !shop) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest animate-pulse">LOADING...</div>;
  if (!shop) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Shop not found</div>;

  `;
  
  code = code.substring(0, startIndex) + newCode + code.substring(endIndex);
  fs.writeFileSync(filePath, code);
  console.log("✅ 修正完了！店舗詳細ページに『完全個室化』の強固なロックをかけました。");
} else {
  console.log("❌ 置換対象のコードが見つかりませんでした。");
}
