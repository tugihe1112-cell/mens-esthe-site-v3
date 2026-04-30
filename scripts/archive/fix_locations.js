const fs = require('fs');
const path = require('path');

const locPath = path.resolve('src/data/locations.js');

// ① バックアップ作成
const backup = locPath + '.bak_' + Date.now();
fs.copyFileSync(locPath, backup);
console.log('✅ バックアップ作成:', backup);

// ② ファイル読み込み
let content = fs.readFileSync(locPath, 'utf8');

// ③ 末尾の古いexport群をすべて削除（LOCATION_DATA以降）
content = content.replace(/export const LOCATION_DATA[\s\S]*$/, '').trimEnd();

// ④ 正しい構造のexportを追記
const newExports = `

// ── 都道府県 → 市区町村マッピング（nullと区切り文字を自動除外） ──
const _PREFS = [
  "東京都","埼玉県","千葉県","神奈川県",
  "大阪府","兵庫県","京都府","滋賀県",
  "愛知県","静岡県","福井県",
  "福岡県","宮城県","北海道"
];

export const PREF_CITY_MAP = Object.fromEntries(
  _PREFS.map(pref => [
    pref,
    (WARDS[pref] || []).filter(c => c != null && !String(c).startsWith('---'))
  ])
);

// ── 地方グループ（idがactiveRegionの初期値'kanto'と一致することが重要） ──
export const REGIONS = [
  { id: 'kanto',    name: '関東',   color: 'bg-blue-500',   prefs: ['東京都', '埼玉県', '千葉県', '神奈川県'] },
  { id: 'kansai',   name: '関西',   color: 'bg-purple-500', prefs: ['大阪府', '兵庫県', '京都府', '滋賀県'] },
  { id: 'chubu',    name: '中部',   color: 'bg-green-500',  prefs: ['愛知県', '静岡県', '福井県'] },
  { id: 'kyushu',   name: '九州',   color: 'bg-red-500',    prefs: ['福岡県'] },
  { id: 'tohoku',   name: '東北',   color: 'bg-yellow-500', prefs: ['宮城県'] },
  { id: 'hokkaido', name: '北海道', color: 'bg-cyan-500',   prefs: ['北海道'] },
];

export const LOCATION_DATA = WARDS;
export const WARD_GROUPS = [];
export const groupedLocations = WARD_GROUPS;
`;

fs.writeFileSync(locPath, content + newExports, 'utf8');
console.log('✅ locations.js を修正しました');
console.log('');
console.log('次のコマンドで確認:');
console.log('  tail -40 src/data/locations.js');
