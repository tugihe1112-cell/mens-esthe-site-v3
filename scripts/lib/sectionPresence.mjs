/**
 * sectionPresence.mjs — 「節が在るか」を外形から見張るための判定
 *
 * 【なぜ必要か（2026-09-20）】
 * ブランドページの「店舗情報」が**本番で一度も出ていなかった**。
 * SSRがpropsに平らにする所で4項目が落ちており、`shopInfo.length > 0` の節が丸ごと消えていた。
 * それでもページは200で、**ガード14本もビルドもlintも緑**だった。
 * 条件付きで描画される節は、壊れても例外を出さず、**何も出さずに消える**＝画面は正常に見える。
 * 今週この型（緑のまま本番だけ間違っている）を4回踏んだ。**開いて初めて分かった。**
 * ⇒ 人が開くのを待たず、外から「節が在ること」を見る。
 *
 * 【厳しくしすぎない】
 * ⚠️ **1枚で赤くしない。同種のページが揃って欠けたときだけ落とす。**
 *    1枚だけ欠けるのはたいていデータの都合（その店に営業時間が無い等）。
 *    実装の事故は**全ページで同時に**起きるので、それだけを見れば足りる。
 *    2026-09-04、監視が古い期待値を持って**1日96通**のメールを飛ばした事故がある。
 *    赤が信用されなくなるほうが、見逃しより高くつく。
 */

/** 節の見つけ方。⚠️「ルーム」は「ルームにより異なります」に当たるので見出しの形で見る。 */
export const SECTION_RULES = [
  {
    group: 'ブランドページ',
    match: (p) => /^\/brands\/[^/]+$/.test(p),
    sections: {
      在籍セラピスト: '在籍セラピスト',
      ルーム: '>ルーム<',
      タグで絞り込む: 'タグで絞り込む',
      店舗情報: '店舗情報',
    },
  },
  {
    group: '店舗ページ',
    match: (p) => /^\/shops\/[^/]+$/.test(p),
    sections: {
      在籍セラピスト: '在籍セラピスト',
      タグで絞り込む: 'タグで絞り込む',
      店舗情報: '店舗情報',
    },
  },
];

/** これ未満のページ数では判断しない（たまたま1枚しか取れなかったときに騒がない）。 */
export const MIN_PAGES = 3;
/** 在る割合がこれ未満なら警告（落とさない）。 */
export const WARN_RATIO = 0.3;

/** HTMLから、その種類のページに期待される節のうち**在ったもの**を返す。 */
export function sectionsInHtml(path, html, rules = SECTION_RULES) {
  const rule = rules.find((r) => r.match(path));
  if (!rule) return null;
  const found = new Set();
  for (const [name, marker] of Object.entries(rule.sections)) {
    if (String(html).includes(marker)) found.add(name);
  }
  return found;
}

/**
 * @param {Array<{path:string, sections:Set<string>}>} pages
 * @returns {{failures:string[], warnings:string[]}}
 */
export function evaluateSections(pages, rules = SECTION_RULES) {
  const failures = [];
  const warnings = [];
  const counts = {};
  for (const rule of rules) {
    const group = (pages || []).filter((p) => p && rule.match(p.path));
    counts[rule.group] = group.length;
    // 🚩 母数が足りないときは判定しないが、**黙ってスキップしない**。
    //    「27ページ見た」と出ていても、その内訳がブランド2枚なら
    //    **いちばん見張りたいページを見張れていない**。今日の事故（節が黙って消える）と同じ形なので、
    //    見張れていないこと自体を口に出す。
    if (group.length < MIN_PAGES) {
      warnings.push(`${rule.group}が${group.length}枚しか取れていない（${MIN_PAGES}枚未満は判定しない＝この種類は見張れていない）`);
      continue;
    }
    for (const name of Object.keys(rule.sections)) {
      const hit = group.filter((p) => p.sections?.has(name)).length;
      if (hit === 0) {
        failures.push(
          `${rule.group}${group.length}枚すべてに「${name}」が無い`
          + `（節ごと消えている可能性。ページは200で返るので画面は正常に見える）`
        );
      } else if (hit / group.length < WARN_RATIO) {
        warnings.push(`${rule.group}: 「${name}」が ${hit}/${group.length} 枚にしかない`);
      }
    }
  }
  return { failures, warnings, counts };
}

/** 判定そのものの自己診断。**ネットワークに出る前**に呼ぶ。 */
export function selfTestSectionPresence() {
  const bad = [];
  const brand = (n, has) => Array.from({ length: n }, (_, i) => ({ path: `/brands/g${i}`, sections: new Set(has) }));
  const all = ['在籍セラピスト', 'ルーム', 'タグで絞り込む', '店舗情報'];

  // ① 全枚で欠けたら落とす（2026-09-20 の事故そのもの）
  {
    const r = evaluateSections(brand(5, ['在籍セラピスト', 'ルーム', 'タグで絞り込む']));
    if (r.failures.length !== 1 || !r.failures[0].includes('店舗情報')) bad.push('全枚欠けを検知していない');
  }
  // ② 1枚だけ欠けても落とさない・騒がない（データの都合）
  {
    const pages = brand(5, all);
    pages[0].sections = new Set(['在籍セラピスト', 'ルーム', 'タグで絞り込む']);
    const r = evaluateSections(pages);
    if (r.failures.length) bad.push('1枚欠けで落ちている');
    // ⚠️ 警告は2種類ある（母数不足／欠けの割合）。ここで見たいのは後者だけ。
    if (r.warnings.some((w) => w.includes('枚にしかない'))) bad.push('1枚欠けで警告が出ている');
  }
  // ③ ほとんど欠けたら警告（落とさない）
  {
    const pages = brand(10, ['在籍セラピスト', 'ルーム', 'タグで絞り込む']);
    pages[0].sections = new Set(all);
    const r = evaluateSections(pages);
    if (r.failures.length) bad.push('1枚でも在れば落としてはいけない');
    if (!r.warnings.some((w) => w.includes('店舗情報'))) bad.push('ほぼ欠けで警告が出ていない');
  }
  // ④ 母数が足りないときは判断しないが、**黙らない**
  {
    const r = evaluateSections(brand(2, []));
    if (r.failures.length) bad.push('母数2枚で落としている');
    if (!r.warnings.some((w) => w.includes('見張れていない'))) bad.push('母数不足を黙ってスキップしている');
    if (r.counts['ブランドページ'] !== 2) bad.push('内訳（枚数）を返していない');
  }
  // ⑤ 空・不正で落ちない
  {
    if (evaluateSections([]).failures.length) bad.push('空配列で落ちている');
    if (evaluateSections(null).failures.length) bad.push('nullで落ちている');
  }
  // ⑥ 「ルーム」は「ルームにより異なります」に当たらない
  {
    const got = sectionsInHtml('/brands/x', '<p>ルームにより異なります</p>');
    if (got.has('ルーム')) bad.push('「ルームにより異なります」を「ルーム」の節と誤認している');
    const got2 = sectionsInHtml('/brands/x', '<h2 class="a">ルーム</h2>');
    if (!got2.has('ルーム')) bad.push('見出しの「ルーム」を見つけられない');
  }
  // ⑦ 対象外のパスは null
  {
    if (sectionsInHtml('/area/tokyo', '在籍セラピスト') !== null) bad.push('対象外のパスを判定している');
  }
  if (bad.length) {
    console.error('❌ 節の在り方の自己診断に失敗しました。監視は実行しません:');
    for (const b of bad) console.error('   - ' + b);
    process.exit(1);
  }
}
