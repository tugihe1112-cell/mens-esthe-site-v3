import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const locFile = path.resolve('src/data/locations.js');
const BASE_URL = 'http://bqins.jp';
const GROUP_ID = 'g_bqins';

// 3店舗の設定
const SHOPS = {
  '三軒茶屋': {
    id: 'tokyo_setagaya_sangenjaya_bqins',
    name: 'B-QINS (ビークインズ) 三軒茶屋',
    area_id: 'tokyo_setagaya_sangenjaya',
    raw_data_base: { prefecture: '東京都', city: '世田谷区', area: '三軒茶屋' }
  },
  '自由が丘': {
    id: 'tokyo_meguro_jiyugaoka_bqins',
    name: 'B-QINS (ビークインズ) 自由が丘',
    area_id: 'tokyo_meguro_jiyugaoka',
    raw_data_base: { prefecture: '東京都', city: '目黒区', area: '自由が丘' }
  },
  '中目黒': {
    id: 'tokyo_meguro_nakameguro_bqins',
    name: 'B-QINS (ビークインズ) 中目黒',
    area_id: 'tokyo_meguro_nakameguro',
    raw_data_base: { prefecture: '東京都', city: '目黒区', area: '中目黒' }
  }
};

const COMMON_SHOP_DATA = {
  group_id: GROUP_ID,
  schedule_url: 'http://bqins.jp/schedule/',
  website_url: 'http://bqins.jp/',
  business_hours: '10:30 ～ 翌5:00',
  price_system: '60分 12,000円～',
  image_url: 'https://placehold.jp/e74c3c/ffffff/400x300.png?text=B-QINS'
};

const SYSTEM_DATA = [
  {
    courseName: '基本コース',
    description: '画像から読み取った料金です',
    prices: [
      { time: '60min', price: '12,000円' },
      { time: '90min', price: '16,000円' },
      { time: '120min', price: '20,000円' },
      { time: '150min', price: '25,000円' }
    ]
  }
];

const HTML_CONTENT = `
<ul class="active tab_content t_store_1" data-tab_content="1">
												<li>
					<figure><img src="http://bqins.jp/data/staff/314/1.jpg?i=3856" alt="まほ"></figure>
					<a class="" href="http://bqins.jp/therapist/314/">
						<div class="detail">
							<span class="en name">まほ <small class="gothic age">(29)</small></span>
							<small class="t_size">T163B87(E)W58H86</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/325/1.jpg?i=3856" alt="のあ"></figure>
					<a class="" href="http://bqins.jp/therapist/325/">
						<div class="detail">
							<span class="en name">のあ <small class="gothic age">(25)</small></span>
							<small class="t_size">T153B85(D)W56H86</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/344/1.jpg?i=3856" alt="なつき"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/344/">
						<div class="detail">
							<span class="en name">なつき <small class="gothic age">(28)</small></span>
							<small class="t_size">T158B89(E)W57H88</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/184/1.jpg?i=3856" alt="かれん"></figure>
					<a class="" href="http://bqins.jp/therapist/184/">
						<div class="detail">
							<span class="en name">かれん <small class="gothic age">(29)</small></span>
							<small class="t_size">T160B87(E)W57H83</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/438/1.jpg?i=3856" alt="大型新人☆小春ねいろ"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/438/">
						<div class="detail">
							<span class="en name">大型新人☆小春ねいろ <small class="gothic age">(27)</small></span>
							<small class="t_size">T156B85(D)W56H87</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/310/1.jpg?i=3856" alt="並木"></figure>
					<a class="" href="http://bqins.jp/therapist/310/">
						<div class="detail">
							<span class="en name">並木 <small class="gothic age">(28)</small></span>
							<small class="t_size">T167B94(G)W58H87</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/364/1.jpg?i=3856" alt="ひめの"></figure>
					<a class="" href="http://bqins.jp/therapist/364/">
						<div class="detail">
							<span class="en name">ひめの <small class="gothic age">(28)</small></span>
							<small class="t_size">T157B85(D)W57H88</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/305/1.jpg?i=3856" alt="かのん"></figure>
					<a class="" href="http://bqins.jp/therapist/305/">
						<div class="detail">
							<span class="en name">かのん <small class="gothic age">(27)</small></span>
							<small class="t_size">T163B85(C)W57H87</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/435/1.jpg?i=3856" alt="新人☆ゆあ"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/435/">
						<div class="detail">
							<span class="en name">新人☆ゆあ <small class="gothic age">(26)</small></span>
							<small class="t_size">T157B88(F)W59H88</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/235/1.jpg?i=3856" alt="リコ※割引対象外"></figure>
					<a class="" href="http://bqins.jp/therapist/235/">
						<div class="detail">
							<span class="en name">リコ※割引対象外 <small class="gothic age">(29)</small></span>
							<small class="t_size">T157B87(E)W57H88</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/229/1.jpg?i=3856" alt="あずさ※割引対象外"></figure>
					<a class="" href="http://bqins.jp/therapist/229/">
						<div class="detail">
							<span class="en name">あずさ※割引対象外 <small class="gothic age">(29)</small></span>
							<small class="t_size">T155B90(G)W56H88</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/428/1.jpg?i=3856" alt="新人☆ゆうな"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/428/">
						<div class="detail">
							<span class="en name">新人☆ゆうな <small class="gothic age">(28)</small></span>
							<small class="t_size">T164B95(G)W58H90</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/128/1.jpg?i=3856" alt="藤井　菜々香　割引対象外"></figure>
					<a class="" href="http://bqins.jp/therapist/128/">
						<div class="detail">
							<span class="en name">藤井　菜々香　割引対象外 <small class="gothic age">(33)</small></span>
							<small class="t_size">T165B85(D)W58H84</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/382/1.jpg?i=3856" alt="えれな"></figure>
					<a class="" href="http://bqins.jp/therapist/382/">
						<div class="detail">
							<span class="en name">えれな <small class="gothic age">(24)</small></span>
							<small class="t_size">T160B85(C)W56H87</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/431/1.jpg?i=3856" alt="あみ"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/431/">
						<div class="detail">
							<span class="en name">あみ <small class="gothic age">(23)</small></span>
							<small class="t_size">T147B86(B)W55H83</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/88/1.jpg?i=3856" alt="ちづる"></figure>
					<a class="" href="http://bqins.jp/therapist/88/">
						<div class="detail">
							<span class="en name">ちづる <small class="gothic age">(36)</small></span>
							<small class="t_size">T170B90(F)W57H88</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/370/1.jpg?i=3856" alt="さな"></figure>
					<a class="" href="http://bqins.jp/therapist/370/">
						<div class="detail">
							<span class="en name">さな <small class="gothic age">(35)</small></span>
							<small class="t_size">T160B88(E)W57H86</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/378/1.jpg?i=3856" alt="柊"></figure>
					<a class="" href="http://bqins.jp/therapist/378/">
						<div class="detail">
							<span class="en name">柊 <small class="gothic age">(29)</small></span>
							<small class="t_size">T160B85(D)W56H88</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/439/1.jpg?i=3856" alt="スタート割‼️最大5000円OFF🔥"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/439/">
						<div class="detail">
							<span class="en name">スタート割‼️最大5000円OFF🔥</span>
													</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/261/1.jpg?i=3856" alt="さやか"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/261/">
						<div class="detail">
							<span class="en name">さやか <small class="gothic age">(28)</small></span>
							<small class="t_size">T161B88(D)W56H89</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/assets/img/common/therapist_default.jpg" alt="新人☆はづき"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/440/">
						<div class="detail">
							<span class="en name">新人☆はづき <small class="gothic age">(36)</small></span>
							<small class="t_size">T161B95(G)W58H91</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/416/1.jpg?i=3856" alt="神楽"></figure>
					<a class="" href="http://bqins.jp/therapist/416/">
						<div class="detail">
							<span class="en name">神楽 <small class="gothic age">(27)</small></span>
							<small class="t_size">T156B90(G)W60H90</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/255/1.jpg?i=3856" alt="響"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/255/">
						<div class="detail">
							<span class="en name">響 <small class="gothic age">(31)</small></span>
							<small class="t_size">T160B90(F)W57H86</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/412/1.jpg?i=3856" alt="新人☆みみ"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/412/">
						<div class="detail">
							<span class="en name">新人☆みみ <small class="gothic age">(22)</small></span>
							<small class="t_size">T158B85(E)W57H86</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/432/1.jpg?i=3856" alt="新人☆にこ"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/432/">
						<div class="detail">
							<span class="en name">新人☆にこ <small class="gothic age">(24)</small></span>
							<small class="t_size">T162B87(E)W57H86</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/271/1.jpg?i=3856" alt="ひなの"></figure>
					<a class="" href="http://bqins.jp/therapist/271/">
						<div class="detail">
							<span class="en name">ひなの <small class="gothic age">(26)</small></span>
							<small class="t_size">T154B94(H)W58H89</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/200/1.jpg?i=3856" alt="ネネ"></figure>
					<a class="" href="http://bqins.jp/therapist/200/">
						<div class="detail">
							<span class="en name">ネネ <small class="gothic age">(25)</small></span>
							<small class="t_size">T154B90(F)W56H86</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/414/1.jpg?i=3856" alt="新人☆るな"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/414/">
						<div class="detail">
							<span class="en name">新人☆るな <small class="gothic age">(24)</small></span>
							<small class="t_size">T166B95(J)W58H87</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/419/1.jpg?i=3856" alt="新人☆みつき"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/419/">
						<div class="detail">
							<span class="en name">新人☆みつき <small class="gothic age">(23)</small></span>
							<small class="t_size">T163B89(E)W59H85</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/434/1.jpg?i=3856" alt="新人☆もえ"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/434/">
						<div class="detail">
							<span class="en name">新人☆もえ <small class="gothic age">(27)</small></span>
							<small class="t_size">T148B80(D)W56H70</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/379/1.jpg?i=3856" alt="ここ"></figure>
					<a class="" href="http://bqins.jp/therapist/379/">
						<div class="detail">
							<span class="en name">ここ <small class="gothic age">(22)</small></span>
							<small class="t_size">T163B86(D)W56H88</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/401/1.jpg?i=3856" alt="時間限定  🌟雨割🌟"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/401/">
						<div class="detail">
							<span class="en name">時間限定  🌟雨割🌟</span>
													</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/417/1.jpg?i=3856" alt="新人☆蘭"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/417/">
						<div class="detail">
							<span class="en name">新人☆蘭 <small class="gothic age">(25)</small></span>
							<small class="t_size">T170B85(C)W57H85</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/398/1.jpg?i=3856" alt="みこと"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/398/">
						<div class="detail">
							<span class="en name">みこと <small class="gothic age">(25)</small></span>
							<small class="t_size">T155B87(D)W56H86</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/433/1.jpg?i=3856" alt="🆕☀早朝営業☀"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/433/">
						<div class="detail">
							<span class="en name">🆕☀早朝営業☀</span>
													</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/202/1.jpg?i=3856" alt="レミ"></figure>
					<a class="" href="http://bqins.jp/therapist/202/">
						<div class="detail">
							<span class="en name">レミ <small class="gothic age">(27)</small></span>
							<small class="t_size">T170B85(D)W56H87</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/411/1.jpg?i=3856" alt="新人☆ひまり"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/411/">
						<div class="detail">
							<span class="en name">新人☆ひまり <small class="gothic age">(25)</small></span>
							<small class="t_size">T163B85(D)W57H87</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/425/1.jpg?i=3856" alt="新人☆さつき"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/425/">
						<div class="detail">
							<span class="en name">新人☆さつき <small class="gothic age">(26)</small></span>
							<small class="t_size">T160B83(C)W59H90</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/415/1.jpg?i=3856" alt="新人☆ゆな"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/415/">
						<div class="detail">
							<span class="en name">新人☆ゆな <small class="gothic age">(25)</small></span>
							<small class="t_size">T157B88(D)W55H86</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/48/1.jpg?i=3856" alt="京香※割引対象外"></figure>
					<a class="" href="http://bqins.jp/therapist/48/">
						<div class="detail">
							<span class="en name">京香※割引対象外 <small class="gothic age">(29)</small></span>
							<small class="t_size">T157B87(D)W56H87</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/236/1.jpg?i=3856" alt="エナ　割引対象外"></figure>
					<a class="" href="http://bqins.jp/therapist/236/">
						<div class="detail">
							<span class="en name">エナ　割引対象外 <small class="gothic age">(28)</small></span>
							<small class="t_size">T169B88(E)W56H84</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/347/1.jpg?i=3856" alt="まりあ"></figure>
					<a class="" href="http://bqins.jp/therapist/347/">
						<div class="detail">
							<span class="en name">まりあ <small class="gothic age">(26)</small></span>
							<small class="t_size">T157B88(C)W58H86</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/421/1.jpg?i=3856" alt="新人☆詩織"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/421/">
						<div class="detail">
							<span class="en name">新人☆詩織 <small class="gothic age">(27)</small></span>
							<small class="t_size">T163B83(C)W60H85</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/47/1.jpg?i=3856" alt="瞳"></figure>
					<a class="" href="http://bqins.jp/therapist/47/">
						<div class="detail">
							<span class="en name">瞳 <small class="gothic age">(32)</small></span>
							<small class="t_size">T158B87(D)W57H89</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/309/1.jpg?i=3856" alt="★スーパータイムセール発生中★"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/309/">
						<div class="detail">
							<span class="en name">★スーパータイムセール発生中★</span>
							<small class="t_size">(J)</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/377/1.jpg?i=3856" alt="ゆずは"></figure>
					<a class="" href="http://bqins.jp/therapist/377/">
						<div class="detail">
							<span class="en name">ゆずは <small class="gothic age">(29)</small></span>
							<small class="t_size">T160B84(C)W57H87</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/230/1.jpg?i=3856" alt="りん"></figure>
					<a class="" href="http://bqins.jp/therapist/230/">
						<div class="detail">
							<span class="en name">りん <small class="gothic age">(28)</small></span>
							<small class="t_size">T160B85(C)W56H87</small>						</div>
					</a>
				</li>
												<li>
					<figure><img src="http://bqins.jp/data/staff/404/1.jpg?i=3856" alt="れん"></figure>
					<a class="new_therapist" href="http://bqins.jp/therapist/404/">
						<div class="detail">
							<span class="en name">れん <small class="gothic age">(23)</small></span>
							<small class="t_size">T154B86(E)W58H89</small>						</div>
					</a>
				</li>
					</ul>
`;

async function main() {
  console.log('🚀 「B-QINS (ビークインズ)」のエリア更新と登録を開始します...\n');

  try {
    // ==========================================
    // 1. locations.js の修正（目黒区、自由が丘、中目黒を追加）
    // ==========================================
    console.log('⏳ locations.js を修正中...');
    let locData = fs.readFileSync(locFile, 'utf8');

    // 「東京都」配列に目黒区がなければ追加
    const tokyoRegex = /"東京都":\s*\[(.*?)\]/;
    const tokyoMatch = locData.match(tokyoRegex);
    if (tokyoMatch && !tokyoMatch[1].includes('"目黒区"')) {
      locData = locData.replace(tokyoRegex, `"東京都": [$1, "目黒区"]`);
    }

    // 目黒区のマッピングがなければ追加
    if (!locData.includes('"目黒区":')) {
      const setagayaRegex = /("世田谷区":\s*\[.*?\]\,?)/;
      if (setagayaRegex.test(locData)) {
        locData = locData.replace(setagayaRegex, `$1\n  "目黒区": ["中目黒", "自由が丘"],`);
      } else {
        const areasEndRegex = /\};\s*export/m;
        locData = locData.replace(areasEndRegex, `  "目黒区": ["中目黒", "自由が丘"],\n};\nexport`);
      }
      fs.writeFileSync(locFile, locData);
      console.log('✅ locations.js に「目黒区（中目黒, 自由が丘）」を追加しました。');
    } else {
      console.log('⚠️ locations.js に「目黒区」はすでに存在します。');
    }


    // ==========================================
    // 2. 店舗データの登録（3店舗一括）
    // ==========================================
    console.log('\n🏪 3店舗分の店舗データを登録中...');
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


    // ==========================================
    // 3. セラピストの抽出と登録
    // ==========================================
    console.log(`⏳ HTMLからセラピストを抽出中（全員を代表して三軒茶屋店に紐付けます）...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.tab_content > li');

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; 

    items.each((_, el) => {
      const item = $(el);
      
      // 不要な子要素(small等)を削除して純粋な名前だけ取得
      const rawNameHTML = item.find('.name').clone();
      rawNameHTML.find('small').remove();
      const rawName = rawNameHTML.text().trim();

      // キャンペーン枠（割引、営業、タイムセールなど）は除外
      if (!rawName || rawName.includes('割') || rawName.includes('営業') || rawName.includes('セール')) {
        return; 
      }

      // 「新人☆」などの不要なプレフィックスを取り除く
      const cleanName = rawName.replace(/^.*☆/, '').replace(/※.*$/, '').trim();

      // 年齢の抽出
      const ageText = item.find('.age').text().replace(/[()]/g, '').trim();

      // サイズの抽出 (例: T163B87(E)W58H86)
      const sizeText = item.find('.t_size').text().trim();
      const heightMatch = sizeText.match(/T(\d+)/);
      const bustMatch = sizeText.match(/B(\d+)\(([A-Z]+)\)/) || sizeText.match(/B(\d+)/);
      const cupMatch = sizeText.match(/\(([A-Z]+)\)/);
      const waistMatch = sizeText.match(/W(\d+)/);
      const hipMatch = sizeText.match(/H(\d+)/);

      const height = heightMatch ? `${heightMatch[1]}cm` : '';
      const cup = cupMatch ? `${cupMatch[1]}カップ` : '';
      
      const sizes = [];
      if(bustMatch && bustMatch[1]) sizes.push(`B${bustMatch[1]}`);
      if(waistMatch) sizes.push(`W${waistMatch[1]}`);
      if(hipMatch) sizes.push(`H${hipMatch[1]}`);

      // 新人タグ
      const isNew = item.find('a.new_therapist').length > 0;
      const tags = [];
      if(isNew) tags.push('新人');

      // 同名回避
      let finalNameId = cleanName.replace(/\s/g, '_');
      if (seenNames[finalNameId]) {
        seenNames[finalNameId]++;
        finalNameId = `${finalNameId}_${seenNames[finalNameId]}`; 
      } else {
        seenNames[finalNameId] = 1;
      }
      
      // 画像URL
      let imageUrl = item.find('figure img').attr('src') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `${BASE_URL}${imageUrl}`;
      }

      // プロフィール文組み立て
      let fullBio = '';
      if (ageText) fullBio += `年齢: ${ageText}歳 `;
      if (height) fullBio += `身長: ${height}\n`;
      if (sizes.length > 0 || cup) {
        fullBio += `サイズ: ${sizes.join(' ')} ${cup ? `(${cup})` : ''}`;
      }

      newTherapists.push({
        id: `${SHOPS['三軒茶屋'].id}_${finalNameId}`,
        shop_id: SHOPS['三軒茶屋'].id, // いったん全員を代表店に
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

    console.log(`✅ ${newTherapists.length} 名のセラピストデータを抽出しました。（キャンペーン枠は自動除外）`);

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

    console.log(`\n🎉 登録完了！「B-QINS」の全3店舗とセラピストが登録されました。`);
    console.log('Viteサーバーを再起動（Ctrl+C -> npm run dev）し、ブラウザでスーパーリロードしてご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
