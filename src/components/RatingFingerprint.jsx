import React from 'react';

/**
 * 6項目の採点を六角形の図にする（2026-09-30・デザインA案「夜の文芸誌」の「採点の指紋」）。
 *
 * 【なぜ図にするか】同じ★3.8でも「マッサージに強く見た目は好みが分かれる人」と
 *   「見た目が良く施術は普通の人」は中身が違う。棒6本より形の方が一目で違いが分かる。
 * ⚠️ 描くのは**書かれた点数そのもの**だけ。平均やならしを勝手に足さない（根拠のない値・D-010）。
 *    点数の無い項目は中心に置き、ラベルは「—」にする（0点と区別する）。
 * ⚠️ サーバーでもそのまま描ける SVG だけで作る（JSを待たずに出る・画像を増やさない）。
 * ⚠️ 項目の並びは時計回りに 清潔感→ルックス→スタイル→接客→マッサージ→密着。
 *    画面ごとに並びが違うと形の比較ができなくなるので、この並びをここだけで決める。
 */
export const FINGERPRINT_AXES = [
  { id: 'cleanliness', label: '清潔感' },
  { id: 'looks', label: 'ルックス' },
  { id: 'style', label: 'スタイル' },
  { id: 'service', label: '接客' },
  { id: 'massage', label: 'マッサージ' },
  { id: 'intimacy', label: '密着' },
];

// 真上から時計回りの単位ベクトル
const DIRS = [[0, -1], [0.866, -0.5], [0.866, 0.5], [0, 1], [-0.866, 0.5], [-0.866, -0.5]];

const round1 = (n) => Math.round(n * 10) / 10;

/** 点数（1〜5）。無い・0・数字でないものは null＝「採点なし」 */
export function fingerprintValue(values, id) {
  const n = Number(values?.[id]);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(n, 5);
}

export function hasFingerprint(values) {
  return FINGERPRINT_AXES.some(({ id }) => fingerprintValue(values, id) !== null);
}

const fmt = (v, decimals) => (v === null ? '—' : (decimals > 0 ? v.toFixed(decimals) : String(round1(v))));

function polygon(cx, cy, radius, ratios) {
  return ratios
    .map((ratio, i) => `${round1(cx + DIRS[i][0] * radius * ratio)},${round1(cy + DIRS[i][1] * radius * ratio)}`)
    .join(' ');
}

/** 図の下に置く一文。書かれた点数から「いちばん高い／低い」を言うだけ（評価の言葉は作らない） */
export function fingerprintSummary(values, decimals = 0) {
  const rated = FINGERPRINT_AXES
    .map(({ id, label }) => ({ label, v: fingerprintValue(values, id) }))
    .filter((a) => a.v !== null);
  if (rated.length < 2) return '';
  const max = Math.max(...rated.map((a) => a.v));
  const min = Math.min(...rated.map((a) => a.v));
  if (max === min) return `6項目とも ${fmt(max, decimals)}`;
  const names = (v) => rated.filter((a) => a.v === v).map((a) => a.label).join('・');
  return `いちばん高いのは${names(max)}（${fmt(max, decimals)}）、低いのは${names(min)}（${fmt(min, decimals)}）`;
}

// 文字の位置（viewBox 300×200・中心 150,100・半径70 の外側）
const LABEL_POS = [
  { x: 150, y: 16, anchor: 'middle' },
  { x: 218, y: 62, anchor: 'start' },
  { x: 218, y: 142, anchor: 'start' },
  { x: 150, y: 192, anchor: 'middle' },
  { x: 82, y: 142, anchor: 'end' },
  { x: 82, y: 62, anchor: 'end' },
];

/**
 * @param values   { cleanliness, looks, style, service, massage, intimacy }（1〜5）
 * @param size     'full'（ラベル付き）｜'mini'（64px・ラベルなし）
 * @param decimals ラベルの小数の桁（平均を出すときは1）
 * @param caption  図の下の一文。省略すると fingerprintSummary、false で出さない
 */
export default function RatingFingerprint({ values, size = 'full', decimals = 0, caption, className = '' }) {
  if (!hasFingerprint(values)) return null;

  const vals = FINGERPRINT_AXES.map(({ id }) => fingerprintValue(values, id));
  const ratios = vals.map((v) => (v === null ? 0 : v / 5));
  const ariaLabel = `6項目の採点（5点満点）：${FINGERPRINT_AXES.map(({ label }, i) => `${label} ${fmt(vals[i], decimals)}`).join('、')}`;

  if (size === 'mini') {
    return (
      <svg viewBox="0 0 64 64" width="64" height="64" role="img" aria-label={ariaLabel} className={className}>
        <polygon points={polygon(32, 32, 26, [1, 1, 1, 1, 1, 1])} fill="none" stroke="#3A3440" strokeWidth="1" />
        <polygon points={polygon(32, 32, 26, ratios)} fill="rgba(224,97,63,0.22)" stroke="#E0613F" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }

  const text = caption === false ? '' : (caption || fingerprintSummary(values, decimals));
  return (
    <figure className={`m-0 flex flex-col items-center gap-1 ${className}`}>
      <svg viewBox="0 0 300 200" role="img" aria-label={ariaLabel} className="block h-auto w-full max-w-[300px]">
        <polygon points={polygon(150, 100, 70, [1, 1, 1, 1, 1, 1])} fill="none" stroke="#3A3440" strokeWidth="1" />
        <polygon points={polygon(150, 100, 70, [0.6, 0.6, 0.6, 0.6, 0.6, 0.6])} fill="none" stroke="#26222C" strokeWidth="1" />
        {DIRS.map(([dx, dy], i) => (
          <line key={i} x1="150" y1="100" x2={round1(150 + dx * 70)} y2={round1(100 + dy * 70)} stroke="#26222C" strokeWidth="1" />
        ))}
        <polygon points={polygon(150, 100, 70, ratios)} fill="rgba(224,97,63,0.16)" stroke="#E0613F" strokeWidth="1.5" strokeLinejoin="round" />
        {FINGERPRINT_AXES.map(({ id, label }, i) => (
          <text key={id} x={LABEL_POS[i].x} y={LABEL_POS[i].y} textAnchor={LABEL_POS[i].anchor} fontSize="11" fill="#CFC7BA">
            {label} {fmt(vals[i], decimals)}
          </text>
        ))}
      </svg>
      {text && <figcaption className="text-center text-[11px] leading-relaxed text-slate-400">{text}</figcaption>}
    </figure>
  );
}
