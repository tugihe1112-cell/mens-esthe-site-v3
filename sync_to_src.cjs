const fs = require('fs-extra');

const main = async () => {
  console.log('📋 Copying data to src/data...');
  
  await fs.copy('./public/data/therapists.json', './src/data/therapists.json');
  await fs.copy('./public/data/shops.json', './src/data/shops.json');
  
  console.log('✅ Data synced to src/data/');
};

main().catch(console.error);
