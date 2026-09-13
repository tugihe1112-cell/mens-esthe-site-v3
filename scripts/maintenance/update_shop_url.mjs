/**
 * update_shop_url.mjs — 店舗の公式サイトURLを、新しいURLに差し替える
 *
 * 【なぜ必要になったか（2026-09-13）】
 * 外形監査で「ドメインが存在しない」18店を見つけ、閉店だと判断しかけた。
 * 実際に店名で調べたところ **15店は営業していて、URLだけが変わっていた**。
 * （例: okayama-zero.com は消えたが ZERO は営業中／weal-group.jp → weal-esthe.com）
 *
 *   ❌ ドメインが消えた ＝ 閉店した
 *   ⭕ ドメインが消えた ＝ **こちらが持っているURLが古い**
 *
 * つまり必要な作業は「店を消すこと」ではなく「URLを直すこと」だった。
 * 消していたら営業中の15店を消していた。この道具はその作業のためのもの。
 *
 * 【安全装置】
 *  1. 既定は**下見(dry-run)**。実際に書き換えるには `--apply` が要る。
 *  2. 書き換え前に、店舗行を **JSONへ書き出してから**更新する（元に戻せる）。
 *  3. **新URLの名前が引けなければ中止する。** 死んだURLに差し替えては意味がない。
 *  4. shop_id は完全一致のみ。前方一致・LIKEは使わない。
 *  5. 現在のURLと新URLが同じなら何もしない。
 *
 * 【この道具が保証しないこと】
 *  新URLが**本当にその店のものか**は機械には分からない。
 *  必ず人が開いて、店名・所在地・営業時間が一致することを確かめてから --apply すること。
 *
 * 【店名も直せる（2026-09-13 追加）】
 *  --file のTSVに3列目を書くと店名も差し替える（id<TAB>URL<TAB>新しい店名）。
 *  このとき **同じ都道府県に同名の店ができてしまう場合は中止する**。
 *  実例: 「今日子の姉妹 春日部店」を「今日子の姉妹」に縮めると、
 *  同じ埼玉県にある「今日子の姉妹 大宮」と見分けがつかなくなる。
 *  一覧に同じ名前が並ぶのは、利用者から見れば重複と同じこと。
 *
 * 実行:
 *   node scripts/maintenance/update_shop_url.mjs <shop_id>=<新URL> [...]          # 下見
 *   node scripts/maintenance/update_shop_url.mjs --file=urls.tsv                  # 一括
 *   node scripts/maintenance/update_shop_url.mjs <shop_id>=<新URL> --apply        # 実行
 */
import fs from 'fs';
import path from 'path';
import dnsp from 'dns/promises';
import { createClient } from '@supabase/supabase-js';

function env(key) {
  if (process.env[key]) return process.env[key];
  try {
    const source = fs.readFileSync('.env', 'utf8');
    return source.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '') || '';
  } catch {
    return '';
  }
}

const supabaseUrl = env('VITE_SUPABASE_URL');
const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Supabaseのサーバー接続情報がありません（.env の VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const fileArg = args.find((a) => a.startsWith('--file='));

/** 「id=URL」と、--file のTSV（id<TAB>URL）の両方を受ける */
function parsePairs() {
  const pairs = [];
  for (const a of args) {
    if (a.startsWith('--')) continue;
    const i = a.indexOf('=');
    if (i <= 0) { console.error(`❌ 形式が違います: ${a}（<shop_id>=<URL> で指定してください）`); process.exit(1); }
    pairs.push({ shopId: a.slice(0, i), url: a.slice(i + 1) });
  }
  if (fileArg) {
    const body = fs.readFileSync(fileArg.slice('--file='.length), 'utf8');
    for (const line of body.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const [shopId, url, newName] = t.split('\t');
      if (!shopId || !url) { console.error(`❌ 行の形式が違います: ${t}`); process.exit(1); }
      pairs.push({ shopId: shopId.trim(), url: url.trim(), newName: (newName || '').trim() || null });
    }
  }
  return pairs;
}

const pairs = parsePairs();
if (pairs.length === 0) {
  console.error('使い方: node scripts/maintenance/update_shop_url.mjs <shop_id>=<新URL> [...] [--apply]');
  console.error('        node scripts/maintenance/update_shop_url.mjs --file=urls.tsv [--apply]');
  process.exit(1);
}

const BACKUP_DIR = 'outputs/url-updates';

/** 新URLが生きているか。名前が引けないURLに差し替えるのは無意味なので止める。 */
async function urlIsAlive(url) {
  let host;
  try { host = new URL(url).hostname; } catch { return { ok: false, why: 'URLの形式が不正' }; }
  try { const a = await dnsp.resolve4(host); return { ok: true, why: a[0] }; }
  catch (e) { return { ok: false, why: `名前が引けない (${e.code})` }; }
}

/** 同じ都道府県に同じ店名が並ばないか。並ぶなら利用者は区別できない。 */
async function nameWouldCollide(shop, newName) {
  const pref = shop.raw_data?.prefecture || null;
  if (!pref) return null;
  const norm = (x) => String(x || '').toLowerCase().replace(/[\s（）()〜~・,，]/g, '');
  const { data, error } = await supabase.from('shops').select('id,name,raw_data').eq('id', shop.id).limit(1);
  if (error) throw error;
  if (!data) return null;
  const { data: others, error: e2 } = await supabase.from('shops').select('id,name,raw_data');
  if (e2) throw e2;
  const hit = (others || []).find((o) => o.id !== shop.id
    && (o.raw_data?.prefecture || null) === pref
    && norm(o.name) === norm(newName));
  return hit || null;
}

async function run() {
  let failed = 0;
  const planned = [];

  for (const { shopId, url, newName } of pairs) {
    const { data: shop, error } = await supabase.from('shops').select('*').eq('id', shopId).maybeSingle();
    if (error) throw error;
    if (!shop) { console.error(`❌ 見つかりません: ${shopId}`); failed += 1; continue; }

    const current = (shop.website_url || '').trim();
    const nameChanges = !!newName && newName !== shop.name;
    if (current === url && !nameChanges) { console.log(`⏭️  変更なし: ${shop.name} [${shopId}]`); continue; }

    if (nameChanges) {
      const clash = await nameWouldCollide(shop, newName);
      if (clash) {
        console.error(`❌ 同じ都道府県に同名の店ができます: 「${newName}」は ${clash.name} [${clash.id}] と区別できません（${shop.name}）`);
        failed += 1;
        continue;
      }
    }

    const alive = await urlIsAlive(url);
    if (!alive.ok) { console.error(`❌ 新URLが生きていません: ${url} — ${alive.why}（${shop.name}）`); failed += 1; continue; }

    console.log(`\n■ ${shop.name} [${shopId}]`);
    console.log(`   旧URL: ${current || '(未設定)'}`);
    console.log(`   新URL: ${url}  → ${alive.why}`);
    if (nameChanges) console.log(`   店名 : ${shop.name} → ${newName}`);
    planned.push({ shop, url, newName: nameChanges ? newName : null });
  }

  if (failed > 0) {
    console.error(`\n❌ ${failed}件に問題があります。**1件も書き換えずに中止します。**`);
    process.exit(1);
  }
  if (planned.length === 0) { console.log('\n変更するものはありません。'); return; }

  console.log(`\n--- 対象 ${planned.length}件 ---`);
  if (!APPLY) {
    console.log('これは下見です。実行するには --apply を付けてください。');
    console.log('⚠️ その前に、新URLを**人が開いて**店名・所在地・営業時間が一致することを確かめてください。');
    return;
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `url-update-${stamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(planned.map((p) => ({ before: p.shop, newUrl: p.url, newName: p.newName })), null, 2));
  console.log(`📦 バックアップ: ${backupPath}`);

  for (const { shop, url, newName } of planned) {
    const patch = { website_url: url };
    if (newName) patch.name = newName;
    const { error } = await supabase.from('shops').update(patch).eq('id', shop.id);
    if (error) { console.error(`❌ 更新失敗: ${shop.name} [${shop.id}] — ${error.message}`); process.exitCode = 1; continue; }
    console.log(`✅ 更新: ${shop.name} [${shop.id}] → ${url}${newName ? ` / 店名「${newName}」` : ''}`);
  }
  console.log('\n※ 直したあと: 外形監査を回し直して、対象URLが ok になることを確認してください。');
}

run().catch((e) => { console.error('❌', e); process.exit(1); });
