import * as cheerio from 'cheerio';

const TARGET_URL = 'https://a-laise-sk.com/schedule/';

async function main() {
  console.log(`🚀 ${TARGET_URL} からデータを取得中...\n`);
  try {
    const response = await fetch(TARGET_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const html = new TextDecoder('utf-8').decode(await response.arrayBuffer());
    const $ = cheerio.load(html);
    const items = $('.cast__item');
    
    console.log(`🔍 ${items.length} 件の要素が見つかりました。\n`);
    
    let count = 0;
    items.each((_, el) => {
      const item = $(el);
      const nameText = item.find('.cast__name').text().replace(/\s+/g, ' ').trim();
      const sizeText = item.find('.cast__size').text().replace(/\s+/g, ' ').trim();
      const tags = [];
      item.find('.type__label span').each((i, tag) => tags.push($(tag).text().trim()));
      
      if (nameText) {
        console.log(`- ${nameText} | サイズ: ${sizeText || 'なし'} | タグ: ${tags.join(', ')}`);
        count++;
      }
    });
    
    console.log(`\n✅ 抽出完了: ${count} 件`);
    console.log('====================================================');
    console.log('※「ROOM」や「未経験育成割り」なども含まれています。');
    console.log('これらは除外しますか？そのまま登録しますか？');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ エラー:', err.message);
  }
}

main();
