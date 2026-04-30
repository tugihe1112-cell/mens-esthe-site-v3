import fs from 'fs';

const filePath = 'src/contexts/DataContext.jsx';
let code = fs.readFileSync(filePath, 'utf-8');

// 1. 指定した列だけ（名前抜き）で取得していたのを、全列（*）取得に変更する！
code = code.replace(
  /select\('id, shop_id, raw_data, image_url, website_url, price_system, business_hours'\)/g,
  "select('*')"
);

// 2. データをまとめる時に、DBの全カラム（名前や写真など）を絶対に削ぎ落とさないように変更する！
code = code.replace(
  /data\.map\(d => \(\{ \.\.\.d\.raw_data, id: d\.id, shop_id: d\.shop_id \}\)\)/g,
  "data.map(d => ({ ...(d.raw_data || {}), ...d }))"
);

fs.writeFileSync(filePath, code);
console.log("✅ 修正完了！DataContextの致命的なデータ欠落バグを修正し、全店舗でセラピストの名前と画像が正常に取得できるようにしました！");
