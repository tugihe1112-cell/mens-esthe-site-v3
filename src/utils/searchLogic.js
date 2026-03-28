/**
 * 検索ロジック: ハイブリッド・グルーピング方式
 * * @param {Array} shops - 全店舗データ
 * @param {string} query - 検索クエリ
 * @returns {Object} 結果オブジェクト
 */
export const performSearch = (shops, query) => {
  // 1. クエリが空の場合
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return { type: 'all', data: shops, summary: null };
  }

  const normalizedQuery = query.toLowerCase().trim();

  // 2. フィルタリング実行
  const matchedShops = shops.filter(shop => {
    if (!shop) return false;
    
    // 安全に文字列化するヘルパー
    const safeStr = (val) => (val ? String(val).toLowerCase() : '');

    const name = safeStr(shop.name);
    const brand = safeStr(shop.brandId);
    const area = safeStr(shop.area);
    const pref = safeStr(shop.prefecture);
    const city = safeStr(shop.city);
    
    // タグ検索
    const tags = Array.isArray(shop.tags) ? shop.tags.map(t => safeStr(t)) : [];
    const tagMatch = tags.some(t => t.includes(normalizedQuery));

    return name.includes(normalizedQuery) || 
           brand.includes(normalizedQuery) || 
           area.includes(normalizedQuery) ||
           pref.includes(normalizedQuery) ||
           city.includes(normalizedQuery) ||
           tagMatch;
  });

  if (matchedShops.length === 0) {
    return { type: 'empty', data: [], summary: null };
  }

  // 3. グループ分析 (ブランドモード判定)
  const totalHits = matchedShops.length;

  if (totalHits === 1) {
    return { type: 'shop', data: matchedShops, summary: null };
  }

  // group_id ごとのヒット数を集計
  const groupCounts = matchedShops.reduce((acc, shop) => {
    if (shop.group_id) {
      acc[shop.group_id] = (acc[shop.group_id] || 0) + 1;
    }
    return acc;
  }, {});

  // 最もヒット数が多いグループを探す
  let dominantGroupId = null;
  let maxCount = 0;

  Object.entries(groupCounts).forEach(([gid, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantGroupId = gid;
    }
  });

  // 【判定基準】80%以上が同一グループならブランドモード
  const dominanceRate = maxCount / totalHits;
  const isBrandMode = dominanceRate >= 0.8;

  if (isBrandMode && dominantGroupId) {
    const groupShops = matchedShops.filter(s => s.group_id === dominantGroupId);
    const representativeShop = groupShops[0];
    
    // セラピスト総数の概算
    const totalTherapists = groupShops.reduce((sum, s) => {
        return sum + (s.therapists ? s.therapists.length : 0);
    }, 0);

    return {
      type: 'brand',
      data: matchedShops,
      summary: {
        groupId: dominantGroupId,
        brandName: representativeShop.brandId || representativeShop.name.split(' ')[0],
        shopCount: groupShops.length,
        therapistCount: totalTherapists,
        representativeImage: representativeShop.image
      }
    };
  }

  return { type: 'shop', data: matchedShops, summary: null };
};
