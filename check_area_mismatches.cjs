const fs = require('fs');
const paths = ['src/data/all_shops.json', 'src/data/shops.json', 'public/data/shops.json'];
let shops = [];
for (const p of paths) {
  if (fs.existsSync(p)) {
    try {
      shops = JSON.parse(fs.readFileSync(p, 'utf8'));
      break;
    } catch(e) {}
  }
}

// 調査ルール: 「このエリアタグは、本来この市区町村にあるべき」
const RULES = [
  { tag: "六本木", shouldBeIn: ["港区"] },
  { tag: "歌舞伎町", shouldBeIn: ["新宿区"] },
  { tag: "新宿", shouldBeIn: ["新宿区", "渋谷区"] }, // 境界微妙なため
  { tag: "池袋", shouldBeIn: ["豊島区"] },
  { tag: "渋谷", shouldBeIn: ["渋谷区"] },
  { tag: "銀座", shouldBeIn: ["中央区"] },
  { tag: "秋葉原", shouldBeIn: ["千代田区", "台東区"] },
  { tag: "錦糸町", shouldBeIn: ["墨田区"] },
  { tag: "五反田", shouldBeIn: ["品川区"] },
  { tag: "恵比寿", shouldBeIn: ["渋谷区", "目黒区"] }
];

console.log("🔍 「エリアタグの紛れ込み」を徹底調査します...\n");

RULES.forEach(rule => {
  // そのタグを持っていて、かつ「あるべき市区町村」に含まれない店舗を探す
  const mismatches = shops.filter(s => {
    const areas = Array.isArray(s.area) ? s.area : (s.area ? [s.area] : []);
    const hasTag = areas.some(a => a === rule.tag); // 完全一致でチェック
    
    // cityが「あるべき場所」に含まれていない、かつ city自体はある
    return hasTag && s.city && !rule.shouldBeIn.includes(s.city);
  });

  if (mismatches.length > 0) {
    console.log(`⚠️ 「${rule.tag}」タグが、無関係な場所に紛れています (${mismatches.length}件):`);
    
    // どこに紛れているか集計
    const distribution = {};
    mismatches.forEach(s => {
      distribution[s.city] = (distribution[s.city] || 0) + 1;
    });

    Object.keys(distribution).forEach(city => {
      console.log(`   📍 ${city}: ${distribution[city]}件`);
      // 具体的な店舗名
      const examples = mismatches.filter(s => s.city === city).map(s => s.name).slice(0, 2);
      console.log(`      例: ${examples.join(", ")}...`);
    });
    console.log("---------------------------------------------------");
  }
});
