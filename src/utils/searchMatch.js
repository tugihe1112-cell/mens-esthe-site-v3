/**
 * searchMatch.js — 店舗のファジー検索ロジック（純粋関数）
 *
 * ⚠️ SearchPage.jsx から切り出してある。理由は「CIでテストできるようにするため」。
 *    JSXを含むファイルは Node から直接読めず、検索の当たり外れを機械で検証できなかった。
 *
 * 【背景の不具合（2026-08-22）】
 * okabayashi「esthe-selu.com の店舗ページある？検索しても出てこない」
 * → ページは存在した（`tokyo_shibuya_yoyogiuehara_selu`）が、
 *   店名「メンズエステ セル〜Selu〜」を **「セル」で検索すると0件**だった。
 *
 * 原因は語境界の判定文字が `[\s()\[\]・／-]` しか無かったこと。
 * 「せる」の直後が「〜」なので語境界と見なされず、部分一致の0.5どまりで
 * 閾値0.7に届かなかった（「Selu」なら末尾が「〜」でも前が空白でヒットしていた）。
 * 実測すると `〜`「（）」「★」「&」など**現在は境界扱いされない区切り文字**を
 * 名前に含む店舗が **477/1,099店** あった。
 *
 * 【設計】
 * 境界文字を1つずつ足すと必ず漏れるので、**「語を構成する文字」以外はすべて境界**とする。
 * ⚠️ ただし長音符「ー」と繰り返し記号「々」は**語の一部**なので語側に入れること。
 *    ここを間違えると「タイガーアイ」が「タイガー」で誤ヒットするようになる。
 */

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

export function bigramScore(normTarget, token) {
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 1. 語境界マッチを最優先（"reve" が "revere" の途中にヒットしないよう）
  //    ⚠️ 境界は「語を構成する文字**以外**」で判定する。
  //       個別に `〜` や `（` を足していく方式は必ず漏れる（実際に漏れて0件になった）。
  const wordBoundary = new RegExp(`(?:^|${NON_WORD})${esc}(?=${NON_WORD}|$)`);
  if (wordBoundary.test(normTarget)) return 1.0;

  // 2. 部分文字列マッチはスコア0.5に抑制（0.7閾値を下回る → 単独ではマッチしない）
  if (normTarget.includes(token)) return 0.5;

  // 3. バイグラム類似度（タイポ許容）
  if (token.length < 3) return 0.0;
  const bigrams = new Set();
  for (let i = 0; i < token.length - 1; i++) bigrams.add(token.slice(i, i + 2));
  let hits = 0;
  for (const bg of bigrams) { if (normTarget.includes(bg)) hits++; }
  return hits / bigrams.size;
}

/** クエリの全トークンが店舗にマッチするか（語境界1.0／類似度0.7以上で許容） */
export function shopFuzzyMatch(shop, query) {
  if (!shop) return false;
  const aStr = (s) => (Array.isArray(s.area) ? s.area.join(' ') : (s.area || ''));
  const normTarget = normalizeForSearch(
    [shop.name, aStr(shop), shop.city, shop.address, shop.area_id].filter(Boolean).join(' '),
  );
  const tokens = normalizeForSearch(query).split(/\s+/).filter(Boolean);
  return tokens.length > 0 && tokens.every((t) => bigramScore(normTarget, t) >= 0.7);
}
