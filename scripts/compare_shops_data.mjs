import fs from 'fs';

function run() {
  console.log('🔍 「ゆるスパ」と「メンエスグループ」のローカルデータを比較します...\n');
  
  const yuruId = 'tokyo_shinagawa_gotanda_yuru_spa';
  const menesId = 'tokyo_setagaya_futakotamagawa_mens_esthe_group';
  
  // VITEが読み込んでいる可能性が高いJSONファイル
  const filePaths = ['public/data/shops.json', 'src/data/shops.json'];

  for (const path of filePaths) {
    if (!fs.existsSync(path)) continue;
    
    try {
      const raw = JSON.parse(fs.readFileSync(path, 'utf8'));
      const shops = Array.isArray(raw) ? raw : raw.shops || [];
      
      const yuru = shops.find(s => s.id === yuruId);
      const menes = shops.find(s => s.id === menesId);

      if (!yuru && !menes) continue;

      console.log(`📄 参照ファイル: ${path}`);
      console.log('--------------------------------------------------');
      
      if (yuru) {
        console.log(`✅ ゆるスパ 五反田店（成功している方）`);
        console.log(`  - website_url  :`, yuru.website_url);
        console.log(`  - schedule_url :`, yuru.schedule_url);
        console.log(`  - links        :`, JSON.stringify(yuru.links || null));
        console.log(`  - url          :`, yuru.url);
      } else {
        console.log(`❌ ゆるスパ 五反田店: データが見つかりません`);
      }

      console.log('--------------------------------------------------');

      if (menes) {
        console.log(`⚠️ メンエスグループ（失敗している方）`);
        console.log(`  - website_url  :`, menes.website_url);
        console.log(`  - schedule_url :`, menes.schedule_url);
        console.log(`  - links        :`, JSON.stringify(menes.links || null));
        console.log(`  - url          :`, menes.url);
      } else {
        console.log(`❌ メンエスグループ: データが見つかりません`);
      }
      console.log('==================================================\n');

    } catch (e) {
      console.error(`❌ ${path} の読み込みエラー:`, e.message);
    }
  }
}

run();
