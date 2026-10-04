/** Search results contain brands; a review target must be an actual shop. */
export function unlistedReviewDestination({
  matchingBrands = [], shopById = {}, selectedShopId = '', shopInput = '', shopQuery = '',
} = {}) {
  const params = new URLSearchParams();
  // Debounced results still belong to the previous query while typing.
  if (shopInput === shopQuery && shopQuery.trim()) {
    const shopIds = [...new Set(matchingBrands.flatMap(brand => brand.shopIds || []))];
    const selectedShop = shopById?.[selectedShopId];
    const currentSelection = selectedShop?.id === selectedShopId
      && selectedShop.name === shopInput && shopIds.includes(selectedShopId);
    if (currentSelection) {
      params.set('shopId', selectedShopId);
    } else if (shopIds.length === 1 && shopById?.[shopIds[0]]?.id === shopIds[0]) {
      params.set('shopId', shopIds[0]);
    }
  }
  params.set('customMode', 'true');
  return `/post-review?${params.toString()}`;
}
