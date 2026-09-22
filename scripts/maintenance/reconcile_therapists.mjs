// Tier 3-3: 在籍名簿の照合ツール（generic scraperは非現実的なので「名前リスト照合」方式）
// 使い方: node scripts/maintenance/reconcile_therapists.mjs <roster.json> [--dry-run]
//   roster.json = { "shop_id": "...", "active_names": ["名前1","名前2", ...] }  （単一 or 配列で複数店）
//   各店スクレイピングは既存の随時スクリプトで現在の在籍名を取得し、このJSONに入れて食わせる運用。
//
// 動作: 指定shopのDB全セラピストを、active_names（現在の在籍）と突合。
//   - active_namesに居る → **在籍を確認した**印を付ける（is_active=true / last_seen_at=now）
//   - active_namesに居ない → is_active=false（退店マーク・口コミ資産は残す＝削除しない）
//
// ⚠️【2026-09-21 追加】last_seen_at をここで進める。
//   毎日の監視 check_data_freshness.mjs は「180日再確認されていない在籍者」を数えるのに、
//   last_seen_at を書いていたのは**新規登録スクリプトだけ**で、再確認を記録する経路が
//   どこにも無かった。実測で 180日超 7.6%（上限5%）／90日後には 99.8% が該当する見込みで、
//   これは閾値の問題ではなく「名簿の鮮度を保つ手段が無い」という形だった。
//   判定は scripts/lib/rosterReconcile.mjs に置く（洗い出しと監視の両方から使えるように）。
//
// 前提: is_active 列。service role必須。退店日（departed_at）は**書かない**（下記）。
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { planReconcile, selfTestReconcile } from '../lib/rosterReconcile.mjs';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

// 書き換える前の行をここに残す（他の書き込み道具と同じ置き場の作り: outputs/<名前>/）。
// ⚠️ 2026-08-20 に破壊的スクリプトでDBを112件壊した。本質は「バックアップを後回しにした」こと。
//    バックアップが書けなければ**1行も書き換えない**。
const BACKUP_DIR = 'outputs/roster-reconcile';

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const jsonPath = args.find((a) => !a.startsWith('--'));
if (!jsonPath) { console.error('使い方: node scripts/maintenance/reconcile_therapists.mjs <roster.json> [--dry-run]'); process.exit(1); }

// 🚩 突き合わせ方の自己診断は**DBに触る前**。壊れていたら1行も書かずに止まる。
//    「確認していない人に確認印を付ける」壊れ方は、画面にも監視にも異常として出ない。
{
  const problems = selfTestReconcile();
  if (problems.length) {
    console.error('❌ 在籍照合の判定が壊れています（scripts/lib/rosterReconcile.mjs）:');
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }
}

// ⚠️【2026-09-21】退店日（departed_at）は記録しない。
//   オーナー「退店日なんてわからないでしょ」。その通りで、このツールが知っているのは
//   「照合した日に名簿に居なかった」ことだけ。照合は数か月おきにもなりうるので、
//   照合した日を退店日として書くと**何か月もずれた日付**になる（根拠のない値＝D-010と同じ話）。
//   分かっている事実は2つだけで、どちらも既に持っている:
//     ・last_seen_at … 最後に在籍を確認した日（退店はこの日より後）
//     ・is_active=false … その後の照合で名簿に居なかった
//   `supabase_migrations/09_therapist_status.sql` は departed_at 列を足す内容だが、
//   本番には当たっておらず（2026-09-21 information_schema で確認）、足さないことにした。

async function updateInChunks(rows, patch, label) {
  let failed = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const ids = rows.slice(i, i + 100).map((t) => t.id);
    const { error } = await supabase.from('therapists').update(patch).in('id', ids);
    if (error) { failed += ids.length; console.log(`    ${label}エラー:`, error.message); }
  }
  return rows.length - failed;
}

async function reconcileShop(shopId, activeNames) {
  const { data: rows, error } = await supabase
    .from('therapists').select('id, name, is_active, last_seen_at').eq('shop_id', shopId);
  if (error) { console.log(`  ❌ 取得失敗 ${shopId}: ${error.message}`); return; }
  if (!rows || !rows.length) { console.log(`  ⚠️ ${shopId}: DBにセラピスト無し`); return; }

  const plan = planReconcile({ rows, activeNames });
  if (plan.refused) { console.log(`  ⏭️ ${shopId}: ${plan.refused}`); return; }

  console.log(`  ${shopId}: DB${rows.length}名 / 在籍リスト${activeNames.length}名`
    + ` → 在籍確認 ${plan.confirm.length}（うち復活 ${plan.revive.length}） / 退店マーク ${plan.depart.length}`);
  if (plan.unmatchedNames.length) {
    // 追加はしない。ここで黙ると「照合した」のに新人が入っていない状態に気づけない。
    console.log(`    ℹ️ 名簿にあってDBに無い ${plan.unmatchedNames.length}名（このツールは追加しません）:`,
      plan.unmatchedNames.slice(0, 20).join('、'));
  }
  if (DRY) {
    if (plan.confirm.length) console.log('    [DRY]在籍確認:', plan.confirm.slice(0, 20).map((t) => t.name).join('、'));
    if (plan.depart.length) console.log('    [DRY]退店予定:', plan.depart.slice(0, 20).map((t) => t.name).join('、'));
    return;
  }

  const now = new Date().toISOString();
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = now.replace(/[:.]/g, '-');
    const backupPath = `${BACKUP_DIR}/${shopId}-${stamp}.json`;
    fs.writeFileSync(backupPath, JSON.stringify({
      shop_id: shopId,
      at: now,
      confirm_ids: plan.confirm.map((t) => t.id),
      depart_ids: plan.depart.map((t) => t.id),
      before: rows,
    }, null, 1));
    console.log(`    📦 バックアップ: ${backupPath}`);
  } catch (e) {
    console.log(`    ❌ バックアップを書けないので中止（1行も書き換えていない）: ${e.message}`);
    return;
  }
  // ⚠️ last_seen_at が付くのは confirm だけ。退店側に付けると「確認していない人の確認印」になる。
  const confirmPatch = { is_active: true, last_seen_at: now };
  const departPatch = { is_active: false };

  const confirmed = await updateInChunks(plan.confirm, confirmPatch, '在籍確認');
  const departed = await updateInChunks(plan.depart, departPatch, '退店マーク');
  console.log(`    ✅ 在籍確認${confirmed} / 退店${departed} 反映（最終確認日 ${now.slice(0, 10)}）`);
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const list = Array.isArray(raw) ? raw : [raw];
  console.log(`=== 在籍照合 (${DRY ? 'DRY-RUN' : '本番'}) : ${list.length}店 ===`);
  for (const r of list) {
    if (!r.shop_id || !Array.isArray(r.active_names)) { console.log('  ❌ shop_id / active_names(配列) が必要:', JSON.stringify(r).slice(0, 60)); continue; }
    await reconcileShop(r.shop_id, r.active_names);
  }
  console.log('=== 完了 ===');
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
