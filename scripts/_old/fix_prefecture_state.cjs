const fs = require('fs');
const path = 'src/pages/ShopListPage.jsx';

try {
  let content = fs.readFileSync(path, 'utf8');
  
  // ----------------------------------------------------
  // 1. useStateの定義を追加 (変数を作る)
  // ----------------------------------------------------
  if (!content.includes('const [selectedPrefecture, setSelectedPrefecture]')) {
    // 既存の useState を探して、その直後に挿入する
    // 例: const [selectedWard, setSelectedWard] = useState("all");
    const statePattern = /const\s+\[.*\]\s*=\s*useState\(.*\);/;
    
    if (statePattern.test(content)) {
      // 最初のuseStateを見つけて、その行の後ろに改行して挿入
      content = content.replace(statePattern, (match) => {
        return `${match}\n  const [selectedPrefecture, setSelectedPrefecture] = useState("all");`;
      });
      console.log("✅ 変数定義 (selectedPrefecture) を追加しました。");
    } else {
      console.log("⚠️ useStateが見つかりませんでした。手動確認が必要です。");
    }
  }

  // ----------------------------------------------------
  // 2. 他のエリアボタンを押したら都道府県解除する (競合防止)
  // ----------------------------------------------------
  // handleWardSelect関数の中で、setSelectedPrefecture("all") を呼ぶようにする
  if (content.includes('const handleWardSelect =')) {
    if (!content.includes('setSelectedPrefecture("all")')) {
      // 関数の開始 { の直後に挿入
      content = content.replace(
        /(const handleWardSelect = .*?=>\s*\{)/,
        '$1\n    setSelectedPrefecture("all"); // 都道府県指定を解除'
      );
      console.log("✅ エリア選択時に都道府県絞り込みをリセットする処理を追加しました。");
    }
  }

  fs.writeFileSync(path, content, 'utf8');
  console.log("🎉 修復完了！ ブラウザをリロードして確認してください。");

} catch (e) {
  console.error("エラーが発生しました:", e);
}
