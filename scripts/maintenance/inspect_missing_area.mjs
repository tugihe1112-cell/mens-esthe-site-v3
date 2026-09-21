/**
 * inspect_missing_area.mjs — エリアが空の店を洗い出す（読むだけ）
 *
 * 【なぜ必要か（2026-09-21）】
 * `inspect_area_address_mismatch.mjs` は `areas.length === 0` を**読み飛ばす**作りで、
 * **エリアが空の店を1件も見ていなかった**。食い違いを127件数えている横で、空欄を0件数えていた。
 * D-014で店舗ページをブランド1枚に畳んだ今、**支店レコードが存在する理由は地名だけ**。
 * エリアが空の店は、エリア一覧(/area/:pref)の振り分けにも、地名検索にも乗らない。
 * ⇒ 食い違い（98%が誤検知だった）より、**空欄のほうが確実な欠落**である可能性が高い。
 *
 * 【この道具の作り】
 * ⚠️ **地名を発明しない。** 提案する地名は、その店の**名前か住所に実際に書かれている文字列**だけ。
 *    外部の地名辞書は持たない（持つと「それらしいが根拠のない値」を書き込む道具になる）。
 * ⚠️ 出すのは**候補**であって修正値ではない。`update_shop_location.mjs` に渡す前に、
 *    必ず公式サイトで確かめること（一覧に載っている・名前が引ける・200が返る、はどれも根拠にならない）。
 *
 * 【段】
 *   ① 名前と住所の**両方**に同じ地名が出る … 手がかりが強い
 *   ② 住所からしか取れない               … 要確認
 *   ③ 手がかりが無い                     … 公式サイトを見るしかない
 *
 * 実行:
 *   node scripts/maintenance/inspect_missing_area.mjs
 *   node scripts/maintenance/inspect_missing_area.mjs --tsv=outputs/data-fixes/missing-area.tsv
 *     … ①だけを update_shop_location.mjs が読める形で下書きする（**そのまま適用しないこと**）
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

const norm = (v) => String(v ?? '').normalize('NFKC').replace(/\s+/g, '');

/** 住所から「都道府県」と「市区郡町村」を落として、残った先頭の地名らしい部分を返す。 */
function placeFromAddress(address) {
  let a = norm(address);
  a = a.replace(/^.*?[都道府県]/, '');           // 東京都 / 大阪府 …
  a = a.replace(/^.*?[市区郡]/, '');              // 目黒区 / 名古屋市 …（先頭のひとつだけ）
  // 「エリア」「(…)」「1丁目」以降を落とす
  a = a.replace(/[(（].*$/, '').replace(/エリア.*$/, '').replace(/[0-9０-９].*$/, '')
       .replace(/(丁目|番地|駅).*$/, '');
  a = a.replace(/[・/／].*$/, '');                // 「中央区・淀川区」のような列挙は先頭だけ
  return a.length >= 2 ? a : '';
}

/**
 * 住所から**注記の括弧を落とす**。
 * ⚠️ 2026-09-21: 括弧の中まで見ていたせいで、
 *    `東京都目黒区上目黒（港区エリアからもアクセス良好）` の店に候補「港区」を出した。
 *    括弧の中は「そこからも来やすい」であって**所在地ではない**。
 */
const stripNotes = (address) => norm(address).replace(/[(（][^)）]*[)）]/g, '');

/** 市区の欄が「区・市・郡・町・村」で終わらない＝町名を直接書いている（例: 中目黒 / 新大久保） */
const cityLooksLikePlace = (city) => {
  const c = norm(city);
  return c.length >= 2 && !/[区市郡町村]$/.test(c);
};

/** 名前と住所（注記を除く）の両方に出てくる2文字以上の塊。無ければ空文字。 */
function placeInBothNameAndAddress(name, address) {
  const n = norm(name), a = stripNotes(address);
  let best = '';
  for (let len = Math.min(6, n.length); len >= 2; len--) {
    for (let i = 0; i + len <= n.length; i++) {
      const t = n.slice(i, i + len);
      if (/^[ぁ-んァ-ヶ一-龥]{2,}$/.test(t) && a.includes(t) && t.length > best.length) best = t;
    }
    if (best) break;
  }
  return best;
}

/**
 * 候補を1つ決める。**強い根拠から順に見て、無ければ出さない。**
 *  ① 市区の欄が町名そのもので、名前か住所にも出てくる（例: 中目黒 / 新大久保）
 *  ② 名前と住所の両方に同じ地名が出てくる（例: 赤羽 / 国分寺）
 *  ⚠️ 住所が「立川・赤羽・荻窪エリア」のように**並んでいる**ときは、どれか選べない。
 *     id はローマ字、市区は「北区」で、どのルームかを教えてくれない。
 *     ⇒ **推測しない。**③（手がかり無し）へ落として人に見せる。
 *     2026-09-21、先頭を取って北区の店に「立川」を出しかけた。
 */
function candidateFor(shop, raw) {
  const address = String(raw.address ?? '').trim();
  const city = raw.city || '';
  if (cityLooksLikePlace(city)) {
    const c = norm(city);
    if (norm(shop.name).includes(c) || norm(address).includes(c)) return { value: c, why: '市区の欄が町名で、名前か住所にも出てくる' };
  }
  if (!address) return { value: '', why: '' };
  const listedCount = stripNotes(address).replace(/^.*?[都道府県]/, '').replace(/エリア.*$/, '').split(/[・/／]/).filter((t) => t.trim().length >= 2).length;
  if (listedCount > 1) return { value: '', why: '' };   // 並んでいる＝選べない
  const both = placeInBothNameAndAddress(shop.name, address);
  if (both) return { value: both, why: '名前と住所の両方に出てくる' };
  return { value: '', why: '' };
}

/**
 * 拾い方の自己診断。**DBに触る前**に走らせる。
 * ⚠️ 中身は2026-09-21に**実際に間違えた2件**と、正しく出た4件。
 *    壊れた拾い方で一覧を出すくらいなら、何も出さないほうが害が小さい。
 */
function selfTestCandidate() {
  const cases = [
    // 実際に間違えた: 括弧の中の「港区」は注記であって所在地ではない
    [{ id: '60210', name: 'Aroma Blossom (港区・中目黒)' },
     { city: '中目黒', address: '東京都目黒区上目黒（港区エリアからもアクセス良好）' }, '中目黒'],
    // 実際に間違えた: 住所に3つ並んでいる。どれかは id も市区も教えてくれない ⇒ 出さない
    [{ id: 'tokyo_kita_crest_spa_tokyo', name: 'CREST SPA TOKYO (クレストスパ)' },
     { city: '北区', address: '東京都立川・赤羽・荻窪エリア' }, ''],
    [{ id: 'tokyo_kita_lamp_akabane', name: 'らんぷ 赤羽店' }, { city: '北区', address: '東京都北区赤羽' }, '赤羽'],
    [{ id: 'tokyo_kokubunji_aroma_ella', name: 'Aroma ELLA (アロマエラ 国分寺店)' },
     { city: '国分寺市', address: '東京都国分寺市エリア' }, '国分寺'],
    [{ id: 'x', name: 'Chocolate (新大久保ルーム)' },
     { city: '新大久保', address: '東京都新宿区百人町２丁目１１−２５ (最寄: 新大久保駅)' }, '新大久保'],
    [{ id: 'y', name: 'NATURAL (新大久保店)' }, { city: '新大久保', address: '東京都新宿区 (最寄: 新大久保駅)' }, '新大久保'],
  ];
  const bad = [];
  for (const [shop, raw, want] of cases) {
    const got = candidateFor(shop, raw).value;
    if (got !== want) bad.push(`${shop.name} → 「${got}」（期待 「${want || '候補を出さない'}」）`);
  }
  if (bad.length) {
    console.error('❌ 候補の拾い方の自己診断に失敗しました。一覧は出しません:');
    for (const b of bad) console.error('   - ' + b);
    process.exit(1);
  }
}
selfTestCandidate();

const shops = await allShops();
const missing = [];
for (const s of shops) {
  const r = s.raw_data || {};
  const areas = (Array.isArray(r.area) ? r.area : [r.area]).filter(Boolean).map((a) => norm(a)).filter(Boolean);
  if (areas.length) continue;
  const address = String(r.address ?? '').trim();
  const cand = candidateFor(s, r);
  missing.push({
    id: s.id, name: s.name, group_id: s.group_id,
    prefecture: r.prefecture || '', city: r.city || '', address,
    // ⚠️ 名前と住所の一致より、**id・市区と一致する地名**のほうが強い根拠。
    //    名前は「港区・中目黒」のように複数の地名を名乗ることがある。
    candidate: cand.value, why: cand.why,
    band: cand.value ? 1 : (address ? 2 : 3),
  });
}

const b = (n) => missing.filter((m) => m.band === n);
console.log(`全 ${shops.length}店 / **エリアが空** ${missing.length}件`);
console.log(`  ① 候補あり（根拠つき）             … ${b(1).length}件`);
console.log(`  ② 住所はあるが候補を出せない       … ${b(2).length}件`);
console.log(`  ③ 住所も無い                       … ${b(3).length}件\n`);

for (const n of [1, 2, 3]) {
  const list = b(n);
  if (!list.length) continue;
  console.log(`━━ ${n === 1 ? '① 候補あり' : n === 2 ? '② 住所はあるが候補を出せない（並記・注記など）' : '③ 住所も無い'} … ${list.length}件 ━━`);
  for (const m of list.slice(0, n === 3 ? 20 : 80)) {
    console.log(`  ${m.id}`);
    console.log(`     ${m.name}${m.group_id ? ` [${m.group_id}]` : ''}`);
    console.log(`     都道府県: ${m.prefecture || '—'} ／ 市区: ${m.city || '—'} ／ 住所: ${m.address || '—'}`);
    if (m.candidate) console.log(`     → 候補: 「${m.candidate}」（${m.why}／※公式サイトで要確認）`);
  }
  if (list.length > (n === 3 ? 20 : 80)) console.log(`  …他 ${list.length - (n === 3 ? 20 : 80)}件`);
  console.log('');
}

const tsvArg = process.argv.find((a) => a.startsWith('--tsv='));
if (tsvArg) {
  const out = tsvArg.slice('--tsv='.length);
  fs.mkdirSync(out.replace(/\/[^/]+$/, ''), { recursive: true });
  const lines = [
    '# エリアが空の店の**下書き**（inspect_missing_area.mjs が生成）',
    '# ⚠️ そのまま適用しないこと。候補は「名前と住所の両方に出てくる文字列」であって、',
    '#    その店の正しいエリア名だと確認したものではない。**公式サイトで1件ずつ確かめてから**。',
    '# 形式: <shop_id>\t<都道府県>\t<市区>\t<エリア>\t<住所>   （- はその項目を変更しない）',
    ...b(1).map((m) => `${m.id}\t-\t-\t${m.candidate}\t-`),
  ];
  fs.writeFileSync(out, lines.join('\n') + '\n');
  console.log(`📦 ${out} に①段 ${b(1).length}件を下書きしました（**要確認**）`);
}
