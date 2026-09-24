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
 * 【やること】
 * 数えた結果を関数のメモリに持ち、期限（ttlMs）の間は数えない。期限が切れたら、手元の数をそのまま使って返しつつ
 * 裏で数え直す（待つ人はいない）。手元に何も無いとき（起動直後）は、呼び出し側が決めた短い時間だけ待つ。
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
    /** 今すぐ使える数（無ければ null）。古い・無いときは裏で数え直しを始める（待たない）。 */
    peek() {
      if (isStale()) refresh();
      return value;
    },
    /**
     * 手元に数が無いときだけ、最大 ms まで数え終わりを待つ。間に合わなければ null。
     * 手元に数があれば（古くても）待たずにそれを返す。
     */
    async waitFor(ms) {
      if (value) return value;
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
