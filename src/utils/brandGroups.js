/**
 * brandGroups.js — 店舗レコードを「ブランド」単位にまとめる唯一の場所
 *
 * 【なぜ必要か（2026-09-14 オーナー確認）】
 * 利用者が読みたいのは「アロマモアというブランドと、そこにいるセラピスト」の口コミ。
 * **セラピストは店舗に所属していない。ブランドに属している。**
 * 咲さんは渋谷店だろうが代々木店だろうが同じ咲さんで、口コミもその人のもの。
 *
 * ところがDBは支店ごとに別レコードになっており、実測では:
 *   - AROMA EMERALD … 4レコード / 実在30人 / 行120個 / 30人全員が4店すべてに在籍
 *   - 4ページの中身は完全に同一（違うのは住所の文字列だけ）
 * 複数店を持つブランド96・店舗ページ348枚が、この形になっている。
 *
 * ⚠️ **支店レコードを消してはいけない理由が1つだけある＝地名**。
 *    「渋谷店」という名前や住所に価値があるのではなく、
 *    **渋谷で検索した人に引っかかる**ために地名が要る。
 *    だから1枚にまとめるときは、**全ルームの地名を必ず引き継ぐ**。
 *    引き継がないと「代々木で検索しても出ない」が起きる。ここが最重要。
 *
 * ⚠️ この形を壊さないため、検索用の項目（area / city / address / area_id）は
 *    **全ルームぶんを連結**する。searchMatch.js の buildSearchTarget が
 *    そのまま読めるプロパティ名に合わせてある。
 */
import { getDisplayName } from './shopHelpers';

/** ブランドの鍵。group_id が無い単独店は自分自身が1ブランド。 */
export const brandKeyOf = (shop) => shop?.group_id || shop?.id || '';

const uniq = (list) => [...new Set(list.filter((v) => v != null && String(v).trim() !== ''))];

const areaListOf = (shop) => {
  const a = shop?.area ?? shop?.raw_data?.area;
  if (Array.isArray(a)) return a;
  return a == null ? [] : [a];
};

/**
 * 店舗の配列をブランドの配列にまとめる。
 * 返すオブジェクトは「店舗1件」と同じ形で使えるようにしてある
 * （既存の検索・カード・並び替えがそのまま動く）。
 */
export function buildBrands(shops) {
  if (!Array.isArray(shops)) return [];
  const byKey = new Map();
  for (const shop of shops) {
    if (!shop) continue;
    const key = brandKeyOf(shop);
    if (!key) continue;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(shop);
  }

  const out = [];
  for (const [key, rooms] of byKey) {
    // 代表は「情報が一番揃っている行」。表示に使う写真・料金・公式URLはここから取る。
    const head = [...rooms].sort((a, b) => {
      const score = (s) => ['image_url', 'address', 'business_hours', 'price_system', 'website_url']
        .reduce((n, f) => n + (s?.[f] ? 1 : 0), 0);
      const d = score(b) - score(a);
      return d !== 0 ? d : String(a.id).localeCompare(String(b.id));
    })[0];

    // 🚩 地名は**全ルームぶん**。ここを代表1件だけにすると、
    //    他のルームの地名で検索したときに出なくなる（このファイルの存在理由）。
    const areas = uniq(rooms.flatMap(areaListOf));
    const cities = uniq(rooms.map((s) => s.city ?? s.raw_data?.city));
    const addresses = uniq(rooms.map((s) => s.address ?? s.raw_data?.address));
    const prefectures = uniq(rooms.map((s) => s.prefecture ?? s.raw_data?.prefecture));
    const areaIds = uniq(rooms.map((s) => s.area_id));

    out.push({
      ...head,
      id: key,
      isBrand: true,
      // 表示・リンク用。ブランドページができるまでは代表ルームの店舗ページへ送る。
      primaryShopId: head.id,
      shopIds: rooms.map((s) => s.id),
      roomCount: rooms.length,
      // 支店名を外したブランド名（getDisplayName は地名も所在地と照合して外す）
      name: getDisplayName(head.name, head),

      // ⚠️ 表示用の項目（prefecture / city / address / area）は**代表ルームのまま**にする。
      //    ここに全ルームぶんを詰めると、カードに「東京都 東京都」「代々木 新宿御苑」と
      //    並んで読めなくなる。検索用は下の searchText に分ける。
      // 🚩 検索に使う地名は**全ルームぶん**。ここが痩せると
      //    「代々木で検索しても出ない」が起きる（このファイルの存在理由）。
      searchText: [...areas, ...cities, ...addresses, ...prefectures, ...areaIds].join(' '),
      // 画面で「どこにルームがあるか」を1行で出すための素材
      areaLabels: uniq([...areas, ...cities]),
      // 画面で「どこにルームがあるか」を出すための素材
      rooms: rooms.map((s) => ({
        id: s.id,
        name: s.name,
        prefecture: s.prefecture ?? s.raw_data?.prefecture ?? null,
        city: s.city ?? s.raw_data?.city ?? null,
        address: s.address ?? s.raw_data?.address ?? null,
        area: areaListOf(s),
      })),
    });
  }
  return out;
}
