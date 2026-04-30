import fs from 'fs';

const filePath = 'src/pages/ShopListPage.jsx';

try {
  let content = fs.readFileSync(filePath, 'utf-8');

  // 書き換えターゲット（検索結果を受け取っている行）
  const targetLine = "  const { query, setQuery, result, mode, summary, isSearching } = useSearch(shops, initialQuery);";
  
  // 置き換える新しいコード（生の検索結果を受け取り、店舗名で重複排除してから result として定義し直す）
  const replacementLines = `  const { query, setQuery, result: rawResult, mode, summary, isSearching } = useSearch(shops, initialQuery);

  // ★ 店舗名での重複排除ロジック
  const result = React.useMemo(() => {
    if (!rawResult) return [];
    const seen = new Set();
    return rawResult.filter(shop => {
      // 空白（全角・半角）を消して小文字化し、完全に一致する店舗名を弾く
      const normalizedName = (shop.name || '').replace(/[\\s　]+/g, '').toLowerCase();
      if (seen.has(normalizedName)) return false;
      seen.add(normalizedName);
      return true;
    });
  }, [rawResult]);`;

  if (content.includes(targetLine)) {
    content = content.replace(targetLine, replacementLines);
    console.log("✅ 店舗一覧ページに「店舗名ベースの重複排除」ロジックを追加しました！");
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("\n🎊 src/pages/ShopListPage.jsx の自動書き換えが完了しました！");
    console.log("ブラウザをリロードして、店舗検索結果のダブリが消えているかご確認ください！");
  } else {
    console.log("⚠️ 対象のコードが見つかりませんでした。スペースの数などが違う可能性があります。");
  }

} catch (e) {
  console.error("❌ エラーが発生しました: ", e.message);
}
