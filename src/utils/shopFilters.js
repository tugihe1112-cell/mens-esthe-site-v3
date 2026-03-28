/**
 * 店舗が指定された都道府県に該当するかチェック
 * @param {Object} shop - 店舗オブジェクト
 * @param {string} prefecture - チェックする都道府県
 * @returns {boolean}
 */
export const matchesPrefecture = (shop, prefecture) => {
  if (!shop.prefecture) return false;
  
  if (Array.isArray(shop.prefecture)) {
    return shop.prefecture.includes(prefecture);
  }
  
  return shop.prefecture === prefecture;
};

/**
 * 店舗が指定された都道府県と市区町村に該当するかチェック
 * @param {Object} shop - 店舗オブジェクト
 * @param {string} prefecture - チェックする都道府県
 * @param {string} city - チェックする市区町村
 * @returns {boolean}
 */
export const matchesPrefectureAndCity = (shop, prefecture, city) => {
    if (!matchesPrefecture(shop, prefecture)) return false;
  if (Array.isArray(shop.city)) {
    return shop.city.includes(city);
  }
  return shop.city === city;
};
