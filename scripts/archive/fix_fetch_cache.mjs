import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
let code = fs.readFileSync(filePath, 'utf-8');

// fetchのオプション { headers } を { headers, cache: 'no-store' } に書き換えて、
// ブラウザのキャッシュを強制的に無効化します。
const target = "{ headers }";
const replacement = "{ headers, cache: 'no-store' }";

if (code.includes(target)) {
  code = code.replaceAll(target, replacement);
  fs.writeFileSync(filePath, code);
  console.log("✅ 修正完了！ブラウザのキャッシュを無効化し、毎回必ずSupabaseから最新データを取得するように直通ルートを開通させました。");
} else {
  console.log("❌ 置換対象が見つかりませんでした。");
}
