/**
 * 重複店舗の詳細確認（website_url・therapist数・raw_data）
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const DUP_IDS = [
  // スーパーハッピーガールズ
  'osaka_nipponbashi_super_happy',
  'osaka_umeda_super_happy_girls',
  // 体育の時間
  'tokyo_meguro_meguro_petime',
  'tokyo_meguro_meguro_taiiku_jikan',
  // 癒しの空間 Annex
  'tokyo_taito_ueno_iyashi_annex',
  'tokyo_taito_ueno_iyashinokuukan_annex',
  // 東京ラグジュアリー
  'tokyo_taito_ueno_tokyo_luxury',
  'tokyo_taito_ueno_tokyo-luxury',
  // 大人スパ 両国
  'tokyo_sumida_ryogoku_otonaspa_kutsurogi',
  'tokyo_sumida_ryougoku_otonaspa_kutsurogi',
  // むちすぱルーム 北千住
  'tokyo_adachi_kitasenju_muchispa',
  'tokyo_adachi_kitasenju_muchispa_room',
  // Anjuaile
  'tokyo_ota_kamata_angeaile',
  'tokyo_ota_kamata_anjuaile',
  // 三茶美人
  'tokyo_setagaya_sangenjaya_sanchabijin',
  'tokyo_setagaya_sangenjaya_sancha_bijin',
  // ゴールデン
  'tokyo_nakano_nakano_golden',
  'tokyo_nakano_golden',
];

const { data: shops } = await supabase
  .from('shops')
  .select('id, name, group_id, website_url, image_url, raw_data')
  .in('id', DUP_IDS);

const { data: therapists } = await supabase
  .from('therapists')
  .select('shop_id, name')
  .in('shop_id', DUP_IDS);

const countMap = {};
for (const t of (therapists || [])) {
  countMap[t.shop_id] = (countMap[t.shop_id] || 0) + 1;
}

const shopMap = {};
for (const s of (shops || [])) shopMap[s.id] = s;

// ペアごとに表示
const pairs = [
  ['osaka_nipponbashi_super_happy', 'osaka_umeda_super_happy_girls'],
  ['tokyo_meguro_meguro_petime', 'tokyo_meguro_meguro_taiiku_jikan'],
  ['tokyo_taito_ueno_iyashi_annex', 'tokyo_taito_ueno_iyashinokuukan_annex'],
  ['tokyo_taito_ueno_tokyo_luxury', 'tokyo_taito_ueno_tokyo-luxury'],
  ['tokyo_sumida_ryogoku_otonaspa_kutsurogi', 'tokyo_sumida_ryougoku_otonaspa_kutsurogi'],
  ['tokyo_adachi_kitasenju_muchispa', 'tokyo_adachi_kitasenju_muchispa_room'],
  ['tokyo_ota_kamata_angeaile', 'tokyo_ota_kamata_anjuaile'],
  ['tokyo_setagaya_sangenjaya_sanchabijin', 'tokyo_setagaya_sangenjaya_sancha_bijin'],
  ['tokyo_nakano_nakano_golden', 'tokyo_nakano_golden'],
];

for (const [id1, id2] of pairs) {
  const s1 = shopMap[id1];
  const s2 = shopMap[id2];
  console.log(`\n===== ${s1?.name || id1} =====`);
  for (const s of [s1, s2]) {
    if (!s) { console.log(`  ${id1 === s1?.id ? id2 : id1}: NOT FOUND`); continue; }
    const cnt = countMap[s.id] || 0;
    console.log(`  [${s.id}]`);
    console.log(`    group_id : ${s.group_id}`);
    console.log(`    therapists: ${cnt}名`);
    console.log(`    website  : ${s.website_url || 'null'}`);
    console.log(`    image    : ${s.image_url ? '✅' : 'null'}`);
    console.log(`    pref/city: ${s.raw_data?.prefecture} ${s.raw_data?.city} ${s.raw_data?.area || ''}`);
  }
}
