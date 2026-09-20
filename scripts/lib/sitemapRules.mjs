/**
 * sitemapRules.mjs — サイトマップの `lastmod` を付けてよいページはどれか
 *
 * 【方針（既存）】`lastmod` は**口コミの実更新日**を持つページにだけ付ける。
 * 「毎日更新」と偽るくらいなら省略する（Googleは不正確な lastmod を無視する）。
 *
 * 【なぜ切り出したか（2026-09-20）】
 * 外形監視の判定が **D-014 より前の形のまま**だった。
 * 2026-09-14 に複数ルームの店舗ページを `/brands/:id` へ301し、
 * サイトマップも「1ブランド1行・lastmod は所属ルームの最も新しい口コミ日」に変えた。
 * ところが監視側は「lastmod を持ってよいのは `/shops/...` だけ」のままで、
 * **正しいサイトマップを毎回「根拠のない lastmod」と言い続けていた**。
 * ⚠️ これは2026-09-04の「監視が古い期待値を持って1日96通」とまったく同じ型。
 *    サイトは正常で、**監視だけが古い**。赤が続くと赤が信用されなくなる。
 * ⇒ 判定を1か所に置き、境界テストを付けて、次に仕様が動いたとき**テストが落ちて気づける**ようにする。
 */

/** そのURLは「口コミの実更新日」を持つページか（＝lastmod を付けてよい／付けるべき） */
export function expectsLastmod(path) {
  const p = String(path ?? '');
  // 単独店の店舗ページ と 人物ページ
  if (/^\/shops\/[^/]+(?:\/threads\/[^/]+)?$/.test(p)) return true;
  // D-014でここに集約されたブランドページ（口コミは group_id 単位で共有される）
  if (/^\/brands\/[^/]+$/.test(p)) return true;
  return false;
}

export function selfTestSitemapRules() {
  const cases = [
    ['/shops/tokyo_x', true],
    ['/shops/tokyo_x/threads/tokyo_x_あい', true],
    ['/brands/g_brand_the_half', true],   // D-014の集約先
    ['/', false],
    ['/area/tokyo', false],
    ['/popular-reviews', false],
    ['/brands/', false],
    ['/shops', false],
    ['', false],
    [null, false],
  ];
  const bad = [];
  for (const [path, want] of cases) {
    if (expectsLastmod(path) !== want) bad.push(`${JSON.stringify(path)} → ${expectsLastmod(path)}（期待 ${want}）`);
  }
  if (bad.length) {
    console.error('❌ lastmod の判定の自己診断に失敗しました:');
    for (const b of bad) console.error('   - ' + b);
    process.exit(1);
  }
}
