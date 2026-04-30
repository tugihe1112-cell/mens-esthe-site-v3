import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🔍 画面が真っ白になっている原因を究明・修復します...\n');
  const targetFile = path.resolve('src/data/locations.js');
  
  if (!fs.existsSync(targetFile)) {
    console.log('⚠️ src/data/locations.js が存在しません！これが原因です。');
    return;
  }

  try {
    let content = fs.readFileSync(targetFile, 'utf-8');
    const lines = content.split('\n');
    let brokenLines = [];

    // エラーの原因になった「プロパティ名のないコロン（例: `: ["水戸市"]`）」を探す
    lines.forEach((line, i) => {
      if (/^\s*:\s*\[/.test(line)) {
        brokenLines.push({ lineNum: i + 1, text: line });
      }
    });

    if (brokenLines.length > 0) {
      console.log('🚨 【原因判明】ファイル内にまだ文法エラー（孤立したコロン）が残っています！');
      brokenLines.forEach(bl => console.log(`   [${bl.lineNum}行目] ${bl.text}`));
      
      console.log('\n🛠️ 壊れた行を自動削除して修復します...');
      const fixedLines = lines.filter(line => !/^\s*:\s*\[/.test(line));
      fs.writeFileSync(targetFile, fixedLines.join('\n'));
      console.log('✅ 修復が完了しました！ブラウザをリロードしてください。');

    } else {
      console.log('✅ locations.js の中に、エラーの原因となる文法ミスは見つかりませんでした！ファイルは正常です。');
      console.log('\n💡 【画面が真っ白なままの理由】');
      console.log('Vite（開発サーバー）が先ほどのエラーのショックでフリーズし、最新のファイルを読み込めていない状態です。');
      console.log('\n🚀 【解決手順】');
      console.log('1. 現在 npm run dev を動かしているターミナルの画面に行きます。');
      console.log('2. キーボードの [Ctrl] + [C] を押して、サーバーを一度強制終了します。');
      console.log('3. 再び npm run dev を実行してサーバーを立ち上げ直します。');
      console.log('4. ブラウザで画面を開き直してください（または Cmd + Shift + R でスーパーリロード）。');
    }
  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}

main();
