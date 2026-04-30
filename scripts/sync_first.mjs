import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const shopData = {
  website_url: "https://esthe-first.com/",
  schedule_url: "https://esthe-first.com/schedule.html",
  group_id: "g_brand_first",
  price_system: `【Day Time 12:00〜17:00】
70分コース: 10,000円
100分コース: 15,000円 (人気のお時間)
130分コース: 20,000円
160分コース: 25,000円
190分コース: 30,000円
延長30分: 6,000円

【Night Time 17:00〜29:00】
70分コース: 12,000円
100分コース: 17,000円 (人気のお時間)
130分コース: 22,000円
160分コース: 27,000円
190分コース: 32,000円
延長30分: 6,000円`,
  casts: [
    { name: "坂本まなか", age: 24, size: "162cm Ccup", img: "https://esthe-first.com/photo/staff/5/106078_1_20260425162102.png" },
    { name: "高井らん", age: 20, size: "157cm Ecup", img: "https://esthe-first.com/photo/staff/5/106050_1_20260408132044.png" },
    { name: "大崎えり", age: 19, size: "155cm Bcup", img: "https://esthe-first.com/photo/staff/5/106040_1_20260401190405.jpg" },
    { name: "一ノ瀬るな", age: 25, size: "156cm Gcup", img: "https://esthe-first.com/photo/staff/5/106028_1_20260329214900.png" },
    { name: "大田さやか", age: 28, size: "170cm Hcup", img: "https://esthe-first.com/photo/staff/5/105996_1_20260320155837.png" },
    { name: "春川さくら", age: 27, size: "155cm Ecup", img: "https://esthe-first.com/photo/staff/5/105977_1_20260306070139.jpg" },
    { name: "鹿島あゆ", age: 25, size: "153cm Ccup", img: "https://esthe-first.com/photo/staff/5/105976_1_20260305024916.jpg" },
    { name: "松本さちか", age: 21, size: "156cm Ccup", img: "https://esthe-first.com/photo/staff/5/105913_1_20260127013741.jpg" },
    { name: "橘しずく", age: 24, size: "157cm Ccup", img: "https://esthe-first.com/photo/staff/5/105804_1_20251219212812.jpg" },
    { name: "辻せりな", age: 23, size: "155cm Ccup", img: "https://esthe-first.com/photo/staff/5/105737_1_20251117195554.jpg" },
    { name: "藤崎さや", age: 22, size: "153cm Ccup", img: "https://esthe-first.com/photo/staff/5/105701_1_20251013162948.jpg" },
    { name: "白石れい", age: 19, size: "149cm Dcup", img: "https://esthe-first.com/photo/staff/5/105686_1_20251018204106.jpg" },
    { name: "高瀬かえで", age: 23, size: "158cm Ccup", img: "https://esthe-first.com/photo/staff/5/105653_1_20250916002943.jpg" },
    { name: "結城めい", age: 23, size: "157cm Ecup", img: "https://esthe-first.com/photo/staff/5/105643_1_20250910111105.jpg" },
    { name: "真白かりん", age: 22, size: "158cm Dcup", img: "https://esthe-first.com/photo/staff/5/105532_1_20250813103714.jpg" },
    { name: "山中みく", age: 22, size: "168cm Ecup", img: "https://esthe-first.com/photo/staff/5/105503_1_20250802211023.jpg" },
    { name: "中野さな", age: 24, size: "166cm Ccup", img: "https://esthe-first.com/photo/staff/5/105509_1_20250703023202.jpg" },
    { name: "椿ゆきの", age: 18, size: "154cm Fcup", img: "https://esthe-first.com/photo/staff/5/105450_1_20250625001732.jpg" },
    { name: "星野みき", age: 29, size: "175cm Gcup", img: "https://esthe-first.com/photo/staff/5/105421_1_20250602170439.jpg" },
    { name: "綾瀬せいら", age: 27, size: "165cm Ecup", img: "https://esthe-first.com/photo/staff/5/105405_1_20260313181923.jpg" },
    { name: "中村りりあ", age: 24, size: "160cm Dcup", img: "https://esthe-first.com/photo/staff/5/105358_1_20251119155209.jpg" },
    { name: "北川すず", age: 22, size: "161cm Ecup", img: "https://esthe-first.com/photo/staff/5/105349_1_20250427130214.jpg" },
    { name: "水瀬みおん", age: 23, size: "165cm Ecup", img: "https://esthe-first.com/photo/staff/5/105040_1_20250125231813.jpg" },
    { name: "小森ゆあ", age: 22, size: "154cm Dcup", img: "https://esthe-first.com/photo/staff/5/104949_1_20241119001811.jpg" },
    { name: "風間つばき", age: 23, size: "168cm Fcup", img: "https://esthe-first.com/photo/staff/5/104905_1_20250205143837.jpg" },
    { name: "森すみか", age: 24, size: "154cm Dcup", img: "https://esthe-first.com/photo/staff/5/104847_1_20250225232219.jpg" },
    { name: "白井ゆき", age: 19, size: "156cm Dcup", img: "https://esthe-first.com/photo/staff/5/104671_1_20240615174936.jpg" },
    { name: "織田もも", age: 24, size: "154cm Ecup", img: "https://esthe-first.com/photo/staff/5/104515_1_20241129234420.jpg" },
    { name: "木村さき", age: 21, size: "167cm Dcup", img: "https://esthe-first.com/photo/staff/5/104280_1_20240115041758.jpg" },
    { name: "真野ゆな", age: 27, size: "152cm Ccup", img: "https://esthe-first.com/photo/staff/5/103651_1_20230805155429.jpg" },
    { name: "森田りこ", age: 24, size: "155cm Gcup", img: "https://esthe-first.com/photo/staff/5/103541_1_20230629031057.jpg" },
    { name: "白咲なな", age: 22, size: "151cm Fcup", img: "https://esthe-first.com/photo/staff/5/103472_1_20250414210357.jpg" },
    { name: "佐藤ふうか", age: 22, size: "164cm Ecup", img: "https://esthe-first.com/photo/staff/5/103391_1_20230503123235.jpg" },
    { name: "福美れい", age: 24, size: "161cm Dcup", img: "https://esthe-first.com/photo/staff/5/101107_1_20210803210415.jpg" },
    { name: "彩川みゆき", age: 24, size: "152cm Ecup", img: "https://esthe-first.com/photo/staff/5/100872_1_20230513210555.jpg" },
    { name: "大槻かな", age: 25, size: "158cm Ecup", img: "https://esthe-first.com/photo/staff/5/100162_1_20230303195332.jpg" },
    { name: "大谷まいか", age: 21, size: "166cm Dcup", img: "https://esthe-first.com/photo/staff/5/99478_1_20200113191439.jpg" },
    { name: "佐野りほ", age: 25, size: "152cm Dcup", img: "https://esthe-first.com/photo/staff/5/99384_1_20221025202318.jpg" },
    { name: "霧島すみれ", age: 28, size: "156cm Ccup", img: "https://esthe-first.com/photo/staff/5/98855_1_20190804123432.jpg" },
    { name: "南かれん", age: 25, size: "163cm Dcup", img: "https://esthe-first.com/photo/staff/5/98123_1_20260329132504.jpg" },
    { name: "三上みか", age: 24, size: "156cm Dcup", img: "https://esthe-first.com/photo/staff/5/97747_1_20181025170820.jpg" },
    { name: "藤井リナ", age: 28, size: "158cm Dcup", img: "https://esthe-first.com/photo/staff/5/97815_1_20230330211943.jpg" }
  ]
};

async function main() {
  console.log('⏳ 「新宿ファースト(First)」の店舗を検索中...');

  // 1. 店舗を検索（First または ファースト を含む）
  const { data: shops, error: searchErr } = await supabase
    .from('shops')
    .select('id, name')
    .or('name.ilike.%First%,name.ilike.%ファースト%');

  if (searchErr || !shops || shops.length === 0) {
    console.error('❌ Firstの店舗IDが見つかりませんでした。DBの登録名を確認してください。');
    return;
  }

  const shopId = shops[0].id;
  console.log(`✅ 対象店舗を発見: ${shops[0].name} (ID: ${shopId})`);

  // 2. 店舗情報の更新 (ルールに従い group_id もセット)
  console.log('⏳ 店舗情報とグループIDを更新中...');
  const { error: shopErr } = await supabase
    .from('shops')
    .update({ 
      website_url: shopData.website_url,
      schedule_url: shopData.schedule_url,
      price_system: shopData.price_system,
      group_id: shopData.group_id
    })
    .eq('id', shopId);

  if (shopErr) {
    console.error('❌ 店舗更新エラー:', shopErr.message);
    return;
  }

  // 3. 古いキャストデータをクリーンアップ
  await supabase
    .from('therapists')
    .delete()
    .eq('shop_id', shopId);

  // 4. 全42名のデータを挿入
  console.log('⏳ キャスト42名のデータを一括登録中...');
  const insertData = shopData.casts.map(cast => ({
    id: `${shopId}_${cast.name.replace(/[\s　]+/g, '')}`,
    shop_id: shopId,
    name: cast.name,
    age: cast.age,
    image_url: cast.img,
    raw_data: { size: cast.size } // サイズ情報を保持
  }));

  const { error: tErr } = await supabase
    .from('therapists')
    .insert(insertData);

  if (tErr) {
    console.error(' ❌ キャスト挿入エラー:', tErr.message);
  } else {
    console.log(` 🎉 全${insertData.length}名のキャストを登録完了！`);
  }
}

main();
