const fs = require('fs');

try {
  const shops = JSON.parse(fs.readFileSync('public/data/shops.json', 'utf8'));

  // "doigt de fee" にヒットする店舗を抽出
  const query = "doigt de fee";
  const matched = shops.filter(s => 
    (s.name && s.name.toLowerCase().includes(query)) || 
    (s.brandId && s.brandId.toLowerCase().includes(query))
  );

  console.log(`🔎 "${query}" の検索結果内訳 (全${matched.length}件):`);
  console.log("---------------------------------------------------");
  console.log("group_id         | 店舗名 (ID)");
  console.log("---------------------------------------------------");

  matched.forEach(s => {
    // 見やすく整形して出力
    const gid = s.group_id.padEnd(16, ' ');
    console.log(`${gid} | ${s.name} (${s.id})`);
  });

  console.log("---------------------------------------------------");

} catch (e) {
  console.error(e);
}
