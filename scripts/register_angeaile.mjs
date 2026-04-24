import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://esthe-angeaile.com';
const AREA_ID = 'tokyo_ota_kamata'; // 蒲田エリア
const SHOP_ID = `${AREA_ID}_angeaile`; 
const GROUP_ID = 'g_angeaile'; 

// 料金システム（写真から）
const SYSTEM_DATA = [
  {
    courseName: '基本コース',
    description: '画像から読み取った料金です',
    prices: [
      { time: '90min', price: '22,000円' },
      { time: '120min', price: '26,000円' },
      { time: '150min', price: '30,000円' },
      { time: '180min', price: '34,000円' }
    ]
  },
  {
    courseName: '初回・おすすめコース',
    description: '初回や割引適用時などの料金設定',
    prices: [
      { time: '90min', price: '21,000円' },
      { time: '120min', price: '24,000円' }
    ]
  }
];

const HTML_CONTENT = `
<ul class="cast_box">
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=251" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=251" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=251" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/251/042401400270.jpeg" width="600" height="900" alt="稲森こん" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/251/042401400270.jpeg" width="600" height="900" alt="稲森こん" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=251" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@kon_ange" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        <img src="https://esthe-angeaile.com/images/icon_new.svg" alt="新人" width="32" height="32" loading="lazy" class="icon_new">
        </div>
    
        <p class="discount_count">
        新人割
            </p>
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">稲森こん</p>
					<p class="age"><span>Age</span>26</p>
					<p class="size"><span>Tall</span>158&nbsp;&nbsp;<span>Cup</span>D</p>
															<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=248" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=248" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=248" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/248/041101242850.jpeg" width="600" height="900" alt="石川ゆい" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/248/041101242850.jpeg" width="600" height="900" alt="石川ゆい" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=248" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@yui_angeaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        <img src="https://esthe-angeaile.com/images/icon_new.svg" alt="新人" width="32" height="32" loading="lazy" class="icon_new">
        </div>
    
        <p class="discount_count">
        新人割
                                                                        4/24〜5/24
            </p>
        
    <div class="sold_txt"><p>予約満了</p></div></div>

					</div>
				
				<div class="txt_box">
					<p class="name">石川ゆい</p>
					<p class="age"><span>Age</span>25</p>
					<p class="size"><span>Tall</span>158&nbsp;&nbsp;<span>Cup</span>F</p>
															<p class="time">12:00-18:00</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=245" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=245" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=245" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/245/041616001554.jpeg" width="600" height="900" alt="佐藤あめ" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/245/041711370218.jpeg" width="600" height="900" alt="佐藤あめ" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=245" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@ame_geaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        <img src="https://esthe-angeaile.com/images/icon_new.svg" alt="新人" width="32" height="32" loading="lazy" class="icon_new">
        </div>
    
        <p class="discount_count">
        新人割
                                                                        4/17〜5/17
            </p>
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">佐藤あめ</p>
					<p class="age"><span>Age</span>25</p>
					<p class="size"><span>Tall</span>161&nbsp;&nbsp;<span>Cup</span>F</p>
															<p class="time">11:00-15:00</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=242" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=242" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=242" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/242/031413541555.jpeg" width="600" height="900" alt="円堂ちあき" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/242/031619245250.jpeg" width="600" height="900" alt="円堂ちあき" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=242" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@m9ag03X7de12" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@M8aGM" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        <img src="https://esthe-angeaile.com/images/icon_new.svg" alt="新人" width="32" height="32" loading="lazy" class="icon_new">
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">円堂ちあき</p>
					<p class="age"><span>Age</span>27</p>
					<p class="size"><span>Tall</span>157&nbsp;&nbsp;<span>Cup</span>D</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=237" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=237" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=237" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/237/021116385620.jpeg" width="600" height="900" alt="日向ひより" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/237/031018043022.JPG" width="600" height="900" alt="日向ひより" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=237" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@hiyori_angeaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@hiyo_ange" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://lit.link/hiyori_angeaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_litlink.svg" alt="Litlink" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        <img src="https://esthe-angeaile.com/images/icon_new.svg" alt="新人" width="32" height="32" loading="lazy" class="icon_new">
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">日向ひより</p>
					<p class="age"><span>Age</span>23</p>
					<p class="size"><span>Tall</span>162&nbsp;&nbsp;<span>Cup</span>C</p>
										<p class="time">12:00-20:00</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=232" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=232" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=232" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/232/011620120217.jpeg" width="600" height="900" alt="橘りんか" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/232/042118431792.jpeg" width="600" height="900" alt="橘りんか" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=232" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@rinka_angeaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@gw68toa" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        <img src="https://esthe-angeaile.com/images/icon_new.svg" alt="新人" width="32" height="32" loading="lazy" class="icon_new">
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">橘りんか</p>
					<p class="age"><span>Age</span>25</p>
					<p class="size"><span>Tall</span>171&nbsp;&nbsp;<span>Cup</span>C</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=233" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=233" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=233" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/233/013023132948.jpeg" width="600" height="900" alt="姫野まどか" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/233/013023132948.jpeg" width="600" height="900" alt="姫野まどか" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=233" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@madoka7angeail" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@himeno_madoka7" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        <img src="https://esthe-angeaile.com/images/icon_new.svg" alt="新人" width="32" height="32" loading="lazy" class="icon_new">
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">姫野まどか</p>
					<p class="age"><span>Age</span>27</p>
					<p class="size"><span>Tall</span>161&nbsp;&nbsp;<span>Cup</span>E</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=227" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=227" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=227" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/227/120519095441.jpeg" width="600" height="900" alt="月島ももな" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/227/120921062071.jpeg" width="600" height="900" alt="月島ももな" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=227" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@momona_angeaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@angeaile_momona" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        <img src="https://esthe-angeaile.com/images/icon_new.svg" alt="新人" width="32" height="32" loading="lazy" class="icon_new">
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">月島ももな</p>
					<p class="age"><span>Age</span>22</p>
					<p class="size"><span>Tall</span>163&nbsp;&nbsp;<span>Cup</span>C</p>
										<p class="time">21:00-04:00</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=231" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=231" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=231" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/231/011310254460.jpeg" width="600" height="900" alt="一ノ瀬まお" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/231/042118531635.jpeg" width="600" height="900" alt="一ノ瀬まお" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=231" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@mao_angeaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@icnsmo" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://lit.link/icnsmao" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_litlink.svg" alt="Litlink" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        <img src="https://esthe-angeaile.com/images/icon_new.svg" alt="新人" width="32" height="32" loading="lazy" class="icon_new">
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">一ノ瀬まお</p>
					<p class="age"><span>Age</span>19</p>
					<p class="size"><span>Tall</span>158&nbsp;&nbsp;<span>Cup</span>D</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=80" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=80" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=80" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/80/032823261088.JPG" width="600" height="900" alt="天音ゆあ" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/80/031018051545.JPG" width="600" height="900" alt="天音ゆあ" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=80" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@yua_amane" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@yua_amane" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    <div class="sold_txt"><p>予約満了</p></div></div>

					</div>
				
				<div class="txt_box">
					<p class="name">天音ゆあ</p>
					<p class="age"><span>Age</span>27</p>
					<p class="size"><span>Tall</span>162&nbsp;&nbsp;<span>Cup</span>D</p>
										<p class="time">14:00-21:00</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=124" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=124" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=124" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/124/11290056242.jpeg" width="600" height="900" alt="一条りん" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/124/031018082274.JPG" width="600" height="900" alt="一条りん" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=124" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@rinichijyo_angeaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://rx-sns.jp/u/ichijyorin" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_relaxy.svg" alt="リラクシィ" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@newrinchan_ange" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="ichijyorin" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_bluesky.svg" alt="Bluesky" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://line.me/ti/p/IbzPpzDHox" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_line2.svg" alt="LINE" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://lit.link/rinrin_senchooo" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_litlink.svg" alt="Litlink" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://www.instagram.com/rin.rin.ring_writer?igsh=dHI2cm4weGF3cTJo&amp;utm_source=qr" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_instagram.svg" alt="Instagram" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<img src="https://esthe-angeaile.com/images/icon_report.svg" alt="体験レポート" width="12" height="12" loading="lazy" class="icon_twitter">

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">一条りん</p>
					<p class="age"><span>Age</span>28</p>
					<p class="size"><span>Tall</span>158&nbsp;&nbsp;<span>Cup</span>G</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=197" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=197" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=197" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/197/060317443836.jpeg" width="600" height="900" alt="真白まこと" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/197/011013143289.jpeg" width="600" height="900" alt="真白まこと" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=197" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@msrmct" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@rnsrmct" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://lin.ee/bS8jSiN" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_line2.svg" alt="LINE" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://lit.link/msrmct" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_litlink.svg" alt="Litlink" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    <div class="sold_txt"><p>予約満了</p></div></div>

					</div>
				
				<div class="txt_box">
					<p class="name">真白まこと</p>
					<p class="age"><span>Age</span>23</p>
					<p class="size"><span>Tall</span>160&nbsp;&nbsp;<span>Cup</span>E</p>
										<p class="time">15:00-22:00</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=85" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=85" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=85" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/85/041518584796.JPG" width="600" height="900" alt="奥西えま" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/85/031018085624.JPG" width="600" height="900" alt="奥西えま" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=85" class="link_act_02">
        </a><a href="https://twitter.com/@ema_okunishi" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<img src="https://esthe-angeaile.com/images/icon_report.svg" alt="体験レポート" width="12" height="12" loading="lazy" class="icon_twitter">

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">奥西えま</p>
					<p class="age"><span>Age</span>27</p>
					<p class="size"><span>Tall</span>170&nbsp;&nbsp;<span>Cup</span>C</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=115" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=115" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=115" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/115/10152152415.JPG" width="600" height="900" alt="朝比奈ひまり" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/115/01261053108.jpeg" width="600" height="900" alt="朝比奈ひまり" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=115" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@himari_ange3" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@himari_asahina3" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<img src="https://esthe-angeaile.com/images/icon_report.svg" alt="体験レポート" width="12" height="12" loading="lazy" class="icon_twitter">

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">朝比奈ひまり</p>
					<p class="age"><span>Age</span>25</p>
					<p class="size"><span>Tall</span>153&nbsp;&nbsp;<span>Cup</span>C</p>
										<p class="time">18:00-23:30</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=200" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=200" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=200" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/200/070809352969.jpeg" width="600" height="900" alt="天使てぃあ" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/200/111920561089.jpeg" width="600" height="900" alt="天使てぃあ" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=200" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@tia_ange01" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@tia__008" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://lit.link/tiaange" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_litlink.svg" alt="Litlink" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">天使てぃあ</p>
					<p class="age"><span>Age</span>23</p>
					<p class="size"><span>Tall</span>153&nbsp;&nbsp;<span>Cup</span>F</p>
										<p class="time">12:00-19:00</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=97" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=97" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=97" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/97/07122023565.jpeg" width="600" height="900" alt="宇佐美める" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/97/011516100693.jpeg" width="600" height="900" alt="宇佐美める" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=97" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@mellusamin" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@mellusamin" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">宇佐美める</p>
					<p class="age"><span>Age</span>24</p>
					<p class="size"><span>Tall</span>163&nbsp;&nbsp;<span>Cup</span>E</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=128" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=128" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=128" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/128/010718515362.jpeg" width="600" height="900" alt="笹川さら" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/128/031018063453.JPG" width="600" height="900" alt="笹川さら" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=128" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@sara_angeaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@sara__angeaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">笹川さら</p>
					<p class="age"><span>Age</span>28</p>
					<p class="size"><span>Tall</span>166&nbsp;&nbsp;<span>Cup</span>D</p>
										<p class="time">19:00-05:00</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=45" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=45" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=45" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/45/10011755458.JPG" width="600" height="900" alt="葉月いより" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/45/050114462195.jpeg" width="600" height="900" alt="葉月いより" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=45" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@iyori_anj82" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@iyori_angeaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">葉月いより</p>
					<p class="age"><span>Age</span>28</p>
					<p class="size"><span>Tall</span>159&nbsp;&nbsp;<span>Cup</span>C</p>
										<p class="time">20:00-03:00</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=130" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=130" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=130" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/130/011218073040.jpeg" width="600" height="900" alt="蓮見はな" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/130/042118585311.jpeg" width="600" height="900" alt="蓮見はな" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=130" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@87_hsm" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@87_angeaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">蓮見はな</p>
					<p class="age"><span>Age</span>22</p>
					<p class="size"><span>Tall</span>150&nbsp;&nbsp;<span>Cup</span>C</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=199" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=199" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=199" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/199/061617325080.JPG" width="600" height="900" alt="春乃いちご" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/199/061617325080.JPG" width="600" height="900" alt="春乃いちご" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=199" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@ichigo_ange" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@0120Haruno" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://line.me/ti/p/fbEFFwrRej" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_line2.svg" alt="LINE" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://lit.link/ichigo_ange" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_litlink.svg" alt="Litlink" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">春乃いちご</p>
					<p class="age"><span>Age</span>27</p>
					<p class="size"><span>Tall</span>155&nbsp;&nbsp;<span>Cup</span>E</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=129" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=129" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=129" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/129/011918360240.jpeg" width="600" height="900" alt="宮園なぎさ" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/129/031018060291.JPG" width="600" height="900" alt="宮園なぎさ" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=129" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@nagisa_miyazono" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/nagichan_ange" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://line.me/R/ti/p/@392jipoq?oat_content=url&amp;ts=06111203" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_line2.svg" alt="LINE" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://lit.link/75ecff26-90c3-40f7-9256-19c9df7f60d3" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_litlink.svg" alt="Litlink" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">宮園なぎさ</p>
					<p class="age"><span>Age</span>26</p>
					<p class="size"><span>Tall</span>162&nbsp;&nbsp;<span>Cup</span>D</p>
										<p class="time">19:30-01:30</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=102" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=102" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=102" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/102/073020201476.JPG" width="600" height="900" alt="三上りほ" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/102/012516324841.jpeg" width="600" height="900" alt="三上りほ" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=102" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@riho_mikami" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@riho_angeaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<img src="https://esthe-angeaile.com/images/icon_report.svg" alt="体験レポート" width="12" height="12" loading="lazy" class="icon_twitter">

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">三上りほ</p>
					<p class="age"><span>Age</span>26</p>
					<p class="size"><span>Tall</span>158&nbsp;&nbsp;<span>Cup</span>E</p>
										<p class="time">21:30-05:00</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=211" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=211" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=211" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/211/08161404416.jpeg" width="600" height="900" alt="早乙女らら" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/211/031018072518.JPG" width="600" height="900" alt="早乙女らら" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=211" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@rara_ang" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@rara_ang2" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">早乙女らら</p>
					<p class="age"><span>Age</span>28</p>
					<p class="size"><span>Tall</span>170&nbsp;&nbsp;<span>Cup</span>F</p>
										<p class="time">11:00-20:00</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=212" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=212" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=212" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/212/101300055273.jpeg" width="600" height="900" alt="小鳥遊ひな" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/212/03101342278.jpeg" width="600" height="900" alt="小鳥遊ひな" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=212" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@Takanashi_hina" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@hina_Angeaie___" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://bsky.app/profile/hina-angeaile.bsky.social" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_bluesky.svg" alt="Bluesky" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">小鳥遊ひな</p>
					<p class="age"><span>Age</span>22</p>
					<p class="size"><span>Tall</span>155&nbsp;&nbsp;<span>Cup</span>E</p>
										<p class="time">14:00-20:00</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=230" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=230" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=230" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/230/121517093187.jpeg" width="600" height="900" alt="葵えりか" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/230/03101805406.JPG" width="600" height="900" alt="葵えりか" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=230" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@Aoiro_x" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@Aki_syt" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">葵えりか</p>
					<p class="age"><span>Age</span>25</p>
					<p class="size"><span>Tall</span>162&nbsp;&nbsp;<span>Cup</span>C</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=221" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=221" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=221" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/221/112116275873.JPG" width="600" height="900" alt="白羽あまね" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/221/021418073489.jpeg" width="600" height="900" alt="白羽あまね" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=221" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@shirahane_a" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@shirahane_amn" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">白羽あまね</p>
					<p class="age"><span>Age</span>24</p>
					<p class="size"><span>Tall</span>147&nbsp;&nbsp;<span>Cup</span>C</p>
										<p class="time">23:00-03:00</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=190" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=190" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=190" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/190/042823000528.JPG" width="600" height="900" alt="伏見さくら" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/190/111920563576.jpeg" width="600" height="900" alt="伏見さくら" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=190" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@24339" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@24339_" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<img src="https://esthe-angeaile.com/images/icon_report.svg" alt="体験レポート" width="12" height="12" loading="lazy" class="icon_twitter">

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">伏見さくら</p>
					<p class="age"><span>Age</span>24</p>
					<p class="size"><span>Tall</span>152&nbsp;&nbsp;<span>Cup</span>D</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=89" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=89" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=89" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/89/050716334086.jpeg" width="600" height="900" alt="結城みお" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/89/090916402433.JPG" width="600" height="900" alt="結城みお" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=89" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@mio_ange" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@miomio_an" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">結城みお</p>
					<p class="age"><span>Age</span>26</p>
					<p class="size"><span>Tall</span>155&nbsp;&nbsp;<span>Cup</span>E</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=72" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=72" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=72" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/72/013021341351.jpeg" width="600" height="900" alt="美咲みわ" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/72/022713542599.jpeg" width="600" height="900" alt="美咲みわ" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=72" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@miwamiwa_anjuaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/miwamiwaang" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">美咲みわ</p>
					<p class="age"><span>Age</span>26</p>
					<p class="size"><span>Tall</span>157&nbsp;&nbsp;<span>Cup</span>H</p>
										<p class="time">12:30-18:30</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=189" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=189" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=189" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/189/042120391497.JPG" width="600" height="900" alt="桃瀬まい" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/189/061714545592.jpeg" width="600" height="900" alt="桃瀬まい" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=189" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@7cc_qs" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@mai__angeaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">桃瀬まい</p>
					<p class="age"><span>Age</span>21</p>
					<p class="size"><span>Tall</span>152&nbsp;&nbsp;<span>Cup</span>C</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=21" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=21" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=21" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/21/051123321430.jpg" width="600" height="900" alt="椿みな" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/21/031018015840.jpeg" width="600" height="900" alt="椿みな" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=21" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@mina_ange2" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@mina_anje2" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">椿みな</p>
					<p class="age"><span>Age</span>24</p>
					<p class="size"><span>Tall</span>160&nbsp;&nbsp;<span>Cup</span>G</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=125" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=125" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=125" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/125/112519371472.jpeg" width="600" height="900" alt="九条いぶき" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/125/031217570497.jpeg" width="600" height="900" alt="九条いぶき" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=125" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@ibuki_kamata" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@VmYnp1" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">九条いぶき</p>
					<p class="age"><span>Age</span>21</p>
					<p class="size"><span>Tall</span>160&nbsp;&nbsp;<span>Cup</span>I</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=78" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=78" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=78" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/78/040716382213.JPG" width="600" height="900" alt="逢坂いろは" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/78/031218400444.jpeg" width="600" height="900" alt="逢坂いろは" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=78" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@angeaile_iroro" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@angeaile_iro" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">逢坂いろは</p>
					<p class="age"><span>Age</span>26</p>
					<p class="size"><span>Tall</span>150&nbsp;&nbsp;<span>Cup</span>E</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=188" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=188" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=188" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/188/041815323174.jpeg" width="600" height="900" alt="花宮ひかり" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/188/030917390799.jpeg" width="600" height="900" alt="花宮ひかり" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=188" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@hikari_ange" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@hikari__ange" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://lit.link/hnmyhkr" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_litlink.svg" alt="Litlink" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">花宮ひかり</p>
					<p class="age"><span>Age</span>24</p>
					<p class="size"><span>Tall</span>164&nbsp;&nbsp;<span>Cup</span>D</p>
										<p class="time">21:00-04:00</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=195" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=195" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=195" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/195/061618564946.JPG" width="600" height="900" alt="陽咲ことね" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/195/031018075266.JPG" width="600" height="900" alt="陽咲ことね" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=195" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@hisaki_kotone" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@kotone_hisaki" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">陽咲ことね</p>
					<p class="age"><span>Age</span>24</p>
					<p class="size"><span>Tall</span>162&nbsp;&nbsp;<span>Cup</span>D</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=218" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=218" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=218" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/218/102516425513.jpeg" width="600" height="900" alt="柊かのん" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/218/120913124987.jpeg" width="600" height="900" alt="柊かのん" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=218" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@kanon_14" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@toriakrim_5" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">柊かのん</p>
					<p class="age"><span>Age</span>26</p>
					<p class="size"><span>Tall</span>163&nbsp;&nbsp;<span>Cup</span>E</p>
										<p class="time">22:00-04:00</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=192" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=192" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=192" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/192/05010239406.JPG" width="600" height="900" alt="桜井のの" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/192/082615342780.jpeg" width="600" height="900" alt="桜井のの" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=192" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@nono__angeaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@nono_angeaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">桜井のの</p>
					<p class="age"><span>Age</span>21</p>
					<p class="size"><span>Tall</span>164&nbsp;&nbsp;<span>Cup</span>G</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=194" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=194" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=194" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/194/051519254974.jpeg" width="600" height="900" alt="夢咲かぐら" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/194/012610534833.jpeg" width="600" height="900" alt="夢咲かぐら" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=194" class="link_act_02">
        </a><a href="https://twitter.com/@kagura22__" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://lit.link/ang_kagura" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_litlink.svg" alt="Litlink" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">夢咲かぐら</p>
					<p class="age"><span>Age</span>23</p>
					<p class="size"><span>Tall</span>158&nbsp;&nbsp;<span>Cup</span>D</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=25" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=25" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=25" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/25/051818251537.jpg" width="600" height="900" alt="三川ねね" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/25/012516331787.jpeg" width="600" height="900" alt="三川ねね" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=25" class="link_act_02">
        </a><a href="https://twitter.com/@nene_angeaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">三川ねね</p>
					<p class="age"><span>Age</span>23</p>
					<p class="size"><span>Tall</span>152&nbsp;&nbsp;<span>Cup</span>C</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=220" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=220" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=220" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/220/102516434162.jpeg" width="600" height="900" alt="七海ちひろ" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/220/102516434162.jpeg" width="600" height="900" alt="七海ちひろ" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=220" class="link_act_02">
        </a><a href="https://twitter.com/@chihro_ang" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">七海ちひろ</p>
					<p class="age"><span>Age</span>24</p>
					<p class="size"><span>Tall</span>145&nbsp;&nbsp;<span>Cup</span>C</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=35" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=35" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=35" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/35/070222334637.jpeg" width="600" height="900" alt="月野ゆら" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/35/031218124360.jpeg" width="600" height="900" alt="月野ゆら" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=35" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@Yura_ange" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@yura_angeaile" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">月野ゆら</p>
					<p class="age"><span>Age</span>24</p>
					<p class="size"><span>Tall</span>169&nbsp;&nbsp;<span>Cup</span>F</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=83" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=83" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=83" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/83/041121521640.jpeg" width="600" height="900" alt="瀬崎のあ" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/83/052418485717.jpeg" width="600" height="900" alt="瀬崎のあ" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=83" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@noah_seza" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@noah_seza" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">瀬崎のあ</p>
					<p class="age"><span>Age</span>25</p>
					<p class="size"><span>Tall</span>167&nbsp;&nbsp;<span>Cup</span>E</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=234" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=234" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=234" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/234/012709484133.jpeg" width="600" height="900" alt="佐野あんじゅ" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/234/012709484133.jpeg" width="600" height="900" alt="佐野あんじゅ" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=234" class="link_act_02">
        </a><a href="https://twitter.com/@anj_kmt" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">佐野あんじゅ</p>
					<p class="age"><span>Age</span>24</p>
					<p class="size"><span>Tall</span>156&nbsp;&nbsp;<span>Cup</span>D</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=113" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=113" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=113" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/113/092123182270.jpeg" width="600" height="900" alt="桐生あかり" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/113/071116385647.jpeg" width="600" height="900" alt="桐生あかり" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=113" class="link_act_02">
        </a><a href="https://twitter.com/@Akariii_ang" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<img src="https://esthe-angeaile.com/images/icon_report.svg" alt="体験レポート" width="12" height="12" loading="lazy" class="icon_twitter">

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">桐生あかり</p>
					<p class="age"><span>Age</span>27</p>
					<p class="size"><span>Tall</span>160&nbsp;&nbsp;<span>Cup</span>E</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=46" class="link_act_02">
					</a><div class="img_box"><a href="https://esthe-angeaile.com/profile.php?sid=46" class="link_act_02">
						</a><div class="stage"><a href="https://esthe-angeaile.com/profile.php?sid=46" class="link_act_02">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/46/101817063333.JPG" width="600" height="900" alt="霧島じゅん" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/46/090916153693.JPG" width="600" height="900" alt="霧島じゅん" loading="lazy"></div>
        </div>
    
    </a><div class="icon_sns"><a href="https://esthe-angeaile.com/profile.php?sid=46" class="link_act_02">
        </a><a href="https://m-sns.net/profile/@Jun_igarashi" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_sns02.svg" alt="ゼロツー" width="12" height="12" loading="lazy" class="icon_twitter">
</a>
<a href="https://twitter.com/@mensestjun" target="_blank">
    <img src="https://esthe-angeaile.com/images/icon_twitter.svg" alt="X（エックス）" width="12" height="12" loading="lazy" class="icon_twitter">
</a>

    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				
				<div class="txt_box">
					<p class="name">霧島じゅん</p>
					<p class="age"><span>Age</span>25</p>
					<p class="size"><span>Tall</span>156&nbsp;&nbsp;<span>Cup</span>E</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=20" class="link_act_02">
					<div class="img_box">
						<div class="stage">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/20/051123323190.jpg" width="600" height="900" alt="三ノ宮もえか" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/20/051123323190.jpg" width="600" height="900" alt="三ノ宮もえか" loading="lazy"></div>
        </div>
    
    <div class="icon_sns">
        
    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				</a>
				<div class="txt_box">
					<p class="name">三ノ宮もえか</p>
					<p class="age"><span>Age</span>22</p>
					<p class="size"><span>Tall</span>151&nbsp;&nbsp;<span>Cup</span>E</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
						<li>
				<a href="https://esthe-angeaile.com/profile.php?sid=14" class="link_act_02">
					<div class="img_box">
						<div class="stage">
    <div class="stage_cardimage">
            <div class="img_wrap1"><img src="https://esthe-angeaile.com/images_staff/14/05112334348.jpg" width="600" height="900" alt="南ゆいか" loading="lazy"></div>
        <div class="img_wrap2"><img src="https://esthe-angeaile.com/images_staff/14/05112334348.jpg" width="600" height="900" alt="南ゆいか" loading="lazy"></div>
        </div>
    
    <div class="icon_sns">
        
    </div>
    
    <div class="icon_box">
        
        </div>
    
        
    </div>

					</div>
				</a>
				<div class="txt_box">
					<p class="name">南ゆいか</p>
					<p class="age"><span>Age</span>20</p>
					<p class="size"><span>Tall</span>148&nbsp;&nbsp;<span>Cup</span>G</p>
										<p class="time">お休み</p>
										<div class="icon_check"></div>
				</div>
			</li>
					</ul>
`;

async function main() {
  console.log('🚀 「Anjuaile (アンジュエール)」の店舗とセラピスト登録を開始します...\n');

  try {
    console.log('🏪 店舗データを登録中...');
    
    const SHOP_DATA = {
      id: SHOP_ID,
      name: 'Anjuaile (アンジュエール)',
      area_id: AREA_ID, 
      group_id: GROUP_ID, 
      schedule_url: 'https://esthe-angeaile.com/schedule.php',
      website_url: 'https://esthe-angeaile.com/',
      business_hours: '営業時間要確認', 
      price_system: '90分 22,000円～',
      image_url: 'https://placehold.jp/ff9ff3/ffffff/400x300.png?text=Anjuaile',
      raw_data: {
        prefecture: '東京都',
        city: '大田区',
        area: '蒲田',
        address: '東京都大田区蒲田エリア',
        system: SYSTEM_DATA // 料金システム
      }
    };

    const { error: upsertErr } = await supabase.from('shops').upsert(SHOP_DATA, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;
    console.log(`✅ 店舗情報（ID: ${SHOP_ID}）を登録しました。\n`);

    console.log(`⏳ HTMLからセラピストを抽出中...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.cast_box > li');

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; 

    items.each((_, el) => {
      const item = $(el);
      
      const cleanName = item.find('.txt_box .name').text().trim();
      if (!cleanName) return;

      const ageText = item.find('.txt_box .age').text().replace('Age', '').trim();
      const sizeText = item.find('.txt_box .size').text().trim();
      
      // サイズ（身長とカップ）の抽出
      const heightMatch = sizeText.match(/Tall(\d+)/);
      const cupMatch = sizeText.match(/Cup([A-Z]+)/);
      const height = heightMatch ? `${heightMatch[1]}cm` : '';
      const cup = cupMatch ? `${cupMatch[1]}カップ` : '';

      // 同名回避処理
      let finalNameId = cleanName.replace(/\s/g, '_');
      if (seenNames[finalNameId]) {
        seenNames[finalNameId]++;
        finalNameId = `${finalNameId}_${seenNames[finalNameId]}`; 
      } else {
        seenNames[finalNameId] = 1;
      }
      
      let imageUrl = item.find('.img_wrap1 img').attr('src') || '';
      
      // 出勤時間と新人タグ
      const timeText = item.find('.time').text().trim();
      const isNew = item.find('.icon_new').length > 0;
      
      const tags = [];
      if(isNew) tags.push('新人');

      let fullBio = '';
      if (ageText) fullBio += `年齢: ${ageText}歳 `;
      if (height) fullBio += `身長: ${height} `;
      if (cup) fullBio += `カップ: ${cup}\n`;
      if (timeText) fullBio += `本日の出勤: ${timeText}`;

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
          original_name: cleanName
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

    console.log(`\n🎉 登録完了！「Anjuaile (アンジュエール)」に店舗と ${newTherapists.length}名のセラピストが登録されました。`);
    console.log('ブラウザの「蒲田」エリアでスーパーリロードしてご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
