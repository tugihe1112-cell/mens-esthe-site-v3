import * as cheerio from 'cheerio';

// 在籍一覧がありそうなURLの候補
const URLS_TO_CHECK = [
  'https://a-laise-sk.com/schedule/', // スケジュール（前回9名だったページ）
  'https://a-laise-sk.com/casts/',    // キャスト一覧の推測URL 1
  'https://a-laise-sk.com/cast/',     // キャスト一覧の推測URL 2
  'https://a-laise-sk.com/system/'    // 念のためシステムページ
];

async function main() {
  console.log('🔍 各ページに掲載されている「セラピストの人数」を調査します...\n');
  
  for (const url of URLS_TO_CHECK) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) {
        console.log(`❌ ${url} : アクセスできませんでした (${res.status})`);
        continue;
      }
      const html = new TextDecoder('utf-8').decode(await res.arrayBuffer());
      const $ = cheerio.load(html);
      
      const count = $('.cast__item').length;
      console.log(`✅ ${url}`);
      console.log(`   👉 検出数: ${count} 件`);
      
    } catch (e) {
      console.log(`❌ ${url} : エラー (${e.message})`);
    }
  }
  console.log('\n=============================================');
  console.log('※ もし上のURLで全件ヒットしない場合、公式サイトの「在籍一覧」のURLを教えてください！');
  console.log('=============================================');
}

main();
