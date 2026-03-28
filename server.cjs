const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;

// ---------------------------------------------------------
// ⚙️ 設定エリア (憲法遵守)
// ---------------------------------------------------------
// ★重要: データの実体は public/data に保存する
const PUBLIC_DATA_DIR = path.join(__dirname, 'public/data');
// 読み込み用の一覧ファイル
const ALL_SHOPS_FILE = path.join(__dirname, 'src/data/all_shops.json');
const REVIEWS_FILE = path.join(__dirname, 'src/data/reviews.json');
const REQUESTS_FILE = path.join(__dirname, 'src/data/shop_requests.json');

// 日本語 -> ローマ字 変換マップ (ディレクトリ作成用)
const REVERSE_LOCATION_MAP = {
  '東京都': 'tokyo', '神奈川県': 'kanagawa', '埼玉県': 'saitama', '千葉県': 'chiba',
  '大阪府': 'osaka', '愛知県': 'aichi', '北海道': 'hokkaido', '福岡県': 'fukuoka',
  '新宿区': 'shinjuku', '渋谷区': 'shibuya', '池袋': 'ikebukuro', '上野': 'ueno',
  '横浜': 'yokohama', '川崎': 'kawasaki', '名古屋': 'nagoya', '梅田': 'umeda',
  '難波': 'namba', '札幌': 'sapporo', '博多': 'hakata',
  '板橋区': 'itabashi', '東金市': 'togane'
};

// CORS設定
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// ログ
app.use((req, res, next) => {
  console.log(`📩 Request: ${req.method} ${req.url}`);
  next();
});

// ヘルパー
function loadData(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } 
  catch (err) { return []; }
}
function saveData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// --- API ---

// 1. データ取得系
app.get('/api/shops', (req, res) => res.json(loadData(ALL_SHOPS_FILE)));
app.get('/api/reviews', (req, res) => res.json(loadData(REVIEWS_FILE)));
app.get('/api/shop_requests', (req, res) => res.json(loadData(REQUESTS_FILE)));

// 2. 口コミ投稿・承認系
app.post('/api/reviews', (req, res) => {
  const reviews = loadData(REVIEWS_FILE);
  const newReview = { ...req.body, id: `rev_${Date.now()}`, timestamp: new Date().toISOString(), status: 'pending' };
  reviews.push(newReview);
  saveData(REVIEWS_FILE, reviews);
  res.status(201).json(newReview);
});

// 3. 店舗申請・承認系 (★ここが最重要修正ポイント)
app.post('/api/shop_requests', (req, res) => {
  const requests = loadData(REQUESTS_FILE);
  const newRequest = { ...req.body, id: `req_${Date.now()}`, timestamp: new Date().toISOString(), status: 'pending' };
  requests.push(newRequest);
  saveData(REQUESTS_FILE, requests);
  res.status(201).json(newRequest);
});

app.put('/api/shop_requests/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  let requests = loadData(REQUESTS_FILE);
  const targetIndex = requests.findIndex(r => r.id === id);
  
  if (targetIndex === -1) return res.status(404).json({ error: "Request not found" });

  requests[targetIndex].status = status;
  saveData(REQUESTS_FILE, requests);

  // 承認された場合、実際に店舗データファイルを作成する
  if (status === 'approved') {
    const reqData = requests[targetIndex];
    
    // 1. パス決定 (日本語 -> ローマ字変換)
    const prefDir = REVERSE_LOCATION_MAP[reqData.prefecture];
    const cityDir = REVERSE_LOCATION_MAP[reqData.city];

    if (!prefDir || !cityDir) {
      console.error("❌ Location map error:", reqData.prefecture, reqData.city);
      return res.status(400).json({ error: "未対応のエリアです。手動でマップを追加してください。" });
    }

    // 2. ID生成 (憲法第2条: _rawLocation使用)
    // ファイル名として安全な名前に変換 (スペースなどを削除)
    const safeShopName = "new_" + Date.now(); 
    const rawLocation = `${prefDir}_${cityDir}`;
    const newShopId = `${rawLocation}_${safeShopName}`;

    // 3. 保存先ディレクトリ確認 (public/data/...)
    const targetDir = path.join(PUBLIC_DATA_DIR, prefDir, cityDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 4. 店舗データ作成
    const newShopData = {
      id: newShopId,
      name: reqData.shopName,
      prefecture: reqData.prefecture,
      city: reqData.city,
      address: `${reqData.prefecture}${reqData.city} (詳細未設定)`,
      _rawLocation: rawLocation,
      _fileLocation: `${reqData.prefecture} ${reqData.city}`,
      therapists: [], // 新規なので空
      threads: [],
      description: "新規登録された店舗です。",
      images: []
    };

    // 5. ファイル書き込み (public/dataへ)
    const newFilePath = path.join(targetDir, `${safeShopName}.json`);
    fs.writeFileSync(newFilePath, JSON.stringify(newShopData, null, 2));
    console.log(`✅ New shop file created: ${newFilePath}`);

    // 6. all_shops.json も更新して即反映させる
    const allShops = loadData(ALL_SHOPS_FILE);
    allShops.push(newShopData);
    saveData(ALL_SHOPS_FILE, allShops);
  }

  res.json({ success: true, request: requests[targetIndex] });
});

// 4. 口コミステータス更新
app.put('/api/reviews/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  let reviews = loadData(REVIEWS_FILE);
  const idx = reviews.findIndex(r => r.id === id);
  if (idx !== -1) {
    reviews[idx].status = status;
    saveData(REVIEWS_FILE, reviews);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Review not found" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📂 Data Root: ${PUBLIC_DATA_DIR}`);
});
