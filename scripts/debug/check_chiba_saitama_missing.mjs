/**
 * 千葉・埼玉 ランキング未登録店舗チェック
 * mens-mg.com TOP10と現在のDBを照合して未登録店舗を特定
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// ランキングTOP10 店舗リスト（mens-mg.com 2026年調査）
const RANKING_SHOPS = {
  '千葉': [
    { name: 'MadameRest', area: 'chiba' },
    { name: 'SPA DREAM', area: 'chiba' },
    { name: 'Madame Relax', area: 'chiba' },
    { name: 'Body Spa', area: 'chiba' },
    { name: 'SUHADA SPA', area: 'chiba' },
    { name: 'メンエス案内所', area: 'chiba' },
    { name: 'Marin', area: 'chiba' },
    { name: 'Frevi', area: 'chiba' },
    { name: 'RISPA', area: 'chiba' },
  ],
  '松戸': [
    { name: 'Rose', area: 'chiba' },
    { name: 'Aroma Mrs', area: 'chiba' },
    { name: '秘密の扉', area: 'chiba' },
    { name: 'Paradise Spa', area: 'chiba' },
    { name: 'Lovers', area: 'chiba' },
    { name: 'STELLA', area: 'chiba' },
    { name: 'AROMA REGINA', area: 'chiba' },
    { name: 'Luxury', area: 'chiba' },
    { name: 'Deeplus', area: 'chiba' },
    { name: 'AGENDA', area: 'chiba' },
  ],
  '柏': [
    { name: 'LUANA', area: 'chiba' },
    { name: 'SUHADA SPA', area: 'chiba' },
    { name: 'M Labo Spa', area: 'chiba' },
    { name: '美女SPA', area: 'chiba' },
    { name: 'Eden Spa', area: 'chiba' },
    { name: 'Aroma Eagle', area: 'chiba' },
    { name: 'Milk Peach', area: 'chiba' },
    { name: 'AJ DOLLS', area: 'chiba' },
    { name: '柏エステマジック', area: 'chiba' },
    { name: '極液専門店', area: 'chiba' },
  ],
  '大宮': [
    { name: 'Regis', area: 'saitama' },
    { name: 'Offsuit', area: 'saitama' },
    { name: 'MrsEternity', area: 'saitama' },
    { name: 'Queendom', area: 'saitama' },
    { name: 'らんぷ', area: 'saitama' },
    { name: 'エステティシャンの彼女', area: 'saitama' },
    { name: 'ACE', area: 'saitama' },
    { name: 'AROMA CASTLE', area: 'saitama' },
    { name: 'マダムラブキャット', area: 'saitama' },
    { name: 'THE 美セス', area: 'saitama' },
  ],
  '浦和': [
    { name: '蜜の安らぎ', area: 'saitama' },
    { name: '紅', area: 'saitama' },
    { name: 'AROMA CHIAFUL', area: 'saitama' },
    { name: 'ROMEO', area: 'saitama' },
    { name: 'Pink Lady', area: 'saitama' },
    { name: 'RADI WELL SPA', area: 'saitama' },
    { name: '秘密のミセスルーム', area: 'saitama' },
    { name: 'メンズエステ妻', area: 'saitama' },
    { name: 'エデンの園', area: 'saitama' },
    { name: 'らんぷ 戸田店', area: 'saitama' },
  ],
  '川口・蕨': [
    { name: '大人の停車場', area: 'saitama' },
    { name: 'Lynx', area: 'saitama' },
    { name: 'MABUI', area: 'saitama' },
    { name: 'まごころスパ', area: 'saitama' },
    { name: 'Pattaya Resort', area: 'saitama' },
    { name: 'スキっとSPA', area: 'saitama' },
    { name: 'Apex+', area: 'saitama' },
    { name: 'エデンの園', area: 'saitama' },
    { name: 'Natural Spa', area: 'saitama' },
    { name: 'Special Grade', area: 'saitama' },
  ],
  '越谷・春日部・草加': [
    { name: 'Aroma Liberty', area: 'saitama' },
    { name: 'ぼくのエステ', area: 'saitama' },
    { name: 'Laugh Tale', area: 'saitama' },
    { name: 'Luxuary', area: 'saitama' },
    { name: 'Red Ribbon', area: 'saitama' },
    { name: 'SABON', area: 'saitama' },
    { name: '今日子の姉妹', area: 'saitama' },
    { name: 'COCO SPA', area: 'saitama' },
    { name: 'Amour', area: 'saitama' },
    { name: 'AJ DOLLS', area: 'saitama' },
  ],
  '川越': [
    { name: 'Nature', area: 'saitama' },
    { name: '大人のNEVERLAND', area: 'saitama' },
    { name: 'KING', area: 'saitama' },
    { name: 'Re:Fle Spa', area: 'saitama' },
    { name: 'らんぷ 川越店', area: 'saitama' },
    { name: 'Anela Spa', area: 'saitama' },
    { name: 'Be-majo', area: 'saitama' },
    { name: 'SWEET SPA', area: 'saitama' },
    { name: 'Rose Belle', area: 'saitama' },
  ],
  '所沢': [
    { name: '都 -miyako-', area: 'saitama' },
    { name: 'Pause Grande', area: 'saitama' },
    { name: '所沢オーディション', area: 'saitama' },
    { name: 'Bariano', area: 'saitama' },
    { name: 'THIRD PLACE', area: 'saitama' },
    { name: 'らんぷ 所沢店', area: 'saitama' },
    { name: 'Madam Lilly', area: 'saitama' },
    { name: 'rexgran', area: 'saitama' },
    { name: '癒し処かなで', area: 'saitama' },
    { name: 'PriMaDona', area: 'saitama' },
  ],
};

async function main() {
  // 千葉・埼玉の全店舗を取得
  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, raw_data')
    .or("raw_data->>prefecture.eq.千葉県,raw_data->>prefecture.eq.埼玉県,id.like.chiba%,id.like.saitama%");

  if (error) {
    console.error('DB取得エラー:', error);
    return;
  }

  console.log(`\nDB登録済み店舗数（千葉・埼玉）: ${shops.length}件`);
  console.log('登録済み店舗名一覧:');
  shops.forEach(s => console.log(`  [${s.id}] ${s.name}`));

  console.log('\n\n=== ランキングTOP10 vs DB照合結果 ===\n');

  const norm = (str) => str.toLowerCase().replace(/[～~\s　・-]/g, '').replace(/[ａ-ｚＡ-Ｚ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));

  let missingCount = 0;

  for (const [area, rankShops] of Object.entries(RANKING_SHOPS)) {
    console.log(`\n【${area}】`);
    for (const rs of rankShops) {
      const normName = norm(rs.name);
      const found = shops.find(s => norm(s.name).includes(normName) || normName.includes(norm(s.name)));
      if (found) {
        console.log(`  ✅ ${rs.name} → ${found.name} [${found.id}]`);
      } else {
        console.log(`  ❌ ${rs.name} → 未登録`);
        missingCount++;
      }
    }
  }

  console.log(`\n\n未登録店舗数: ${missingCount}件`);
}

main();
