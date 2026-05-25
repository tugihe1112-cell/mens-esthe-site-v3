const fs = require('fs');
const path = 'src/pages/ShopListPage.jsx';

try {
  let content = fs.readFileSync(path, 'utf8');

  // =======================================================
  // 修正: handleWardSelect内の「都道府県リセット処理」に条件をつける
  // =======================================================
  // 現在: setSelectedPrefecture("all");
  // 修正: if (ward !== "all") setSelectedPrefecture("all");
  
  // 誤って全解除してしまうコードを探す
  const badLogic = /setSelectedPrefecture\("all"\);\s*\/\/\s*都道府県指定を解除/;
  
  if (badLogic.test(content)) {
    // 条件付きに書き換える
    content = content.replace(badLogic, 'if (ward !== "all") setSelectedPrefecture("all"); // 特定エリア選択時のみ県指定を解除');
    console.log("✅ ロジック修正: 都道府県クリック時に勝手にリセットされないようにしました。");
    
    fs.writeFileSync(path, content, 'utf8');
    console.log("🎉 修正完了！ ブラウザで再確認してください。");
  } else {
    // すでに修正されているか、パターンが違う場合
    // 念のため、改行やスペース違いも考慮して検索
    if (content.includes('if (ward !== "all") setSelectedPrefecture("all")')) {
        console.log("ℹ️ 既に修正済みです。");
    } else {
        console.log("⚠️ 修正箇所が見つかりませんでした。手動確認が必要です。");
        // 強制的に書き換えるパターン（関数定義ごと置換）も検討
    }
  }

} catch (e) {
  console.error("エラー:", e);
}
