// src/utils/searchUtils.js

/**
 * 店舗リストをフィルタリングする
 */
export const filterShops = (shops, filters) => {
  let filtered = [...shops];

  // キーワード検索
  if (filters.keyword && filters.keyword.trim()) {
    const keyword = filters.keyword.toLowerCase().trim();
    filtered = filtered.filter(shop => 
      shop.name.toLowerCase().includes(keyword) ||
      (Array.isArray(shop.area) ? shop.area.some(a => a?.toLowerCase().includes(keyword)) : shop.area?.toLowerCase().includes(keyword)) || shop.city?.toLowerCase().includes(keyword) ||
      shop.description?.toLowerCase().includes(keyword)
    );
  }

  // 地域フィルター
  if (filters.area && filters.area !== 'all') {
    filtered = filtered.filter(shop => shop.area === filters.area || shop.city === filters.area);
  }

  // タグフィルター（複数選択可能）
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(shop => 
      filters.tags.some(tag => shop.tags?.includes(tag))
    );
  }

  // 価格帯フィルター
  if (filters.priceRange && filters.priceRange !== 'all') {
    filtered = filtered.filter(shop => {
      const price = parseInt(shop.price);
      switch (filters.priceRange) {
        case 'low': return price < 10000;
        case 'medium': return price >= 10000 && price < 20000;
        case 'high': return price >= 20000;
        default: return true;
      }
    });
  }

  // 評価フィルター
  if (filters.minRating) {
    filtered = filtered.filter(shop => shop.rating >= filters.minRating);
  }

  return filtered;
};

/**
 * 店舗リストをソートする
 */
export const sortShops = (shops, sortBy) => {
  const sorted = [...shops];

  switch (sortBy) {
    case 'rating-desc':
      return sorted.sort((a, b) => b.rating - a.rating);
    
    case 'rating-asc':
      return sorted.sort((a, b) => a.rating - b.rating);
    
    case 'price-desc':
      return sorted.sort((a, b) => parseInt(b.price) - parseInt(a.price));
    
    case 'price-asc':
      return sorted.sort((a, b) => parseInt(a.price) - parseInt(b.price));
    
    case 'reviews-desc':
      return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
    
    case 'newest':
      return sorted.sort((a, b) => b.id - a.id);
    
    default:
      return sorted;
  }
};

/**
 * セラピストリストをフィルタリングする
 */
export const filterTherapists = (therapists, filters) => {
  let filtered = [...therapists];

  // キーワード検索
  if (filters.keyword && filters.keyword.trim()) {
    const keyword = filters.keyword.toLowerCase().trim();
    filtered = filtered.filter(therapist => 
      therapist.name.toLowerCase().includes(keyword) ||
      therapist.description?.toLowerCase().includes(keyword)
    );
  }

  // タグフィルター
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(therapist => 
      filters.tags.some(tag => therapist.tags?.includes(tag))
    );
  }

  // 評価フィルター
  if (filters.minRating) {
    filtered = filtered.filter(therapist => therapist.rating >= filters.minRating);
  }

  return filtered;
};

/**
 * 利用可能な地域リストを取得
 */
export const getAvailableAreas = (shops) => {
  const areas = [...new Set(shops.flatMap(shop => [shop.area, shop.city].filter(Boolean)))];
  return areas.sort();
};

/**
 * 利用可能なタグリストを取得
 */
export const getAvailableTags = (items) => {
  const allTags = items.flatMap(item => item.tags || []);
  const uniqueTags = [...new Set(allTags)];
  return uniqueTags.sort();
};

/**
 * フィルター状態が空かチェック
 */
export const isFilterEmpty = (filters) => {
  return (
    (!filters.keyword || filters.keyword.trim() === '') &&
    (!filters.area || filters.area === 'all') &&
    (!filters.tags || filters.tags.length === 0) &&
    (!filters.priceRange || filters.priceRange === 'all') &&
    !filters.minRating
  );
};