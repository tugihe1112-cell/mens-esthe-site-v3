import fs from 'fs';

const filePath = 'src/pages/PostReviewPage.jsx';
let code = fs.readFileSync(filePath, 'utf-8');

// 以前追加した useEffect のブロックを正規表現で狙い撃ちして、Supabase直接取得のみに書き換えます
const targetRegex = /const \[shopTherapists, setShopTherapists\] = useState\(\[\]\);[\s\S]*?\}, \[selectedShopId, shops, getTherapistsByShopId\]\);/;

const newCode = `const [shopTherapists, setShopTherapists] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchTherapists = async () => {
      if (!selectedShopId) {
        if (isMounted) setShopTherapists([]);
        return;
      }

      // 🚨 共有データ(Context)は文字列しか返さないバグがあるため無視！
      // 常にSupabaseから直接「写真・名前入り」の完全なオブジェクトを取得する
      try {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!url || !key) return;
        
        const headers = { 'apikey': key, 'Authorization': \`Bearer \${key}\` };
        const res = await fetch(\`\${url}/rest/v1/therapists?shop_id=eq.\${selectedShopId}&select=*\`, { headers });
        const data = await res.json();
        
        if (data && data.length > 0 && isMounted) {
          setShopTherapists(data);
        } else if (isMounted) {
          setShopTherapists([]);
        }
      } catch (e) {
        console.error("セラピスト取得エラー:", e);
      }
    };
    fetchTherapists();
    return () => { isMounted = false; };
  }, [selectedShopId]);`;

if (code.match(targetRegex)) {
  code = code.replace(targetRegex, newCode);
  fs.writeFileSync(filePath, code);
  console.log("✅ 修正完了！不完全な共有データを無視し、常にSupabaseから完全なキャストデータを取得するように変更しました。");
} else {
  console.log("❌ 置換対象のコードが見つかりませんでした。");
}
