/**
 * check_design_decisions.mjs — playbook/decisions.md のうち「機械で検証できる項目」をCIで守る
 *
 * 【なぜ必要か】
 * 同じデザイン決定が3回覆された（2026-05-23決定 → 07-05再指摘 → 08-06に再び覆る → 08-08再々指摘）。
 * 決定はCLAUDE.mdに書かれていたが4,000行に埋もれ、実装者が読まなかった。
 * ドキュメントを増やすだけでは同じことが起きるので、**ビルドを落として物理的に止める**。
 *
 * 実行: node scripts/ci/check_design_decisions.mjs
 *   （.github/workflows/ci.yml から呼ぶ。ローカルでも実行可）
 */
import fs from 'fs';

const violations = [];

function read(path) {
  try { return fs.readFileSync(path, 'utf-8'); } catch { return null; }
}

// ── D-001: 店舗ページにタブUIを復活させない ───────────────────────────
{
  const p = 'src/pages/ShopDetailPage.jsx';
  const src = read(p);
  if (src === null) {
    violations.push(`${p} が見つからない（リネームした場合はこのチェックも更新すること）`);
  } else {
    if (/\bsetActiveTab\b|\buseState\(['"]top['"]\)/.test(src)) {
      violations.push(
        `[D-001] ${p} にタブUI（activeTab）が復活している。\n` +
        `        店舗ページはSearchPage型（左タグサイドバー＋キャスト一覧の1ページ構成）と決定済み。\n` +
        `        → playbook/decisions.md D-001 を参照。変更したい場合は実装せずokabayashiに確認すること。`
      );
    }
    if (!/TAG_CATEGORIES/.test(src)) {
      violations.push(
        `[D-001] ${p} からタグ絞り込みサイドバー（TAG_CATEGORIES）が消えている。\n` +
        `        SearchPageと同じ左サイドバー構成を維持すること。`
      );
    }
  }
}

// ── D-002: ヒーローのcoverflowを維持 ─────────────────────────────────
{
  const p = 'src/components/TopHeroSlider.jsx';
  const src = read(p);
  if (src === null) {
    violations.push(`[D-002] ${p} が存在しない。ヒーローのcoverflowは維持する決定（decisions.md D-002）。`);
  } else if (!/coverflow/i.test(src)) {
    violations.push(
      `[D-002] ${p} から coverflow が消えている。\n` +
      `        静的ヒーロー化は2026-07-02にオーナー判断でrevert済み。変更前に確認すること。`
    );
  }
}

// ── D-004: 課金前に価格を出さない ────────────────────────────────────
{
  const p = 'src/pages/PremiumPage.jsx';
  const src = read(p);
  // コメント行（説明として旧価格に言及している行）は除外してから判定する
  const code = (src || '').split('\n').filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)).join('\n');
  if (src && /[¥￥]\s?2,?980|[¥￥]\s?29,?800/.test(code)) {
    violations.push(
      `[D-004] ${p} に旧価格（¥2,980 / ¥29,800）が復活している。\n` +
      `        決定価格は¥980/¥9,800。かつ課金開始トリガー充足まで価格は表示しない。`
    );
  }
}

// ── D-007: /search の未入力状態を空にしない ──────────────────────────
{
  const p = 'src/pages/SearchPage.jsx';
  const src = read(p);
  if (src === null) {
    violations.push(`[D-007] ${p} が存在しない。/searchは未入力でも注目セラピストを表示する。`);
  } else {
    if (!/buildFeaturedTherapistPool/.test(src)) {
      violations.push('[D-007] /search から未入力時の注目セラピスト取得が消えている。');
    }
    if (!/気になるセラピストから探せます/.test(src)) {
      violations.push('[D-007] /search から未入力時の案内・一覧導線が消えている。');
    }
  }
}

// ── D-008: 店舗画像を object-cover で全面表示しない ────────────────────────
// 【事故】2026-08-20、PCで新着店舗スライダーと店舗ヒーローが「壊れて見える」と報告。
//   実測すると、店舗画像は 2026-07-06 の一括リサイズで**全て最大600px**なのに、
//   PCヒーローは幅約1,700px＝2.8倍に拡大し、さらに object-cover で上下を切り落としていた。
//   ユニーク756枚のうち横長(aspect≥2.2)が245枚・低解像度(<200px)が129枚あり、
//   **半数以上がこの表示方法で破綻する**状態だった。
// 【対処】「ぼかした複製を背景に敷き、本体は object-contain」に変更。
//   object-cover に戻すと同じ事故が必ず再発するので、機械的に止める。
{
  const targets = [
    ['src/pages/ShopDetailPage.jsx', '店舗ページのヒーロー'],
    ['src/pages/Home.jsx', 'ホームの新着店舗カード'],
  ];
  for (const [p, label] of targets) {
    const src = read(p);
    if (src === null) { violations.push(`[D-008] ${p} が見つからない`); continue; }
    // shop の画像を object-cover で「本体」として出していないか（背景のぼかし用は blur が付くので除外）
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      if (!/shop\.image_url/.test(line)) return;
      if (!/object-cover/.test(line)) return;
      if (/blur-/.test(line)) return; // ぼかし背景レイヤーは意図的な object-cover なのでOK
      violations.push(
        `[D-008] ${p}:${i + 1} で店舗画像を object-cover で表示している（${label}）。\n` +
        `        店舗画像は最大600px・横長バナーや低解像度が過半のため、拡大＋切り取りで破綻する。\n` +
        `        「blur を付けた複製を背景に敷き、本体は object-contain」で表示すること。`
      );
    });
  }
}

if (violations.length) {
  console.error('\n🚨 オーナー確定事項（playbook/decisions.md）に反する変更が検出されました:\n');
  violations.forEach((v) => console.error('  - ' + v + '\n'));
  console.error('技術的に正しく見えても、実装せず okabayashi に確認してください。\n');
  process.exit(1);
}

console.log('✅ デザイン決定事項チェック OK');
