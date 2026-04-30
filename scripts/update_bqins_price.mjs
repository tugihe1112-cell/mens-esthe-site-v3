import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const GROUP_ID = 'g_bqins';

// 画像から正確に書き起こした料金システム
const SYSTEM_DATA = [
  {
    courseName: 'SHORT COURSE (ショートコース)',
    description: 'お急ぎの方やお試しの方のショートコースとなります。背面のみのコースとなります。',
    prices: [
      { time: '60分', price: '12,000円' }
    ]
  },
  {
    courseName: 'STANDARD COURSE (スタンダードコース)',
    description: '全身のリンパを流します。集中的に施術を希望される個所がございましたら担当セラピストにお申し付けください。当店オリジナルのマッサージをご堪能頂けます。',
    prices: [
      { time: '90分', price: '16,000円' }
    ]
  },
  {
    courseName: 'PREMIER COURSE (プレミアコース)',
    description: 'リンパを深くより深く流します。レギュラーコースの施術内容がすべて含まれ、セラピストによるオリジナル施術が施されます。リピーター様に人気のコースになります。',
    prices: [
      { time: '120分', price: '22,000円' }
    ]
  },
  {
    courseName: 'PLATINUM COURSE (プラチナコース)',
    description: '時間に余裕がある方にオススメのコースです。通常のトリートメント＋セラピストのオリジナル施術を十分ご堪能頂けます。お疲れの箇所を追加してリンパを流します。',
    prices: [
      { time: '150分', price: '28,000円' }
    ]
  },
  {
    courseName: 'VIP COURSE (VIPコース)',
    description: 'ひと休みをよくばる大人の男性のためのコース。当店のこだわりすべてを体験して頂けます。ラグジュアリーなひとときをご堪能ください。',
    prices: [
      { time: '180分', price: '34,000円' }
    ]
  }
];

async function main() {
  console.log('🚀 「B-QINS (ビークインズ)」の料金システムを正確なデータで更新します...\n');

  try {
    // group_id でB-QINSの全店舗を取得
    const { data: shops, error: fetchErr } = await supabase
      .from('shops')
      .select('id, raw_data')
      .eq('group_id', GROUP_ID);

    if (fetchErr) throw fetchErr;

    if (!shops || shops.length === 0) {
      console.log('⚠️ B-QINS の店舗が見つかりませんでした。');
      return;
    }

    console.log(`🏪 ${shops.length}店舗分のデータを更新中...`);

    // 各店舗の raw_data.system を上書き
    for (const shop of shops) {
      const updatedRawData = {
        ...shop.raw_data,
        system: SYSTEM_DATA
      };

      const { error: updateErr } = await supabase
        .from('shops')
        .update({ raw_data: updatedRawData })
        .eq('id', shop.id);

      if (updateErr) throw updateErr;
      console.log(`✅ 店舗 (ID: ${shop.id}) の料金システムを更新しました。`);
    }

    console.log('\n🎉 すべての店舗の料金システム更新が完了しました！');
    console.log('ブラウザの該当店舗ページでスーパーリロードして、コース詳細が正しく表示されるかご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
