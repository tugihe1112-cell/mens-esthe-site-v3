import fs from 'fs';
import path from 'path';

function findFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, fileList);
    } else if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes('supabase') && (content.includes('reviews') || content.includes('useParams'))) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const result = findFiles('./src');
console.log('--- 対象ファイル候補 ---');
result.forEach(f => console.log(f));
