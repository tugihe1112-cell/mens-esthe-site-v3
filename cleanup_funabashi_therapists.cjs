const fs = require('fs-extra');

const main = async () => {
  console.log('🧹 Cleaning up Funabashi therapists...');
  
  const therapists = await fs.readJson('./public/data/therapists.json');
  
  // 船橋店のセラピストを取得
  const funabashiTherapists = therapists.filter(t => t.shop_id === 'chiba_funabashi_lynx');
  console.log(`Found ${funabashiTherapists.length} therapists for chiba_funabashi_lynx`);
  
  // 重複を削除（最初の225人のみ保持）
  const uniqueFunabashi = funabashiTherapists.slice(0, 225);
  console.log(`Keeping ${uniqueFunabashi.length} unique therapists`);
  
  // 西船橋用にコピー
  const nishiFunabashi = uniqueFunabashi.map(t => ({
    ...t,
    id: t.id.replace('chiba_funabashi_lynx', 'chiba_nishi_funabashi_lynx'),
    shop_id: 'chiba_nishi_funabashi_lynx'
  }));
  
  // 船橋・西船橋以外のセラピスト
  const others = therapists.filter(t => t.shop_id !== 'chiba_funabashi_lynx');
  
  // 統合
  const cleaned = [...others, ...uniqueFunabashi, ...nishiFunabashi];
  
  await fs.writeJson('./public/data/therapists.json', cleaned, { spaces: 2 });
  
  console.log('\n✅ Cleaned!');
  console.log(`  Total: ${cleaned.length}`);
  console.log(`  Funabashi: ${uniqueFunabashi.length}`);
  console.log(`  Nishi-Funabashi: ${nishiFunabashi.length}`);
};

main().catch(console.error);
