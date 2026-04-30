const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/data/shops.json', 'utf8'));

const noImage = [];
const noSchedule = [];
const noOfficial = [];
const noTherapist = [];

data.forEach(s => {
  const img = s.image || s.image_url || '';
  if (!img || img.includes('no_image')) noImage.push(s);

  if (!s.schedule_url) noSchedule.push(s);
  if (!s.websiteUrl && !s.website_url) noOfficial.push(s);

  // セラピストがいない or ダミーIDのみ（名前が含まれないもの）
  const hasRealTherapist = s.therapists && s.therapists.length > 0
    && s.therapists.some(t => typeof t === 'string' && t.includes('_') && !/^\d+_/.test(t));
  if (!hasRealTherapist) noTherapist.push(s);
});

const summary = (label, list) => {
  console.log('\n=== ' + label + ': ' + list.length + '件 ===');
  list.forEach(s => console.log('  ' + (s.prefecture||'') + ' ' + (s.area||'') + ' | ' + s.name));
};

summary('① サムネイルなし', noImage);
summary('② スケジュールURLなし', noSchedule);
summary('③ 公式URLなし', noOfficial);
summary('④ セラピストなし（実名）', noTherapist);

// CSVで出力
const rows = ['店舗名,都道府県,エリア,サムネイル,スケジュール,公式URL,セラピスト'];
data.forEach(s => {
  const img = (s.image||'').includes('no_image') ? 'なし' : 'あり';
  const sch = s.schedule_url ? 'あり' : 'なし';
  const off = (s.websiteUrl || s.website_url) ? 'あり' : 'なし';
  const ther = (s.therapists && s.therapists.some(t => typeof t === 'string' && t.includes('_') && !/^\d+_/.test(t))) ? 'あり' : 'なし';
  rows.push([s.name, s.prefecture, s.area, img, sch, off, ther].join(','));
});
fs.writeFileSync('shop_audit.csv', rows.join('\n'), 'utf8');
console.log('\n✅ shop_audit.csv に全件出力しました');
