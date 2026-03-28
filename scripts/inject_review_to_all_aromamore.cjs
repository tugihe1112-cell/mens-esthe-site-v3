const fs = require('fs');
const path = require('path');

// 1. 対象のファイルリスト（池袋以外）
const TARGET_FILES = [
  'src/data/tokyo/minato/roppongi/aromamore.json',
  'src/data/tokyo/chuo/ginza/aromamore.json',
  'src/data/tokyo/shinjuku/kabukicho/aromamore.json'
];

// 2. 注入するデータ（共通部分）
const THERAPIST_ID = "aromamore_浜辺さな";
const THERAPIST_NAME = "浜辺 さな";

const REVIEW_TEMPLATE = {
  // id, shopId, shopName はループ内で自動生成
  therapistId: THERAPIST_ID,
  therapistName: THERAPIST_NAME,
  userId: "u_goron",
  userName: "ゴロンまる",
  rating: 4.8,
  detailedRatings: { cleanliness: 5, looks: 5, style: 5, service: 5, massage: 4, intimacy: 5 },
  tags: ["美人系", "お姉さん系", "スレンダー", "巨乳", "高身長"],
  title: "【長文レポ】Sっ気のあるハーフ美女に完敗！密着施術で限界まで焦らされました",
  content: "【入店〜システム】\n駅近の雑居ビルですが、看板がないので隠れ家感があり、入る時からドキドキします。\n予約時の電話対応も非常にスムーズでした。\n部屋に入ると外観からは想像できないほど綺麗にリノベーションされており、ふわっとアロマの良い香りがしてリラックスできました。シャワールームも清潔感◎です。\n\n【ご対面】\nドアが開いた瞬間、思わず「おぉ…」と声が出そうになりました。\n写真通りの、いや写真以上に整ったハーフ顔の超美人さん！身長は高めでスラッとしていますが、出るべきところはしっかり出ている理想的なスタイルです。\n最初はハーフ特有の少しクールな印象を受けましたが、挨拶するとニコッと笑ってくれて、そのギャップに早くもやられました。\n\n【施術タイム】\nマッサージ技術はかなり高めです。\n最初は指圧ベースで背中全体をほぐしてくれますが、細い腕からは想像できないほど力がしっかりしています。「そこ、凝ってますね〜」と、コリがある部分はグッと強めに入れてくるので思わず声が出ちゃいました（笑）。\n私が「痛気持ちいいです」と言うと、「痛いですか？ふふっ」と少しSっ気のある感じで聞いてくるのがたまりません。\n\n【密着・余韻】\n後半のオイルトリートメントに入ってからの密着タイムが凄かったです。\nオイルをたっぷり使い、肌と肌が吸い付くような感覚。耳元での囁きや、鼠径部ギリギリの際どいラインへの攻め込みが絶妙で、何度も限界ギリギリまで焦らされました。\n特に仰向け時は、彼女の整った顔が目の前に迫り、ビジュアルの破壊力が抜群で目のやり場に困るほど。\n\n【退店】\nシャワーを浴びて着替えている間も、ドアの外で待っていてくれて最後はお見送りまで丁寧でした。\nエレベーターが閉まるまで深々とお辞儀をしてくれていて、接客レベルの高さを感じました。\n「また凝ったら来てくださいね」と言われたら、行かないわけにはいきません。\nルックス、技術、愛嬌、どれをとってもレベルが高く、久しぶりに指名リピート確定の子に出会えました。",
  date: "2024-02-13T18:00:00Z"
};

TARGET_FILES.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const shopData = JSON.parse(content);
    
    console.log(`Processing: ${shopData.name} (${shopData.city})`);

    // A. セラピストを追加（まだいなければ）
    if (!shopData.therapists) shopData.therapists = [];
    if (!shopData.therapists.includes(THERAPIST_ID)) {
      shopData.therapists.push(THERAPIST_ID);
      console.log(`  - Added therapist: ${THERAPIST_NAME}`);
    }

    // B. クチコミを追加
    if (!shopData.reviews) shopData.reviews = [];
    
    // 重複チェック（同じタイトルのクチコミが既にあるか）
    const exists = shopData.reviews.some(r => r.therapistId === THERAPIST_ID && r.title === REVIEW_TEMPLATE.title);
    
    if (!exists) {
      const newReview = {
        ...REVIEW_TEMPLATE,
        id: `r_${shopData.id}_sana_001`, // 店ごとにユニークなIDにする
        shopId: shopData.id,
        shopName: shopData.name
      };
      shopData.reviews.push(newReview);
      shopData.reviewCount = shopData.reviews.length;
      console.log(`  - Added review`);
    } else {
      console.log(`  - Review already exists, skipping.`);
    }

    // 書き込み
    fs.writeFileSync(fullPath, JSON.stringify(shopData, null, 2));
    console.log(`  ✅ Updated successfully.\n`);

  } catch (err) {
    console.error(`❌ Error processing ${filePath}:`, err);
  }
});

console.log("🎉 All Done! Please restart server (npm run dev).");
