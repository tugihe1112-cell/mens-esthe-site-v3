import fs from 'fs';

const filePath = 'src/pages/SearchPage.jsx';

try {
  let content = fs.readFileSync(filePath, 'utf-8');

  // 重複排除ロジックを挿入するターゲット行
  const targetLine = `          const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());`;
  
  // 新しい重複排除ロジック（キャストIDの一意性だけでなく、所属店舗名での重複も防ぐ）
  const replacementLines = `
          // --- 店舗名での重複排除ロジック追加 ---
          // 1. まずキャストIDで一意にする
          const uniqueById = Array.from(new Map(merged.map(item => [item.id, item])).values());
          
          // 2. 店舗名で重複を排除する（同じ名前の店舗のキャストは、既に取得した店舗のものを優先）
          const seenShopNames = new Set();
          const unique = uniqueById.filter(item => {
             const shop = shops.find(s => s.id === item.shop_id);
             if (!shop) return true; // 店舗情報がない場合はそのまま
             
             // 店舗名を正規化（空白除去や小文字化）して比較しやすくする
             const normalizedShopName = (shop.name || '').replace(/\\s+/g, '').toLowerCase();
             
             if (seenShopNames.has(normalizedShopName)) {
                return false; // すでに同じ名前の店舗のキャストを採用している場合は弾く
             } else {
                seenShopNames.add(normalizedShopName);
                return true;
             }
          });
          // ------------------------------------
`;

  if (content.includes(targetLine)) {
    content = content.replace(targetLine, replacementLines);
    console.log("✅ 検索結果に「店舗名ベースの重複排除」ロジックを追加しました！");
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("\n🎊 src/pages/SearchPage.jsx の自動書き換えが完了しました！ブラウザをリロードして『品川』で再度検索してみてください。");
  } else {
    console.log("⚠️ 対象のコードが見つかりませんでした。すでに修正されているか、コードの形が違う可能性があります。");
  }

} catch (e) {
  console.error("❌ エラーが発生しました: ", e.message);
}
