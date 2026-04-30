const fs = require('fs');
const path = 'src/pages/ShopDetailPage.jsx';
fs.copyFileSync(path, path + '.bak_' + Date.now());

let code = fs.readFileSync(path, 'utf8');

const oldQuery = `          fetch(
          groupId
            ? \`\${url}/rest/v1/therapists?select=*,shops!inner(group_id)&shops.group_id=eq.\${groupId}\`
            : \`\${url}/rest/v1/therapists?shop_id=eq.\${shopId}&select=*\`,
          { headers, cache: 'no-store' }
        ),`;

const newQuery = `          fetch(
          groupId
            ? \`\${url}/rest/v1/therapists?select=*&shop_id=in.(\${encodeURIComponent(
                (await (await fetch(\`\${url}/rest/v1/shops?group_id=eq.\${groupId}&select=id\`, {headers})).json()).map(s=>s.id).join(',')
              )})\`
            : \`\${url}/rest/v1/therapists?shop_id=eq.\${shopId}&select=*\`,
          { headers, cache: 'no-store' }
        ),`;

// シンプルな方法に変更
const simpleOld = `        const [tRes, rRes] = await Promise.all([
          fetch(
          groupId
            ? \`\${url}/rest/v1/therapists?select=*,shops!inner(group_id)&shops.group_id=eq.\${groupId}\`
            : \`\${url}/rest/v1/therapists?shop_id=eq.\${shopId}&select=*\`,
          { headers, cache: 'no-store' }
        ),`;

const simpleNew = `        // group_idが同じ店舗のIDを先に取得してからセラピストを取得
        let therapistShopIds = [shopId];
        if (groupId) {
          const groupShopsRes = await fetch(\`\${url}/rest/v1/shops?group_id=eq.\${groupId}&select=id\`, { headers, cache: 'no-store' });
          const groupShops = await groupShopsRes.json();
          if (Array.isArray(groupShops) && groupShops.length > 0) {
            therapistShopIds = groupShops.map(s => s.id);
          }
        }
        const therapistQuery = \`shop_id=in.(\${therapistShopIds.join(',')})\`;

        const [tRes, rRes] = await Promise.all([
          fetch(\`\${url}/rest/v1/therapists?select=*&\${therapistQuery}\`, { headers, cache: 'no-store' }),`;

if (code.includes(simpleOld)) {
  code = code.replace(simpleOld, simpleNew);
  fs.writeFileSync(path, code, 'utf8');
  console.log('✅ 修正完了');
} else {
  console.log('❌ 対象箇所が見つかりません');
  console.log('手動確認:');
  console.log(code.includes('therapists?select=*,shops') ? '旧クエリあり' : '旧クエリなし');
}
