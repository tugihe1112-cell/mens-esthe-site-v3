import fs from 'fs';

const TARGET = 'public/data/tokyo/shibuya/yoyogi_harajuku/otona_code.json';

try {
    const raw = fs.readFileSync(TARGET, 'utf8');
    let data = JSON.parse(raw);

    // フィルターの軸（正解）に合わせて書き換え
    data.prefecture = "東京都";
    data.city = "渋谷区";
    data.area = "代々木・原宿";

    // 保存
    fs.writeFileSync(TARGET, JSON.stringify(data, null, 2), 'utf8');
    console.log("✅ otona_code.json の正規化に成功しました！");
} catch (e) {
    console.error("❌ エラー:", e.message);
}
