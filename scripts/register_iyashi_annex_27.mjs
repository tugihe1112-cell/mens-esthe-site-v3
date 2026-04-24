import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://iyashinokuukan.net';
const SHOP_ID = 'tokyo_taito_ueno_iyashi_annex'; 

// ユーザーから提供されたHTMLデータ（27名フルバージョン）
const HTML_CONTENT = `
<div class="cast__list__container columns-pc-4 columns-sp-2">
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
<div class="cast__item animation fadeInUp is__animated">
        <div class="cast__thumb">
                                                    <a href="/casts/cast-6313">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__25862191_0-600x900.jpg" alt="らな" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__25862191_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__25862191_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__25862191_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__25862191_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">らな							(21歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/TuOzBtFL9Z82282" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T158                                                            (D)
                                </span>
         <ul class="type__labels">
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
                        愛嬌抜群                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        明るい                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp is__animated">
        <div class="cast__thumb">
                                                    <a href="/casts/cast-6311">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/10/S__26337290_0-600x900.jpg" alt="ねお" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/10/S__26337290_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/10/S__26337290_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/10/S__26337290_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/10/S__26337290_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">ねお							(25歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/iyashikukan_neo" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T157                                                            (D)
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
                                                    <a href="/casts/cast-6332">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90619958_0-600x900.jpg" alt="ゆいな" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90619958_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90619958_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90619958_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90619958_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">ゆいな							(22歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/yuuuuina_relax" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T167                                                            (E)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        スレンダー                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        優しい                    </span>
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
                                                    <a href="/casts/cast-7645">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2026/03/IMG_8640-600x900.jpeg" alt="みさ" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2026/03/IMG_8640-200x300.jpeg 200w, https://iyashinokuukan.net/wp-content/uploads/2026/03/IMG_8640-600x900.jpeg 450w, https://iyashinokuukan.net/wp-content/uploads/2026/03/IMG_8640-200x300.jpeg 200w, https://iyashinokuukan.net/wp-content/uploads/2026/03/IMG_8640-800x1200.jpeg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">みさ							(24歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/IbxbL9tMl595616" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T158                                                            (D)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        おっとり                    </span>
                </li>
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
                        優しい                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp is__animated">
        <div class="cast__thumb">
                                                    <a href="/casts/cast-6299">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/10/S__91897935_0-600x900.jpg" alt="れい" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/10/S__91897935_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/10/S__91897935_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/10/S__91897935_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/10/S__91897935_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">れい							(27歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/ANNEX_rei" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T163                                                            (C)
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
                                                    <a href="/casts/cast-6325">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90964063_0-600x900.jpg" alt="るう" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90964063_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90964063_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90964063_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90964063_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">るう							(20歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/luuuu_annex" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T167                                                            (D)
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
                        癒し系                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp is__animated">
        <div class="cast__thumb">
                                                    <a href="/casts/cast-6338">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-mai.jpg" alt="まい" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-mai.jpg 330w, https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-mai-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-mai.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-mai.jpg 330w, https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-mai-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-mai.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">まい							(30歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/ueno_iyashi_mai" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T156                                                            (D)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        優しい                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        好奇心旺盛                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        施術上手                    </span>
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
                                                    <a href="/casts/cast-6329">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90873892_0-600x900.jpg" alt="まき" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90873892_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90873892_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90873892_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90873892_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">まき							(22歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/maki__iyashi" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T160                                                            (D)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        優しい                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        好奇心旺盛                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        愛嬌抜群                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        明るい                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp is__animated">
        <div class="cast__thumb">
                                                    <a href="/casts/cast-7685">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__25870341_0-600x900.jpg" alt="ゆう" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__25870341_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__25870341_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__25870341_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__25870341_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">ゆう							(22歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/5my09UmuoQ7767" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T154                                                            (D)
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
                        愛嬌抜群                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        明るい                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp is__animated">
        <div class="cast__thumb">
                                                    <a href="/casts/cast-6279">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__26066950_0-600x900.jpg" alt="ねろ" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__26066950_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__26066950_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__26066950_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__26066950_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">ねろ							(29歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/nero_184ueno" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T159                                                            (F)
                                </span>
         <ul class="type__labels">
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
                        施術上手                    </span>
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
                                                    <a href="/casts/cast-6317">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__91250760_0-600x900.jpg" alt="かのん" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__91250760_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__91250760_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__91250760_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__91250760_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">かのん							(26歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/kanon_jjj" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T158                                                            (D)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        スレンダー                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        愛嬌抜群                    </span>
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
                                                    <a href="/casts/cast-7550">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__25894915_0-600x900.jpg" alt="うるは" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__25894915_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__25894915_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__25894915_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__25894915_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">うるは							(19歳)
			        </span>
        <div class="sns__icon__wrapper">
                        <a href="https://twitter.com/annex__uruha" target="_blank" class="twitter__icon">
                <img src="https://iyashinokuukan.net/wp-content/themes/ultra-theme-b/assets/images/icon-x.svg" alt="セラピストX">
            </a>
                                                                                                </div>
        <span class="cast__size">
                            T160                                                            (C)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        優しい                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        可愛い                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        清楚系                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        細身                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp is__animated">
        <div class="cast__thumb">
                                                    <a href="/casts/cast-6303">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90751086_0-600x900.jpg" alt="ひまり" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90751086_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90751086_0-600x900.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90751086_0-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/09/S__90751086_0-800x1200.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">ひまり							(21歳)
			        </span>
        <div class="sns__icon__wrapper">
                                                                                                </div>
        <span class="cast__size">
                            T160                                                            (C)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        おっとり                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        可愛い                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        愛嬌抜群                    </span>
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
                                                    <a href="/casts/cast-6344">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-nako1.jpg" alt="なこ" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-nako1.jpg 330w, https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-nako1-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-nako1.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-nako1.jpg 330w, https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-nako1-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-nako1.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">なこ							(24歳)
			        </span>
        <div class="sns__icon__wrapper">
                                                                                                </div>
        <span class="cast__size">
                            T150                                                            (D)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        おっとり                    </span>
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
                        癒し系                    </span>
                </li>
                    </ul>
            </div>
</div>
<div class="cast__item animation fadeInUp is__animated">
        <div class="cast__thumb">
                                                    <a href="/casts/cast-6346">
                    <img src="https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-nayu.jpg" alt="なゆ" class="cast-image attachment-full size-full" decoding="async" srcset="https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-nayu.jpg 330w, https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-nayu-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-nayu.jpg 450w, https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-nayu.jpg 330w, https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-nayu-200x300.jpg 200w, https://iyashinokuukan.net/wp-content/uploads/2025/03/iyashinokuukan-nayu.jpg 500w" sizes="(max-width: 767px) 100vw, 500px" width="500" height="auto">
                </a>
    </div>
     <div class="cast__info">
        <span class="cast__name">なゆ							(24歳)
			        </span>
        <div class="sns__icon__wrapper">
                                                                                                </div>
        <span class="cast__size">
                            T161                                                            (C)
                                </span>
         <ul class="type__labels">
                            <li class="label type__label">
                    <span>
                        スタイル抜群                    </span>
                </li>
                            <li class="label type__label">
                    <span>
                        愛嬌抜群                    </span>
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
</div></div>
`;

async function main() {
  console.log('🚀 「癒しの空間 Annex」のセラピスト再登録（27名完全版）を開始します...\n');

  try {
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
          imageUrl = `${BASE_URL}${imageUrl}`;
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

    console.log(`🗑️ 古いセラピストデータをクリアしています...`);
    await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);

    console.log(`📦 新しいデータを登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    console.log(`\n🎉 登録完了！「癒しの空間 Annex」に ${newTherapists.length}名のセラピストがフル登録されました。`);
    console.log('ブラウザでスーパーリロードしてご確認ください！');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
