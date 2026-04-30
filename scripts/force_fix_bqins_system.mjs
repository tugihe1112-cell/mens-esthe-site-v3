import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const TARGET_IDS = [
  'tokyo_setagaya_sangenjaya_bqins',
  'tokyo_meguro_jiyugaoka_bqins',
  'tokyo_meguro_nakameguro_bqins'
];

const SYSTEM_DATA = [
  {
    courseName: 'SHORT COURSE (ショートコース)',
    description: 'お急ぎの方やお試しの方のショートコースとなります。背面のみのコースとなります。',
    prices: [{ time: '60分', price: '12,000円' }]
  },
  {
    courseName: 'STANDARD COURSE (スタンダードコース)',
    description: '全身のリンパを流します。集中的に施術を希望される個所がございましたら担当セラピストにお申し付けください。当店オリジナルのマッサージをご堪能頂けます。',
    prices: [{ time: '90分', price: '16,000円' }]
  },
  {
    courseName: 'PREMIER COURSE (プレミアコース)',
    description: 'リンパを深くより深く流します。レギュラーコースの施術内容がすべて含まれ、セラピストによるオリジナル施術が施されます。リピーター様に人気のコースになります。',
    prices: [{ time: '120分', price: '22,000円' }]
  },
  {
    courseName: 'PLATINUM COURSE (プラチナコース)',
    description: '時間に余裕がある方にオススメのコースです。通常のトリートメント＋セラピストのオリジナル施術を十分ご堪能頂けます。お疲れの箇所を追加してリンパを流します。',
    prices: [{ time: '150分', price: '28,000円' }]
  },
  {
    courseName: 'VIP COURSE (VIPコース)',
    description: 'ひと休みをよくばる大人の男性のためのコース。当店のこだわりすべてを体験して頂けます。ラグジュアリーなひとときをご堪能ください。',
    prices: [{ time: '180分', price: '34,000円' }]
  }
];

async function main() {
  console.log('🚀 B-QINSの料金システムをデータベース強制更新＆ローカル同期します...\n');

  try {
    // 1. Supabaseの確実な更新
    console.log('⏳ データベース(Supabase)を更新中...');
    const { data: shops, error: fetchErr } = await supabase
      .from('shops')
      .select('id, raw_data')
      .in('id', TARGET_IDS);

    if (fetchErr) throw fetchErr;

    for (const shop of shops) {
      const updatedRawData = { ...shop.raw_data, system: SYSTEM_DATA };
      await supabase.from('shops').update({ raw_data: updatedRawData }).eq('id', shop.id);
      console.log(`✅ DB更新完了: ${shop.id}`);
    }

    // 2. ローカルJSONへの同期（画面反映のため）
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
        console.log(`✅ キャッシュ同期完了: ${p}`);
      }
    });

    console.log('\n🎉 強制更新と同期が完了しました！');
    console.log('Viteサーバーを再起動（Ctrl+C -> npm run dev）し、ブラウザでスーパーリロード（Cmd + Shift + R）してご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
