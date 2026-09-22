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
import { getDisplayName } from './shopHelpers.js';
import { normalizeTherapistName } from './reviewIdentity.js';

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
        // ⚠️ ブランドページの「店舗情報」はこれらをルーム間で突き合わせて出す
        //    （揃っていれば1つ、割れていれば「ルームにより異なります」）。
        //    ここに載せ忘れると全部 none 扱いになり、**静かに何も出なくなる**。
        businessHours: s.business_hours ?? s.raw_data?.hours ?? null,
        priceSystem: s.price_system ?? s.raw_data?.price ?? null,
        websiteUrl: s.website_url ?? s.raw_data?.websiteUrl ?? null,
        scheduleUrl: s.schedule_url ?? null,
        area: areaListOf(s),
      })),
    });
  }
  return out;
}

/**
 * ブランドページの **props に載せるルームの形**。
 *
 * 🚩 ここに書いた項目だけが本番の画面に届く。
 *    `raw_data` を丸ごと渡さない（1店約11.9KBでHTMLが膨れる）ために平らにしているので、
 *    **buildBrands に項目を足しても、ここに足さなければ画面には何も出ない。**
 *
 * ⚠️ 2026-09-20、店舗情報（営業時間・料金・公式・出勤）がこれで静かに空だった。
 *    SSRの select も brandCommonValue も BrandPage の描画も正しく、
 *    ガードも両端（列・描画）を見ていたが、**間のここだけ**が4項目を落としていた。
 *    以後、平らにする形はこの関数だけ。呼び出し側で手書きしない。
 */
export function brandRoomProps(room) {
  const r = room || {};
  return {
    id: r.id ?? null,
    prefecture: r.prefecture ?? null,
    city: r.city ?? null,
    address: r.address ?? null,
    area: Array.isArray(r.area) ? r.area[0] || null : r.area || null,
    // ⚠️ 店舗情報（揃っていれば1つ、割れていれば「ルームにより異なります」）の素材。
    businessHours: r.businessHours ?? null,
    priceSystem: r.priceSystem ?? null,
    websiteUrl: r.websiteUrl ?? null,
    scheduleUrl: r.scheduleUrl ?? null,
  };
}

/**
 * ブランドをエリア（市区）ごとに振り分ける。
 *
 * 🚩 1ブランドが複数エリアにルームを持つときは、**そのすべてのエリアに出す**。
 *    代表ルームのエリアだけに出すと、「渋谷を見ている人に、渋谷にルームがある
 *    ブランドが出てこない」＝支店レコードを残している意味が無くなる。
 *
 * @returns {Array<[string, object[]]>} [エリア名, ブランド配列] を件数の多い順で
 */
export function groupBrandsByArea(brands, fallbackLabel = 'その他') {
  const groups = new Map();
  for (const brand of Array.isArray(brands) ? brands : []) {
    if (!brand) continue;
    const areas = uniq((brand.rooms || []).map(
      (r) => (Array.isArray(r.area) ? r.area[0] : r.area) || r.city || '',
    ));
    for (const area of (areas.length ? areas : [fallbackLabel])) {
      if (!groups.has(area)) groups.set(area, []);
      const list = groups.get(area);
      if (!list.some((b) => b.id === brand.id)) list.push(brand);
    }
  }
  return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
}

/**
 * 同エリア（足りなければ同県）の**他ブランド**を返す。
 *
 * ⚠️ 店舗ページの「他の店舗」(pickNearbyShops)と同じ回遊・クロール導線だが、
 *    返すのは店舗ではなく**ブランド**。ここを店舗のまま出すと
 *    (a) 同じブランドの支店が3枚並んで「1枚にまとめた」意味が消える
 *    (b) ブランドページから店舗ページへ送り返すリンクになる（301を入れると往復する）
 *
 * ⚠️ scope を返す理由は pickNearbyShops と同じ（F06-C）。
 *    同エリアが足りず同県へ広げたのに、見出しだけ元の地域名のままにしない。
 *
 * @param {object[]} rows 同県の店舗行（raw_data 付きの生レコードでよい）
 * @param {{area?: string|null, excludeIds?: string[], limit?: number}} opts
 *        excludeIds には**自分のブランドIDと全ルームIDの両方**を渡すこと。
 *        片方だけだと自分自身が「他のブランド」に出る。
 */
export function pickNearbyBrands(rows, { area = null, excludeIds = [], limit = 8 } = {}) {
  const exclude = new Set((excludeIds || []).filter(Boolean).map(String));
  const brands = buildBrands(Array.isArray(rows) ? rows : []).filter(
    (b) => !exclude.has(String(b.id)) && !(b.shopIds || []).some((id) => exclude.has(String(id))),
  );
  const inArea = brands.filter((b) => (b.rooms || []).some((r) => {
    const a = Array.isArray(r.area) ? r.area[0] : r.area;
    return Boolean(a) && a === area;
  }));
  const useArea = Boolean(area) && inArea.length >= 3;
  return {
    scope: useArea ? 'area' : 'prefecture',
    brands: (useArea ? inArea : brands).slice(0, limit).map((b) => ({
      id: b.id,
      name: b.name,
      areaLabel: (b.areaLabels || [])[0] || null,
      roomCount: b.roomCount || 1,
      // ⚠️ 単独店の本命URLは /shops/:id（D-014）。これを落とすと
      //    brandCanonicalPath が行き先を決められず、存在しない /brands/ へ送る。
      primaryShopId: b.primaryShopId || b.id,
    })),
  };
}

/**
 * ブランドの在籍者を「人単位」にまとめ、名簿と**実人数**を返す。
 *
 * 🚩 なぜ人数を数え直すのか（2026-09-14 本番実測）
 *    ユニゾンスパの店舗ページ（相模原1室）は「在籍 140人」、
 *    ブランドページは「セラピスト420名」＝**140人を3ルームぶん3回数えていた**。
 *    セラピストは店舗ではなくブランドに属するので、同じ咲さんを3人と数えてはいけない。
 *    すぐ下の名簿は重複除去しているのに、見出しの数字だけ3倍という状態だった。
 *
 * ⚠️ 人数は**写真の有無・在籍フラグに関わらず**数える（店舗ページの在籍数と同じ母数）。
 *
 * 【2026-09-16 写真が無い人も名簿に出すようにした】
 *  以前は写真がある行だけ並べていた。その結果、店舗ページで
 *  「在籍356人」と「全0人」が食い違う事故が起き、**写真が無い人も名前で出す**方針に決まった
 *  （okabayashi 判断。実測で112店・4,418人ぶんが一覧ゼロだった。その4,418行は
 *  非表示0・最終確認日なし0＝確認できている実在の人で、写真が無いだけだった）。
 *  ブランドページも同じ方針に揃える。写真が無い行は LazyImage が頭文字を出す。
 *
 * 🚩 同一人物が「写真なしの行」と「写真ありの行」を持つことがある。
 *    下の重複除去は**先勝ち**なので、写真が無い行が先に来ると
 *    **写真を持っている人が写真なしで表示される**。
 *    以前は「写真なしを先に弾く」ことで結果的に防げていたが、弾くのをやめた今は
 *    **並べ替えでしか防げない**。だから走査の前に写真ありを先頭へ持ってくる。
 *    ⚠️ この並べ替えを消すと、テスト「写真なしの行が先にあっても、写真ありの行で名簿に出る」が落ちる。
 */
export function buildBrandRoster(rows, { limit = 24 } = {}) {
  const people = new Set();
  const shown = new Set();
  const roster = [];
  const hasImage = (t) => Boolean(String(t?.image_url ?? '').trim());
  // 人数(people)は並び順に影響されないので、ここで並べ替えても母数は変わらない。
  const ordered = (Array.isArray(rows) ? [...rows] : [])
    .sort((a, b) => Number(hasImage(b)) - Number(hasImage(a)));
  for (const t of ordered) {
    if (!t) continue;
    // ⚠️ 2026-09-22: 退店マークの行は**人数にも**数えない。以前は人数(people)に足してから
    //    在籍判定をしていたため、名簿からは消えるのに「セラピストN名」には残っていた
    //    （店舗ページの「在籍56人／全37人」と同じ型）。同じ人が別ルームで在籍なら、そちらの行で数える。
    if (t.is_active === false) continue;
    const key = normalizeTherapistName(t.name);
    if (!key) continue;
    people.add(key);
    if (roster.length >= limit) continue;
    if (shown.has(key)) continue;
    shown.add(key);
    // ⚠️ SSRで焼いた行（shopId）と、クライアントが持つDB行（shop_id）の両方を受ける。
    //    片方だけ見ると、同じ関数を通したのにリンク先が消える。
    roster.push({ id: t.id, name: t.name || '', image_url: t.image_url || null, shopId: t.shopId ?? t.shop_id ?? null });
  }
  return { roster, personCount: people.size };
}

/**
 * 「このブランドの本命URLはどれか」を決める**唯一の場所**（D-014）。
 *
 * 🚩 ルームが2つ以上 → /brands/:brandId に1枚へ集約する。
 *    ルームが1つ    → 集約する相手がいないので /shops/:id のまま。
 *    506店が group_id を持たないので、全部をブランドURLに寄せると
 *    「同じ中身が /shops と /brands に2枚」という重複を**新しく作る**ことになる。
 *
 * ⚠️ 店舗SSRの301・サイトマップ・内部リンクは**必ずこの関数を通す**こと。
 *    別々に条件を書くと、リンクは /brands を指しているのに301は効いていない
 *    （あるいはその逆）という食い違いが静かに生まれる。
 */
/**
 * ブランドの本命URL。
 *
 * 🚩【第2引数を省いてよいのは、全店から組んだブランドのときだけ】（2026-09-16）
 *   `brand.roomCount` は**そのブランドを組んだ母集団の中での**ルーム数。
 *   エリア一覧(/area/:pref)は**その県の店だけ**でブランドを組むので、
 *   県をまたぐブランドではここが**実際より小さくなる**。
 *   実際に起きたこと: THE HALF に横浜ルーム（神奈川）を足したら、
 *   `/area/kanagawa` の roomCount が 1 になり `/shops/kanagawa_..._the_half` を指した。
 *   ところが 301 の判定（shopRedirectPath）は**全体の5ルーム**で見るので、
 *   **押した瞬間に301でブランドページへ飛ぶリンク**になっていた。
 *   ⇒ 母集団を絞ってブランドを組む画面は、`countRoomsByBrand(全店)` を第2引数に渡すこと。
 */
export function brandCanonicalPath(brand, roomCounts = null) {
  const id = brand?.id ?? '';
  const primary = brand?.primaryShopId || id;
  const fromMap = roomCounts instanceof Map ? roomCounts.get(id) : roomCounts?.[id];
  const rooms = Number(fromMap ?? brand?.roomCount);
  return rooms > 1 ? `/brands/${id}` : `/shops/${primary}`;
}

/** group_id ごとのルーム数。店舗行（id, group_id）だけあれば作れる。 */
export function countRoomsByBrand(shops) {
  const counts = new Map();
  for (const s of Array.isArray(shops) ? shops : []) {
    const gid = s?.group_id;
    if (!gid) continue;
    counts.set(gid, (counts.get(gid) || 0) + 1);
  }
  return counts;
}

/**
 * この店舗ページを301で送るべき先。送らないなら null。
 *
 * ⚠️ group_id があっても**ルームが1つしか無いなら送らない**。
 *    送ると /shops/:id と /brands/:gid の間で中身が同じページを往復させるだけになる。
 * ⚠️ ルーム数が分からないとき（Mapに無い）は**送らない**。
 *    判断材料が無いときに301を出すのは、消えていないページを消えたと宣言するのと同じ。
 */
/**
 * shopHref — 店舗行から**押しても飛ばされない**リンク先を作る。
 *
 * 【なぜ必要か（2026-09-16）】
 * 一覧やカードが `/shops/${shop.id}` を直書きしていた。D-014以降、複数ルームのブランドの
 * 店舗URLは**301でブランドページへ飛ぶ**ので、それらは**押した瞬間に飛ぶリンク**だった。
 * 実測: `/area/kanagawa` のクロール経路30本のうち**7本**がそれだった（＝約23%）。
 * `BrandResultCard` の「店舗をすべて見る」に至っては、**ブランドのルーム一覧なので全部**が該当し、
 * 「押す → 301 → さっきと同じページ」の往復になる
 * （ブランドページ側では既に同じ事故を止めている＝check_indexability_guards の brandPage2）。
 *
 * ⚠️ 判定は `shopRedirectPath` に一本化する。ここで別の条件を書くと301の実装と食い違う。
 * ⚠️ `roomCounts` は**全店**から作ること（県や検索結果で切った母集団だと1ルームに見える）。
 */
/**
 * normalizeFieldValue — ルーム間で値が同じかを見るための「ならし」。
 *
 * 🚩【表記ゆれを衝突と数えない】（2026-09-19 実測）
 *   100ブランドを数えたら、割れているように見えたものの多くが**書き方の違いだけ**だった。
 *     公式URL   `https://aroma-ella.com` と `https://aroma-ella.com/`（末尾スラッシュだけ）
 *     出勤URL   `code4030.com/schedule/` と `code4030.com/schedule`（同上）
 *     営業時間  `10:00~翌5:00` と `10:00〜翌5:00`（波ダッシュだけ）
 *   ならさずに数えると、公式URLの衝突が14%に見えるが、実際に別ドメインなのはごく一部。
 *   ⚠️ ここを緩めすぎない。`90分19,000円~` と `90分20,000円~` は**本当に違う**ので残すこと。
 */
export function normalizeFieldValue(v) {
  return String(v ?? '')
    .normalize('NFKC')
    .replace(/[〜～]/g, '~')
    .replace(/\s+/g, '')
    .replace(/\/+$/, '')
    .trim();
}

/**
 * brandCommonValue — ブランドの全ルームで、その項目が揃っているかを返す。
 *
 * 【方針（2026-09-19 オーナー決定）】**揃っていれば1つ出す。割れていれば「ルームにより異なります」と出す。**
 *   割れているのに1つだけ選んで出すのは、根拠のない値を画面に出すのと同じ（D-010の考え方）。
 *
 * @returns {{status:'same'|'varies'|'none', value: string|null, count: number}}
 *   same  … 全ルームで同じ（value に原文を返す）
 *   varies… 2種類以上ある（value は null。画面は「ルームにより異なります」と出す）
 *   none  … どのルームにも値が無い（画面は何も出さない）
 */
export function brandCommonValue(rooms, get) {
  const raw = (Array.isArray(rooms) ? rooms : []).map((r) => {
    try { return get(r); } catch { return null; }
  });
  const pairs = raw
    .map((v) => ({ raw: v, key: normalizeFieldValue(v) }))
    .filter((p) => p.key);
  const keys = [...new Set(pairs.map((p) => p.key))];
  if (keys.length === 0) return { status: 'none', value: null, count: 0 };
  if (keys.length === 1) return { status: 'same', value: pairs[0].raw, count: 1 };
  return { status: 'varies', value: null, count: keys.length };
}

export function shopHref(shop, roomCounts) {
  return shopRedirectPath(shop, roomCounts) || `/shops/${shop?.id ?? ''}`;
}

export function shopRedirectPath(shop, roomCounts) {
  const gid = shop?.group_id;
  if (!gid) return null;
  const n = roomCounts instanceof Map ? roomCounts.get(gid) : roomCounts?.[gid];
  if (!(Number(n) > 1)) return null;
  return `/brands/${gid}`;
}
