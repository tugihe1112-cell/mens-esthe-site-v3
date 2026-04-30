import fs from 'fs';

const filePath = 'src/data/locations.js';

try {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // 修正前の行（道玄坂・円山町が含まれている）
  const targetText = '"渋谷区": ["渋谷", "恵比寿", "道玄坂", "円山町", "原宿", "代々木", "初台", "笹塚", "広尾"]';
  
  // 修正後の行（道玄坂・円山町を削除）
  const newText = '"渋谷区": ["渋谷", "恵比寿", "原宿", "代々木", "初台", "笹塚", "広尾"]';

  if (content.includes(targetText)) {
    content = content.replace(targetText, newText);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("✅ src/data/locations.js を更新しました！");
    console.log("🎉 サイドバーから「道玄坂」「円山町」が削除されました！");
  } else {
    console.log("⚠️ 対象の文字列が見つかりませんでした。すでに変更されているか、スペースの空き方が違う可能性があります。");
  }
} catch (error) {
  console.error("エラーが発生しました:", error);
}
