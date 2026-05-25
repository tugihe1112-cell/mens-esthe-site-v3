const fs = require('fs');

// Supabaseのtherapistsテーブルに登録されているshop_idを収集
const supaTherapists = JSON.parse(
  fs.readFileSync('./database_backups/therapists_backup_2026-04-11T01-34-25-910Z.json', 'utf8')
);
const supaShopIds = new Set(supaTherapists.map(t => t.shop_id));
console.log('Supabaseにセラピストが登録されている店舗数:', supaShopIds.size);

// ローカルshops.jsonを確認
const shops = JSON.parse(fs.readFileSync('./public/data/shops.json', 'utf8'));

const results = {
  correct: [],    // Supabaseに登録あり ✅
  localOnly: [],  // ローカルJSONにしかいない ❌
  noTherapist: [] // どこにもいない
};

shops.forEach(s => {
  const inSupabase = supaShopIds.has(s.id);
  const inLocal = s.therapists && s.therapists.length > 0;

  if (inSupabase) {
    results.correct.push(s);
  } else if (inLocal) {
    results.localOnly.push(s);
  } else {
    results.noTherapist.push(s);
  }
});

console.log('\n=== 集計結果 ===');
console.log('✅ Supabase登録あり（正しい方法）:', results.correct.length, '件');
console.log('❌ ローカルJSONのみ（是以外）:', results.localOnly.length, '件');
console.log('⚪ セラピストなし:', results.noTherapist.length, '件');

console.log('\n=== ❌ ローカルJSONのみの店舗（先頭30件）===');
results.localOnly.slice(0, 30).forEach(s => {
  console.log(`  ${s.id} | ${s.name} | セラピスト数: ${s.therapists.length}`);
});

// CSV出力
const rows = ['id,name,therapist_count,therapists_sample'];
results.localOnly.forEach(s => {
  rows.push([
    s.id,
    s.name,
    s.therapists.length,
    s.therapists[0]
  ].join(','));
});
fs.writeFileSync('wrong_therapists.csv', rows.join('\n'), 'utf8');
console.log('\n✅ wrong_therapists.csv に全件出力しました');
