/**
 * inspect_incomplete_area.mjs — エリアが「空」でも「食い違い」でもなく、**足りない**店を数える（読むだけ）
 *
 * 【なぜ必要か（2026-09-21）】
 * `/search?q=赤羽` の結果に**池袋の店が2件**混ざっていた。
 *   むちむちお姉さん      エリア=池袋 ／ 住所=「東京都内各エリア（池袋・秋葉原・赤羽・大井町・五反田・立川）」
 *   美・セラ極～KIWAMI～  エリア=池袋 ／ 住所=「東京都内各エリア（池袋・赤羽・大塚・巣鴨）」
 * 住所の括弧に**ブランドの全ルームの地名**が並んでいる。検索は住所も見るので当たるが、
 * カードには「📍池袋 豊島区」しか出ないので、**利用者には「なぜ赤羽で池袋の店が出たのか」が分からない**。
 * 逆に、赤羽にルームがあるのに**エリアとしては赤羽で探せない**。
 *
 * 【どの道具も見ていなかった】
 *   エリアが空       → inspect_missing_area の対象（73件）
 *   エリアが食い違い → inspect_area_address_mismatch の対象（127件）
 *   エリアが足りない → **どちらの対象でもない**（エリアは空でないし、エリア名は住所に出てくる）
 * 「空」と「食い違い」の間に、この型がある。
 *
 * 【地名を発明しない】
 * ⚠️ 挙げるのは**住所に literally 書かれている**地名だけ。地名辞書は持たない。
 * ⚠️ 都道府県・区市郡町村で終わる語は挙げない（エリア欄は町名・駅名を入れる欄で、
 *    区名は `city` が持っている。区名を混ぜると「📍池袋 豊島区 新宿区 渋谷区」のようになる）。
 * ⚠️ 出すのは**候補**。`update_shop_location.mjs` に渡す前に公式サイトで確かめること。
 *
 * 実行:
 *   node scripts/maintenance/inspect_incomplete_area.mjs
 *   node scripts/maintenance/inspect_incomplete_area.mjs --tsv=outputs/data-fixes/incomplete-area.tsv
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const norm = (v) => String(v ?? '').normalize('NFKC').replace(/\s+/g, '');
// ⚠️ 「町」「村」を外してはいけない。**大井町・御徒町・人形町・神保町**は行政区画ではなく
//    駅名・地名で、まさに area 欄に入るもの。2026-09-21、自己診断が「大井町」の消失で捕まえた。
// ⚠️ 「町」「村」を外してはいけない。**大井町・御徒町・人形町・神保町**は行政区画ではなく
//    駅名・地名で、まさに area 欄に入るもの。2026-09-21、自己診断が「大井町」の消失で捕まえた。
const ADMIN_SUFFIX = /[都道府県区市郡]$/;

/** 都道府県名そのもの（接尾辞なしで書かれることがある: 「東京・神奈川エリア」） */
const PREF_STEMS = ['北海道','青森','岩手','宮城','秋田','山形','福島','茨城','栃木','群馬','埼玉','千葉','東京','神奈川','新潟','富山','石川','福井','山梨','長野','岐阜','静岡','愛知','三重','滋賀','京都','大阪','兵庫','奈良','和歌山','鳥取','島根','岡山','広島','山口','徳島','香川','愛媛','高知','福岡','佐賀','長崎','熊本','大分','宮崎','鹿児島','沖縄'];
const PREF_HEAD = new RegExp(`^(?:${PREF_STEMS.join('|')})[都道府県]`);

/** 地名ではない語。⚠️ 実データで出たものだけを足す（想像で足さない）。 */
const NOT_A_PLACE = /^(サロン|出張|各エリア|エリア|詳細|予約時|最寄|周辺|近郊|全域|他|など|等|完全個室|要確認)$/;
/** 「大阪市内」「東京都内」「23区内」のような**範囲の言い方**。地名ではない。 */
const IS_SCOPE = /[都道府県市区郡町村]内$/;

/**
 * 住所に**並んでいる**地名を取り出す。括弧の中と本体の両方を見る。
 * ⚠️ 単独の地名は取らない（2つ以上並んでいるときだけ）。
 *    「東京都北区赤羽」から「赤羽」を取ると、ほぼ全店が候補になって使えない。
 *    ここで探しているのは**列挙**＝ブランドが自分のルームを並べている形。
 */
export function listedPlaces(address) {
  const a = norm(address);
  const chunks = [];
  for (const m of a.matchAll(/[(（]([^)）]*)[)）]/g)) chunks.push(m[1]);
  chunks.push(a.replace(/[(（][^)）]*[)）]/g, ''));
  const out = [];
  for (const c of chunks) {
    // 🚩 「最寄: A・B・C」「(A駅・B駅・C駅)」は**1ルームの最寄駅が並んでいるだけ**のことがある。
    //    ルームの列挙と区別が要る。2026-09-21、AromaCharm（住所は新宿3丁目のピンポイント）に
    //    「新宿・代々木」を足しかけた＝**代々木で探した人に新宿3丁目の店が出る**ことになる。
    const parts = c.split(/[・/／、]/).map((t) => t.trim()).filter(Boolean);
    // ⚠️ 「駅」の字が1つでもあれば最寄、ではない。**名駅**（名古屋駅前）は地名で、
    //    名古屋の店が軒並み「最寄駅の並び」に誤判定された（2026-09-21、実データで発覚）。
    //    最寄の並びは「全部の語が駅で終わる」形（池袋駅・高田馬場駅・新宿駅）。
    const isNearbyChunk = /最寄/.test(c) || (parts.length >= 2 && parts.every((t) => /駅$/.test(t)));
    if (parts.length < 2) continue;                       // 並んでいないものは見ない
    for (const p of parts) {
      let t = p;
      // ⚠️ 都道府県は**先頭が県名のときだけ**落とす。`^.*?[都道府県]` にすると
      //    「さいたま新都心駅」の“都”で切って「心駅」という屑が出る（2026-09-21に実際に出た）。
      t = t.replace(PREF_HEAD, '');
      t = t.replace(/^(最寄駅?[:：]?)/, '');
      t = t.replace(/エリア.*$/, '').replace(/[0-9０-９].*$/, '')
           .replace(/(各線|駅近|各エリア|など|等)$/, '').trim();
      t = t.replace(/駅$/, '');                            // 「浜松町駅」→「浜松町」
      if (t.length < 2) continue;
      if (NOT_A_PLACE.test(t) || IS_SCOPE.test(t)) continue;
      if (PREF_STEMS.includes(t)) continue;                // 「東京」「神奈川」は area 欄のものではない
      if (ADMIN_SUFFIX.test(t)) continue;                  // 区市郡は city が持つ
      // ⚠️ 「々」は漢字の範囲(一-龥)に入っていない繰り返し記号。入れ忘れると
      //    **代々木・佐々木・野々市**が丸ごと落ちる。2026-09-21、実データで代々木が消えていた。
      //    長音「ー」も カタカナ範囲(ァ-ヶ) の外（ヶ丘・センター南 等のため入れる）。
      if (!/^[ぁ-んァ-ヶー一-龥々]+$/.test(t)) continue;
      if (!out.some((o) => o.place === t)) out.push({ place: t, nearby: isNearbyChunk });
    }
  }
  return out;
}

/** 住所の本体（括弧の外）が**いくつの区市**を並べているか。2つ以上なら複数ルームの印。 */
export function wardCount(address) {
  const body = norm(address).replace(/[(（][^)）]*[)）]/g, '');
  return (body.match(/[^\s・/／]{1,6}?[区市](?=[・/／]|$|[^内])/g) || []).length;
}

/** 住所に並んでいるのに area に無い地名を返す */
export function missingFromArea(areaList, address) {
  const have = areaList.map(norm);
  return listedPlaces(address)
    .filter((p) => !have.some((h) => h.includes(p.place) || p.place.includes(h)))
    .map((p) => p.place);
}

/**
 * 「1ルームなのに最寄駅が並んでいるだけ」か。
 * 住所の本体が区市を2つ以上並べていれば複数ルーム、そうでなくて候補が全部
 * 最寄チャンク由来なら**足してはいけない**（その地名で探した人に別の街の店が出る）。
 */
export function isNearbyStationsOnly(areaList, address) {
  const have = areaList.map(norm);
  const cand = listedPlaces(address).filter((p) => !have.some((h) => h.includes(p.place) || p.place.includes(h)));
  if (!cand.length) return false;
  if (wardCount(address) >= 2) return false;
  return cand.every((p) => p.nearby);
}

function selfTest() {
  const cases = [
    ['東京都内各エリア（池袋・秋葉原・赤羽・大井町・五反田・立川）', ['池袋'], ['秋葉原', '赤羽', '大井町', '五反田', '立川']],
    ['東京都内各エリア（池袋・赤羽・大塚・巣鴨）', ['池袋'], ['赤羽', '大塚', '巣鴨']],
    // 並んでいない住所からは取らない（ほぼ全店が候補になってしまう）
    ['東京都北区赤羽', ['赤羽'], []],
    ['東京都渋谷区恵比寿南1丁目5', ['恵比寿'], []],
    // 区名は area 欄のものではない（city が持っている）
    ['東京都豊島区・新宿区・渋谷区 (各線駅近)', ['歌舞伎町'], []],
    // すでに area にある地名は挙げない
    ['東京都内各エリア（池袋・赤羽）', ['池袋', '赤羽'], []],
    // 🚩 「町」で終わる地名を消さない（大井町・御徒町・人形町…）。初版はここで大井町を落とした。
    ['東京都内（大井町・御徒町・人形町）', ['五反田'], ['大井町', '御徒町', '人形町']],
    // 🚩 2026-09-21、40件を実際に出して見つけた屑。**全部これで落とす。**
    //    「さいたま新都心駅」の“都”で切って「心駅」が出た＝県名は先頭のときだけ落とす
    ['埼玉県さいたま市中央区（北与野駅・さいたま新都心駅）', ['さいたま新都心', '北与野'], []],
    ['東京都23区内（サロン・出張）', ['23区'], []],                    // 地名ではない語
    ['東京・神奈川エリア（詳細は予約時）', ['武蔵小杉'], []],            // 県名は area 欄のものではない
    ['大阪市内・堺市エリア', ['梅田'], []],                              // 「市内」「堺市」は落とす
    ['大阪府下各エリア（吹田・高槻・市内）', ['梅田'], ['吹田', '高槻']], // 「市内」だけ落ちる
    ['東京都港区芝（最寄駅：田町駅・浜松町駅）', ['田町'], ['浜松町']],   // 「駅」を外す
    // 🚩 「々」は漢字の範囲に入っていない。代々木が落ちていた（実データで発覚）。
    ['東京都品川区・新宿区・渋谷区 (最寄: 五反田・新宿三丁目・代々木)', ['五反田'], ['新宿三丁目', '代々木']],
  ];
  const bad = [];
  for (const [addr, area, want] of cases) {
    const got = missingFromArea(area, addr);
    if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(`「${addr}」→ [${got}]（期待 [${want}]）`);
  }
  // 🚩 「1ルームの最寄駅が並んでいるだけ」の判定も測る。ここを外すと
  //    **代々木で探した人に新宿3丁目の店が出る**（2026-09-21、実際に足しかけた）。
  const nearbyCases = [
    // 住所の本体が1か所（新宿3丁目）＝1ルーム。並んでいるのは最寄駅 → 足さない
    ['東京都新宿区新宿3丁目 (最寄: 新宿三丁目・新宿・代々木)', ['歌舞伎町'], true],
    // 住所の本体が豊島区だけ＝1ルーム。池袋駅・高田馬場駅・新宿駅は最寄 → 足さない
    ['東京都豊島区 (池袋駅・高田馬場駅・新宿駅)', ['池袋'], true],
    // 本体が3つの区＝複数ルーム → 足す
    ['東京都品川区・新宿区・渋谷区 (最寄: 五反田・新宿三丁目・代々木)', ['五反田'], false],
    // ルームの列挙であって最寄ではない → 足す
    ['東京都内各エリア（池袋・秋葉原・赤羽・大井町・五反田・立川）', ['池袋'], false],
    // 🚩 「名駅」は地名（名古屋駅前）。駅の字があるだけで最寄扱いにしない。
    //    これで名古屋の店が軒並み誤判定されていた。
    ['愛知県名古屋市（名駅・栄・伏見・金山・千種・今池）', ['栄'], false],
    ['愛知県名古屋市（名駅・高岳エリア）', ['名駅'], false],
  ];
  for (const [addr, area, want] of nearbyCases) {
    const got = isNearbyStationsOnly(area, addr);
    if (got !== want) bad.push(`最寄判定「${addr}」→ ${got}（期待 ${want}）`);
  }

  if (bad.length) {
    console.error('❌ 取り出し方の自己診断に失敗しました。一覧は出しません:');
    for (const b of bad) console.error('   - ' + b);
    process.exit(1);
  }
}
selfTest();

async function allShops() {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('shops').select('id, name, group_id, raw_data').range(from, from + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

const shops = await allShops();

// 🚩 ルーム数で扱いが変わる（2026-09-16 に決めた線）。
//    ・レコードが1件しかないブランド → **全ルームの地名を持たせる**。
//      持たせないと、そのブランドは他のルームの地名で検索しても出てこない。
//    ・レコードが複数あるブランド     → **各レコードは自分のルームの地名だけ**。
//      全部に足すと、カードが「新宿 立川 八王子 新宿三丁目」と並んで読めなくなる
//      （brandGroups.js に「ここに全ルームぶんを詰めると読めなくなる」と書いてある、その形）。
const roomCount = new Map();
for (const s2 of shops) {
  const key = s2.group_id || s2.id;
  roomCount.set(key, (roomCount.get(key) || 0) + 1);
}

const hits = [];
for (const s of shops) {
  const r = s.raw_data || {};
  const areaList = (Array.isArray(r.area) ? r.area : [r.area]).filter(Boolean).flatMap((a) => norm(a).split(/[・|]/)).filter(Boolean);
  const address = String(r.address ?? '').trim();
  if (!areaList.length || !address) continue;         // 空は inspect_missing_area の担当
  const missing = missingFromArea(areaList, address);
  if (!missing.length) continue;
  const nearbyOnly = isNearbyStationsOnly(areaList, address);
  hits.push({
    id: s.id, name: s.name, group_id: s.group_id, area: areaList.join('・'), address, missing,
    rooms: roomCount.get(s.group_id || s.id) || 1,
    nearbyOnly,
  });
}

hits.sort((a, b) => b.missing.length - a.missing.length);
const solo = hits.filter((h) => h.rooms <= 1 && !h.nearbyOnly);
const multi = hits.filter((h) => h.rooms > 1);
const nearbyOnly = hits.filter((h) => h.rooms <= 1 && h.nearbyOnly);

console.log(`全 ${shops.length}店 / **エリアが足りない疑い** ${hits.length}件`);
console.log('（住所に地名が並んでいるのに、その地名が area に無い）\n');

console.log(`━━ ① レコードが1件のブランド … ${solo.length}件（**足す対象**）━━`);
console.log('   持たせないと、そのブランドは他のルームの地名で検索しても出てこない。\n');
for (const h of solo) {
  console.log(`  ${h.id}`);
  console.log(`     ${h.name}${h.group_id ? ` [${h.group_id}]` : ''}`);
  console.log(`     いまのエリア: ${h.area}   ／   住所: ${h.address}`);
  console.log(`     → 足す候補: ${h.missing.join('・')}`);
}

console.log(`\n━━ ② レコードが複数あるブランド … ${multi.length}件（**足さない**）━━`);
console.log('   各レコードが自分のルームの地名を持っている。住所の並びはブランド共通の宣伝文。');
console.log('   全部に足すとカードが「新宿 立川 八王子 新宿三丁目」と並んで読めなくなる。');
console.log('   ⚠️ ただし**ルーム数よりレコードが少ない**ブランドは、足りない分を誰かが持つ必要がある。');
console.log('      そこは1件ずつ人が決める（自動では分からない）。\n');
for (const h of multi) {
  console.log(`  ${h.id}  [${h.rooms}レコード]`);
  console.log(`     ${h.name} … いまのエリア「${h.area}」／ 住所に他にある: ${h.missing.join('・')}`);
}

console.log(`\n━━ ③ 1ルームの最寄駅が並んでいるだけ … ${nearbyOnly.length}件（**足さない**）━━`);
console.log('   住所の本体が1か所を指していて、並んでいるのは最寄駅。足すと');
console.log('   **その地名で探した人に、別の街の店が出る**。\n');
for (const h of nearbyOnly) {
  console.log(`  ${h.id}`);
  console.log(`     ${h.name} … いまのエリア「${h.area}」／ 住所: ${h.address}`);
  console.log(`     （最寄として並んでいる: ${h.missing.join('・')}）`);
}

const tsvArg = process.argv.find((a) => a.startsWith('--tsv='));
if (tsvArg) {
  const out = tsvArg.slice('--tsv='.length);
  fs.mkdirSync(out.replace(/\/[^/]+$/, ''), { recursive: true });
  const lines = [
    '# エリアが足りない店の**下書き**（inspect_incomplete_area.mjs が生成）',
    '# ⚠️ そのまま適用しないこと。住所の括弧に並んでいる地名を足しただけで、',
    '#    その店が本当にそこにルームを持つか確認したものではない。公式サイトで1件ずつ確かめること。',
    '# ⚠️ 先頭の地名がエリア一覧(/area/:pref)の振り分けに使われる。いまの先頭を維持してある。',
    '# 形式: <shop_id>\t<都道府県>\t<市区>\t<エリア>\t<住所>   （- はその項目を変更しない）',
    // ⚠️ ①（レコード1件）だけを書き出す。複数レコードのブランドは人が決める。
    ...solo.map((h) => `${h.id}\t-\t-\t${[...h.area.split('・'), ...h.missing].join('|')}\t-`),
  ];
  fs.writeFileSync(out, lines.join('\n') + '\n');
  console.log(`\n📦 ${out} に①段 ${solo.length}件を下書きしました（**要確認**）`);
}
