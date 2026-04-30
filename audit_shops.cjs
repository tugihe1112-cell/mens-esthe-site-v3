const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/data/shops.json', 'utf8'));

const noImage = [];
const noLinks = [];

data.forEach(s => {
  // ① サムネイルなし
  const img = s.image || s.image_url || '';
  if (!img || img.includes('no_image') || img === '') {
    noImage.push({ id: s.id, name: s.name, area: s.area, pref: s.prefecture });
  }

  // ② リンク系（スケジュール・公式・セラピスト）のどれかが欠けている
  const hasSchedule = !!(s.scheduleUrl || s.schedule_url || s.reserveUrl || s.reserve_url);
  const hasOfficial = !!(s.websiteUrl || s.website_url || s.officialUrl || s.official_url);
  const hasTherapist = !!(s.therapists && s.therapists.length > 0);

  if (!hasSchedule || !hasOfficial || !hasTherapist) {
    noLinks.push({
      name: s.name,
      area: s.area,
      pref: s.prefecture,
      missingSchedule: !hasSchedule,
      missingOfficial: !hasOfficial,
      missingTherapist: !hasTherapist,
    });
  }
});

console.log('=== ① サムネイルなし: ' + noImage.length + '件 ===');
noImage.forEach(s => console.log('  ' + s.pref + ' ' + s.area + ' | ' + s.name));

console.log('\n=== ② リンク欠落: ' + noLinks.length + '件 ===');
noLinks.forEach(s => {
  const missing = [];
  if (s.missingSchedule) missing.push('スケジュール');
  if (s.missingOfficial) missing.push('公式');
  if (s.missingTherapist) missing.push('セラピスト');
  console.log('  [' + missing.join('/') + '] ' + s.pref + ' ' + s.area + ' | ' + s.name);
});

// リンク系フィールド名の確認（最初の1件）
console.log('\n=== データフィールド確認（1件目） ===');
const sample = data[0];
const keys = ['image','image_url','websiteUrl','website_url','scheduleUrl','schedule_url','therapists'];
keys.forEach(k => console.log('  ' + k + ': ' + JSON.stringify(sample[k])?.slice(0,60)));
