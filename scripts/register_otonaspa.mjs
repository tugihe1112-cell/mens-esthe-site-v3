import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://otonaspa.pwchp.com';
const AREA_ID = 'tokyo_sumida_ryogoku'; // 両国エリア
const SHOP_ID = `${AREA_ID}_otonaspa_kutsurogi`; 

// ユーザーから提供されたHTMLデータ
const HTML_CONTENT = `
<ul class="thept_box">
				<li>
			<a href="https://otonaspa.pwchp.com/profile.php?sid=9350">
				<p class="img_box">
										<img src="https://pwchp.com/images_staff/198/9350/VVuELYnByNuYIQu.jpg" alt="三浦(みうら)">
									</p>
				<div>
					<p>
						三浦(みうら)&nbsp;(34)&nbsp;<img src="https://otonaspa.pwchp.com/images/icon_new.png" alt="新人">					</p>
					<p>T173&nbsp;B86(D)&nbsp;W58&nbsp;H88</p>
					<p></p>
				</div>
			</a>
		</li>
				<li>
			<a href="https://otonaspa.pwchp.com/profile.php?sid=7098">
				<p class="img_box">
										<img src="https://pwchp.com/images_staff/198/7098/CYVTHGX8QRInicT.jpg" alt="水嶋(みずしま)">
									</p>
				<div>
					<p>
						水嶋(みずしま)&nbsp;(48)&nbsp;<img src="https://otonaspa.pwchp.com/images/icon_new.png" alt="新人">					</p>
					<p>T160&nbsp;B85(C)&nbsp;W58&nbsp;H84</p>
					<p></p>
				</div>
			</a>
		</li>
				<li>
			<a href="https://otonaspa.pwchp.com/profile.php?sid=7083">
				<p class="img_box">
										<img src="https://pwchp.com/images_staff/198/7083/gStN2YG2wYgeU1b.jpg" alt="今田(いまだ)">
									</p>
				<div>
					<p>
						今田(いまだ)&nbsp;(28)&nbsp;					</p>
					<p>T153&nbsp;B83(C)&nbsp;W58&nbsp;H83</p>
					<p></p>
				</div>
			</a>
		</li>
				<li>
			<a href="https://otonaspa.pwchp.com/profile.php?sid=9275">
				<p class="img_box">
										<img src="https://pwchp.com/images_staff/198/9275/8YxTmQDiRFFsuEB.jpg" alt="藤咲(ふじさき)">
									</p>
				<div>
					<p>
						藤咲(ふじさき)&nbsp;(33)&nbsp;					</p>
					<p>T162&nbsp;B87(E)&nbsp;W58&nbsp;H88</p>
					<p></p>
				</div>
			</a>
		</li>
				<li>
			<a href="https://otonaspa.pwchp.com/profile.php?sid=9942">
				<p class="img_box">
										<img src="https://pwchp.com/images_staff/198/9942/3GYKeofgME1o6ZQ.jpg" alt="愛原(あいはら）">
									</p>
				<div>
					<p>
						愛原(あいはら）&nbsp;(32)&nbsp;					</p>
					<p>T156&nbsp;B86(E)&nbsp;W56&nbsp;H85</p>
					<p></p>
				</div>
			</a>
		</li>
				<li>
			<a href="https://otonaspa.pwchp.com/profile.php?sid=9533">
				<p class="img_box">
										<img src="https://pwchp.com/images_staff/198/9533/WOsICLwU8VFdm93.jpg" alt="菊池(きくち)">
									</p>
				<div>
					<p>
						菊池(きくち)&nbsp;(32)&nbsp;					</p>
					<p>T160&nbsp;B83(D)&nbsp;W58&nbsp;H84</p>
					<p></p>
				</div>
			</a>
		</li>
				<li>
			<a href="https://otonaspa.pwchp.com/profile.php?sid=9709">
				<p class="img_box">
										<img src="https://pwchp.com/images_staff/198/9709/qhzQEdblOpUXj2H.jpg" alt="出口(でぐち)">
									</p>
				<div>
					<p>
						出口(でぐち)&nbsp;(23)&nbsp;					</p>
					<p>T165&nbsp;B95(E)&nbsp;W56&nbsp;H87</p>
					<p></p>
				</div>
			</a>
		</li>
				<li>
			<a href="https://otonaspa.pwchp.com/profile.php?sid=9115">
				<p class="img_box">
										<img src="https://pwchp.com/images_staff/198/9115/cTlNDtNAXsSNVq3.jpg" alt="雪野(ゆきの)">
									</p>
				<div>
					<p>
						雪野(ゆきの)&nbsp;(27)&nbsp;					</p>
					<p>T159&nbsp;B88(E)&nbsp;W58&nbsp;H87</p>
					<p></p>
				</div>
			</a>
		</li>
				<li>
			<a href="https://otonaspa.pwchp.com/profile.php?sid=9457">
				<p class="img_box">
										<img src="https://pwchp.com/images_staff/198/9457/HBkuT0jTF5vmWd0.jpg" alt="北原(きたはら)">
									</p>
				<div>
					<p>
						北原(きたはら)&nbsp;(27)&nbsp;					</p>
					<p>T160&nbsp;B87(E)&nbsp;W58&nbsp;H85</p>
					<p></p>
				</div>
			</a>
		</li>
				<li>
			<a href="https://otonaspa.pwchp.com/profile.php?sid=7120">
				<p class="img_box">
										<img src="https://pwchp.com/images_staff/198/7120/pes046zL5AkCRvh.jpg" alt="壇（だん）">
									</p>
				<div>
					<p>
						壇（だん）&nbsp;(35)&nbsp;					</p>
					<p>T155&nbsp;B88(G)&nbsp;W59&nbsp;H88</p>
					<p></p>
				</div>
			</a>
		</li>
				<li>
			<a href="https://otonaspa.pwchp.com/profile.php?sid=9259">
				<p class="img_box">
										<img src="https://pwchp.com/images_staff/198/9259/A8RDWq4zo67RBee.jpg" alt="並木(なみき)">
									</p>
				<div>
					<p>
						並木(なみき)&nbsp;(35)&nbsp;					</p>
					<p>T160&nbsp;B85(D)&nbsp;W59&nbsp;H86</p>
					<p></p>
				</div>
			</a>
		</li>
				<li>
			<a href="https://otonaspa.pwchp.com/profile.php?sid=9660">
				<p class="img_box">
										<img src="https://pwchp.com/images_staff/198/9660/ZWg9jMoANDgIu2R.jpg" alt="野原(のはら)">
									</p>
				<div>
					<p>
						野原(のはら)&nbsp;(28)&nbsp;					</p>
					<p>T158&nbsp;B88(F)&nbsp;W60&nbsp;H88</p>
					<p></p>
				</div>
			</a>
		</li>
				<li>
			<a href="https://otonaspa.pwchp.com/profile.php?sid=7870">
				<p class="img_box">
										<img src="https://pwchp.com/images_staff/198/7870/9ZqDz0uL4rTIEFC.jpg" alt="結城(ゆうき)">
									</p>
				<div>
					<p>
						結城(ゆうき)&nbsp;(29)&nbsp;					</p>
					<p>T152&nbsp;B88(F)&nbsp;W58&nbsp;H86</p>
					<p></p>
				</div>
			</a>
		</li>
				<li>
			<a href="https://otonaspa.pwchp.com/profile.php?sid=8816">
				<p class="img_box">
										<img src="https://pwchp.com/images_staff/198/8816/4kSk3Sil1vA1trK.jpg" alt="橋本（はしもと）">
									</p>
				<div>
					<p>
						橋本（はしもと）&nbsp;(28)&nbsp;					</p>
					<p>T152&nbsp;B86(D)&nbsp;W59&nbsp;H86</p>
					<p></p>
				</div>
			</a>
		</li>
		
	</ul>
`;

async function main() {
  console.log('🚀 「大人スパ くつろぎ 両国」の店舗とセラピスト一括登録を開始します...\n');

  try {
    console.log('🏪 店舗データを登録中...');
    
    const SHOP_DATA = {
      id: SHOP_ID,
      name: '大人スパ くつろぎ 両国',
      area_id: AREA_ID, // tokyo_sumida_ryogoku
      group_id: null, // group_idは設定しない
      schedule_url: 'https://otonaspa.pwchp.com/schedule.php',
      website_url: 'https://otonaspa.pwchp.com/',
      business_hours: '営業時間要確認', 
      price_system: '60分 12,000円～', // 画像から反映
      image_url: 'https://placehold.jp/f39c12/ffffff/400x300.png?text=%E5%A4%A7%E4%BA%BA%E3%82%B9%E3%83%91+%E3%81%8F%E3%81%A4%E3%82%8D%E3%81%8E',
      raw_data: {
        prefecture: '東京都',
        city: '墨田区',
        area: '両国',
        address: '東京都墨田区両国エリア',
        system: [
          {
            courseName: '基本コース',
            description: '画像から読み取った料金です',
            prices: [
              { time: '60min', price: '12,000円' },
              { time: '90min', price: '14,000円' },
              { time: '120min', price: '18,000円' }
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
    const items = $('.thept_box > li'); // 抽出セレクタの調整

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; 

    items.each((_, el) => {
      const item = $(el);
      
      const pTags = item.find('div p');
      if (pTags.length < 2) return;

      // 名前の抽出 ("三浦(みうら) (34) [新人アイコン]" などの形式)
      let rawNameLine = $(pTags[0]).text().trim();
      const nameMatch = rawNameLine.match(/^([^\(\s]+)/); // カッコの前の文字列を抽出
      if (!nameMatch) return;
      
      let cleanName = nameMatch[1].trim();

      // 年齢の抽出
      const ageMatch = rawNameLine.match(/\((\d+)\)/);
      const age = ageMatch ? `${ageMatch[1]}歳` : '';

      // 同名回避
      let finalNameId = cleanName.replace(/\s/g, '_');
      if (seenNames[finalNameId]) {
        seenNames[finalNameId]++;
        finalNameId = `${finalNameId}_${seenNames[finalNameId]}`; 
      } else {
        seenNames[finalNameId] = 1;
      }
      
      // 画像URL
      let imageUrl = item.find('.img_box img').attr('src') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https://${imageUrl.replace(/^\/\//, '')}`; // //pwchp... 形式の対応
      }

      // サイズ情報
      const sizeText = $(pTags[1]).text().trim();
      
      let fullBio = '';
      if (age) fullBio += `年齢: ${age}\n`;
      if (sizeText) fullBio += `サイズ: ${sizeText}`;

      // 新人タグの判定（imgタグのalt属性から）
      const isNew = item.find('img[alt="新人"]').length > 0;
      const tags = [];
      if(isNew) tags.push('新人');

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
          original_name: rawNameLine
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

    console.log(`\n🎉 登録完了！「大人スパ くつろぎ 両国」に店舗と ${newTherapists.length}名のセラピストが登録されました。`);
    console.log('ブラウザの「両国」エリアでスーパーリロードしてご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
