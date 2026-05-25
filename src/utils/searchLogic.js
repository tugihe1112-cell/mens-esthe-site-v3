/**
 * 検索ロジック: ハイブリッド・グルーピング方式（複数キーワードAND検索対応）
 * @param {Array} shops - 全店舗データ
 * @param {string} query - 検索クエリ
 * @returns {Object} 結果オブジェクト
 */

// 都道府県名セット（短縮形・フル形の両方）
// 「宮城」で検索したとき「竜宮城」がヒットしないよう、
// 都道府県名は prefecture フィールドのみに対してマッチングする
const PREFECTURE_NAMES = new Set([
  '北海道',
  '青森', '青森県', '岩手', '岩手県', '宮城', '宮城県', '秋田', '秋田県',
  '山形', '山形県', '福島', '福島県',
  '茨城', '茨城県', '栃木', '栃木県', '群馬', '群馬県', '埼玉', '埼玉県',
  '千葉', '千葉県', '東京', '東京都', '神奈川', '神奈川県',
  '新潟', '新潟県', '富山', '富山県', '石川', '石川県', '福井', '福井県',
  '山梨', '山梨県', '長野', '長野県', '岐阜', '岐阜県', '静岡', '静岡県',
  '愛知', '愛知県', '三重', '三重県',
  '滋賀', '滋賀県', '京都', '京都府', '大阪', '大阪府', '兵庫', '兵庫県',
  '奈良', '奈良県', '和歌山', '和歌山県',
  '鳥取', '鳥取県', '島根', '島根県', '岡山', '岡山県', '広島', '広島県',
  '山口', '山口県',
  '徳島', '徳島県', '香川', '香川県', '愛媛', '愛媛県', '高知', '高知県',
  '福岡', '福岡県', '佐賀', '佐賀県', '長崎', '長崎県', '熊本', '熊本県',
  '大分', '大分県', '宮崎', '宮崎県', '鹿児島', '鹿児島県', '沖縄', '沖縄県',
]);

export const performSearch = (shops, query) => {
  // 1. クエリが空の場合
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return { type: 'all', data: shops, summary: null };
  }

  // クエリを小文字化し、全角スペースを半角スペースに変換後、スペースで分割して配列にする
  const searchTerms = query.toLowerCase().replace(/　/g, ' ').split(/\s+/).filter(term => term.length > 0);

  // 2. フィルタリング実行 (AND検索)
  const matchedShops = shops.filter(shop => {
    if (!shop) return false;
    
    // 安全に文字列化するヘルパー
    const safeStr = (val) => (val ? String(val).toLowerCase() : '');

    const name = safeStr(shop.name);
    const brand = safeStr(shop.brandId);
    const area = safeStr(shop.area);
    const pref = safeStr(shop.prefecture);
    const city = safeStr(shop.city);
    
    // タグ検索用
    const tags = Array.isArray(shop.tags) ? shop.tags.map(t => safeStr(t)) : [];

    // 入力されたすべてのキーワード(term)が、店舗の持つ情報のいずれかに含まれているかチェックする
    return searchTerms.every(term => {
      // 都道府県名での検索は prefecture フィールドのみ判定
      // 例: 「宮城」→「竜宮城」の店名にマッチさせない
      if (PREFECTURE_NAMES.has(term)) {
        return pref.includes(term);
      }

      // city（市区町村）は完全一致のみ
      // 例: 「新宿」で検索したとき city="新宿区" にマッチさせない
      // 「新宿区」と入力した場合のみ city にマッチする
      const cityMatch = city === term;

      const tagMatch = tags.some(t => t.includes(term));
      return name.includes(term) ||
             brand.includes(term) ||
             area.includes(term) ||
             pref.includes(term) ||
             cityMatch ||
             tagMatch;
    });
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
        representativeImage: representativeShop.image_url || representativeShop.image
      }
    };
  }

  return { type: 'shop', data: matchedShops, summary: null };
};
