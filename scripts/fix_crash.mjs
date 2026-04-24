import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const startStr = 'const [shopRes, tRes, rRes]';
const midStr = 'shopRes.json()';

const startIdx = content.indexOf(startStr);
const midIdx = content.indexOf(midStr, startIdx);
const endIdx = content.indexOf(']);', midIdx) + 3;

if (startIdx !== -1 && midIdx !== -1 && endIdx !== -1) {
  const newCode = `
        // 1. 先に店舗データだけを取得してブランドIDを確定させる
        const shopRes = await fetch(\`\${url}/rest/v1/shops?id=eq.\${shopId}&select=*\`, { headers, cache: 'no-store' });
        const shopData = await shopRes.json();
        const brandId = shopData?.[0]?.brand_id;

        // 2. 確定したブランドIDを含めて、口コミとキャストを並列取得する
        const reviewFetchUrl = brandId 
          ? \`\${url}/rest/v1/reviews?shop_id=in.(\${shopId},\${brandId})&select=*\`
          : \`\${url}/rest/v1/reviews?shop_id=eq.\${shopId}&select=*\`;

        const [tRes, rRes] = await Promise.all([
          fetch(\`\${url}/rest/v1/therapists?shop_id=eq.\${shopId}&select=*\`, { headers, cache: 'no-store' }),
          fetch(reviewFetchUrl, { headers, cache: 'no-store' })
        ]);

        const [tData, rData] = await Promise.all([tRes.json(), rRes.json()]);
  `.trim();

  content = content.substring(0, startIdx) + newCode + content.substring(endIdx);
  fs.writeFileSync(filePath, content);
  console.log('✅ 致命的なコードの順番エラーを修正しました！');
} else {
  console.log('⚠️ 対象のコードが見つかりません。');
}
