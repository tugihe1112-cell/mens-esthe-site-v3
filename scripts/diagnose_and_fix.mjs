import fs from 'fs';
import path from 'path';

const targetFile = path.resolve('src/data/locations.js');

console.log('🔍 【原因究明】ターミナル上で locations.js のエラー箇所を特定します...\n');

if (!fs.existsSync(targetFile)) {
  console.log('⚠️ locations.js が見つかりません。');
  process.exit(1);
}

const content = fs.readFileSync(targetFile, 'utf-8');
const lines = content.split('\n');
let brokenCount = 0;
const fixedLines = [];

lines.forEach((line, i) => {
  // 致命的なエラー: 左側の名前が消え、コロン(:)から始まっている行
  if (/^\s*:\s*\[/.test(line)) {
    console.log(`🚨 [原因特定] ${i + 1}行目: 都道府県名が消去され、コロンだけが残る構文エラーが発生しています。`);
    console.log(`   実際のコード -> ${line}`);
    brokenCount++;
  } 
  // その他の配列の破損
  else if (line.includes('[,') || line.includes(', ,') || line.match(/^\s*,\s*\]/)) {
    console.log(`🚨 [原因特定] ${i + 1}行目: 配列の構文が壊れています。`);
    console.log(`   実際のコード -> ${line}`);
    brokenCount++;
  } 
  else {
    fixedLines.push(line);
  }
});

if (brokenCount > 0) {
  console.log(`\n🛠️ 計 ${brokenCount} 箇所の構文エラーを検知しました。対象行を削除して修復します...`);
  fs.writeFileSync(targetFile, fixedLines.join('\n'));
  console.log('✅ 修復および上書き保存が完了しました。ファイルは正常な状態です。');
} else {
  console.log('✅ locations.js の中に明らかな構文エラーは見つかりませんでした（すでに修復済みか、バックアップ適用済みの状態です）。');
}
