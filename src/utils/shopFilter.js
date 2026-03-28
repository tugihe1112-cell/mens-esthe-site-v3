/**
 * 店舗リストの重複排除ロジック
 * @param {Array} shops - 全店舗データ
 * @param {String} selectedArea - 現在選択中のエリア（nullなら都道府県表示）
 * @returns {Array} 表示すべき店舗リスト
 */
export const getUniqueShops = (shops, selectedArea) => {
  // 詳細エリアが指定されている場合は、そのまま全て表示
  if (selectedArea) {
    return shops;
  }

  // エリア指定がない（都道府県のみ）場合は、店名で重複排除
  const seenNames = new Set();
  return shops.filter(shop => {
    const name = shop.name.trim();
    if (seenNames.has(name)) {
      return false; 
    }
    seenNames.add(name);
    return true;
  });
};
