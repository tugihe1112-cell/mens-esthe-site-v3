/**
 * 千葉・埼玉 image=なし店舗の画像URL一括更新
 * Chrome経由で収集したog:image / logo URLをDBに設定
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(
  getEnv('VITE_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')
);

// Chrome収集結果
const IMAGE_MAP = {
  'chiba_chiba_madame_relax':            'https://www.madame-relax.com/chiba/images/logo.png',
  'chiba_matsudo_aroma_mrs':             'https://aromamrs.com/images/main3.png',
  'chiba_matsudo_paradise_spa':          'https://paradise-spa.info/images/logo.png',
  'chiba_kashiwa_bijo_spa':             'https://img.o-pack.jp/shop/oushitsu/parts/logo.png',
  'saitama_omiya_mrs_eternity':          'https://salon-eternity.com/images/logo.png',
  // saitama_omiya_aroma_castle: サイトダウン → null
  'saitama_warabi_otona_no_teishajou':   'https://otei.ug11pm.com/otei/logo.png',
  'saitama_warabi_magokoro_spa':         'https://magokoro-spa.com/images/head-mv-logo-line.png',
  // saitama_kawaguchi_pattaya_resort: 画像なし
  'saitama_koshigaya_aroma_liberty':     'https://aromaliberty.com/img/aromaliberty2.png',
  // saitama_kasukabe_kyoko_no_shimai: サイトダウン → null
  'saitama_kawagoe_nature':              'https://www.nature-esthetic.com/upFu8/1000284/official/officialConf/logoresponsive/img/logo1.png',
  'saitama_kawagoe_lamp':                'https://kawagoe.senju-lamp.com/kawagoe/logo.png',
  // saitama_kawagoe_anela_spa: サイトダウン → null
  'saitama_tokorozawa_miyako':           'https://miyakospa.com/upFu8/1003917/official/officialConf/logoresponsive/img/logo1.png',
  'saitama_tokorozawa_lamp':             'https://tokorozawa.senju-lamp.com/tokorozawa/logo.png',
};

async function main() {
  let updated = 0;
  for (const [id, image_url] of Object.entries(IMAGE_MAP)) {
    const { error } = await supabase.from('shops').update({ image_url }).eq('id', id);
    if (error) {
      console.log(`❌ ${id}: ${error.message}`);
    } else {
      console.log(`✅ ${id}`);
      updated++;
    }
  }
  console.log(`\n更新完了: ${updated}件`);
}

main();
