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

  // 区切りなしで地名がくっついている形（2026-09-14 オーナー確認）
  //   "Aroma ELLA武蔵小杉" / "doigt de fee (ドゥワドフェ)溝の口" / "エステ美人マダム武蔵小杉"
  // 日本語は語の区切りが無いので、スペースや括弧を頼りにできない。
  //
  // 🚩 **末尾だけ**外す。先頭は区切りがあるときだけ（下）。
  //    区切り無しで先頭も外すと「東京アロマ」(東京都の店)が「アロマ」になる＝
  //    地名で始まる正式なブランド名を削ってしまう（自前のテストで実際に出た）。
  //    末尾に地名が付く形は支店表記なので、こちらは削ってよい。
  // ⚠️ 外してよいのは**その店舗自身の**都道府県・市区・エリアと一致した部分だけ。
  // ⚠️ 長い地名から先に試す（"武蔵小杉" より先に "小杉" を外すと "武蔵" が残る）。
  // ⚠️ 残りが2文字未満になる削り方はしない＝店名が地名そのものの店を空にしない。
  const ordered = [...places].sort((a, b) => b.length - a.length);
  const MIN_KEEP = 2;
  for (let pass = 0; pass < 2; pass += 1) {
    const place = ordered.find(
      (p) => out.endsWith(p) && out.length - p.length >= MIN_KEEP,
    );
    if (!place) break;
    out = out.slice(0, -place.length).replace(/[\s　・|/-]+$/u, '').trim();
  }

  // 括弧の**中**で読み仮名に地名が溶けている形: "Aroma Lunabelle (アロマルナベール秋葉原)"
  // 括弧ごと外すと読み仮名まで消え、空白で切ることもできない（区切りが無い）。
  // → 括弧の中身の**末尾**がこの店の地名なら、その部分だけ抜いて括弧は残す。
  // ⚠️ 中身が地名そのもののとき（"(吉祥寺)"）は上の paren で既に括弧ごと外れている。
  // ⚠️ カタカナの読みと地名は文字種が違うので、"(トウキョウ)" が "東京" に一致することはない。
  //    一致するのは「読み仮名＋漢字の地名」が連結された実データの形だけ。
  const inner = out.match(/^(.*?)[\s　]*[（(]([^）)]+)[）)]$/u);
  if (inner) {
    const head = inner[1].trim();
    const body = inner[2].trim();
    const hit = ordered.find((p) => body.endsWith(p) && body.length - p.length >= MIN_KEEP);
    if (hit) {
      const kept = body.slice(0, -hit.length).replace(/[\s　・|/-]+$/u, '').trim();
      out = head ? `${head} (${kept})` : kept;
    }
  }

  // 先頭の地名は**区切りがあるときだけ**外す: "武蔵小杉 ROYCE (ロイス)"
  // 区切りが在ること自体が「ここまでが地名」という書き手の合図なので、誤削除になりにくい。
  const lead = out.match(/^([^\s　]+)[\s　]+(.*\S)$/u);
  if (lead && places.has(lead[1].trim()) && lead[2].trim().length >= MIN_KEEP) {
    out = lead[2].trim();
  }

  return out.trim();
};

/**
 * getTherapistDisplayName — セラピスト名から**その店の名前**を外す
 *
 * 【なぜ必要か（2026-09-16 実測）】
 * 在籍一覧のカードに「瑠香 -るか- Marvelous -マーベラス-」のような表示が **180行**（うち画面に出ているのは178行）あった。
 * 取り込み元が「人名＋店名」で1つの名前にしているためで、**実在の人**なので消してはいけない。
 * 一覧はその店のページなので、店名は全カードに同じものが繰り返されるだけ＝人名が読みにくい。
 *
 * 🚩【読み仮名の区切りを壊さないこと】
 *   「瑠香 -るか-」の `-` は**読み仮名の囲み**で、区切り記号ではない。
 *   末尾の記号を無条件に削ると「瑠香 -るか」になって**名前が壊れる**。
 *   ⇒ 記号を削るのは**店名の語を外すときだけ**（語の前後にくっついている分だけ）。
 *
 * ⚠️ 外すのは**その店の名前に出てくる語**だけ。よその店名や一般語は外さない。
 * ⚠️ 残りが2文字未満になる削り方はしない（店名と同じ名前の行を空にしない）。
 *    名前が店名そのものの行は「人ではない」側の話で、delete_therapists.mjs の担当。
 */
const THERAPIST_NAME_MIN_KEEP = 2;
const escapeForRegExp = (v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function getTherapistDisplayName(therapistName, shopName) {
  const raw = String(therapistName ?? '').trim();
  if (!raw) return '';
  const shop = String(shopName ?? '').normalize('NFKC').trim();
  if (!shop) return raw;

  // 店名を語に割る。括弧・空白・中黒で切る。1文字の語は人名に当たるので使わない。
  const tokens = shop
    .split(/[（()）\s　・|/]+/u)
    .map((v) => v.trim())
    .filter((v) => v.length >= 2)
    .sort((a, b) => b.length - a.length);
  if (!tokens.length) return raw;

  const SEP = '[\\s　・|/\\-‐－–—~〜]';
  let out = raw.normalize('NFKC');
  for (let pass = 0; pass < tokens.length + 2; pass += 1) {
    let hit = false;
    for (const token of tokens) {
      // 語の前後にくっついている記号ごと外す。
      // 🚩 **語の前の記号は1文字まで**。`*` にすると貪欲に食べて読み仮名の囲みを壊す。
      //    実測: 「瑠香 -るか- Marvelous」で `[記号]*Marvelous$` が **"- Marvelous"** に一致し、
      //    結果が「瑠香 -るか」になった（閉じの `-` が消えて名前が壊れる）。
      //    語の後ろは `*` でよい（末尾なので巻き込む先が無い）。
      const re = new RegExp(`${SEP}?${escapeForRegExp(token)}${SEP}*$`, 'iu');
      const m = out.match(re);
      if (!m) continue;
      const next = out.slice(0, out.length - m[0].length).trim();
      if (next.length < THERAPIST_NAME_MIN_KEEP) continue;
      out = next;
      hit = true;
      break;
    }
    if (!hit) break;
  }
  return out.trim() || raw;
}
