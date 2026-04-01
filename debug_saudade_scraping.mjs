import fs from 'fs';
import * as cheerio from 'cheerio';

async function run() {
  console.log("🔍 サウダージのHTML全体を解析して、なぜ取得漏れが起きたのか調査します...\n");
  try {
    const response = await fetch('https://saudade-tokyo.com/therapist.html');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    let totalBoxes = $('.staff-box').length;
    console.log(`📦 見つかった .staff-box (枠) の総数: ${totalBoxes} 件\n`);

    let skippedCount = 0;
    let successCount = 0;

    $('.staff-box').each((i, el) => {
      // 1番目のliタグの中身（名前が入っている想定の場所）
      const rawNameText = $(el).find('.box-inner li').first().text().trim();
      // 所属店舗のタグ
      const area = $(el).find('.list_roomicon').text().trim();
      
      console.log(`--- [${i + 1}枠目] ---`);
      console.log(`取得したテキスト: "${rawNameText}"`);
      console.log(`店舗タグ: "${area}"`);

      // スキップ条件1: キャンペーン等の文字が含まれているか
      if (rawNameText.includes('キャンペーン') || rawNameText.includes('期間限定') || rawNameText.includes('イベント')) {
         console.log(`⚠️ 結果: スキップ (理由: ダミー枠と判定)`);
         skippedCount++;
         return;
      }

      // スキップ条件2: 店舗タグが存在しない
      if (!area) {
         console.log(`⚠️ 結果: スキップ (理由: 所属店舗タグがHTMLに存在しないため、どこに入れるべきか不明)`);
         skippedCount++;
         return;
      }

      console.log(`✅ 結果: 取得成功 (名前: ${rawNameText} / 店舗: ${area})`);
      successCount++;
    });

    console.log(`\n📊 --- 調査結果まとめ ---`);
    console.log(`HTML上の全枠数: ${totalBoxes}`);
    console.log(`取得成功として判定: ${successCount}名`);
    console.log(`スキップ（除外）: ${skippedCount}枠`);
    console.log(`-------------------------\n`);

  } catch (error) {
    console.error("エラー:", error);
  }
}
run();
