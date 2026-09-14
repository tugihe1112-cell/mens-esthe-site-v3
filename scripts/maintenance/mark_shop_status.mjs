/**
 * mark_shop_status.mjs — 店舗に「閉店」または「営業未確認」の印を付ける／外す
 *
 * 【なぜ消さずに印にするのか（2026-09-14）】
 * 閉店らしき店を消す方針で進めていたが、外形監査で「ドメインが消えた18店」を実際に調べたら
 * **15店は営業中でURLが変わっただけ**だった。消していたら営業中の15店を消していた。
 * 印なら間違っても外せる。消したら口コミごと戻らない。
 *
 * ⚠️ **「閉店」と「営業未確認」を混ぜないこと。**
 *    closed ……… 公式の閉店告知・ポータルの閉店表示など、**確認できた**場合だけ
 *    unconfirmed … サイトにつながらない等、**確かめられない**だけ。閉店とは言い切れない
 *    確認できないだけの店に「閉店」の札を貼るのは、営業中の店に対する誤情報になる。
 *
 * 印を付けても店舗ページ・口コミ・セラピストは**そのまま残る**。検索結果にも出る。
 *
 * 【安全装置】
 *  1. 既定は下見(dry-run)。`--apply` が要る
 *  2. 変更前の raw_data をJSONへ書き出してから更新する
 *  3. shop_id は完全一致のみ
 *  4. `--reason=` で根拠を残す（raw_data.status_note。画面には出さない記録用）
 *
 * 実行:
 *   node scripts/maintenance/mark_shop_status.mjs <shop_id> --closed --reason="公式に閉店告知"
 *   node scripts/maintenance/mark_shop_status.mjs <shop_id> --unconfirmed --reason="ドメイン失効 2026-09-13"
 *   node scripts/maintenance/mark_shop_status.mjs <shop_id> --clear          # 印を外す
 *   …上記に --apply を足すと実行
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { shopStatusOf } from '../../src/utils/shopStatus.js';

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
const modes = ['--closed', '--unconfirmed', '--clear'].filter((m) => args.includes(m));
const reason = (args.find((a) => a.startsWith('--reason=')) || '').slice('--reason='.length);
const shopIds = args.filter((a) => !a.startsWith('--'));

if (modes.length !== 1 || shopIds.length === 0) {
  console.error('使い方: node scripts/maintenance/mark_shop_status.mjs <shop_id> [...] (--closed | --unconfirmed | --clear) [--reason="…"] [--apply]');
  process.exit(1);
}
const mode = modes[0];
if (mode === '--closed' && !reason) {
  // 「閉店」は断定なので、根拠を書かせる。あとから「なぜ閉店にしたのか」を追えるように。
  console.error('❌ --closed には --reason= が要ります（何を見て閉店と判断したか）');
  process.exit(1);
}

const BACKUP_DIR = 'outputs/shop-status';

async function run() {
  const planned = [];
  let failed = 0;
  for (const shopId of shopIds) {
    const { data: shop, error } = await supabase.from('shops').select('id, name, raw_data, website_url').eq('id', shopId).maybeSingle();
    if (error) throw error;
    if (!shop) { console.error(`❌ 見つかりません: ${shopId}`); failed += 1; continue; }

    const raw = { ...(shop.raw_data || {}) };
    delete raw.closed;
    delete raw.operation_unconfirmed;
    delete raw.status_note;
    if (mode === '--closed') raw.closed = true;
    if (mode === '--unconfirmed') raw.operation_unconfirmed = true;
    if (reason && mode !== '--clear') raw.status_note = reason;

    const before = shopStatusOf(shop) || '（印なし）';
    const after = shopStatusOf({ raw_data: raw }) || '（印なし）';
    console.log(`\n■ ${shop.name} [${shop.id}]`);
    console.log(`   ${before} → ${after}`);
    if (reason && mode !== '--clear') console.log(`   根拠: ${reason}`);
    planned.push({ shop, raw });
  }

  if (failed > 0) {
    console.error(`\n❌ ${failed}件に問題があります。1件も書き換えずに中止します。`);
    process.exit(1);
  }
  if (!APPLY) {
    console.log('\nこれは下見です。実行するには --apply を付けてください。');
    console.log('⚠️ 「閉店」は確認できたときだけ。つながらないだけなら --unconfirmed を使ってください。');
    return;
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `status-${stamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(planned.map((p) => ({ before: p.shop, after: p.raw })), null, 2));
  console.log(`\n📦 バックアップ: ${backupPath}`);

  for (const { shop, raw } of planned) {
    const { error } = await supabase.from('shops').update({ raw_data: raw }).eq('id', shop.id);
    if (error) { console.error(`❌ 更新失敗: ${shop.name} [${shop.id}] — ${error.message}`); process.exitCode = 1; continue; }
    console.log(`✅ ${shop.name} [${shop.id}]`);
  }
  console.log('\n※ 店舗ページ・口コミ・セラピストはそのまま残っています。検索結果にも出ます。');
}

run().catch((e) => { console.error('❌', e); process.exit(1); });
