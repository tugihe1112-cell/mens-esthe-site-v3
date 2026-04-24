import fs from 'fs';

const filePath = 'src/pages/SearchPage.jsx';

try {
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. 検索ロジックに area_id を追加するパッチ
  const searchTarget = `            const sCity = (shop.city || '').toLowerCase();\n            return sName.includes(q) || sAddr.includes(q) || sArea.includes(q) || sCity.includes(q);`;
  const searchReplacement = `            const sCity = (shop.city || '').toLowerCase();\n            const sAreaId = (shop.area_id || '').toLowerCase();\n            return sName.includes(q) || sAddr.includes(q) || sArea.includes(q) || sCity.includes(q) || sAreaId.includes(q);`;
  
  if (content.includes(searchTarget)) {
    content = content.replace(searchTarget, searchReplacement);
    console.log("✅ 検索ロジックの修正完了 (area_id を検索対象に追加しました)");
  } else {
    console.log("⚠️ 検索ロジックの対象コードが見つかりませんでした。(既に修正済みか、スペースの違いの可能性があります)");
  }

  // 2. カードのエリア名表示を area_id ベースに切り替えるパッチ
  const displayTarget = `{shop ? (shop.area || shop.city) : ''}`;
  const displayReplacement = `{shop ? ((shop.area_id && debouncedQuery && shop.area_id.includes(debouncedQuery.toLowerCase())) ? debouncedQuery : (shop.area || shop.city)) : ''}`;

  if (content.includes(displayTarget)) {
    content = content.replace(displayTarget, displayReplacement);
    console.log("✅ エリア表示の修正完了 (area_id の情報を優先表示するようにしました)");
  } else {
    console.log("⚠️ エリア表示の対象コードが見つかりませんでした。");
  }

  // ファイルを上書き保存
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log("\n🎊 src/pages/SearchPage.jsx の自動書き換えが完了しました！ブラウザをリロードしてご確認ください。");

} catch (e) {
  console.error("❌ エラーが発生しました: ", e.message);
}
