import fs from 'fs';
import path from 'path';

const dir = 'scripts';
if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.mjs') || f.endsWith('.js'));
  console.log('🔍 過去に使っていたデータ登録系のスクリプトを特定します...\n');
  
  let found = false;
  files.forEach(f => {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    // 店舗やセラピストを登録（POST）したり、外部サイトからデータを引っ張っている形跡を探す
    if (content.includes('POST') && (content.includes('therapists') || content.includes('shops'))) {
      console.log(`🎯 発見！本命の登録スクリプト 👉 scripts/${f}`);
      found = true;
    } else if (content.includes('cheerio') || content.includes('puppeteer') || content.includes('jsdom')) {
      console.log(`🕷️ スクレイピングの形跡あり 👉 scripts/${f}`);
      found = true;
    }
  });

  if (!found) {
    console.log('📂 自動判定できませんでした。scripts内の全ファイル一覧:');
    files.forEach(f => console.log(` - ${f}`));
  }
} else {
  console.log('⚠️ scriptsフォルダがありません。');
}
