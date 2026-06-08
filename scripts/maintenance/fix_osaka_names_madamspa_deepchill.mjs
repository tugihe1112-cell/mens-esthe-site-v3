/**
 * マダムスパ・Deep Chill 名前ノイズ修正
 * - マダムスパ: 「村上セラピスト」→「村上」（「セラピスト」以降を除去）
 * - Deep Chill: 「もふ【I】」→「もふ」（【X】ランク表示を除去）
 * 実行: node scripts/maintenance/fix_osaka_names_madamspa_deepchill.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function fixNames(shopId, cleanFn) {
  const { data: all } = await supabase.from('therapists').select('*').eq('shop_id', shopId);
  if (!all?.length) { console.log(`  ${shopId}: レコードなし`); return; }

  let fixed = 0, noise = 0;
  for (const t of all) {
    const cleanedName = cleanFn(t.name);
    if (cleanedName === t.name) continue; // 変更なし

    const newId = `${shopId}_${cleanedName}`;

    // 新しい名前のIDが既存するか確認
    const { data: existing } = await supabase.from('therapists').select('id').eq('id', newId);

    if (!cleanedName) {
      // 削除
      noise++;
      console.log(`  削除: "${t.name}"`);
      if (!DRY_RUN) await supabase.from('therapists').delete().eq('id', t.id);
    } else if (existing?.length) {
      // 既存IDと重複 → 古い方を削除
      noise++;
      console.log(`  重複削除: "${t.name}" (正しい"${cleanedName}"が存在)`);
      if (!DRY_RUN) await supabase.from('therapists').delete().eq('id', t.id);
    } else {
      // 名前修正（新IDで挿入 → 旧IDを削除）
      fixed++;
      console.log(`  修正: "${t.name}" → "${cleanedName}"`);
      if (!DRY_RUN) {
        const { error } = await supabase.from('therapists').insert({ ...t, id: newId, name: cleanedName });
        if (!error) {
          await supabase.from('therapists').delete().eq('id', t.id);
          process.stdout.write('✓');
        } else {
          // insert失敗（稀なケース）→ nameだけ更新
          await supabase.from('therapists').update({ name: cleanedName }).eq('id', t.id);
          process.stdout.write('u');
        }
      }
    }
  }
  if (!DRY_RUN) process.stdout.write('\n');
  console.log(`  修正: ${fixed}件 / ノイズ削除: ${noise}件`);
}

// マダムスパ: 「セラピスト」以降を除去 + (ちば) 等の読み仮名も除去
const MADAMSPA_ID = 'osaka_shinsaibashi_マダムスパ';
console.log(`=== マダムスパ ===`);
await fixNames(MADAMSPA_ID, name => {
  let n = name.replace(/セラピスト.*$/, '').trim();
  n = n.replace(/\([^()]*\)$/, '').replace(/（[^（）]*）$/, '').trim(); // (ちば)・（ふうか）
  n = n.replace(/\s+/g, '').trim();
  if (!n || n.length > 10) return null;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(n)) return null;
  return n;
});

// Deep Chill: 【X】ランク表示を除去
const DEEPCHILL_ID = 'osaka_umeda_deepchillディープチル';
console.log(`\n=== Deep Chill ===`);
await fixNames(DEEPCHILL_ID, name => {
  let n = name.replace(/【[^】]*】.*$/, '').trim(); // 【I】【D】等を除去
  n = n.replace(/\([^()]*\)$/, '').replace(/（[^（）]*）$/, '').trim();
  n = n.trim();
  if (!n || n.length > 10) return null;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(n)) return null;
  return n;
});

console.log(DRY_RUN ? '\n(dry-run)' : '\n完了');
