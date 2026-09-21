/**
 * compare_area_address_judgement.mjs — 「このエリア名は、この住所の場所を指しているか」を測る
 *
 * 【なぜこの判定なのか（2026-09-21）】
 * 9/20に Jev（TypeSafe AI）を**在籍者のノイズ判定**で測ったら、いまの正規表現に負けた。
 * 部屋名・素材名は**文字列の型**で、正規表現がもともと強い領域だったから。
 * ⇒ 逆に、正規表現が**原理的に解けない**のがこちら。
 *   9/15、`inspect_area_address_mismatch.mjs` の②段に121件出たので1件ずつ見たところ、
 *   **本当に間違っていたのは2件だけ＝誤検知98%**だった。外した理由は綴りではなく**地理の知識**:
 *     「代々木」と「北参道」は隣、「新宿2丁目」は新宿御苑の隣、「百人町」は大久保、
 *     「北参道」は代々木と原宿の間 … 文字は一致しないが**場所は合っている**。
 *   綴りを見ている限り、この誤検知は減らせない。
 *
 * 【測るもの】正解ではなく**絞り込めるか**。
 *   いまの規則が出す候補を、Jev が「住所と同じ場所」「判断できない住所」として
 *   どれだけ落とせるか＝**人が目で見る件数がどこまで減るか**。
 *   ⚠️ 9/15に見つかった本物2件（THE HALF / Silk）は**もう直してある**ので、
 *      「取りこぼさないか（再現率）」はこのデータでは測れない。**測れないことを測ったと言わない。**
 *      ここで分かるのは誤検知の減り方だけ。残った件は**必ず人が開いて確かめる**。
 *
 * 【この道具がやらないこと】DBを1行も変えない。モデルの答えを確証として扱わない。
 *   出すのは「人が見る順番」まで（9/20の結論と同じ）。
 *
 * 使い方:
 *   node scripts/maintenance/inspect_area_address_mismatch.mjs --json=outputs/jev-trial/area-candidates.json
 *   node scripts/maintenance/compare_area_address_judgement.mjs                （下見。APIを呼ばない）
 *   node scripts/maintenance/compare_area_address_judgement.mjs --run          （実際に問い合わせる）
 *   … --run --limit=40 / --band=strong|weak|all
 */
import fs from 'node:fs';

const ENV = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : '';
const env = (n) => (ENV.match(new RegExp(`^${n}=(.*)$`, 'm'))?.[1] ?? process.env[n] ?? '').trim().replace(/^['"]|['"]$/g, '');

const args = process.argv.slice(2);
// 🚩 知らない引数を黙って捨てない（2026-09-20、`--discover` を無視して課金だけされた）。
const KNOWN = [/^--run$/, /^--limit=\d+$/, /^--band=(strong|weak|all)$/, /^--in=.+$/];
const unknown = args.filter((a) => !KNOWN.some((re) => re.test(a)));
if (unknown.length) {
  console.error(`❌ 知らない引数です: ${unknown.join(' ')}`);
  console.error('   使えるのは --run / --limit=N / --band=strong|weak|all / --in=<json> だけです。');
  process.exit(1);
}
const RUN = args.includes('--run');
const LIMIT = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || 0);
const BAND = args.find((a) => a.startsWith('--band='))?.split('=')[1] || 'all';
const IN = args.find((a) => a.startsWith('--in='))?.split('=')[1] || 'outputs/jev-trial/area-candidates.json';
const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const CONCURRENCY = 4;

if (!fs.existsSync(IN)) {
  console.error(`❌ ${IN} がありません。先に候補を書き出してください:`);
  console.error(`   node scripts/maintenance/inspect_area_address_mismatch.mjs --json=${IN}`);
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(IN, 'utf-8'));
const pool = BAND === 'strong' ? data.strong : BAND === 'weak' ? data.weak : [...data.strong, ...data.weak];
const rows = LIMIT ? pool.slice(0, LIMIT) : pool;

console.log(`候補 ${data.total}件（① 住所が詳しい ${data.strong.length} / ② 市区まで ${data.weak.length}）`);
console.log(`今回訊くのは ${rows.length}件（band=${BAND}）`);
for (const r of rows.slice(0, 3)) console.log(`  例) ${r.name} … エリア「${r.area}」／ 住所「${r.address}」`);

const API_KEY = env('TYPESAFE_API_KEY');
if (!RUN) {
  console.log('\nこれは下見です。APIは1回も呼んでいません。--run を付けると問い合わせます。');
  process.exit(0);
}
if (!API_KEY) { console.error('❌ .env に TYPESAFE_API_KEY がありません。'); process.exit(1); }

const QUESTIONS = {
  verdict: {
    type: 'choice',
    instructions: 'この店に付けられた「エリア名」は、この店の「住所」が指す場所と合っているか',
    criteria: {
      same_place: 'エリア名は住所と同じ場所を指している（表記が違うだけ、または住所の一部）',
      nearby: 'エリア名は住所の隣接地・徒歩圏の地名で、その店の最寄りとして妥当',
      vague_address: '住所がぼかし表記や市区までしか無く、エリア名が正しいかどうか判断できない',
      different: 'エリア名は住所とは明らかに別の場所を指している（間違いの疑いが強い）',
    },
  },
  is_wrong: {
    type: 'noul',
    instructions: 'このエリア名は誤りで、利用者がその地名で探してもこの店に辿り着けない、または関係ない地名で出てくる',
  },
};

const stateOf = (r) => [
  `店名: ${r.name}`,
  `付けられているエリア名: ${r.area}`,
  `住所: ${r.address}`,
  `都道府県: ${r.prefecture} ／ 市区: ${r.city}`,
].join('\n');

async function ask(r) {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'jev-latest', state: stateOf(r), questions: QUESTIONS }),
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const j = await res.json();
    const a = j.answers || j;
    return {
      verdict: a.verdict?.choice ?? null,
      confidence: a.verdict?.confidence ?? null,
      probs: a.verdict?.probabilities ?? null,
      isWrong: a.is_wrong?.noul ?? null,
      inputTokens: j.usage?.input_tokens ?? a.usage?.input_tokens ?? 0,
    };
  } catch (e) { return { error: e.message }; }
}

const results = [];
let cur = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (cur < rows.length) {
    const r = rows[cur++];
    const jev = await ask(r);
    results.push({ ...r, jev });
    if (results.length % 20 === 0) process.stdout.write(`  …${results.length}/${rows.length}\n`);
  }
}));

const by = (v) => results.filter((r) => r.jev.verdict === v);
// ⚠️ 応答が取れなかった行は「合っている」ではない。別に数える（応答しない≠存在しない）。
const unjudged = results.filter((r) => r.jev.error);
console.log(`\n── Jev の内訳（${results.length}件）──`);
for (const v of ['same_place', 'nearby', 'vague_address', 'different']) {
  console.log(`  ${v.padEnd(14)} ${by(v).length}件`);
}
if (unjudged.length) console.log(`  未判定（応答なし） ${unjudged.length}件 … 合っているとは数えない`);

const suspects = by('different').sort((a, b) => (b.jev.isWrong ?? 0) - (a.jev.isWrong ?? 0));
console.log(`\n── 人が開いて確かめる分: ${suspects.length}件 / いまの規則の候補 ${rows.length}件 ──`);
console.log('  （**これは判定ではなく候補**。公式サイトで裏を取るまで1件も直さない）');
for (const r of suspects) {
  console.log(`  ${r.id}`);
  console.log(`     ${r.name}`);
  console.log(`     エリア「${r.area}」／ 住所「${r.address}」`);
  console.log(`     conf=${r.jev.confidence?.toFixed?.(2)} is_wrong=${r.jev.isWrong?.toFixed?.(2)}`);
}
if (!suspects.length) console.log('  （0件）');

const tokens = results.reduce((s, r) => s + (r.jev.inputTokens || 0), 0);
console.log(`\n入力トークン ${tokens}（$0.042/1M なら約 $${((tokens / 1e6) * 0.042).toFixed(5)}）`);
fs.mkdirSync('outputs/jev-trial', { recursive: true });
const out = `outputs/jev-trial/area-address-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(out, JSON.stringify({ band: BAND, asked: results.length, results }, null, 2));
console.log(`📦 明細: ${out}`);
console.log('\n⚠️ 9/15の本物2件はもう直してあるので、**取りこぼさないかはこのデータでは測れない**。');
console.log('   ここで分かるのは「人が見る件数がどこまで減るか」だけ。');
