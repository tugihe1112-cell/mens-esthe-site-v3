import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://www.pepespa.com';
const GROUP_ID = 'g_pepespa';

// 全6店舗の設定
const SHOPS = {
  '蒲田': { // 本店として扱う
    id: 'tokyo_ota_kamata_pepe_spa',
    name: 'Pepe Spa (ペペスパ) 蒲田',
    area_id: 'tokyo_ota_kamata',
    raw_data_base: { prefecture: '東京都', city: '大田区', area: '蒲田' }
  },
  '下北沢': {
    id: 'tokyo_setagaya_shimokitazawa_pepe_spa',
    name: 'Pepe Spa (ペペスパ) 下北沢',
    area_id: 'tokyo_setagaya_shimokitazawa',
    raw_data_base: { prefecture: '東京都', city: '世田谷区', area: '下北沢' }
  },
  '八王子': {
    id: 'tokyo_hachioji_hachioji_pepe_spa',
    name: 'Pepe Spa (ペペスパ) 八王子',
    area_id: 'tokyo_hachioji_hachioji',
    raw_data_base: { prefecture: '東京都', city: '八王子市', area: '八王子' }
  },
  '調布': {
    id: 'tokyo_chofu_chofu_pepe_spa',
    name: 'Pepe Spa (ペペスパ) 調布',
    area_id: 'tokyo_chofu_chofu',
    raw_data_base: { prefecture: '東京都', city: '調布市', area: '調布' }
  },
  '町田': {
    id: 'tokyo_machida_machida_pepe_spa',
    name: 'Pepe Spa (ペペスパ) 町田',
    area_id: 'tokyo_machida_machida',
    raw_data_base: { prefecture: '東京都', city: '町田市', area: '町田' }
  },
  '藤沢': {
    id: 'kanagawa_fujisawa_pepe_spa',
    name: 'Pepe Spa (ペペスパ) 藤沢',
    area_id: 'kanagawa_fujisawa_pepe', 
    raw_data_base: { prefecture: '神奈川県', city: '藤沢市', area: '藤沢' }
  }
};

// 共通の店舗情報
const COMMON_SHOP_DATA = {
  group_id: GROUP_ID,
  schedule_url: 'https://www.pepespa.com/schedule/',
  website_url: 'https://www.pepespa.com/',
  business_hours: '営業時間要確認',
  price_system: '60分 12,000円～',
  image_url: 'https://placehold.jp/e67e22/ffffff/400x300.png?text=Pepe+Spa'
};

// 料金システム
const SYSTEM_DATA = [
  {
    courseName: '基本コース',
    description: '画像から読み取った料金です',
    prices: [
      { time: '60min', price: '12,000円' },
      { time: '90min', price: '16,000円' },
      { time: '120min', price: '20,000円' },
      { time: '150min', price: '24,000円' }
    ]
  }
];

// HTMLデータ
const HTML_CONTENT = `
<ul class="list-staff">
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/6718/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6718.jpeg)" class="img-fluid" alt="琴　ことねさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/6718/">琴　ことね</a>
												<div class="p_profile">
	25歳	<span class="sizeC">T</span>.158<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/6726/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6726.jpeg)" class="img-fluid" alt="碧えくぼさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/6726/">碧えくぼ</a>
												<div class="p_profile">
	21歳	<span class="sizeC">T</span>.167<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/7089/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_7089.jpeg)" class="img-fluid" alt="天使　ひなさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/7089/">天使　ひな</a>
												<div class="p_profile">
	23歳	<span class="sizeC">T</span>.165<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/7298/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_7298.jpg)" class="img-fluid" alt="松井　みなさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/7298/">松井　みな</a>
												<div class="p_profile">
	27歳	<span class="sizeC">T</span>.154<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/7435/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_7435.jpeg)" class="img-fluid" alt="神楽あいりさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/7435/">神楽あいり</a>
												<div class="p_profile">
	23歳	<span class="sizeC">T</span>.160<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/7714/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_7714.jpeg)" class="img-fluid" alt="東雲しのさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/7714/">東雲しの</a>
												<div class="p_profile">
	23歳	<span class="sizeC">T</span>.166<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/7730/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_7730.jpeg)" class="img-fluid" alt="伏見　すみれさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/7730/">伏見　すみれ</a>
												<div class="p_profile">
	26歳	<span class="sizeC">T</span>.164<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/8213/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_8213.jpeg)" class="img-fluid" alt="響　ひかるさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/8213/">響　ひかる</a>
												<div class="p_profile">
	19歳	<span class="sizeC">T</span>.159<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/8281/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_8281.jpeg)" class="img-fluid" alt="麗日　そらさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/8281/">麗日　そら</a>
												<div class="p_profile">
	23歳	<span class="sizeC">T</span>.167<br>			<span class="sizeC">B</span>.83(C) 																</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/8293/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_8293.jpeg)" class="img-fluid" alt="由良　ゆらさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/8293/">由良　ゆら</a>
												<div class="p_profile">
	26歳	<span class="sizeC">T</span>.160<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/8595/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_8595.jpeg)" class="img-fluid" alt="佐藤しおさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/8595/">佐藤しお</a>
												<div class="p_profile">
	21歳	<span class="sizeC">T</span>.161<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/8631/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_8631.jpeg)" class="img-fluid" alt="限定割引12/24まで！！さんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/8631/">限定割引12/24まで！！</a>
												<div class="p_profile">
																					</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/8775/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_8775.jpeg)" class="img-fluid" alt="若月　あんなさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/8775/">若月　あんな</a>
												<div class="p_profile">
	24歳	<span class="sizeC">T</span>.158<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/8819/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_8819.jpeg)" class="img-fluid" alt="星川るなさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/8819/">星川るな</a>
												<div class="p_profile">
	25歳	<span class="sizeC">T</span>.162<br>			<span class="sizeC">B</span>.83(C) 																</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/8891/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_8891.jpeg)" class="img-fluid" alt="白雪　めるさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/8891/">白雪　める</a>
												<div class="p_profile">
	21歳	<span class="sizeC">T</span>.158<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/8903/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_8903.jpeg)" class="img-fluid" alt="最上あやさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/8903/">最上あや</a>
												<div class="p_profile">
	20歳	<span class="sizeC">T</span>.169<br>			<span class="sizeC">B</span>.84(D) 																</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9146/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9146.jpeg)" class="img-fluid" alt="大谷　かのんさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9146/">大谷　かのん</a>
												<div class="p_profile">
	25歳	<span class="sizeC">T</span>.155<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9237/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9237.jpeg)" class="img-fluid" alt="飛鳥あおいさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9237/">飛鳥あおい</a>
												<div class="p_profile">
	23歳	<span class="sizeC">T</span>.160<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9274/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9274.jpeg)" class="img-fluid" alt="青葉りんかさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9274/">青葉りんか</a>
												<div class="p_profile">
	24歳	<span class="sizeC">T</span>.160<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9285/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9285.jpeg)" class="img-fluid" alt="鎌田れいさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9285/">鎌田れい</a>
												<div class="p_profile">
	24歳	<span class="sizeC">T</span>.156<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9287/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9287.jpeg)" class="img-fluid" alt="川口みきさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9287/">川口みき</a>
												<div class="p_profile">
	25歳	<span class="sizeC">T</span>.160<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9288/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/asset/img/noimage.jpg)" class="img-fluid" alt="前田ゆいかさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9288/">前田ゆいか</a>
												<div class="p_profile">
	26歳	<span class="sizeC">T</span>.163<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9294/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9294.jpeg)" class="img-fluid" alt="七川こよみさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9294/">七川こよみ</a>
												<div class="p_profile">
	25歳	<span class="sizeC">T</span>.159<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9369/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9369.jpeg)" class="img-fluid" alt="糸師りのさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9369/">糸師りの</a>
												<div class="p_profile">
	26歳	<span class="sizeC">T</span>.162<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9402/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9402.jpeg)" class="img-fluid" alt="結城ゆあさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9402/">結城ゆあ</a>
												<div class="p_profile">
	26歳	<span class="sizeC">T</span>.160<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9412/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9412.jpeg)" class="img-fluid" alt="北川みさとさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9412/">北川みさと</a>
												<div class="p_profile">
	32歳	<span class="sizeC">T</span>.156<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9486/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9486.jpeg)" class="img-fluid" alt="平良れんさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9486/">平良れん</a>
												<div class="p_profile">
	30歳	<span class="sizeC">T</span>.149<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/10036/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_10036.jpeg)" class="img-fluid" alt="白川まりさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/10036/">白川まり</a>
												<div class="p_profile">
	24歳	<span class="sizeC">T</span>.150<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/10119/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_10119.jpeg)" class="img-fluid" alt="蒼井みくさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/10119/">蒼井みく</a>
												<div class="p_profile">
	27歳	<span class="sizeC">T</span>.160<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9282/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9282.jpeg)" class="img-fluid" alt="今月の早割フリー《12:00〜16:00》さんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9282/">今月の早割フリー《12:00〜16:00》</a>
												<div class="p_profile">
																					</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9284/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9284.jpeg)" class="img-fluid" alt="🔴今月のフリー限定割引🔴さんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9284/">🔴今月のフリー限定割引🔴</a>
												<div class="p_profile">
																					</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/8381/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_8381.jpeg)" class="img-fluid" alt="★Twitter・Bluesky情報★さんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/8381/">★Twitter・Bluesky情報★</a>
												<div class="p_profile">
																					</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/10117/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_10117.jpeg)" class="img-fluid" alt="月乃はなさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/10117/">月乃はな</a>
												<div class="p_profile">
	26歳	<span class="sizeC">T</span>.164<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9951/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9951.jpeg)" class="img-fluid" alt="七瀬るいさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9951/">七瀬るい</a>
												<div class="p_profile">
	24歳	<span class="sizeC">T</span>.149<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/6651/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6651.jpeg)" class="img-fluid" alt="宇宙　さきさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/6651/">宇宙　さき</a>
												<div class="p_profile">
	28歳	<span class="sizeC">T</span>.161<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/10139/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_10139.jpeg)" class="img-fluid" alt="香椎ののさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/10139/">香椎のの</a>
												<div class="p_profile">
	25歳	<span class="sizeC">T</span>.155 <br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/6704/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6704.jpeg)" class="img-fluid" alt="小鳥遊　ちえりさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/6704/">小鳥遊　ちえり</a>
												<div class="p_profile">
	22歳	<span class="sizeC">T</span>.155<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/10112/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_10112.jpeg)" class="img-fluid" alt="星宮さらさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/10112/">星宮さら</a>
												<div class="p_profile">
	25歳	<span class="sizeC">T</span>.155<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/10052/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_10052.jpeg)" class="img-fluid" alt="谷口はんなさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/10052/">谷口はんな</a>
												<div class="p_profile">
	27歳	<span class="sizeC">T</span>.157<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/10108/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_10108.jpeg)" class="img-fluid" alt="夢見のあさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/10108/">夢見のあ</a>
												<div class="p_profile">
	25歳	<span class="sizeC">T</span>.158<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9838/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9838.jpeg)" class="img-fluid" alt="夢咲　ことりさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9838/">夢咲　ことり</a>
												<div class="p_profile">
	24歳	<span class="sizeC">T</span>.151<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9155/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9155.jpeg)" class="img-fluid" alt="倉田ゆきさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9155/">倉田ゆき</a>
												<div class="p_profile">
	26歳	<span class="sizeC">T</span>.164<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9892/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9892.jpeg)" class="img-fluid" alt="本田いとさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9892/">本田いと</a>
												<div class="p_profile">
	26歳	<span class="sizeC">T</span>.160<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9558/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9558.jpeg)" class="img-fluid" alt="長谷川ゆみさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9558/">長谷川ゆみ</a>
												<div class="p_profile">
	27歳	<span class="sizeC">T</span>.158<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9387/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9387.jpeg)" class="img-fluid" alt="天谷　ちづるさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9387/">天谷　ちづる</a>
												<div class="p_profile">
	26歳	<span class="sizeC">T</span>.156<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9367/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9367.jpeg)" class="img-fluid" alt="谷崎　ふうかさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9367/">谷崎　ふうか</a>
												<div class="p_profile">
	24歳	<span class="sizeC">T</span>.154<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9310/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9310.jpeg)" class="img-fluid" alt="蓮見 ゆあさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9310/">蓮見 ゆあ</a>
												<div class="p_profile">
	25歳	<span class="sizeC">T</span>.160<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9342/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9342.jpeg)" class="img-fluid" alt="石森うかさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9342/">石森うか</a>
												<div class="p_profile">
	26歳	<span class="sizeC">T</span>.162<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/9276/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_9276.jpeg)" class="img-fluid" alt="白雪めるさんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/9276/">白雪める</a>
												<div class="p_profile">
	21歳	<span class="sizeC">T</span>.158<br>																			</div>
										</div>
									</div>
								</div>
							</li>
							<li class="col-6 col-md-3 col-sm-4">
								<div class="item">
									<div class="photo">
										<a href="/profile/_uid/8461/">
											<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_8461.jpeg)" class="img-fluid" alt="WEB予約さんの写真">
											</a>
										<div class="cinfo">
												<a href="/profile/_uid/8461/">WEB予約</a>
												<div class="p_profile">
																					</div>
										</div>
									</div>
								</div>
							</li>
						</ul>
`;

async function main() {
  console.log('🚀 「Pepe Spa (ペペスパ)」の全6店舗とセラピスト登録を開始します...\n');

  try {
    // 1. 店舗データの登録
    console.log('🏪 6店舗分の店舗データを登録中...');
    for (const shop of Object.values(SHOPS)) {
      const shopData = {
        ...COMMON_SHOP_DATA,
        id: shop.id,
        name: shop.name,
        area_id: shop.area_id,
        raw_data: {
          ...shop.raw_data_base,
          address: `${shop.raw_data_base.prefecture}${shop.raw_data_base.city}${shop.raw_data_base.area}エリア`,
          system: SYSTEM_DATA
        }
      };
      const { error: upsertErr } = await supabase.from('shops').upsert(shopData, { onConflict: 'id' });
      if (upsertErr) throw upsertErr;
    }
    console.log(`✅ 店舗情報を登録・更新しました。\n`);

    // 2. セラピストの抽出
    console.log(`⏳ HTMLからセラピストを抽出中（今回は全セラピストを本店：蒲田店に紐付けます）...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.list-staff li');

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; 

    items.each((_, el) => {
      const item = $(el);
      
      const nameText = item.find('.cinfo > a').text().trim();
      if (!nameText || nameText.includes('割引') || nameText.includes('予約') || nameText.includes('情報')) return; // キャンペーン枠などを除外

      let cleanName = nameText.replace(/\s+/g, ' '); // 途中の空白を整理
      
      // プロフィール情報の抽出
      const profileText = item.find('.p_profile').text().replace(/\n/g, '').replace(/\t/g, '').trim();
      const ageMatch = profileText.match(/(\d+)歳/);
      const age = ageMatch ? `${ageMatch[1]}歳` : '';

      const heightMatch = profileText.match(/T\.(\d+)/);
      const height = heightMatch ? `${heightMatch[1]}cm` : '';

      const bustMatch = profileText.match(/B\.(\d+)\(([A-Z]+)\)/);
      const bust = bustMatch ? `B${bustMatch[1]}(${bustMatch[2]})` : '';

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
      const styleAttr = item.find('.photo img').attr('style');
      if (styleAttr) {
          const urlMatch = styleAttr.match(/url\((.*?)\)/);
          if (urlMatch) {
              imageUrl = urlMatch[1].replace(/['"]/g, '');
              if (imageUrl && !imageUrl.startsWith('http')) {
                  imageUrl = `${BASE_URL}${imageUrl}`;
              }
          }
      }

      let fullBio = '';
      if (age) fullBio += `年齢: ${age} `;
      if (height) fullBio += `身長: ${height} `;
      if (bust) fullBio += `バスト: ${bust}`;

      newTherapists.push({
        id: `${SHOPS['蒲田'].id}_${finalNameId}`,
        shop_id: SHOPS['蒲田'].id, // いったん全員を本店に紐付け
        name: cleanName, 
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: {
          tags: [], // このサイトでは一覧に新人などのタグが見当たらないため空
          bio: fullBio.trim(),
          original_name: nameText
        }
      });
    });

    console.log(`✅ ${newTherapists.length} 名のセラピストデータを抽出しました。`);

    console.log(`🗑️ 古いセラピストデータをクリアしています...`);
    for (const shop of Object.values(SHOPS)) {
      await supabase.from('therapists').delete().eq('shop_id', shop.id);
    }

    console.log(`📦 新しいデータを登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    console.log(`\n🎉 登録完了！「Pepe Spa」の全6店舗の枠と、セラピスト（本店：蒲田店に配置）が登録されました。`);
    console.log('ブラウザの「蒲田」エリアでスーパーリロードしてご確認ください！');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
