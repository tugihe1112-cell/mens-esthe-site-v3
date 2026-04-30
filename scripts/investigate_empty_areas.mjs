import fs from 'fs';
import path from 'path';

async function main() {
  const targetFile = path.resolve('src/data/locations.js');
  
  if (!fs.existsSync(targetFile)) {
    console.log('⚠️ locations.js が見つかりません。');
    return;
  }

  const content = fs.readFileSync(targetFile, 'utf-8');
  console.log('🔍 locations.js 内の必須データ（REGIONS, PREF_CITY_MAP, WARDS）の状態を調査します...\n');

  const targets = ['REGIONS', 'PREF_CITY_MAP', 'WARDS'];
  
  targets.forEach(varName => {
    if (content.includes(varName)) {
      console.log(`✅ [${varName}]: ファイル内に記述があります。`);
      // 変数の中身の最初の部分を抽出
      const regex = new RegExp(`(?:const|let|var|export const)\\s+${varName}\\s*=\\s*([\\s\\S]{0,100})`);
      const match = content.match(regex);
      
      if (match) {
        let preview = match[1].replace(/\n/g, ' ').trim();
        console.log(`   プレビュー -> ${preview}...`);
        
        if (preview.startsWith('{}') || preview.startsWith('[]')) {
           console.log(`   🚨 警告: データが完全に空っぽです！これがメニューに文字が出ない直接の原因です。`);
        }
      }
    } else {
      console.log(`❌ [${varName}]: ファイル内に存在しません！（画面が正しく描画されない原因です）`);
    }
  });

  console.log('\n--- ファイル末尾（エクスポート部分）の現在のコード ---');
  const lines = content.split('\n');
  // 最後の10行を表示して、強引な修復スクリプトが何をしたか確認
  console.log(lines.slice(-10).join('\n'));
}

main();
