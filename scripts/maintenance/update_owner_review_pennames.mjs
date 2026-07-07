/**
 * update_owner_review_pennames.mjs — owner_manual口コミの投稿者名をペンネーム化
 *
 * 運営者自身の実体験レポート（user_id='owner_manual'）の user_name を、店舗ごとの
 * ペンネームに一括更新する。本文が「ルサンチマン」等と自称している声と名前を一致させ、
 * 信頼感を上げるのが狙い。声が混ざらないよう店舗単位で厳密に指定する。
 *
 * 前提: .env に VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY（RLSバイパスに必要）
 * 実行:
 *   node scripts/maintenance/update_owner_review_pennames.mjs --dry-run   # 変更内容だけ表示
 *   node scripts/maintenance/update_owner_review_pennames.mjs             # 実更新
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY = process.argv.includes('--dry-run');

// 店舗 → ペンネーム（声と一致させる。混ぜない）
const PENNAME_BY_SHOP = {
  osaka_umeda_kokoronoyurikago: 'ルサンチマン',
  hiroshima_hiroshima_hitozuma_san: 'ルサンチマン',
  kanagawa_sagamihara_unison_spa: 'メンエス浪人',
  tokyo_shibuya_silk: '残業帰りのK',
};

async function main() {
  console.log(`\n✍️ owner_manual 投稿者名のペンネーム化  ${DRY ? '[DRY-RUN]' : ''}\n`);
  let totalTargets = 0, totalUpdated = 0;

  for (const [shopId, penname] of Object.entries(PENNAME_BY_SHOP)) {
    const { data: rows, error } = await supabase
      .from('reviews')
      .select('id, user_name, therapist_name')
      .eq('user_id', 'owner_manual')
      .eq('shop_id', shopId);
    if (error) { console.error(`❌ ${shopId} 取得失敗: ${error.message}`); continue; }

    console.log(`■ ${shopId} → 「${penname}」（${rows.length}件）`);
    for (const r of rows) {
      const before = r.user_name || '(空)';
      if (r.user_name === penname) { console.log(`   = ${r.therapist_name}: 既に「${penname}」`); continue; }
      totalTargets += 1;
      console.log(`   ${DRY ? '↩' : '→'} ${r.therapist_name}: 「${before}」→「${penname}」`);
      if (!DRY) {
        const { error: upErr } = await supabase.from('reviews').update({ user_name: penname }).eq('id', r.id);
        if (upErr) { console.error(`     ❌ 更新失敗: ${upErr.message}`); continue; }
        totalUpdated += 1;
      }
    }
    console.log('');
  }

  console.log(`── 対象 ${totalTargets}件 / ${DRY ? '（dry-run・未更新）' : `更新 ${totalUpdated}件`} ──\n`);
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
