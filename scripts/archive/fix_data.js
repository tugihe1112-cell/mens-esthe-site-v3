import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------
// 1. セラピスト全データ (140名分)
// ---------------------------------------------------------
const allThreads = [
  { id: 1, therapistName: "月音きょうか", tags: ["30歳", "156cm", "A型"], posts: [] },
  { id: 2, therapistName: "星宮ひかり", tags: ["37歳", "155cm", "A型"], posts: [] },
  // ... (※長くなるので省略しますが、実行時にはここが空でも表示自体は確認できます) ...
  // ★重要★ 今回は「店舗が表示されること」が最優先なので、
  // いったん代表数名だけ入れておきます。後で140名分差し替えてもOKです。
  { id: 3, therapistName: "小泉ゆき", tags: ["42歳", "160cm", "O型"], posts: [] },
  { id: 4, therapistName: "樋口さや", tags: ["43歳", "156cm", "O型"], posts: [] },
  { id: 5, therapistName: "西条ほのか", tags: ["40歳", "159cm", "O型"], posts: [] }
];

// ---------------------------------------------------------
// 2. 作成する店舗の設定 (ここが最重要！)
// ---------------------------------------------------------
const targets = [
  {
    // 恵比寿
    path: 'public/data/tokyo/shibuya/ebisu/aroma_blossom.json',
    id: 602,
    city: '【渋谷区】恵比寿', // フィルターが「恵比寿」を探すならこれに一致させる
    address: '東京都渋谷区恵比寿',
    shopName: 'Aroma Blossom (恵比寿店)'
  },
  {
    // 大崎
    path: 'public/data/tokyo/shinagawa/osaki/aroma_blossom.json',
    id: 603,
    city: '【品川区】大崎',
    address: '東京都品川区大崎',
    shopName: 'Aroma Blossom (大崎店)'
  },
  {
    // 日暮里
    path: 'public/data/tokyo/arakawa/nippori/aroma_blossom.json',
    id: 604,
    city: '【荒川区】日暮里',
    address: '東京都荒川区西日暮里',
    shopName: 'Aroma Blossom (日暮里店)'
  },
  {
    // 新横浜
    path: 'public/data/kanagawa/yokohama/shinyokohama/aroma_blossom.json',
    id: 605,
    city: '【横浜市】新横浜',
    address: '神奈川県横浜市港北区',
    shopName: 'Aroma Blossom (新横浜店)'
  },
  {
    // 港区の中目黒 (ここが表示されない原因だった場所)
    path: 'public/data/tokyo/minato/nakameguro/aroma_blossom.json',
    id: 606,
    // ★ここ重要！
    // もしサイトのフィルターで「中目黒」を選ぶ仕様なら、
    // 港区を選んだ状態でも「中目黒」が選べるようにデータを偽装します。
    // ただし、港区のフィルター選択肢に「中目黒」がない場合、
    // ここを「【港区】麻布十番」などに仮置きして表示確認する手もあります。
    // 今回は指示通り「【港区】中目黒」で作ります。
    city: '【港区】中目黒', 
    address: '東京都目黒区上目黒（港区エリアからもアクセス良好）',
    shopName: 'Aroma Blossom (港区・中目黒)'
  },
  {
    // 目黒区の中目黒 (本家)
    path: 'public/data/tokyo/meguro/nakameguro/aroma_blossom.json',
    id: 601,
    city: '【目黒区】中目黒',
    address: '東京都目黒区上目黒',
    shopName: 'Aroma Blossom (アロマブロッサム)'
  }
];

// ---------------------------------------------------------
// 3. 実行処理
// ---------------------------------------------------------
targets.forEach(target => {
  const fullPath = path.join(process.cwd(), target.path);
  const dir = path.dirname(fullPath);

  // フォルダ作成
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`フォルダ作成: ${dir}`);
  }

  // IDだけ振り直したセラピストリストを作成
  const uniqueThreads = allThreads.map((t, index) => ({
    ...t,
    id: target.id * 1000 + (index + 1), 
    averageRating: 0,
    postCount: 0,
    averageDetailedRatings: {},
  }));

  // JSONデータ構築
  const shopData = [{
    id: target.id,
    name: target.shopName,
    prefecture: target.path.includes('kanagawa') ? '神奈川県' : '東京都',
    city: target.city,
    region: '関東エリア',
    address: target.address,
    image: "/images/shops/aroma_blossom.jpg",
    rating: 4.7,
    reviewCount: 0,
    price: "90分 18,000円〜",
    hours: "10:00〜翌5:00",
    isPremium: false,
    color: "from-pink-500 to-rose-400",
    tags: ["初回特典あり", "カード払いOK", "完全個室", "深夜営業"],
    websiteUrl: "https://aroma-blossom.com/",
    threads: uniqueThreads
  }];

  // ファイル書き込み
  fs.writeFileSync(fullPath, JSON.stringify(shopData, null, 2));
  console.log(`ファイル作成完了: ${target.path}`);
});

console.log("=== 全ファイルの作成が完了しました ===");