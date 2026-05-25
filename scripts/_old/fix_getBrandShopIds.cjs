const fs = require('fs');
const path = 'src/contexts/DataContext.jsx';
const code = fs.readFileSync(path, 'utf8');
fs.copyFileSync(path, path + '.bak_' + Date.now());

const oldFn = `  const getBrandShopIds = useCallback((shopId) => {
    // 現在の店舗データを取得
    const currentShop = shops.find(s => s.id === shopId);
    if (!currentShop) return [shopId];
    // 店舗名を正規化（空白除去・小文字化）
    const normalizedName = (currentShop.name || '').replace(/[\\s　]+/g, '').toLowerCase();
    // 同じ名前を持つすべての店舗のIDを配列にして返す
    const relatedIds = shops
      .filter(s => (s.name || '').replace(/[\\s　]+/g, '').toLowerCase() === normalizedName)
      .map(s => s.id);
    // 念のため、見つからなかった場合は元のIDだけは返す
    return relatedIds.length > 0 ? relatedIds : [shopId];
  }, [shops]);`;

const newFn = `  const getBrandShopIds = useCallback((shopId) => {
    const currentShop = shops.find(s => s.id === shopId);
    if (!currentShop) return [shopId];
    // group_id で束ねる（同ブランド全店舗のレビューを吸収）
    if (currentShop.group_id) {
      const relatedIds = shops
        .filter(s => s.group_id === currentShop.group_id)
        .map(s => s.id);
      return relatedIds.length > 0 ? relatedIds : [shopId];
    }
    // group_idがない場合はbrandIdで束ねる
    if (currentShop.brandId) {
      const relatedIds = shops
        .filter(s => s.brandId === currentShop.brandId)
        .map(s => s.id);
      return relatedIds.length > 0 ? relatedIds : [shopId];
    }
    return [shopId];
  }, [shops]);`;

if (code.includes('const getBrandShopIds = useCallback((shopId) => {')) {
  const fixed = code.replace(oldFn, newFn);
  if (fixed === code) {
    // 完全一致しない場合はシンプルに関数全体を置換
    const result = code.replace(
      /const getBrandShopIds = useCallback\(\(shopId\) => \{[\s\S]*?\}, \[shops\]\);/,
      newFn
    );
    fs.writeFileSync(path, result, 'utf8');
  } else {
    fs.writeFileSync(path, fixed, 'utf8');
  }
  console.log('✅ getBrandShopIds を group_id ベースに修正しました');
} else {
  console.log('❌ 対象関数が見つかりません');
}
