const fs = require('fs');
const path = require('path');

const target = path.resolve('scripts/generate_master_data.cjs');
let code = fs.readFileSync(target, 'utf8');

// shops.push(data); の直前にgroup_id付与ロジックを挿入
const oldLine = `        shops.push(data);`;
const newCode = `        // brandIdが同じ店舗には同じgroup_idを付与（レビュー吸収のため）
        if (data.brandId) {
          if (!brandGroupMap[data.brandId]) {
            // 既存のgroup_idがあればそれを使い、なければ新規生成
            brandGroupMap[data.brandId] = data.group_id || ('g_brand_' + data.brandId);
          }
          data.group_id = brandGroupMap[data.brandId];
        }
        shops.push(data);`;

if (code.includes(oldLine)) {
  // brandGroupMap の初期化をmain()の先頭に追加
  code = code.replace(
    `  const shops = [];`,
    `  const shops = [];\n  const brandGroupMap = {}; // brandId → group_id のマッピング`
  );
  code = code.replace(oldLine, newCode);
  fs.writeFileSync(target, code, 'utf8');
  console.log('✅ generate_master_data.cjs を修正しました');
} else {
  console.log('❌ 挿入箇所が見つかりません。手動確認が必要です');
}
