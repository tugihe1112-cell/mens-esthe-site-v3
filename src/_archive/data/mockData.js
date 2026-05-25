// --- 共通のクチコミデータ定義 ---
const sanaReview = {
  id: "r_real_aromamore_sana_001",
  shopId: "tokyo_toshima_ikebukuro_aromamore",
  shopName: "AROMA more (アロマモア)",
  therapistId: "aromamore_浜辺さな",
  therapistName: "浜辺 さな",
  userId: "u_goron",
  userName: "ゴロンまる",
  rating: 4.8,
  detailedRatings: { cleanliness: 5, looks: 5, style: 5, service: 5, massage: 4, intimacy: 5 },
  tags: ["美人系", "お姉さん系", "スレンダー", "巨乳", "高身長"],
  title: "【長文レポ】Sっ気のあるハーフ美女に完敗！密着施術で限界まで焦らされました",
  content: `【入店〜システム】
駅近の雑居ビルですが、看板がないので隠れ家感があり、入る時からドキドキします。
予約時の電話対応も非常にスムーズでした。
部屋に入ると外観からは想像できないほど綺麗にリノベーションされており、ふわっとアロマの良い香りがしてリラックスできました。シャワールームも清潔感◎です。

【ご対面】
ドアが開いた瞬間、思わず「おぉ…」と声が出そうになりました。
写真通りの、いや写真以上に整ったハーフ顔の超美人さん！身長は高めでスラッとしていますが、出るべきところはしっかり出ている理想的なスタイルです。
最初はハーフ特有の少しクールな印象を受けましたが、挨拶するとニコッと笑ってくれて、そのギャップに早くもやられました。

【施術タイム】
マッサージ技術はかなり高めです。
最初は指圧ベースで背中全体をほぐしてくれますが、細い腕からは想像できないほど力がしっかりしています。「そこ、凝ってますね〜」と、コリがある部分はグッと強めに入れてくるので思わず声が出ちゃいました（笑）。
私が「痛気持ちいいです」と言うと、「痛いですか？ふふっ」と少しSっ気のある感じで聞いてくるのがたまりません。

【密着・余韻】
後半のオイルトリートメントに入ってからの密着タイムが凄かったです。
オイルをたっぷり使い、肌と肌が吸い付くような感覚。耳元での囁きや、鼠径部ギリギリの際どいラインへの攻め込みが絶妙で、何度も限界ギリギリまで焦らされました。
特に仰向け時は、彼女の整った顔が目の前に迫り、ビジュアルの破壊力が抜群で目のやり場に困るほど。

【退店】
シャワーを浴びて着替えている間も、ドアの外で待っていてくれて最後はお見送りまで丁寧でした。
エレベーターが閉まるまで深々とお辞儀をしてくれていて、接客レベルの高さを感じました。
「また凝ったら来てくださいね」と言われたら、行かないわけにはいきません。
ルックス、技術、愛嬌、どれをとってもレベルが高く、久しぶりに指名リピート確定の子に出会えました。`,
  date: "2024-02-13T18:00:00Z"
};

// --- 店舗データ ---
export const SHOPS = [
  {
    id: "tokyo_toshima_ikebukuro_aromamore",
    name: "AROMA more (アロマモア)",
    group_id: "g_aromamore",
    brandId: "AromaMore",
    image: "https://placehold.co/400x500/1e293b/94a3b8?text=No+Image",
    area: "東口",
    city: "豊島区",
    prefecture: "東京都",
    access: "池袋駅徒歩4分",
    hours: "12:00〜翌5:00",
    rating: 4.8,
    tags: ["完全個室", "シャワー完備", "日本人セラピスト"],
    therapists: ["aromamore_浜辺さな"],
    
    // 店舗詳細ページ用 (ここにも入れる)
    reviews: [sanaReview]
  }
];

// --- セラピストデータ ---
export const THERAPISTS = [
  {
    id: "aromamore_浜辺さな",
    shopId: "tokyo_toshima_ikebukuro_aromamore",
    name: "浜辺 さな",
    age: 23, 
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    tags: ["美人系", "高身長", "スレンダー"]
  }
];

// --- クチコミ一覧データ ---
// 管理画面や新着クチコミ用 (ここにも入れる)
export const REVIEWS = [sanaReview];
