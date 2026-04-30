import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const locFile = path.resolve('src/data/locations.js');
const GROUP_ID = 'g_crest_spa';
const BASE_URL = 'https://crestspa-tokyo.com';

// --------------------------------------------------
// 料金システム (画像から抽出)
// --------------------------------------------------
const SYSTEM_DATA = [
  {
    courseName: '基本コース',
    description: '',
    prices: [
      { time: '90min', price: '20,000円' },
      { time: '120min', price: '24,000円' },
      { time: '150min', price: '29,000円' },
      { time: '180min', price: '36,000円' }
    ]
  }
];

// --------------------------------------------------
// 店舗設定
// --------------------------------------------------
const SHOPS = [
  {
    id: 'tokyo_tachikawa_tachikawa_crest',
    name: 'CREST SPA TOKYO (立川)',
    area_id: 'tokyo_tachikawa_tachikawa',
    raw_data: { prefecture: '東京都', city: '立川市', area: '立川', address: '東京都立川市エリア', system: SYSTEM_DATA }
  },
  {
    id: 'tokyo_suginami_ogikubo_crest',
    name: 'CREST SPA TOKYO (荻窪)',
    area_id: 'tokyo_suginami_ogikubo',
    raw_data: { prefecture: '東京都', city: '杉並区', area: '荻窪', address: '東京都杉並区荻窪エリア', system: SYSTEM_DATA }
  },
  {
    id: 'tokyo_kita_akabane_crest',
    name: 'CREST SPA TOKYO (赤羽)',
    area_id: 'tokyo_kita_akabane',
    raw_data: { prefecture: '東京都', city: '北区', area: '赤羽', address: '東京都北区赤羽エリア', system: SYSTEM_DATA }
  },
  {
    id: 'tokyo_musashino_kichijoji_crest',
    name: 'CREST SPA TOKYO (吉祥寺)',
    area_id: 'tokyo_musashino_kichijoji',
    raw_data: { prefecture: '東京都', city: '武蔵野市', area: '吉祥寺', address: '東京都武蔵野市吉祥寺エリア', system: SYSTEM_DATA }
  }
];

const HTML_CONTENT = `
<section class="staffsView clearfix pdTop70 pdBottom140 m-pdTop30 m-pdBottom50">
  <div class="staffsViewCont cont">
    <div class="sectionTitle sectionTitleLine textCenter">
      <h2 class="sectionTitleTop">THERAPIST</h2>
    </div>
    <div class="sectionDesc textCenter">
      <p>セラピスト</p>
    </div>
    <div class="todayStaffList clearfix">
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/338">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/320/bf068394-533f-4b2d-8f66-f37f16f6481d.jpg" class=" lazyloaded" src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/320/bf068394-533f-4b2d-8f66-f37f16f6481d.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
              水野 はれ(24歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/@ha_re_c">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Dcup　83/ 57/ 88
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/325">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/308/ecdc0135-cab8-4465-9396-146d0b654031.jpg" class=" lazyloaded" src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/308/ecdc0135-cab8-4465-9396-146d0b654031.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            九条 れいな(24歳)
            <span class="twitter">
            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup   87/57/84
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/317">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/303/6085474e-dc9e-4728-8c0c-955304ddb2f6.jpg" class=" lazyloaded" src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/303/6085474e-dc9e-4728-8c0c-955304ddb2f6.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            宮乃 あやか(22歳)
            <span class="twitter">
            </span>
          </h3>
          <div>
              <p class="plusprofile">
                D cup　85/ 57/ 86
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/324">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/307/f96798d6-4fba-4e4e-9cb6-fbac616b5616.jpg" class=" lazyloaded" src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/307/f96798d6-4fba-4e4e-9cb6-fbac616b5616.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            千早 あのん(26歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/crest_anonx">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Dcup B85/W56/H83
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/328">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/311/04457c64-2046-4505-8830-08da18b526ec.jpg" class=" lazyloaded" src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/311/04457c64-2046-4505-8830-08da18b526ec.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            雪白 ひめ(23歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/yukishirohime03">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Dcup B84/W58/H87
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/320">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/304/4e326fd6-4563-4ea5-bfd6-581177a61fbc.jpg" class=" lazyloaded" src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/304/4e326fd6-4563-4ea5-bfd6-581177a61fbc.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            桃宮 あかり(21歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/m0m0_AKR_cS">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Fcup  87/56/86
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/337">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/319/c966d427-bb84-45e1-a4d9-bb681d1dd7a8.jpg" class=" lazyloaded" src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/319/c966d427-bb84-45e1-a4d9-bb681d1dd7a8.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            神田 あいか(23歳)
            <span class="twitter">
            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup  82/55/85
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/323">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/312/7a69f6ea-69b8-43a6-bf4f-93f2188b80d2.jpg" class=" lazyloaded" src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/312/7a69f6ea-69b8-43a6-bf4f-93f2188b80d2.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            犬飼 むぎ(21歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/pa07898">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup B90/W58/H88
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/346">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/327/bf0c91eb-f11d-483e-bb83-a1789c9cc37e.jpg" class=" lazyloaded" src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/327/bf0c91eb-f11d-483e-bb83-a1789c9cc37e.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            伊織 せら(22歳)
            <span class="twitter">
            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup B83/W57/H84
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/343">
        <div class="itemImg itemImgZoom">
          <img data-src="/assets/customer/no_image-6141d766159abbe8d293479e86842321a763bc2ef390f78c223a5c3e2e66a43d.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            桃乃 かぐや(20歳)
            <span class="twitter">
            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Fcup B88/W57/H87
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/10">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/9/2585ca67-9f41-4402-aed3-bdf37e8fffff.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>体験記事</label>
          <label>-ＰＬＡＴＩＮＵＭ-</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            花宮 るる(26歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/@crest_ru">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Fcup B89/W58/H88
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/197">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/185/3b1a64d8-97e5-4fe5-a5a1-b16addb16fc4.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>-ＰＬＡＴＩＮＵＭ-</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            星空 ののか(22歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/starnnkcrest">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Fcup B88/W57/H86
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/113">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/109/e0593d69-20cf-44b2-8bfa-0752b8e5f269.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>-ＰＬＡＴＩＮＵＭ-</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            河北 みれい(24歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/crestspa_mri">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup B83/W57/H82
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/261">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/248/4944eca4-bdd6-4928-b1fb-e276452160a2.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>体験記事</label>
          <label>ｰＧＯＬＤｰ</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            雨宮 ゆう(24歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/@AmamiyaYou_">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup B87/W58/H86
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/267">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/253/585b997b-95fc-4ffd-9310-abb17d33662a.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>ｰＧＯＬＤｰ</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            愛坂 れん(27歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/AISAKA___REN">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Fcup B90/W56/H84
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/225">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/213/4c6acd46-4a3e-4355-adc7-75f86ce326ba.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>体験記事</label>
          <label>ｰＧＯＬＤｰ</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            真鍋 すい(25歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/su_i_0nphCxxxS">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup B86/W57/H84
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/268">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/254/5984cd64-f5a0-40a3-9704-ba879a86cc92.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>ｰＧＯＬＤｰ</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            早瀬 めぐみ(18歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/hayasemegumi_">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup B83/W56/H84
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/73">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/71/bdbc2252-0713-4004-be8b-092b28de4eea.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>ｰＧＯＬＤｰ</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            浅海 るみ(22歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/vy2mc">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup B87/W58/H85
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/85">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/81/d6e81e3b-0c9e-4d4b-a48c-8998440f8f8a.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>体験記事</label>
          <label>ｰＧＯＬＤｰ</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            白石 りん(26歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/spa_sira52">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ｇcup B95/W59/H88
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/279">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/265/10a9cf71-bbc9-4937-8142-9d61613c525b.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>ｰＧＯＬＤｰ</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            日向 ゆい(26歳)
            <span class="twitter">
            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup B87/W58/H86
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/146">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/141/7a7ceaf4-f334-4a2f-89c1-09addd7fd149.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>ｰＧＯＬＤｰ</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            高宮 えれな(21歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/crest_takamy">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Fcup B91/W58/H87
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/250">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/237/17f1a4be-c741-4e5a-a7ec-2440c32e1c8b.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>ｰＧＯＬＤｰ</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            霧里 しずく(21歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/CREST_shizuku">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup B85/W57/H83
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/76">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/73/337ac9af-2464-4d2b-baa2-209daf7f41dd.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>体験記事</label>
          <label>ｰＧＯＬＤｰ</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            月乃 るな(23歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/crestspa_luna">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Dcup B84/W57/H83
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/278">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/264/ece18df3-bead-41eb-9ce8-68ee8d62b4bf.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            柊木 しほ(23歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/XKSkm8">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup B84/W57/H83
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/296">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/280/ba07fc02-e118-4be4-8223-7dbcf1259e84.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            神咲 さくら(21歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/@kanzaki_sakura_">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Fcup 90/57/89
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/259">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/246/51afe27e-4980-4092-ae2e-87a24a2f9e8c.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            七泉 まりか(22歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/crest_0011">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup B84/W56/H83
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/243">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/231/678bd54c-deac-4561-92cc-1374e2e0549c.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            佐倉 ひなこ(24歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/crest_hinako_s">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ｇcup B96/W59/H90
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/273">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/259/a0f91f6f-2375-46af-a8b7-97a3dbf8c3c1.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            風見 れお(24歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/reokazamami">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup B85/W58/H86
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/239">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/228/da487380-df3f-4e3f-9a16-51280912b85d.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            朝比奈 まゆ(19歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/asahina0mayu">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Dcup B85/W58/H83
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/301">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/285/7eab3e81-c47f-4604-b32b-664263c6e45a.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            爆撃 もりこ(26歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/moriko_tubuyaki">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ｇcup B95/W58/H90
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/272">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/258/453d9e13-6113-48e1-a664-2c0f06dd1586.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            降田 れい(24歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/@0_chan_crest">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Dcup B86/W58/H88
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/289">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/275/65c246ec-0abf-4cf5-8fd5-b4c6e4c48488.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            篠崎 みな(24歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/crestspa__mina">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup B84/W58/H86
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/41">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/40/db7c0012-819c-4d72-8ed9-18c487f7ce4b.png" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            滝沢 りな(23歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/crest_takirina">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Dcup B84/W57/H83
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/77">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/74/43955d4e-33ad-456a-8ab5-59f6d38fd9c6.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            加賀美 るい(20歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/crestspa_kagami">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup B85/W58/H86
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/310">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/295/8a0052da-bfa3-4d3b-a4a6-72477a5f5220.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            美澄 こころ(24歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/kokoro_crest">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup 88/58/86
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/254">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/241/e9c3642b-54e8-4581-a813-947653bb431a.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            宮園 あいり(22歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/crest_airi">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Dcup B86/W58/H87
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/309">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/293/55638498-23b1-452c-9d82-9d5d3a011820.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            榊 りりあ(24歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/s2ririachus2">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup  B84/W57/H82
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/269">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/255/713f1529-5772-4666-8e89-4d201e895717.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            楪 つむぎ(20歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/YZ_tmgAC">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Dcup B86/W57/H84
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/262">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/249/4a900b82-54a9-4055-95e6-9b97a51e4e27.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            宮下 あいね(21歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/@mgrkjw">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Dcup B86/W58/H87
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/238">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/226/b3b54444-2817-4602-a541-8c2e5e18a5e0.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            花倉 もな(24歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/mona_hanakura">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup B84/W57/H85
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/304">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/291/c7dbbdee-c68a-421f-9392-b3b47960d9a7.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            霧島 ゆうか(27歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/yuuka_kiri">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup B84/W56/H83
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/307">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/290/a5cd552d-079b-43b3-a0ba-9e6f8dc42c3b.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            小倉 ももか(24歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/heart_xoo">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup B82/W56/H83
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/302">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/286/30b6f11e-9767-4eea-9854-e7232eba3812.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            広瀬 りこ(25歳)
            <span class="twitter">
            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Fcup B90/W57/H87
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/306">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/289/73cc7d4b-7d3f-4214-9e6d-ece34f62cf0a.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            桜庭 こはる(22歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/koharu_crestspa">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Fカップ B90/W58/H88
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/308">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/292/14fe2398-04a8-467c-a17e-8669c1ffdd3a.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            東堂 なのは(25歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/nanoha_cr">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup  88/58/86
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/305">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/288/0546deeb-75a1-48c4-9588-e6e83f29607a.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            高梨 わかな(22歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/crest_wakana">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Fカップ　B88/W58/H88
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/193">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/181/a06870f9-17a0-4969-ba1c-5efff5a6e7e0.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            愛沢 みなみ(25歳)
            <span class="twitter">
            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Dcup B85/W57/H84
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/295">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/279/7abafd9d-6a13-49d9-bfb1-53235e24bc5a.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            長瀬 みずな(20歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/@mnm_este">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup B85/W57/H84
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/311">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/294/2e7e4f59-54ce-4b8d-a92e-7a4df9746737.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            彩美 かのん(25歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/crest_ayami">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup B87/W57/H86
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/255">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/242/3faa8d9f-f743-4ac7-80a3-ba4caaef6e89.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            凪乃 なの(26歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/_nana_7_7_na_">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Dcup B86/W58/H88
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/260">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/247/21822688-b28e-4c48-bc6f-b6174034fe5e.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            森 みつき(20歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/mitsukimori1617">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup B85/W59/H86
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/274">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/260/90c0f4d8-21e9-4b5e-8efa-f9957d9a3881.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            新井 よしの(23歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/arai_yoshino">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup B87/W58/H86
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/282">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/268/1fbfe5f8-6944-4fca-b0f4-4597fbe9d061.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            和泉 せりな(26歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/iz__mi__">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Dcup B86/W58/H88
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/252">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/240/993fdaaf-1ab4-445c-91aa-5f8669b035ae.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            大槻 ゆい(25歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/ootsuki_yui_">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup B86/W57/H85
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/138">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/133/88208335-a443-4b3c-adea-c0dc4e70387f.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            如月 ゆき(24歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/@Yukisaragi_2">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Fcup B89/W57/H86
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/142">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/137/623bb5f0-96be-4d84-bad0-1cfb4d64951a.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            小笠原 あず(27歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/azu_crest">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup B85/W58/H86
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/340">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/323/61fbdb6b-80a5-453c-aebf-a8b0e45aeaca.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            菊池 みおん(21歳)
            <span class="twitter">
            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ｇcup 
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/247">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/236/efd17bce-b7f0-4d47-83f3-bac3156e1ad5.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            村野 ありさ(25歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/arisa44895">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup B86/W58/H85
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/80">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/76/9f6da973-903c-47bb-945f-1768a8480169.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            白雪 ゆめ(23歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/aai3_g">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup B84/W57/H83
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/270">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/256/7dad7ea7-345e-46d7-8c6b-b91f232a55e9.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            西園 まな(27歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/aromacha_mana_">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Dcup B86/W59/H87
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/203">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/191/6ee0ae80-a966-41f3-aff8-908c462afca0.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            鹿目 みほ(26歳)
            <span class="twitter">
            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ｇcup B92/W59/H89
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/339">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/322/0ad65020-318b-4bcd-9372-0c8df93baa43.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            白波 りか(22歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/aa9425381195326">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Gcup B99/W59/H90
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/333">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/316/a3b39666-beb1-4760-a4fe-fdb3e6e5e8c6.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            瀬良 あおい(23歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/sera_aoi_">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Dcup B84/W56/H83
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/348">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/329/272b1491-fa7c-48eb-a424-80c0f0c94559.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            桜葉 りお(20歳)
            <span class="twitter">
            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Dcup B84/W57/H85
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/341">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/324/627243c7-fcf6-4365-983d-45fcdc1099f3.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            美月 なほ(24歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/naho_crestspa">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup B86/W57/H85
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/332">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/315/6444c0b7-0895-4381-af28-f897567f8379.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            月城 ゆあ(21歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/crestspa_yua">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Bcup B82/W57/H83
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/334">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/317/77459cbb-1be6-41ec-8ce6-8f798d09d119.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            神楽 なつき(24歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/natuki_kagura">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup B81/W52/H82
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/322">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/306/64249f3e-9a50-4db5-9fb3-714d339bd9bd.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            一ノ瀬 ねね(26歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/crestspa_nene">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Fcup B90/W58/H88
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/176">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/164/4bffce78-b97d-40b1-a3de-7a89ae0a2931.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            加藤 のあ(21歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/kato_noah72">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup B87/W58/H85
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/347">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/328/ec23afd4-19de-405a-937d-68cf9b4734e8.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            近藤 みのり(27歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/minori_k_crest">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup B86/W58/H87
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/319">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/302/297af87d-6b07-4b90-b8d6-cbb500c533f2.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            桜井 りおな(25歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/_noodleshop_">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Fcup B88/W58/H87
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/344">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/326/069a1502-a6b8-4b4b-b32d-a141a63ef7d2.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            湊 なみ(23歳)
            <span class="twitter">
            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ccup 84/57/83
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/227">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/214/c2c42f44-0034-4597-a1c1-a24b709272ce.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            結城 かれん(23歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/karen_crestspa">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Fcup B90/W59/H89
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/256">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/243/e2f84064-4498-4e7e-bad1-f14ff0b76048.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            城咲 えり(20歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/@k3EqzJzjYqvuLWE">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup B86/W57/H85
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/199">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/187/b100db3f-041f-4d5a-b0c6-d6a2cf2f31b4.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            成瀬 みりあ(20歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/miria_crest">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Icup B98/W58/H88
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/95">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/91/72f093ea-2138-4ebd-b522-016aee96ffa7.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>ｰＧＯＬＤｰ</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            小泉 ひな(23歳)
            <span class="twitter">
            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ecup B87/W58/H86
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/299">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/283/e2352bc9-269a-4d26-9c7b-03d30efdd7eb.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            海老原 さよ(23歳)
            <span class="twitter">
            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Ｇcup B92/W58/H88
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/1">
        <div class="itemImg itemImgZoom">
          <img data-src="https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/1/09e21501-f246-48cb-ba7e-22addd0c741f.png" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            セラピスト大募集中♪(20歳)
            <span class="twitter">
              <a target="_blank" alt="Twitter" href="https://twitter.com/CREST_secret1">
                <img class="twitterIcon" src="/assets/customer/xIcon-f1b93b2d092b555bf37142a18d2e33d017608daf1f67faa7dd6ca6ce3f3c1ef6.png">
</a>            </span>
          </h3>
          <div>
              <p class="plusprofile">
                B.86(C) W.60 H.84
              </p>
            </div>
        </div>
      </div>
      <div class="item clearfix ">
        <a data-turbolinks="false" href="/therapist/342">
        <div class="itemImg itemImgZoom">
          <img data-src="/assets/customer/no_image-6141d766159abbe8d293479e86842321a763bc2ef390f78c223a5c3e2e66a43d.jpg" class="lazyload" src="/assets/customer/lazy/therapist_image-089aa495302f3f2b0844e655ff8d1e978885b8291f9e89812688cde0e771c488.jpg">
        </div>
</a>
        <div class="mark">
          <label>NEW</label>
        </div>

        <div class="itemInfo itemInfoBust">
          <h3 class="itemName">
            浅倉 ほの(24歳)
            <span class="twitter">
            </span>
          </h3>
          <div>
              <p class="plusprofile">
                Fcup B87/W56/H84
              </p>
            </div>
        </div>
      </div>
    </div>

  </div>
</section>
`;

async function main() {
  console.log('🚀 「CREST SPA TOKYO (クレストスパ)」の登録を開始します...\n');

  try {
    // 1. locations.js の確認と修正
    console.log('⏳ locations.js に不足しているエリアを追加中...');
    let locData = fs.readFileSync(locFile, 'utf8');
    let isLocUpdated = false;

    // 東京都の配列に市区を追加
    const tokyoRegex = /"東京都":\s*\[(.*?)\]/;
    const tokyoMatch = locData.match(tokyoRegex);
    if (tokyoMatch) {
      let tokyoAreas = tokyoMatch[1];
      if (!tokyoAreas.includes('"立川市"')) { tokyoAreas += `, "立川市"`; isLocUpdated = true; }
      if (!tokyoAreas.includes('"北区"')) { tokyoAreas += `, "北区"`; isLocUpdated = true; }
      if (!tokyoAreas.includes('"武蔵野市"')) { tokyoAreas += `, "武蔵野市"`; isLocUpdated = true; }
      if (isLocUpdated) {
        locData = locData.replace(tokyoRegex, `"東京都": [${tokyoAreas}]`);
      }
    }

    // 各市区のマッピングを追加
    const areasEndRegex = /\};\s*export/m;
    let newMappings = '';
    if (!locData.includes('"立川市":')) newMappings += `  "立川市": ["立川"],\n`;
    if (!locData.includes('"北区":')) newMappings += `  "北区": ["赤羽"],\n`;
    if (!locData.includes('"武蔵野市":')) newMappings += `  "武蔵野市": ["吉祥寺"],\n`;

    if (newMappings) {
      locData = locData.replace(areasEndRegex, `${newMappings}};\nexport`);
      isLocUpdated = true;
    }

    if (isLocUpdated) {
      fs.writeFileSync(locFile, locData);
      console.log('✅ locations.js に 立川、赤羽、吉祥寺 のエリア情報を追加しました。');
    } else {
      console.log('⚠️ locations.js は既に最新の状態です。');
    }

    // 2. 店舗データの登録 (4店舗)
    console.log('\n🏪 4店舗分の店舗データを登録中...');
    for (const shop of SHOPS) {
      const shopData = {
        id: shop.id,
        name: shop.name,
        area_id: shop.area_id,
        group_id: GROUP_ID,
        schedule_url: 'https://crestspa-tokyo.com/schedule',
        website_url: 'https://crestspa-tokyo.com/',
        business_hours: '営業時間要確認',
        price_system: '90分 20,000円～',
        image_url: 'https://placehold.jp/9b59b6/ffffff/400x300.png?text=CREST+SPA',
        raw_data: shop.raw_data
      };
      const { error: upsertErr } = await supabase.from('shops').upsert(shopData, { onConflict: 'id' });
      if (upsertErr) throw upsertErr;
    }
    console.log(`✅ 4店舗（立川、荻窪、赤羽、吉祥寺）の登録が完了しました。\n`);

    // 3. セラピストの抽出と登録
    console.log(`⏳ HTMLからセラピストを抽出中（今回は便宜上、全員を「立川店」に紐付けます）...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.todayStaffList .item');

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; 
    const REP_SHOP_ID = SHOPS[0].id; // 立川店を代表に

    items.each((_, el) => {
      const item = $(el);
      
      let rawNameText = item.find('.itemName').text().replace(/\n/g, '').trim();
      if (!rawNameText || rawNameText.includes('大募集中')) return;

      // "水野 はれ(24歳)" などをパース
      const nameMatch = rawNameText.match(/^(.*?)\s*\(/);
      const cleanName = nameMatch ? nameMatch[1].trim() : rawNameText.split('(')[0].trim();
      const ageMatch = rawNameText.match(/\((\d+)歳\)/);
      const age = ageMatch ? `${ageMatch[1]}歳` : '';

      const specText = item.find('.plusprofile').text().trim(); // 例: "Dcup　83/ 57/ 88"
      
      const tags = [];
      item.find('.mark label').each((_, labelEl) => {
        tags.push($(labelEl).text().trim());
      });

      let fullBio = '';
      if (age) fullBio += `年齢: ${age}\n`;
      if (specText) fullBio += `サイズ: ${specText}`;

      let finalNameId = cleanName.replace(/\s/g, '_');
      if (seenNames[finalNameId]) {
        seenNames[finalNameId]++;
        finalNameId = `${finalNameId}_${seenNames[finalNameId]}`; 
      } else {
        seenNames[finalNameId] = 1;
      }
      
      let imageUrl = item.find('.itemImg img').attr('data-src') || item.find('.itemImg img').attr('src') || '';

      newTherapists.push({
        id: `${REP_SHOP_ID}_${finalNameId}`,
        shop_id: REP_SHOP_ID,
        name: cleanName, 
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: {
          tags: tags,
          bio: fullBio.trim(),
          original_name: rawNameText
        }
      });
    });

    console.log(`✅ ${newTherapists.length} 名のセラピストデータを抽出しました。`);

    console.log(`🗑️ 古いセラピストデータをクリアしています...`);
    for (const shop of SHOPS) {
       await supabase.from('therapists').delete().eq('shop_id', shop.id);
    }

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
    console.log('Viteサーバーを再起動（Ctrl+C -> npm run dev）して、立川・荻窪・赤羽・吉祥寺の各エリアをご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
