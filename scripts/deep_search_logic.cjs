const fs = require('fs');
const path = require('path');

const TARGET_DIR = 'src';

// 探したい「痕跡」の定義
const PATTERNS = [
  { name: 'Navigation with State', regex: /navigate\s*\(\s*.*,\s*\{.*state:/ }, // navigate(..., { state: ... })
  { name: 'Location State Access', regex: /location\.state/ },                // location.state
  { name: 'URL Params Access',     regex: /useParams/ },                      // useParams
  { name: 'Form Initial Values',   regex: /initialValues|defaultValues/ },    // 初期値設定
  { name: 'Therapist ID usage',    regex: /therapistId|threadId/ },           // IDの扱い
  { name: 'Review Submission',     regex: /handleSubmit|onSubmit/ }           // 送信処理
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
  const lines = content.split('\n');
  let fileHits = [];

  lines.forEach((line, index) => {
    PATTERNS.forEach(pattern => {
      if (pattern.regex.test(line)) {
        // 短すぎる行やimport文はノイズになりやすいので除外（useParamsは重要なので残す）
        if (line.length < 200 && (!line.includes('import ') || pattern.name === 'URL Params Access')) {
          fileHits.push({
            line: index + 1,
            type: pattern.name,
            code: line.trim()
          });
        }
      }
    });
  });

  if (fileHits.length > 0) {
    // PostReviewPageやuseReviewFormなど、怪しいファイルだけを表示
    if (filePath.includes('Review') || filePath.includes('Thread') || filePath.includes('Shop')) {
      console.log(`\n📄 Found in: ${filePath}`);
      console.log('---------------------------------------------------');
      fileHits.forEach(hit => {
        console.log(`  L${hit.line} [${hit.type}]: ${hit.code}`);
      });
    }
  }
}

console.log("🔍 失われたロジック（データ連携・投稿機能）を詳細検索中...");
scanDir(TARGET_DIR);
