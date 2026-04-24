import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://muchispa-room.com';
const AREA_ID = 'tokyo_koto_kameido'; // 亀戸エリア
const SHOP_ID = `${AREA_ID}_muchispa_room`; 
const GROUP_ID = 'g_muchispa'; // 今後の系列店展開を想定して設定

// ユーザーから提供されたHTMLデータ
const HTML_CONTENT = `
<div class="column-box staff-wrap">
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=181" style="background-image:url(https://muchispa-room.com/data/staff/181/stf_69b7c21c84c32.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico01"><span>新人</span></li><li class="ico02"><span>清楚系</span></li></ul>
                </div>

                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">えな
                                          (H)                                        (21)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=179" style="background-image:url(https://muchispa-room.com/data/staff/179/stf_69b38f8e3189d.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico02"><span>清楚系</span></li></ul>
                </div>

                                  <span class="ico-tw"><a href="https://lit.link/emiri_muchisupa"><i class="fa-brands fa-x-twitter"></i></a></span>
                
                                  <span class="ico-tw ico-sns02"><a href="https://m-sns.net/profile/@emiri_mir"><i class="ico-sns02-img"></i></a></span>
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">えみり
                                          (F)                                        (24)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=175" style="background-image:url(https://muchispa-room.com/data/staff/175/stf_697029d94bdb0.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico03"><span>色っぽい</span></li></ul>
                </div>

                                  <span class="ico-tw"><a href="https://lit.link/a76cabac-b93a-47c9-9de0-346f1be57c83"><i class="fa-brands fa-x-twitter"></i></a></span>
                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">ひより
                                          (F)                                        (27)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=173" style="background-image:url(https://muchispa-room.com/data/staff/173/stf_695dc9ddaabc9.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico02"><span>清楚系</span></li></ul>
                </div>

                                  <span class="ico-tw"><a href="https://lit.link/ruichun"><i class="fa-brands fa-x-twitter"></i></a></span>
                
                                  <span class="ico-tw ico-sns02"><a href="https://m-sns.net/profile/@ruiruidayo2"><i class="ico-sns02-img"></i></a></span>
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">るい
                                          (J)                                        (29)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                              <span class="list_roomicon room1">北千住</span>
                                            <i class="far fa-clock"></i>10:00～22:00                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=57" style="background-image:url(https://muchispa-room.com/data/staff/57/stf_698f3df5c2a02.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico03"><span>色っぽい</span></li></ul>
                </div>

                                  <span class="ico-tw"><a href="https://twitter.com/max_muti_36"><i class="fa-brands fa-x-twitter"></i></a></span>
                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">みるく
                                          (H)                                        (28)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=77" style="background-image:url(https://muchispa-room.com/data/staff/77/stf_699696f347975.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico02"><span>清楚系</span></li></ul>
                </div>

                                  <span class="ico-tw"><a href="https://lit.link/ne6v6"><i class="fa-brands fa-x-twitter"></i></a></span>
                
                                  <span class="ico-tw ico-sns02"><a href="https://m-sns.net/profile/@ayane_muchi"><i class="ico-sns02-img"></i></a></span>
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">あやね
                                          (F)                                        (28)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                              <span class="list_roomicon room1">北千住</span>
                                            <i class="far fa-clock"></i>17:00～23:00                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=170" style="background-image:url(https://muchispa-room.com/data/staff/170/stf_693fecf5d62b2.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico03"><span>色っぽい</span></li></ul>
                </div>

                                  <span class="ico-tw"><a href="https://twitter.com/mcsp_ayaka"><i class="fa-brands fa-x-twitter"></i></a></span>
                
                                  <span class="ico-tw ico-sns02"><a href="https://m-sns.net/profile/@mcsp_ayaka"><i class="ico-sns02-img"></i></a></span>
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">あやか
                                          (F)                                        (26)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=157" style="background-image:url(https://muchispa-room.com/data/staff/157/stf_6910742ccecfc.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico02"><span>清楚系</span></li></ul>
                </div>

                                  <span class="ico-tw"><a href="https://lit.link/umi_muchispa"><i class="fa-brands fa-x-twitter"></i></a></span>
                
                                  <span class="ico-tw ico-sns02"><a href="https://m-sns.net/profile/@umi_muchispa"><i class="ico-sns02-img"></i></a></span>
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">うみ
                                          (H)                                        (24)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                              <span class="list_roomicon room2">南浦和</span>
                                            <i class="far fa-clock"></i>18:00～22:30                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=25" style="background-image:url(https://muchispa-room.com/data/staff/25/stf_69e73c70080dd.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico03"><span>色っぽい</span></li></ul>
                </div>

                                  <span class="ico-tw"><a href="https://lit.link/muchimaria"><i class="fa-brands fa-x-twitter"></i></a></span>
                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">まりあ
                                          (J)                                        (31)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                              <span class="list_roomicon room1">北千住</span>
                                            <i class="far fa-clock"></i>10:00～18:00                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=89" style="background-image:url(https://muchispa-room.com/data/staff/89/stf_68467d2e579c1.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico03"><span>色っぽい</span></li></ul>
                </div>

                                  <span class="ico-tw"><a href="https://x.com/m_y_u_u_c_a_h_i?s=21"><i class="fa-brands fa-x-twitter"></i></a></span>
                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">ゆあ
                                          (F)                                        (23)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=119" style="background-image:url(https://muchispa-room.com/data/staff/119/stf_6986f145e4815.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico03"><span>色っぽい</span></li></ul>
                </div>

                                  <span class="ico-tw"><a href="https://lit.link/muchisupamitsuki"><i class="fa-brands fa-x-twitter"></i></a></span>
                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">みつき
                                          (G)                                        (27)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=136" style="background-image:url(https://muchispa-room.com/data/staff/136/stf_699c31e646acc.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico03"><span>色っぽい</span></li></ul>
                </div>

                                  <span class="ico-tw"><a href="https://lit.link/rinchan1322"><i class="fa-brands fa-x-twitter"></i></a></span>
                
                                  <span class="ico-tw ico-sns02"><a href="https://m-sns.net/profile/@mcsp_rin"><i class="ico-sns02-img"></i></a></span>
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">りん
                                          (H)                                        (28)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=105" style="background-image:url(https://muchispa-room.com/data/staff/105/stf_69508e84c1986.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico02"><span>清楚系</span></li></ul>
                </div>

                                  <span class="ico-tw"><a href="https://twitter.com/suzu_mspa"><i class="fa-brands fa-x-twitter"></i></a></span>
                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">すず
                                          (F)                                        (26)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=67" style="background-image:url(https://muchispa-room.com/data/staff/67/stf_6603b4aeeacd6.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico03"><span>色っぽい</span></li></ul>
                </div>

                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">えみ
                                          (H)                                        (34)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=169" style="background-image:url(https://muchispa-room.com/data/staff/169/stf_693e60a09bdaf.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico02"><span>清楚系</span></li></ul>
                </div>

                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">ひまり
                                          (I)                                        (25)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=168" style="background-image:url(https://muchispa-room.com/data/staff/168/stf_69b38ab980f13.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico03"><span>色っぽい</span></li></ul>
                </div>

                
                                  <span class="ico-tw ico-sns02"><a href="https://m-sns.net/profile/@miya_08188"><i class="ico-sns02-img"></i></a></span>
                
                                  <span class="ico-tw ico-bs"><a href="https://bsky.app/profile/miya-48188.bsky.social"><i class="fa-brands fa-bluesky"></i></a></span>
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">みや
                                          (H)                                        (24)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                              <span class="list_roomicon room2">南浦和</span>
                                            <i class="far fa-clock"></i>10:00～18:00                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=142" style="background-image:url(https://muchispa-room.com/data/staff/142/stf_67eea3c30f4cd.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico02"><span>清楚系</span></li></ul>
                </div>

                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">ゆかり
                                          (G)                                        (28)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=73" style="background-image:url(https://muchispa-room.com/data/staff/73/stf_6617fa81a6cf4.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico03"><span>色っぽい</span></li></ul>
                </div>

                                  <span class="ico-tw"><a href="https://lit.link/muchisparoomkurumi"><i class="fa-brands fa-x-twitter"></i></a></span>
                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">くるみ
                                          (I)                                        (26)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=97" style="background-image:url(https://muchispa-room.com/data/staff/97/stf_6894957251495.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico03"><span>色っぽい</span></li></ul>
                </div>

                                  <span class="ico-tw"><a href="https://twitter.com/karen_240902?s=11"><i class="fa-brands fa-x-twitter"></i></a></span>
                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">かれん
                                          (K)                                        (26)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=172" style="background-image:url(https://muchispa-room.com/data/staff/172/stf_69cf22a534d67.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico02"><span>清楚系</span></li></ul>
                </div>

                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">のあ
                                          (H)                                        (25)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=176" style="background-image:url(https://muchispa-room.com/data/staff/176/stf_6972e41e317d5.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico03"><span>色っぽい</span></li></ul>
                </div>

                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">ゆうな
                                          (G)                                        (32)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=174" style="background-image:url(https://muchispa-room.com/data/staff/174/stf_696a64ced3549.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico02"><span>清楚系</span></li></ul>
                </div>

                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">えり
                                          (F)                                        (26)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=160" style="background-image:url(https://muchispa-room.com/data/staff/160/stf_68c84ff5bcb4e.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico02"><span>清楚系</span></li></ul>
                </div>

                                  <span class="ico-tw"><a href="https://twitter.com/muchi_nana3"><i class="fa-brands fa-x-twitter"></i></a></span>
                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">なな
                                          (J)                                        (25)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=154" style="background-image:url(https://muchispa-room.com/data/staff/154/stf_68500e54101dd.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico02"><span>清楚系</span></li></ul>
                </div>

                                  <span class="ico-tw"><a href="https://twitter.com/muchimoespa"><i class="fa-brands fa-x-twitter"></i></a></span>
                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">もえ
                                          (F)                                        (30)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=166" style="background-image:url(https://muchispa-room.com/data/staff/166/stf_6904486fcd60f.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico01"><span>新人</span></li><li class="ico03"><span>色っぽい</span></li></ul>
                </div>

                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">しほ
                                          (G)                                        (24)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
                      <div class="staff-box">
              <div class="staff-image"><a href="./profile.html?sid=90" style="background-image:url(https://muchispa-room.com/data/staff/90/stf_66e6b53a8579d.webp);"></a>
                <div class="ico-area">
                  <ul><li class="ico02"><span>清楚系</span></li></ul>
                </div>

                
                
                
              </div>
              <div class="staff-text">
                <ul>
                                    <li class="staff-name">まゆ
                                          (F)                                        (26)                  </li>
                  
                    <li class="list_roomicon_wrap">
                                            -----                    </li>

                                  </ul>
              </div>

            </div>
          <div class="staff-box" style="background:none;padding:0;margin:0;box-shadow:none;"></div>
<div class="staff-box" style="background:none;padding:0;margin:0;box-shadow:none;"></div>
        </div>
`;

async function main() {
  console.log('🚀 「むちすぱルーム 亀戸」の店舗とセラピスト一括登録を開始します...\n');

  try {
    console.log('🏪 店舗データを登録中...');
    
    const SHOP_DATA = {
      id: SHOP_ID,
      name: 'むちすぱルーム 亀戸',
      area_id: AREA_ID, // tokyo_koto_kameido
      group_id: GROUP_ID, 
      schedule_url: 'https://muchispa-room.com/schedule.html',
      website_url: 'https://muchispa-room.com/',
      business_hours: '営業時間要確認', 
      price_system: '60分 13,000円～(割引後12,000円〜)', // 画像から反映
      image_url: 'https://placehold.jp/e74c3c/ffffff/400x300.png?text=%E3%82%80%E3%81%A1%E3%81%99%E3%81%B1', // 仮画像
      raw_data: {
        prefecture: '東京都',
        city: '江東区',
        area: '亀戸',
        address: '東京都江東区亀戸エリア',
        system: [
          {
            courseName: '基本コース',
            description: '画像から読み取った料金です（通常料金 → 割引料金）',
            prices: [
              { time: '60min', price: '13,000円 → 12,000円' },
              { time: '80min', price: '15,000円 → 14,000円' },
              { time: '100min', price: '17,000円 → 16,000円' },
              { time: '120min', price: '21,000円 → 20,000円' },
              { time: '150min', price: '27,000円 → 26,000円' },
              { time: '180min', price: '33,000円 → 32,000円' }
            ]
          }
        ]
      }
    };

    const { error: upsertErr } = await supabase.from('shops').upsert(SHOP_DATA, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;
    console.log(`✅ 店舗情報（ID: ${SHOP_ID}）を登録しました。\n`);

    console.log(`⏳ HTMLからセラピストを抽出中...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.staff-box').filter((i, el) => {
        // 空のプレースホルダーdivを除外
        return $(el).find('.staff-name').length > 0;
    });

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; 

    items.each((_, el) => {
      const item = $(el);
      
      const nameAreaText = item.find('.staff-name').text().trim();
      if (!nameAreaText) return;

      // 「えな (H) (21)」のような形式から分割
      // 正規表現で「名前」「カップ」「年齢」を抽出
      const nameMatch = nameAreaText.match(/^([^\(]+)/);
      let cleanName = nameMatch ? nameMatch[1].trim() : nameAreaText;
      
      const cupMatch = nameAreaText.match(/\(([A-Z]+)\)/);
      const cup = cupMatch ? `${cupMatch[1]}カップ` : '';

      const ageMatch = nameAreaText.match(/\((\d+)\)/);
      const age = ageMatch ? `${ageMatch[1]}歳` : '';

      // 同名回避処理
      let finalNameId = cleanName.replace(/\s/g, '_');
      if (seenNames[finalNameId]) {
        seenNames[finalNameId]++;
        finalNameId = `${finalNameId}_${seenNames[finalNameId]}`; 
      } else {
        seenNames[finalNameId] = 1;
      }
      
      // 画像URL抽出
      let imageUrl = '';
      const styleAttr = item.find('.staff-image a').attr('style');
      if (styleAttr) {
          const urlMatch = styleAttr.match(/url\((.*?)\)/);
          if (urlMatch) {
              imageUrl = urlMatch[1].replace(/['"]/g, '');
              if (imageUrl && !imageUrl.startsWith('http')) {
                  imageUrl = `${BASE_URL}${imageUrl}`;
              }
          }
      }

      // タグ（アイコン）の抽出
      const tags = [];
      item.find('.ico-area li span').each((_, spanEl) => {
          tags.push($(spanEl).text().trim());
      });

      // 出勤時間や店舗（北千住・南浦和など系列の情報）
      const listRoomWrap = item.find('.list_roomicon_wrap');
      const room = listRoomWrap.find('.list_roomicon').text().trim();
      const timeText = listRoomWrap.contents().filter(function() {
        return this.nodeType === 3; // Text node
      }).text().trim();

      let fullBio = '';
      if (age) fullBio += `年齢: ${age} `;
      if (cup) fullBio += `カップ: ${cup}\n`;
      if (room) fullBio += `店舗: ${room} `;
      if (timeText && !timeText.includes('---')) fullBio += `時間: ${timeText}`;

      newTherapists.push({
        id: `${SHOP_ID}_${finalNameId}`,
        shop_id: SHOP_ID,
        name: cleanName, 
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: {
          tags: tags,
          bio: fullBio.trim(),
          original_name: nameAreaText.replace(/\s+/g, ' ')
        }
      });
    });

    console.log(`✅ ${newTherapists.length} 名のセラピストデータを抽出しました。`);

    console.log(`🗑️ 古いセラピストデータをクリアしています...`);
    await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);

    console.log(`📦 新しいデータを登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    console.log(`\n🎉 登録完了！「むちすぱルーム 亀戸」に店舗と ${newTherapists.length}名のセラピストが登録されました。`);
    console.log('ブラウザの「亀戸」エリアでスーパーリロードしてご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
