import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://www.every-thing.jp';
const SHOP_ID = 'tokyo_meguro_meguro_everything';
const GROUP_ID = 'g_everything';

// ユーザーから提供された完全版HTMLデータ（22名分）
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
										<a href="/profile/_uid/3219/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3219.jpeg?10)" class="img-fluid" alt="猫みみさんの写真">
												<div class="new">NEW</div>
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/3219/">猫みみ</a>
												<div class="p_profile">
	27歳	<span class="sizeC">T</span>.155<br>			<span class="sizeC">B</span>.87(E) 		<span class="sizeC">W</span>.57 		<span class="sizeC">H</span>.86												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/2863/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2863.jpg?10)" class="img-fluid" alt="桜井もえさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/2863/">桜井もえ</a>
												<div class="p_profile">
	23歳	<span class="sizeC">T</span>.160<br>			<span class="sizeC">B</span>.99(G) 		<span class="sizeC">W</span>.58 		<span class="sizeC">H</span>.90												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/2914/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2914.jpg?10)" class="img-fluid" alt="月永るかさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/2914/">月永るか</a>
												<div class="p_profile">
	20歳	<span class="sizeC">T</span>.150<br>			<span class="sizeC">B</span>.84(D) 		<span class="sizeC">W</span>.57 		<span class="sizeC">H</span>.78												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/3140/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3140.jpg?10)" class="img-fluid" alt="神谷のあさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/3140/">神谷のあ</a>
												<div class="p_profile">
	28歳	<span class="sizeC">T</span>.164<br>			<span class="sizeC">B</span>.85(D) 		<span class="sizeC">W</span>.56 		<span class="sizeC">H</span>.86												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/3108/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3108.jpeg?10)" class="img-fluid" alt="浜辺そらさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/3108/">浜辺そら</a>
												<div class="p_profile">
	29歳	<span class="sizeC">T</span>.155<br>			<span class="sizeC">B</span>.85(D) 		<span class="sizeC">W</span>.56 		<span class="sizeC">H</span>.85												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/2923/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2923.jpg?10)" class="img-fluid" alt="美月さなさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/2923/">美月さな</a>
												<div class="p_profile">
	28歳	<span class="sizeC">T</span>.158<br>			<span class="sizeC">B</span>.84(F) 		<span class="sizeC">W</span>.63 		<span class="sizeC">H</span>.83												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/3206/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3206.jpeg?10)" class="img-fluid" alt="春野みこさんの写真">
												<div class="new">NEW</div>
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/3206/">春野みこ</a>
												<div class="p_profile">
	27歳	<span class="sizeC">T</span>.160<br>			<span class="sizeC">B</span>.86(D) 		<span class="sizeC">W</span>.57 		<span class="sizeC">H</span>.85												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/2898/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2898.jpg?10)" class="img-fluid" alt="藤宮玲奈さんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/2898/">藤宮玲奈</a>
												<div class="p_profile">
	28歳	<span class="sizeC">T</span>.156<br>			<span class="sizeC">B</span>.85(D) 		<span class="sizeC">W</span>.57 		<span class="sizeC">H</span>.80												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/2948/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2948.jpeg?10)" class="img-fluid" alt="佐倉ひよりさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/2948/">佐倉ひより</a>
												<div class="p_profile">
	22歳	<span class="sizeC">T</span>.155<br>			<span class="sizeC">B</span>.86(D) 		<span class="sizeC">W</span>.57 		<span class="sizeC">H</span>.86												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/2933/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2933.jpg?10)" class="img-fluid" alt="藤原彩乃さんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/2933/">藤原彩乃</a>
												<div class="p_profile">
	35歳	<span class="sizeC">T</span>.160<br>			<span class="sizeC">B</span>.87(E) 		<span class="sizeC">W</span>.57 		<span class="sizeC">H</span>.87												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/3089/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3089.jpg?10)" class="img-fluid" alt="日向ななさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/3089/">日向なな</a>
												<div class="p_profile">
	21歳	<span class="sizeC">T</span>.154<br>			<span class="sizeC">B</span>.86(D) 		<span class="sizeC">W</span>.57 		<span class="sizeC">H</span>.87												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/3193/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3193.jpeg?10)" class="img-fluid" alt="なかきたゆまさんの写真">
												<div class="new">NEW</div>
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/3193/">なかきたゆま</a>
												<div class="p_profile">
	26歳	<span class="sizeC">T</span>.155<br>			<span class="sizeC">B</span>.87(D) 		<span class="sizeC">W</span>.58 		<span class="sizeC">H</span>.85												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/3123/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3123.jpeg?10)" class="img-fluid" alt="柊みおさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/3123/">柊みお</a>
												<div class="p_profile">
	29歳	<span class="sizeC">T</span>.164<br>			<span class="sizeC">B</span>.86(F) 		<span class="sizeC">W</span>.55 		<span class="sizeC">H</span>.86												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/2834/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2834.jpg?10)" class="img-fluid" alt="三神レオさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/2834/">三神レオ</a>
												<div class="p_profile">
	27歳	<span class="sizeC">T</span>.163<br>			<span class="sizeC">B</span>.100(G) 		<span class="sizeC">W</span>.57 		<span class="sizeC">H</span>.88												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/3216/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3216.jpeg?10)" class="img-fluid" alt="星咲ゆきのさんの写真">
												<div class="new">NEW</div>
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/3216/">星咲ゆきの</a>
												<div class="p_profile">
	35歳	<span class="sizeC">T</span>.160<br>			<span class="sizeC">B</span>.87(E) 		<span class="sizeC">W</span>.57 		<span class="sizeC">H</span>.85												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/3210/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3210.jpeg?10)" class="img-fluid" alt="小川真央さんの写真">
												<div class="new">NEW</div>
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/3210/">小川真央</a>
												<div class="p_profile">
	22歳	<span class="sizeC">T</span>.163<br>			<span class="sizeC">B</span>.89(F) 		<span class="sizeC">W</span>.57 		<span class="sizeC">H</span>.87												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/3049/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3049.jpg?10)" class="img-fluid" alt="水瀬しおりさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/3049/">水瀬しおり</a>
												<div class="p_profile">
	27歳	<span class="sizeC">T</span>.169<br>			<span class="sizeC">B</span>.86(D) 		<span class="sizeC">W</span>.58 		<span class="sizeC">H</span>.88												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/3059/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3059.jpeg?10)" class="img-fluid" alt="長野ももさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/3059/">長野もも</a>
												<div class="p_profile">
	38歳	<span class="sizeC">T</span>.155<br>			<span class="sizeC">B</span>.99(H) 		<span class="sizeC">W</span>.59 		<span class="sizeC">H</span>.89												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/2956/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2956.jpg?10)" class="img-fluid" alt="彩咲このはさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/2956/">彩咲このは</a>
												<div class="p_profile">
	22歳	<span class="sizeC">T</span>.158<br>			<span class="sizeC">B</span>.88(F) 		<span class="sizeC">W</span>.58 		<span class="sizeC">H</span>.88												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/3092/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3092.jpg?10)" class="img-fluid" alt="結城うとさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/3092/">結城うと</a>
												<div class="p_profile">
	22歳	<span class="sizeC">T</span>.170<br>			<span class="sizeC">B</span>.86(E) 		<span class="sizeC">W</span>.57 		<span class="sizeC">H</span>.85												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/3157/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3157.jpg?10)" class="img-fluid" alt="森永あおいさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/3157/">森永あおい</a>
												<div class="p_profile">
	33歳	<span class="sizeC">T</span>.165<br>			<span class="sizeC">B</span>.95(H) 		<span class="sizeC">W</span>.58 		<span class="sizeC">H</span>.88												</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/2761/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2761.jpg?10)" class="img-fluid" alt="愛音うたさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/2761/">愛音うた</a>
												<div class="p_profile">
	21歳	<span class="sizeC">T</span>.162<br>			<span class="sizeC">B</span>.90(H) 		<span class="sizeC">W</span>.56 		<span class="sizeC">H</span>.88												</div>
										</div>
									</div>
								</div>
							</li>
						</ul>
					</div>
				</section>
`;

async function main() {
  console.log('🚀 「Everything (エブリシング)」の店舗登録とセラピスト完全抽出（22名版）を開始します...\n');

  try {
    // --- 1. 店舗データ作成 ---
    console.log('🏪 店舗データを作成中...');
    
    const SHOP_DATA = {
      id: SHOP_ID,
      name: 'Everything',
      area_id: 'tokyo_meguro_meguro', // 仮で目黒エリア
      group_id: GROUP_ID, // ★複数店舗展開時のクチコミ吸収用
      schedule_url: 'https://www.every-thing.jp/schedule/',
      website_url: 'https://www.every-thing.jp/',
      business_hours: '12:00〜05:00', // 仮置き
      price_system: '90分 16,000円～', // 画像情報に基づく
      image_url: 'https://placehold.jp/3498db/ffffff/400x300.png?text=Everything', // 仮画像
      raw_data: {
        prefecture: '東京都',
        city: '目黒区',
        area: '目黒',
        address: '東京都目黒区目黒エリア', // スクリーニング必須情報
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
      const bgMatch = bgImageStyle.match(/url\(['"]?(.*?)['"]?\)/);
      if (bgMatch) {
          imageUrl = bgMatch[1];
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

    console.log(`\n🎉 登録完了！「Everything（目黒エリア）」に店舗と ${newTherapists.length}名のセラピストが完全に登録されました。`);

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
