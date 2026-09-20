/**
 * compare_roster_noise_judgement.mjs — 「人か、部屋・素材か」の判定を2つ並べて正答率を測る
 *
 * 【何のための道具か（2026-09-20）】
 * いまの判定（rosterNoiseRules.mjs）は**綴りの規則**で、私は自分でこう書いている:
 *   「④は語のリストで見ている＝**網羅ではない**」
 * 実際 2026-09-16 は、「背景画像」を**2店目のページを目で見て**初めて見つけた。
 * TypeSafe AI の Jev（System One モデル）は型のついた判断を確信度つきで返すので、
 * この種の判定に向いている**可能性がある**。⇒ 入れるかどうかは**測ってから決める**。
 *
 * 【なぜ測れるか】正解を既に持っているため。
 *   - 消した21行（outputs/deleted-therapists/*.json）＝**人ではない**と確定済み
 *   - その5店の現在の在籍者＝当時**5店とも目で全部見た**ので人と確定
 *   - ②段（人名＋店名）＝私が「実在の人なので消さない」と判断した型
 *
 * 【この道具がやらないこと】
 *   - DBを1行も変えない（読むだけ）。消す判断は delete_therapists.mjs のまま。
 *   - モデルの答えを**確証として扱わない**。出すのは「人が見る順番」まで。
 *   ⚠️ API が失敗した行は person でも noise でもなく **unjudged**。
 *      「応答しない」を「存在しない」と読むのは、この案件で3回踏んだ型。
 *
 * 使い方:
 *   node scripts/maintenance/compare_roster_noise_judgement.mjs            （下見。APIを呼ばない）
 *   node scripts/maintenance/compare_roster_noise_judgement.mjs --run      （実際に問い合わせる）
 *   node scripts/maintenance/compare_roster_noise_judgement.mjs --run --limit=40
 *
 * .env に TYPESAFE_API_KEY を入れること（.env と .env.* は .gitignore 済み）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { normName } from '../lib/brandNameMatch.mjs';
import { classifyRosterName, selfTestRosterRules, DELETABLE_BUCKETS } from '../lib/rosterNoiseRules.mjs';

const ENV_TEXT = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : '';
const env = (name) => {
  const m = ENV_TEXT.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return (m ? m[1] : process.env[name] || '').trim().replace(/^['"]|['"]$/g, '');
};

const args = process.argv.slice(2);
const RUN = args.includes('--run');
const LIMIT = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || 0);
const DISCOVER = Number(args.find((a) => a.startsWith('--discover='))?.split('=')[1] || 0);

// 🚩 知らない引数を**黙って無視しない**。
//    2026-09-20、実装していない `--discover=400` を渡したのに、この道具は何も言わず
//    ふつうの比較を走らせた＝**指定したつもりで別のものが動き、課金だけされた**。
//    「受け取れない指定は、その場で止める」。
const KNOWN = [/^--run$/, /^--limit=\d+$/, /^--discover=\d+$/];
const unknown = args.filter((a) => !KNOWN.some((re) => re.test(a)));
if (unknown.length) {
  console.error(`❌ 知らない引数です: ${unknown.join(' ')}`);
  console.error('   使えるのは --run / --limit=N / --discover=N だけです。');
  process.exit(1);
}
if (DISCOVER && !RUN) {
  console.error('❌ --discover は API を呼ぶので --run と一緒に指定してください。');
  process.exit(1);
}
const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const CONCURRENCY = 4;

// 🚩 判定そのものの自己診断を、DBにもAPIにも触る前に。
selfTestRosterRules();

const SB_URL = env('VITE_SUPABASE_URL');
const SB_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
if (!SB_URL || !SB_KEY) { console.error('❌ .env に VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY がありません'); process.exit(1); }
const sb = createClient(SB_URL, SB_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const API_KEY = env('TYPESAFE_API_KEY');
if (RUN && !API_KEY) {
  console.error('❌ .env に TYPESAFE_API_KEY がありません。');
  console.error('   console.typesafe.ai の API Keys で作って、.env に1行足してください:');
  console.error('   TYPESAFE_API_KEY=apikey_...');
  console.error('   ⚠️ 鍵はチャットに貼らないこと。.env と .env.* は .gitignore 済みです。');
  process.exit(1);
}

async function fetchAll(table, columns, apply = (q) => q) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await apply(sb.from(table).select(columns)).range(from, from + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

// ── 正解その1: 実際に消した行（＝人ではない） ─────────────────────────
const delDir = 'outputs/deleted-therapists';
const delFiles = fs.existsSync(delDir)
  ? fs.readdirSync(delDir).filter((f) => f.endsWith('.json')).sort().reverse()
  : [];
if (!delFiles.length) { console.error(`❌ ${delDir} に削除バックアップがありません（正解データが作れません）`); process.exit(1); }
const deleted = JSON.parse(fs.readFileSync(path.join(delDir, delFiles[0]), 'utf-8'));
console.log(`正解データ: ${delFiles[0]} … ${deleted.length}行（人ではないと確定）`);

const shops = await fetchAll('shops', 'id, name');
const shopNameById = new Map(shops.map((s) => [s.id, s.name || '']));
const shopNameIndex = new Map();
for (const s of shops) {
  const key = normName(s.name);
  if (key.length < 3) continue;
  if (!shopNameIndex.has(key)) shopNameIndex.set(key, []);
  shopNameIndex.get(key).push(s.id);
}
const therapists = await fetchAll('therapists', 'id, shop_id, name, image_url, is_active');
const spreadOf = new Map();
for (const t of therapists) {
  const n = normName(t.name);
  if (!n) continue;
  if (!spreadOf.has(n)) spreadOf.set(n, new Set());
  spreadOf.get(n).add(t.shop_id);
}
const rosterByShop = new Map();
for (const t of therapists) {
  if (!rosterByShop.has(t.shop_id)) rosterByShop.set(t.shop_id, []);
  rosterByShop.get(t.shop_id).push(t.name);
}

const heuristic = (row) => classifyRosterName({
  name: row.name,
  shopId: row.shop_id,
  shopName: shopNameById.get(row.shop_id) || '',
  shopIdsWithSameName: shopNameIndex.get(normName(row.name)) || [],
  shopsUsingName: spreadOf.get(normName(row.name))?.size || 0,
});

// ── 検体を組む ───────────────────────────────────────────────────
const sample = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const reviewedShopIds = [...new Set(deleted.map((d) => d.shop_id))];

const cases = [];
for (const d of deleted) {
  cases.push({ set: 'A 消した行', truth: 'noise', ...d });
}
// 目で全部見た5店の、現在の在籍者（＝人と確定）
for (const shopId of reviewedShopIds) {
  for (const t of sample(therapists.filter((x) => x.shop_id === shopId), 12)) {
    cases.push({ set: 'B 目視済みの店の在籍者', truth: 'person', ...t });
  }
}
// ②段（人名＋店名）＝「消さない」と判断した型。いちばん間違えやすい。
// ⚠️ **1店に偏らせない。** この型は Marvelous だけで180行あるので、素直に25行抜くと
//    全部「◯◯ -よみ- Marvelous -マーベラス-」になり、**同じ書き方を25回測るだけ**になる。
//    店をまたいで散らす（1店あたり最大2行）。
{
  const decorated = sample(therapists.filter((x) => heuristic(x) === 'decorated'), 100000);
  const perShop = new Map();
  for (const t of decorated) {
    const arr = perShop.get(t.shop_id) || [];
    if (arr.length >= 2) continue;
    arr.push(t);
    perShop.set(t.shop_id, arr);
  }
  for (const t of [...perShop.values()].flat().slice(0, 25)) {
    cases.push({ set: 'C 人名＋店名', truth: 'person', ...t });
  }
}
const cases2 = LIMIT ? cases.slice(0, LIMIT) : cases;

if (!DISCOVER) console.log(`検体 ${cases2.length}件`);
for (const set of (DISCOVER ? [] : ['A 消した行', 'B 目視済みの店の在籍者', 'C 人名＋店名'])) {
  const c = cases2.filter((x) => x.set === set);
  const shopSpread = new Set(c.map((x) => x.shop_id)).size;
  console.log(`  ${set}: ${c.length}件（${shopSpread}店から）  例) ${c.slice(0, 3).map((x) => x.name).join(' / ')}`);
}

if (!RUN) {
  console.log('\nこれは下見です。APIは1回も呼んでいません。実際に問い合わせるには --run を付けてください。');
  console.log('⚠️ 先に検体の中身（上の例）が意図どおりか確かめること。正解が間違っていれば、測っても意味がありません。');
  process.exit(0);
}

// ── Jev に訊く ──────────────────────────────────────────────────
const stateOf = (row) => {
  const others = (rosterByShop.get(row.shop_id) || []).filter((n) => n !== row.name).slice(0, 8);
  return [
    `店名: ${shopNameById.get(row.shop_id) || '(不明)'}`,
    `在籍一覧に載っている名前: ${row.name}`,
    `同じ店の他の名前: ${others.join('、') || '(なし)'}`,
    `写真: ${String(row.image_url ?? '').trim() ? 'あり' : 'なし'}`,
  ].join('\n');
};

const QUESTIONS = {
  kind: {
    type: 'choice',
    instructions: 'この「在籍一覧に載っている名前」は何を指しているか',
    criteria: {
      person: 'その店で施術を担当する実在の人物の源氏名（芸名）',
      room: '部屋・ルーム・支店など、場所の呼び名',
      shop: '店舗やブランドそのものの名前',
      asset: '背景画像・ロゴ・サンプルなど、ページの部品や画像の名前',
    },
  },
  is_person: {
    type: 'noul',
    instructions: 'この名前は、その店で施術を担当する実在の人物を指している',
  },
};

async function ask(row) {
  const body = { model: 'jev-latest', state: stateOf(row), questions: QUESTIONS };
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const j = await res.json();
    const a = j.answers || j;
    return {
      kind: a.kind?.choice ?? null,
      kindConfidence: a.kind?.confidence ?? null,
      isPerson: a.is_person?.noul ?? null,
      inputTokens: j.usage?.input_tokens ?? a.usage?.input_tokens ?? 0,
    };
  } catch (e) {
    return { error: e.message };
  }
}

// ── 発見モード（2026-09-20）─────────────────────────────────────
// 🚩 ここが本当に知りたいこと。比較モードで測れるのは「いまの規則が見つけた行を
//    もう一度見つけられるか」だけで、**規則が素通りさせた行**は1件も見ていない。
//    私は rosterNoiseRules に自分で「語のリスト＝網羅ではない」と書いている。
//    2026-09-16 に「背景画像」を見つけたのも、規則ではなく**店のページを目で見た**から。
// ⚠️ ここには正解が無い。出すのは**人が目で見る候補**であって、判定ではない。
//    挙がった行は必ず店のページを開いて確かめること（一覧で終わらせない）。
if (DISCOVER) {
  const clean = therapists.filter((t) => (
    heuristic(t) === null
    && t.is_active !== false
    && String(t.image_url ?? '').trim() !== ''
  ));
  const picks = sample(clean, DISCOVER);
  console.log(`いまの規則が「ふつうの在籍者」とした行: ${clean.length}行（うち画面に出る条件を満たすもの）`);
  console.log(`そこから無作為に ${picks.length}行を Jev に訊きます。正解はありません。\n`);

  const found = [];
  let done = 0;
  let cur = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (cur < picks.length) {
      const row = picks[cur++];
      const jev = await ask(row);
      done++;
      if (done % 50 === 0) process.stdout.write(`  …${done}/${picks.length}\n`);
      if (jev.error) { found.push({ ...row, jev, flagged: false, unjudged: true }); continue; }
      if (jev.kind && jev.kind !== 'person') found.push({ ...row, jev, flagged: true });
    }
  }));

  const flagged = found.filter((f) => f.flagged).sort((a, b) => (b.jev.kindConfidence || 0) - (a.jev.kindConfidence || 0));
  const unjudged = found.filter((f) => f.unjudged);
  console.log(`\n── Jev が「人ではない」とした行: ${flagged.length}/${picks.length} ──`);
  console.log('  （確信度の高い順。**これは候補であって判定ではない。必ず店のページを開くこと**）');
  for (const f of flagged) {
    console.log(`  「${f.name}」 [${shopNameById.get(f.shop_id) || '?'}] ${f.shop_id}`);
    console.log(`     ${f.jev.kind} conf=${f.jev.kindConfidence?.toFixed?.(2)} is_person=${f.jev.isPerson?.toFixed?.(2)}`);
  }
  if (!flagged.length) console.log('  （0件）');
  // ⚠️ 応答が取れなかった行は「人」ではない。数えて出す。
  if (unjudged.length) console.log(`\n未判定（応答が取れなかった）: ${unjudged.length}件 … 人でも人でないでもない`);

  const dtokens = found.reduce((s2, f) => s2 + (f.jev.inputTokens || 0), 0);
  console.log(`\n入力トークン（挙がった行のみ計上）${dtokens}`);
  fs.mkdirSync('outputs/jev-trial', { recursive: true });
  const dout = `outputs/jev-trial/discover-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(dout, JSON.stringify({ sampled: picks.length, cleanTotal: clean.length, flagged, unjudged }, null, 2));
  console.log(`📦 明細: ${dout}`);
  console.log('\n⚠️ 一覧を見て終わりにしないこと。2026-09-16 の「背景画像」は、一覧ではなくページを開いて見つけた。');
  process.exit(0);
}

const results = [];
let cursor = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (cursor < cases2.length) {
    const row = cases2[cursor++];
    const jev = await ask(row);
    results.push({ ...row, heuristicBucket: heuristic(row), jev });
    if (results.length % 10 === 0) process.stdout.write(`  …${results.length}/${cases2.length}\n`);
  }
}));

// ── 採点 ────────────────────────────────────────────────────────
const heuristicSays = (r) => (DELETABLE_BUCKETS.includes(r.heuristicBucket) ? 'noise' : 'person');
const jevSays = (r) => (r.jev.error ? 'unjudged' : (r.jev.kind === 'person' ? 'person' : 'noise'));

const score = (name, verdict) => {
  let ok = 0, missed = 0, falseAlarm = 0, unjudged = 0;
  for (const r of results) {
    const v = verdict(r);
    if (v === 'unjudged') { unjudged++; continue; }
    if (v === r.truth) ok++;
    else if (r.truth === 'noise') missed++;
    else falseAlarm++;
  }
  const judged = results.length - unjudged;
  console.log(`\n── ${name} ──`);
  console.log(`  正答 ${ok}/${judged}${judged ? `（${((ok / judged) * 100).toFixed(1)}%）` : ''}`);
  console.log(`  見落とし（人でないものを人と判定） ${missed}件`);
  console.log(`  誤検知（人を人でないと判定） ${falseAlarm}件  ← **消す判断に使うならこれが0でなければならない**`);
  if (unjudged) console.log(`  未判定（応答が取れなかった） ${unjudged}件 … 人でも人でないでもない`);
};

console.log(`\n検体 ${results.length}件`);
score('いまの判定（綴りの規則）', heuristicSays);
score('Jev（choice が person 以外なら noise）', jevSays);

// 🚩 運用で知りたいのは「どこで切れば人を1人も巻き込まないか」。
console.log('\n── Jev: is_person のしきい値ごとの内訳 ──');
console.log('  （しきい値未満を「人でない」とみなす。誤検知0で見落としが少ない所が使える線）');
for (const th of [0.1, 0.2, 0.3, 0.4, 0.5, 0.7, 0.9]) {
  const judged = results.filter((r) => !r.jev.error && r.jev.isPerson !== null);
  const missed = judged.filter((r) => r.truth === 'noise' && r.jev.isPerson >= th).length;
  const falseAlarm = judged.filter((r) => r.truth === 'person' && r.jev.isPerson < th).length;
  console.log(`  ${th.toFixed(1)}: 見落とし ${missed} ／ 誤検知 ${falseAlarm}`);
}

console.log('\n── 食い違った行（人の目で見る分） ──');
for (const r of results) {
  const h = heuristicSays(r), j = jevSays(r);
  if (h === j && j === r.truth) continue;
  console.log(`  「${r.name}」 [${shopNameById.get(r.shop_id) || '?'}] ${r.set}`);
  console.log(`     正解=${r.truth} ／ いまの判定=${h}(${r.heuristicBucket ?? '該当なし'}) ／ Jev=${j}${r.jev.kind ? `(${r.jev.kind} conf=${r.jev.kindConfidence?.toFixed?.(2)} is_person=${r.jev.isPerson?.toFixed?.(2)})` : ''}${r.jev.error ? `(${r.jev.error})` : ''}`);
}

const tokens = results.reduce((s, r) => s + (r.jev.inputTokens || 0), 0);
console.log(`\n入力トークン合計 ${tokens}（$0.042/1M なら約 $${((tokens / 1e6) * 0.042).toFixed(5)}）`);

fs.mkdirSync('outputs/jev-trial', { recursive: true });
const out = `outputs/jev-trial/roster-noise-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(out, JSON.stringify({ endpoint: ENDPOINT, cases: results.length, results }, null, 2));
console.log(`📦 明細: ${out}`);
console.log('\n⚠️ この結果は「入れるかどうか」を決める材料です。**これだけでDBを変えないこと。**');
