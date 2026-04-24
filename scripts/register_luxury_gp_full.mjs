import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const GROUP_ID = 'g_luxury_gp';

// 各エリアの店舗設定
const SHOPS = [
  {
    id: 'tokyo_taito_ueno_ueno_luxury', // 既存の上野店ID（更新対象）
    area_id: 'tokyo_taito_ueno',
    name: 'ラグジュアリーグループ',
    raw_data: { prefecture: '東京都', city: '台東区', area: '上野', address: '東京都台東区上野エリア' }
  },
  {
    id: 'chiba_matsudo_luxury',
    area_id: 'chiba_matsudo',
    name: 'ラグジュアリーグループ',
    raw_data: { prefecture: '千葉県', city: '松戸市', area: '松戸', address: '千葉県松戸市松戸エリア' }
  },
  {
    id: 'saitama_koshigaya_minamikoshigaya_luxury',
    area_id: 'saitama_koshigaya_minamikoshigaya',
    name: 'ラグジュアリーグループ',
    raw_data: { prefecture: '埼玉県', city: '越谷市', area: '南越谷', address: '埼玉県越谷市南越谷エリア' }
  },
  {
    id: 'chiba_ichikawa_motoyawata_luxury',
    area_id: 'chiba_ichikawa_motoyawata',
    name: 'ラグジュアリーグループ',
    raw_data: { prefecture: '千葉県', city: '市川市', area: '本八幡', address: '千葉県市川市本八幡エリア' }
  },
  {
    id: 'tokyo_katsushika_shinkoiwa_luxury',
    area_id: 'tokyo_katsushika_shinkoiwa',
    name: 'ラグジュアリーグループ',
    raw_data: { prefecture: '東京都', city: '葛飾区', area: '新小岩', address: '東京都葛飾区新小岩エリア' }
  },
  {
    id: 'tokyo_katsushika_kameari_luxury',
    area_id: 'tokyo_katsushika_kameari',
    name: 'ラグジュアリーグループ',
    raw_data: { prefecture: '東京都', city: '葛飾区', area: '亀有', address: '東京都葛飾区亀有エリア' }
  }
];

// 共通の店舗データ
const COMMON_SHOP_DATA = {
  group_id: GROUP_ID,
  schedule_url: 'https://luxury-gp.com/schedule/',
  website_url: 'https://luxury-gp.com/',
  business_hours: '11:00〜05:00', // 仮置き（適宜修正してください）
  price_system: '90分 15,000円～', // 画像より「Luxury Course」から推測
  image_url: 'https://placehold.jp/9b59b6/ffffff/400x300.png?text=%E3%83%A9%E3%82%B0%E3%82%B8%E3%83%A5%E3%82%A2%E3%83%AA%E3%83%BCG' // 仮のロゴ
};

// 料金システム（画像から抽出）
const SYSTEM_DATA = [
  {
    courseName: 'Luxury Course',
    description: '',
    prices: [
      { time: '90min', price: '15,000Yen' },
      { time: '120min', price: '20,000Yen' },
      { time: '150min', price: '25,000Yen' }
    ]
  },
  {
    courseName: 'Premium Course',
    description: 'ご案内はご指名のみとなります。極上の癒しと高技術を兼ね備えたセラピストが「あなた」を日常の疲れから解き放ちます。',
    prices: [
      { time: '120min', price: '25,000Yen' },
      { time: '150min', price: '30,000Yen' }
    ]
  }
];

// 提供されたHTMLデータ
const HTML_CONTENT = `
<article>
	<div class="in-box">
		<ul class="cast-flame">
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/18-2/"><img src="/wp-content/uploads/2026/04/IMG_2724.jpeg" alt="ゆめ ">
						<div class="today_work">本日出勤</div>						<div class="size">
							新人							ゆめ(18)<br>
							T.158（Gカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-24095/"><img src="/wp-content/uploads/2026/04/IMG_2730.jpeg" alt="あむ ">
						<div class="today_work">本日出勤</div>						<div class="size">
							新人							あむ(25)<br>
							T.159（Gカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-24138/"><img src="/wp-content/uploads/2026/04/IMG_2790.jpeg" alt="れある ">
												<div class="size">
							新人							れある(21)<br>
							T.148（Fカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-24155/"><img src="/wp-content/uploads/2026/04/IMG_2786.jpeg" alt="るい ">
												<div class="size">
							新人							るい(20)<br>
							T.163（Dカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-24006/"><img src="/wp-content/uploads/2026/03/IMG_2247.jpeg" alt="なほ ">
						<div class="today_work">本日出勤</div>						<div class="size">
							新人							なほ(19)<br>
							T.154（Cカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-24135/"><img src="/wp-content/uploads/2026/04/IMG_3355.jpeg" alt="うさ ">
												<div class="size">
							新人							うさ(25)<br>
							T.152（Eカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-24007/"><img src="/wp-content/uploads/2026/03/IMG_2644-scaled.jpeg" alt="せりな ">
												<div class="size">
							新人							せりな(22)<br>
							T.150（Dカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-23731/"><img src="/wp-content/uploads/2026/02/IMG_1884.jpeg" alt="ゆきは ">
						<div class="today_work">本日出勤</div>						<div class="size">
							新人							ゆきは(21)<br>
							T.157（Fカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-18803/"><img src="/wp-content/uploads/2025/04/IMG_3165.jpeg" alt="ゆり ">
						<div class="today_work">本日出勤</div>						<div class="size">
														ゆり(20)<br>
							T.159（Cカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-20825/"><img src="/wp-content/uploads/2025/04/IMG_3080.jpeg" alt="えな ">
												<div class="size">
														えな(26)<br>
							T.164（Gカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-22193/"><img src="/wp-content/uploads/2025/09/IMG_4793.jpeg" alt="あいり ">
												<div class="size">
														あいり(21)<br>
							T.156（Gカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-23453/"><img src="/wp-content/uploads/2026/01/IMG_0616.jpeg" alt="ちな ">
												<div class="size">
														ちな(25)<br>
							T.153（Fカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-23454/"><img src="/wp-content/uploads/2026/01/IMG_0971.jpeg" alt="るま ">
												<div class="size">
														るま(24)<br>
							T.158（Eカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-14876/"><img src="/wp-content/uploads/2025/12/IMG_7773.jpeg" alt="このは ">
						<div class="today_work">本日出勤</div>						<div class="size">
														このは(23)<br>
							T.160（Eカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-11517/"><img src="/wp-content/uploads/2025/04/IMG_3266.jpeg" alt="つきの ">
												<div class="size">
														つきの(24)<br>
							T.148（Cカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-21163/"><img src="/wp-content/uploads/2025/04/IMG_3413.jpeg" alt="ひなの ">
												<div class="size">
														ひなの(23)<br>
							T.162（Bカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-23160/"><img src="/wp-content/uploads/2025/12/IMG_9390.jpeg" alt="すず ">
						<div class="today_work">本日出勤</div>						<div class="size">
														すず(20)<br>
							T.169（Dカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-21733/"><img src="/wp-content/uploads/2025/07/IMG_4023.jpeg" alt="こゆき ">
												<div class="size">
														こゆき(23)<br>
							T.163（Eカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-13421/"><img src="/wp-content/uploads/2024/10/IMG_1082.jpeg" alt="ゆゆ ">
												<div class="size">
														ゆゆ(24)<br>
							T.155（Gカップ）
						</div>
					</a>
				</div>
			</li>
			<li>
				<div class="cast">
					<a href="https://luxury-gp.com/cast/cast-22824/"><img src="/wp-content/uploads/2025/11/IMG_7101.jpeg" alt="もも ">
												<div class="size">
														もも(25)<br>
							T.154（Eカップ）
						</div>
					</a>
				</div>
			</li>
		</ul>
	</div>
</article>
`;

async function main() {
  console.log('🚀 「ラグジュアリーグループ」の全6店舗作成とセラピスト20名の一括登録を開始します...\n');

  try {
    // --- 1. 店舗の統合と作成 ---
    console.log('🏪 店舗データをグループ化して更新・作成中...');
    const shopsToUpsert = SHOPS.map(shop => ({
      ...COMMON_SHOP_DATA,
      id: shop.id,
      area_id: shop.area_id,
      name: shop.name,
      raw_data: { ...shop.raw_data, system: SYSTEM_DATA } // エリア情報と料金システムを結合
    }));

    const { error: shopUpsertErr } = await supabase.from('shops').upsert(shopsToUpsert, { onConflict: 'id' });
    if (shopUpsertErr) throw shopUpsertErr;

    console.log('✅ 6店舗の統合と作成が完了しました。');

    // --- 2. HTMLからセラピストをパース ---
    console.log(`⏳ HTMLからセラピストを抽出中...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.cast-flame li');

    let baseTherapists = [];
    const now = new Date().toISOString();

    items.each((_, el) => {
      const item = $(el);
      
      const imgTag = item.find('img');
      const rawName = imgTag.attr('alt') ? imgTag.attr('alt').trim() : '';
      if (!rawName) return;

      const cleanName = rawName.replace(/[\s　]/g, '');

      let imageUrl = imgTag.attr('src') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https://luxury-gp.com${imageUrl}`;
      }
      
      const sizeText = item.find('.size').text().trim();
      const isNew = sizeText.includes('新人');
      const tags = [];
      if(isNew) tags.push('新人');

      // "新人ゆめ(18) T.158（Gカップ）" のようなテキストから抽出
      let age = '';
      let height = '';
      let cup = '';
      
      const nameAgeMatch = sizeText.match(/\((\d+)\)/);
      if (nameAgeMatch) age = nameAgeMatch[1] + '歳';

      const hMatch = sizeText.match(/T\.(\d+)/);
      if (hMatch) height = hMatch[1] + 'cm';
      
      const cMatch = sizeText.match(/（([A-Z]カップ)）/);
      if (cMatch) cup = cMatch[1];

      let fullBio = '';
      if (age) fullBio += `年齢: ${age} `;
      if (height) fullBio += `身長: ${height} `;
      if (cup) fullBio += `カップ: ${cup}`;

      baseTherapists.push({
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

    console.log(`✅ ${baseTherapists.length} 名のベースセラピストデータを抽出しました。`);

    // --- 3. 各店舗へセラピストをコピーして登録 ---
    console.log(`🗑️ 各店舗の古いセラピストデータをクリアしています...`);
    for (const shop of SHOPS) {
        await supabase.from('therapists').delete().eq('shop_id', shop.id);
    }

    console.log(`📦 抽出したセラピストを各店舗へ紐付け中...`);
    let allTherapistsToInsert = [];
    for (const shop of SHOPS) {
        const shopTherapists = baseTherapists.map(t => ({
            ...t,
            id: `${shop.id}_${t.name}`,
            shop_id: shop.id
        }));
        allTherapistsToInsert = allTherapistsToInsert.concat(shopTherapists);
    }

    const chunkSize = 100;
    for (let i = 0; i < allTherapistsToInsert.length; i += chunkSize) {
      const chunk = allTherapistsToInsert.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    console.log(`\n🎉 登録完了！「ラグジュアリーグループ」の全6店舗に、それぞれ ${baseTherapists.length}名のセラピストが登録されました。`);
    console.log('共通の group_id が設定されているため、クチコミは統合されます。');
    console.log('ブラウザでスーパーリロードしてご確認ください！');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
