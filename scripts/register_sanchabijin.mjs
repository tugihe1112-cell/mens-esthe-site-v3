import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://aroma-bijin.com';
const AREA_ID = 'tokyo_setagaya_sangenjaya'; 
const SHOP_ID = `${AREA_ID}_sanchabijin`; 
const GROUP_ID = 'g_sanchabijin'; 

// 画像から正確に書き起こした料金システム
const SYSTEM_DATA = [
  {
    courseName: '基本コース',
    description: '（※画像から読み取った料金です）',
    prices: [
      { time: '60min', price: '11,000円' },
      { time: '90min', price: '15,000円' },
      { time: '120min', price: '20,000円' },
      { time: '150min', price: '25,000円' },
      { time: '180min', price: '30,000円' }
    ]
  }
];

const HTML_CONTENT = `
<ul class="cast_box">
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=465">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/465/032500501225.jpeg" width="200" height="300" alt="並木そら" loading="lazy">
</p>
							<div class="txt_box">
								<p><img src="https://aroma-bijin.com/images/icon_new.png" alt="新人"></p>
								<p class="name">並木そら&nbsp;(25歳)&nbsp;&nbsp;<span class="size">T161
</span></p>
								<p class="time">超・ご予約満了✨&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=306">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/306/092912164611.jpeg" width="200" height="300" alt="大原れいこ" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">大原れいこ&nbsp;(24歳)&nbsp;&nbsp;<span class="size">T161
</span></p>
								<p class="time">18:45-20:45&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=326">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/326/040722100637.jpeg" width="200" height="300" alt="大原れいこ" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">大原れいこ&nbsp;(24歳)&nbsp;&nbsp;<span class="size">T161
</span></p>
								<p class="time">23:15-01:00&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=277">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/277/101321194947.jpeg" width="200" height="300" alt="東條れいら" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">東條れいら&nbsp;(22歳)&nbsp;&nbsp;<span class="size">T156
</span></p>
								<p class="time">お休み&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=443">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/443/050411545630.jpeg" width="200" height="300" alt="みつ" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">みつ&nbsp;(28歳)&nbsp;&nbsp;<span class="size">T165
</span></p>
								<p class="time">お休み&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=388">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/388/121121014111.jpeg" width="200" height="300" alt="相原こと" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">相原こと&nbsp;(25歳)&nbsp;&nbsp;<span class="size">T157
</span></p>
								<p class="time">お休み&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=215">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/215/121315164731.jpeg" width="200" height="300" alt="すず" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">すず&nbsp;(29歳)&nbsp;&nbsp;<span class="size">T162
</span></p>
								<p class="time">21:00-03:00&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=417">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/417/060621491448.jpeg" width="200" height="300" alt="ひより" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">ひより&nbsp;(29歳)&nbsp;&nbsp;<span class="size">T167
</span></p>
								<p class="time">お休み&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=454">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/454/053119295241.jpeg" width="200" height="300" alt="紫乃宮ゆり" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">紫乃宮ゆり&nbsp;(30歳)&nbsp;&nbsp;<span class="size">T159
</span></p>
								<p class="time">21:00-04:00&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=461">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/461/102301422952.jpeg" width="200" height="300" alt="小松 なな" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">小松 なな&nbsp;(22歳)&nbsp;&nbsp;<span class="size">T157
</span></p>
								<p class="time">お休み&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=101">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/101/061211191815.jpeg" width="200" height="300" alt="花咲" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">花咲&nbsp;(31歳)&nbsp;&nbsp;<span class="size">T160
</span></p>
								<p class="time">超・ご予約満了✨&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=434">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/434/080910573145.jpeg" width="200" height="300" alt="ろみ" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">ろみ&nbsp;(28歳)&nbsp;&nbsp;<span class="size">T157
</span></p>
								<p class="time">21:00-05:00&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=439">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/439/012415530087.jpeg" width="200" height="300" alt="ももか" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">ももか&nbsp;(28歳)&nbsp;&nbsp;<span class="size">T155
</span></p>
								<p class="time">お休み&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=395">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/395/031123371617.jpeg" width="200" height="300" alt="まな" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">まな&nbsp;(24歳)&nbsp;&nbsp;<span class="size">T160
</span></p>
								<p class="time">お休み&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=428">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/428/09022129407.jpeg" width="200" height="300" alt="雨宮ことは" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">雨宮ことは&nbsp;(28歳)&nbsp;&nbsp;<span class="size">T158
</span></p>
								<p class="time">お休み&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=422">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/422/020221150615.jpeg" width="200" height="300" alt="もえ" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">もえ&nbsp;(24歳)&nbsp;&nbsp;<span class="size">T150
</span></p>
								<p class="time">21:00-01:00&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=463">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/463/021819575697.jpeg" width="200" height="300" alt="夏乃ゆき" loading="lazy">
</p>
							<div class="txt_box">
								<p><img src="https://aroma-bijin.com/images/icon_new.png" alt="新人"></p>
								<p class="name">夏乃ゆき&nbsp;(30歳)&nbsp;&nbsp;<span class="size">T157
</span></p>
								<p class="time">14:00-18:00&nbsp;	出勤中
</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=462">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/462/110516143235.jpeg" width="200" height="300" alt="岩倉れいん" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">岩倉れいん&nbsp;(30歳)&nbsp;&nbsp;<span class="size">T162
</span></p>
								<p class="time">お休み&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=460">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/460/041403165018.jpeg" width="200" height="300" alt="ゆの" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">ゆの&nbsp;(24歳)&nbsp;&nbsp;<span class="size">T159
</span></p>
								<p class="time">お休み&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=386">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/386/01311617058.jpeg" width="200" height="300" alt="九瀬（ここのせ）ねね" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">九瀬（ここのせ）ねね&nbsp;(28歳)&nbsp;&nbsp;<span class="size">T157
</span></p>
								<p class="time">お休み&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=445">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/445/030417441243.jpeg" width="200" height="300" alt="リエ" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">リエ&nbsp;(28歳)&nbsp;&nbsp;<span class="size">T160
</span></p>
								<p class="time">お休み&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=450">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/450/120421033085.jpeg" width="200" height="300" alt="まどか" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">まどか&nbsp;(27歳)&nbsp;&nbsp;<span class="size">T160
</span></p>
								<p class="time">お休み&nbsp;</p>
							</div>
						</a>
					</li>
										<li class="link_act_01">
						<a href="https://aroma-bijin.com/profile.php?sid=441">
							<p class="img_box"><img src="https://aroma-bijin.com/images_staff/441/052714485016.jpeg" width="200" height="300" alt="結月翠" loading="lazy">
</p>
							<div class="txt_box">
								<p></p>
								<p class="name">結月翠&nbsp;(31歳)&nbsp;&nbsp;<span class="size">T168
</span></p>
								<p class="time">お休み&nbsp;</p>
							</div>
						</a>
					</li>
									</ul>
`;

async function main() {
  console.log('🚀 「三茶美人」の店舗とセラピスト登録を開始します...\n');

  try {
    console.log('🏪 店舗データを登録中...');
    
    const SHOP_DATA = {
      id: SHOP_ID,
      name: '三茶美人',
      area_id: AREA_ID, 
      group_id: GROUP_ID, 
      schedule_url: 'https://aroma-bijin.com/schedule_week.php',
      website_url: 'https://aroma-bijin.com/',
      business_hours: '営業時間要確認', 
      price_system: '60分 11,000円～',
      image_url: 'https://placehold.jp/9b59b6/ffffff/400x300.png?text=三茶美人',
      raw_data: {
        prefecture: '東京都',
        city: '世田谷区',
        area: '三軒茶屋',
        address: '東京都世田谷区三軒茶屋エリア',
        system: SYSTEM_DATA // 一切端折らない正確な料金システム
      }
    };

    const { error: upsertErr } = await supabase.from('shops').upsert(SHOP_DATA, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;
    console.log(`✅ 店舗情報（ID: ${SHOP_ID}）を登録しました。\n`);

    console.log(`⏳ HTMLからセラピストを抽出中...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.cast_box > li');

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; 

    items.each((_, el) => {
      const item = $(el);
      
      const rawNameText = item.find('.name').text().trim();
      if (!rawNameText) return;

      // 「並木そら (25歳)  T161」のような文字列から名前、年齢、身長を分解
      const cleanName = rawNameText.split('(')[0].trim().replace(/\s/g, ''); 
      const ageMatch = rawNameText.match(/\((\d+)歳\)/);
      const heightMatch = rawNameText.match(/T(\d+)/);

      const age = ageMatch ? `${ageMatch[1]}歳` : '';
      const height = heightMatch ? `${heightMatch[1]}cm` : '';

      // 同名回避処理
      let finalNameId = cleanName;
      if (seenNames[finalNameId]) {
        seenNames[finalNameId]++;
        finalNameId = `${finalNameId}_${seenNames[finalNameId]}`; 
      } else {
        seenNames[finalNameId] = 1;
      }
      
      // 画像URL
      let imageUrl = item.find('.img_box img').attr('src') || '';
      
      // 新人タグ
      const isNew = item.find('img[alt="新人"]').length > 0;
      const tags = [];
      if(isNew) tags.push('新人');

      // 出勤時間
      const timeText = item.find('.time').text().replace(/&nbsp;/g, '').trim();

      let fullBio = '';
      if (age) fullBio += `年齢: ${age} `;
      if (height) fullBio += `身長: ${height}\n`;
      if (timeText) fullBio += `本日の出勤: ${timeText}`;

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
          original_name: cleanName
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

    console.log(`\n🎉 登録完了！「三茶美人」に店舗と ${newTherapists.length}名のセラピストが登録されました。`);
    console.log('ブラウザの「三軒茶屋」エリアでスーパーリロードしてご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
