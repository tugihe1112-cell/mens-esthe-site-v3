/**
 * ノイズデータ削除
 * 実行: node scripts/maintenance/delete_noise_therapists.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// 削除対象（shop_id + name）
const targets = [
  // es_doll
  { shop_id: 'osaka_sakaisujihonmachi_es_doll', name: 'ボタン' },
  // mokukindo
  { shop_id: 'osaka_shinosaka_mokukindo', name: '感謝' },
  // my_mama_spa
  { shop_id: 'osaka_umeda_my_mama_spa', name: 'びっくり' },
  { shop_id: 'osaka_umeda_my_mama_spa', name: 'ラブ' },
  { shop_id: 'osaka_umeda_my_mama_spa', name: 'ピンクハート' },
  // frog_spa: ☆～スグ割～☆ 系
  { shop_id: 'osaka_sakaisujihonmachi_frog_spa', name: '☆～スグ割～☆' },
];

// 名前プレフィックス修正が必要なもの（beauty_and_beast: "入店 XXX" → "XXX"）
const prefixFixes = [
  { shop_id: 'osaka_umeda_beauty_and_beast', prefix: '入店 ' },
  { shop_id: 'osaka_umeda_darlin_premium', prefix: 'シルバー ' },
  { shop_id: 'osaka_umeda_darlin_premium', prefix: 'オススメ ' },
  { shop_id: 'osaka_umeda_darlin_premium', prefix: 'ゴールド ' },
  { shop_id: 'osaka_umeda_darlin_premium', prefix: 'プラチナ ' },
];

let deleted = 0;
let fixed = 0;

// ノイズ削除
for (const t of targets) {
  const { data, error } = await supabase
    .from('therapists')
    .delete()
    .eq('shop_id', t.shop_id)
    .eq('name', t.name)
    .select();
  if (error) {
    console.log(`❌ 削除失敗 [${t.shop_id}] ${t.name}: ${error.message}`);
  } else if (data.length > 0) {
    deleted++;
    console.log(`🗑️  削除: [${t.shop_id}] ${t.name}`);
  } else {
    console.log(`⚠️  見つからず: [${t.shop_id}] ${t.name}`);
  }
}

// プレフィックス修正
for (const fix of prefixFixes) {
  const { data, error } = await supabase
    .from('therapists')
    .select('id, name')
    .eq('shop_id', fix.shop_id)
    .like('name', `${fix.prefix}%`);

  if (error) { console.log(`❌ 取得失敗: ${error.message}`); continue; }
  if (!data || data.length === 0) continue;

  for (const t of data) {
    const newName = t.name.replace(fix.prefix, '').trim();
    const newId = `${fix.shop_id}_${newName.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;

    // 新しいIDで upsert してから古いIDを削除
    const { data: existing } = await supabase.from('therapists').select('id').eq('id', newId).single();
    if (!existing) {
      // IDを変更（delete + insert）
      const { data: orig } = await supabase.from('therapists').select('*').eq('id', t.id).single();
      if (orig) {
        await supabase.from('therapists').delete().eq('id', t.id);
        await supabase.from('therapists').insert({ ...orig, id: newId, name: newName });
        fixed++;
        console.log(`✏️  修正: ${t.name} → ${newName}`);
      }
    } else {
      // 既に正しい名前で存在する場合は古いレコードを削除
      await supabase.from('therapists').delete().eq('id', t.id);
      deleted++;
      console.log(`🗑️  重複削除: ${t.name} (${newName}として既存)`);
    }
  }
}

// frog_spa の残りノイズも確認・削除
console.log('\nfrog_spa ノイズ確認中...');
const { data: frogAll } = await supabase
  .from('therapists')
  .select('id, name')
  .eq('shop_id', 'osaka_sakaisujihonmachi_frog_spa');

const NOISE = /はこちら|一覧|登録|予約|お知らせ|分割|ランキング|スグ割|体入|体験入店|見習い|ボタン|感謝|びっくり|ラブ|ハート|スタッフ募集|キャンペーン|◆|★|☆|♪|←|→/;
const VALID_NAME = /[ぁ-んァ-ヾ一-龯]/;

let frogNoise = 0;
for (const t of (frogAll || [])) {
  if (NOISE.test(t.name) || !VALID_NAME.test(t.name) || t.name.length > 15) {
    const { error } = await supabase.from('therapists').delete().eq('id', t.id);
    if (!error) {
      frogNoise++;
      console.log(`🗑️  frog_spa ノイズ削除: ${t.name}`);
    }
  }
}

console.log(`\n✅ 削除: ${deleted}件, 修正: ${fixed}件, frogノイズ: ${frogNoise}件`);
