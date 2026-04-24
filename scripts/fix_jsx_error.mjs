import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 悪さをしている「余分な </div>」を正規表現で検知して削り取ります
const badTagRegex = /\)\}\s*<\/div>\s*<\/dd>/g;

if (badTagRegex.test(content)) {
  content = content.replace(badTagRegex, ')}\n                </dd>');
  fs.writeFileSync(filePath, content);
  console.log('✅ 余分な </div> を削除して、JSXの構文エラーを完全修正しました！');
} else {
  console.log('⚠️ 対象のエラー箇所が見つかりませんでした。');
}
