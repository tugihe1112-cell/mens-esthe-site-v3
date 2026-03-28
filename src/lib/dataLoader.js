import { buildShopView } from '../utils/shopViewBuilder';
import therapistsMaster from '../data/therapists.json';
import allShopsData from '../data/all_shops.json'; 

/**
 * 店舗データを取得し、セラピスト情報を復元して返す
 */
export const loadShop = (shopId) => {
  let shop;
  // 配列かオブジェクトかに対応
  if (Array.isArray(allShopsData)) {
    shop = allShopsData.find(s => s.id === shopId);
  } else {
    shop = allShopsData[shopId];
  }

  if (!shop) return null;

  // ID → 詳細情報へ復元
  return buildShopView(shop, therapistsMaster);
};

/**
 * 全店舗リストを取得する
 */
export const loadAllShops = () => {
  const shops = Array.isArray(allShopsData) ? allShopsData : Object.values(allShopsData);
  return shops.map(shop => buildShopView(shop, therapistsMaster));
};
