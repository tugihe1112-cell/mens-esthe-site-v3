/**
 * liveCountsCache.js — トップの「掲載N店舗／在籍N人」を、表示のたびに数えない
 *
 * 【なぜ必要か（2026-09-24 本番のDB記録で確認）】
 * トップのSSRは表示のたびに、セラピスト56,625行を全部数えていた（is_active で絞った count:'exact'）。
 * - pg_stat_statements（2026-03から）: この数え上げ1本だけで**DBの実行時間全体の53%**
 *   （平均1.3秒 × 10,817回）。同じトップの店舗の数え上げ（平均0.23秒）が9.5%で、2本で6割を超える。
 * - Supabase は無料プラン（いちばん小さい計算機）。しばらく使われないと遅くなり、
 *   同じ数え上げが「5分あいた直後」は2,969ms、その2秒後は36ms（本番のAPIログ）。
 *   打ち切り（statement timeout）は1日17回、全部この数え上げだった。
 * - UptimeRobot が5分おきにトップを開くので、トップのSSRは5分おきに「冷えた状態で」走る。
 *   トップは取得を全部待ってから返すので、いちばん遅い数え上げ（2〜4秒）がそのままトップの待ち時間になり、
 *   同時に走るほかの取得も巻き込まれて遅くなっていた。
 *
 * 【使い方（2026-09-24 以降）】
 * トップでは load が /api/shops-lite?view=counts（CDNに置いた件数）を読むだけ。数える本体はそちら（server/siteCounts.js の注記）。
 * ここはトップの関数のメモリに短く持つ一段目で、CDNへの問い合わせを減らすためのもの。
 *
 * 【やること】
 * 数えた結果を関数のメモリに持ち、期限（ttlMs）の間は数えない（待たない）。
 * 期限が切れた・手元に何も無い（起動直後）ときだけ、数え直しを呼び出し側が決めた時間まで待ち、
 * 間に合えば新しい数、間に合わなければ手元の古い数（無ければ null）を返す。
 * ⚠️ 数え直しを「返答のあとに裏で」任せきりにしない（2026-09-24 本番で確認）。
 *    本番で、返答のあとに終わった数え上げが28秒後の次の表示で使われず、もう一度数えていた
 *    （関数が返答のあと止まっていたか、別の関数が受けたか）。止まっていた場合、裏に任せた数え直しは毎回失われ、
 *    5分おきの監視のたびに数え続けることになる（＝直す前と同じDBの負荷）。
 *    ⇒ 数え直しは表示の中で（ほかの取得と並べて）上限つきで待つ。待つのは期限切れ・起動直後のときだけ。
 * ⚠️ 数える中身は変えない（数えた数字だけを出す。推計＝count:'planned' にはしない）。
 * ⚠️ 数え直しが失敗したら、前に数えた数を持ち続ける（失敗で数字が消えたり0になったりしない）。
 * ⚠️ 数え直しが返ってこないまま詰まらないよう、timeoutMs で打ち切る（止まった関数が再開したときに詰まりを残さない）。
 */
export function createCountsCache({ ttlMs, load, timeoutMs = 10_000, now = () => Date.now() }) {
  let value = null;
  let at = 0;
  let inflight = null;

  const refresh = () => {
    if (inflight) return inflight;
    let timer = null;
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve(null), timeoutMs);
    });
    inflight = Promise.race([Promise.resolve().then(load), timeout])
      .then((v) => {
        if (v) {
          value = v;
          at = now();
        }
        return value;
      })
      .catch(() => value)
      .finally(() => {
        clearTimeout(timer);
        inflight = null;
      });
    return inflight;
  };

  const isStale = () => !value || now() - at > ttlMs;

  return {
    /** 今すぐ使える数（無ければ null）。古い・無いときは数え直しを始める（ここでは待たない）。 */
    peek() {
      if (isStale()) refresh();
      return value;
    },
    /**
     * 期限内の数が手元にあれば、待たずにそれを返す。
     * 古い・無いときは、数え直しを最大 ms まで待つ。間に合えば新しい数、間に合わなければ手元の古い数（無ければ null）。
     */
    async waitFor(ms) {
      if (!isStale()) return value;
      const pending = refresh();
      let timer = null;
      const giveUp = new Promise((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      });
      const v = await Promise.race([pending, giveUp]);
      clearTimeout(timer);
      return v || value;
    },
  };
}
