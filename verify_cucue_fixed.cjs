const therapists = require('./public/data/therapists.json');

const cucue = therapists.filter(t => 
  (t.shop_id || t.shopId) === 'aichi_chikusa_cucue'
);

console.log('=== Cucue 千種店 ===');
console.log(`セラピスト数: ${cucue.length}人\n`);
console.log('最初の10人:');
cucue.slice(0, 10).forEach(t => {
  console.log(`  - ${t.name} (${t.age || '?'}歳)`);
});

// 「セラピスト」という名前が残っていないか全体確認
const broken = therapists.filter(t => t.name === 'セラピスト');
console.log(`\n全体で「セラピスト」という名前: ${broken.length}人 ✅`);
