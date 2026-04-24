import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://www.esthe-club.tokyo';
const SHOP_ID = 'tokyo_setagaya_setagaya_esthe_club'; // 世田谷ベース
const GROUP_ID = 'g_esthe_club'; // 複数ルーム（駒沢/桜新町/学大など）のクチコミ吸収用ID

// ユーザーから提供されたHTMLデータ
const HTML_CONTENT = `
<ul class="tlist list-staff">
  <li class="col-6 col-sm-4 col-lg-3">
    <div class="item">
      <div class="photo">
        <a href="/profile/_uid/3140/">
          <img src="/asset/img/spacer300x450.png" style="background-image: url(/images/mc_1_1_3140.jpg?10)" class="img-fluid" alt="神谷のあさんの写真">
        </a>
      </div>
      <div class="cinfo">
        <a href="/profile/_uid/3140/">神谷のあ</a>
        <div class="p_profile">
          <span>28歳</span><span class="sizeC">T</span>.164 
          <div><span class="sizeC">B</span>.85(D) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.86</div>
        </div>
      </div>
      <div class="scheday">
        <span>駒沢大学ルーム</span><span>20:00～04:00</span>
      </div>
    </div>
  </li>
  <li class="col-6 col-sm-4 col-lg-3">
    <div class="item">
      <div class="photo">
        <a href="/profile/_uid/2898/">
          <img src="/asset/img/spacer300x450.png" style="background-image: url(/images/mc_1_1_2898.jpg?10)" class="img-fluid" alt="藤宮玲奈さんの写真">
        </a>
      </div>
      <div class="cinfo">
        <a href="/profile/_uid/2898/">藤宮玲奈</a>
        <div class="p_profile">
          <span>28歳</span><span class="sizeC">T</span>.156 
          <div><span class="sizeC">B</span>.85(D) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.80</div>
        </div>
      </div>
      <div class="scheday">
        <span>桜新町ルーム</span><span>21:00～03:00</span>
      </div>
    </div>
  </li>
  <li class="col-6 col-sm-4 col-lg-3">
    <div class="item">
      <div class="photo">
        <a href="/profile/_uid/2948/">
          <img src="/asset/img/spacer300x450.png" style="background-image: url(/images/mc_1_1_2948.jpeg?10)" class="img-fluid" alt="佐倉ひよりさんの写真">
        </a>
      </div>
      <div class="cinfo">
        <a href="/profile/_uid/2948/">佐倉ひより</a>
        <div class="p_profile">
          <span>22歳</span><span class="sizeC">T</span>.155 
          <div><span class="sizeC">B</span>.86(D) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.86</div>
        </div>
      </div>
      <div class="scheday">
        <span>用賀ルーム</span><span>21:30～05:00</span>
      </div>
    </div>
  </li>
  <li class="col-6 col-sm-4 col-lg-3">
    <div class="item">
      <div class="photo">
        <a href="/profile/_uid/3206/">
          <img src="/asset/img/spacer300x450.png" style="background-image: url(/images/mc_1_1_3206.jpeg?10)" class="img-fluid" alt="春野みこさんの写真">
          <div class="new">NEW</div>
        </a>
      </div>
      <div class="cinfo">
        <a href="/profile/_uid/3206/">春野みこ</a>
        <div class="p_profile">
          <span>27歳</span><span class="sizeC">T</span>.160 
          <div><span class="sizeC">B</span>.86(D) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.85</div>
        </div>
      </div>
      <div class="scheday">
        <span>学芸大学ルーム</span><span>23:00～04:00</span>
      </div>
    </div>
  </li>
</ul>
`;

async function main() {
  console.log('🚀 「東京えすてクラブ」の店舗登録とセラピスト抽出を開始します...\n');

  try {
    // --- 1. 店舗データ作成 ---
    console.log('🏪 店舗データを作成中...');
    
    const SHOP_DATA = {
      id: SHOP_ID,
      name: '東京えすてクラブ',
      area_id: 'tokyo_setagaya_setagaya', // 主なルームが世田谷エリアのため
      group_id: GROUP_ID, // ★クチコミ吸収用グループIDを適用
      schedule_url: 'https://www.esthe-club.tokyo/schedule/',
      website_url: 'https://www.esthe-club.tokyo/',
      business_hours: '20:00〜05:00', // スケジュールから推測
      price_system: '90分 17,000円～', // 割引適用後の価格
      image_url: 'https://placehold.jp/e74c3c/ffffff/400x300.png?text=%E6%9D%B1%E4%BA%AC%E3%81%88%E3%81%99%E3%81%A6%E3%82%AF%E3%83%A9%E3%83%96',
      raw_data: {
        prefecture: '東京都',
        city: '世田谷区',
        area: '世田谷', // スクリーニング突破用
        address: '東京都世田谷区',
        system: [
          {
            courseName: 'オープン割引開催中！！！',
            description: '※通常価格より2000円割引となります。',
            prices: [
              { time: '90分', price: '17,000円' },
              { time: '120分', price: '22,000円' },
              { time: '150分', price: '27,000円' },
              { time: '180分', price: '32,000円' },
              { time: '210分', price: '38,000円' },
              { time: '240分', price: '44,000円' }
            ]
          }
        ]
      }
    };

    const { error: upsertErr } = await supabase.from('shops').upsert(SHOP_DATA, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;
    console.log(`✅ 店舗情報をID「${SHOP_ID}」で登録・更新しました。\n`);

    // --- 2. セラピストのパース ---
    console.log(`⏳ 提供されたHTMLからセラピストを抽出中...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.list-staff li');

    let newTherapists = [];
    const now = new Date().toISOString();

    items.each((_, el) => {
      const item = $(el);
      
      const rawNameText = item.find('.cinfo > a').first().text().trim();
      if (!rawNameText) return;

      const cleanName = rawNameText.replace(/[\s　]/g, '');

      // 背景画像からURLを抽出 (style="background-image: url(...)")
      const bgImageStyle = item.find('.photo img').attr('style') || '';
      let imageUrl = '';
      const bgMatch = bgImageStyle.match(/url\(['"]?(.*?)['"]?\)/);
      if (bgMatch) {
          imageUrl = bgMatch[1];
          if(imageUrl && !imageUrl.startsWith('http')){
              imageUrl = `${BASE_URL}${imageUrl}`;
          }
      }
      
      const profileText = item.find('.p_profile').text().replace(/\s+/g, ' ').trim();
      const roomInfo = item.find('.scheday').text().replace(/\s+/g, ' ').trim();
      
      let fullBio = `${profileText}\n${roomInfo}`;

      newTherapists.push({
        id: `${SHOP_ID}_${cleanName}`,
        shop_id: SHOP_ID,
        name: cleanName,
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: {
          bio: fullBio,
          original_name: rawNameText,
          room: roomInfo
        }
      });
    });

    console.log(`✅ ${newTherapists.length} 名のセラピストデータを抽出しました。\n`);

    // --- 3. Supabaseへの登録 ---
    console.log(`🗑️ 古いセラピストデータをクリアしています...`);
    await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);

    console.log(`📦 新しいデータを登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    console.log(`\n🎉 登録完了！「東京えすてクラブ」に店舗と ${newTherapists.length}名のセラピストが登録されました。`);

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
