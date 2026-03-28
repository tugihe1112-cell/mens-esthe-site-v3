const path = require('path');

// 診断したい仮想パス（実際のファイルパスをシミュレート）
const testPaths = [
    // ケース1: 階層が深い（成功するはずのパターン）
    "public/data/tokyo/shinjuku/kabukicho/shop.json",
    
    // ケース2: 階層が浅い（失敗する仮説のパターン）
    "public/data/chiba/togane/shop.json",
    
    // ケース3: さらに変則的（板橋など）
    "public/data/tokyo/itabashi/shop.json"
];

console.log("🔍 Ver.14 ロジック診断: `parts.length - 4` の挙動確認\n");

testPaths.forEach(fullPath => {
    console.log(`📂 ファイル: ${fullPath}`);
    
    const parts = fullPath.split('/'); // Mac/Linux前提でスラッシュ分割
    console.log(`   階層数 (parts.length): ${parts.length}`);
    console.log(`   パス構成: [${parts.join(', ')}]`);

    // ▼▼▼ Ver.14のロジックそのまま ▼▼▼
    let prefectureIdx = parts.length - 4;
    let cityIdx = parts.length - 3;
    let areaIdx = parts.length - 2;
    
    console.log(`   --------------------------------------------------`);
    console.log(`   [初期判定] -4番目を都道府県と仮定`);
    console.log(`   👉 都道府県インデックス: ${prefectureIdx} ("${parts[prefectureIdx]}")`);

    // Ver.14の補正ロジック
    if (parts[prefectureIdx] === 'data' && parts.length >= 5) {
        console.log(`   ⚠️ 'data'を検知。補正ロジック発動`);
        
        prefectureIdx = parts.length - 3;
        cityIdx = parts.length - 2;
        areaIdx = parts.length - 1;

        if (parts[areaIdx].endsWith('.json')) {
            console.log(`   ⚠️ 末尾が.jsonのため再補正`);
            areaIdx = parts.length - 2;
            cityIdx = parts.length - 3;
            prefectureIdx = parts.length - 4; // ★ここ！元に戻ってしまっている！
        }
    }
    // ▲▲▲ Ver.14のロジックここまで ▲▲▲

    const extractedPref = parts[prefectureIdx];
    
    console.log(`   --------------------------------------------------`);
    console.log(`   ❌ 最終判定結果: 都道府県 = "${extractedPref}"`);
    
    if (extractedPref === 'data') {
        console.log(`   💀 致命的エラー: "data" を都道府県として認識しています。`);
        console.log(`      → 翻訳辞書に "data" はないため、翻訳されません。`);
        console.log(`      → または除外リストにより消滅し、タグなしになります。`);
    } else if (extractedPref === 'chiba' || extractedPref === 'tokyo') {
        console.log(`   ✅ 正常: 正しい都道府県名が取れています。`);
    } else {
        console.log(`   ❓ 異常: 想定外の値です。`);
    }
    console.log("\n");
});
