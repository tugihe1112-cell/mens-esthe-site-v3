const fs = require('fs');
const path = 'src/pages/ShopListPage.jsx';

try {
  let content = fs.readFileSync(path, 'utf8');

  // =======================================================
  // 1. 詳細エリア(availableCities)の生成ロジックを改良
  // =======================================================
  // 現状: const availableCities = useMemo(...) で selectedWard に連動しているはず
  // 修正: selectedWard が "all" の場合は、selectedPrefecture に連動して市町村リストを出す
  
  // 既存の availableCities 定義を探す
  const memoPattern = /const availableCities = useMemo\(\(\) => \{[\s\S]*?\}, \[.*?\]\);/;
  
  const newMemoLogic = `const availableCities = useMemo(() => {
    if (!shops) return [];
    
    // 1. 具体的なエリア(区市)が選ばれている場合 -> その中の詳細地名(area)を出す
    if (selectedWard !== "all") {
      const targetShops = shops.filter(s => 
        (s.city === selectedWard) || 
        (s.area === selectedWard) || 
        (s.prefecture === selectedWard) // データ揺れ対応
      );
      // areaデータを抽出
      const areas = new Set();
      targetShops.forEach(shop => {
        if (shop.area && shop.area !== selectedWard) {
          // 配列の場合と文字列の場合に対応
          if (Array.isArray(shop.area)) {
             shop.area.forEach(a => areas.add(a));
          } else {
             areas.add(shop.area);
          }
        }
      });
      return Array.from(areas).filter(Boolean).sort();
    }

    // 2. 都道府県だけ選ばれている場合 -> その県内の「市・区」を出す
    if (selectedPrefecture !== "all") {
       const prefShops = shops.filter(s => s.prefecture === selectedPrefecture);
       const cities = new Set();
       prefShops.forEach(shop => {
         // cityがあればcity, なければareaを使う
         if (shop.city) cities.add(shop.city);
         else if (shop.area && !Array.isArray(shop.area)) cities.add(shop.area);
       });
       return Array.from(cities).filter(Boolean).sort();
    }

    return [];
  }, [shops, selectedWard, selectedPrefecture]);`;

  if (memoPattern.test(content)) {
    content = content.replace(memoPattern, newMemoLogic);
    console.log("✅ 詳細エリアの生成ロジックを「都道府県→市・区」対応に更新しました。");
  } else {
    console.log("⚠️ availableCitiesの定義が見つかりませんでした。手動確認が必要です。");
  }

  // =======================================================
  // 2. 表示条件の緩和 (区が未選択でも表示するようにする)
  // =======================================================
  // 修正前: {selectedWard !== "all" && availableCities.length > 0 && (
  // 修正後: {(selectedWard !== "all" || selectedPrefecture !== "all") && availableCities.length > 0 && (
  
  const conditionPattern = /\{selectedWard !== "all" && availableCities\.length > 0 && \(/;
  const newCondition = `{(selectedWard !== "all" || selectedPrefecture !== "all") && availableCities.length > 0 && (`;
  
  if (conditionPattern.test(content)) {
    content = content.replace(conditionPattern, newCondition);
    console.log("✅ 詳細エリアの表示条件を緩和しました。");
  } else {
    // すでに変わっている可能性もあるので確認
    if (content.includes('selectedPrefecture !== "all") && availableCities.length')) {
        console.log("ℹ️ 表示条件は既に更新されています。");
    } else {
        console.log("⚠️ 表示条件の箇所が見つかりませんでした。");
    }
  }

  // =======================================================
  // 3. 詳細エリアボタンをクリックした時の挙動
  // =======================================================
  // これまでは setSelectedCity(city) だったが、
  // 都道府県モードの時は「市(Ward)」を選ばせたいので setSelectedWard(city) に切り替える必要がある
  
  // ボタンのonClickを探す
  // onClick={() => setSelectedCity(city)}  <-- これを変えたい
  // ただし、もし selectedWard === "all" なら handleWardSelect(city) を呼ぶべき
  
  const clickPattern = /onClick=\{\(\) => setSelectedCity\(city\)\}/g;
  const newClickLogic = `onClick={() => {
                              if (selectedWard === "all") {
                                handleWardSelect(city); // 市・区を選択状態にする
                              } else {
                                setSelectedCity(city);  // 詳細地名を選択状態にする
                              }
                           }}`;
                           
  if (clickPattern.test(content)) {
    content = content.replace(clickPattern, newClickLogic);
    console.log("✅ ボタンクリック時の挙動を修正しました（市選択と詳細選択の自動切替）。");
  }
  
  // ついでに「詳細エリアを絞り込む:」という文言も、状況に合わせて変えたいが、
  // まずは機能優先で。

  fs.writeFileSync(path, content, 'utf8');
  console.log("🎉 修正完了！ これで大阪などを選ぶと、その下のエリア選択肢が表示されます。");

} catch (e) {
  console.error("エラー:", e);
}
