import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://muchispa-room.com';
const GROUP_ID = 'g_muchispa';

// 店舗ごとの設定
const SHOPS = {
  '北千住': {
    id: 'tokyo_adachi_kitasenju_muchispa',
    name: 'むちすぱルーム 北千住',
    area_id: 'tokyo_adachi_kitasenju',
    image_url: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/muchispa.png',
    raw_data_base: { prefecture: '東京都', city: '足立区', area: '北千住' }
  },
  '南浦和': {
    id: 'saitama_saitama_minamiurawa_muchispa',
    name: 'むちすぱルーム 南浦和',
    area_id: 'saitama_saitama_minamiurawa',
    image_url: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/muchispa.png',
    raw_data_base: { prefecture: '埼玉県', city: 'さいたま市', area: '南浦和' }
  },
  '不明': { 
    id: 'tokyo_adachi_kitasenju_muchispa'
  }
};

// 共通の店舗情報（ルート階層に置くもの）
const COMMON_SHOP_DATA = {
  group_id: GROUP_ID,
  schedule_url: 'https://muchispa-room.com/schedule.html',
  website_url: 'https://muchispa-room.com/',
  business_hours: '10:00〜',
  price_system: '60分 13,000円～(割引後12,000円〜)',
};

// 料金システム（必ず raw_data 内に入れるもの）
const SYSTEM_DATA = [
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
];

// HTMLデータ
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
        </div>
`;

async function main() {
  console.log('🚀 「むちすぱルーム」の店舗（北千住・南浦和）とセラピスト登録を開始します...\n');

  try {
    // 1. 古い亀戸エリアのデータを削除（もし登録されていた場合）
    console.log(`🗑️ 不要な亀戸エリアのデータを削除中...`);
    const wrongShopId = 'tokyo_koto_kameido_muchispa_room';
    await supabase.from('therapists').delete().eq('shop_id', wrongShopId);
    await supabase.from('shops').delete().eq('id', wrongShopId);

    // 2. 北千住と南浦和の2店舗を登録
    console.log('🏪 北千住店と南浦和店の店舗データを登録中...');
    for (const [key, shop] of Object.entries(SHOPS)) {
      if (key === '不明') continue;
      
      const shopData = {
        ...COMMON_SHOP_DATA,
        id: shop.id,
        name: shop.name,
        area_id: shop.area_id,
        image_url: shop.image_url,
        raw_data: { // ✅ ここに system を格納
          ...shop.raw_data_base,
          address: `${shop.raw_data_base.prefecture}${shop.raw_data_base.city}${shop.raw_data_base.area}エリア`,
          system: SYSTEM_DATA
        }
      };
      const { error: upsertErr } = await supabase.from('shops').upsert(shopData, { onConflict: 'id' });
      if (upsertErr) throw upsertErr;
    }
    console.log(`✅ 2店舗の情報を登録しました。\n`);

    // 3. セラピストの抽出と振り分け
    console.log(`⏳ HTMLからセラピストを抽出し、店舗ごとに振り分け中...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.staff-box').filter((i, el) => $(el).find('.staff-name').length > 0);

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; 

    items.each((_, el) => {
      const item = $(el);
      
      const nameAreaText = item.find('.staff-name').text().trim();
      const nameMatch = nameAreaText.match(/^([^\(]+)/);
      let cleanName = nameMatch ? nameMatch[1].trim() : nameAreaText;
      
      const cupMatch = nameAreaText.match(/\(([A-Z]+)\)/);
      const cup = cupMatch ? `${cupMatch[1]}カップ` : '';

      const ageMatch = nameAreaText.match(/\((\d+)\)/);
      const age = ageMatch ? `${ageMatch[1]}歳` : '';

      let finalNameId = cleanName.replace(/\s/g, '_');
      if (seenNames[finalNameId]) {
        seenNames[finalNameId]++;
        finalNameId = `${finalNameId}_${seenNames[finalNameId]}`; 
      } else {
        seenNames[finalNameId] = 1;
      }
      
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

      const tags = [];
      item.find('.ico-area li span').each((_, spanEl) => {
          tags.push($(spanEl).text().trim());
      });

      // 所属店舗の特定
      const listRoomWrap = item.find('.list_roomicon_wrap');
      const roomStr = listRoomWrap.find('.list_roomicon').text().trim();
      const timeText = listRoomWrap.contents().filter(function() {
        return this.nodeType === 3; 
      }).text().trim();

      // 所属店舗のIDを決定（記載がなければ仮で北千住）
      let targetShopId = SHOPS['不明'].id;
      if (roomStr.includes('北千住')) targetShopId = SHOPS['北千住'].id;
      if (roomStr.includes('南浦和')) targetShopId = SHOPS['南浦和'].id;

      let fullBio = '';
      if (age) fullBio += `年齢: ${age} `;
      if (cup) fullBio += `カップ: ${cup}\n`;
      if (roomStr) fullBio += `店舗: ${roomStr} `;
      if (timeText && !timeText.includes('---')) fullBio += `時間: ${timeText}`;

      newTherapists.push({
        id: `${targetShopId}_${finalNameId}`,
        shop_id: targetShopId,
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

    console.log(`✅ ${newTherapists.length} 名のセラピストデータを抽出・振り分けました。`);

    console.log(`🗑️ 古いセラピストデータをクリアしています...`);
    await supabase.from('therapists').delete().eq('shop_id', SHOPS['北千住'].id);
    await supabase.from('therapists').delete().eq('shop_id', SHOPS['南浦和'].id);

    console.log(`📦 新しいデータを登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    console.log(`\n🎉 登録完了！「むちすぱルーム」の北千住店と南浦和店にセラピストが登録されました。`);
    console.log('現在Viteが動いているターミナルを再起動(Ctrl+C -> npm run dev)し、ブラウザでスーパーリロードしてご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
