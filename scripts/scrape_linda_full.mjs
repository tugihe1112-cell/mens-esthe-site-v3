import axios from 'axios';
import * as cheerio from 'cheerio';

// 基本となるURL
const BASE_URL = 'https://linda-spa.com/cast/';

async function main() {
  console.log('🚀 LINDA SPA 公式サイトからの全セラピスト抽出を開始します...\n');

  let allTherapists = [];
  let currentPage = 1;
  let hasNextPage = true;

  try {
    while (hasNextPage) {
      // 1ページ目はそのまま、2ページ目以降は /page/2/ のようにURLを構築
      const targetUrl = currentPage === 1 ? BASE_URL : `${BASE_URL}page/${currentPage}/`;
      console.log(`⏳ ページ ${currentPage} を取得中... (${targetUrl})`);

      let response;
      try {
        response = await axios.get(targetUrl, {
          // サーバーにブロックされないよう、一般的なブラウザのUser-Agentを偽装
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
      } catch (err) {
         // 404エラーなどが発生したら、そこでページネーション終了と判断
         if (err.response && err.response.status === 404) {
             console.log(`➡️ ページ ${currentPage} は存在しません。全ページの取得が完了したと判断します。`);
             hasNextPage = false;
             break;
         }
         throw err;
      }

      const html = response.data;
      const $ = cheerio.load(html);
      
      // ページ内のセラピストカード（li.columns.action）を取得
      const items = $('li.columns.action');
      
      if (items.length === 0) {
        console.log(`➡️ ページ ${currentPage} にセラピスト情報がありませんでした。取得を終了します。`);
        hasNextPage = false;
        break;
      }

      console.log(`   - ${items.length}名のデータを抽出しました。`);

      items.each((_, el) => {
        const item = $(el);
        
        // 名前の抽出 (例: "水野るか")
        const rawName = item.find('.cast-name .name').text().trim();
        
        // 年齢の抽出 (例: "(24)" -> "24歳")
        const ageMatch = item.find('.cast-name .age').text().match(/\((\d+)\)/);
        const age = ageMatch ? `${ageMatch[1]}歳` : '';

        // 画像URLの抽出
        // 遅延読み込み(lazyload)対応のため、data-srcがあれば優先、なければsrcを取得
        let imageUrl = item.find('img.thumbnail').attr('data-src') || item.find('img.thumbnail').attr('src') || '';
        // "data:image/gif;base64..." のようなダミー画像は除外する
        if (imageUrl.startsWith('data:image')) {
            imageUrl = '';
        }

        // タグ（アイコン）の抽出
        const tags = [];
        // 「本日出勤」などのテキストアイコン
        item.find('.cast-icon span[class^="icon-"]').each((_, tagEl) => {
            const text = $(tagEl).text().trim();
            // "Twitter"などの不要なラベルを除外したい場合はここで条件分岐
            if(text && text !== 'Twitter') {
                tags.push(text);
            }
        });
        // 「新人」「ピックアップ」などのラベル
        item.find('.cast-icon-label').each((_, tagEl) => {
            const text = $(tagEl).text().trim();
            if(text) tags.push(text);
        });

        // データの整形
        if (rawName) {
           allTherapists.push({
             rawName: rawName,
             age: age,
             tags: [...new Set(tags)], // 重複削除
             image: imageUrl
           });
        }
      });

      // 次のページへのリンクがあるか確認
      // class="cd-pagination" 内の「次へ」ボタンなどを探す
      const nextLink = $('.cd-pagination a:contains("次へ"), .pagination a.next, a.next.page-numbers');
      if (nextLink.length > 0) {
         currentPage++;
         // サーバーに負荷をかけないよう、少し待機(1秒)
         await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
         // 「次へ」がなければ、これ以上ページはないと判断（URL直叩きで進めて404判定するループ処理に任せるため、ここでは強制終了せずカウントアップして次に進む）
         currentPage++;
         await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n🎉 スレイピング完了！合計 ${allTherapists.length} 名のデータを取得しました。`);

    // 取得したデータの最初の3件だけサンプルとして表示
    console.log('\n--- 取得データサンプル ---');
    console.log(JSON.stringify(allTherapists.slice(0, 3), null, 2));
    console.log('--------------------------\n');

    console.log('このデータをSupabaseに登録する処理を続けますか？（その場合は登録用のコードを出力します）');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
