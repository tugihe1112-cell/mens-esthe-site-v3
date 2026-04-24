import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://livspa.net';
const SHOP_ID = 'tokyo_meguro_jiyugaoka_livspa';
const GROUP_ID = 'g_livspa';

// ユーザーから提供されたHTMLデータ
const HTML_CONTENT = `
<ul class="row row-sm therapist-datas mg-bottom inview">
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/13426"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773860328_8217969.jpg" width="300" height="400" alt="深澤まき" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">ふかざわまき</div>
        <a href="/therapist/13426" class="therapist-datas-name text-gothic">深澤まき</a>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">24歳</span>
          <span class="mg-right-xs">158㎝</span>
          (H)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">巨乳</span></li>
            <li><span class="therapist-label">サービス抜群</span></li>
            <li><span class="therapist-label">癒し系</span></li>
            <li><span class="therapist-label">高リピート</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/63024"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1775310452_6516548.jpg" width="300" height="400" alt="《新人》春野なのは" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">はるのなのは</div>
        <a href="/therapist/63024" class="therapist-datas-name text-gothic">《新人》春野なのは</a>
        <div class="therapist-datas-bio text-gothic">現役メイドセラピスト</div>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">22歳</span>
          <span class="mg-right-xs">150㎝</span>
          (E)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">メイド</span></li>
            <li><span class="therapist-label">癒し系</span></li>
            <li><span class="therapist-label">ギャップ大</span></li>
            <li><span class="therapist-label">小柄</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/63857"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1775490193_9847872.jpg" width="300" height="400" alt="《新人》神崎まどか" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">かんざきまどか</div>
        <a href="/therapist/63857" class="therapist-datas-name text-gothic">《新人》神崎まどか</a>
        <div class="therapist-datas-bio text-gothic">心も身体もほどく聞き上手</div>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">27歳</span>
          <span class="mg-right-xs">165㎝</span>
          (G)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">聞き上手</span></li>
            <li><span class="therapist-label">経験豊富</span></li>
            <li><span class="therapist-label">４TB得意</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/63524"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1775820899_5110502.jpeg" width="300" height="400" alt="《新人》朝比奈しゅな" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">あさひなしゅな</div>
        <a href="/therapist/63524" class="therapist-datas-name text-gothic">《新人》朝比奈しゅな</a>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">25歳</span>
          <span class="mg-right-xs">160㎝</span>
          (B)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">会話上手</span></li>
            <li><span class="therapist-label">細身</span></li>
            <li><span class="therapist-label">極上施術</span></li>
            <li><span class="therapist-label">指圧◎</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/63673"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1775310466_9251412.jpg" width="300" height="400" alt="《新人》結城いおり" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">ゆうきいおり</div>
        <a href="/therapist/63673" class="therapist-datas-name text-gothic">《新人》結城いおり</a>
        <div class="therapist-datas-bio text-gothic">黒髪清楚系セラピスト</div>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">152㎝</span>
          (D)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">癒し系</span></li>
            <li><span class="therapist-label">小柄</span></li>
            <li><span class="therapist-label">ギャップ</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/54920"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774091285_0840677.jpg" width="300" height="400" alt="橘せりな" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">たちばなせりな</div>
        <a href="/therapist/54920" class="therapist-datas-name text-gothic">橘せりな</a>
        <div class="therapist-datas-bio text-gothic">元グラビアアイドル</div>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">27歳</span>
          <span class="mg-right-xs">162㎝</span>
          (H)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">巨乳</span></li>
            <li><span class="therapist-label">高リピート率</span></li>
            <li><span class="therapist-label">スタイル抜群</span></li>
            <li><span class="therapist-label">マッサージ資格有</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/60094"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774515652_7580470.jpeg" width="300" height="400" alt="《新人》石原ゆき" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">いしはらゆき</div>
        <a href="/therapist/60094" class="therapist-datas-name text-gothic">《新人》石原ゆき</a>
        <div class="therapist-datas-bio text-gothic">丸の内OL</div>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">21歳</span>
          <span class="mg-right-xs">152㎝</span>
          (C)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">小柄</span></li>
            <li><span class="therapist-label">もちもち肌</span></li>
            <li><span class="therapist-label">OL</span></li>
            <li><span class="therapist-label">超絶足技</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/53662"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774633502_8794833.jpg" width="300" height="400" alt="白雪るり" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">しらゆきるり</div>
        <a href="/therapist/53662" class="therapist-datas-name text-gothic">白雪るり</a>
        <div class="therapist-datas-bio text-gothic">現役エステティシャン</div>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">23歳</span>
          <span class="mg-right-xs">163㎝</span>
          (D)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">モデル系</span></li>
            <li><span class="therapist-label">おっとり</span></li>
            <li><span class="therapist-label">スタイル抜群</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/49894"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773860368_3362216.jpg" width="300" height="400" alt="結花ことは" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">ゆいかことは</div>
        <a href="/therapist/49894" class="therapist-datas-name text-gothic">結花ことは</a>
        <div class="therapist-datas-bio text-gothic">現役看護師セラピスト</div>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">24歳</span>
          <span class="mg-right-xs">158㎝</span>
          (C)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">現役看護師</span></li>
            <li><span class="therapist-label">明るく気さく</span></li>
            <li><span class="therapist-label">スレンダー</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/42659"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773860426_8840392.jpg" width="300" height="400" alt="天野かのん" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">あまのかのん</div>
        <a href="/therapist/42659" class="therapist-datas-name text-gothic">天野かのん</a>
        <div class="therapist-datas-bio text-gothic">看護師セラピスト</div>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">20歳</span>
          <span class="mg-right-xs">157㎝</span>
          (F)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">小柄</span></li>
            <li><span class="therapist-label">現役看護師</span></li>
            <li><span class="therapist-label">未経験</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/13458"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773860383_1471486.jpg" width="300" height="400" alt="月永らん" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">つきながらん</div>
        <a href="/therapist/13458" class="therapist-datas-name text-gothic">月永らん</a>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">22歳</span>
          <span class="mg-right-xs">156㎝</span>
          (D)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">スレンダー</span></li>
            <li><span class="therapist-label">高ルックス</span></li>
            <li><span class="therapist-label">愛嬌抜群</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/49892"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1775675539_8246403.jpg" width="300" height="400" alt="一ノ瀬あいり" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">いちのせあいり</div>
        <a href="/therapist/49892" class="therapist-datas-name text-gothic">一ノ瀬あいり</a>
        <div class="therapist-datas-bio text-gothic">現役JD</div>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">21歳</span>
          <span class="mg-right-xs">155㎝</span>
          (G)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">巨乳</span></li>
            <li><span class="therapist-label">癒し系</span></li>
            <li><span class="therapist-label">最強笑顔</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/13437"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773860451_6669453.jpg" width="300" height="400" alt="高橋まりな" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">たかはしまりな</div>
        <a href="/therapist/13437" class="therapist-datas-name text-gothic">高橋まりな</a>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">22歳</span>
          <span class="mg-right-xs">153㎝</span>
          (D)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">小柄</span></li>
            <li><span class="therapist-label">高ホスピタリティ</span></li>
            <li><span class="therapist-label">かわいい</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/47805"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773860401_0948378.jpg" width="300" height="400" alt="霞ヶ丘さくら" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">かすみがおかさくら</div>
        <a href="/therapist/47805" class="therapist-datas-name text-gothic">霞ヶ丘さくら</a>
        <div class="therapist-datas-bio text-gothic">可憐</div>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">23歳</span>
          <span class="mg-right-xs">153㎝</span>
          (E)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">アイドル系</span></li>
            <li><span class="therapist-label">施術上手</span></li>
            <li><span class="therapist-label">高延長率</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/57188"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1774693198_0518048.jpg" width="300" height="400" alt="白石ひより" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">しらいしひより</div>
        <a href="/therapist/57188" class="therapist-datas-name text-gothic">白石ひより</a>
        <div class="therapist-datas-bio text-gothic">現役アイドル</div>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">22歳</span>
          <span class="mg-right-xs">155㎝</span>
          (C)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">現役アイドル</span></li>
            <li><span class="therapist-label">小柄</span></li>
            <li><span class="therapist-label">施術上手</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/13452"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773860410_7905664.jpg" width="300" height="400" alt="水瀬もも" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">みなせもも</div>
        <a href="/therapist/13452" class="therapist-datas-name text-gothic">水瀬もも</a>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">23歳</span>
          <span class="mg-right-xs">162㎝</span>
          (G)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">セクシー</span></li>
            <li><span class="therapist-label">施術上手</span></li>
            <li><span class="therapist-label">美人系</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/13447"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773860458_8457155.jpg" width="300" height="400" alt="工藤かなみ" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">くどうかなみ</div>
        <a href="/therapist/13447" class="therapist-datas-name text-gothic">工藤かなみ</a>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">25歳</span>
          <span class="mg-right-xs">160㎝</span>
          (E)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">セクシー</span></li>
            <li><span class="therapist-label">施術上手</span></li>
            <li><span class="therapist-label">キレカワ</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/13434"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773860476_4166909.jpg" width="300" height="400" alt="渚みお" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">なぎさみお</div>
        <a href="/therapist/13434" class="therapist-datas-name text-gothic">渚みお</a>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">23歳</span>
          <span class="mg-right-xs">160㎝</span>
          (E)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">巨乳</span></li>
            <li><span class="therapist-label">スレンダー</span></li>
            <li><span class="therapist-label">高リピート</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/61918"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773860336_1768545.jpg" width="300" height="400" alt="《新人》天音りりか" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">あまねりりか</div>
        <a href="/therapist/61918" class="therapist-datas-name text-gothic">《新人》天音りりか</a>
        <div class="therapist-datas-bio text-gothic">JD秘密のアルバイト</div>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">20歳</span>
          <span class="mg-right-xs">168㎝</span>
          (F)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">フェザータッチ</span></li>
            <li><span class="therapist-label">美脚</span></li>
            <li><span class="therapist-label">女子大生</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/35151"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773860507_2754771.jpg" width="300" height="400" alt="桃井あかり" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">ももいあかり</div>
        <a href="/therapist/35151" class="therapist-datas-name text-gothic">桃井あかり</a>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">22歳</span>
          <span class="mg-right-xs">157㎝</span>
          (E)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">巨乳</span></li>
            <li><span class="therapist-label">セクシー</span></li>
            <li><span class="therapist-label">親しみやすい</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/41423"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773860484_4119432.jpg" width="300" height="400" alt="柚月すずな" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <a href="/therapist/41423" class="therapist-datas-name text-gothic">柚月すずな</a>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">23歳</span>
          <span class="mg-right-xs">157㎝</span>
          (D)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">高リピート</span></li>
            <li><span class="therapist-label">レア出勤</span></li>
            <li><span class="therapist-label">かわいい</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/13453"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773860493_2072349.jpg" width="300" height="400" alt="赤西めい" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">あかにしめい</div>
        <a href="/therapist/13453" class="therapist-datas-name text-gothic">赤西めい</a>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">24歳</span>
          <span class="mg-right-xs">164㎝</span>
          (D)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">きれい</span></li>
            <li><span class="therapist-label">高身長</span></li>
            <li><span class="therapist-label">レア出勤</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/13451"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773860467_0010601.jpg" width="300" height="400" alt="櫻井みづき" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">さくらいみづき</div>
        <a href="/therapist/13451" class="therapist-datas-name text-gothic">櫻井みづき</a>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">24歳</span>
          <span class="mg-right-xs">158㎝</span>
          (C)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">スレンダー</span></li>
            <li><span class="therapist-label">丁寧</span></li>
            <li><span class="therapist-label">おっとり</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/52970"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773860500_2096880.jpg" width="300" height="400" alt="せいら" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">せいら</div>
        <a href="/therapist/52970" class="therapist-datas-name text-gothic">せいら</a>
        <div class="therapist-datas-bio text-gothic">現役RQ極液認定セラピスト</div>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">26歳</span>
          <span class="mg-right-xs">168㎝</span>
          (D)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">モデル系</span></li>
            <li><span class="therapist-label">きれい系</span></li>
            <li><span class="therapist-label">施術上手</span></li>
            <li><span class="therapist-label">現役RQ</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/19452"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773860435_5039833.jpg" width="300" height="400" alt="神田えりか" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">かんだえりか</div>
        <a href="/therapist/19452" class="therapist-datas-name text-gothic">神田えりか</a>
        <div class="therapist-datas-bio text-gothic">Kpop系セラピスト</div>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">22歳</span>
          <span class="mg-right-xs">163㎝</span>
          (E)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">セクシー</span></li>
            <li><span class="therapist-label">ハーフ顔</span></li>
            <li><span class="therapist-label">スタイル抜群</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/13454"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1773860515_6201522.jpg" width="300" height="400" alt="空条りん" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">くうじょうりん</div>
        <a href="/therapist/13454" class="therapist-datas-name text-gothic">空条りん</a>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">28歳</span>
          <span class="mg-right-xs">155㎝</span>
          (G)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">巨乳</span></li>
            <li><span class="therapist-label">セクシー</span></li>
            <li><span class="therapist-label">大人女子</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
  <li class="col-sm-3 col-xs-6 col-sm mg-bottom">
    <div class="therapist-datas-each text-gothic" style="height: 372px;">
      <div class="therapist-datas-tmb">
        <a href="/therapist/64919"><img src="https://cdn2-caskan.com/caskan/img/cast_tmb/1776674905_9951052.jpeg" width="300" height="400" alt="《新人》日向なつめ" class="therapist-data-each-tmb"></a>
      </div>
      <div class="therapist-datas-info">
        <div class="therapist-datas-kana">ひなたなつめ</div>
        <a href="/therapist/64919" class="therapist-datas-name text-gothic">《新人》日向なつめ</a>
        <div class="therapist-datas-bio text-gothic">未経験セラピスト</div>
        <div class="therapist-datas-spec">
          <span class="mg-right-xs">27歳</span>
          <span class="mg-right-xs">167㎝</span>
          (D)
        </div>
        <div class="therapist-label-wrapper">
          <ul class="therapist-label-list">
            <li><span class="therapist-label">未経験</span></li>
            <li><span class="therapist-label">スレンダー</span></li>
            <li><span class="therapist-label">高身長</span></li>
            <li><span class="therapist-label">おしゃべり好き</span></li>
          </ul>
        </div>
      </div>
    </div>
  </li>
</ul>
`;

async function main() {
  console.log('🚀 「LIVSPA」の店舗登録とセラピスト完全抽出を開始します...\n');

  try {
    // --- 1. 店舗の登録（自由が丘をベースにする） ---
    console.log('🏪 店舗データをグループ化して作成中...');
    
    // 今回の必須スクリーニング情報（エリア、プレースホルダー画像など）を含める
    const SHOP_DATA = {
      id: SHOP_ID,
      name: 'LIVSPA (リブスパ)',
      area_id: 'tokyo_meguro_jiyugaoka',
      group_id: GROUP_ID,
      schedule_url: 'https://livspa.net/schedule',
      website_url: 'https://livspa.net',
      is_active: true,
      business_hours: '10:00〜05:00', // HTMLの情報に基づく
      price_system: '90分 18,000円～', // 画像の情報に基づく
      image_url: 'https://placehold.jp/ff9e00/ffffff/400x300.png?text=LIVSPA', // 必須: 仮のロゴ画像
      raw_data: {
        prefecture: '東京都',
        city: '目黒区',
        area: '自由が丘',
        address: '東京都目黒区自由が丘エリア', // 必須のエリアスクリーニング情報
        system: [
          {
            courseName: '基本コース', // ヘッダーがないため汎用的な名前
            description: '当店を初めてご利用のお客様は120分コースまでとさせて頂きます。',
            prices: [
              { time: '90分コース', price: '18,000円' },
              { time: '120分コース', price: '24,000円' },
              { time: '150分コース(本指名のみ)', price: '30,000円' }
            ]
          }
        ]
      }
    };

    const { error: upsertErr } = await supabase.from('shops').upsert(SHOP_DATA, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;
    console.log(`✅ 店舗情報をID「${SHOP_ID}」で登録・更新しました。\n`);

    // --- 2. HTMLからセラピストをパース ---
    console.log(`⏳ 提供されたHTMLからセラピストを抽出中...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.therapist-datas-each');

    let newTherapists = [];
    const now = new Date().toISOString();

    items.each((_, el) => {
      const item = $(el);
      
      // 名前
      const rawName = item.find('.therapist-datas-name').text().trim();
      if (!rawName || rawName === '《新人》体入') return; // 「体入」ダミーデータは除外

      // 名前から《新人》などの装飾を消す
      const cleanName = rawName.replace(/《.*?》/g, '').replace(/[\s　]/g, '');

      // 画像
      let imageUrl = item.find('img.therapist-data-each-tmb').attr('src') || '';

      // スペック（年齢など）
      let age = '';
      let height = '';
      let cup = '';
      item.find('.therapist-datas-spec span, .therapist-datas-spec').each((_, specEl) => {
          const text = $(specEl).text().trim();
          if (text.includes('歳')) age = text;
          if (text.includes('㎝') || text.includes('cm')) height = text;
          if (text.match(/\([A-Z]\)/)) cup = text.match(/\([A-Z]\)/)[0];
      });

      // Bio（キャッチコピー）
      const bioText = item.find('.therapist-datas-bio').text().trim();

      // タグ
      const tags = [];
      item.find('.therapist-label').each((_, tagEl) => {
        tags.push($(tagEl).text().trim());
      });

      // Bioの結合
      let fullBio = '';
      if (age) fullBio += `年齢: ${age} `;
      if (height) fullBio += `身長: ${height} `;
      if (cup) fullBio += `カップ: ${cup}`;
      if (bioText) fullBio += `\n${bioText}`;

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
          original_name: rawName
        }
      });
    });

    console.log(`✅ ${newTherapists.length} 名のセラピストデータを抽出しました。\n`);

    // --- 3. Supabaseへの登録処理 ---
    console.log(`🗑️ 古いセラピストデータをクリアしています...`);
    await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);

    console.log(`📦 新しいデータを登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    console.log(`\n🎉 登録完了！「LIVSPA（自由が丘エリア）」に店舗と ${newTherapists.length}名のセラピストが登録されました。`);
    console.log('ブラウザで「Cmd + Shift + R」を押してスーパーリロードし、目黒・自由が丘の検索結果画面に表示されるか確認してください！');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
