import fs from 'fs';

const filePath = 'src/pages/PostReviewPage.jsx';
let code = fs.readFileSync(filePath, 'utf-8');

// 今回確認した 241〜249行目の useMemo のブロックを正規表現で正確に狙い撃ちします
const oldCodeRegex = /const shopTherapists = useMemo\(\(\) => \{[\s\S]*?\}, \[selectedShopId, shops, getTherapistsByShopId\]\);/;

const newCode = `const [shopTherapists, setShopTherapists] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchTherapists = async () => {
      if (!selectedShopId) {
        if (isMounted) setShopTherapists([]);
        return;
      }

      // 1. まず手元の共有データ（Context）を探す
      const targetShop = shops.find(s => String(s.id) === String(selectedShopId));
      if (targetShop && targetShop.therapists && targetShop.therapists.length > 0) {
        if (isMounted) setShopTherapists(targetShop.therapists);
        return;
      }
      const ctxTherapists = getTherapistsByShopId ? getTherapistsByShopId(selectedShopId) : [];
      if (ctxTherapists && ctxTherapists.length > 0) {
        if (isMounted) setShopTherapists(ctxTherapists);
        return;
      }

      // 2. 手元に無ければ、CASTタブと同じようにSupabaseから直接取得する！
      try {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!url || !key) return;
        
        const headers = { 'apikey': key, 'Authorization': \`Bearer \${key}\` };
        const res = await fetch(\`\${url}/rest/v1/therapists?shop_id=eq.\${selectedShopId}&select=*\`, { headers });
        const data = await res.json();
        
        if (data && data.length > 0 && isMounted) {
          setShopTherapists(data);
        }
      } catch (e) {
        console.error("セラピスト取得エラー:", e);
      }
    };
    fetchTherapists();
    return () => { isMounted = false; };
  }, [selectedShopId, shops, getTherapistsByShopId]);`;

if (code.match(oldCodeRegex)) {
  code = code.replace(oldCodeRegex, newCode);
  fs.writeFileSync(filePath, code);
  console.log("✅ 修正完了！セラピストデータをSupabaseから確実に取得する処理に書き換えました。");
} else {
  console.log("❌ 対象のコードが見つかりませんでした。");
}
