const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./database_backups/shops_backup_2026-04-11T01-34-25-910Z.json', 'utf8'));
const eren = data.filter(s => String(s.id).includes('eren'));
eren.forEach(s => {
  console.log('id:', s.id);
  console.log('image_url:', s.image_url);
  console.log('group_id:', s.group_id);
  console.log('therapists in raw_data:', s.raw_data?.therapists?.length || 0);
  console.log('');
});
