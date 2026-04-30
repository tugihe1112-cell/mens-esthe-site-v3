const fs = require('fs');
const path = require('path');

const locPath = path.resolve('src/data/locations.js');

// バックアップ作成
fs.copyFileSync(locPath, locPath + '.bak_' + Date.now());
console.log('✅ バックアップ作成完了');

// ファイル読み込み
let content = fs.readFileSync(locPath, 'utf8');

// 末尾の古いexport群をすべて削除
content = content.replace(/export const LOCATION_DATA[\s\S]*$/, '').trimEnd();

// 正しい構造のexportを追記
const newExports = `

export const PREF_CITY_MAP = Object.fromEntries(
  ["東京都","埼玉県","千葉県","神奈川県","大阪府","兵庫県","京都府","滋賀県","愛知県","静岡県","福井県","福岡県","宮城県","北海道"].map(pref => [
    pref,
    (WARDS[pref] || []).filter(c => c != null && !String(c).startsWith('---'))
  ])
);

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
console.log('✅ locations.js 修正完了');
console.log('');
console.log('確認コマンド: tail -50 src/data/locations.js');
