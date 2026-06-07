import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = fs.readFileSync('.env','utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`,'m'))?.[1]?.trim().replace(/^['"]|['"]$/g,'');
const sb = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

// 全店舗取得してJSでフィルタ
const {data, error} = await sb.from('shops').select('id,name').order('id');
if(error){ console.error(error); process.exit(1); }
console.log('総店舗数:', data.length);
const kws = ['yorimichi','crest','jj','熟的','ogikubo','荻窪'];
for(const kw of kws){
  const matches = data.filter(s => s.id.toLowerCase().includes(kw.toLowerCase()) || (s.name||'').includes(kw));
  console.log(`\n=== ${kw} (${matches.length}件) ===`);
  matches.forEach(s=>console.log(' ',s.id,'|',s.name));
}
