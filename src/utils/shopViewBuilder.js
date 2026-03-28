/**
 * shopViewBuilder.js
 * 店舗データの「IDリスト」を、マスターデータを参照して「詳細情報のリスト」に復元する。
 */
export const buildShopView = (shop, masterTherapists) => {
  if (!shop || !shop.therapists || !Array.isArray(shop.therapists)) {
    return shop;
  }

  // 旧データ（オブジェクト）ならそのまま返す
  if (shop.therapists.length > 0 && typeof shop.therapists[0] === 'object') {
    return shop;
  }

  // IDリストなら復元
  const hydratedTherapists = shop.therapists
    .map(id => {
      // マスターデータがMap形式かオブジェクト形式かに応じて取得
      const therapist = masterTherapists[id]; 
      return therapist;
    })
    .filter(Boolean);

  return {
    ...shop,
    therapists: hydratedTherapists
  };
};
