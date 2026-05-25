/**
 * group_id 統合・タイポ修正スクリプト
 * カテゴリA: ハイフン/アンダースコアのタイポ修正
 * カテゴリB: 全 g_solo_ ブランドを新しい group_id に統合
 * カテゴリC: 既存ブランドグループに漏れた g_solo_ を統合
 * ※カテゴリD（同一場所への重複登録）は別途確認が必要なため対象外
 *
 * 実行: node scripts/maintenance/fix_group_ids.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (DRY_RUN) console.log('[DRY RUN]\n');

// from → to のマッピング
const FIXES = [
  // ── カテゴリA: タイポ修正（ハイフン→アンダースコア）──────────────
  { from: 'g_brand_salon-blanca',  to: 'g_brand_salon_blanca',  label: 'SALON BLANCA 銀座店' },
  { from: 'g_brand_dejavu-tokyo',  to: 'g_brand_dejavu_tokyo',  label: 'Dejavu TOKYO 銀座店' },

  // ── カテゴリB: 全 g_solo_ → 新しいブランドグループ ──────────────
  { from: 'g_solo_tokyo_shinjuku_natural_kagurazaka',    to: 'g_brand_natural', label: 'NATURAL 神楽坂' },
  { from: 'g_solo_tokyo_minato_natural_roppongi',        to: 'g_brand_natural', label: 'NATURAL 六本木' },
  { from: 'g_solo_tokyo_shinjuku_natural_shinokubo',     to: 'g_brand_natural', label: 'NATURAL 新大久保' },
  { from: 'g_solo_tokyo_toshima_natural_ikebukuro',      to: 'g_brand_natural', label: 'NATURAL 池袋' },
  { from: 'g_solo_tokyo_shibuya_natural_yoyogi',         to: 'g_brand_natural', label: 'NATURAL 代々木' },
  { from: 'g_solo_tokyo_shinjuku_natural_shinjukugyoen', to: 'g_brand_natural', label: 'NATURAL 新宿御苑' },

  { from: 'g_solo_tokyo_shinjuku_aroma_levante_shinjuku', to: 'g_brand_aroma_levante', label: 'Aroma Levante 新宿' },
  { from: 'g_solo_tokyo_shibuya_aroma_levante',           to: 'g_brand_aroma_levante', label: 'Aroma Levante 代々木①' },
  { from: 'g_solo_tokyo_yoyogi_aroma_levante',            to: 'g_brand_aroma_levante', label: 'Aroma Levante 代々木②' },

  { from: 'g_solo_tokyo_shinjuku_chocolate_shinokubo',    to: 'g_brand_chocolate', label: 'Chocolate 新大久保' },
  { from: 'g_solo_tokyo_shinjuku_chocolate_shinjuku',     to: 'g_brand_chocolate', label: 'Chocolate 新宿御苑' },
  { from: 'g_solo_tokyo_shibuya_aroma_chocolate_tokyo',   to: 'g_brand_chocolate', label: 'Chocolate 代々木' },

  { from: 'g_solo_osaka_takatsuki_wifeline',  to: 'g_brand_waifurain', label: '和いふらいん 高槻' },
  { from: 'g_solo_osaka_juso_wife_line',      to: 'g_brand_waifurain', label: '和いふらいん 堺筋本町' },

  { from: 'g_solo_osaka_nipponbashi_super_happy',     to: 'g_brand_super_happy_girls', label: 'スーパーハッピーガールズ ①' },
  { from: 'g_solo_osaka_umeda_super_happy_girls',     to: 'g_brand_super_happy_girls', label: 'スーパーハッピーガールズ ②' },

  { from: 'g_solo_60338', to: 'g_brand_linda_spa', label: 'LINDA SPA 恵比寿' },
  { from: 'g_solo_60235', to: 'g_brand_linda_spa', label: 'LINDA SPA 目黒' },
  { from: 'g_solo_60203', to: 'g_brand_linda_spa', label: 'LINDA SPA 三軒茶屋' },
  { from: 'g_ac816661',   to: 'g_brand_linda_spa', label: 'LINDA SPA 中目黒' },

  // ── カテゴリC: 既存ブランドグループへの統合 ──────────────────────
  { from: 'g_solo_kanagawa_kawasaki_hoozuki',          to: 'g_brand_hoozuki',        label: 'Ho・O・Zu・Ki・SPA 武蔵小杉' },
  { from: 'g_solo_tokyo_shinagawa_aroma_blossom',      to: 'g_brand_aroma_blossom',  label: 'Aroma Blossom 大崎' },
  { from: 'g_solo_tokyo_minato_aroma_blossom_3',       to: 'g_brand_aroma_blossom',  label: 'Aroma Blossom 広尾' },
  { from: 'g_solo_tokyo_shibuya_aroma_blossom',        to: 'g_brand_aroma_blossom',  label: 'Aroma Blossom 恵比寿' },
  { from: 'g_solo_60212',                              to: 'g_brand_aroma_blossom',  label: 'Aroma Blossom 田町' },
  { from: 'g_solo_kanagawa_atsugi_doigt_de_fee',       to: 'g_brand_doigt_de_fee',   label: 'doigt de fee 武蔵小杉' },
  { from: 'g_solo_kanagawa_kawasaki_doigt_de_fee_5',   to: 'g_brand_doigt_de_fee',   label: 'doigt de fee 溝の口' },
  { from: 'g_solo_8069b9a3-7bb1-44d3-a381-bfd1ff2bf9d5', to: 'g_brand_grace',        label: 'GRACE 不明店舗' },
  { from: 'g_solo_saitama_kuki_limited_spa',           to: 'g_brand_limited_spa',    label: 'Limited Spa 久喜' },
  { from: 'g_solo_chiba_funabashi_limited_spa_2',      to: 'g_brand_limited_spa',    label: 'Limited Spa 船橋' },
  { from: 'g_solo_chiba_kashiwa_limited_spa',          to: 'g_brand_limited_spa',    label: 'Limited Spa 柏' },
  { from: 'g_solo_chiba_togane_levechi_esthe',         to: 'g_brand_levechi_esthe',  label: '超レベチなエステ24 東金' },
  { from: 'g_solo_chiba_narita_levechi_esthe',         to: 'g_brand_levechi_esthe',  label: '超レベチなエステ24 成田' },
  { from: 'g_solo_kanagawa_yokohama_rabbit_spa',       to: 'g_brand_rabbit_spa',     label: 'ラビットスパ 横浜' },
  { from: 'g_solo_hyogo_ninomiya_eslino',              to: 'g_brand_eslino',          label: 'Kobe Eslino 二宮' },
  { from: 'g_solo_kanagawa_kawasaki_rere',             to: 'g_brand_rere',            label: 'RERE GROUP 戸塚' },
  { from: 'g_solo_tokyo_shibuya_candy_spa',            to: 'g_brand_candy_spa',       label: 'Candy Spa 恵比寿' },
  { from: 'g_solo_osaka_umeda_sr_himawari',            to: 'g_brand_sr_himawari',     label: 'SEACRET ROOM 梅田' },
  { from: 'g_solo_kanagawa_sagamihara_luxury_romance_2', to: 'g_brand_luxury_romance', label: 'Luxury Romance 相模原' },
  { from: 'g_solo_kanagawa_kawasaki_livspa',           to: 'g_livspa',                label: 'LIVSPA 川崎' },
  { from: 'g_solo_kanagawa_yokohama_liora',            to: 'g_brand_liora',           label: 'リオラ 横浜/静岡' },
  { from: 'g_solo_tokyo_shibuya_aroma_emerald',        to: 'g_brand_emerald',         label: 'AROMA EMERALD 恵比寿(solo)' },
];

// 全店舗を取得
const { data: shops, error } = await supabase.from('shops').select('id, name, group_id');
if (error) { console.log('エラー:', error.message); process.exit(1); }

const fromSet = new Map(FIXES.map(f => [f.from, f]));
const targets = shops.filter(s => s.group_id && fromSet.has(s.group_id));

console.log(`=== 修正対象: ${targets.length}件 ===\n`);
targets.forEach(s => {
  const fix = fromSet.get(s.group_id);
  console.log(`  ${fix.label}: ${s.group_id} → ${fix.to}`);
});

if (DRY_RUN || targets.length === 0) {
  console.log('\n対象なし or DRY RUN 終了');
  process.exit(0);
}

// group_id ごとにまとめて更新
let totalUpdated = 0;
for (const fix of FIXES) {
  const ids = targets.filter(s => s.group_id === fix.from).map(s => s.id);
  if (ids.length === 0) continue;

  const { error: updateError } = await supabase
    .from('shops')
    .update({ group_id: fix.to })
    .in('id', ids);

  if (updateError) {
    console.log(`❌ ${fix.label}: ${updateError.message}`);
  } else {
    process.stdout.write('.');
    totalUpdated += ids.length;
  }
}

console.log(`\n\n✅ ${totalUpdated}件の group_id を更新完了`);
