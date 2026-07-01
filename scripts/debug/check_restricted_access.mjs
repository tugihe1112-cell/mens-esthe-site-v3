// 制限中（Services restricted / 402）にどのAPIが生きてるか判定する
// 目的: 無料R2移行が「今」できるか（Storage DL/list が通るか）を確定させる
// 実行: node scripts/debug/check_restricted_access.mjs
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const URL = getEnv('VITE_SUPABASE_URL');
const SERVICE = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const ANON = getEnv('VITE_SUPABASE_ANON_KEY');

console.log('=== 制限中アクセス診断 ===');
console.log('URL        :', URL);
console.log('SERVICE KEY:', SERVICE ? 'あり' : '❌なし（.envにSUPABASE_SERVICE_ROLE_KEYが必要）');
console.log('');

const sb = createClient(URL, SERVICE || ANON, { auth: { persistSession: false } });

// 1) DB読み取り（PostgREST）— サイト本体が使う経路
try {
  const { data, error } = await sb.from('therapists').select('id,image_url').limit(1);
  if (error) console.log('1) DB read     : ❌ NG  ->', error.message || JSON.stringify(error));
  else console.log('1) DB read     : ✅ OK  ->', data?.[0]?.id);
} catch (e) { console.log('1) DB read     : ❌ throw ->', e.message); }

// 2) Storageファイル一覧（list）— 移行で対象を列挙する経路
let firstFile = null;
try {
  const { data, error } = await sb.storage.from('therapist-images').list('', { limit: 5, sortBy: { column: 'name', order: 'asc' } });
  if (error) console.log('2) Storage list: ❌ NG  ->', error.message || JSON.stringify(error));
  else {
    firstFile = data?.find(f => f.id) || data?.[0] || null;
    console.log('2) Storage list: ✅ OK  ->', data?.length, '件 例:', data?.slice(0, 3).map(f => f.name).join(', '));
  }
} catch (e) { console.log('2) Storage list: ❌ throw ->', e.message); }

// 3) Storageダウンロード（download）— 移行でR2へ運ぶ前のDL経路
try {
  if (!firstFile) { console.log('3) Storage DL  : ⏭  list失敗のためスキップ'); }
  else {
    const { data, error } = await sb.storage.from('therapist-images').download(firstFile.name);
    if (error) console.log('3) Storage DL  : ❌ NG  ->', error.message || JSON.stringify(error));
    else {
      const kb = Math.round((await data.arrayBuffer()).byteLength / 1024);
      console.log('3) Storage DL  : ✅ OK  ->', firstFile.name, kb, 'KB');
    }
  }
} catch (e) { console.log('3) Storage DL  : ❌ throw ->', e.message); }

console.log('');
console.log('=== 判定 ===');
console.log('全部✅ → 無料R2移行を今すぐ実行可能');
console.log('1や2や3が402/NG → 制限中はAPIが死んでる＝無料移行は今できない（別の手が必要）');
