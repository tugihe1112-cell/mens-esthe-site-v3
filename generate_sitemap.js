import fs from 'fs';

console.log('🗺️ サイトマップ (sitemap.xml) の生成を開始します...');

// 1. .env から本番ドメインを安全に取得
let DOMAIN = 'https://your-domain.com';
try {
  const envContent = fs.readFileSync('./.env', 'utf8');
  const match = envContent.match(/VITE_PUBLIC_SITE_URL=(.*)/);
  if (match && match[1]) {
    DOMAIN = match[1].trim();
  }
} catch (e) {
  console.log('⚠️ .env の読み込みに失敗しました。デフォルトのドメインを使用します。');
}

// 末尾のスラッシュを削除してURLを整形
DOMAIN = DOMAIN.replace(/\/$/, '');

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
const today = new Date().toISOString().split('T')[0];

const addUrl = (path, priority) => {
  xml += `  <url>\n    <loc>${DOMAIN}${path}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>\n`;
};

// 2. Googleに登録すべき「公開用・固定ページ」を厳選して追加
// （※ /mypage や /history 等のプライベートページは【意図的に】除外しています！）
const staticPages = [
  { path: '', priority: '1.0' },
  { path: '/search', priority: '0.8' },
  { path: '/area-search', priority: '0.8' },
  { path: '/shops', priority: '0.9' },
  { path: '/ranking', priority: '0.9' }
];

staticPages.forEach(page => addUrl(page.path, page.priority));
console.log(`✅ 固定ページ (${staticPages.length}件) を追加しました。`);

// 3. 店舗ページ (/shops/:shopId) の追加
let shopCount = 0;
try {
  const brandData = JSON.parse(fs.readFileSync('./src/data/brand_details.json', 'utf8'));
  const brands = Array.isArray(brandData) ? brandData : Object.values(brandData);
  brands.forEach(b => {
    if (b.id) {
      addUrl(`/shops/${b.id}`, '0.8');
      shopCount++;
    }
  });
  console.log(`✅ 店舗ページ (${shopCount}件) を追加しました。`);
} catch(e) {
  console.log('⚠️ src/data/brand_details.json が見つからないためスキップしました。');
}

// 4. セラピストページ (/shops/:shopId/threads/:threadId) の追加
let thCount = 0;
try {
  const thData = JSON.parse(fs.readFileSync('./public/data/therapists.json', 'utf8'));
  const therapists = Array.isArray(thData) ? thData : Object.values(thData);
  therapists.forEach(t => {
    let shopId = (t.shopIds && t.shopIds.length > 0) ? t.shopIds[0] : null;
    if (!shopId && t.id && t.id.includes('relax_tokyo')) shopId = 'tokyo_minato_shinbashi_relax_tokyo';
    
    if (shopId && t.id) {
      addUrl(`/shops/${shopId}/threads/${t.id}`, '0.7');
      thCount++;
    }
  });
  console.log(`✅ セラピスト詳細ページ (${thCount}件) を追加しました。`);
} catch(e) {
  console.log('⚠️ public/data/therapists.json が見つからないためスキップしました。');
}

xml += `</urlset>`;

// publicフォルダに sitemap.xml を書き出す
fs.writeFileSync('./public/sitemap.xml', xml, 'utf8');
console.log(`\n🎉 完璧な sitemap.xml の生成が完了しました！`);
console.log(`👉 今後、3万件のデータを取り込んだ直後に \`node generate_sitemap.js\` を叩くだけで、数万件分のGoogle用マップが一瞬で完成します。`);

