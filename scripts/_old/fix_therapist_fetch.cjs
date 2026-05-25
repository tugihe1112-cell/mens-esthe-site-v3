const fs = require('fs');
const path = 'src/pages/ShopDetailPage.jsx';
fs.copyFileSync(path, path + '.bak_' + Date.now());

let code = fs.readFileSync(path, 'utf8');

const oldLine = `fetch(\`\${url}/rest/v1/therapists?shop_id=eq.\${shopId}&select=*\`, { headers, cache: 'no-store' }),`;

const newLine = `fetch(
          groupId
            ? \`\${url}/rest/v1/therapists?select=*,shops!inner(group_id)&shops.group_id=eq.\${groupId}\`
            : \`\${url}/rest/v1/therapists?shop_id=eq.\${shopId}&select=*\`,
          { headers, cache: 'no-store' }
        ),`;

if (code.includes(oldLine)) {
  code = code.replace(oldLine, newLine);
  fs.writeFileSync(path, code, 'utf8');
  console.log('✅ 修正完了');
} else {
  console.log('❌ 対象行が見つかりません');
  console.log('手動確認: grep -n "therapists?shop_id" src/pages/ShopDetailPage.jsx');
}
