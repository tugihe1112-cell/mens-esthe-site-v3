import fs from 'fs';

const filePath = 'src/contexts/DataContext.jsx';

try {
  let content = fs.readFileSync(filePath, 'utf-8');

  // getBrandShopIds 関数を検索して置き換えるための正規表現と新しいコード
  // ※関数全体をごっそり「店舗名ベース」でIDを収集するロジックに置き換えます
  
  // もしすでに getBrandShopIds がある場合、それを安全に書き換えるためのフック
  const targetDefinition = "const getBrandShopIds = useCallback((shopId) => {";
  
  const replacementDefinition = `const getBrandShopIds = useCallback((shopId) => {
    // 現在の店舗データを取得
    const currentShop = shops.find(s => s.id === shopId);
    if (!currentShop) return [shopId];

    // 店舗名を正規化（空白除去・小文字化）
    const normalizedName = (currentShop.name || '').replace(/[\\s　]+/g, '').toLowerCase();

    // 同じ名前を持つすべての店舗のIDを配列にして返す
    const relatedIds = shops
      .filter(s => (s.name || '').replace(/[\\s　]+/g, '').toLowerCase() === normalizedName)
      .map(s => s.id);

    // 念のため、見つからなかった場合は元のIDだけは返す
    return relatedIds.length > 0 ? relatedIds : [shopId];
  }, [shops]);`;

  // 文字列置換
  // まず、既存の関数の中身を正規表現で特定して置き換えます。
  // （もし上手くマッチしない場合は、後続の置換で対応します）
  let newContent = content.replace(
    /const getBrandShopIds = useCallback\(\(shopId\) => \{[\s\S]*?\}, \[[^\]]*\]\);/,
    replacementDefinition
  );

  // もし上記の正規表現で置換できなかった場合（念のためのフォールバック）
  if (newContent === content) {
    console.log("⚠️ 既存の getBrandShopIds の構造が予想と異なりました。別の方法でパッチを当てます...");
    const targetLine2 = "const loadReviewsForShop = useCallback(async (shopId) => {";
    const injectionCode = `
  // --- ★店舗名で関連IDを全取得する強力版getBrandShopIds（自動挿入） ---
  const getBrandShopIds = useCallback((shopId) => {
    const currentShop = shops.find(s => s.id === shopId);
    if (!currentShop) return [shopId];
    const normalizedName = (currentShop.name || '').replace(/[\\s　]+/g, '').toLowerCase();
    return shops.filter(s => (s.name || '').replace(/[\\s　]+/g, '').toLowerCase() === normalizedName).map(s => s.id);
  }, [shops]);
  // -------------------------------------------------------------
  
  const loadReviewsForShop = useCallback(async (shopId) => {`;
    newContent = content.replace(targetLine2, injectionCode);
  }

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log("✅ getBrandShopIds を強化し、口コミを完全合流させるロジックを追加しました！");
    console.log("\n🎊 src/contexts/DataContext.jsx の自動書き換えが完了しました！");
    console.log("ブラウザをリロードして、同じ店舗名の別エリアの口コミが合算されているかご確認ください！");
  } else {
    console.log("❌ getBrandShopIds の置換に失敗しました。対象コードが見つかりません。");
  }

} catch (e) {
  console.error("❌ エラーが発生しました: ", e.message);
}
