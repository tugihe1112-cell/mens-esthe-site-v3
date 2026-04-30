import fs from 'fs';
import path from 'path';

function findShopDetailFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findShopDetailFiles(filePath, fileList);
    } else if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      // 店舗データやSupabaseを扱っていそうなファイルを探す
      if (content.includes('supabase') && (content.includes('shops') || content.includes('useParams'))) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const files = findShopDetailFiles('./src');
if (files.length > 0) {
  console.log('🔍 店舗情報を扱っていそうなReactファイルを見つけました:\n');
  files.forEach(f => {
    console.log(`\n==================================================`);
    console.log(`📄 ファイルパス: ${f}`);
    console.log(`==================================================\n`);
    console.log(fs.readFileSync(f, 'utf-8'));
  });
  console.log('\n✅ 上記のターミナル出力をそのままコピーして、チャットに貼り付けてください。');
} else {
  console.log('⚠️ 対象のファイルが見つかりませんでした。src フォルダ内の構成を教えてください。');
}
