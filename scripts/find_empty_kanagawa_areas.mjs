import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// 画像から抽出した地名と、データベースで使われていそうなIDキーワードの対応表
const candidates = [
  { name: '横浜駅', keywords: ['yokohama_eki', 'yokohama'] },
  { name: '関内', keywords: ['kannai'] },
  { name: '伊勢佐木町', keywords: ['isezaki', 'isesaki'] },
  { name: '新横浜', keywords: ['shinyokohama', 'shin_yokohama'] },
  { name: 'みなとみらい', keywords: ['minatomirai', 'minato_mirai'] },
  { name: '川崎', keywords: ['kawasaki'] },
  { name: '鶴見', keywords: ['tsurumi'] },
  { name: '堀之内', keywords: ['horinouchi'] },
  { name: '南町', keywords: ['minamicho', 'minami_cho', 'minami'] },
  { name: '武蔵小杉', keywords: ['musashikosugi', 'musashi_kosugi', 'kosugi'] },
  { name: '溝の口', keywords: ['mizonokuchi', 'mizo_no_kuchi'] }
];

async function main() {
  console.log('🔍 神奈川エリアの各地名候補の店舗登録状況を調査します...\n');
  try {
    // 1. 神奈川の店舗を全取得
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, area_id')
      .ilike('area_id', '%kanagawa%');

    if (error) throw error;

    console.log(`✅ 神奈川県全体で 【 ${shops.length} 店舗 】 のデータが見つかりました。\n`);

    // 2. 各候補エリアごとの店舗数をカウント
    const results = candidates.map(c => {
      const matchingShops = shops.filter(shop => {
        const areaId = (shop.area_id || '').toLowerCase();
        const shopName = shop.name || '';
        
        // area_idにキーワードが含まれるか、店舗名に地名が含まれるか
        const matchKeyword = c.keywords.some(kw => areaId.includes(kw));
        // 「横浜駅」などの「駅」を除いた文字で店舗名マッチも一応チェック
        const matchName = shopName.includes(c.name.replace('駅', '')); 
        
        // 横浜のように広すぎるキーワードの場合は、より具体的な地名が含まれていたら除外（例: 横浜だが関内である等）
        // ※ここでは簡易的にいずれかにヒットすればOKとする
        return matchKeyword || matchName;
      });
      return { name: c.name, count: matchingShops.length };
    });

    // 3. 結果の表示
    console.log('📊 【調査結果】各エリアの登録店舗数:');
    let hasEmpty = false;
    results.forEach(r => {
      if (r.count === 0) {
        console.log(`❌ ${r.name}: 0店舗 （← 画面にあるのに空っぽです！）`);
        hasEmpty = true;
      } else {
        console.log(`✅ ${r.name}: ${r.count}店舗`);
      }
    });

    if (!hasEmpty) {
      console.log('\n✨ すべてのエリアに最低1店舗は登録されていました。');
    }

  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
