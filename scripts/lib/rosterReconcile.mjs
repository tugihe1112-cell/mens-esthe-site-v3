/**
 * rosterReconcile.mjs — 在籍名簿と突き合わせた結果「誰を何にするか」の判定。
 *
 * 【なぜ切り出すか（2026-09-21）】
 * 毎日の監視 `check_data_freshness.mjs` は「180日再確認されていない在籍者」を数えるが、
 * **その再確認を記録する経路が存在しなかった**。
 *   ・`last_seen_at: now` を書いているのは82箇所すべて**新規登録スクリプト**
 *   ・退店照合の `reconcile_therapists.mjs` は `is_active` しか書かない
 * ＝ 監視は正しく鳴っているのに、運用側にそれを消す手段が無いという形だった。
 *
 * 実測（2026-09-21 本番）:
 *   last_seen_at の最新 = 2026-09-05 ／ 直近7日で再確認された在籍者 = 0名
 *   180日超 4392/57850 = 7.6%（上限5%）→ 30日後 31.8% → **90日後 99.8%**
 * ＝ 閾値の問題ではなく、名簿の鮮度を保つ仕組みが無い。
 *
 * 🚩【店ごとに一括で確認印を配らない理由】
 *  `last_seen_at` の意味は「その店を見た」ではなく「**その人を名簿の中に見た**」。
 *  shop_id だけで一括更新すると、既に辞めた人にも確認印が付き、
 *  監視は緑になるが中身は何も確認されていない
 *  ＝ image-health.yml が「異常が新しい正常として黙認される」と警告しているのと同じ型。
 *  ⇒ 確認印が付くのは **active_names に名前が在った人だけ**。
 *
 * 🚩【空の在籍リストで全員を退店にしない理由】
 *  名簿の取得（スクレイプ）が失敗すると `active_names: []` が渡りうる。
 *  そのまま突き合わせると**その店の全員が退店**になり、口コミの持ち主が画面から消える。
 *  「0名だった」と「取れなかった」は区別できないので、空なら**何もしない**。
 */

/** 名前をならす。全角スペースを含む空白だけを落とす（表記の揺れはここでは吸収しない）。 */
export const normName = (s) => String(s ?? '').replace(/[\s　]/g, '');

/**
 * 名簿と DB の行を突き合わせる。**DBには触らない純粋な判定**。
 * @param {{ rows: Array<{id:any,name:string,is_active?:boolean|null}>, activeNames: string[] }} input
 * @returns {{
 *   refused: string|null,        // 実行してはいけない理由（あれば全リストは空）
 *   confirm: Array<object>,      //在籍を確認できた＝last_seen_at を進める対象
 *   depart:  Array<object>,      // 名簿に居ない＝退店マークの対象（last_seen_at は触らない）
 *   revive:  Array<object>,      // confirm のうち、退店扱いから戻った人（報告用）
 *   unmatchedNames: string[],    // 名簿にあってDBに無い名前（このツールは追加しない）
 * }}
 */
export function planReconcile({ rows, activeNames } = {}) {
  const list = Array.isArray(rows) ? rows : [];
  const names = (Array.isArray(activeNames) ? activeNames : []).map(normName).filter(Boolean);
  const empty = { confirm: [], depart: [], revive: [], unmatchedNames: [] };

  // 取得失敗と「本当に0名」を区別できない以上、空は何もしないのが唯一安全な選択。
  if (names.length === 0) {
    return { refused: '在籍リストが空（取得失敗と区別できないため何もしない）', ...empty };
  }

  const activeSet = new Set(names);
  const seenInDb = new Set();
  const confirm = [];
  const depart = [];
  const revive = [];

  for (const t of list) {
    const key = normName(t?.name);
    const inRoster = activeSet.has(key);
    if (inRoster) {
      seenInDb.add(key);
      confirm.push(t);
      if (t?.is_active === false) revive.push(t);
      continue;
    }
    // 既に退店扱いの人を毎回書き直さない（退店日が上書きされる）。
    if (t?.is_active !== false) depart.push(t);
  }

  const unmatchedNames = names.filter((n) => !seenInDb.has(n));
  return { refused: null, confirm, depart, revive, unmatchedNames };
}

/**
 * 判定そのものの自己診断。**DBに触る前に呼ぶこと。**
 * ここが壊れると「確認していない人に確認印を付ける」＝監視だけが緑になる。
 * @returns {string[]} 問題の説明。空なら健全。
 */
export function selfTestReconcile() {
  const problems = [];
  const rows = [
    { id: 1, name: 'あい', is_active: true },
    { id: 2, name: 'う み', is_active: true },   // 空白入り（名簿側は空白なし）
    { id: 3, name: 'えり', is_active: false },   // 退店扱い → 名簿に戻る
    { id: 4, name: 'おと', is_active: false },   // 退店扱いのまま
    { id: 5, name: 'かな', is_active: null },    // null は在籍とみなす
  ];
  const plan = planReconcile({ rows, activeNames: ['あい', 'うみ', 'えり', 'さくら'] });
  const ids = (xs) => xs.map((t) => t.id).join(',');

  if (plan.refused) problems.push('通常の名簿を拒否している');
  if (ids(plan.confirm) !== '1,2,3') problems.push(`確認印の対象が違う: ${ids(plan.confirm)}（1,2,3 のはず）`);
  if (ids(plan.depart) !== '5') problems.push(`退店対象が違う: ${ids(plan.depart)}（5 のはず）`);
  if (ids(plan.revive) !== '3') problems.push(`復活の検出が違う: ${ids(plan.revive)}（3 のはず）`);
  if (plan.unmatchedNames.join(',') !== 'さくら') {
    problems.push(`名簿にあってDBに無い名前を拾えていない: ${plan.unmatchedNames.join(',')}（さくら のはず）`);
  }
  // 🚩 ここが今回の本題。名簿に無い人に確認印が付いたら、監視は嘘をつき始める。
  if (plan.confirm.some((t) => t.id === 5)) problems.push('名簿に無い人に確認印を付けている');
  if (plan.depart.some((t) => t.id === 4)) problems.push('既に退店扱いの人を毎回書き直している');

  const emptyRoster = planReconcile({ rows, activeNames: [] });
  if (!emptyRoster.refused) problems.push('空の在籍リストで全員を退店にしようとしている');
  if (emptyRoster.depart.length || emptyRoster.confirm.length) problems.push('拒否したのに対象を返している');

  const blankOnly = planReconcile({ rows, activeNames: ['', '　', ' '] });
  if (!blankOnly.refused) problems.push('空白だけの名簿を有効な名簿として扱っている');

  if (normName('あ い　う') !== 'あいう') problems.push('normName が全角スペースを落としていない');
  return problems;
}
