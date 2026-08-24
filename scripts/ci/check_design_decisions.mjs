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
    // 🐛 2026-08-20: サイドバーを条件付きで隠すようにした際、グリッドの列定義
    //    `lg:grid-cols-[220px_1fr]` を**固定のまま**にしたため、タグ0件の店舗では
    //    キャスト一覧が220pxの1列目に落ちて写真が細く潰れ、右半分が空白になった。
    //    「サイドバーが条件付きなら列定義も条件付き」でなければ通さない。
    if (/hasAvailableTags/.test(src)) {
      const fixedTwoCol = /className="[^"]*lg:grid-cols-\[220px_1fr\][^"]*"/.test(src);
      if (fixedTwoCol) {
        violations.push(
          `[D-001] ${p} でサイドバーは条件付き（hasAvailableTags）なのに、\n` +
          `        グリッドの列定義 lg:grid-cols-[220px_1fr] が固定のままになっている。\n` +
          `        タグ0件の店舗でキャスト一覧が220pxに潰れる。列定義も条件付きにすること:\n` +
          `        className={\`grid gap-6 \${hasAvailableTags ? 'grid-cols-1 lg:grid-cols-[220px_1fr]' : 'grid-cols-1'}\`}`
        );
      }
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
    // ⚠️ 初版のガードは2回とも不十分だった。記録しておく。
    //   1回目: 「object-cover が書かれていないこと」しか見ておらず**ザル**だった。
    //     LazyImage は className をラッパーdivに渡し、<img> には object-cover をハードコードしている。
    //     そのため呼び出し側が object-contain と書いても効かず、
    //     ガードは通るのに実際は cover のまま、という状態を素通しした。
    //   2回目: 行単位で見たため、複数行にまたがる JSX（src と imgClassName が別行）を誤検知した。
    //     さらに OG画像・JSON-LD・onError など**表示ではない箇所**まで拾っていた。
    //   → 「画像を実際に描画している行」だけを対象にし、その**周辺8行**に
    //      object-contain か blur-（ぼかし背景レイヤー）があるかで判定する。
    //   3回目の修正: ±8行の窓で見たら、**すぐ上のぼかし背景レイヤーが窓に入ってしまい**、
    //     本体を cover に戻しても検知できなかった（テストで発覚）。
    //     → 窓ではなく「その要素の開始タグから `/>` まで」を切り出して、要素単位で判定する。
    const lines = src.split('\n');
    /** src= の行から、その要素（<LazyImage ... /> または <img ... />）の範囲を切り出す */
    const elementAt = (i) => {
      let s = i;
      while (s > 0 && !/<(LazyImage|img)\b/.test(lines[s])) s--;
      let e = i;
      while (e < lines.length - 1 && !/\/>/.test(lines[e])) e++;
      return lines.slice(s, e + 1).join('\n');
    };
    lines.forEach((line, i) => {
      // 実際に描画している行だけを対象にする（src= に渡している箇所）
      if (!/src=\{[^}]*shop\.image_url/.test(line)) return;
      const el = elementAt(i);
      if (/object-contain/.test(el)) return; // 正しい
      if (/blur-/.test(el)) return;          // ぼかし背景レイヤーは意図的な cover
      violations.push(
        `[D-008] ${p}:${i + 1} で店舗画像が contain 表示になっていない（${label}）。\n` +
        `        店舗画像は最大600px・横長バナーや低解像度が過半のため、拡大＋切り取りで破綻する。\n` +
        `        必ず **imgClassName="... object-contain"**（LazyImage）または\n` +
        `        <img className="... object-contain">（生img）にすること。\n` +
        `        ⚠️ LazyImage の className はラッパーdivに付くだけで <img> には届かない。`
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
