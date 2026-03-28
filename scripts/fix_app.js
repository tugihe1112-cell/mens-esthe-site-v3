const fs = require('fs');
const path = 'src/context/AppContext.tsx';

try {
  console.log('🔄 AppContext.tsx を修正中...');
  let content = fs.readFileSync(path, 'utf8');

  // 巨大な fileNames 配列を探して置換する
  // (const fileNames = [ ... ]; のブロックを検索)
  const regex = /const fileNames = \[[\s\S]*?\];/;

  if (!regex.test(content)) {
    console.error('⚠️ エラー: 置換場所が見つかりませんでした。すでに修正済みか、コードが変更されています。');
    process.exit(1);
  }

  const newCode = `// 自動読み込みコードに置換済み
      const res = await fetch('/data/shops.json');
      let fileNames = [];
      try {
        const data = await res.json();
        // shops.json が「ファイルパスのリスト」の場合
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
            fileNames = data;
        } 
        // shops.json が「店舗データそのもの」の場合
        else if (Array.isArray(data)) {
            const uniqueShops = Array.from(new Map(data.map((s) => [s.id, s])).values());
            setShops(uniqueShops);
            console.log("データ読み込み完了: " + uniqueShops.length + "店舗 (直接読込)");
            return; // 既存の読み込み処理をスキップ
        }
      } catch (e) {
        console.error("shops.json の読み込みに失敗:", e);
        return;
      }`;

  content = content.replace(regex, newCode);
  fs.writeFileSync(path, content, 'utf8');
  console.log('✅ 修正完了！ shops.json を読み込むように変更しました。');

} catch (e) {
  console.error('❌ ファイル読み込みエラー:', e);
}
