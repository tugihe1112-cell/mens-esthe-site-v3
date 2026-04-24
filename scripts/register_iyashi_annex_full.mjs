import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://iyashinokuukan.net';
const SHOP_ID = 'tokyo_taito_ueno_iyashi_annex'; // 既存の枠を想定
const GROUP_ID = 'g_iyashi_annex'; 

// ユーザーから提供されたHTMLデータ（12名分）
const HTML_CONTENT = `
<div class="cast__list__wrapper"><div class="cast__list__container columns-pc-4 columns-sp-2">
<div class="cast__item animation fadeInUp is__animated">
        <div class="cast__thumb">
                                                    <span class="label__new__cast">NEW</span>
                            <a href="/casts/cast-9335">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2026/04/S__31825923_0-600x900.jpg" alt="みずき" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2026/04/S__31825923_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2026/04/S__31825923_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2026/04/S__31825923_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2026/04/S__31825923_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">みずき							(28歳)
			        </span>
        <div class="sns__icon__wrapper">
                                                                                                </div>
        <span class="cast__size">
                            T168                                                            (F)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        NEW                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        上品                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        優しい                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        美人                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp is__animated">
        <div class="cast__thumb">
                                                    <span class="label__new__cast">NEW</span>
                            <a href="/casts/cast-9102">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2026/03/S__30900277_0-600x901.jpg" alt="るい" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2026/03/S__30900277_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2026/03/S__30900277_0-600x901.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2026/03/S__30900277_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2026/03/S__30900277_0-800x1201.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">るい							(29歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/@rui_annex" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T162                                                            (C)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        NEW                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        美人                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        上品                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        スレンダー                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp is__animated">
        <div class="cast__thumb">
                                                    <span class="label__new__cast">NEW</span>
                            <a href="/casts/cast-8752">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2026/01/S__29204488_0-600x900.jpg" alt="ゆい" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2026/01/S__29204488_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2026/01/S__29204488_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2026/01/S__29204488_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2026/01/S__29204488_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">ゆい							(28歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/yui_annex0103" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                        <a href="https://lin.ee/zbaxqXu" target="_blank" class="line__icon">
                    <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-line.svg" alt="セラピストLINE">
                </a>
                                </div>
        <span class="cast__size">
                            T153                                                            (F)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        NEW                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        施術上手                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        愛嬌抜群                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        美人                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp is__animated">
        <div class="cast__thumb">
                                                    <a href="/casts/cast-8198">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/11/S__27549701_0-600x900.jpg" alt="さら" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/11/S__27549701_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/11/S__27549701_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/11/S__27549701_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/11/S__27549701_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">さら							(22歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/sara_iyashi" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T164                                                            (F)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        スタイル抜群                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        上品                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        可愛い                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        愛嬌抜群                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp is__animated">
        <div class="cast__thumb">
                                                    <a href="/casts/cast-7796">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/10/S__26845190_0-600x900.jpg" alt="すずか" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/10/S__26845190_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/10/S__26845190_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/10/S__26845190_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/10/S__26845190_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">すずか							(22歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/icezuka1" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T160                                                            (C)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        可愛い                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        スタイル抜群                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        美人                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        おすすめ                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp is__animated">
        <div class="cast__thumb">
                                                    <a href="/casts/cast-7892">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/10/S__91660295_0-600x900.jpg" alt="のの" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/10/S__91660295_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/10/S__91660295_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/10/S__91660295_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/10/S__91660295_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">のの							(26歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/ANNEX_nono" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T150                                                            (E)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        おっとり                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        優しい                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        明るい                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        癒し系                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp is__animated">
        <div class="cast__thumb">
                                                    <a href="/casts/cast-8870">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2026/02/S__29351951_0-600x900.jpg" alt="ちい" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2026/02/S__29351951_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2026/02/S__29351951_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2026/02/S__29351951_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2026/02/S__29351951_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">ちい							(25歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/@YPy7t5" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T162                                                            (C)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        おすすめ                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        スタイル抜群                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        可愛い                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        好奇心旺盛                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp is__animated">
        <div class="cast__thumb">
                                                    <a href="/casts/cast-6327">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90677301_0-600x900.jpg" alt="りな" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90677301_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90677301_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90677301_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90677301_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">りな							(29歳)
			        </span>
        <div class="sns__icon__wrapper">
                                                                                                </div>
        <span class="cast__size">
                            T155                                                            (D)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        美人                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        上品                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        スレンダー                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        施術上手                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp">
        <div class="cast__thumb">
                                                    <a href="/casts/cast-7494">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2026/03/S__31178756_0-600x900.jpg" alt="あかね" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2026/03/S__31178756_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2026/03/S__31178756_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2026/03/S__31178756_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2026/03/S__31178756_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">あかね							(27歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/akameannex" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T152                                                            (E)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        おっとり                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        優しい                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        清楚系                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        癒し系                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp">
        <div class="cast__thumb">
                                                    <a href="/casts/cast-6336">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/10/S__26263568_0-600x900.jpg" alt="みさき" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/10/S__26263568_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/10/S__26263568_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/10/S__26263568_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/10/S__26263568_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">みさき							(28歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/rGZrJxDj864ugVB" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T154                                                            (G)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        施術上手                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        美人                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        おすすめ                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        上品                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp">
        <div class="cast__thumb">
                                                    <a href="/casts/cast-6291">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__26025994_0-600x900.jpg" alt="しほ" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__26025994_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__26025994_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__26025994_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__26025994_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">しほ							(23歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/iyashi_4ho" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T157                                                            (C)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        スレンダー                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        可愛い                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        好奇心旺盛                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        清楚系                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp">
        <div class="cast__thumb">
                                                    <a href="/casts/cast-6323">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/08/S__89874435-600x900.jpg" alt="れな" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/08/S__89874435-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/08/S__89874435-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/08/S__89874435-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/08/S__89874435-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">れな							(27歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/lena_lena2222" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T153                                                            (E)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        愛嬌抜群                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        施術上手                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        癒し系                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        美人                    </span>
                </li>
                    </ul>
            </div>
</div>
</div></div>
`;

async function main() {
  console.log('🚀 「癒しの空間 Annex」の店舗更新とセラピスト登録を開始します...\n');

  try {
    // 1. 店舗の登録（既存の tokyo_taito_ueno を利用・上書き）
    console.log('🏪 店舗データを更新中...');
    
    // システム画像からデータを推測
    const SHOP_DATA = {
      id: SHOP_ID,
      name: '癒しの空間 Annex',
      area_id: 'tokyo_taito_ueno', // 既存の上野エリア
      group_id: GROUP_ID, // クチコミ吸収用
      schedule_url: 'https://iyashinokuukan.net/schedule/',
      website_url: 'https://iyashinokuukan.net/',
      business_hours: '10:00〜05:00', 
      price_system: '90分 14,000円～',
      image_url: 'https://placehold.jp/16a085/ffffff/400x300.png?text=%E7%99%92%E3%81%97%E3%81%AE%E7%A9%BA%E9%96%93', // 仮画像
      raw_data: {
        prefecture: '東京都',
        city: '台東区',
        area: '上野',
        address: '東京都台東区上野エリア',
        system: [
          {
            courseName: 'Relaxation Course',
            description: 'アロマオイルを用いた全身トリートメント',
            prices: [
              { time: '90min', price: '14,000円' },
              { time: '120min', price: '18,000円' },
              { time: '150min', price: '23,000円' }
            ]
          },
          {
            courseName: 'Premium Course',
            description: 'ご案内はご指名のみとなります。極上の癒しと高技術を兼ね備えたセラピストが「あなた」を日常の疲れから解き放ちます。',
            prices: [
              { time: '120min', price: '23,000円' },
              { time: '150min', price: '28,000円' }
            ]
          }
        ]
      }
    };

    const { error: upsertErr } = await supabase.from('shops').upsert(SHOP_DATA, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;
    console.log(`✅ 店舗情報をID「${SHOP_ID}」で更新しました。\n`);

    // 2. HTMLからセラピストをパース
    console.log(`⏳ HTMLからセラピストを抽出中...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.cast__item');

    let newTherapists = [];
    const now = new Date().toISOString();

    items.each((_, el) => {
      const item = $(el);
      
      const nameText = item.find('.cast__name').text().trim();
      if (!nameText) return;

      const cleanNameMatch = nameText.match(/^([^\(]+)/);
      const cleanName = cleanNameMatch ? cleanNameMatch[1].trim() : nameText;
      
      const ageMatch = nameText.match(/\((\d+)歳\)/);
      const age = ageMatch ? `${ageMatch[1]}歳` : '';

      let imageUrl = item.find('img').attr('src') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https://iyashinokuukan.net${imageUrl}`;
      }
      
      const sizeText = item.find('.cast__size').text().replace(/\s+/g, ' ').trim();
      let height = '';
      let cup = '';
      
      const hMatch = sizeText.match(/T(\d+)/);
      if (hMatch) height = hMatch[1] + 'cm';
      
      const cMatch = sizeText.match(/\(([A-Z])\)/);
      if (cMatch) cup = cMatch[1] + 'カップ';

      const isNew = item.find('.label__new__cast').length > 0;
      const tags = [];
      if(isNew) tags.push('新人');

      item.find('.type__label span').each((_, tagEl) => {
          const tag = $(tagEl).text().trim();
          if(tag !== 'NEW') tags.push(tag);
      });

      let fullBio = '';
      if (age) fullBio += `年齢: ${age} `;
      if (height) fullBio += `身長: ${height} `;
      if (cup) fullBio += `カップ: ${cup}`;

      newTherapists.push({
        id: `${SHOP_ID}_${cleanName}`,
        shop_id: SHOP_ID,
        name: cleanName,
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: {
          tags: tags,
          bio: fullBio.trim(),
          original_name: nameText
        }
      });
    });

    console.log(`✅ ${newTherapists.length} 名のセラピストデータを抽出しました。`);

    // 3. Supabaseへの登録
    console.log(`🗑️ 古いセラピストデータをクリアしています...`);
    await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);

    console.log(`📦 新しいデータを登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    console.log(`\n🎉 登録完了！「癒しの空間 Annex（上野）」に店舗と ${newTherapists.length}名のセラピストが登録されました。`);
    console.log('ブラウザでスーパーリロードしてご確認ください！');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
