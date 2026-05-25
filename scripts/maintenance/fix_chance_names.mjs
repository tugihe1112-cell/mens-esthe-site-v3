import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data } = await supabase.from('therapists').select('id,name').eq('shop_id','aichi_takaoka_chance');

let updated = 0;
for (const t of (data || [])) {
  // "あい❤️1月22日入店" → "あい"
  const clean = t.name
    .replace(/❤️.*/, '')
    .replace(/🔰.*/, '')
    .replace(/💖/g, '')
    .replace(/\s*\d+月.*/, '')
    .trim();

  if (clean === t.name) continue; // 変更なし

  // IDも更新（shop_id + name でID生成のため）
  const newId = `aichi_takaoka_chance_${clean}`;

  // 同名IDが既存の場合はスキップ
  const { data: existing } = await supabase.from('therapists').select('id').eq('id', newId).maybeSingle();
  if (existing) {
    await supabase.from('therapists').delete().eq('id', t.id);
    console.log(`  ⏭ 重複のため削除: ${t.name}`);
    continue;
  }

  const { error } = await supabase.from('therapists').update({ id: newId, name: clean }).eq('id', t.id);
  if (error) console.log(`  ❌ ${t.name}: ${error.message}`);
  else { console.log(`  ✅ ${t.name} → ${clean}`); updated++; }
}

console.log(`\n${updated}名の名前を修正`);
