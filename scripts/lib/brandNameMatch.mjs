/**
 * brandNameMatch.mjs — 同じ group_id の店どうしが「本当に同じブランドか」を突き合わせる判定。
 *
 * 【なぜ切り出すか（2026-09-16）】
 * この判定は**洗い出し（inspect_group_id_mixups.mjs）と毎日の監視（check_data_freshness.mjs）の
 * 両方**が使う。2か所に書くと必ず片方だけ直されてズレる。判定は1か所に置く。
 *
 * 【何を見つけるか】
 * `group_id` が `other` のような**置き場所の無い値**だと、取り込みで区分不明だった店が
 * 同じ値を持ち、無関係な店どうしが1ブランドになる。2026-09-16、本番の `/brands/other` が
 * 「THE HALF ／ 2ルーム ／ セラピスト229名」になっていた（THE HALF 113名 + キャンディスパ 116名）。
 * D-014により `/shops/tokyo_candy_spa` はその THE HALF のページへ301していた。
 * group_id は口コミの共有キーでもあるので、口コミが付けば別の店に出る。
 *
 * 🚩【綴りの禁止リストにしない理由】
 *  「正しい group_id の形」という性質は**存在しない**。`g_brand_` でも `g_solo_` でもない
 *  `g_yorimichi` が正しいブランドキーとして実在する。だから接頭辞で弾くことはできない。
 *  `other` だけを名指しで禁止しても `misc` や `不明` が来たら素通りする
 *  （lessons.md の型②「ガードが性質ではなく書き方を見ている」）。
 *  ⇒ 見るのは綴りではなく**「束ねられている店どうしが似ているか」**という関係。
 */

/** 名前をならす。
 *  ⚠️ **括弧の中を落としてはいけない。**
 *  `Dejavu TOKYO (デジャヴ東京) 三軒茶屋店` と `デジャヴ東京 (Dejavu TOKYO)` のように、
 *  英字と仮名が括弧の内と外で**入れ替わる**書き方が実在する。括弧を落とすと、
 *  入れ替わった側では唯一の共通部分がちょうど消え、同一ブランドを「無関係」と誤検知する
 *  （2026-09-16、Dejavu TOKYO 6ルームと よりみち 3ルームで実際に誤検知した）。 */
export const normName = (v) => String(v ?? '')
  .normalize('NFKC').toLowerCase()
  .replace(/[（()）\s~〜・,、.。\-_/|]/g, '');

/** idをならす。
 *  ⚠️ **先頭の都道府県を落とすこと。** 落とさないと東京の店どうしが必ず `tokyo_` で
 *  一致してしまい、無関係な店の混入を見逃す。 */
export const normId = (v) => String(v ?? '')
  .toLowerCase().replace(/-/g, '_').split('_').slice(1).join('_');

/** 最長共通部分文字列 */
export function lcs(a, b) {
  if (!a || !b) return '';
  let best = '';
  for (let i = 0; i < a.length; i += 1) {
    for (let j = i + best.length + 1; j <= a.length; j += 1) {
      const sub = a.slice(i, j);
      if (b.includes(sub)) { if (sub.length > best.length) best = sub; } else break;
    }
  }
  return best;
}

/** 並び全部に共通する部分を求める */
export function fold(list) {
  const items = (list || []).filter(Boolean);
  let core = items[0] || '';
  for (const n of items.slice(1)) core = lcs(core, n);
  return core;
}

/** 置き場所の無い値として使われがちな group_id（完全一致で見る）。
 *  ⚠️ これは**判定の本体ではない**。ここに無い綴りでも、名前とidの突き合わせで拾う。 */
export const PLACEHOLDER_GROUP_IDS = new Set(
  ['other', 'others', 'unknown', 'none', 'null', 'undefined', '-', 'その他', '未分類', 'etc'],
);

export const NAME_CORE_MIN = 2;
export const ID_CORE_MIN = 4;

/**
 * 同じ group_id の店たちを分類する。
 * @param {{ gid: string, rooms: Array<{id: string, name: string}> }} group
 * @returns {{ verdict: 'ok'|'mixed'|'renamed', nameCore: string, idCore: string, isPlaceholder: boolean }}
 *   mixed   … 名前もidも共通部分が無い＝無関係な店の混入。直す対象。
 *   renamed … idは揃っているが名前が違う＝改名・2ブランド運営の疑い。人が決めること。
 *   ok      … 同じブランドとみなす。
 */
export function classifyGroup({ gid, rooms }) {
  const list = Array.isArray(rooms) ? rooms : [];
  const isPlaceholder = PLACEHOLDER_GROUP_IDS.has(String(gid ?? '').trim().toLowerCase());
  const nameCore = fold(list.map((r) => normName(r?.name)));
  const idCore = fold(list.map((r) => normId(r?.id)));
  if (list.length < 2) return { verdict: 'ok', nameCore, idCore, isPlaceholder };
  if (!isPlaceholder && nameCore.length >= NAME_CORE_MIN) {
    return { verdict: 'ok', nameCore, idCore, isPlaceholder };
  }
  const verdict = (isPlaceholder || idCore.length < ID_CORE_MIN) ? 'mixed' : 'renamed';
  return { verdict, nameCore, idCore, isPlaceholder };
}

/**
 * 突き合わせ方そのものの自己診断。**DBに触る前に呼ぶこと。**
 * ここが壊れると「同じブランドを無関係と言い出す」。
 * 何も出ないより嘘の一覧を出すほうが害が大きいので、呼び出し側は問題があれば止めること。
 * @returns {string[]} 問題の説明。空なら健全。
 */
export function selfTestMatching() {
  const problems = [];
  const cases = [
    // 括弧の内と外で英字と仮名が入れ替わる書き方。落ちれば括弧を落としている。
    [[{ id: 'tokyo_setagaya_sangenjaya_dejavu_tokyo', name: 'Dejavu TOKYO (デジャヴ東京) 三軒茶屋店' },
      { id: 'tokyo_minato_nishiazabu_dejavu_tokyo', name: 'デジャヴ東京 (Dejavu TOKYO)' }], 'ok', '同一ブランド(表記が入れ替わる)'],
    [[{ id: 'tokyo_kita_akabane_yorimichi', name: 'よりみち (Yorimichi) 赤羽' },
      { id: 'tokyo_musashino_kichijoji_yorimichi', name: 'Yorimichi (よりみち)' }], 'ok', '同一ブランド(表記が入れ替わる)'],
    // 無関係な2店。idの県を落とし忘れると `tokyo_` で一致して 'renamed' に落ちる。
    [[{ id: 'tokyo_shinagawa_gotanda_the_half', name: 'THE HALF' },
      { id: 'tokyo_candy_spa', name: 'キャンディスパ' }], 'mixed', '無関係な2店'],
    // 名前は違うがidは揃っている＝改名の疑い。
    [[{ id: 'tokyo_chofu_jesse', name: 'Jesse (ジェシー 調布店)' },
      { id: 'kanagawa_kawasaki_noborito_jesse', name: 'Tigger (ティガー 登戸店)' }], 'renamed', '改名・2ブランド運営の疑い'],
  ];
  for (const [rooms, want, label] of cases) {
    const got = classifyGroup({ gid: 'g_test', rooms }).verdict;
    if (got !== want) problems.push(`${label}: ${want} になるはずが ${got} になった`);
  }
  // 置き場所の無い値は、名前が似ていても混入として出す。
  if (classifyGroup({ gid: 'other', rooms: [{ id: 'a_x', name: 'SPA' }, { id: 'b_x', name: 'SPA' }] }).verdict !== 'mixed') {
    problems.push('置き場所の無い group_id を素通りさせている');
  }
  if (normId('tokyo_candy_spa') !== 'candy_spa') problems.push('normId が先頭の都道府県を落としていない');
  return problems;
}
