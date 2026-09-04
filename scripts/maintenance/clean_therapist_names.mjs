/**
 * セラピスト名のノイズを掃除する
 *
 * 【背景（2026-09-04 実測）】
 *   relax tokyo の修復中に、セラピスト名の品質問題が全店規模で見つかった。
 *     - セラピストではないレコード: 「新人」「新人割」「船橋M☆お得情報☆」
 *       「大阪のメンズエステと出張マッサージが厳選掲載！アロマパンダ通信」（他サイトへのリンクバナー）
 *     - 人名に装飾が付いたもの: 「一ノ瀬くるみ（体験入店割）」「大型新人☆小春ねいろ」
 *       「高橋未来⭐︎愛嬌満点誠実美女」「もも【プレミアム】」「佐々木りんか♦︎」
 *
 * 【設計方針】
 *   ⚠️ 機械的な一括置換で名前を壊さないこと。★は「装飾」と「名前の一部」の両方に使われる
 *      （例: relax tokyo の「☆早乙女　リズ」は公式表記が☆付き＝触ってはいけない）。
 *   → 確実に判定できるものだけ処理し、迷うものは「要確認」として出力するだけにする。
 *
 * 使い方: node scripts/maintenance/clean_therapist_names.mjs [--live]
 *   既定は dry-run（変更なし・before/afterを全件表示）。
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const LIVE = process.argv.includes('--live');

// ── セラピストではないもの（レコードごと削除）──
const NOT_A_PERSON = [
  /^(新人|新人割|体験入店|体験入店割|ただいま新人|只今新人|割引|キャンペーン|本日出勤|出勤情報|WEB予約|お知らせ|募集)$/,
  /(メンズエステ|メンエス|マッサージ).{0,20}(ナビ|navi|通信|掲載|厳選|探すなら)/i,  // 他サイトへのリンクバナー
  /お得情報/,
  /^[0-9]+$/,
  // ⚠️ 以下は dry-run の実出力から追加（人名ではないのに「改名」に分類されていた）
  /お休み|感謝祭|出張エステ|入店$|セラピ$/,          // 「♢本日お休みです♢」「✨エデン感謝祭✨」「新人セラピ」
  /^[◆◇♦♢★☆⭐✨\s]*[A-Za-z]?\s*ルーム/,           // 「◆ Aルーム ◆」
  /^[★☆⭐✨\s]*(極液|オプション|コース|指名料)/,      // 「★★極液★★」
  /(こちらから|こちらへ|はこちら)/,                    // 「【大宮店はこちらから】」＝他店へのリンク
];

// ⚠️ 名前とキャッチコピーが**区切り記号なしで連結**しているもの。
//    「ふうか漂うオトナの香り♡」の♡だけ取っても「ふうか漂うオトナの香り」が残り意味がない。
//    どこまでが名前かは機械では判定できないので**触らない**（中途半端に変えると後で直しづらい）。
const COPY_WORDS = /(お姉さん|カップ|癒し系|美女|ハーフ|天然|爆乳|香り|施術|スレンダー|綺麗系|極上|アイドル|Wセラピ|セラピ♡)/;

// ⚠️ 「⭐︎」は ⭐(U+2B50) + 異体字セレクタ(U+FE0E) の**2文字**。
//    文字クラスに素で入れると VS が独立した1文字として扱われ、
//    「華⭐︎プレミア…」が「華⭐」で切れる（実際にこのバグを踏んだ）。
//    → 記号のあとに ️? ︎? を明示的に付ける。
const DECO = '[♦♢◆◇⭐☆★♡♥❤✨]\\uFE0E?\\uFE0F?';

// ── 末尾に付いた装飾（人名の後ろ）──
const TRAILING = [
  /[（(](新人割|体験入店割|体入割|新人|体験入店|プレミアム|premium)[）)]\s*$/i,
  /[【\[](.*?)[】\]]\s*$/,                    // 「もも【プレミアム】」
  new RegExp(`(?:${DECO})+\\s*$`),            // 「佐々木りんか♦︎」
  /※.*$/,                                     // 「うみ（Umi）※大塚、巣鴨」
];

// ── 先頭に付いた装飾（この後ろが人名）──
// ⚠️ 「新人割対応 笹山」を「新人」だけ剥がすと「割対応 笹山」になる。
//    長いものから順に並べ、必ず最長一致させること。
const LEADING = [
  // 「【新人】 三井 かおり」＝ 括弧が**先頭**に来るパターン。TRAILING は末尾しか見ないので別途必要。
  /^[【\[](新人|体験入店|新人割|NEW|新)[】\]][　\s]*/i,
  new RegExp(`^(新人割対応|大型新人|ただいま新人|只今新人|体験入店|新人)[　\\s\\-]*(?:${DECO})*[　\\s\\-]*`),
];

// 先頭装飾を剥がしたあと末尾に残るスペック表記（「新人-なお身長」→「なお身長」対策）
const TRAILING_SPEC = [
  new RegExp(`(?:${DECO})?[0-9]*\\s*(身長|体重|スリーサイズ|T\\.?[0-9]+)\\s*$`),
];

// ★の前が人名・後ろがキャッチコピーのパターン（例「高橋未来⭐︎愛嬌満点誠実美女」）
// ⚠️ 後ろが4文字以上のときだけ。短い★は名前の一部の可能性があるため触らない
//    （例「朝比奈★あさひな」は読み仮名なので手を出さない）。
const CATCHCOPY = new RegExp(`^(.{1,8}?)(?:${DECO})(.{4,})$`);

function classify(name) {
  const original = name;
  // ⚠️ 削除判定の前にスペック語を見る。
  //    「あかりⅠカップセラピ」は `セラピ$` に当たるが**実在の人名「あかり」を含む**。
  //    人名を含むレコードを消すと実在のセラピストがサイトから消える（dry-runで発見）。
  const hasCopyWord = COPY_WORDS.test(name);
  if (!hasCopyWord && NOT_A_PERSON.some(re => re.test(name))) return { action: 'delete' };

  let s = name;
  let changed = false;

  for (const re of LEADING) {
    const next = s.replace(re, '');
    if (next !== s && next.trim().length >= 2) { s = next; changed = true; }
  }
  // 先頭装飾を剥がした場合のみ、末尾のスペック表記も落とす（「新人-なお身長」→「なお」）
  if (changed) {
    for (const re of TRAILING_SPEC) {
      const next = s.replace(re, '');
      if (next !== s && next.trim().length >= 1) s = next;
    }
  }
  for (const re of TRAILING) {
    const next = s.replace(re, '');
    if (next !== s && next.trim().length >= 2) { s = next; changed = true; }
  }

  // ★等で名前とコピーが区切られていれば分離できる（「高橋未来⭐︎愛嬌満点誠実美女」→「高橋未来」）
  let splitByDeco = false;
  const m = s.match(CATCHCOPY);
  if (m) {
    const head = m[1].trim();
    const tail = m[2];
    // 後ろが宣伝文句っぽい（記号・煽り語を含む or 長い）ときだけ前を採用する
    if (/[‼!♪✨]|似$|入店|降臨|美女|アイドル|天使|新人/.test(tail) || tail.length >= 6) {
      if (head.length >= 1) { s = head; changed = true; splitByDeco = true; }
    }
  }

  // ⚠️ 区切り記号が無く、名前とキャッチコピーが地続きのものは分離不能なので触らない
  //    （「ふうか漂うオトナの香り♡」の♡だけ取っても意味がない）。
  //    上で分離できたものは既に名前だけになっているので対象外。
  if (!splitByDeco && COPY_WORDS.test(s)) return { action: 'keep' };

  // 切り出した結果の端に装飾記号が残っていたら落とす（「華⭐」対策）
  // ⚠️ 何も変更していない名前には触らない。「☆早乙女　リズ」のように
  //    公式表記として☆が付いている名前を勝手に削らないため。
  if (changed) {
    s = s.replace(new RegExp(`^(?:${DECO}|[　\\s])+`), '')
         .replace(new RegExp(`(?:${DECO}|[　\\s])+$`), '');
  }
  s = s.replace(/\s{2,}/g, ' ').trim();
  // ⚠️ 1文字の源氏名は実在する（例「華」）ので長さ2で切らない。
  //    ただし短くなるほど誤爆の影響が大きいので、dry-runでの目視確認を必須とする。
  if (!changed || s === original || s.length < 1) return { action: 'keep' };
  // 変換後も中間に装飾記号が残るものは中途半端なので触らない
  // （「めろん♡NH♡」→「めろん♡NH」は改善になっていない）
  if (new RegExp(DECO).test(s)) return { action: 'keep' };
  return { action: 'rename', to: s };
}

async function fetchAll() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    // ⚠️ PostgRESTのmax-rowsは既定1000。range()でページングしないと静かに欠落する（lessons.md）
    const { data, error } = await supabase
      .from('therapists').select('id, name, shop_id, image_url').range(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all;
}

async function main() {
  console.log(`\n=== セラピスト名の掃除 ${LIVE ? '(本実行)' : '(DRY-RUN)'} ===\n`);
  const rows = await fetchAll();
  console.log(`対象: ${rows.length}名を検査\n`);

  const dels = [], renames = [];
  for (const r of rows) {
    const c = classify(r.name || '');
    if (c.action === 'delete') dels.push(r);
    else if (c.action === 'rename') renames.push({ ...r, to: c.to });
  }

  // 口コミから参照されているものは絶対に消さない・改名もIDは変えない
  const { data: refs } = await supabase.from('reviews').select('therapist_id');
  const referenced = new Set((refs || []).map(x => x.therapist_id));
  const delSafe = dels.filter(d => !referenced.has(d.id));
  const delBlocked = dels.filter(d => referenced.has(d.id));

  console.log(`── 削除（セラピストではないレコード）: ${delSafe.length}件 ──`);
  delSafe.forEach(d => console.log(`  ✕ "${d.name}"  [${d.shop_id}]`));
  if (delBlocked.length) {
    console.log(`  ⚠️ 口コミ参照があるため削除しない: ${delBlocked.map(d => d.name).join(', ')}`);
  }

  console.log(`\n── 改名（装飾の除去）: ${renames.length}件 ──`);
  renames.forEach(r => console.log(`  "${r.name}"  →  "${r.to}"`));

  if (!LIVE) {
    console.log(`\n※ dry-run です。内容を確認して問題なければ --live を付けて実行してください。`);
    console.log(`   ⚠️ 上の一覧に「これは名前の一部だ」というものが混じっていないか必ず目視すること。\n`);
    return;
  }

  if (delSafe.length) {
    const { error } = await supabase.from('therapists').delete().in('id', delSafe.map(d => d.id));
    if (error) throw new Error('削除失敗: ' + error.message);
    console.log(`\n✅ ${delSafe.length}件を削除`);
  }
  let ok = 0;
  for (const r of renames) {
    // ⚠️ id は変えない（口コミが therapist_id で参照している／URLも変わってしまう）
    const { error } = await supabase.from('therapists').update({ name: r.to }).eq('id', r.id);
    if (error) { console.log(`  ❌ ${r.name}: ${error.message}`); continue; }
    ok++;
  }
  console.log(`✅ ${ok}件を改名`);
  console.log(`\n=== 完了 ===\n`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
