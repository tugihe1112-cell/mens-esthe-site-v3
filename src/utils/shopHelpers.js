export const getGroupKey = (shop) => {
  return shop?.group_id || shop?.id;
};

/**
 * 表示用の店舗名を返す
 * DBの name（例: "Lynx 新宿店"）から末尾の店舗サフィックスを除去して表示名にする
 * 検索はDBの元の名前で行うため、検索精度には影響しない
 *
 * 除去対象:
 *   - スペース区切りの末尾サフィックス: "新宿店" "人形町店" "新宿ルーム" 等
 *   - 括弧付きサフィックス: "（新宿店）" "(新宿ルーム)" 等
 */
export const getDisplayName = (name) => {
  if (!name) return name;
  return name
    // 括弧付き: （新宿ルーム）(新宿店) 等
    .replace(/[\s　]*[（(][^）)]*(?:店|ルーム)[）)]/gu, '')
    // スペース区切りの末尾: "〇〇店" or "〇〇ルーム"
    .replace(/[\s　]+\S+(?:店|ルーム)$/u, '')
    .trim();
};
