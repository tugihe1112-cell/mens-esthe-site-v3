import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://www.every-thing.jp';
const SHOP_ID = 'tokyo_meguro_meguro_everything';
const GROUP_ID = 'g_everything';

// ユーザーから提供されたHTMLデータ
const HTML_CONTENT = `
<section class="panel">
					<div class="panel-heading">
						<h3 class="panel-title">
							<span>Therapist</span>
							<small>セラピストのご紹介</small>
						</h3>
					</div>
					<div class="panel-body" data-sr-id="1" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 1s cubic-bezier(0.5, 0, 0, 1) 0.3s, transform 1s cubic-bezier(0.5, 0, 0, 1) 0.3s;">
						<ul class="list-staff">
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/10470/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_10470.jpg?10)" class="img-fluid" alt="水沢 ゆきさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/10470/">水沢 ゆき</a>
												<div class="p_profile">
	28歳	<span class="sizeC">T</span>.151<br>			<span class="sizeC">B</span>.84(D) 		<span class="sizeC">W</span>.58 		<span class="sizeC">H</span>.85												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/10425/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_10425.jpg?10)" class="img-fluid" alt="速水 みれいさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/10425/">速水 みれい</a>
												<div class="p_profile">
	28歳	<span class="sizeC">T</span>.167<br>			<span class="sizeC">B</span>.89(E) 		<span class="sizeC">W</span>.58 		<span class="sizeC">H</span>.89												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/10503/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_10503.jpg?10)" class="img-fluid" alt="関口 みなみさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/10503/">関口 みなみ</a>
												<div class="p_profile">
	26歳	<span class="sizeC">T</span>.158<br>			<span class="sizeC">B</span>.86(D) 		<span class="sizeC">W</span>.60 		<span class="sizeC">H</span>.87												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9466/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9466.jpg?10)" class="img-fluid" alt="榎本 さやかさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9466/">榎本 さやか</a>
												<div class="p_profile">
	28歳	<span class="sizeC">T</span>.165<br>			<span class="sizeC">B</span>.90(E) 		<span class="sizeC">W</span>.60 		<span class="sizeC">H</span>.92												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/10324/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_10324.jpg?10)" class="img-fluid" alt="*井上 あかりさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/10324/">*井上 あかり</a>
												<div class="p_profile">
	39歳	<span class="sizeC">T</span>.158<br>			<span class="sizeC">B</span>.85(D) 		<span class="sizeC">W</span>.60 		<span class="sizeC">H</span>.87												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/10400/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_10400.JPG?10)" class="img-fluid" alt="福山 かなさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/10400/">福山 かな</a>
												<div class="p_profile">
	31歳	<span class="sizeC">T</span>.157<br>			<span class="sizeC">B</span>.87(C) 		<span class="sizeC">W</span>.59 		<span class="sizeC">H</span>.86												</div>
										</div>
									</div>
								</div>
							</li>
						</ul>
					</div>
				</section>
`;

async function main() {
  console.log('🚀 「Everything (エブリシング)」の店舗登録とセラピスト完全抽出を開始します...\n');

  try {
    // --- 1. 店舗データ作成 ---
    console.log('🏪 店舗データを作成中...');
    
    const SHOP_DATA = {
      id: SHOP_ID,
      name: 'Everything',
      area_id: 'tokyo_meguro_meguro',
      group_id: GROUP_ID,
      schedule_url: 'https://www.every-thing.jp/schedule/',
      website_url: 'https://www.every-thing.jp/',
      business_hours: '12:00〜05:00', // 仮置き（修正が必要であれば適宜変更してください）
      price_system: '90分 16,000円～', // 画像情報に基づく
      image_url: 'https://placehold.jp/3498db/ffffff/400x300.png?text=Everything', // 仮画像
      raw_data: {
        prefecture: '東京都',
        city: '目黒区',
        area: '目黒',
        address: '東京都目黒区目黒エリア',
        system: [
          {
            courseName: 'スタンダード(旧LUXURY)コース',
            description: '',
            prices: [
              { time: '90分', price: '16000円' },
              { time: '120分', price: '20000円' },
              { time: '150分', price: '24000円' }
            ]
          },
          {
             courseName: 'プレミアム・コース(新設)',
             description: '「セラピスト独自のトリートメント」となっています。\nトによっては「ご対応不可」となります。',
             prices: [
                 { time: '90分', price: '20000円' },
                 { time: '120分', price: '24000円' }
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
      
      const rawNameText = item.find('.cinfo > a').text().trim();
      if (!rawNameText) return;

      const cleanName = rawNameText.replace(/[\*\s　]/g, '');

      // 背景画像からURLを抽出
      const bgImageStyle = item.find('.photo img').attr('style') || '';
      let imageUrl = '';
      const bgMatch = bgImageStyle.match(/url\((.*?)\)/);
      if (bgMatch) {
          imageUrl = bgMatch[1].replace(/['"]/g, '');
          if(imageUrl && !imageUrl.startsWith('http')){
              imageUrl = `${BASE_URL}${imageUrl}`;
          }
      }
      
      const profileText = item.find('.p_profile').text().replace(/\s+/g, ' ').trim();
      
      let fullBio = profileText;

      newTherapists.push({
        id: `${SHOP_ID}_${cleanName}`,
        shop_id: SHOP_ID,
        name: cleanName,
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: {
          bio: fullBio,
          original_name: rawNameText
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

    console.log(`\n🎉 登録完了！「Everything（目黒エリア）」に店舗と ${newTherapists.length}名のセラピストが登録されました。`);

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
