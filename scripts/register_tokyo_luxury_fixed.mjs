import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://tokyo-luxury.xyz';
const SHOP_ID = 'tokyo_taito_ueno_tokyo_luxury'; 
const GROUP_ID = 'g_tokyo_luxury'; 

// ユーザーから提供されたHTMLデータ
const HTML_CONTENT = `
<ul class="cast">
<li class="normal newtag"><a href="https://tokyo-luxury.xyz/therapist/7796/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2026/04/S__55975971.jpg);">
<span>NEW</span>
</div>
<h3><b>咲山</b></h3>
<p>160cm</p>
<p>B.89(E)W.55H.86</p>
</div></a></li>
<li class="normal newtag"><a href="https://tokyo-luxury.xyz/therapist/7793/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2026/04/S__54534227_0.jpg);">
<span>NEW</span>
</div>
<h3><b>梅田</b></h3>
<p>151cm</p>
<p>B.91(F)W.55H.87</p>
</div></a></li>
<li class="normal newtag"><a href="https://tokyo-luxury.xyz/therapist/7718/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/11/S__28270664.jpg);">
<span>NEW</span>
</div>
<h3><b>梅田</b></h3>
<p>160cm</p>
<p>B.88(E)W.55H.85</p>
</div></a></li>
<li class="normal newtag"><a href="https://tokyo-luxury.xyz/therapist/7703/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/10/S__19374083.jpg);">
<span>NEW</span>
</div>
<h3><b>如月</b></h3>
<p>157cm</p>
<p>B.84(C)W.55H.83</p>
</div></a></li>
<li class="normal newtag"><a href="https://tokyo-luxury.xyz/therapist/7701/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/10/S__19210263.jpg);">
<span>NEW</span>
</div>
<h3><b>岩田</b></h3>
<p>156cm</p>
<p>B.87(E)W.55H.85</p>
</div></a></li>
<li class="normal newtag"><a href="https://tokyo-luxury.xyz/therapist/7678/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/09/S__18219050.jpg);">
<span>NEW</span>
</div>
<h3><b>黒崎</b></h3>
<p>150cm</p>
<p>B.98(G)W.55H.85</p>
</div></a></li>
<li class="normal newtag"><a href="https://tokyo-luxury.xyz/therapist/7622/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/08/S__17178641.jpg);">
<span>NEW</span>
</div>
<h3><b>心海</b></h3>
<p>159cm</p>
<p>B.86(D)W.55H.84</p>
</div></a></li>
<li class="normal newtag"><a href="https://tokyo-luxury.xyz/therapist/7626/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/08/S__17391712.jpg);">
<span>NEW</span>
</div>
<h3><b>紗絵</b></h3>
<p>150cm</p>
<p>B.84(D)W.55H.82</p>
</div></a></li>
<li class="normal newtag"><a href="https://tokyo-luxury.xyz/therapist/6621/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/11/S__28278848_0.jpg);">
<span>NEW</span>
</div>
<h3><b>夏樹</b></h3>
<p>162cm</p>
<p>B.100(G)W.55H.89</p>
</div></a></li>
<li class="normal newtag"><a href="https://tokyo-luxury.xyz/therapist/7611/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/08/S__16900135.jpg);">
<span>NEW</span>
</div>
<h3><b>桜庭</b></h3>
<p>158cm</p>
<p>B.89(E)W.56H.86</p>
</div></a></li>
<li class="normal newtag"><a href="https://tokyo-luxury.xyz/therapist/6383/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/03/新人割　画像0401.jpg);">
<span>NEW</span>
</div>
<h3><b>NEW新人割</b></h3>
<p>140cm以下</p>
<p>B.70(AA)W.45H.75</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7743/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/12/S__137158697.jpg);">
<span></span>
</div>
<h3><b>姫宮</b></h3>
<p>158cm</p>
<p>B.92(F)W.55H.84</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6807/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/05/S__38682699_0.jpg);">
<span></span>
</div>
<h3><b>林檎</b></h3>
<p>166cm</p>
<p>B.105(I)W.58H.93</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6186/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2023/09/長月1.jpeg);">
<span></span>
</div>
<h3><b>長月</b></h3>
<p>164cm</p>
<p>B.100(H)W.58H.88</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6439/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/03/S__32284705.jpg);">
<span></span>
</div>
<h3><b>白雪</b></h3>
<p>154cm</p>
<p>B.98(H)W.56H.88</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7709/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2021/10/IMG_5802.jpeg);">
<span></span>
</div>
<h3><b>葵</b></h3>
<p>164cm</p>
<p>B.84(D)W.56H.86</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7666/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/09/S__18104325.jpg);">
<span></span>
</div>
<h3><b>藤咲</b></h3>
<p>166cm</p>
<p>B.84(D)W.55H.83</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7615/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/08/S__16900126.jpg);">
<span></span>
</div>
<h3><b>川井</b></h3>
<p>157cm</p>
<p>B.99(G)W.55H.88</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7782/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2026/02/S__206184471.jpg);">
<span></span>
</div>
<h3><b>柏木</b></h3>
<p>166cm</p>
<p>B.99(G)W.57H.89</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7674/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/09/S__18219047.jpg);">
<span></span>
</div>
<h3><b>中条</b></h3>
<p>159cm</p>
<p>B.99(G)W.55H.86</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6153/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2023/08/本田1.jpeg);">
<span></span>
</div>
<h3><b>本田</b></h3>
<p>154cm</p>
<p>B.88(E)W.56H.85</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/5353/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2021/09/結1.jpeg);">
<span></span>
</div>
<h3><b>結</b></h3>
<p>157cm</p>
<p>B.86(E)W.55H.83</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7786/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2026/03/S__52502563.jpg);">
<span></span>
</div>
<h3><b>小樽</b></h3>
<p>153cm</p>
<p>B.92(E)W.56H.87</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7631/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/09/S__305545221.jpg);">
<span></span>
</div>
<h3><b>真白</b></h3>
<p>165cm</p>
<p>B.100(G)W.56H.88</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6609/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/11/S__28131344_0.jpg);">
<span></span>
</div>
<h3><b>新発田</b></h3>
<p>159cm</p>
<p>B.86(D)W.55H.84</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6768/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/04/S__37634065_0.jpg);">
<span></span>
</div>
<h3><b>南</b></h3>
<p>158cm</p>
<p>B.88(E)W.56H.84</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7755/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2026/01/S__51363854.jpg);">
<span></span>
</div>
<h3><b>月野</b></h3>
<p>160cm</p>
<p>B.86(D)W.55H.84</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7717/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/11/S__20676613.jpg);">
<span></span>
</div>
<h3><b>泉</b></h3>
<p>155cm</p>
<p>B.87(E)W.55H.84</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7642/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/09/S__56950802.jpg);">
<span></span>
</div>
<h3><b>橘</b></h3>
<p>155cm</p>
<p>B.87(E)W.58H.86</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7777/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2026/02/S__51888174_0.jpg);">
<span></span>
</div>
<h3><b>三上</b></h3>
<p>157cm</p>
<p>B.99(G)W.56H.88</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7764/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2026/01/S__51372038_0.jpg);">
<span></span>
</div>
<h3><b>日向</b></h3>
<p>150cm</p>
<p>B.84(D)W.55H.82</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7713/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/11/S__20332550_0.jpg);">
<span></span>
</div>
<h3><b>神屋</b></h3>
<p>160cm</p>
<p>B.84(D)W.55H.82</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7770/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2026/01/S__51527758.jpg);">
<span></span>
</div>
<h3><b>蒼月</b></h3>
<p>151cm</p>
<p>B.84(D)W.57H.83</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7643/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/09/S__18096301.jpg);">
<span></span>
</div>
<h3><b>早瀬</b></h3>
<p>166cm</p>
<p>B.86(C)W.55H.87</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6672/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/12/2024-12-21-12.44.13.jpg);">
<span></span>
</div>
<h3><b>荒川</b></h3>
<p>155cm</p>
<p>B.89(E)W.55H.84</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7727/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/11/S__37658636.jpg);">
<span></span>
</div>
<h3><b>川口</b></h3>
<p>158cm</p>
<p>B.87(E)W.55H.84</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7689/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/09/S__18481348_0.jpg);">
<span></span>
</div>
<h3><b>高橋</b></h3>
<p>166cm</p>
<p>B.86(D)W.55H.83</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6465/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/05/S__19218491.jpg);">
<span></span>
</div>
<h3><b>宇佐美</b></h3>
<p>158cm</p>
<p>B.94(F)W.55H.88</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6586/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/10/S__26730924.jpg);">
<span></span>
</div>
<h3><b>九条</b></h3>
<p>154cm</p>
<p>B.91(E)W.55H.86</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6802/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/05/S__38248479.jpg);">
<span></span>
</div>
<h3><b>福本</b></h3>
<p>150cm</p>
<p>B.83(C)W.55H.82</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7637/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/09/S__17997928.jpg);">
<span></span>
</div>
<h3><b>櫻木</b></h3>
<p>159cm</p>
<p>B.86(D)W.57H.85</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7735/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/11/S__17088537_0.jpg);">
<span></span>
</div>
<h3><b>一ノ瀬</b></h3>
<p>165cm</p>
<p>B.104(I)W.57H.93</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6709/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/02/S__34357254_0.jpg);">
<span></span>
</div>
<h3><b>香坂</b></h3>
<p>155cm</p>
<p>B.86(D)W.56H.85</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7641/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/09/S__18235453.jpg);">
<span></span>
</div>
<h3><b>木崎</b></h3>
<p>155cm</p>
<p>B.87(E)W.58H.86</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7635/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/09/S__18022465.jpg);">
<span></span>
</div>
<h3><b>桜井</b></h3>
<p>158cm</p>
<p>B.87(D)W.55H.85</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7644/"><div>
<div class="img-block" style="background:url(/wp-content/uploads/2019/12/noimage.jpg);">
<span></span>
</div>
<h3><b>相川</b></h3>
<p>161cm</p>
<p>B.87(E)W.58H.88</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/7640/"><div>
<div class="img-block" style="background:url(/wp-content/uploads/2019/12/noimage.jpg);">
<span></span>
</div>
<h3><b>福原</b></h3>
<p>157cm</p>
<p>B.85(E)W.57H.86</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/5697/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2022/04/S__30949584_0-1.jpg);">
<span></span>
</div>
<h3><b>水川</b></h3>
<p>155cm</p>
<p>B.98(G)W.55H.86</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6608/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/11/S__28131352_0.jpg);">
<span></span>
</div>
<h3><b>白根</b></h3>
<p>162cm</p>
<p>B.89(E)W.56H.86</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6616/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/11/S__28196867_0.jpg);">
<span></span>
</div>
<h3><b>亀田</b></h3>
<p>154cm</p>
<p>B.86(D)W.55H.84</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6726/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/03/S__35659878.jpg);">
<span></span>
</div>
<h3><b>桃川</b></h3>
<p>163cm</p>
<p>B.92(F)W.55H.88</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6750/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/03/S__36978696.jpg);">
<span></span>
</div>
<h3><b>橋本</b></h3>
<p>161cm</p>
<p>B.83(C)W.57H.82</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6630/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/11/IMG_5975.jpeg);">
<span></span>
</div>
<h3><b>椎谷</b></h3>
<p>167cm</p>
<p>B.86(D)W.55H.84</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6739/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/03/S__35659873_0.jpg);">
<span></span>
</div>
<h3><b>音</b></h3>
<p>163cm</p>
<p>B.104(H)W.62H.98</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/5025/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2021/07/加藤1.jpeg);">
<span></span>
</div>
<h3><b>加藤</b></h3>
<p>157cm</p>
<p>B.93(F)W.57H.87</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6712/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/02/S__34996256.jpg);">
<span></span>
</div>
<h3><b>上條</b></h3>
<p>166cm</p>
<p>B.92(F)W.56H.87</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6129/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2023/06/S__34136069.jpg);">
<span></span>
</div>
<h3><b>森高</b></h3>
<p>150cm</p>
<p>B.86(D)W.55H.84</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6588/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/10/S__27123811.jpg);">
<span></span>
</div>
<h3><b>桜</b></h3>
<p>154cm</p>
<p>B.100(H)W.56H.93</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6446/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/04/お昼割　0401.jpg);">
<span></span>
</div>
<h3><b>お昼割</b></h3>
<p>140cm以下</p>
<p>B.70(AA)W.45H.75</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6392/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/03/新規割　0401.jpg);">
<span></span>
</div>
<h3><b>ご新規様割</b></h3>
<p>140cm以下</p>
<p>B.70(AA)W.45H.75</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6393/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/03/フリー割　0401.jpg);">
<span></span>
</div>
<h3><b>はずさない！フリー割</b></h3>
<p>140cm以下</p>
<p>B.70(AA)W.45H.75</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6560/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/09/S__25936000_0.jpg);">
<span></span>
</div>
<h3><b>神崎</b></h3>
<p>154cm</p>
<p>B.84(D)W.55H.83</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6570/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/10/S__26042370.jpg);">
<span></span>
</div>
<h3><b>最上</b></h3>
<p>161cm</p>
<p>B.88(E)W.56H.85</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6565/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/10/IMG_4596.jpeg);">
<span></span>
</div>
<h3><b>工藤</b></h3>
<p>160cm</p>
<p>B.85(D)W.56H.83</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6559/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/09/IMG_4792.jpeg);">
<span></span>
</div>
<h3><b>古川</b></h3>
<p>160cm</p>
<p>B.84(D)W.55H.82</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6514/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/07/S__23035968.jpg);">
<span></span>
</div>
<h3><b>月見</b></h3>
<p>155cm</p>
<p>B.89(E)W.55H.87</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6539/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/09/IMG_0085.jpeg);">
<span></span>
</div>
<h3><b>神楽</b></h3>
<p>148cm</p>
<p>B.84(C)W.55H.83</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6518/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/07/S__23109653.jpg);">
<span></span>
</div>
<h3><b>西野谷</b></h3>
<p>157cm</p>
<p>B.85(D)W.55H.83</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6503/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/06/S__21700640.jpg);">
<span></span>
</div>
<h3><b>水野</b></h3>
<p>162cm</p>
<p>B.85(D)W.55H.83</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6496/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/06/S__21315589.jpg);">
<span></span>
</div>
<h3><b>山下</b></h3>
<p>160cm</p>
<p>B.90(F)W.58H.86</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6492/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/06/S__21151803.jpg);">
<span></span>
</div>
<h3><b>高村</b></h3>
<p>157cm</p>
<p>B.97(G)W.55H.87</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6463/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/05/S__19054605.jpg);">
<span></span>
</div>
<h3><b>未来</b></h3>
<p>154cm</p>
<p>B.88(F)W.56H.87</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6456/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/04/S__18702350.jpg);">
<span></span>
</div>
<h3><b>松岡</b></h3>
<p>157cm</p>
<p>B.83(C)W.55H.82</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6662/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/12/S__30474296.jpg);">
<span></span>
</div>
<h3><b>美月</b></h3>
<p>161cm</p>
<p>B.98(F)W.55H.87</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6692/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/01/S__33038341_0.jpg);">
<span></span>
</div>
<h3><b>桃田</b></h3>
<p>157cm</p>
<p>B.85(D)W.55H.83</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6691/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/01/S__33062951_0.jpg);">
<span></span>
</div>
<h3><b>桜庭</b></h3>
<p>155cm</p>
<p>B.84(D)W.55H.82</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6684/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2025/01/S__32145538.jpg);">
<span></span>
</div>
<h3><b>花村</b></h3>
<p>147cm</p>
<p>B.90(G)W.56H.87</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6425/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/03/S__17186846.jpg);">
<span></span>
</div>
<h3><b>桜田</b></h3>
<p>147cm</p>
<p>B.85(D)W.56H.84</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6656/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/12/S__29941763.jpg);">
<span></span>
</div>
<h3><b>大宮</b></h3>
<p>164cm</p>
<p>B.89(E)W.55H.86</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6632/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/11/S__29532183_0.jpg);">
<span></span>
</div>
<h3><b>二葉</b></h3>
<p>148cm</p>
<p>B.84(D)W.55H.86</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6626/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/11/S__28278854_0.jpg);">
<span></span>
</div>
<h3><b>千葉</b></h3>
<p>162cm</p>
<p>B.97(F)W.57H.90</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/5357/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2021/09/菊池1.jpeg);">
<span></span>
</div>
<h3><b>菊池</b></h3>
<p>164cm</p>
<p>B.98(H)W.56H.87</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6419/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/03/S__16564240.jpg);">
<span></span>
</div>
<h3><b>桜坂</b></h3>
<p>162cm</p>
<p>B.91(F)W.56H.84</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6411/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/03/S__16744462.jpg);">
<span></span>
</div>
<h3><b>石原</b></h3>
<p>146cm</p>
<p>B.83(C)W.54H.84</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6410/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2024/03/S__16523278_0.jpg);">
<span></span>
</div>
<h3><b>羽虎</b></h3>
<p>156cm</p>
<p>B.97(H)W.56H.86</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/6015/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2023/03/春山1.jpeg);">
<span></span>
</div>
<h3><b>春山</b></h3>
<p>162cm</p>
<p>B.83(D)W.55H.85</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/5654/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2022/03/望月1.jpeg);">
<span></span>
</div>
<h3><b>望月</b></h3>
<p>150cm</p>
<p>B.83(D)W.55H.84</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/5559/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2022/02/夏目2.jpeg);">
<span></span>
</div>
<h3><b>夏目</b></h3>
<p>164cm</p>
<p>B.97(G)W.56H.88</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/5437/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2021/10/金城1.jpeg);">
<span></span>
</div>
<h3><b>金城</b></h3>
<p>154cm</p>
<p>B.98(G)W.56H.86</p>
</div></a></li>
<li class="normal"><a href="https://tokyo-luxury.xyz/therapist/5430/"><div>
<div class="img-block" style="background:url(https://tokyo-luxury.xyz/wp-content/uploads/2021/10/伊東1.jpeg);">
<span></span>
</div>
<h3><b>伊東</b></h3>
<p>164cm</p>
<p>B.89(F)W.56H.84</p>
</div></a></li>
</ul>
`;

async function main() {
  console.log('🚀 「東京ラグジュアリー（旧ビジョスパ）」の店舗更新とセラピスト登録を開始します...\n');

  try {
    console.log('🏪 店舗データを更新中...');
    const SHOP_DATA = {
      id: SHOP_ID,
      name: '東京ラグジュアリー（旧ビジョスパ）',
      area_id: 'tokyo_taito_ueno', 
      group_id: GROUP_ID, 
      schedule_url: 'https://tokyo-luxury.xyz/schedule/',
      website_url: 'https://tokyo-luxury.xyz/',
      business_hours: '11:00〜05:00',
      price_system: '80分 18,000円～',
      image_url: 'https://placehold.jp/9b59b6/ffffff/400x300.png?text=%E6%9D%B1%E4%BA%AC%E3%83%A9%E3%82%B0%E3%82%B8%E3%83%A5%E3%82%A2%E3%83%AA%E3%83%BC',
      raw_data: {
        prefecture: '東京都',
        city: '台東区',
        area: '上野',
        address: '東京都台東区上野エリア',
        system: [
          {
            courseName: '基本コース',
            description: '写真から読み取った料金です',
            prices: [
              { time: '80min', price: '18,000円' },
              { time: '100min', price: '20,000円' },
              { time: '120min', price: '24,000円' },
              { time: '150min', price: '30,000円' },
              { time: '180min', price: '36,000円' }
            ]
          }
        ]
      }
    };

    const { error: upsertErr } = await supabase.from('shops').upsert(SHOP_DATA, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;
    console.log(`✅ 店舗情報を更新しました。\n`);

    console.log(`⏳ HTMLからセラピストを抽出中...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('li.normal');

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; // 名前重複カウント用オブジェクト

    items.each((_, el) => {
      const item = $(el);
      
      const nameText = item.find('h3 b').text().trim();
      if (!nameText || nameText.includes('割')) return; // 「新人割」などを除外

      const cleanNameMatch = nameText.match(/^([^\(]+)/);
      const cleanName = cleanNameMatch ? cleanNameMatch[1].trim() : nameText;
      
      // ✅ ここが修正ポイント：重複する名前の処理
      let finalNameId = cleanName;
      if (seenNames[cleanName]) {
        seenNames[cleanName]++;
        finalNameId = `${cleanName}_${seenNames[cleanName]}`; // 例: 梅田_2
      } else {
        seenNames[cleanName] = 1;
      }
      
      let imageUrl = '';
      const styleAttr = item.find('.img-block').attr('style');
      if (styleAttr) {
          const urlMatch = styleAttr.match(/url\((.*?)\)/);
          if (urlMatch) {
              imageUrl = urlMatch[1].replace(/['"]/g, '');
              if (imageUrl && !imageUrl.startsWith('http')) {
                  imageUrl = `${BASE_URL}${imageUrl}`;
              }
          }
      }

      const pTags = item.find('p');
      let height = '';
      let cup = '';
      let fullBio = '';

      if (pTags.length >= 2) {
          height = $(pTags[0]).text().trim();
          const sizes = $(pTags[1]).text().trim();
          
          const cupMatch = sizes.match(/\(([A-Z]+)\)/);
          if (cupMatch) cup = cupMatch[1] + 'カップ';
          
          fullBio = `身長: ${height} ${sizes}`;
      }

      const isNew = item.hasClass('newtag') || item.find('span').text().includes('NEW');
      const tags = [];
      if(isNew) tags.push('新人');

      newTherapists.push({
        id: `${SHOP_ID}_${finalNameId}`, // 連番付きの重複しないIDをセット
        shop_id: SHOP_ID,
        name: cleanName, // 画面上の表示名は「梅田」のまま
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

    console.log(`✅ ${newTherapists.length} 名のセラピストデータを抽出しました。（割引等の特殊項目は除外）`);

    console.log(`🗑️ 古いセラピストデータをクリアしています...`);
    await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);

    console.log(`📦 新しいデータを登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    console.log(`\n🎉 登録完了！「東京ラグジュアリー」に ${newTherapists.length}名のセラピストがフル登録されました。`);
    console.log('ブラウザでスーパーリロードしてご確認ください！');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
