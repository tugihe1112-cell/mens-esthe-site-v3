/**
 * queryString.js — URLクエリ更新の純粋ロジック
 *
 * ⚠️ router.js から切り出してある。理由は「テストできるようにするため」。
 *    router.js は JSX（NextLink）を含むので Node から直接読めず、
 *    CI（scripts/ci/check_ssr_helpers.mjs）で検証できなかった。
 *
 * 【背景の事故（2026-08-22）】
 * `/search?shopId=...` を開くと画面がチカチカした。原因は useSearchParams の2つのバグ:
 *   ① 毎レンダーで setParams を作り直していた
 *      → 呼び出し側が依存配列に入れているため毎レンダーで effect が発火
 *   ② オブジェクト形式（`setSearchParams({shop:'x'})`）を無視していた
 *      → 中身が変わらないまま **同じURLへ router.replace** を呼び続けた
 * 結果、実測で **3秒間に400回** の history.replaceState。
 */

/**
 * 現在のクエリ文字列と更新指定から「次のクエリ文字列」を作る。
 *
 * @returns {string|null} 変化が無ければ **null**（＝呼び出し側は replace してはいけない）。
 *                        全て消えた場合は空文字を返す（null とは区別する）。
 *
 * ⚠️ 比較は必ず `URLSearchParams` を通した**正規化後の文字列どうし**で行うこと。
 *    生の文字列比較だと、空白が `+` と `%20` のどちらで来るかといった
 *    エンコードの揺れで「毎回違う」と誤判定し、無限ループに逆戻りする。
 */
/**
 * 「router.asPath から取れたクエリ」と「ブラウザの実URLのクエリ」から、
 * 実際に使うべきクエリ文字列を決める。
 *
 * 【背景の事故（2026-09-07 / 本番実測）】
 * `/login` `/register` `/auth/confirm` `/auth/complete` は
 * **Automatic Static Optimization の対象（`○ Static`）** で、ビルド時に
 * クエリ無しの状態で書き出される。その結果クライアントでも
 * `router.asPath` が `/login` のままになり、**クエリが読めない**。
 *   実測: `/login?redirect=%2Fshops%2F...` を開いて4秒後も
 *         `window.location.search` にはクエリがあるのに、
 *         描画された「新規登録」リンクは `/register`（redirect無し）だった。
 * ＝ 認証をまたいだ戻り先が、そもそもページに届いていなかった。
 * ⚠️ これは今回の追加分だけの問題ではない。`/login?redirect=/admin?review=...`
 *    （2026-08-22 の新着口コミメール導線）も同じ経路なので、同時に直る。
 *
 * 【なぜ「欠けているときだけ」補うのか】
 * asPath にクエリがあるページ（`/search` などの `ƒ` 動的ページ）の挙動は
 * **一切変えない**。上書きすると 2026-08-22 の無限ループを踏み直す危険がある。
 * 情報が欠けているときに実URLで埋めるだけなら、増えることはあっても壊れない。
 *
 * @param {string} fromAsPath router.asPath の `?` 以降（無ければ空文字）
 * @param {string} fromLocation window.location.search（`?` 付きでも無しでも可）
 */
export function resolveQueryString(fromAsPath, fromLocation) {
  // ⚠️ fragment はクエリではない。`router.asPath` には Supabase が付ける
  //    `#access_token=...&refresh_token=...` がそのまま乗ってくることがあり、
  //    落とさずに URLSearchParams へ渡すと **最後のクエリ値に丸ごと混入する**
  //    （2026-09-07 の実測では refresh_token がクエリ値として取り出せる状態だった）。
  //    呼び出し側ごとに `.split('#')[0]` を書く運用は必ずどこかが漏れる
  //    （実際 AuthConfirmPage / AuthCompletePage にはあるが Login / Register には無い）。
  //    D-011 と同じ考え方で、**物理的に1箇所**で落とす。
  //    ⚠️ 落とすのは生の `#` だけ。戻り先に含まれる `%23`（encode済みの#）は残る。
  const fromAsPathQuery = String(fromAsPath || '').split('#')[0];
  if (fromAsPathQuery) return fromAsPathQuery;
  // window.location.search は fragment を含まないが、先頭の `?` は付いてくる。
  return String(fromLocation || '').replace(/^\?/, '').split('#')[0];
}

export function buildNextQueryString(queryString, nextInit) {
  const currentNormalized = new URLSearchParams(queryString || '').toString();
  const next = new URLSearchParams(typeof nextInit === 'function' ? queryString || '' : undefined);

  if (typeof nextInit === 'function') {
    nextInit(next);
  } else if (typeof URLSearchParams !== 'undefined' && nextInit instanceof URLSearchParams) {
    nextInit.forEach((v, k) => next.append(k, v));
  } else if (Array.isArray(nextInit)) {
    nextInit.forEach(([k, v]) => next.append(k, v));
  } else if (nextInit && typeof nextInit === 'object') {
    // オブジェクト形式（react-router v6 の標準的な使い方）。
    // 以前はこの分岐が無く、オブジェクトで呼ぶと**何も反映されなかった**。
    for (const [k, v] of Object.entries(nextInit)) {
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v)) v.forEach((x) => next.append(k, String(x)));
      else next.append(k, String(v));
    }
  }

  const nextQs = next.toString();
  return nextQs === currentNormalized ? null : nextQs;
}
