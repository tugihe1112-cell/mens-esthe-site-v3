import fs from 'fs';

const filePath = 'src/pages/ShopListPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 詳細エリアフィルターを厳密なマッチングに変更
const oldFilter = `    // 詳細エリアフィルター
    if (selectedCity !== "all") {
      result = result.filter((shop) => {
         // 「渋谷駅周辺」と「渋谷」などの揺らぎを吸収してヒットさせる
         return (shop.city && (shop.city.includes(selectedCity) || selectedCity.includes(shop.city))) ||
                (shop.area && (shop.area.includes(selectedCity) || selectedCity.includes(shop.area)));
      });
    }`;

const newFilter = `    // 詳細エリアフィルター
    if (selectedCity !== "all") {
      result = result.filter((shop) => {
         // エリアを・や、で分割して個別にチェック
         const cityAreas = shop.city ? shop.city.split(/[・、]/).map(s => s.trim()) : [];
         const areaMatch = shop.area === selectedCity || cityAreas.includes(selectedCity);
         
         // 「渋谷駅周辺」と「渋谷」のような部分一致は、複合エリアでない場合のみ
         const isSingleArea = !shop.city?.includes('・') && !shop.city?.includes('、');
         const partialMatch = isSingleArea && (
           (shop.city && (shop.city.includes(selectedCity) || selectedCity.includes(shop.city))) ||
           (shop.area && shop.area.includes(selectedCity))
         );
         
         return areaMatch || partialMatch;
      });
    }`;

content = content.replace(oldFilter, newFilter);
fs.writeFileSync(filePath, content);
console.log('✅ フィルタリングロジックを修正しました');
