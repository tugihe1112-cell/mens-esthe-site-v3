import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const locFile = path.resolve('src/data/locations.js');
const AREA_ID = 'tokyo_nakano_nakano'; // 中野区・中野
const SHOP_ID = `${AREA_ID}_red_ribbon`; 
const GROUP_ID = 'g_red_ribbon';

// --------------------------------------------------
// 料金システム (画像から一字一句正確に抽出)
// --------------------------------------------------
const SYSTEM_DATA = [
  {
    courseName: 'SILVER COURSE (シルバーコース)',
    description: '',
    prices: [
      { time: '60分', price: '14,000円' },
      { time: '90分', price: '18,000円' },
      { time: '120分', price: '24,000円' },
      { time: '150分', price: '30,000円' }
    ]
  },
  {
    courseName: 'GOLD COURSE (ゴールドコース)',
    description: '',
    prices: [
      { time: '60分', price: '16,000円' },
      { time: '90分', price: '20,000円' },
      { time: '120分', price: '26,000円' },
      { time: '150分', price: '32,000円' }
    ]
  },
  {
    courseName: 'PLATINUM COURSE (プラチナコース)',
    description: '',
    prices: [
      { time: '60分', price: '19,000円' },
      { time: '90分', price: '23,000円' },
      { time: '120分', price: '29,000円' },
      { time: '150分', price: '35,000円' }
    ]
  }
];

const HTML_CONTENT = `
<ul class="row row-sm therapist-datas mg-bottom inview">
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 398px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/51267"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1769496910_4846407.jpg" width="300" height="400" alt="NAMEKOちゃん(DlAMOND)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">なめこちゃん</div>
						<a href="/therapist/51267" class="therapist-datas-name text-gothic">NAMEKOちゃん(DlAMOND)</a>
						<div class="therapist-datas-bio text-gothic">緑色になっておでこから変な触覚はえてきたよ😢うぇ～ん😭</div>
						<div class="therapist-datas-spec">
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 398px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55437"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885014_6368509.jpg" width="300" height="400" alt="ももえ💎(DlAMOND)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ももえ</div>
						<a href="/therapist/55437" class="therapist-datas-name text-gothic">ももえ💎(DlAMOND)</a>
						<div class="therapist-datas-bio text-gothic">天使にご縁をくださるお兄様には感謝感謝です🙏💗 いつも本当にありがとうございます✨ 心からリラックスできる癒しの時間を一緒に過ごしましょう♡</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">156㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 398px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55438"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773687415_4479758.jpg" width="300" height="400" alt="めあ💎(DlAMOND)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">めあ</div>
						<a href="/therapist/55438" class="therapist-datas-name text-gothic">めあ💎(DlAMOND)</a>
						<div class="therapist-datas-bio text-gothic">一緒に楽しい時間を過ごしましょうね💓🎶 笑顔と癒しをたっぷり届けます✨ お話ししたりのんびりしたり…特別なひとときを一緒に感じてくれたら嬉しいです☺️</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">21歳</span>
							<span class="mg-right-xs">160㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 398px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55439"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885029_2382584.jpg" width="300" height="400" alt="くるみ(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">くるみ</div>
						<a href="/therapist/55439" class="therapist-datas-name text-gothic">くるみ(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">お客様がリラックスしてホッとした表情になる瞬間がとても嬉しいです♡ 癒しのひとときを一緒に過ごしましょう🌸 心を込めてお迎えしますので ぜひ会いに来てくださいね💖</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">160㎝</span>
							(G)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55451"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885035_2708545.jpg" width="300" height="400" alt="いちか(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">いちか</div>
						<a href="/therapist/55451" class="therapist-datas-name text-gothic">いちか(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">心と身体を癒せるように精一杯頑張ります❣️ そっとほっとできる時間を一緒に作りたいです♡ お気軽に会いに来てくださいね🥰</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">155㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55442"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885060_8702278.jpg" width="300" height="400" alt="なお(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">なお</div>
						<a href="/therapist/55442" class="therapist-datas-name text-gothic">なお(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">お客様が少しずつ笑顔になっていくのを見ると、自然にこっちも笑顔になっちゃいます♡ ゆったりほっとできる時間を過ごしに来てください♪ 待ってます〜✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">165㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55452"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885041_1414726.jpg" width="300" height="400" alt="しい(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">しい</div>
						<a href="/therapist/55452" class="therapist-datas-name text-gothic">しい(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">はじめまして、しいです🌷 癒しの時間を一緒に過ごせたら嬉しいです♪ あなたの疲れをじっくりほぐせたら嬉しいな♡ 会えるのを楽しみにしています✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">162㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55441"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885054_0419041.jpg" width="300" height="400" alt="ひか(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ひか</div>
						<a href="/therapist/55441" class="therapist-datas-name text-gothic">ひか(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">お客様の笑顔に変わっていく瞬間を見るのが、私にとって一番の癒しです♡ 心地よいひとときをお届けできるように頑張ります♪ ぜひ会いに来てくださいね✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">25歳</span>
							<span class="mg-right-xs">157㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55447"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885108_1501864.jpg" width="300" height="400" alt="つゆり(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">つゆり</div>
						<a href="/therapist/55447" class="therapist-datas-name text-gothic">つゆり(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">お客様の表情がだんだん 優しく笑顔に変わっていくのをみることに いつも喜びを感じています♡  ぜひ私の施術を受けに来てください♪</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">151㎝</span>
							(G)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55445"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773468118_4950288.jpg" width="300" height="400" alt="ちか(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ちか</div>
						<a href="/therapist/55445" class="therapist-datas-name text-gothic">ちか(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">疲れた心も体も、しっかりほぐす自信があります♡ 会いに来てくれたら、最高の癒しを約束します♡ あなたのペースでリラックスできる時間にしたいです♪</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">158㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55455"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773768211_9343403.jpg" width="300" height="400" alt="みさ(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">みさ</div>
						<a href="/therapist/55455" class="therapist-datas-name text-gothic">みさ(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">はじめまして、みさです♡ また会いたい！って思っていただけるように精一杯頑張ります♬ 笑顔と癒しをたっぷり届けますので🥰 お誘い心よりお待ちしてます✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">163㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55443"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885102_2460113.jpg" width="300" height="400" alt="パイン(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">パイン</div>
						<a href="/therapist/55443" class="therapist-datas-name text-gothic">パイン(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">また会いたいって思ってもらえるような時間を過ごしたいです(｡･ω･｡)💞 笑顔と癒しを込めて精一杯頑張ります✨ 心地よくリラックスできる特別なひとときを一緒に過ごしましょう💕</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">149㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55456"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885072_1467354.jpg" width="300" height="400" alt="みゆう(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">みゆう</div>
						<a href="/therapist/55456" class="therapist-datas-name text-gothic">みゆう(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">見てるだけでほっとするって言われちゃいます♡ 優しくリラックスできる時間を届けたいな♪ 会えるの楽しみにしてます 遊びに来てくれたら嬉しいな🥰</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">158㎝</span>
							(B)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55457"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885126_4622782.jpg" width="300" height="400" alt="まゆか(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">まゆか</div>
						<a href="/therapist/55457" class="therapist-datas-name text-gothic">まゆか(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">はじめまして🩷まゆかです！ 沢山の女の子の中から、私のことを見つけてくれて嬉しいです✨一緒に素敵な時間を過ごしましょうね🥰</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">21歳</span>
							<span class="mg-right-xs">152㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55440"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885047_0751913.jpg" width="300" height="400" alt="おと(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">おと</div>
						<a href="/therapist/55440" class="therapist-datas-name text-gothic">おと(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">帰るころには自然と笑顔になっていただけるよう、心を込めて施術しています♡ 疲れたときは、ぜひ癒されに来てください♪ お会いできる日を楽しみにしています✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">167㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55997"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774806729_9503747.jpg" width="300" height="400" alt="ねねか(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ねねか</div>
						<a href="/therapist/55997" class="therapist-datas-name text-gothic">ねねか(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">ゆったり楽しい時間を一緒に過ごせたら嬉しいです♡ よくアイドルみたいって言ってもらえることが多いです…✨ たくさん笑顔になってもらえるように、甘くて癒しの時間をお届けしますね🌸</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">21歳</span>
							<span class="mg-right-xs">156㎝</span>
							(G)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55454"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885163_1749930.jpg" width="300" height="400" alt="こころ(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">こころ</div>
						<a href="/therapist/55454" class="therapist-datas-name text-gothic">こころ(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">落ち着いた時間を一緒に過ごせたら嬉しいです🌿 お話するのも静かに過ごすのも、どちらも大好きです☺️ こころなりの癒しを感じてもらえたら嬉しいです💓</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">164㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55463"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885151_2742845.jpg" width="300" height="400" alt="あまね(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">あまね</div>
						<a href="/therapist/55463" class="therapist-datas-name text-gothic">あまね(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">よく実物の方が可愛いねと言われます🌟 たくさんくっついて、気持ちいい時間を過ごせたら嬉しいです♡ 絶対に満足させます🥺 </div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">151㎝</span>
							(B)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55466"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1776041190_3971151.jpg" width="300" height="400" alt="あいり(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">あいり</div>
						<a href="/therapist/55466" class="therapist-datas-name text-gothic">あいり(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">あいりです♡ お日様のような暖かさで癒します🌻 たくさんの幸せを感じてもらえますように✨ 笑顔と癒しを込めてお迎えします💖 一緒に特別な時間を過ごしましょう🌸</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">156㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55519"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1776139285_1010630.jpg" width="300" height="400" alt="のあん(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">のあん</div>
						<a href="/therapist/55519" class="therapist-datas-name text-gothic">のあん(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">お会いできる時間を楽しみにしています🌙✨ゆったり落ち着ける施術を心がけますので、気になるところは遠慮なくお伝えくださいね。丁寧に癒していきます💐</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">158㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55462"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885132_2969737.jpg" width="300" height="400" alt="うい(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">うい</div>
						<a href="/therapist/55462" class="therapist-datas-name text-gothic">うい(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">はじめまして、ういです🌸 未経験でとっても緊張してますが お客様に癒されてもらえるよう 一生懸命頑張ります🔰 優しくしていただけると嬉しいです💖</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">21歳</span>
							<span class="mg-right-xs">158㎝</span>
							(B)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55448"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885114_6561591.jpg" width="300" height="400" alt="みあ(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">みあ</div>
						<a href="/therapist/55448" class="therapist-datas-name text-gothic">みあ(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">心も体もほぐせるように頑張ります♡ 一緒に過ごす時間が、特別なひとときになりますように♪ あなたとの出会いを楽しみにしています♡</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">164㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55446"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885096_9271721.jpg" width="300" height="400" alt="かな(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">かな</div>
						<a href="/therapist/55446" class="therapist-datas-name text-gothic">かな(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">かなです♡ 緊張しちゃうけど、会えたら笑顔で頑張ります♡ 一緒にリラックスできる時間にしたいな♪ 少しずつ距離を縮められたら嬉しいです♡</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">153㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55450"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885120_6957678.jpg" width="300" height="400" alt="まんな(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">まんな</div>
						<a href="/therapist/55450" class="therapist-datas-name text-gothic">まんな(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">現役地下アイドル参上('ω')ノ 笑顔でみなさんを癒せるように頑張ります♡ 会った瞬間にほっこりしてもらえたら嬉しいです♪</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">155㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55464"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885157_4372818.jpg" width="300" height="400" alt="つな(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">つな</div>
						<a href="/therapist/55464" class="therapist-datas-name text-gothic">つな(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">癒し担当になれるよう頑張ります♪ 笑顔とやさしさで心も体もふわっとほぐします💖 一緒に過ごす時間が特別で楽しいひとときになるよう 全力で寄り添います✨ お待ちしてます🌸</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">155㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55468"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885169_9396013.jpg" width="300" height="400" alt="もも(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">もも</div>
						<a href="/therapist/55468" class="therapist-datas-name text-gothic">もも(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">今日も笑顔でたくさん癒します🌼 お兄さんに会えるのを楽しみにしてます💖 ドキドキわくわくしながら待ってるので 一緒に素敵な時間を過ごしましょう🎀</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">25歳</span>
							<span class="mg-right-xs">157㎝</span>
							(B)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55460"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885145_2429674.jpg" width="300" height="400" alt="ひなた(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ひなた</div>
						<a href="/therapist/55460" class="therapist-datas-name text-gothic">ひなた(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">人懐っこくてフレンドリーな性格なので、初めてでも安心してください🌷 会った瞬間から自然に打ち解けられると思います✨ 素敵な時間を一緒に作りましょう💓</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">158㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55467"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885175_0751317.jpg" width="300" height="400" alt="みなも(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">みなも</div>
						<a href="/therapist/55467" class="therapist-datas-name text-gothic">みなも(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">みなもです♡ あなたの心も体もそっと解きほぐせたら嬉しいです🥀✨ 癒しと安らぎを感じられる特別な時間を一緒に過ごしましょう💫💗 会えるのを楽しみにしてます🌸</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">25歳</span>
							<span class="mg-right-xs">158㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55459"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885181_1738540.jpg" width="300" height="400" alt="みやび(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">みやび</div>
						<a href="/therapist/55459" class="therapist-datas-name text-gothic">みやび(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">はじめまして、みやびです🌷 初めてですが、心を込めて癒せるようがんばります。 素敵なひとときを一緒に過ごせたら嬉しいです✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">152㎝</span>
							(I)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55458"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885188_9594093.jpg" width="300" height="400" alt="ゆうみ(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ゆうみ</div>
						<a href="/therapist/55458" class="therapist-datas-name text-gothic">ゆうみ(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">ゆうみです♪  癒しの時間を一緒に過ごしましょう🥺💗 あなたの疲れをしっかりほぐせるよう頑張ります♡ 会えるのを楽しみにしています✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">160㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55465"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885195_4648706.jpg" width="300" height="400" alt="はな(PLATINUM)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">はな</div>
						<a href="/therapist/55465" class="therapist-datas-name text-gothic">はな(PLATINUM)</a>
						<div class="therapist-datas-bio text-gothic">少しの時間でも特別感ある贅沢なひとときを過ごしましょう🫧 癒しと笑顔をたっぷりお届けします💖 お誘いを心よりお待ちしてます🙂‍↕️💭 一緒に楽しい時間をすごしましょう🌸</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">157㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55479"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885207_2659766.jpg" width="300" height="400" alt="すいか(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">すいか</div>
						<a href="/therapist/55479" class="therapist-datas-name text-gothic">すいか(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">特別な時間を共有しませんか🥰✨ 優しくぎゅーっと癒せるように頑張ります🥺💖 会えるのを楽しみにしてます💗💫 一緒に笑顔いっぱいの幸せなひとときを過ごしましょう🌸</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">155㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55517"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885406_2883384.jpg" width="300" height="400" alt="うるり(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">うるり</div>
						<a href="/therapist/55517" class="therapist-datas-name text-gothic">うるり(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">0距離の特別空間🤍ゆっくり贅沢時間をお届けします🫧 笑顔と癒しをぎゅっと詰め込んでお届けします💫 一緒に楽しい時間を過ごしてほしいな✨ 会えるのをワクワクしながら待ってます💖</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">26歳</span>
							<span class="mg-right-xs">160㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55521"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885475_7890683.jpg" width="300" height="400" alt="くう(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">くう</div>
						<a href="/therapist/55521" class="therapist-datas-name text-gothic">くう(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">一緒に過ごせる時間、楽しみにしてます♡たくさん癒せたら嬉しいな♡ ゆったりまったり、一緒にくつろごうね☺️ 笑顔と優しさでいっぱい包むよ💓 特別な時間、一緒に作ろ🎀</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">21歳</span>
							<span class="mg-right-xs">165㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55469"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885226_9466545.jpg" width="300" height="400" alt="まき(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">まき</div>
						<a href="/therapist/55469" class="therapist-datas-name text-gothic">まき(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">まきです♪ 今日も元気と癒しをお届けします🌷一緒にたくさん思い出つくろーね🎀みなさんにリラックスしていただけるように頑張るね✨ あなたに笑顔をたくさんプレゼントします！🎁</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">157㎝</span>
							(G)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55470"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885302_6504560.jpg" width="300" height="400" alt="さんご(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">さんご</div>
						<a href="/therapist/55470" class="therapist-datas-name text-gothic">さんご(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">さんごです♡ 毎日お仕事頑張ってるお兄さんたちに最高の癒しをお届けします🫧💆‍♂️💞 ぜひ癒されに来てくださいね^_−☆ たくさんのご予約待ってます♡ </div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">168㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55500"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885340_6932746.jpg" width="300" height="400" alt="える(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">える</div>
						<a href="/therapist/55500" class="therapist-datas-name text-gothic">える(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">楽しい時間を過ごしましょう♪ ドキドキもワクワクも、ぜんぶ一緒に感じてほしいな✨ また会いたくなるような、特別な時間にしちゃいます💓</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">161㎝</span>
							(G)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55486"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885265_8705429.jpg" width="300" height="400" alt="らむ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">らむ</div>
						<a href="/therapist/55486" class="therapist-datas-name text-gothic">らむ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">見つけて下さりありがとうございます💕そっと触れる施術で、疲れや緊張をやさしくほぐします😊 笑顔が増えるような、ほっこりした時間を過ごしてね♡</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">150㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/56835"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1775144567_5141861.jpg" width="300" height="400" alt="らん(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">らん</div>
						<a href="/therapist/56835" class="therapist-datas-name text-gothic">らん(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">会える時間が今からワクワクです😆元気と癒しをたっぷり用意して待ってます。気分転換したい時は、ぜひ気軽に遊びに来てくださいね🌈</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">155㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/61442"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1776009892_9969366.jpg" width="300" height="400" alt="ひめか(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ひめか</div>
						<a href="/therapist/61442" class="therapist-datas-name text-gothic">ひめか(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">リラックスして身を任せてもらえるように、やさしく寄り添えたら嬉しいです💖 一緒に心地よい時間を過ごしましょう🍀 会えるのを楽しみにお待ちしてます✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">154㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/56044"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773052585_3040364.jpg" width="300" height="400" alt="かぐら(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">かぐら</div>
						<a href="/therapist/56044" class="therapist-datas-name text-gothic">かぐら(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">せっかくのひとときだから、気持ちがパッと軽くなるような時間にしたいです😊明るくあたたかい雰囲気でお迎えします🌈</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">26歳</span>
							<span class="mg-right-xs">157㎝</span>
							(G)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55535"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885487_7405025.jpg" width="300" height="400" alt="ことり(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ことり</div>
						<a href="/therapist/55535" class="therapist-datas-name text-gothic">ことり(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">一緒にくつろげる時間を楽しみにしています♡ 笑顔になってもらえるよう、やさしく癒します♡</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">19歳</span>
							<span class="mg-right-xs">150㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/58439"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774803284_4636395.jpg" width="300" height="400" alt="なむる(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">なむる</div>
						<a href="/therapist/58439" class="therapist-datas-name text-gothic">なむる(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">はじめまして🩷なむるです！ 沢山の女の子の中から、私のことを見つけてくれて嬉しいです✨一緒に素敵な時間を過ごしましょうね🥰</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">25歳</span>
							<span class="mg-right-xs">169㎝</span>
							(H)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/56038"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772075471_6619269.jpg" width="300" height="400" alt="とわ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">とわ</div>
						<a href="/therapist/56038" class="therapist-datas-name text-gothic">とわ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">忙しい日常を忘れて、今日は私に甘えてみませんか？🌿 一人ひとりに寄り添いながら、心を込めて丁寧に施術させていただきます💗</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">158㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55485"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885240_3680025.jpg" width="300" height="400" alt="もあ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">もあ</div>
						<a href="/therapist/55485" class="therapist-datas-name text-gothic">もあ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">もあです💖 実物の方が可愛いので逢いに来て確かめて♡♡ おしゃべりしながらまったり過ごせたら嬉しいな☺️ たくさん癒せるようにがんばります♪</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">19歳</span>
							<span class="mg-right-xs">155㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55495"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885289_6620680.jpg" width="300" height="400" alt="まいか(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">まいか</div>
						<a href="/therapist/55495" class="therapist-datas-name text-gothic">まいか(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">お仕事帰りや一日の終わりに、安心してリフレッシュできる時間をお届けします✨ 心を込めた施術で心身ともに癒していけるよう努めます☺️</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">149㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55471"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774207636_5361873.jpg" width="300" height="400" alt="ぐみ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ぐみ</div>
						<a href="/therapist/55471" class="therapist-datas-name text-gothic">ぐみ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">癒しとドキドキ どっちも味わってほしいな♪ ぐみと一緒に楽しい時間を過ごしましょ🩷 笑顔でお迎えするので安心してくださいね💖 逢いに来てくれるの待ってます〜♡</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">161㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55474"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1775019520_5509915.jpg" width="300" height="400" alt="うみ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">うみ</div>
						<a href="/therapist/55474" class="therapist-datas-name text-gothic">うみ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">見つけてくれて、ありがとうございます♡ 一緒にいると落ち着くって思ってもらえたら嬉しいな☺️ お日様のような暖かさで癒します🌻</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">165㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55510"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885295_5316152.jpg" width="300" height="400" alt="ぱい(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ぱい</div>
						<a href="/therapist/55510" class="therapist-datas-name text-gothic">ぱい(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">お兄さんに会えるのを楽しみにしてます🥰 笑顔いっぱいでお迎えしますね💓 一緒に楽しい時間をすごそ〜🎀 たくさん癒してあげたいです！！！</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">170㎝</span>
							(H)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55515"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885394_1929703.jpg" width="300" height="400" alt="いおり(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">いおり</div>
						<a href="/therapist/55515" class="therapist-datas-name text-gothic">いおり(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">いおりの極上マッサージ体験してください💆🏻‍♀️🪽💫 癒しと楽しさ、両方チャージしてもらえるように頑張ります🌟 たくさん笑って、いっぱい気持ちよくなってね🥰 ご指名お待ちしてます💕</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">151㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55524"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885481_7957172.jpg" width="300" height="400" alt="るか(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">るか</div>
						<a href="/therapist/55524" class="therapist-datas-name text-gothic">るか(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">落ち着くって言われること多いです☺️のんびり過ごしたい日は、ゆっくり癒されに来てください🌿✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">157㎝</span>
							(H)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55475"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885277_9339369.jpg" width="300" height="400" alt="さおり(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">さおり</div>
						<a href="/therapist/55475" class="therapist-datas-name text-gothic">さおり(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">ふわふわまっしろの濃厚密着マッサージがだいすきだよ 〜 ♡ 愛嬌&amp;優しさ&amp;笑顔に自信ありᕱ⑅ᕱﾞ ぎゅっと近くで癒すひとときで、幸せな気分になってほしいな♡</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">160㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55501"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885333_1531224.jpg" width="300" height="400" alt="ひなみ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ひなみ</div>
						<a href="/therapist/55501" class="therapist-datas-name text-gothic">ひなみ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">はじめまして、ひなみです♪  丁寧に、心を込めて癒せるようがんばります♡お話するのも大好きです☺️ 穏やかなひとときを一緒に過ごせたら嬉しいです✨ </div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">158㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55476"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885213_0599942.jpg" width="300" height="400" alt="おとね(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">おとね</div>
						<a href="/therapist/55476" class="therapist-datas-name text-gothic">おとね(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">一緒に過ごす時間を特別にしたいな♡ ドキドキもほっこりも楽しんでもらえたら嬉しいです🥰 笑顔と癒しをたっぷり届けます✨ 会えるのを心から楽しみにしてます💖 お誘い待ってます🌸</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">25歳</span>
							<span class="mg-right-xs">157㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55502"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885327_0051713.jpg" width="300" height="400" alt="ゆりあ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ゆりあ</div>
						<a href="/therapist/55502" class="therapist-datas-name text-gothic">ゆりあ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">ちょっと緊張してますが、仲良くしてもらえたら嬉しいです🥹💕 優しくしてもらえると甘えちゃうかもしれません♡ 癒しも一緒に届けますね🧸</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">163㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55538"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885499_9438484.jpg" width="300" height="400" alt="なる(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">なる</div>
						<a href="/therapist/55538" class="therapist-datas-name text-gothic">なる(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">穏やかな空間で、心と体を解きほぐせるよう丁寧に努めます🌿 何気ない時間が特別なひとときになるように、優しく寄り添わせていただきますね✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">19歳</span>
							<span class="mg-right-xs">164㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55978"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1771783842_1118524.jpg" width="300" height="400" alt="さゆみ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">さゆみ</div>
						<a href="/therapist/55978" class="therapist-datas-name text-gothic">さゆみ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">会えるのを楽しみに準備しています🌿ゆっくりくつろげるよう優しく施術します☺️気になる部分は遠慮なく教えてくださいね💞癒します💗</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">162㎝</span>
							(G)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55518"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885419_3791652.jpg" width="300" height="400" alt="ゆら(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ゆら</div>
						<a href="/therapist/55518" class="therapist-datas-name text-gothic">ゆら(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">一緒にいると笑顔になれるって言われたいな💖 明るく癒しの時間を過ごせるように頑張ります🌸 会えるのを楽しみにしてます🎶 お誘い待ってます🌼</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">158㎝</span>
							(B)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55527"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885425_2683151.jpg" width="300" height="400" alt="りおん(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">りおん</div>
						<a href="/therapist/55527" class="therapist-datas-name text-gothic">りおん(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">心安らぐ時間をお届けできたら嬉しいです🌷 一つひとつの時間を大切に、丁寧に癒させていただきます💎 特別なひとときを、りおんと一緒にお過ごしください✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">25歳</span>
							<span class="mg-right-xs">156㎝</span>
							(G)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55509"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773518889_7956322.jpg" width="300" height="400" alt="みんと(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">みんと</div>
						<a href="/therapist/55509" class="therapist-datas-name text-gothic">みんと(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">みんとです！プロフィールを見てくださりありがとうございます♡ お兄さんとたくさんお話できたら嬉しいな🥺💓 そばで甘えさせてもらえると幸せです♡ 早く会えるのを楽しみにしてます🎀</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">155㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 408px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55533"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885450_2368939.jpg" width="300" height="400" alt="ななん(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ななん</div>
						<a href="/therapist/55533" class="therapist-datas-name text-gothic">ななん(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">初めまして、ななんです💕心も体もゆったりとくつろげる癒しの時間をお届けできるゆ、丁寧に施術させていただきます。頑張るのでななんに会いに来てくださいね💕</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">168㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 408px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55522"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885438_4725105.jpg" width="300" height="400" alt="れいか(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">れいか</div>
						<a href="/therapist/55522" class="therapist-datas-name text-gothic">れいか(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">はじめまして、れいかです☺️🌼 穏やかでほっとできる時間をお届けできたら嬉しいです。 ゆっくり癒されに来てくださいね…お待ちしています💗✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">26歳</span>
							<span class="mg-right-xs">160㎝</span>
							(G)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 408px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55504"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885377_2079040.jpg" width="300" height="400" alt="あこ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">あこ</div>
						<a href="/therapist/55504" class="therapist-datas-name text-gothic">あこ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">ちょっぴり人見知りだけど、仲良くなったらよく笑います🥰 癒しと楽しい時間を一緒に過ごせるように頑張りますので、どうぞよろしくお願いします♡</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">161㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 408px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55477"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1775135637_2168952.jpg" width="300" height="400" alt="かりん(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">かりん</div>
						<a href="/therapist/55477" class="therapist-datas-name text-gothic">かりん(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">話すのが好きなので、人見知りな方ともゆっくり距離を縮められたら嬉しいです🫶🏻 落ち着いて過ごせる時間を大切にしながら、心も体もじんわり癒していきます☺️ 一緒に特別な時間を過ごしましょう💓</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">172㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/56010"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1771780832_5166168.jpg" width="300" height="400" alt="れおん(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">れおん</div>
						<a href="/therapist/56010" class="therapist-datas-name text-gothic">れおん(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">ゆったり過ごせる空間で、やさしく癒します♡ 静かな時間が好きな方にもおすすめです🌿</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">19歳</span>
							<span class="mg-right-xs">163㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55508"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774775013_3344340.jpg" width="300" height="400" alt="ありす(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ありす</div>
						<a href="/therapist/55508" class="therapist-datas-name text-gothic">ありす(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">お話するのも大好きだし 静かに寄り添うのも好きです🍀 お客様に合わせて ゆったり過ごせたらいいな💖 会えるのを楽しみにしてます😊</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">160㎝</span>
							(G)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55523"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1776255916_1754071.jpg" width="300" height="400" alt="せいら(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">せいら</div>
						<a href="/therapist/55523" class="therapist-datas-name text-gothic">せいら(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">こんにちは、せいらです♪ ちょっと大胆で、ちょっと甘めな時間を過ごしてもらえたら嬉しいです。 見た目よりお話好きなので、気軽に仲良くしてくださいね♡ お待ちしてます！</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">156㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55671"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774805321_5503853.jpg" width="300" height="400" alt="はるね(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">はるね</div>
						<a href="/therapist/55671" class="therapist-datas-name text-gothic">はるね(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">また会いたいって思ってもらえるように、心を込めて癒します♡ 笑顔と優しさでお兄さんを包むよ☺️ 楽しい時間を一緒に過ごそうね🎀 いっぱいリラックスしてもらえると嬉しいな💖</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">26歳</span>
							<span class="mg-right-xs">159㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55665"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773573243_8066549.jpg" width="300" height="400" alt="はるあ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">はるあ</div>
						<a href="/therapist/55665" class="therapist-datas-name text-gothic">はるあ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">あまり構えずに、普通に過ごしてもらえたらいいなと思ってます。静かにしたい日も、お話ししたい日も、そのままで大丈夫です。気楽な気持ちで来てもらえたら嬉しいです☺️</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">155㎝</span>
							(I)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/57850"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774797638_1906615.jpg" width="300" height="400" alt="みら(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">みら</div>
						<a href="/therapist/57850" class="therapist-datas-name text-gothic">みら(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">初めまして、みらです♡甘えるのも甘えてもらうのもだいすきです🥰マッサージには自信があるので、身体も心も沢山癒してあげたいな🍀一緒に素敵な時間を過ごしましょうね💭💕</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">25歳</span>
							<span class="mg-right-xs">160㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55994"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885517_7307239.jpg" width="300" height="400" alt="ゆき(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ゆき</div>
						<a href="/therapist/55994" class="therapist-datas-name text-gothic">ゆき(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">ゆっくり癒されたいなって思ってくれたら嬉しいです♡ 現役大学生でまだまだ勉強中ですが、笑顔でやさしく寄り添います✨ のんびりした時間を一緒に過ごしてもらえたら嬉しいです🌸</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">151㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55984"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1771778700_7262152.jpg" width="300" height="400" alt="りく(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">りく</div>
						<a href="/therapist/55984" class="therapist-datas-name text-gothic">りく(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">一緒にいると自然と笑顔になれる、そんな時間を作りたいです💖 明るくて癒されるひとときを過ごせるよう頑張ります🌸 会えるのを楽しみにしてます🎶お誘いお待ちしてます🌼</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">150㎝</span>
							(G)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55499"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885283_6994563.jpg" width="300" height="400" alt="ちひろ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ちひろ</div>
						<a href="/therapist/55499" class="therapist-datas-name text-gothic">ちひろ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">背もスタイルも"ちょうどいい"ってよく言われてます♡笑顔とえくぼがチャームポイント✨ くっつくのだ〜〜いすきっ💕 もちもちお肌でたくさん密着させてください💓</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">156㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55549"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772541486_1347495.jpg" width="300" height="400" alt="ゆいり(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ゆいり</div>
						<a href="/therapist/55549" class="therapist-datas-name text-gothic">ゆいり(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">一緒にいる時間が癒しになれたらいいなって思ってます☺️ 笑顔と優しさでいっぱい包みたいな💓 ゆったりリラックスできる時間を過ごしてね✨ お兄さんと過ごす時間、楽しみにしてるよ🎀</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">156㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55520"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885463_4765878.jpg" width="300" height="400" alt="ななか(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ななか</div>
						<a href="/therapist/55520" class="therapist-datas-name text-gothic">ななか(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">はじめまして、ななかです♡  まだ慣れないことも多いですが、お客様に癒しを感じていただけるように一生懸命がんばります✨ 笑顔で楽しい時間を一緒に過ごせたら嬉しいです💐</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">21歳</span>
							<span class="mg-right-xs">152㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/56006"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774803886_3222909.jpg" width="300" height="400" alt="るいね(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">るいね</div>
						<a href="/therapist/56006" class="therapist-datas-name text-gothic">るいね(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">ゆったり落ち着いた時間を大切にしています♡ リラックスして過ごしてもらえるように、丁寧に寄り添います✨ お話しするのも好きなので、笑顔で楽しい時間を一緒に過ごせたら嬉しいです☺️🌸 </div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">149㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 422px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55532"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885456_7740312.jpg" width="300" height="400" alt="まりあ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">まりあ</div>
						<a href="/therapist/55532" class="therapist-datas-name text-gothic">まりあ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">初めまして まりあ です♡ 気持ちいい所教えてくださいね？ 優しさたっぷりで、あなたの疲れを癒せたら嬉しいな💓 笑顔と甘えで、いっぱいドキドキさせちゃうかも✨ 一緒に過ごす時間を、特別で幸せなひとときにしたいです♡</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">21歳</span>
							<span class="mg-right-xs">158㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 422px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/57349"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774797777_1844870.jpg" width="300" height="400" alt="みはね(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">みはね</div>
						<a href="/therapist/57349" class="therapist-datas-name text-gothic">みはね(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">はじめまして☺️ まだ緊張することもありますが、人と過ごす時間は好きです。かしこまらず、気軽に会いに来てもらえたら嬉しいなと思ってます🌸のんびりした気分で過ごしてくださいね🍀</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">164㎝</span>
							(G)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 422px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/57264"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773573422_8200527.jpg" width="300" height="400" alt="あらん(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">あらん</div>
						<a href="/therapist/57264" class="therapist-datas-name text-gothic">あらん(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">フレッシュな気持ちで毎回向き合いたいなって思ってます✨ 静かに過ごすのも、お話しするのもどっちも好きなので、その日の気分でゆるっと過ごしてもらえたら嬉しいです☺️🌷</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">148㎝</span>
							(H)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 422px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/56819"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774804016_3291157.jpg" width="300" height="400" alt="きら(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">きら</div>
						<a href="/therapist/56819" class="therapist-datas-name text-gothic">きら(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">一緒にいる時間が、気持ちを切り替えるスイッチになったらいいなと思っています。無理せず、今の自分のままで来てください🌸</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">164㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/56005"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774803773_6886814.jpg" width="300" height="400" alt="りと(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">りと</div>
						<a href="/therapist/56005" class="therapist-datas-name text-gothic">りと(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">一緒に過ごせる時間を楽しみにしています♡ ゆったり癒して、自然と笑顔になれるひとときにしたいな☺️ 無理せず、まったりくつろいでね💓</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">158㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/57846"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774804297_6478605.jpg" width="300" height="400" alt="いづみ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">いづみ</div>
						<a href="/therapist/57846" class="therapist-datas-name text-gothic">いづみ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">最初は少し緊張するタイプだけど、慣れてくると自然体になります☺️ 無理に話さなくても大丈夫🌸 また一緒に過ごせたらいいなって思ってます✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">21歳</span>
							<span class="mg-right-xs">173㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/58500"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1776098385_9382247.jpg" width="300" height="400" alt="かえ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">かえ</div>
						<a href="/therapist/58500" class="therapist-datas-name text-gothic">かえ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">かえです💙精いっぱい癒します🥹🫧マッサージは勉強中で、少し緊張してるのでほぐしに来てくれたら飛び跳ねて喜びます🥰</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">155㎝</span>
							(G)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/58797"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1776307251_8887353.jpg" width="300" height="400" alt="もみじ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">もみじ</div>
						<a href="/therapist/58797" class="therapist-datas-name text-gothic">もみじ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">人懐っこくてフレンドリーな性格なので、初めてでも安心してください🌷 会った瞬間から自然に打ち解けられると思います✨ 素敵な時間を一緒に作りましょう💓</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">152㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 408px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/56030"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772556898_0147961.jpg" width="300" height="400" alt="りね(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">りね</div>
						<a href="/therapist/56030" class="therapist-datas-name text-gothic">りね(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">ふらっと気分転換したい日に、思い出してもらえる場所になれたら嬉しいです☺️ ゆったりした流れの中で、心まで整える時間にします🌷</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">164㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 408px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55747"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1776008226_1893014.jpg" width="300" height="400" alt="ここの(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ここの</div>
						<a href="/therapist/55747" class="therapist-datas-name text-gothic">ここの(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">はじめまして ここのです♡☺️ ドキドキ緊張していますが、笑顔でお兄さんをお迎えできるよう頑張ります✨ 一緒に楽しい時間をすごせたら嬉しいです🎀</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">19歳</span>
							<span class="mg-right-xs">163㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 408px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55534"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773812690_7410881.jpg" width="300" height="400" alt="ひろか(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ひろか</div>
						<a href="/therapist/55534" class="therapist-datas-name text-gothic">ひろか(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">リラックスできる空間でゆったり過ごしましょう🌿 優しい気持ちでお迎えいたします☺️ お兄さんの疲れを癒せたら嬉しいです♡ お客様に心地よい癒しのひとときをお届けするため、心を込めて施術します✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">165㎝</span>
							(G)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 408px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55681"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1776014793_0028966.jpg" width="300" height="400" alt="なみ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">なみ</div>
						<a href="/therapist/55681" class="therapist-datas-name text-gothic">なみ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">なみです。 ゆっくりした時間と、心地よい距離感を大切にしています。 密着しながら、じんわり癒していけたら…♡ よかったら、あなたの疲れを私に預けてくださいね。</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">170㎝</span>
							(G)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55974"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1771784843_4300891.jpg" width="300" height="400" alt="ありあ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ありあ</div>
						<a href="/therapist/55974" class="therapist-datas-name text-gothic">ありあ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">穏やかで優しい雰囲気で、お客様の気分に合わせて丁寧に癒します🌿✨心から落ち着ける時間を提供しますので安心して過ごしてください💞</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">164㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55940"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885511_2975710.jpg" width="300" height="400" alt="りりか(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">りりか</div>
						<a href="/therapist/55940" class="therapist-datas-name text-gothic">りりか(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">はじめまして☺️🌷 りりかです✨ まだ学びながらですが、心地よい時間をお届けできるように頑張ります💗 優しく癒せたら嬉しいです。お会いできるのを楽しみにしています🍀</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">153㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55751"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885505_9004386.jpg" width="300" height="400" alt="すみ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">すみ</div>
						<a href="/therapist/55751" class="therapist-datas-name text-gothic">すみ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">保育士とセラピストの両立頑張ります✨ たくさん会いに来てください☺️ 一緒に楽しくてリラックスできる時間を過ごしましょう♡ 笑顔で癒せるよう心を込めます💖</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">159㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55507"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885353_1463609.jpg" width="300" height="400" alt="てぃな(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">てぃな</div>
						<a href="/therapist/55507" class="therapist-datas-name text-gothic">てぃな(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">てぃなです✨ 会話も楽しみながら たくさん癒しを届けられるように頑張ります✨ 笑顔でお迎えしますので 一緒にリラックスした時間を過ごしていただけたら嬉しいです💖</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">21歳</span>
							<span class="mg-right-xs">155㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 408px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/56003"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1771785198_0403045.jpg" width="300" height="400" alt="りのあ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">りのあ</div>
						<a href="/therapist/56003" class="therapist-datas-name text-gothic">りのあ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">ゆっくり落ち着いた時間を大切にしています♡ まだ若さもあって、少しあどけないところもありますが…🌸 そっと寄り添いながら癒しをお届けできたら嬉しいです✨ のんびり過ごしてもらえたら幸せです☺️💭</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">152㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 408px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55503"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885370_2114735.jpg" width="300" height="400" alt="あすみ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">あすみ</div>
						<a href="/therapist/55503" class="therapist-datas-name text-gothic">あすみ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">リラックスできるひとときをお届けします🌿 まったりと癒しの時間を一緒に過ごしていただけたら嬉しいです😊 全力でおもてなしさせていただきます💕 優しく丁寧に癒しますので安心してお任せください✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">27歳</span>
							<span class="mg-right-xs">156㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 408px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55516"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885400_7807140.jpg" width="300" height="400" alt="りま(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">りま</div>
						<a href="/therapist/55516" class="therapist-datas-name text-gothic">りま(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">癒されるって言ってもらえるの、すごく嬉しいです☺️ お兄さんの心も体もゆったりほぐせるように頑張ります✨ 一緒にリラックスできる時間を過ごしましょ🌷 会えるのを楽しみにしています💓</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">157㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 408px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55530"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885431_2542237.jpg" width="300" height="400" alt="えりす(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">えりす</div>
						<a href="/therapist/55530" class="therapist-datas-name text-gothic">えりす(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">一緒に過ごす時間が、元気になれるひとときになりますように🥰明るく癒します🌸会えるの楽しみにしてます🎀</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">155㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55505"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885383_7732651.jpg" width="300" height="400" alt="いつき(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">いつき</div>
						<a href="/therapist/55505" class="therapist-datas-name text-gothic">いつき(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">ゆったりとした癒しのひとときを過ごしていただけるよう、心を込めて施術しますね♪お会いできるのを楽しみにしてますっ🌼</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">172㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55498"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885412_9007868.jpg" width="300" height="400" alt="みりな(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">みりな</div>
						<a href="/therapist/55498" class="therapist-datas-name text-gothic">みりな(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">初めまして、みりな です❤︎ 癒されにきてください❤︎ 元気いっぱいでお兄さんをお迎えしますね🥰 たくさんお話して楽しい時間をつくりたいな💓 一緒にハッピーなひとときを過ごしましょう🎀</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">19歳</span>
							<span class="mg-right-xs">158㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55483"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885219_5741932.jpg" width="300" height="400" alt="まどか(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">まどか</div>
						<a href="/therapist/55483" class="therapist-datas-name text-gothic">まどか(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">はじめまして、まどかです🐰♡ 癒しをお届けできるよう一生懸命頑張ります✨ 笑顔でお迎えするので安心してください💖 たくさん会いに来てくれたら嬉しいです💫 お待ちしてます🌸</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">147㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55491"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885233_8543834.jpg" width="300" height="400" alt="くしな(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">くしな</div>
						<a href="/therapist/55491" class="therapist-datas-name text-gothic">くしな(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">見た目と中身にギャップがあるタイプと言われます🤭 ぜひ会いに来て確かめてみてね🥰 笑顔と癒しをたっぷりお届けします💖 一緒に素敵な時間を過ごせたら嬉しいです♡</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">158㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55480"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885201_8535945.jpg" width="300" height="400" alt="りあ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">りあ</div>
						<a href="/therapist/55480" class="therapist-datas-name text-gothic">りあ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">見つけてくれてありがとう♡2人っきりの癒しの時間すごしませんか♡♡お誘い待ってます🫧😌 心を込めて丁寧に施術させていただきます🌿 日々の疲れを忘れてゆったりお過ごしください☺️</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">160㎝</span>
							(B)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55478"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885271_4134247.jpg" width="300" height="400" alt="えまな(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">えまな</div>
						<a href="/therapist/55478" class="therapist-datas-name text-gothic">えまな(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">甘えん坊な私と、一緒にとろける時間を過ごしましょ♪ ふわふわボディで心も体も包み込みます💖 そっと触れる手で、疲れをほぐしていきます✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">25歳</span>
							<span class="mg-right-xs">150㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55461"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1770572830_3259153.jpg" width="300" height="400" alt="きり(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">きり</div>
						<a href="/therapist/55461" class="therapist-datas-name text-gothic">きり(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">お話もマッサージも楽しみながら💓 一緒にリラックスできる時間を過ごしましょう🌸 今日も笑顔でお待ちしてます☺️🎀</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">150㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55506"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885389_9419935.jpg" width="300" height="400" alt="あまい(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">あまい</div>
						<a href="/therapist/55506" class="therapist-datas-name text-gothic">あまい(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">お客様に合わせて心地よい時間を作ります🌿 優しく丁寧に癒しますね☺️ 一緒に安らぎのひとときを過ごしましょう💖</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">165㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 408px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55494"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885322_2200841.jpg" width="300" height="400" alt="きき(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">きき</div>
						<a href="/therapist/55494" class="therapist-datas-name text-gothic">きき(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">まだまだ不慣れでドキドキですが…😳 お客様が少しでもほっとできるように、まごころ込めてがんばります💗 リラックスして楽しんでもらえるように、精一杯頑張ります🌿♡</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">160㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 408px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55497"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885316_6489062.jpg" width="300" height="400" alt="しらゆき(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">しらゆき</div>
						<a href="/therapist/55497" class="therapist-datas-name text-gothic">しらゆき(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">濃厚施術でお兄様の疲れた体を癒します♡ドMさんは大好物です🎀 フェザータッチさせてください🫶🏻 お誘い待ってます♡ 一緒に過ごす時間を、甘くとろける特別なひとときにしましょう💖</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">155㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 408px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55496"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885309_6430376.jpg" width="300" height="400" alt="ゆうね(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ゆうね</div>
						<a href="/therapist/55496" class="therapist-datas-name text-gothic">ゆうね(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">はじめまして、ゆうねです♡ まだまだ分からないことばかりですが、「来てよかった」って思っていただけるように、笑顔と一生懸命な気持ちで頑張ります！ たくさん癒せたら嬉しいです…ぜひ仲良くしてください♪</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">19歳</span>
							<span class="mg-right-xs">170㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 408px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55481"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885523_3150579.jpg" width="300" height="400" alt="ゆづき(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ゆづき</div>
						<a href="/therapist/55481" class="therapist-datas-name text-gothic">ゆづき(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">会いに来てくれるたび笑顔になってほしいな♡ 全力で施術して癒し、元気をチャージする存在になります🔋 心も体もふわっと軽くなるよう寄り添います✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">155㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55493"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885529_6024090.jpg" width="300" height="400" alt="みい(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">みい</div>
						<a href="/therapist/55493" class="therapist-datas-name text-gothic">みい(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">ちょっぴり甘えん坊だけど癒しは任せてね🪞 密着感あるマッサージで特別な時間をつくります🌙 笑顔でいるとお客様も笑顔になってくれるのが嬉しい💎 ドキドキもリラックスも楽しんでね💫</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">165㎝</span>
							(A)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55514"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885540_7341895.jpg" width="300" height="400" alt="こはる(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">こはる</div>
						<a href="/therapist/55514" class="therapist-datas-name text-gothic">こはる(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">元気に頑張ります✨💖 一緒にワクワクする時間を過ごしましょう♪ たくさん笑って癒されてくれたら嬉しいです☺️ 笑顔をたっぷり届けるので 会えるのを楽しみにしてます🌸</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">148㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55511"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885535_8393540.jpg" width="300" height="400" alt="しほ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">しほ</div>
						<a href="/therapist/55511" class="therapist-datas-name text-gothic">しほ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">ふんわり優しい雰囲気で癒しの時間をお届けします💗 おしゃべりでも静かな時間でも心地よく過ごしてね✨ 甘えん坊な私と特別なひとときを楽しんで💛 笑顔でお迎えします💖</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">162㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55484"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885546_3455824.jpg" width="300" height="400" alt="れん(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">れん</div>
						<a href="/therapist/55484" class="therapist-datas-name text-gothic">れん(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">皆さんに癒しと元気をお届けできるように、一生懸命がんばります✨️ れんとの楽しい時間を過ごしましょう😽 よろしくお願いします(*^^*)</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">159㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55488"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885552_4479735.jpg" width="300" height="400" alt="ゆな(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ゆな</div>
						<a href="/therapist/55488" class="therapist-datas-name text-gothic">ゆな(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">癒しの空間をお約束します♡ お話ししながらでも、静かに過ごす時間でも、居心地の良さを大切に。 心も体もふわっと軽くなるような、柔らかな時間をご一緒に🌿</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">24歳</span>
							<span class="mg-right-xs">164㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55473"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885564_9566098.jpg" width="300" height="400" alt="ももな(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ももな</div>
						<a href="/therapist/55473" class="therapist-datas-name text-gothic">ももな(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">一緒に気持ち良い時間を過ごせるようにご奉仕させてください！♡ 自然と笑顔になれるような、甘く優しい時間をお届けします☺️ 会うたびにもっと虜になってもらえるように頑張ります✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">152㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55512"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885558_8655591.jpg" width="300" height="400" alt="なのは(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">なのは</div>
						<a href="/therapist/55512" class="therapist-datas-name text-gothic">なのは(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">私を選んでよかったと思って頂けるように頑張ります！😳 あなたに笑顔になってもらえるよう精一杯施術します💗 素敵なひとときを一緒に過ごしましょう🌸😊</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">25歳</span>
							<span class="mg-right-xs">157㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55490"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885570_0007014.jpg" width="300" height="400" alt="なぎ(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">なぎ</div>
						<a href="/therapist/55490" class="therapist-datas-name text-gothic">なぎ(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">一生懸命がんばります！一緒に過ごす時間が、特別でワクワクするひとときになりますように✨ 心も体もふわっと癒されるように、精一杯ご奉仕します💖</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">156㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55513"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885576_6501604.jpg" width="300" height="400" alt="さくら(GOLD)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">さくら</div>
						<a href="/therapist/55513" class="therapist-datas-name text-gothic">さくら(GOLD)</a>
						<div class="therapist-datas-bio text-gothic">初めましてさくらです♡ 未経験な事だらけで不安もありますが 精一杯がんばります🥺💖 優しくしていただけたら嬉しいです🌸 ぜひ会いに来てくださいね♡ お待ちしてます☺️</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">160㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/60333"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1775765036_3592383.jpg" width="300" height="400" alt="ゆいな(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ゆいな</div>
						<a href="/therapist/60333" class="therapist-datas-name text-gothic">ゆいな(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">大人可愛いって言ってもらえることもあるけど、自然体が一番楽です☺️ そのままで来てくれたら嬉しいな🌷 お待ちしてます✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">23歳</span>
							<span class="mg-right-xs">158㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/56511"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772305653_2410319.jpg" width="300" height="400" alt="ももち(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ももち</div>
						<a href="/therapist/56511" class="therapist-datas-name text-gothic">ももち(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">会えたら思いきり笑って、前向きな気分で過ごしてほしいです😊にぎやかすぎないけど明るい時間を用意して待ってます🌈遊びに来てくれたら嬉しいな🎶</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">157㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55554"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885618_8720976.jpg" width="300" height="400" alt="あいな(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">あいな</div>
						<a href="/therapist/55554" class="therapist-datas-name text-gothic">あいな(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">今日もニコニコでお出迎えするよ☺️ ちょっとでも疲れが軽くなりますように✨ 一緒にたくさん思い出つくろーね🎀 みなさんにリラックスしていただけるように頑張ります♪ </div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">19歳</span>
							<span class="mg-right-xs">160㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55621"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885594_5692037.jpg" width="300" height="400" alt="よる(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">よる</div>
						<a href="/therapist/55621" class="therapist-datas-name text-gothic">よる(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">今日もたくさん笑顔になってもらえるように頑張るね♪ お兄様を癒せるように頑張ります♡ 心も体もほぐして、リラックスできる時間にしたいな✨ 一緒に楽しいひとときを過ごそうね💖</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">21歳</span>
							<span class="mg-right-xs">167㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55546"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885630_9430237.jpg" width="300" height="400" alt="ののか(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ののか</div>
						<a href="/therapist/55546" class="therapist-datas-name text-gothic">ののか(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">未経験ですがお客様に癒しをお届けできるよう笑顔で元気に頑張ります！ 丁寧に施術させていただきますので、安心してリラックスしに来ていただけると嬉しいです🌿</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">22歳</span>
							<span class="mg-right-xs">152㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55695"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1768986491_7973283.jpg" width="300" height="400" alt="ちさと(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ちさと</div>
						<a href="/therapist/55695" class="therapist-datas-name text-gothic">ちさと(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">何がわからないかもわからない未熟者ですがお兄様方の癒しになれるように頑張ります！！ 優しく教えてくださると助かります(*˘︶˘*).｡.:*♡</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">154㎝</span>
							(C)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55746"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885741_2173392.jpg" width="300" height="400" alt="こと(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">こと</div>
						<a href="/therapist/55746" class="therapist-datas-name text-gothic">こと(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">お客様に「今日一日頑張ってよかった」と思っていただけるよう 心から安らげる時間をお届けします🌸 まだ慣れない部分もありますが 出会いを大切に心を込めておもてなしします💖</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">155㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/56022"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1775913343_5313209.jpg" width="300" height="400" alt="うらら(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">うらら</div>
						<a href="/therapist/56022" class="therapist-datas-name text-gothic">うらら(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">会える時間を今からワクワクして待ってます🥰優しく癒すので、ゆったりした気分で遊びに来てくださいね🌸🎀</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">168㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55968"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772886247_1681440.jpg" width="300" height="400" alt="せれん(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">せれん</div>
						<a href="/therapist/55968" class="therapist-datas-name text-gothic">せれん(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">お会いできるのを楽しみにしています🌸疲れているところは気軽に教えてください☺️丁寧にほぐして心まで癒しますので、ゆっくりした時間を過ごしてくださいね💗</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">21歳</span>
							<span class="mg-right-xs">163㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/56557"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774699922_5805307.jpg" width="300" height="400" alt="れもん(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">れもん</div>
						<a href="/therapist/56557" class="therapist-datas-name text-gothic">れもん(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">一緒に過ごす時間が、気分転換やご褒美みたいなひとときになったら嬉しいな🥰やさしく癒します🌸</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">19歳</span>
							<span class="mg-right-xs">165㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/58773"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1775402894_5016124.jpg" width="300" height="400" alt="さや(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">さや</div>
						<a href="/therapist/58773" class="therapist-datas-name text-gothic">さや(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">ちょっと大人しく見えるかもしれないけど、甘えるのは嫌いじゃないです☺️ やさしく過ごせたら嬉しいな🌸 また会いに来てくれたら嬉しいです✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">163㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/56873"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773284425_2401143.jpg" width="300" height="400" alt="もえか(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">もえか</div>
						<a href="/therapist/56873" class="therapist-datas-name text-gothic">もえか(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">初めての経験で緊張はありますが、相手のペースを大事にしたいと思っています🌿 無理のない時間になれば嬉しいです。</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">153㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55752"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774769622_7155910.jpg" width="300" height="400" alt="ねむ(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ねむ</div>
						<a href="/therapist/55752" class="therapist-datas-name text-gothic">ねむ(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">ドキドキと癒しの体験をどうぞ♪ 逢いに来てくれるの待ってます✨ 一緒に笑顔で楽しい時間を過ごせたら嬉しいです💖 心を込めてお迎えします🌸 会えるの楽しみにしてます☺️</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">165㎝</span>
							(H)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/59380"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1775404532_5791243.jpg" width="300" height="400" alt="なずな(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">なずな</div>
						<a href="/therapist/59380" class="therapist-datas-name text-gothic">なずな(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">頑張ってるお兄さんが、少しでも楽になれる時間にしたいです🌹 疲れたときは、ゆっくり甘えてくださいね♡ 心も体もゆるむひとときを一緒に過ごしましょう✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">20歳</span>
							<span class="mg-right-xs">157㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/56043"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772886441_6628565.jpg" width="300" height="400" alt="のぞみ(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">のぞみ</div>
						<a href="/therapist/56043" class="therapist-datas-name text-gothic">のぞみ(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">お喋りも静かな時間も好きなので お客様にあわせて心地よいひと時を作れたら嬉しいです🌸 ぜひ癒されに来てください💖 笑顔でお迎えしますので安心してくださいね🍀</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">153㎝</span>
							(F)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/60097"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1775765196_1572903.jpg" width="300" height="400" alt="のあ(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">のあ</div>
						<a href="/therapist/60097" class="therapist-datas-name text-gothic">のあ(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">少しだけ照れ屋だけど、目が合うとちゃんと嬉しいです☺️ ゆるっとした時間の中で、さりげなく距離が近づけたらいいな🌸</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">156㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/58049"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774553371_3079142.jpg" width="300" height="400" alt="あお(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">あお</div>
						<a href="/therapist/58049" class="therapist-datas-name text-gothic">あお(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">会えるのを楽しみにしつつ、ちょっとドキドキしています☺️ 落ち着いた時間を一緒に過ごしましょう🌸</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">25歳</span>
							<span class="mg-right-xs">161㎝</span>
							(Ｆ)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55929"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885820_7593522.jpg" width="300" height="400" alt="ぴょな(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">ぴょな</div>
						<a href="/therapist/55929" class="therapist-datas-name text-gothic">ぴょな(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">はじめまして☺️✨ ぴょなです🌷 まだ勉強中ですが、一緒に楽しくて癒される時間を過ごせたら嬉しいです💗 お会いできるのを楽しみにしています🎀</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">21歳</span>
							<span class="mg-right-xs">160㎝</span>
							(D)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 380px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/57624"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773761799_9977855.jpg" width="300" height="400" alt="りな(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">りな</div>
						<a href="/therapist/57624" class="therapist-datas-name text-gothic">りな(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">緊張しやすいけど、慣れると自然体になります☺️ ゆるっとした時間が好きな方には、たぶん合うと思います。気軽に会いに来てくださいね🌸✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">152㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/58949"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1775565557_1947819.jpg" width="300" height="400" alt="なつ(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">なつ</div>
						<a href="/therapist/58949" class="therapist-datas-name text-gothic">なつ(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">まだ慣れないこともあるけど、その分ちゃんと向き合いたいです☺️ 癒しの時間を一緒に過ごせたら嬉しいな🌷 会いに来てくれたら嬉しいです✨</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">18歳</span>
							<span class="mg-right-xs">163㎝</span>
							(G)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/58017"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773768915_2374203.jpg" width="300" height="400" alt="さえ(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">さえ</div>
						<a href="/therapist/58017" class="therapist-datas-name text-gothic">さえ(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">お客様の心を全力で癒させていただきます✨ほっと一息は私にお任せくださいね🌸</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">25歳</span>
							<span class="mg-right-xs">156㎝</span>
							(E)
						</div>
					</div>
				</div>
			</li>
			<li class="col-sm-3 col-xs-4 col-sm mg-bottom">
				<div class="therapist-datas-each text-gothic" style="height: 394px;">
					<div class="therapist-datas-tmb">
						<a href="/therapist/55540"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1772885606_5126758.jpg" width="300" height="400" alt="れあ(SILVER)" class="therapist-data-each-tmb"></a>
					</div>
					<div class="therapist-datas-info">
						<div class="therapist-datas-kana">れあ</div>
						<a href="/therapist/55540" class="therapist-datas-name text-gothic">れあ(SILVER)</a>
						<div class="therapist-datas-bio text-gothic">れあです♡ まだ始めたばかりでちょっと緊張してますが… 優しいお兄さんたちと楽しく過ごせたらいいなって思ってます♪ いっぱい癒せるように頑張るので、ぜひ会いに来てくださいね♡</div>
						<div class="therapist-datas-spec">
							<span class="mg-right-xs">19歳</span>
							<span class="mg-right-xs">164㎝</span>
							(G)
						</div>
					</div>
				</div>
			</li>
</ul>
`;

async function main() {
  console.log('🚀 「RED RIBBON (レッドリボン)」の店舗とセラピスト登録を開始します...\n');

  try {
    // 1. locations.js に中野区・中野を追加
    console.log('⏳ locations.js を確認・修正中...');
    let locData = fs.readFileSync(locFile, 'utf8');

    // 「東京都」配列に中野区を追加
    const tokyoRegex = /"東京都":\s*\[(.*?)\]/;
    const tokyoMatch = locData.match(tokyoRegex);
    if (tokyoMatch && !tokyoMatch[1].includes('"中野区"')) {
      locData = locData.replace(tokyoRegex, `"東京都": [$1, "中野区"]`);
    }

    // 中野区のマッピングを追加
    if (!locData.includes('"中野区":')) {
      const areasEndRegex = /\};\s*export/m;
      locData = locData.replace(areasEndRegex, `  "中野区": ["中野"],\n};\nexport`);
      fs.writeFileSync(locFile, locData);
      console.log('✅ locations.js に「中野区（中野）」を追加しました。');
    }

    // 2. 店舗データの登録
    console.log('\n🏪 店舗データを登録中...');
    const SHOP_DATA = {
      id: SHOP_ID,
      name: 'RED RIBBON (レッドリボン)',
      area_id: AREA_ID,
      group_id: GROUP_ID, 
      schedule_url: 'https://namexspa.com/schedule',
      website_url: 'https://namexspa.com/',
      business_hours: '10:00〜5:00', 
      price_system: '60分 14,000円～',
      image_url: 'https://placehold.jp/e74c3c/ffffff/400x300.png?text=RED+RIBBON',
      raw_data: {
        prefecture: '東京都',
        city: '中野区',
        area: '中野',
        address: '東京都中野区中野エリア',
        system: SYSTEM_DATA // 画像から抽出した正確なコースデータ
      }
    };

    const { error: upsertErr } = await supabase.from('shops').upsert(SHOP_DATA, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;
    console.log(`✅ 店舗情報（ID: ${SHOP_ID}）を登録しました。\n`);

    // 3. セラピストの抽出と登録
    console.log(`⏳ HTMLからセラピストを抽出中...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.therapist-datas-each');

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; 

    items.each((_, el) => {
      const item = $(el);
      
      const rawNameText = item.find('.therapist-datas-name').text().trim();
      if (!rawNameText) return;

      // 「ももえ💎(DlAMOND)」のような文字列から名前とランクを分解
      const nameMatch = rawNameText.match(/^(.*?)\(/);
      const cleanName = nameMatch ? nameMatch[1].trim() : rawNameText;
      const rankMatch = rawNameText.match(/\((.*?)\)/);
      const tags = rankMatch ? [rankMatch[1]] : [];

      const specsText = item.find('.therapist-datas-spec').text().replace(/\s+/g, ' ').trim();
      const ageMatch = specsText.match(/(\d+)歳/);
      const heightMatch = specsText.match(/(\d+)㎝/);
      const cupMatch = specsText.match(/\(([A-Z])\)/);

      const age = ageMatch ? `${ageMatch[1]}歳` : '';
      const height = heightMatch ? `${heightMatch[1]}cm` : '';
      const cup = cupMatch ? `${cupMatch[1]}カップ` : '';

      let fullBio = '';
      if (age) fullBio += `年齢: ${age} `;
      if (height) fullBio += `身長: ${height}\n`;
      if (cup) fullBio += `サイズ: ${cup}`;

      const bioText = item.find('.therapist-datas-bio').text().trim();

      // 同名回避
      let finalNameId = cleanName.replace(/\s/g, '_');
      if (seenNames[finalNameId]) {
        seenNames[finalNameId]++;
        finalNameId = `${finalNameId}_${seenNames[finalNameId]}`; 
      } else {
        seenNames[finalNameId] = 1;
      }
      
      const imageUrl = item.find('.therapist-data-each-tmb').attr('src') || '';

      newTherapists.push({
        id: `${SHOP_ID}_${finalNameId}`,
        shop_id: SHOP_ID,
        name: cleanName, 
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: {
          tags: tags,
          bio: (fullBio + '\n\n' + bioText).trim(),
          original_name: rawNameText
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

    // 4. ローカルJSONへの同期
    console.log('\n⏳ 最新のデータをローカルファイルに同期中...');
    const { data: allShops, error: allErr } = await supabase.from('shops').select('*');
    if (allErr) throw allErr;

    const paths = [
      path.resolve('src/data/shops.json'),
      path.resolve('public/data/shops.json')
    ];
    
    paths.forEach(p => {
      if (fs.existsSync(p)) {
        fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
      }
    });

    console.log(`\n🎉 登録と同期が完了しました！`);
    console.log('Viteサーバーを再起動（Ctrl+C -> npm run dev）し、ブラウザで「中野」エリアをご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
