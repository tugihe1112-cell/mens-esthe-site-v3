import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://www.me-authority.com';
const AREA_ID = 'tokyo_setagaya_sangenjaya'; // 三軒茶屋エリア
const SHOP_ID = `${AREA_ID}_authority`; 
const GROUP_ID = 'g_authority'; 

// 料金システム（写真から）
const SYSTEM_DATA = [
  {
    courseName: '基本コース',
    description: '画像から読み取った料金です',
    prices: [
      { time: '70min', price: '17,000円' },
      { time: '90min', price: '21,000円' },
      { time: '120min', price: '25,000円' },
      { time: '150min', price: '30,000円' }
    ]
  }
];

const HTML_CONTENT = `
<ul class="tlist list-staff clearfix">
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="6" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/1169/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_1169.jpg)" class="img-responsive center-block" alt="早坂　みさきさんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/1169/">早坂　みさき</a><br><div>
	29歳	<span class="sizeC">T</span>.150 </div>
<div>
	<span class="sizeC">B</span>.85(E) 	<span class="sizeC">W</span>.57 	<span class="sizeC">H</span>.81</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="7" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/1167/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_1167.jpg)" class="img-responsive center-block" alt="足立　ゆいさんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/1167/">足立　ゆい</a><br><div>
	32歳	<span class="sizeC">T</span>.150 </div>
<div>
	<span class="sizeC">B</span>.87(F) 	<span class="sizeC">W</span>.56 	<span class="sizeC">H</span>.84</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="8" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/1254/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_1254.jpeg)" class="img-responsive center-block" alt="乙葉　ももかさんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/1254/">乙葉　ももか</a><br><div>
	29歳	<span class="sizeC">T</span>.162 </div>
<div>
	<span class="sizeC">B</span>.88(F) 	<span class="sizeC">W</span>.58 	<span class="sizeC">H</span>.87</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="9" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/1495/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_1495.jpeg)" class="img-responsive center-block" alt="神崎　ひなたさんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/1495/">神崎　ひなた</a><br><div>
	24歳	<span class="sizeC">T</span>.162 </div>
<div>
	<span class="sizeC">B</span>.84(D) 	<span class="sizeC">W</span>.52 	<span class="sizeC">H</span>.83</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="10" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/4743/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4743.jpeg)" class="img-responsive center-block" alt="大谷ましろさんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/4743/">大谷ましろ</a><br><div>
	27歳	<span class="sizeC">T</span>.161 </div>
<div>
	<span class="sizeC">B</span>.83(C) 	<span class="sizeC">W</span>.53 	<span class="sizeC">H</span>.84</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="11" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/3453/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3453.jpeg)" class="img-responsive center-block" alt="藤宮ゆづきさんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/3453/">藤宮ゆづき</a><br><div>
	29歳	<span class="sizeC">T</span>.158 </div>
<div>
	<span class="sizeC">B</span>.85(D) 	<span class="sizeC">W</span>.56 	<span class="sizeC">H</span>.89</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="12" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/2443/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2443.jpg)" class="img-responsive center-block" alt="水樹　すみれさんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/2443/">水樹　すみれ</a><br><div>
	26歳	<span class="sizeC">T</span>.160 </div>
<div>
	<span class="sizeC">B</span>.87(D) 	<span class="sizeC">W</span>.57 	<span class="sizeC">H</span>.85</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="13" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/1367/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_1367.jpg)" class="img-responsive center-block" alt="星野　りこさんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/1367/">星野　りこ</a><br><div>
	29歳	<span class="sizeC">T</span>.154 </div>
<div>
	<span class="sizeC">B</span>.92(G) 	<span class="sizeC">W</span>.54 	<span class="sizeC">H</span>.85</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="14" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/3933/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3933.jpeg)" class="img-responsive center-block" alt="間宮えまさんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/3933/">間宮えま</a><br><div>
	26歳	<span class="sizeC">T</span>.163 </div>
<div>
	<span class="sizeC">B</span>.89(F) 	<span class="sizeC">W</span>.58 	<span class="sizeC">H</span>.88</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="15" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/5029/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_5029.jpeg)" class="img-responsive center-block" alt="成瀬みゆう（体験入店割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/5029/">成瀬みゆう（体験入店割）</a><br><div>
	28歳	<span class="sizeC">T</span>.155 </div>
<div>
	<span class="sizeC">B</span>.83(C) 	<span class="sizeC">W</span>.52 	<span class="sizeC">H</span>.84</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="16" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/5127/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_5127.jpeg)" class="img-responsive center-block" alt="桃瀬さくらさんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/5127/">桃瀬さくら</a><br><div>
	24歳	<span class="sizeC">T</span>.154 </div>
<div>
	<span class="sizeC">B</span>.90(G) 	<span class="sizeC">W</span>.53 	<span class="sizeC">H</span>.87</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="17" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/5134/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_5134.jpeg)" class="img-responsive center-block" alt="天音ゆり（新人割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/5134/">天音ゆり（新人割）</a><br><div>
	30歳	<span class="sizeC">T</span>.159 </div>
<div>
	<span class="sizeC">B</span>.88(F) 	<span class="sizeC">W</span>.57 	<span class="sizeC">H</span>.86</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="18" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/5221/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_5221.jpeg)" class="img-responsive center-block" alt="桜めあり（ご新規様割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/5221/">桜めあり（ご新規様割）</a><br><div>
	23歳	<span class="sizeC">T</span>.163 </div>
<div>
	<span class="sizeC">B</span>.88(G) 	<span class="sizeC">W</span>.58 	<span class="sizeC">H</span>.87</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="19" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/5426/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_5426.jpeg)" class="img-responsive center-block" alt="山本ひより（ご新規様割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/5426/">山本ひより（ご新規様割）</a><br><div>
	27歳	<span class="sizeC">T</span>.153 </div>
<div>
	<span class="sizeC">B</span>.84(C) 	<span class="sizeC">W</span>.52 	<span class="sizeC">H</span>.83</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="20" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/5498/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_5498.jpeg)" class="img-responsive center-block" alt="綾瀬 ゆき（体験入店割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/5498/">綾瀬 ゆき（体験入店割）</a><br><div>
	27歳	<span class="sizeC">T</span>.156 </div>
<div>
	<span class="sizeC">B</span>.86(C) 	<span class="sizeC">W</span>.53 	<span class="sizeC">H</span>.87</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="21" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/5569/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_5569.jpeg)" class="img-responsive center-block" alt="加藤りり（ご新規様割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/5569/">加藤りり（ご新規様割）</a><br><div>
	29歳	<span class="sizeC">T</span>.165 </div>
<div>
	<span class="sizeC">B</span>.84(C) 	<span class="sizeC">W</span>.53 	<span class="sizeC">H</span>.83</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="22" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/5868/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_5868.jpeg)" class="img-responsive center-block" alt="有栖りんかさんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/5868/">有栖りんか</a><br><div>
	25歳	<span class="sizeC">T</span>.171 </div>
<div>
	<span class="sizeC">B</span>.91(F) 	<span class="sizeC">W</span>.64 	<span class="sizeC">H</span>.92</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="23" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/5896/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_5896.jpeg)" class="img-responsive center-block" alt="立花ゆずさんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/5896/">立花ゆず</a><br><div>
	26歳	<span class="sizeC">T</span>.165 </div>
<div>
	<span class="sizeC">B</span>.89(G) 	<span class="sizeC">W</span>.53 	<span class="sizeC">H</span>.87</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="24" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/6066/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6066.jpeg)" class="img-responsive center-block" alt="上杉れい（体験入店割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/6066/">上杉れい（体験入店割）</a><br><div>
	26歳	<span class="sizeC">T</span>.158 </div>
<div>
	<span class="sizeC">B</span>.85(C) 	<span class="sizeC">W</span>.53 	<span class="sizeC">H</span>.86</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="25" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/6155/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6155.jpeg)" class="img-responsive center-block" alt="城田なな（新人割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/6155/">城田なな（新人割）</a><br><div>
	26歳	<span class="sizeC">T</span>.154 </div>
<div>
	<span class="sizeC">B</span>.85(D) 	<span class="sizeC">W</span>.53 	<span class="sizeC">H</span>.87</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="26" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/6318/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6318.jpeg)" class="img-responsive center-block" alt="桜庭りお（新人割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/6318/">桜庭りお（新人割）</a><br><div>
	21歳	<span class="sizeC">T</span>.161 </div>
<div>
	<span class="sizeC">B</span>.84(D) 	<span class="sizeC">W</span>.52 	<span class="sizeC">H</span>.84</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="27" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/6412/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6412.jpeg)" class="img-responsive center-block" alt="高坂うい（体験入店割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/6412/">高坂うい（体験入店割）</a><br><div>
	22歳	<span class="sizeC">T</span>.157 </div>
<div>
	<span class="sizeC">B</span>.89(H) 	<span class="sizeC">W</span>.59 	<span class="sizeC">H</span>.88</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="28" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/6413/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6413.jpeg)" class="img-responsive center-block" alt="七海さな（新人割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/6413/">七海さな（新人割）</a><br><div>
	27歳	<span class="sizeC">T</span>.167 </div>
<div>
	<span class="sizeC">B</span>.84(E) 	<span class="sizeC">W</span>.54 	<span class="sizeC">H</span>.84</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="29" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/6433/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6433.jpeg)" class="img-responsive center-block" alt="月村よる（新人割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/6433/">月村よる（新人割）</a><br><div>
	26歳	<span class="sizeC">T</span>.165 </div>
<div>
	<span class="sizeC">B</span>.84(E) 	<span class="sizeC">W</span>.52 	<span class="sizeC">H</span>.84</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="30" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/6471/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6471.jpeg)" class="img-responsive center-block" alt="水瀬さあや（新人割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/6471/">水瀬さあや（新人割）</a><br><div>
	26歳	<span class="sizeC">T</span>.167 </div>
<div>
	<span class="sizeC">B</span>.86(E) 	<span class="sizeC">W</span>.53 	<span class="sizeC">H</span>.86</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="31" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/1830/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_1830.jpeg)" class="img-responsive center-block" alt="栗原こなつさんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/1830/">栗原こなつ</a><br><div>
	24歳	<span class="sizeC">T</span>.152 </div>
<div>
	<span class="sizeC">B</span>.84(D) 	<span class="sizeC">W</span>.53 	<span class="sizeC">H</span>.83</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="32" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/2766/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2766.jpeg)" class="img-responsive center-block" alt="瀧本　あや　さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/2766/">瀧本　あや　</a><br><div>
	28歳	<span class="sizeC">T</span>.166 </div>
<div>
	<span class="sizeC">B</span>.88(G) 	<span class="sizeC">W</span>.58 	<span class="sizeC">H</span>.89</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="33" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/4817/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4817.jpeg)" class="img-responsive center-block" alt="涼宮みこ（体験入店割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/4817/">涼宮みこ（体験入店割）</a><br><div>
	29歳	<span class="sizeC">T</span>.160 </div>
<div>
	<span class="sizeC">B</span>.88(G) 	<span class="sizeC">W</span>.58 	<span class="sizeC">H</span>.88</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="34" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/5101/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_5101.jpeg)" class="img-responsive center-block" alt="葉月のあ（ご新規様割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/5101/">葉月のあ（ご新規様割）</a><br><div>
	20歳	<span class="sizeC">T</span>.161 </div>
<div>
	<span class="sizeC">B</span>.85(D) 	<span class="sizeC">W</span>.55 	<span class="sizeC">H</span>.88</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="35" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/5198/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_5198.jpeg)" class="img-responsive center-block" alt="白華せいかさんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/5198/">白華せいか</a><br><div>
	23歳	<span class="sizeC">T</span>.162 </div>
<div>
	<span class="sizeC">B</span>.86(E) 	<span class="sizeC">W</span>.57 	<span class="sizeC">H</span>.88</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="36" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/6161/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6161.jpeg)" class="img-responsive center-block" alt="天野あむ（体験入店割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/6161/">天野あむ（体験入店割）</a><br><div>
	27歳	<span class="sizeC">T</span>.149 </div>
<div>
	<span class="sizeC">B</span>.83(C) 	<span class="sizeC">W</span>.52 	<span class="sizeC">H</span>.83</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="37" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/6190/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6190.jpeg)" class="img-responsive center-block" alt="白河ゆいな（新人割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/6190/">白河ゆいな（新人割）</a><br><div>
	24歳	<span class="sizeC">T</span>.154 </div>
<div>
	<span class="sizeC">B</span>.85(C) 	<span class="sizeC">W</span>.53 	<span class="sizeC">H</span>.87</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="38" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/6309/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6309.jpeg)" class="img-responsive center-block" alt="葉加瀬まい（新人割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/6309/">葉加瀬まい（新人割）</a><br><div>
	27歳	<span class="sizeC">T</span>.156 </div>
<div>
	<span class="sizeC">B</span>.85(E) 	<span class="sizeC">W</span>.57 	<span class="sizeC">H</span>.82</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="39" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/6340/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6340.jpeg)" class="img-responsive center-block" alt="愛沢かれん（ご新規様割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/6340/">愛沢かれん（ご新規様割）</a><br><div>
	27歳	<span class="sizeC">T</span>.165 </div>
<div>
	<span class="sizeC">B</span>.84(E) 	<span class="sizeC">W</span>.55 	<span class="sizeC">H</span>.83</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="40" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/6519/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6519.jpeg)" class="img-responsive center-block" alt="白雲あかり（体験入店割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/6519/">白雲あかり（体験入店割）</a><br><div>
	24歳	<span class="sizeC">T</span>.160 </div>
<div>
	<span class="sizeC">B</span>.84(D) 	<span class="sizeC">W</span>.52 	<span class="sizeC">H</span>.84</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="41" style="visibility: visible; opacity: 1; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); transition: all, opacity 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s, transform 0.5s cubic-bezier(0.5, 0, 0, 1) 0.4s;">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/6778/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6778.jpeg)" class="img-responsive center-block" alt="山根ゆうか（新人割）さんの写真">											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/6778/">山根ゆうか（新人割）</a><br><div>
	30歳	<span class="sizeC">T</span>.152 </div>
<div>
	<span class="sizeC">B</span>.86(E) 	<span class="sizeC">W</span>.58 	<span class="sizeC">H</span>.83</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="42" style="visibility: visible; opacity: 0; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 10, 0, 1);">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/6790/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_6790.jpeg)" class="img-responsive center-block" alt="望月かれんさんの写真"><div class="new">NEW</div>											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/6790/">望月かれん</a><br><div>
	30歳	<span class="sizeC">T</span>.159 </div>
<div>
	<span class="sizeC">B</span>.83(D) 	<span class="sizeC">W</span>.52 	<span class="sizeC">H</span>.83</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="43" style="visibility: visible; opacity: 0; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 10, 0, 1);">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/7015/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_7015.jpeg)" class="img-responsive center-block" alt="小泉ねね（体験入店割）さんの写真"><div class="new">NEW</div>											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/7015/">小泉ねね（体験入店割）</a><br><div>
	24歳	<span class="sizeC">T</span>.149 </div>
<div>
	<span class="sizeC">B</span>.85(E) 	<span class="sizeC">W</span>.56 	<span class="sizeC">H</span>.85</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="44" style="visibility: visible; opacity: 0; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 10, 0, 1);">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/7072/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_7072.jpeg)" class="img-responsive center-block" alt="一ノ瀬くるみ（体験入店割）さんの写真"><div class="new">NEW</div>											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/7072/">一ノ瀬くるみ（体験入店割）</a><br><div>
	29歳	<span class="sizeC">T</span>.155 </div>
<div>
	<span class="sizeC">B</span>.84(D) 	<span class="sizeC">W</span>.52 	<span class="sizeC">H</span>.83</div>
										</div></div>
									</div>
								</li>
								<li class="col-xs-6 col-sm-3 col-lg-3" data-sr-id="45" style="visibility: visible; opacity: 0; transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 10, 0, 1);">
									<div class="item">
										<div class="photo">
											<a href="/profile/_uid/7073/">
												<img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_7073.jpeg)" class="img-responsive center-block" alt="星川ゆめ（新人割）さんの写真"><div class="new">NEW</div>											</a>
										</div>
										<div class="info"> <div class="prof">
<a href="/profile/_uid/7073/">星川ゆめ（新人割）</a><br><div>
	21歳	<span class="sizeC">T</span>.148 </div>
<div>
	<span class="sizeC">B</span>.83(C) 	<span class="sizeC">W</span>.52 	<span class="sizeC">H</span>.83</div>
										</div></div>
									</div>
								</li>
							</ul>
`;

async function main() {
  console.log('🚀 「AUTHORITY (オーソリティ)」の店舗とセラピスト登録を開始します...\n');

  try {
    console.log('🏪 店舗データを登録中...');
    
    const SHOP_DATA = {
      id: SHOP_ID,
      name: 'AUTHORITY (オーソリティ)',
      area_id: AREA_ID, 
      group_id: GROUP_ID, 
      schedule_url: 'https://www.me-authority.com/schedule/',
      website_url: 'https://www.me-authority.com/',
      business_hours: '営業時間要確認', 
      price_system: '70分 17,000円～',
      image_url: 'https://placehold.jp/34495e/ffffff/400x300.png?text=AUTHORITY',
      raw_data: {
        prefecture: '東京都',
        city: '世田谷区',
        area: '三軒茶屋',
        address: '東京都世田谷区三軒茶屋エリア',
        system: SYSTEM_DATA // 料金システム
      }
    };

    const { error: upsertErr } = await supabase.from('shops').upsert(SHOP_DATA, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;
    console.log(`✅ 店舗情報（ID: ${SHOP_ID}）を登録しました。\n`);

    console.log(`⏳ HTMLからセラピストを抽出中...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.tlist > li');

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; 

    items.each((_, el) => {
      const item = $(el);
      
      const rawName = item.find('.prof > a').text().trim();
      if (!rawName) return;

      // 「（体験入店割）」などの表記を取り除いて名前をキレイにする
      const cleanName = rawName.replace(/（.*?）/g, '').trim();

      const profileText = item.find('.prof').text();
      
      // サイズ（年齢・身長・スリーサイズ）の抽出
      const ageMatch = profileText.match(/(\d+)歳/);
      const heightMatch = profileText.match(/T\.(\d+)/);
      const bustMatch = profileText.match(/B\.(\d+)\(([A-Z]+)\)/);
      const waistMatch = profileText.match(/W\.(\d+)/);
      const hipMatch = profileText.match(/H\.(\d+)/);

      const age = ageMatch ? `${ageMatch[1]}歳` : '';
      const height = heightMatch ? `${heightMatch[1]}cm` : '';
      const cup = bustMatch ? `${bustMatch[2]}カップ` : '';
      const sizes = [];
      if(bustMatch) sizes.push(`B${bustMatch[1]}`);
      if(waistMatch) sizes.push(`W${waistMatch[1]}`);
      if(hipMatch) sizes.push(`H${hipMatch[1]}`);

      // 同名回避処理
      let finalNameId = cleanName.replace(/\s/g, '_');
      if (seenNames[finalNameId]) {
        seenNames[finalNameId]++;
        finalNameId = `${finalNameId}_${seenNames[finalNameId]}`; 
      } else {
        seenNames[finalNameId] = 1;
      }
      
      let imageUrl = item.find('.photo img').attr('style') || '';
      const urlMatch = imageUrl.match(/url\((.*?)\)/);
      if (urlMatch) {
          imageUrl = urlMatch[1].replace(/['"]/g, '');
          if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = `${BASE_URL}${imageUrl}`;
          }
      }

      // 新人タグ
      const isNew = item.find('.new').length > 0;
      const tags = [];
      if(isNew) tags.push('新人');

      let fullBio = '';
      if (age) fullBio += `年齢: ${age} `;
      if (height) fullBio += `身長: ${height}\n`;
      if (sizes.length > 0 || cup) {
        fullBio += `サイズ: ${sizes.join(' ')} ${cup ? `(${cup})` : ''}`;
      }

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
          original_name: rawName
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

    console.log(`\n🎉 登録完了！「AUTHORITY (オーソリティ)」に店舗と ${newTherapists.length}名のセラピストが登録されました。`);
    console.log('ブラウザの「三軒茶屋」エリアでスーパーリロードしてご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
