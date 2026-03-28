const fs = require('fs');

// 口コミデータのパス（想定）
const REVIEWS_FILE = 'src/data/reviews.json';
const TARGET_USER_ID = 1; // 画面に表示されているID

console.log(`🔍 口コミデータの診断を開始します (対象ユーザーID: ${TARGET_USER_ID})...\n`);

if (!fs.existsSync(REVIEWS_FILE)) {
    console.log(`❌ ファイルが見つかりません: ${REVIEWS_FILE}`);
    console.log(`   👉 改善案: まだ口コミ機能が動いていないか、ファイルが生成されていません。テスト投稿を行ってください。`);
    process.exit(0);
}

try {
    const rawData = fs.readFileSync(REVIEWS_FILE, 'utf8');
    const reviews = JSON.parse(rawData);
    console.log(`📦 全口コミ数: ${reviews.length} 件`);

    // 型の違いを含めて検索
    const matchNumber = reviews.filter(r => r.userId === TARGET_USER_ID);
    const matchString = reviews.filter(r => r.userId === String(TARGET_USER_ID));

    console.log(`\n🕵️‍♀️ ユーザーID「${TARGET_USER_ID}」の投稿チェック:`);
    console.log(`   - 数値で一致 (userId === 1):   ${matchNumber.length} 件`);
    console.log(`   - 文字列で一致 (userId === "1"): ${matchString.length} 件`);

    if (matchNumber.length === 0 && matchString.length > 0) {
        console.log(`\n⚠️ 【重要】データ不整合が見つかりました！`);
        console.log(`   画面のIDは数値(1)ですが、データは文字列("1")で保存されています。`);
        console.log(`   👉 改善案: MyPage.jsx の比較処理を '==' (緩やかな一致) にするか、String() で型を揃える必要があります。`);
    } else if (reviews.length > 0 && matchNumber.length === 0 && matchString.length === 0) {
        console.log(`\n✅ 正常です。このユーザーはまだ投稿していません。`);
        console.log(`   👉 改善案: 「最初の口コミを書く」ボタンから動作確認を行ってください。`);
    } else if (reviews.length === 0) {
        console.log(`\nℹ️ データベース自体が空っぽです。`);
    }

} catch (e) {
    console.error("❌ JSON読み込みエラー:", e.message);
}
