const { execSync } = require('child_process');

// Gitの全コミットを取得
const commits = execSync('git log --all --oneline').toString().split('\n').filter(Boolean);

console.log(`全コミット数: ${commits.length}\n`);
console.log('各コミットのall_shops.jsonをチェック中...\n');

for (let i = 0; i < Math.min(commits.length, 10); i++) {
  const hash = commits[i].split(' ')[0];
  try {
    const content = execSync(`git show ${hash}:public/data/all_shops.json 2>/dev/null`).toString();
    const data = JSON.parse(content);
    
    // therapistsがオブジェクト配列の店舗を探す
    const withTherapistObjects = data.filter(s => 
      s.therapists && 
      Array.isArray(s.therapists) && 
      s.therapists.length > 0 &&
      typeof s.therapists[0] === 'object' &&
      s.therapists[0].name
    );
    
    if (withTherapistObjects.length > 0) {
      console.log(`✅ ${hash}: ${withTherapistObjects.length}店舗にセラピストオブジェクトあり`);
      withTherapistObjects.slice(0, 3).forEach(s => {
        console.log(`   - ${s.name}: ${s.therapists.length}人`);
      });
      console.log(`\n復元可能コミット発見: ${hash}`);
      console.log(`実行: git show ${hash}:public/data/all_shops.json > /tmp/recoverable_all_shops.json`);
      break;
    }
  } catch (e) {
    // ファイルが存在しないコミット
  }
}
