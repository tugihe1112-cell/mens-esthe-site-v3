/**
 * Bed of Roses の threeSize フォーマット確認
 * 実行: node scripts/debug/debug_bed_of_roses_threesize.mjs
 */
const DATA_JS_URL = 'https://3days-cms-bucket-prod.s3.ap-northeast-1.amazonaws.com/cms-content/1043/js/data.js';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

async function run() {
  const dataJs = await fetch(DATA_JS_URL, { headers: ua }).then(r => r.text());
  const evalResult = {};
  const wrapped = dataJs.replace(/^(?:var|const|let)\s+(\w+)\s*=/, (_, v) => `evalResult["${v}"] =`);
  new Function('evalResult', wrapped)(evalResult);
  const parsed = Object.values(evalResult)[0];

  console.log('=== schedules threeSize サンプル ===');
  (parsed.schedules || []).slice(0, 20).forEach(s =>
    console.log(`  ${s.therapistName}: threeSize="${s.threeSize}" age=${s.age} height=${s.height}`)
  );

  console.log('\n=== therapists フィールド一覧（先頭1件全キー） ===');
  const t0 = (parsed.therapists || [])[0];
  if (t0) console.log(JSON.stringify(t0, null, 2));
}

run().catch(e => console.error('❌', e.message));
