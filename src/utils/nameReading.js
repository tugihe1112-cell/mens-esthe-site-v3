// 店名の読み（括弧の中のかな）を分ける（2026-09-30・デザインA案）。
// 「TIGER GATE (タイガーゲート)」→ { main: 'TIGER GATE', reading: 'タイガーゲート' }
// 大きな見出しで括弧ごと折り返すと「(タイガ／ーゲート)」のように読みが途中で切れるので、
// 読みは見出しの下に小さく置く。⚠️ 括弧の中が**かなだけ**のときだけ分ける（地名・漢字・英字は分けない）。
export function splitNameReading(name) {
  const s = String(name || '').trim();
  const m = s.match(/^(.+?)\s*[（(]\s*([ぁ-ゖァ-ヺー・ 　]+?)\s*[)）]$/u);
  if (!m) return { main: s, reading: '' };
  return { main: m[1].trim(), reading: m[2].trim() };
}
