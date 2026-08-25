/**
 * searchMatch.js — 店舗のファジー検索ロジック（純粋関数）
 *
 * ⚠️ SearchPage.jsx から切り出してある。理由は「CIでテストできるようにするため」。
 *    JSXを含むファイルは Node から直接読めず、検索の当たり外れを機械で検証できなかった。
 *    テスト: scripts/ci/check_ssr_helpers.mjs
 *
 * ── 2026-08-22 に実測で判明した3つの問題と対処 ────────────────────────
 * ① 区切り文字の取りこぼし
 *    「メンズエステ セル〜Selu〜」が **「セル」で0件**だった。語境界の判定が
 *    `[\s()\[\]・／-]` しか無く「〜」を境界と見なせなかった。`〜`244店ほか
 *    影響しうる店舗は477/1,099店。→ **「語を構成する文字以外はすべて境界」**に変更。
 *    ⚠️ 長音符「ー」(411店)と「々」は**語の一部**なので語側に残す。
 *
 * ② 語頭で検索できない
 *    日本語は単語を空白で区切らないため「リンダスパ」が1語と見なされ「リンダ」で届かない。
 *    **1,099店中824店(75%)が自分の店名の先頭4文字で検索しても出てこなかった**。
 *    → 語頭一致を許可（オーナー判断）。**語の「途中」は当てない**（誤ヒットが激増するため）。
 *
 * ③ 「メンズエステセル」で20件出てしまう／目的の店が一番上に来ない
 *    (a) 「メンズエステ」は当サイトでは全店に共通する語なので、それだけで
 *        バイグラム類似度が0.714に達し閾値0.7を超えていた（30店が該当）。
 *        → **業界共通語をクエリから除去**してから照合する。
 *    (b) スコアは計算していたのに**並び替えに使っていなかった**（DB順のまま）。
 *        目的の店は0.857、ノイズは0.714だったので、並べるだけで先頭に来る。
 *        → `rankShops()` で関連度順に返す。
 *
 * ④ カタカナで英字店名が探せない
 *    「リンクス」で `Lynx` が出なかった。カタカナ読みを持たない英字ブランドは155店。
 *    → `brandReadings.js` の読み辞書で展開し、辞書に無い語は音写（ローマ字）で拾う。
 */
import { BRAND_READINGS } from '../data/brandReadings';

const SMALL_KATA = { 'ァ':'ア','ィ':'イ','ゥ':'ウ','ェ':'エ','ォ':'オ','ッ':'ツ','ャ':'ヤ','ュ':'ユ','ョ':'ヨ','ヮ':'ワ','ヵ':'カ','ヶ':'ケ' };
const SMALL_HIRA = { 'ぁ':'あ','ぃ':'い','ぅ':'う','ぇ':'え','ぉ':'お','っ':'つ','ゃ':'や','ゅ':'ゆ','ょ':'よ','ゎ':'わ' };

export function normalizeForSearch(s) {
  if (!s) return '';
  let r = String(s).toLowerCase();
  r = r.replace(/[ァィゥェォッャュョヮヵヶ]/g, (c) => SMALL_KATA[c] || c);
  r = r.replace(/[ぁぃぅぇぉっゃゅょゎ]/g, (c) => SMALL_HIRA[c] || c);
  // カタカナ → ひらがな（「ー」U+30FC は範囲外なのでそのまま残る＝正しい）
  r = r.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  return r;
}

// 語を構成する文字：英数字・ひらがな・カタカナ・長音符ー・繰り返し々・漢字・全角英数
const WORD_CHARS =
  '0-9a-z' +
  '\\u3041-\\u3096' + // ひらがな
  '\\u30a1-\\u30fa' + // カタカナ
  '\\u30fc' +         // ー（長音符）※語の一部。境界にしてはいけない
  '\\u3005' +         // 々
  '\\u4e00-\\u9fff' + // 漢字
  '\\uff10-\\uff19\\uff21-\\uff3a\\uff41-\\uff5a'; // 全角英数
const NON_WORD = `[^${WORD_CHARS}]`;

/**
 * 業界共通語。当サイトは**メンズエステの口コミサイト**なので、
 * これらは店を区別する情報を持たない（「メンズエステ」は31店の名前に含まれる）。
 * ⚠️ 「アロマ」「スパ」は店名の識別子として機能している例が多いので**入れない**
 *    （「アロマモア」「ユニゾンスパ」などを探せなくなる）。
 */
const INDUSTRY_STOPWORDS = [
  'めんずえすて', 'めんえす', 'めんずえすてぃっく',
  "men'sesthe", 'mensesthe', "men'sesthetic", 'mensesthetic',
];

/**
 * クエリから業界共通語を取り除く。
 * ⚠️ 取り除いた結果が空になる場合は**元のクエリを返す**
 *    （「メンズエステ」だけで検索した人に0件を返さないため）。
 */
export function stripIndustryWords(normalizedQuery) {
  let out = normalizedQuery;
  for (const w of INDUSTRY_STOPWORDS) out = out.split(w).join(' ');
  out = out.replace(/\s+/g, ' ').trim();
  return out || normalizedQuery;
}

// ── カタカナ → ローマ字（辞書に無い語の音写フォールバック） ──────────────
const ROMAJI = {
  きゃ:'kya',きゅ:'kyu',きょ:'kyo',しゃ:'sha',しゅ:'shu',しょ:'sho',ちゃ:'cha',ちゅ:'chu',ちょ:'cho',
  にゃ:'nya',にゅ:'nyu',にょ:'nyo',ひゃ:'hya',ひゅ:'hyu',ひょ:'hyo',みゃ:'mya',みゅ:'myu',みょ:'myo',
  りゃ:'rya',りゅ:'ryu',りょ:'ryo',ぎゃ:'gya',ぎゅ:'gyu',ぎょ:'gyo',じゃ:'ja',じゅ:'ju',じょ:'jo',
  びゃ:'bya',びゅ:'byu',びょ:'byo',ぴゃ:'pya',ぴゅ:'pyu',ぴょ:'pyo',
  ふぁ:'fa',ふぃ:'fi',ふぇ:'fe',ふぉ:'fo',うぃ:'wi',うぇ:'we',うぉ:'wo',
  ゔぁ:'va',ゔぃ:'vi',ゔぇ:'ve',ゔぉ:'vo',てぃ:'ti',でぃ:'di',
  あ:'a',い:'i',う:'u',え:'e',お:'o',か:'ka',き:'ki',く:'ku',け:'ke',こ:'ko',
  さ:'sa',し:'shi',す:'su',せ:'se',そ:'so',た:'ta',ち:'chi',つ:'tsu',て:'te',と:'to',
  な:'na',に:'ni',ぬ:'nu',ね:'ne',の:'no',は:'ha',ひ:'hi',ふ:'fu',へ:'he',ほ:'ho',
  ま:'ma',み:'mi',む:'mu',め:'me',も:'mo',や:'ya',ゆ:'yu',よ:'yo',
  ら:'ra',り:'ri',る:'ru',れ:'re',ろ:'ro',わ:'wa',を:'o',ん:'n',
  が:'ga',ぎ:'gi',ぐ:'gu',げ:'ge',ご:'go',ざ:'za',じ:'ji',ず:'zu',ぜ:'ze',ぞ:'zo',
  だ:'da',ぢ:'ji',づ:'zu',で:'de',ど:'do',ば:'ba',び:'bi',ぶ:'bu',べ:'be',ぼ:'bo',
  ぱ:'pa',ぴ:'pi',ぷ:'pu',ぺ:'pe',ぽ:'po',ゔ:'vu',
};

/** ひらがな正規化済みの文字列をローマ字に（英字はそのまま残す） */
export function kanaToRomaji(normalized) {
  let out = '';
  for (let i = 0; i < normalized.length; i++) {
    const two = normalized.slice(i, i + 2);
    if (ROMAJI[two]) { out += ROMAJI[two]; i++; continue; }
    const one = normalized[i];
    if (one === 'ー') continue;               // 長音は落とす（ルーム→rumu→rum相当）
    if (ROMAJI[one]) { out += ROMAJI[one]; continue; }
    out += one;                               // 英数字・漢字はそのまま
  }
  return out;
}

/**
 * 店舗の検索対象テキストを作る。
 * 英字ブランド名には**カタカナ読みを併記**して、カタカナ入力でも当たるようにする。
 */
export function buildSearchTarget(shop) {
  const areaStr = Array.isArray(shop.area) ? shop.area.join(' ') : (shop.area || '');
  const base = [shop.name, areaStr, shop.city, shop.address, shop.area_id].filter(Boolean).join(' ');
  const norm = normalizeForSearch(base);
  const nameOnly = normalizeForSearch(shop.name || '');

  // 英字トークンを読み辞書で展開して足す（例: lynx → りんくす）
  const expand = (text) => {
    const extras = [];
    for (const m of text.matchAll(/[a-z]{2,}/g)) {
      const readings = BRAND_READINGS[m[0]];
      if (readings) for (const r of readings) extras.push(normalizeForSearch(r));
    }
    return extras.length ? `${text} ${extras.join(' ')}` : text;
  };

  return { norm, nameOnly, withReadings: expand(norm), nameWithReadings: expand(nameOnly) };
}

/**
 * 1トークンのスコア。1.0=語一致/語頭一致、0.5=語中、それ未満=タイポ類似度。
 */
/** バイグラム類似度を使ってよい最小トークン長。
 *  ⚠️ 短い語ほど「たまたま同じ2文字が含まれる」だけで高得点になる。
 *     実測: 「セル」(=seru)のバイグラム{se,er,ru}が「セラドルコレクション」(seradoru…)に
 *     3/3で当たり、無関係な店が15件ヒットしていた。 */
const MIN_BIGRAM_LEN = 5;

/**
 * @param {boolean} allowFuzzy false のときは語一致／語頭一致だけを見る。
 *   ⚠️ ローマ字化した文字列に対しては**必ず false**にすること。
 *      音写後のテキストはラテン文字の共通バイグラムだらけで、
 *      バイグラム比較を許すとほぼ何にでも当たる（上記の実測例）。
 */
export function tokenScore(target, token, allowFuzzy = true) {
  if (!token) return 0;
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 1. 語がまるごと一致（最優先）
  if (new RegExp(`(?:^|${NON_WORD})${esc}(?=${NON_WORD}|$)`).test(target)) return 1.0;

  // 2. 語頭一致（「リンダ」→「リンダスパ」／「LIND」→「LINDA SPA」）
  if (new RegExp(`(?:^|${NON_WORD})${esc}`).test(target)) return 0.9;

  // 3. 語の途中は0.5（閾値0.7未満＝単独ではマッチしない）
  if (target.includes(token)) return 0.5;

  // 4. バイグラム類似度（タイポ許容）
  if (!allowFuzzy || token.length < MIN_BIGRAM_LEN) return 0;
  const bigrams = new Set();
  for (let i = 0; i < token.length - 1; i++) bigrams.add(token.slice(i, i + 2));
  let hits = 0;
  for (const bg of bigrams) if (target.includes(bg)) hits++;
  return hits / bigrams.size;
}

const THRESHOLD = 0.7;

/**
 * 店舗とクエリの関連度（0〜1）。全トークンが閾値を超えたときだけ >0 を返す。
 * カタカナ⇔英字は読み辞書＋ローマ字音写の両面で照合する。
 */
/**
 * 店舗とクエリの関連度。全トークンが閾値を超えたときだけ >0 を返す（AND検索）。
 * @returns {{score:number, nameScore:number}} nameScore は**店名だけ**に対する一致度。
 *   住所やエリアで引っかかっただけの店より、店名が一致した店を上位に出すために使う。
 */
export function shopMatchDetail(shop, query) {
  const none = { score: 0, nameScore: 0 };
  if (!shop || !query) return none;
  const { withReadings, nameWithReadings } = buildSearchTarget(shop);
  const romajiTarget = kanaToRomaji(withReadings);
  const romajiName = kanaToRomaji(nameWithReadings);

  const tokens = stripIndustryWords(normalizeForSearch(query)).split(/\s+/).filter(Boolean);
  if (!tokens.length) return none;

  let total = 0;
  let nameTotal = 0;
  for (const t of tokens) {
    const romajiToken = kanaToRomaji(t);
    // ⚠️ ローマ字経路は allowFuzzy=false。音写後のテキストは共通バイグラムだらけで、
    //    許すと無関係な店が大量に混ざる（実測で15件のノイズ）。
    const s = Math.max(
      tokenScore(withReadings, t),
      tokenScore(romajiTarget, romajiToken, false),
    );
    if (s < THRESHOLD) return none; // 1つでも満たさなければ不一致
    total += s;
    nameTotal += Math.max(
      tokenScore(nameWithReadings, t),
      tokenScore(romajiName, romajiToken, false),
    );
  }
  return { score: total / tokens.length, nameScore: nameTotal / tokens.length };
}

export function shopMatchScore(shop, query) {
  return shopMatchDetail(shop, query).score;
}

/** 従来互換のブール判定 */
export function shopFuzzyMatch(shop, query) {
  return shopMatchScore(shop, query) > 0;
}

/**
 * 関連度順に並べた店舗配列を返す。
 * ⚠️ 以前はスコアを計算しておきながら**並び替えに使っていなかった**ため、
 *    「メンズエステセル」で目的の店が20件中の下に埋もれ、
 *    オーナーから「一番上にそれが出てこない」と指摘された。
 * 並び順: ①店名の一致度 ②全体の一致度 ③店名が短い順（＝余計な語が少ない）
 */
export function rankShops(shops, query) {
  if (!query || !query.trim()) return [];
  return (shops || [])
    .map((s) => ({ shop: s, ...shopMatchDetail(s, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) =>
      (b.nameScore - a.nameScore) ||
      (b.score - a.score) ||
      ((a.shop.name || '').length - (b.shop.name || '').length))
    .map((x) => x.shop);
}
