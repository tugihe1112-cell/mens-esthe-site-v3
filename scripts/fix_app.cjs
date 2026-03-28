const fs = require('fs');
const path = 'src/context/AppContext.tsx';

try {
  console.log('🔄 AppContext.tsx を修正中...');
  let content = fs.readFileSync(path, 'utf8');

  // 手書きのファイルリスト部分を探す
  const regex = /const fileNames = \[[\s\S]*?\];/;

  if (!regex.test(content)) {
    console.error('⚠️ エラー: 置換場所が見つかりませんでした。すでに修正済みか、コードが変わっています。');
    // すでに修正済みかもしれないので、念のため確認
    if (content.includes('fetch(\'/data/shops.json\')')) {
        console.log('✅ すでに修正済みのようです！');
        process.exit(0);
    }
    process.exit(1);
  }

  // 自動読み込みコード
  const newCode = `// 自動読み込みコードに置換済み
      const res = await fetch('/data/shops.json');
      let fileNames = [];
      try {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
            fileNames = data;
        } else if (Array.isArray(data)) {
            const uniqueShops = Array.from(new Map(data.map((s) => [s.id, s])).values());
            setShops(uniqueShops);
            console.log("データ読み込み完了: " + uniqueShops.length + "店舗");
            return;
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
