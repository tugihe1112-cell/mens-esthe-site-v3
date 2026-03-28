const fs = require('fs');

const REVIEWS_FILE = 'src/data/reviews.json';

console.log("🔍 口コミデータのステータス診断を開始します...\n");

if (!fs.existsSync(REVIEWS_FILE)) {
    console.log(`❌ ファイルが見つかりません: ${REVIEWS_FILE}`);
    console.log(`   まだ口コミが1件も投稿されていません。`);
    process.exit(0);
}

try {
    const rawData = fs.readFileSync(REVIEWS_FILE, 'utf8');
    const reviews = JSON.parse(rawData);
    console.log(`📦 全口コミ数: ${reviews.length} 件`);

    // ステータスごとの集計
    const statusCount = {
        pending: 0,   // 承認待ち
        approved: 0,  // 承認済み
        rejected: 0,  // 却下
        undefined: 0  // ステータスなし（バグ）
    };

    reviews.forEach(r => {
        if (r.status === 'pending') statusCount.pending++;
        else if (r.status === 'approved') statusCount.approved++;
        else if (r.status === 'rejected') statusCount.rejected++;
        else statusCount.undefined++;
    });

    console.log(`\n📊 ステータス内訳:`);
    console.log(`   - 🟡 承認待ち (pending):  ${statusCount.pending} 件`);
    console.log(`   - 🟢 承認済み (approved): ${statusCount.approved} 件`);
    console.log(`   - 🔴 却下 (rejected):     ${statusCount.rejected} 件`);
    console.log(`   - ❓ 不明/なし:           ${statusCount.undefined} 件`);

    if (statusCount.pending > 0) {
        console.log(`\n✅ データは正常です。「承認待ち」が ${statusCount.pending} 件あります。`);
        console.log(`   👉 管理画面に表示されないなら、管理画面のコード(AdminPage.jsx)に「口コミ承認リスト」の表示ロジックが不足しています。`);
    } else if (statusCount.approved > 0) {
        console.log(`\n⚠️ すべて「承認済み」になっています。`);
        console.log(`   👉 投稿処理で自動的に approved になっている可能性があります。`);
    } else {
        console.log(`\n⚠️ 承認待ちデータがありません。`);
    }

} catch (e) {
    console.error("❌ エラー:", e.message);
}
