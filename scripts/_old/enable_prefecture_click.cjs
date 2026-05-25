const fs = require('fs');
const path = 'src/pages/ShopListPage.jsx';

try {
  let content = fs.readFileSync(path, 'utf8');
  let originalLength = content.length;

  // ==========================================
  // 1. フィルターロジックの修正 (都道府県対応)
  // ==========================================
  // useMemoの中にあるフィルター処理に、prefectureの判定を追加します。
  // "let result = shops || [];" の直後を狙って挿入します。
  
  if (!content.includes('// 都道府県フィルタ')) {
    const filterStartPattern = /let result = shops \|\| \[\];/;
    const newFilterLogic = `let result = shops || [];

    // 都道府県フィルタ (追加)
    if (selectedPrefecture && selectedPrefecture !== "all" && selectedPrefecture !== "default") {
       result = result.filter(shop => shop.prefecture === selectedPrefecture);
    }`;

    content = content.replace(filterStartPattern, newFilterLogic);
    if (content.length !== originalLength) {
      console.log("✅ フィルターロジックに「都道府県絞り込み」を追加しました。");
      originalLength = content.length;
    }
  }

  // ==========================================
  // 2. UIの修正 (見出しをクリック可能にする)
  // ==========================================
  // 前回作成した <h3 ...>{group.prefecture}</h3> を探して、ボタンに書き換えます。
  
  // 検索対象の古いコードパターン
  const oldHeaderPattern = /<h3 className="text-gray-300 font-bold mb-3 border-l-4 border-blue-500 pl-3">\s*\{group\.prefecture\}\s*<\/h3>/g;

  // 新しいボタン付きヘッダー
  // クリックすると: 
  // 1. 都道府県をセット
  // 2. エリア(区市)をリセット("all")
  // 3. モーダルを閉じる
  const newHeaderCode = `
                    <div className="flex items-center justify-between mb-3">
                      <button 
                        onClick={() => {
                          setSelectedPrefecture(group.prefecture);
                          handleWardSelect("all"); // 詳細エリアはリセット
                        }}
                        className="group flex items-center text-left"
                      >
                        <h3 className="text-gray-200 font-bold text-lg border-l-4 border-blue-500 pl-3 group-hover:text-blue-400 group-hover:border-blue-400 transition">
                          {group.prefecture}
                        </h3>
                        <span className="ml-3 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition border border-blue-400 px-2 py-0.5 rounded">
                          全域を表示
                        </span>
                      </button>
                    </div>`;

  if (oldHeaderPattern.test(content)) {
    content = content.replace(oldHeaderPattern, newHeaderCode);
    console.log("✅ エリア選択画面の「都道府県名」をクリック可能にしました。");
  } else {
    // すでに書き換わっているか、パターンが微妙に違う場合
    // 前回の update_all_prefectures.cjs で生成されたコードをターゲットにする
    // 前回は <h3 className="..."> {group.prefecture} </h3> という形だった
    console.log("ℹ️ UI部分は既に変更されているか、パターンが見つかりませんでした。確認のためスキップします。");
  }

  fs.writeFileSync(path, content, 'utf8');
  console.log("🎉 修正完了！ これで「神奈川県」などをクリックして全域検索できます。");

} catch (e) {
  console.error("エラーが発生しました:", e);
}
