const fs = require('fs');
const path = require('path');

const TARGET_DIR = 'src';
const KEYWORDS = [
  'Review',        // クチコミ関連
  'Submit',        // 送信/投稿
  'Post',          // 投稿
  'Form',          // フォーム
  'Modal',         // モーダル
  'Button',        // ボタン
  'Thread',        // スレッド/セラピスト詳細
  'TherapistDetail',
  'handleClick',
  'navigate'
];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      checkFile(fullPath);
    }
  });
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const foundKeywords = KEYWORDS.filter(k => content.includes(k));

  if (foundKeywords.length > 0) {
    // コンポーネント名っぽいものを抽出
    const isComponent = /export default function (\w+)/.exec(content);
    const componentName = isComponent ? isComponent[1] : path.basename(filePath);

    // 特に「クチコミ投稿」や「セラピスト詳細」に関わりそうなファイルを強調表示
    const isHighPriority = 
      (filePath.includes('Review') && filePath.includes('Form')) ||
      (filePath.includes('Thread') && filePath.includes('Detail')) ||
      content.includes('レビュー投稿') ||
      content.includes('クチコミ');

    if (isHighPriority) {
      console.log(`\n🔥 【重要候補】 ${filePath}`);
      console.log(`   - Component: ${componentName}`);
      console.log(`   - Keywords: ${foundKeywords.join(', ')}`);
      
      // ボタンやリンクのコード周辺をチラ見せ
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('onClick') || line.includes('Link') || line.includes('Button')) {
          if (line.includes('Review') || line.includes('Thread') || line.includes('投稿')) {
             console.log(`     L${i+1}: ${line.trim().substring(0, 80)}...`);
          }
        }
      });
    }
  }
}

console.log("🕵️‍♂️ 消えた機能（クチコミ・投稿ボタン・詳細ページ）を捜索中...");
scanDir(TARGET_DIR);
