import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  // 「王液コース」などの特殊なコース名や、不要なカッコを取り除く
  return rawName.replace(/\(.*?\)|（.*?）/g, '').replace('コース', '').trim();
}

const CONFIG = {
  // 古い名前「アルパカの想い」でも検索できるようにする
  searchKeyword: '%メンズパスタイム%', 
  searchKeyword2: '%アルパカの想い%',
  areaId: 'tokyo_toshima_ikebukuro', // 池袋エリア
  shopName: 'メンズパスタイム (旧アルパカの想い)',
  websiteUrl: 'https://mens-pastime.com/',
  scheduleUrl: 'https://mens-pastime.com/schedule.html',
  // 画像から抽出した料金システム
  priceSystem: '90分\n15,000円(税込)\n120分\n20,000円(税込)\n150分\n25,000円(税込)' 
};

// HTMLから抽出したキャストデータ（ノイズである「王液コース」は後で除外）
const therapistsRaw = [
  { rawName: '王液コース', image: 'https://mens-pastime.com/data/staff/96/stf_6809e14723d20.webp' }, // ※除外用
  { rawName: '最上（もがみ）(44)', image: 'https://mens-pastime.com/data/staff/129/stf_69d5e09342de9.webp' },
  { rawName: '与田（よだ）(42)', image: 'https://mens-pastime.com/data/staff/128/stf_69d5e0a85721b.webp' },
  { rawName: '葉月（はづき）(44)', image: 'https://mens-pastime.com/data/staff/127/stf_69d5e0c0b5bcc.webp' },
  { rawName: '椎名（しいな）(48)', image: 'https://mens-pastime.com/data/staff/125/stf_69cf388431e50.webp' },
  { rawName: '秋保（あきほ）(42)', image: 'https://mens-pastime.com/data/staff/124/stf_69c6134db455c.webp' },
  { rawName: '逢沢（あいざわ）(35)', image: 'https://mens-pastime.com/data/staff/122/stf_69b0c7bfea9be.webp' },
  { rawName: '片瀬(かたせ)(30)', image: 'https://mens-pastime.com/data/staff/120/stf_699a985645ec7.webp' },
  { rawName: '森高（もりたか）(48)', image: 'https://mens-pastime.com/data/staff/117/stf_698295ecc9c8f.webp' },
  { rawName: '大黒（おおぐろ）(39)', image: 'https://mens-pastime.com/data/staff/115/stf_691fb7fbef157.webp' },
  { rawName: '金子（かねこ）(44)', image: 'https://mens-pastime.com/data/staff/114/stf_6909a4880dd98.webp' },
  { rawName: '杉河（すぎかわ）(47)', image: 'https://mens-pastime.com/data/staff/113/stf_69076106ba6c6.webp' },
  { rawName: '如月（きさらぎ）(44)', image: 'https://mens-pastime.com/data/staff/112/stf_691eac94150e6.gif' },
  { rawName: '瀬戸（せと）(38)', image: 'https://mens-pastime.com/data/staff/107/stf_68e758cb8f85b.webp' },
  { rawName: '大山（おおやま）(36)', image: 'https://mens-pastime.com/data/staff/105/stf_68be3a55ee276.webp' },
  { rawName: '美桃（みとう）(40)', image: 'https://mens-pastime.com/data/staff/102/stf_686759dc3ebed.webp' },
  { rawName: '有原（ありはら）(34)', image: 'https://mens-pastime.com/data/staff/98/stf_6855076b76755.webp' },
  { rawName: '岩倉（いわくら）(40)', image: 'https://mens-pastime.com/data/staff/97/stf_68202ee340151.webp' },
  { rawName: '沢井（さわい）(45)', image: 'https://mens-pastime.com/data/staff/95/stf_67f0c14112736.webp' },
  { rawName: '睦月（むつき）(46)', image: 'https://mens-pastime.com/data/staff/90/stf_6944bdd0a4a51.webp' },
  { rawName: '牧野（まきの）(35)', image: 'https://mens-pastime.com/data/staff/82/stf_674023f071226.webp' },
  { rawName: '蒼井（あおい）(47)', image: 'https://mens-pastime.com/data/staff/43/stf_672addf424461.webp' },
  { rawName: '志摩（しま）(41)', image: 'https://mens-pastime.com/data/staff/75/stf_67e7847d6dd96.webp' },
  { rawName: '泉（いずみ）(44)', image: 'https://mens-pastime.com/data/staff/67/stf_66a338233d1c4.webp' },
  { rawName: '米倉（よねくら）(46)', image: 'https://mens-pastime.com/data/staff/62/stf_666bdf19c7cac.webp' },
  { rawName: '深津（ふかつ）(45)', image: 'https://mens-pastime.com/data/staff/49/stf_66162de97bfbe.webp' },
  { rawName: '三雲（みくも）(44)', image: 'https://mens-pastime.com/data/staff/48/stf_65fe4380cc31b.webp' },
  { rawName: '高宮（たかみや）(40)', image: 'https://mens-pastime.com/data/staff/51/stf_65fe4366cd36b.webp' },
  { rawName: '霧島（きりしま）(36)', image: 'https://mens-pastime.com/data/staff/42/stf_6607811ca1302.webp' },
  { rawName: '堀田（ほった）(43)', image: 'https://mens-pastime.com/data/staff/13/stf_658d2598a905c.webp' },
  { rawName: '皐月（さつき）(48)', image: 'https://mens-pastime.com/data/staff/21/stf_65879bb0b5430.webp' },
  { rawName: '小島（こじま）(45)', image: 'https://mens-pastime.com/data/staff/27/stf_6613990ce1ac5.webp' },
  { rawName: '小栗（おぐり）(37)', image: 'https://mens-pastime.com/data/staff/34/stf_66078108eb0c7.webp' },
  { rawName: '知念（ちねん）(34)', image: 'https://mens-pastime.com/data/staff/31/stf_664ab713d8423.webp' },
  { rawName: '坂本（さかもと）(33)', image: 'https://mens-pastime.com/data/staff/15/stf_659f50ba8a69f.webp' },
  { rawName: '手塚（てづか）(37)', image: 'https://mens-pastime.com/data/staff/89/stf_67ad48fddabb1.webp' },
  { rawName: '艶島（つやしま）(53)', image: 'https://mens-pastime.com/data/staff/130/stf_69e08290bd2f3.webp' },
  { rawName: '水島(みずしま)(55)', image: 'https://mens-pastime.com/data/staff/126/stf_69cc76ea1c89b.webp' }
];

async function main() {
  console.log(`🚀 ${CONFIG.shopName}：ステップ① データ登録を開始します...\n`);
  const now = new Date().toISOString();
  
  try {
    // 1. 池袋エリアで店舗を特定（新旧両方の名前で検索）
    const { data: shops, error: searchError } = await supabase
      .from('shops')
      .select('id')
      .eq('area_id', CONFIG.areaId)
      .or(`name.ilike.${CONFIG.searchKeyword},name.ilike.${CONFIG.searchKeyword2}`)
      .limit(1);

    if (searchError) throw searchError;

    const targetId = (shops && shops.length > 0) ? shops[0].id : crypto.randomUUID();

    if (shops?.length > 0) {
      console.log(`✅ 既存の「メンズパスタイム(旧アルパカの想い)」枠を発見しました。データを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、新規IDを発行して登録します。`);
    }

    // 2. 店舗情報の更新
    console.log(`⚙️ 店舗データ(shops)を更新中...`);
    await supabase.from('shops').upsert({
      id: targetId,
      area_id: CONFIG.areaId,
      name: CONFIG.shopName,
      website_url: CONFIG.websiteUrl,
      schedule_url: CONFIG.scheduleUrl,
      price_system: CONFIG.priceSystem
    });

    // 3. キャスト登録（ノイズ「王液」の除外処理を含む）
    const payload = therapistsRaw
      .filter(t => !t.rawName.includes('王液')) // 人間ではないコースデータを除外
      .map(t => {
        const clean = cleanseName(t.rawName);
        return {
          id: `${targetId}_${clean}`,
          shop_id: targetId,
          name: clean,
          image_url: t.image?.trim() || null,
          is_active: true,
          last_seen_at: now,
          raw_data: { original_name: t.rawName }
        };
    });

    console.log(`⚙️ セラピストデータ(therapists)を登録中...`);
    await supabase.from('therapists').upsert(payload);

    // 4. 自動退店処理
    const { data: inactives } = await supabase.from('therapists')
      .update({ is_active: false })
      .eq('shop_id', targetId)
      .lt('last_seen_at', now)
      .select('name');

    console.log(`✅ ${payload.length} 名のキャスト情報を登録・更新しました。`);
    if (inactives?.length > 0) {
      console.log(`📉 今回取得できなかった ${inactives.length}名 を非表示にしました。`);
    }

    console.log('\n🎉 メンズパスタイムのデータ登録（ステップ①）が完了しました！');
    console.log('ロゴ（ステップ②）の準備ができましたら、画像URLをお待ちしております。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
