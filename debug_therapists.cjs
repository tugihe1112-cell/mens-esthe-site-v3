const fs = require('fs');
const path = require('path');

const DATA_DIR = 'public/data';
const THERAPISTS_FILE = 'src/data/therapists.json';

console.log("🔍 セラピストデータ診断ツール\n");

let masterTherapists = {};
if (fs.existsSync(THERAPISTS_FILE)) {
    try {
        masterTherapists = JSON.parse(fs.readFileSync(THERAPISTS_FILE, 'utf8'));
        console.log(`✅ マスタセラピスト数: ${Object.keys(masterTherapists).length}件`);
        console.log(`   最初の3件: ${Object.keys(masterTherapists).slice(0, 3).join(', ')}`);
    } catch (e) {
        console.error("❌ 読み込み失敗:", e.message);
    }
} else {
    console.error("❌ ファイルが存在しません");
}

console.log("\n=== 2. 店舗ファイルのスキャン ===");
const shopSamples = [];

function scan(dir, depth = 0) {
    if (depth > 5) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scan(fullPath, depth + 1);
        } else if (file.endsWith('.json')) {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const data = JSON.parse(content);
                const shop = Array.isArray(data) ? data[0] : data;
                if (!shop.name) return;
                const hasTherapists = shop.therapists && shop.therapists.length > 0;
                const hasThreads = shop.threads && shop.threads.length > 0;
                const therapistType = hasTherapists ? (typeof shop.therapists[0] === 'string' ? 'ID参照' : 'オブジェクト') : 'なし';
                shopSamples.push({
                    path: fullPath,
                    name: shop.name,
                    id: shop.id,
                    hasTherapists,
                    therapistCount: shop.therapists?.length || 0,
                    hasThreads,
                    threadCount: shop.threads?.length || 0,
                    therapistType,
                    sample: hasTherapists ? shop.therapists[0] : null,
                    threadSample: hasThreads ? shop.threads[0] : null
                });
            } catch (e) {}
        }
    });
}

scan(DATA_DIR);

console.log(`\n📊 スキャン完了: ${shopSamples.length}店舗\n`);

const withTherapists = shopSamples.filter(s => s.hasTherapists);
const withThreads = shopSamples.filter(s => s.hasThreads && !s.hasTherapists);
const empty = shopSamples.filter(s => !s.hasTherapists && !s.hasThreads);

console.log("=== 3. データパターンの分類 ===");
console.log(`✅ therapists配列あり: ${withTherapists.length}店舗`);
console.log(`⚠️  threads配列のみ: ${withThreads.length}店舗`);
console.log(`❌ 両方なし: ${empty.length}店舗\n`);

if (withThreads.length > 0) {
    console.log("=== 4. threads店舗のサンプル（最初の3件） ===");
    withThreads.slice(0, 3).forEach(shop => {
        console.log(`\n店舗: ${shop.name}`);
        console.log(`  パス: ${shop.path}`);
        console.log(`  threads数: ${shop.threadCount}`);
        console.log(`  サンプル:`, JSON.stringify(shop.threadSample, null, 2));
    });
}

const idRefShops = withTherapists.filter(s => s.therapistType === 'ID参照');
if (idRefShops.length > 0) {
    console.log("\n=== 5. ID参照型店舗のサンプル ===");
    const sample = idRefShops[0];
    console.log(`\n店舗: ${sample.name}`);
    console.log(`  therapists[0]: ${sample.sample}`);
    console.log(`  マスタに存在: ${masterTherapists[sample.sample] ? 'YES' : 'NO'}`);
    if (masterTherapists[sample.sample]) {
        console.log(`  マスタデータ:`, JSON.stringify(masterTherapists[sample.sample], null, 2));
    }
}

console.log("\n=== 6. 問題診断 ===");
if (withThreads.length > 0) {
    console.log(`⚠️  ${withThreads.length}店舗がthreads配列を使用`);
    console.log(`   → これらが therapists に変換されていない可能性があります`);
}
if (idRefShops.length > 0) {
    const unmatchedIds = idRefShops.filter(s => !masterTherapists[s.sample]);
    if (unmatchedIds.length > 0) {
        console.log(`❌ ${unmatchedIds.length}店舗のIDがマスタに存在しません`);
    }
}

console.log("\n✅ 診断完了");
