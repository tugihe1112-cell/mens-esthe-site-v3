/**
 * 未着手エリア DB登録チェック
 * 実行: node scripts/debug/check_uncovered_areas.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const CHECKS = [
  // 蒲田/大森
  { area: '蒲田1位', name: 'Angeaile (アンジュエール)', kw: 'アンジュエール' },
  { area: '蒲田2位', name: 'RheaSpa (レアスパ) 蒲田', kw: 'レアスパ' },
  { area: '蒲田3位', name: 'FIRST CLASS', kw: 'FIRST CLASS' },
  { area: '蒲田4位', name: 'LIVSPA (リブスパ)', kw: 'リブスパ' },
  { area: '蒲田5位', name: 'Shake spa', kw: 'シェイクスパ' },
  // 目黒
  { area: '目黒1位', name: 'Linda Spa 目黒', kw: 'リンダスパ' },
  { area: '目黒2位', name: 'メンエスグループ 目黒', kw: 'メンエスグループ' },
  { area: '目黒3位', name: 'GRACE 目黒', kw: 'グレース' },
  { area: '目黒4位', name: 'DAHLIA 目黒', kw: 'ダリア' },
  { area: '目黒5位', name: '体育の時間 目黒', kw: '体育の時間' },
  // 恵比寿
  { area: '恵比寿1位', name: 'メンズエステ恵比寿', kw: 'メンズエステ恵比寿' },
  { area: '恵比寿2位', name: 'Belle E (ベルエ)', kw: 'ベルエ' },
  { area: '恵比寿3位', name: 'MINERVA (ミネルバ)', kw: 'ミネルバ' },
  { area: '恵比寿4位', name: 'Aroma Miely', kw: 'ミエリー' },
  { area: '恵比寿5位', name: 'Linda Spa 恵比寿', kw: 'リンダスパ' },
  // 中目黒
  { area: '中目黒1位', name: 'Linda Spa 中目黒', kw: 'リンダスパ' },
  { area: '中目黒2位', name: 'MINERVA 中目黒', kw: 'ミネルバ' },
  { area: '中目黒3位', name: 'shake spa 中目黒', kw: 'シェイクスパ' },
  { area: '中目黒4位', name: 'メンズエステ中目黒', kw: 'メンズエステ中目黒' },
  { area: '中目黒5位', name: 'MoMo Spa', kw: 'モモスパ' },
  // 新橋
  { area: '新橋1位', name: 'THE HALF 新橋', kw: 'ザ・ハーフ' },
  { area: '新橋2位', name: 'Body Spa 新橋', kw: 'ボディスパ' },
  { area: '新橋3位', name: 'NEW+PLUS 新橋', kw: 'ニュープラス' },
  { area: '新橋4位', name: 'Sweet Mist 新橋', kw: 'スイートミスト' },
  { area: '新橋5位', name: 'relax tokyo', kw: 'リラックストウキョウ' },
  // 代々木
  { area: '代々木1位', name: 'GrandGaia', kw: 'グランドガイア' },
  { area: '代々木2位', name: 'AROMA LUNABELLE 代々木', kw: 'ルナベル' },
  { area: '代々木3位', name: 'Ho・O・Zu・Ki・SPA', kw: 'ホオズキ' },
  { area: '代々木4位', name: 'オトナコード4030', kw: 'オトナコード' },
  { area: '代々木5位', name: 'Spa Ytree', kw: 'ワイツリー' },
  // 中野
  { area: '中野1位', name: 'Lucky Cat', kw: 'ラッキーキャット' },
  { area: '中野2位', name: 'ADAMAS', kw: 'アダマス' },
  { area: '中野3位', name: 'GOLDEN 中野', kw: 'ゴールデン' },
  { area: '中野4位', name: 'a l\'aise SK 中野', kw: 'アレイズ' },
  { area: '中野5位', name: 'Salvador', kw: 'サルバドール' },
  // 赤羽
  { area: '赤羽1位', name: 'Yorimichi 赤羽', kw: 'よりみち' },
  { area: '赤羽2位', name: 'MABUI 東京 赤羽', kw: 'マブイ' },
  { area: '赤羽3位', name: 'cozy 赤羽', kw: 'コーズィー' },
  { area: '赤羽4位', name: 'Alice (アリス)', kw: 'アリス' },
  { area: '赤羽5位', name: 'CreamSoda', kw: 'クリームソーダ' },
  // 北千住
  { area: '北千住1位', name: 'sasayaki (ささやき)', kw: 'ささやき' },
  { area: '北千住2位', name: 'らんぷ 北千住', kw: 'らんぷ' },
  { area: '北千住3位', name: '天界のスパ', kw: '天界' },
  { area: '北千住4位', name: 'REMIS (ランス)', kw: 'ランス' },
  { area: '北千住5位', name: 'MACHERIE', kw: 'マシェリ' },
  // 神田
  { area: '神田1位', name: 'Chill Spa', kw: 'ちるスパ' },
  { area: '神田2位', name: 'お願いSPA 神田', kw: 'お願いSPA' },
  { area: '神田3位', name: 'LuxuryTime 神田', kw: 'ラグタイム' },
  { area: '神田4位', name: '素人ホーテ 神田', kw: '素人ホーテ' },
  { area: '神田5位', name: 'AROMA IMPERIAL', kw: 'アロマインペリアル' },
  // 赤坂
  { area: '赤坂1位', name: 'AROMA EMERALD', kw: 'アロマエメラルド' },
  { area: '赤坂2位', name: 'GrandAromaTOKYO', kw: 'グランドアロマ' },
  { area: '赤坂3位', name: 'アルバ TOKYO 赤坂', kw: 'アルバ' },
  { area: '赤坂4位', name: 'Spa Ange 赤坂', kw: 'スパアンジュ' },
  { area: '赤坂5位', name: 'For Aladdin 赤坂', kw: 'アラジン' },
  // 三軒茶屋
  { area: '三軒茶屋1位', name: 'エルドラド', kw: 'エルドラド' },
  { area: '三軒茶屋2位', name: '三茶美人', kw: '三茶美人' },
  { area: '三軒茶屋3位', name: 'AUTHORITY', kw: 'オーソリティー' },
  { area: '三軒茶屋4位', name: 'ANAICHI 三軒茶屋', kw: 'あないち' },
  { area: '三軒茶屋5位', name: 'Marron', kw: 'マロン' },
  // 錦糸町
  { area: '錦糸町1位', name: 'Garden SPA', kw: 'ガーデンスパ' },
  { area: '錦糸町2位', name: 'High Time Spa', kw: 'ハイタイムスパ' },
  { area: '錦糸町3位', name: 'COCONA GRAN', kw: 'ココナグラン' },
  { area: '錦糸町4位', name: 'ワイフコレクション', kw: 'ワイフコレクション' },
  { area: '錦糸町5位', name: 'Neo MIYABI', kw: 'ネオミヤビ' },
  // 吉祥寺
  { area: '吉祥寺1位', name: 'Yorimichi 吉祥寺', kw: 'よりみち' },
  { area: '吉祥寺2位', name: 'moshimo...', kw: 'もしも' },
  { area: '吉祥寺3位', name: 'Allie (アリー)', kw: 'アリー' },
  { area: '吉祥寺4位', name: 'ROOKIE 三鷹', kw: 'ルーキー' },
  { area: '吉祥寺5位', name: 'まろん 吉祥寺', kw: 'まろん' },
];

async function main() {
  console.log('=== 未着手エリア DB登録チェック ===\n');
  const missing = [];
  let prevArea = '';

  for (const c of CHECKS) {
    const areaName = c.area.replace(/\d+位$/, '');
    if (areaName !== prevArea) { console.log(`\n--- ${areaName} ---`); prevArea = areaName; }

    const { data } = await supabase.from('shops').select('id,name').ilike('name', `%${c.kw}%`).limit(3);
    if (data?.length) {
      const { count } = await supabase.from('therapists').select('*', { count: 'exact', head: true }).eq('shop_id', data[0].id);
      console.log(`✅ ${c.area} ${c.name} (${count ?? '?'}名)`);
    } else {
      missing.push(c);
      console.log(`❌ ${c.area} ${c.name}`);
    }
  }

  console.log(`\n${'='.repeat(40)}`);
  console.log(`未登録: ${missing.length}件`);
  const byArea = {};
  missing.forEach(c => {
    const a = c.area.replace(/\d+位$/, '');
    if (!byArea[a]) byArea[a] = [];
    byArea[a].push(`${c.area}: ${c.name}`);
  });
  Object.entries(byArea).forEach(([area, items]) => {
    console.log(`\n【${area}】`);
    items.forEach(i => console.log(`  ${i}`));
  });
}
main().catch(console.error);
