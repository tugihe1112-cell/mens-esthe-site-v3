/**
 * 店舗詳細の「他の店舗」に出す一覧と、その集合が同エリアか同県かを返す純粋関数。
 *
 * ⚠️ 2026-09-08（FIXES.md F06-C）: SSRは同エリアが3件未満のとき同県へフォールバックするのに、
 *    画面の見出しは常に元の地域名のままだった。本番の虎ノ門ページで
 *    「虎ノ門の他のメンズエステ／近くの店舗と比べてみる」と書きながら荻窪・池袋を並べていた。
 *    距離は測っていないので「近く」とも言えない。
 *    → どちらの集合を使ったかを scope として返し、見出しを実態に合わせる。
 *
 * ⚠️ 返す一覧は修正前と同一。scope を足しただけで、並び順も件数も変えていない。
 *    area が無い店舗では同エリア集合を作れないので、最初から prefecture として扱う。
 */
export function pickNearbyShops(rows, area, limit = 8) {
  const list = Array.isArray(rows) ? rows : [];
  const sameArea = list.filter((s) => {
    const a = Array.isArray(s && s.raw_data && s.raw_data.area)
      ? s.raw_data.area[0]
      : (s && s.raw_data ? s.raw_data.area : undefined);
    return a === area;
  });
  const useArea = Boolean(area) && sameArea.length >= 3;
  return {
    scope: useArea ? 'area' : 'prefecture',
    shops: (useArea ? sameArea : list).slice(0, limit).map((s) => ({ id: s.id, name: s.name })),
  };
}
