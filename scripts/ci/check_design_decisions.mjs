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

if (violations.length) {
  console.error('\n🚨 オーナー確定事項（playbook/decisions.md）に反する変更が検出されました:\n');
  violations.forEach((v) => console.error('  - ' + v + '\n'));
  console.error('技術的に正しく見えても、実装せず okabayashi に確認してください。\n');
  process.exit(1);
}

console.log('✅ デザイン決定事項チェック OK');
