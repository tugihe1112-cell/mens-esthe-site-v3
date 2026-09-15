/**
 * update_shop_location.mjs — 店舗の所在地（都道府県・市区・エリア・住所）を直す
 *
 * 【なぜ必要になったか（2026-09-15）】
 * オーナー指摘の「直さないといけないデータ」を調べたところ、URLではなく**所在地**が
 * 壊れている型が複数あった。
 *   - doigt de fee 5件: idは厚木/川崎/自由が丘/蒲田なのに、raw_data は武蔵小杉/溝の口/
 *     向ヶ丘遊園/本厚木。**どちらも実在のルーム名**で、取り込み時に割り当てがずれている。
 *   - ゆりかご: 滋賀のidに京都のデータが入っている。
 *   - オトナコード4030(id=東京/実データ=神奈川)、リオラ(id=神奈川/実データ=静岡)。
 *
 * 【所在地が壊れると何が起きるか】
 * 支店レコードが存在する理由は**地名**＝「渋谷で検索した人に引っかかる」ため（D-014）。
 * 所在地が違うと、その店は**本来の地名で検索しても出てこない**。店舗ページを畳んで
 * ブランド1枚にした今、地名は検索に残った唯一の手がかりなので、ここが壊れると店が消える。
 *
 * 【安全装置】update_shop_url.mjs と同じ考え方
 *  1. 既定は**下見(dry-run)**。書き換えるには `--apply`。
 *  2. 書き換え前に店舗行を **JSONへ書き出す**（元に戻せる）。
 *  3. shop_id は完全一致のみ。
 *  4. **都道府県は決め打ちの一覧と照合する**。打ち間違いで存在しない県を書き込ませない。
 *  5. 変更が無い行は何もしない。
 *  6. `raw_data` は**指定した項目だけ**を差し替える。他の項目（threads等）は触らない。
 *
 * 【この道具が保証しないこと】
 *  その所在地が**本当に正しいか**は機械には分からない。必ず人が公式サイトやポータルで
 *  確かめてから --apply すること。2026-09-15、Lynxの公式サイト一覧を根拠に7件直そうとして、
 *  1件ずつ開いたら2件が別店舗の内容だった。**一覧に載っていることは根拠にならない。**
 *
 * 【TSVの形式】1行1店。空欄（-）はその項目を変更しない。
 *   <shop_id>\t<都道府県>\t<市区>\t<エリア>\t<住所>
 *   例: tokyo_ota_kamata_doigt_de_fee\t東京都\t大田区\t蒲田\t東京都大田区蒲田エリア
 *
 * 【エリアは「|」で複数書ける】
 *   例: kanagawa_atsugi_code4030\t神奈川県\t厚木市\t本厚木|横浜東口|関内|上大岡\t-
 *   ルームが9つあるのにレコードが2件しかない、というブランドが実在する（リオラ・オトナコード）。
 *   レコードを増やさずに**全ルームの地名を検索に残す**ための逃げ道。
 *   ⚠️ 先頭がエリア一覧(/area/:pref)の振り分けに使われる（brandGroups.js の groupBrandsByArea）。
 *      代表として出したい地名を先頭に書くこと。
 *   ⚠️ 表示の地名(areaLabels)にも全部出るので、関係ない地名を混ぜない。
 *
 * 実行:
 *   node scripts/maintenance/update_shop_location.mjs --file=locations.tsv
 *   node scripts/maintenance/update_shop_location.mjs --file=locations.tsv --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function env(name) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && m[1] === name) return m[2].replace(/^["']|["']$/g, '');
  }
  return process.env[name];
}
const supabaseUrl = env('VITE_SUPABASE_URL');
const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Supabaseのサーバー接続情報がありません（.env の VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const PREFECTURES = new Set(['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県']);

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const fileArg = args.find((a) => a.startsWith('--file='));
if (!fileArg) {
  console.error('使い方: node scripts/maintenance/update_shop_location.mjs --file=locations.tsv [--apply]');
  console.error('  TSV: <shop_id>\\t<都道府県>\\t<市区>\\t<エリア>\\t<住所>   （「-」はその項目を変更しない）');
  process.exit(1);
}

const KEEP = '-';
const rows = [];
for (const line of fs.readFileSync(fileArg.slice('--file='.length), 'utf8').split('\n')) {
  const t = line.replace(/\r$/, '');
  if (!t.trim() || t.trim().startsWith('#')) continue;
  const [shopId, prefecture, city, area, address] = t.split('\t');
  if (!shopId) { console.error(`❌ 行の形式が違います: ${t}`); process.exit(1); }
  if (prefecture && prefecture !== KEEP && !PREFECTURES.has(prefecture)) {
    console.error(`❌ 都道府県の名前が一覧にありません: 「${prefecture}」 (${shopId})`);
    process.exit(1);
  }
  rows.push({ shopId, prefecture, city, area, address });
}
if (rows.length === 0) { console.error('❌ 対象が0件です'); process.exit(1); }

const BACKUP_DIR = 'outputs/location-updates';
const show = (v) => (v == null || v === '' ? '—' : Array.isArray(v) ? v.join('/') : String(v));

const planned = [];
let failed = 0;

for (const r of rows) {
  const { data: shop, error } = await supabase.from('shops').select('*').eq('id', r.shopId).maybeSingle();
  if (error) throw error;
  if (!shop) { console.error(`❌ 見つかりません: ${r.shopId}`); failed += 1; continue; }

  const raw = shop.raw_data || {};
  const next = {};
  const diffs = [];
  const put = (key, val, current) => {
    if (val == null || val === '' || val === KEEP) return;
    const cur = show(current);
    // エリアは「|」で複数指定できる。複数なら必ず配列、単数でも既存が配列なら配列のまま。
    let newVal = val;
    if (key === 'area') {
      const parts = String(val).split('|').map((v) => v.trim()).filter(Boolean);
      if (parts.length === 0) return;
      newVal = parts.length > 1 || Array.isArray(current) ? parts : parts[0];
    }
    if (cur === show(newVal)) return;
    next[key] = newVal;
    diffs.push(`     ${key}: ${cur} → ${show(newVal)}`);
  };
  put('prefecture', r.prefecture, raw.prefecture);
  put('city', r.city, raw.city);
  put('area', r.area, raw.area);
  put('address', r.address, raw.address);

  console.log(`\n■ ${shop.name} [${shop.id}]`);
  if (diffs.length === 0) { console.log('   ⏭️  変更なし'); continue; }
  diffs.forEach((d) => console.log(d));

  // 参考情報: idが示す県と、これから書き込む県が合っているか
  const head = String(shop.id).split('_')[0];
  const fromIdMap = { hokkaido:'北海道',aomori:'青森県',iwate:'岩手県',miyagi:'宮城県',akita:'秋田県',yamagata:'山形県',fukushima:'福島県',ibaraki:'茨城県',tochigi:'栃木県',gunma:'群馬県',saitama:'埼玉県',chiba:'千葉県',tokyo:'東京都',kanagawa:'神奈川県',niigata:'新潟県',toyama:'富山県',ishikawa:'石川県',fukui:'福井県',yamanashi:'山梨県',nagano:'長野県',gifu:'岐阜県',shizuoka:'静岡県',aichi:'愛知県',mie:'三重県',shiga:'滋賀県',kyoto:'京都府',osaka:'大阪府',hyogo:'兵庫県',nara:'奈良県',wakayama:'和歌山県',tottori:'鳥取県',shimane:'島根県',okayama:'岡山県',hiroshima:'広島県',yamaguchi:'山口県',tokushima:'徳島県',kagawa:'香川県',ehime:'愛媛県',kochi:'高知県',fukuoka:'福岡県',saga:'佐賀県',nagasaki:'長崎県',kumamoto:'熊本県',oita:'大分県',miyazaki:'宮崎県',kagoshima:'鹿児島県',okinawa:'沖縄県' };
  const idPref = fromIdMap[head];
  const willBe = next.prefecture || raw.prefecture;
  if (idPref && willBe && idPref !== willBe) {
    console.log(`     ⚠️ idの県(${idPref})と書き込む県(${willBe})が違います。意図した通りか確かめてください。`);
  }
  planned.push({ shop, next });
}

console.log(`\n--- 対象 ${planned.length}件 ---`);
if (failed > 0) {
  console.error(`❌ ${failed}件で問題がありました。1件でも問題があれば1件も書き換えません。`);
  process.exit(1);
}
if (planned.length === 0) { console.log('変更するものがありません。'); process.exit(0); }
if (!APPLY) {
  console.log('これは下見です。実行するには --apply を付けてください。');
  console.log('⚠️ その前に、所在地が正しいことを公式サイトやポータルで**人が**確かめてください。');
  process.exit(0);
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
const backup = path.join(BACKUP_DIR, `location-update-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(backup, JSON.stringify(planned.map((p) => p.shop), null, 2), 'utf8');
console.log(`📦 バックアップ: ${backup}`);

for (const { shop, next } of planned) {
  // ⚠️ raw_data は丸ごと置き換えない。指定した項目だけを上書きし、threads等は残す。
  const merged = { ...(shop.raw_data || {}), ...next };
  const { error } = await supabase.from('shops').update({ raw_data: merged }).eq('id', shop.id);
  if (error) { console.error(`❌ 失敗: ${shop.name} [${shop.id}] ${error.message}`); process.exit(1); }
  console.log(`✅ 更新: ${shop.name} [${shop.id}]`);
}
console.log('\n※ 直したあと: 対象の地名で検索して、その店が出てくることを確認してください。');
