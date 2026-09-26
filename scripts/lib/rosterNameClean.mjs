/**
 * rosterNameClean.mjs — 公式の在籍一覧から拾った文字を「人の名前」に整える（新人を足すとき用）
 *
 * 【なぜ（2026-09-25）】 在籍一覧の画像の alt や見出しには、名前の前後に飾りが付いている。
 *  実際に拾ったもの: 「リリカ大阪 黒崎あいみ」「セラピスト 藤原ゆい」「はる❤️アイドル的❤️」「真白はく🔰新人🔰」
 *  「河野セラピストの詳細」「最上るりBluesky」「歌川あさのBluesky」「蜜莉(みつり)♡激甘系」「あきね(GOLD)」
 *  さらに名前でないもの: 「メンズリラク版はコチラ」「ノーイメージ」「セラピスト一覧」「【平日限定】早割♪」「みるく 60分5500円」
 *  そのまま足すと、画面に飾り付きの名前や案内の文字が人として並び、飾りを外せば DB にいる人を二重に足してしまう。
 *
 * 【方針】 足しすぎより足りないほうを選ぶ。整えたあと日本語の名前の形（かな・漢字 2〜10文字、姓と名の間の空白は1つまで）
 *  にならないものは足さない（英字だけの名前・1文字の名前も今回は足さない）。
 */

const REJECT_ANY = /(円|分|割|限定|コース|料金|予約|キャンペーン|イベント|募集|求人|一覧|ランキング|ranking|日記|ブログ|blog|diary|コチラ|こちら|ノーイメージ|no ?image|now ?printing|coming ?soon|近日|公開|準備中|本日|店休|休業|お休み|ロゴ|logo|バナー|banner|メンズリラク|エステ魂|店長|スタッフ|体験入店|シークレット|×|＆|&|AV|女優|ランク|カップ$)/i;
const SUFFIXES = [/\s*セラピスト写真$/, /\s*の?写真$/, /セラピストの詳細$/, /の詳細$/, /の?(bluesky|twitter|instagram|tiktok|その他sns|sns)$/i, /(セラピスト|セラピ)$/, /さんの(写真|画像|プロフィール)$/];
// 名前の欄に入っていた「タグ・売り文句」（esthe-alice の「清楚系」「未経験」「イチオシ」、milkrepos の客の名前「〜 様」など）。
// 名前そのものと一致したときだけ捨てる（「可愛川 ゆの」のような名字は残す）。末尾が「系」は名前ではない。
const REJECT_EXACT = new Set(['スレンダー', 'グラマー', '長身', '巨乳', '爆乳', '美乳', '美脚', '小柄', '高身長', '色白', '健康的', 'ベテラン', '外国人',
  '可愛い', 'かわいい', 'カワイイ', '綺麗', 'キレイ', 'きれい', '美人', '美女', '美少女', 'お姉さん', 'お姉様', '人妻', '熟女', '若妻', '素人', '癒し',
  '清楚', '未経験', '経験者', '新人', '体験', 'イチオシ', 'オススメ', 'おすすめ', 'スリム', 'モデル', 'アイドル', 'アバター', 'プレミアム', 'ゴールド', 'プラチナ']);
const PREFIXES = [/^(新人|NEW|体験|本日出勤|出勤中|セラピスト)[\s:：・]*/i];

/**
 * @param {string} raw 拾った文字
 * @param {string} [sitePrefix] そのサイトの名前に共通して付く頭の文字（例 「リリカ大阪」）
 * @returns {string|null} 整えた名前（足してよい形でなければ null）
 */
export function cleanRosterName(raw, sitePrefix = '') {
  let s = String(raw || '').normalize('NFKC').replace(/[\s　]+/g, ' ').trim();
  if (!s) return null;
  if (sitePrefix && s.startsWith(sitePrefix)) s = s.slice(sitePrefix.length).trim();
  // ⚠️ キャッチコピーを先に外してから「名前でないもの」を判定する（「叶 恭子♡Iカップ」を名前ごと捨てないため）
  s = s.split(/[〜~♡♥❤★☆♪♦◆◇※｜|／/🔰]/u)[0];                       // ここから後ろはキャッチコピー
  if (REJECT_ANY.test(s)) return null;
  s = s.replace(/[【\[〔（(][^】\]〕）)]*[】\]〕）)]/g, '');           // 読み仮名・札（【さな】 (みつり) (GOLD)）
  s = s.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, ''); // 絵文字
  for (const re of PREFIXES) s = s.replace(re, '');
  for (const re of SUFFIXES) s = s.replace(re, '');
  s = s.replace(/[\s]+[A-Za-z][A-Za-z\s.'-]*\(?$/, '');                 // 「明日香 ASUKA (」の英字の読み
  s = s.replace(/[(（]$/, '').trim();
  if (!/^[ぁ-んァ-ヶー一-龯々ヵヶ]{1,7}( [ぁ-んァ-ヶー一-龯々]{1,7})?$/.test(s)) return null;
  const len = s.replace(/ /g, '').length;
  if (len < 2 || len > 10) return null;
  if (REJECT_EXACT.has(s.replace(/ /g, '')) || /系$/.test(s) || / ?様$/.test(s)) return null;
  return s;
}

/**
 * そのサイトの名前に共通して付く頭の文字（空白で区切られた最初の語）を見つける。
 * 半分以上の名前が同じ語で始まっていれば、それは店名などの飾りとみなす。
 */
export function detectSitePrefix(raws) {
  const heads = new Map();
  let n = 0;
  for (const r of raws) {
    const s = String(r || '').normalize('NFKC').replace(/[\s　]+/g, ' ').trim();
    const m = s.match(/^(\S+) \S/);
    n += 1;
    if (m) heads.set(m[1], (heads.get(m[1]) || 0) + 1);
  }
  const [best, c] = [...heads.entries()].sort((a, b) => b[1] - a[1])[0] || [];
  return best && n >= 4 && c / n >= 0.5 ? best : '';
}

/** 自己診断（実際に拾ったもので確かめる）。DBに触る前に呼ぶ。 */
export function selfTestRosterNameClean() {
  const cases = [
    ['紗奈【さな】', '紗奈'], ['【平日限定】早割♪', null], ['はる❤️アイドル的❤️', 'はる'], ['みるく 60分5500円', null],
    ['セラピスト 藤原ゆい', '藤原ゆい'], ['☆にな', null], ['えり♡スレンダー', 'えり'], ['河野セラピストの詳細', '河野'],
    ['明日香 ASUKA (', '明日香'], ['早乙女★妖艶整体師', '早乙女'], ['叶 恭子♡Iカップ', '叶 恭子'], ['蜜莉(みつり)♡激甘系', '蜜莉'],
    ['真白はく🔰新人🔰', '真白はく'], ['あきね(GOLD)', 'あきね'], ['最上るりBluesky', '最上るり'], ['歌川あさのBluesky', '歌川あさ'],
    ['三浦あきのその他SNS', '三浦あき'], ['JカップSランクAV女優', null], ['近日公開390-520', null], ['Tigger', null],
    ['メンズリラク版はコチラ', null], ['ノーイメージ', null], ['セラピスト一覧', null], ['エステ魂', null],
    ['清楚系', null], ['未経験', null], ['イチオシ', null], ['スリム', null], ['美少女', null], ['キレイ系', null], ['たか 様', null],
    ['本日店休日', null], ['友華 セラピスト写真', '友華'], ['美月 セラピスト写真', '美月'], ['可愛川 ゆの', '可愛川 ゆの'], ['西野さん', '西野さん'], ['アバター', null],
    ['榛名(はるな)あこ', '榛名あこ'], ['癒流 みお(ゆる みお)', '癒流 みお'], ['翠〜SS美女待望デビュー', null], ['星野りんご×月野いちご', null],
  ];
  const problems = [];
  for (const [input, want] of cases) {
    const got = cleanRosterName(input);
    if (got !== want) problems.push(`「${input}」→「${got}」（期待「${want}」）`);
  }
  if (cleanRosterName('リリカ大阪 黒崎あいみ', detectSitePrefix(['リリカ大阪 黒崎あいみ', 'リリカ大阪 夢乃める', 'リリカ大阪 星乃るる', 'リリカ大阪 あい'])) !== '黒崎あいみ') problems.push('サイト共通の頭の文字（リリカ大阪）を外せない');
  if (detectSitePrefix(['あい', 'めい', 'ゆい', 'さら']) !== '') problems.push('頭の文字が無いサイトで誤検出');
  return problems;
}
