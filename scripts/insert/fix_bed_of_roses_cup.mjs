/**
 * Bed of Roses の cup を一括修正
 * 実行: node scripts/insert/fix_bed_of_roses_cup.mjs
 */
import fs from 'fs';

const SHOP_ID = 'kanagawa_musashikosugi_bed_of_roses';
const DATA_JS_URL = 'https://3days-cms-bucket-prod.s3.ap-northeast-1.amazonaws.com/cms-content/1043/js/data.js';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

function parseCup(threeSize) {
  if (!threeSize) return undefined;
  // 全角英字を半角に正規化して最初の A-J を取る
  const normalized = String(threeSize).normalize('NFKC').toUpperCase();
  const m = normalized.match(/([A-J])(?:CUP|$|\s)/);
  if (m) return m[1];
  const m2 = normalized.match(/([A-J])/);
  return m2 ? m2[1] : undefined;
}

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => envContent.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

  // data.js 取得
  const dataJs = await fetch(DATA_JS_URL, { headers: ua }).then(r => r.text());
  const evalResult = {};
  const wrapped = dataJs.replace(/^(?:var|const|let)\s+(\w+)\s*=/, (_, v) => `evalResult["${v}"] =`);
  new Function('evalResult', wrapped)(evalResult);
  const parsed = Object.values(evalResult)[0];

  // 既存セラピスト一覧を取得
  const existRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}&select=id,name,raw_data`, { headers });
  const existing = await existRes.json();
  console.log(`既存: ${existing.length}名`);

  // therapist の threeSize を name でマッピング
  const specByName = {};
  for (const t of (parsed.therapists || [])) {
    const name = (t.therapistName || '').trim();
    if (!name) continue;
    specByName[name] = {
      age: t.age ? parseInt(t.age) : undefined,
      height: t.height ? parseInt(t.height) : undefined,
      cup: parseCup(t.threeSize),
    };
  }

  let updated = 0;
  for (const row of existing) {
    const spec = specByName[row.name];
    if (!spec) { console.log(`  ⚠️ ${row.name}: data.js に見つからず`); continue; }
    const newRawData = { ...row.raw_data };
    if (spec.age) newRawData.age = spec.age;
    if (spec.height) newRawData.height = spec.height;
    if (spec.cup) newRawData.cup = spec.cup;

    const patchRes = await fetch(`${supabaseUrl}/rest/v1/therapists?id=eq.${row.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ raw_data: newRawData }),
    });
    if (patchRes.ok) {
      console.log(`  ✅ ${row.name}: cup=${spec.cup} age=${spec.age} h=${spec.height}`);
      updated++;
    } else {
      console.log(`  ❌ ${row.name}: ${await patchRes.text()}`);
    }
  }

  console.log(`\n更新完了: ${updated}名`);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
