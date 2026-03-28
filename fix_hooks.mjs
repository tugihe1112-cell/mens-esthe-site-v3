import fs from 'fs';

const filePath = 'src/pages/ThreadDetailPage.jsx';
let code = fs.readFileSync(filePath, 'utf-8');

// 1. 念のため現在の状態をバックアップ
fs.writeFileSync(filePath + '.bak', code);

// 2. エラーの原因になっているLoadingブロックを抽出
const targetRegex = /\s*\/\/\s*🔥\s*データが到着するまでは[\s\S]*?if\s*\(isLoading\)\s*\{\s*return\s*<div[^>]*>データを読み込み中\.\.\.<\/div>;\s*\}/;
const match = code.match(targetRegex);

if (match) {
  // 元の場所（上の方）から削除
  code = code.replace(targetRegex, '');
  
  // ファイルの一番最後にあるメインの「return」を探す
  const lines = code.split('\n');
  let insertIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim().startsWith('return ') && (lines[i].includes('<') || lines[i].includes('('))) {
      insertIndex = i;
      break;
    }
  }

  // メインのreturnの直前（すべてのHookの下）に安全に挿入
  if (insertIndex !== -1) {
    lines.splice(insertIndex, 0, match[0] + '\n');
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log("✅ 修正成功！LoadingブロックをHookの下の安全な位置に移動しました。");
  } else {
    console.log("❌ メインのreturnが見つかりませんでした。");
  }
} else {
  console.log("❌ 対象のLoadingブロックが見つかりませんでした。");
}
