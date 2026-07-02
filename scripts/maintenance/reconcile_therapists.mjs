// Tier 3-3: 退店検知の照合ツール（generic scraperは非現実的なので「名前リスト照合」方式）
// 使い方: node scripts/maintenance/reconcile_therapists.mjs <roster.json> [--dry-run]
//   roster.json = { "shop_id": "...", "active_names": ["名前1","名前2", ...] }  （単一 or 配列で複数店）
//   各店スクレイピングは既存の随時スクリプトで現在の在籍名を取得し、このJSONに入れて食わせる運用。
//
// 動作: 指定shopのDB全セラピストを、active_names（現在の在籍）と突合。
//   - active_namesに居る → is_active=true に（退店から復活も反映）
//   - active_namesに居ない → is_active=false / departed_at=now（退店マーク・口コミ資産は残す＝削除しない）
// 前提: 09_therapist_status.sql 実行済み（is_active / departed_at 列）。service role必須。
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const jsonPath = args.find((a) => !a.startsWith('--'));
if (!jsonPath) { console.error('使い方: node scripts/maintenance/reconcile_therapists.mjs <roster.json> [--dry-run]'); process.exit(1); }

const normName = (s) => (s || '').replace(/[\s　]/g, '');

async function reconcileShop(shopId, activeNames) {
  const activeSet = new Set((activeNames || []).map(normName).filter(Boolean));
  const { data: rows, error } = await supabase
    .from('therapists').select('id, name, is_active').eq('shop_id', shopId);
  if (error) { console.log(`  ❌ 取得失敗 ${shopId}: ${error.message}`); return; }
  if (!rows || !rows.length) { console.log(`  ⚠️ ${shopId}: DBにセラピスト無し`); return; }

  const toDepart = [];   // 在籍リストに無い＝退店
  const toRevive = [];   // 在籍リストに有り＆現状is_active=false＝復活
  for (const t of rows) {
    const inRoster = activeSet.has(normName(t.name));
    if (!inRoster && t.is_active !== false) toDepart.push(t);
    if (inRoster && t.is_active === false) toRevive.push(t);
  }
  console.log(`  ${shopId}: DB${rows.length}名 / 在籍リスト${activeSet.size}名 → 退店マーク ${toDepart.length} / 復活 ${toRevive.length}`);
  if (DRY) {
    if (toDepart.length) console.log('    [DRY]退店予定:', toDepart.slice(0, 20).map((t) => t.name).join('、'));
    if (toRevive.length) console.log('    [DRY]復活予定:', toRevive.slice(0, 20).map((t) => t.name).join('、'));
    return;
  }
  for (let i = 0; i < toDepart.length; i += 100) {
    const ids = toDepart.slice(i, i + 100).map((t) => t.id);
    const { error: e } = await supabase.from('therapists').update({ is_active: false, departed_at: new Date().toISOString() }).in('id', ids);
    if (e) console.log('    退店マークエラー:', e.message);
  }
  for (let i = 0; i < toRevive.length; i += 100) {
    const ids = toRevive.slice(i, i + 100).map((t) => t.id);
    const { error: e } = await supabase.from('therapists').update({ is_active: true, departed_at: null }).in('id', ids);
    if (e) console.log('    復活エラー:', e.message);
  }
  console.log(`    ✅ 退店${toDepart.length} / 復活${toRevive.length} 反映`);
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const list = Array.isArray(raw) ? raw : [raw];
  console.log(`=== 退店照合 (${DRY ? 'DRY-RUN' : '本番'}) : ${list.length}店 ===`);
  for (const r of list) {
    if (!r.shop_id || !Array.isArray(r.active_names)) { console.log('  ❌ shop_id / active_names(配列) が必要:', JSON.stringify(r).slice(0, 60)); continue; }
    await reconcileShop(r.shop_id, r.active_names);
  }
  console.log('=== 完了 ===');
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
