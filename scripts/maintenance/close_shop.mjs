/**
 * close_shop.mjs — 閉店・掲載終了が確認できた店舗を、掲載から取り下げる
 *
 * 【なぜスクリプトにするか（2026-09-09）】
 * 公式サイトで閉店が確認できた店舗が複数出てきた（LOHAS金沢／Mirajour など）。
 * 手でSQLを叩くと **消す対象を1文字間違えただけで別店舗が消える**。
 * 同名・系列の店が実在する（LOHASは金沢と沖縄の2店ある）ので、なおさら危ない。
 * だから「必ず下見 → バックアップ → 削除」の順を機械に守らせる。
 *
 * 【安全装置】
 *  1. 既定は**下見(dry-run)**。実際に消すには `--apply` が要る。
 *  2. 消す前に、店舗行とセラピスト行を **JSONへ書き出してから**削除する（元に戻せる）。
 *  3. **口コミが1件でもあれば中止する。** 利用者が書いた本文は掲載終了で消してよいものではない。
 *     どうしても必要なら人が個別に判断する（このスクリプトでは通さない）。
 *  4. shop_id は完全一致のみ。前方一致・LIKEは使わない。
 *
 * 【消したあとにやること】
 *  - サイトマップはDBから毎回生成されるので自動で追従する（2026-09-06の修正）。
 *  - 監視の期待値URLに固定で書いていないか確認する
 *    （「データを消したら、それを見張っている監視も直す」＝2026-09-06の教訓）。
 *  - 消したURLは404になる。インデックス済みなら数週間かけてGoogleから落ちる（正しい挙動）。
 *
 * 実行:
 *   node scripts/maintenance/close_shop.mjs ishikawa_kanazawa_lohas           # 下見
 *   node scripts/maintenance/close_shop.mjs ishikawa_kanazawa_lohas --apply   # 実行
 */
import fs from 'fs';
import path from 'path';
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
const shopIds = args.filter((a) => !a.startsWith('--'));

if (shopIds.length === 0) {
  console.error('使い方: node scripts/maintenance/close_shop.mjs <shop_id> [<shop_id> ...] [--apply]');
  process.exit(1);
}

const BACKUP_DIR = 'outputs/closed-shops';

async function inspect(shopId) {
  const [{ data: shop, error: se }, { data: therapists, error: te }, { count: reviewCount, error: re }] = await Promise.all([
    supabase.from('shops').select('*').eq('id', shopId).maybeSingle(),
    supabase.from('therapists').select('*').eq('shop_id', shopId),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('shop_id', shopId),
  ]);
  if (se) throw se;
  if (te) throw te;
  if (re) throw re;
  return { shop, therapists: therapists || [], reviewCount: reviewCount ?? 0 };
}

async function run() {
  let failed = 0;
  for (const shopId of shopIds) {
    console.log(`\n=== ${shopId} ===`);
    const { shop, therapists, reviewCount } = await inspect(shopId);

    if (!shop) {
      console.log('  該当する店舗がありません（すでに削除済み、またはIDの誤り）。何もしません。');
      failed += 1;
      continue;
    }
    console.log(`  店名: ${shop.name}`);
    console.log(`  公式: ${shop.website_url || '(なし)'}`);
    console.log(`  セラピスト: ${therapists.length}件 / 口コミ: ${reviewCount}件`);
    console.log(`  消えるURL: /shops/${shopId} と セラピスト ${therapists.length}ページ`);

    // 🚩 利用者が書いた本文は掲載終了の巻き添えで消さない
    if (reviewCount > 0) {
      console.log('  ⛔ 中止：この店舗には口コミがあります。');
      console.log('     口コミは利用者が書いたもので、閉店を理由に機械的に消すべきものではありません。');
      console.log('     残すのか移すのかを人が決めてから、個別に対応してください。');
      failed += 1;
      continue;
    }

    if (!APPLY) {
      console.log('  （下見のみ。実際に削除するには --apply を付けて再実行）');
      continue;
    }

    // バックアップ（削除の前に必ず書き出す）
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `${shopId}_${stamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify({ closedAt: new Date().toISOString(), shop, therapists }, null, 2));
    console.log(`  💾 バックアップ: ${backupPath}`);

    const { error: dtErr } = await supabase.from('therapists').delete().eq('shop_id', shopId);
    if (dtErr) { console.error('  ❌ セラピストの削除に失敗:', dtErr.message); failed += 1; continue; }
    const { error: dsErr } = await supabase.from('shops').delete().eq('id', shopId);
    if (dsErr) { console.error('  ❌ 店舗の削除に失敗:', dsErr.message); failed += 1; continue; }

    const after = await inspect(shopId);
    if (after.shop || after.therapists.length > 0) {
      console.error('  ❌ 削除後もデータが残っています。手で確認してください。');
      failed += 1;
      continue;
    }
    console.log('  ✅ 掲載を取り下げました（店舗1件 + セラピスト' + therapists.length + '件）');
  }

  console.log('\n--- 次にやること ---');
  console.log('  1. サイトマップはDBから生成されるので自動で追従します（確認: /api/sitemap.xml）');
  console.log('  2. 監視の期待値URLに、消した店舗が固定で書かれていないか確認してください');
  console.log('  3. 消したURLは404になります。インデックス済みなら時間をかけてGoogleから落ちます');
  if (!APPLY) console.log('\n（今回は下見のみ。何も変更していません）');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => { console.error('❌', e); process.exit(1); });
