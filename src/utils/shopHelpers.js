export const getGroupKey = (shop) => {
  return shop?.group_id || shop?.id;
};

/**
 * 表示用の店舗名を返す
 *
 * 【なぜ支店名を消すのか（2026-09-14 オーナー確認）】
 * 「アロマモア渋谷店」ではなく「アロマモア」でいい。
 * **その店舗の「渋谷店」に価値はない。地名が名前に入っているのは検索で引っかかるためだけ。**
 * 利用者が読みたいのは「アロマモアというブランドと、そこにいるセラピスト」の口コミ。
 * 咲さんは渋谷店だろうが代々木店だろうが、その店舗への所属ではなくブランドに紐づく。
 * ⚠️ **DBの name は変えない。** 検索はDBの元の名前で行うので検索精度には影響しない。
 *
 * 除去対象:
 *   - スペース区切りの末尾サフィックス: "新宿店" "人形町店" "新宿ルーム" 等
 *   - 括弧付きサフィックス: "（新宿店）" "(新宿ルーム)" 等
 *   - `shop` を渡した場合のみ: **その店自身の市区・エリア名と一致する**末尾の地名
 *     （例: "Pepe Spa (ペペスパ) 下北沢" → cityが下北沢なら "Pepe Spa (ペペスパ)"）
 *
 * ⚠️ 末尾の1語を無条件に外してはいけない。ブランド名の一部を削る
 *    （"美・セラ極～KIWAMI～" や "トキョプラ 旧T+Plus (ティープラス) 新宿" のような名前がある）。
 *    **必ずその店自身の所在地と照合してから**外す。
 *
 * @param name 店舗名（DBの値）
 * @param shop 任意。渡すとその店の市区・エリア名に一致する地名も外す
 */
const trimPlaceWord = (v) => String(v ?? '').trim().replace(/(都|道|府|県|市|区|町|村)$/u, '');

/** その店自身の所在地として名乗っている語（2文字以上）。ここに無い語は外さない。 */
const ownPlaceWords = (shop) => {
  const raw = shop?.raw_data || {};
  const out = new Set();
  const push = (v) => {
    for (const one of Array.isArray(v) ? v : [v]) {
      const t = String(one ?? '').trim();
      if (t.length >= 2) out.add(t);
      const trimmed = trimPlaceWord(one);
      if (trimmed.length >= 2) out.add(trimmed);
    }
  };
  push(shop?.prefecture ?? raw.prefecture);
  push(shop?.city ?? raw.city);
  push(shop?.area ?? raw.area);
  return out;
};

export const getDisplayName = (name, shop = null) => {
  if (!name) return name;
  let out = name
    // 括弧付き: （新宿ルーム）(新宿店) 等
    .replace(/[\s　]*[（(][^）)]*(?:店|ルーム)[）)]/gu, '')
    // スペース区切りの末尾: "〇〇店" or "〇〇ルーム"
    .replace(/[\s　]+\S+(?:店|ルーム)$/u, '')
    .trim();
  if (!shop) return out;

  const places = ownPlaceWords(shop);
  if (places.size === 0) return out;
  // 末尾の括弧: "CREST SPA TOKYO (吉祥寺)" — 中身がこの店の地名のときだけ外す
  const paren = out.match(/^(.*?)[\s　]*[（(]([^）)]+)[）)]$/u);
  if (paren && places.has(paren[2].trim())) out = paren[1].trim();
  // 末尾のスペース区切り: "Pepe Spa (ペペスパ) 下北沢"
  const bare = out.match(/^(.*\S)[\s　]+([^\s　]+)$/u);
  if (bare && places.has(bare[2].trim())) out = bare[1].trim();
  return out.trim();
};
