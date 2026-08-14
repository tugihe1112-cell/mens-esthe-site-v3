/**
 * check_image_health.mjs — 画像の健全性を毎日測る外形監視（再発防止の本体）
 *
 * 【なぜ必要か】
 * 画像が出ない問題はこれまで何度も起きている:
 *   ・Storageファイル名の衝突で上書き（2026-05/06）
 *   ・r2.dev のレート制限(429)で「出たり出なかったり」（2026-07-06〜13）
 *   ・loading="lazy" / onLoad不発で「ロード済みなのに透明」（2026-07-13/14）
 *   ・外部URL→R2一括移行で 82件のshop画像が null 化（2026-07-06）→ 発覚は 2026-08-06
 * 共通する真因は「**壊れたこと自体は小さいが、誰も気づかないまま数週間放置される**」こと。
 * このスクリプトは壊れを"数値"にして毎日記録し、閾値を超えたらCIを落として気づかせる。
 *
 * 【測るもの】
 *   1. shops / therapists の image_url が null の比率
 *   2. 非nullのURLをランダムサンプリングして実際にHTTP 200 かつ image/* が返るか
 *   3. 人物写真ではない既知の画像・広告名・同一画像の大量使い回し
 *   4. 前回値との差分（scripts/monitoring/image_health_history.json に追記）
 *
 * 【落とす条件】（環境変数で調整可）
 *   - shops の null率が SHOPS_NULL_MAX(既定 20%) を超える
 *   - サンプルの死亡率が DEAD_MAX(既定 5%) を超える
 *   - null件数が前回から JUMP_MAX(既定 30件) 以上増えた ＝ 一括破壊の検知
 *
 * 実行: node scripts/monitoring/check_image_health.mjs [--sample=40] [--quiet]
 *   CI/cron で毎日回す。ローカルでも .env があれば動く。
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  findRepeatedTherapistImageGroups,
  isKnownBadTherapistImageUrl,
  isSuspiciousTherapistName,
} from '../lib/therapistImageQuality.mjs';

const args = process.argv.slice(2);
const SAMPLE = Number((args.find((a) => a.startsWith('--sample=')) || '').split('=')[1]) || 40;
const QUIET = args.includes('--quiet');

const SHOPS_NULL_MAX = Number(process.env.SHOPS_NULL_MAX || 20);   // %
const DEAD_MAX = Number(process.env.DEAD_MAX || 5);                // %
const JUMP_MAX = Number(process.env.JUMP_MAX || 30);               // 件

function env(k) {
  if (process.env[k]) return process.env[k];
  try {
    const f = fs.readFileSync('.env', 'utf-8');
    return f.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '') || '';
  } catch { return ''; }
}

const SUPABASE_URL = env('VITE_SUPABASE_URL');
const SUPABASE_KEY = env('SUPABASE_SERVICE_ROLE_KEY') || env('VITE_SUPABASE_ANON_KEY');
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('❌ Supabaseの接続情報が無い'); process.exit(1); }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const HISTORY = path.join('scripts', 'monitoring', 'image_health_history.json');
const UA = 'Mozilla/5.0 (compatible; MensEstheMapImageHealth/1.0)';

async function countOf(table, filter) {
  let q = supabase.from(table).select('id', { count: 'exact', head: true });
  if (filter === 'null') q = q.is('image_url', null);
  if (filter === 'not-null') q = q.not('image_url', 'is', null);
  const { count, error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
  return count || 0;
}

async function sampleUrls(table, n) {
  // ランダム性は order('id') のオフセットずらしで代用（PostgRESTにrandomが無いため）
  const total = await countOf(table, 'not-null');
  const offset = total > n ? Math.floor(Math.random() * Math.max(0, total - n)) : 0;
  const { data } = await supabase
    .from(table).select('id, image_url')
    .not('image_url', 'is', null)
    .order('id').range(offset, offset + n - 1);
  return (data || []).map((r) => r.image_url).filter(Boolean);
}

async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000) });
    const ct = res.headers.get('content-type') || '';
    return res.ok && (/^image\//i.test(ct) || ct === '');
  } catch { return false; }
}

async function fetchAllActiveTherapists() {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('therapists')
      .select('id,shop_id,name,image_url')
      .or('is_active.is.null,is_active.eq.true')
      .order('id')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`therapists semantic check: ${error.message}`);
    rows.push(...(data || []));
    if ((data || []).length < pageSize) break;
  }
  return rows;
}

async function main() {
  const report = {
    schemaVersion: 2,
    at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
  const failures = [];

  for (const table of ['shops', 'therapists']) {
    const total = await countOf(table);
    const nulls = await countOf(table, 'null');
    const urls = await sampleUrls(table, SAMPLE);
    const results = await Promise.all(urls.map(headOk));
    const dead = results.filter((x) => !x).length;
    const deadPct = urls.length ? (dead / urls.length) * 100 : 0;
    const nullPct = total ? (nulls / total) * 100 : 0;

    report[table] = { total, nulls, nullPct: +nullPct.toFixed(1), sampled: urls.length, dead, deadPct: +deadPct.toFixed(1) };

    if (!QUIET) {
      console.log(`\n■ ${table}`);
      console.log(`  総数 ${total.toLocaleString()} / image_url=null ${nulls.toLocaleString()} (${nullPct.toFixed(1)}%)`);
      console.log(`  サンプル ${urls.length}件 → 配信NG ${dead}件 (${deadPct.toFixed(1)}%)`);
    }

    if (table === 'shops' && nullPct > SHOPS_NULL_MAX) {
      failures.push(`shops の image_url=null が ${nullPct.toFixed(1)}%（閾値 ${SHOPS_NULL_MAX}%）`);
    }
    if (deadPct > DEAD_MAX) {
      failures.push(`${table} の配信NGが ${deadPct.toFixed(1)}%（閾値 ${DEAD_MAX}%）＝Worker/R2/元URLの異常を疑う`);
    }
  }

  const therapistRows = await fetchAllActiveTherapists();
  const knownBad = therapistRows.filter((row) => isKnownBadTherapistImageUrl(row.image_url));
  const suspiciousNames = therapistRows.filter((row) => isSuspiciousTherapistName(row.name));
  const repeatedGroups = findRepeatedTherapistImageGroups(therapistRows, 5);
  report.therapistSemantic = {
    checked: therapistRows.length,
    knownBad: knownBad.length,
    suspiciousNames: suspiciousNames.length,
    repeatedGroups: repeatedGroups.length,
    repeatedRows: repeatedGroups.reduce((sum, group) => sum + group.rowCount, 0),
  };
  if (!QUIET) {
    console.log('\n■ therapist semantic quality');
    console.log(`  既知の誤画像 ${knownBad.length}件 / 広告・プレースホルダー名 ${suspiciousNames.length}件`);
    console.log(`  1店舗で5名以上への同一画像使い回し ${repeatedGroups.length}組`);
  }
  if (knownBad.length) failures.push(`目視確認済みの誤画像が${knownBad.length}件、表示対象に戻っています`);
  if (suspiciousNames.length) failures.push(`広告・プレースホルダー名に画像が付いた行が${suspiciousNames.length}件あります`);
  if (repeatedGroups.length) {
    const examples = repeatedGroups.slice(0, 3).map((g) => `${g.shopId}:${g.distinctNames}名`).join(', ');
    failures.push(`同じ画像を1店舗内の5名以上へ使った組が${repeatedGroups.length}件あります（${examples}）`);
  }

  // 前回との差分＝「一括でnull化した」事故の検知（今回の82件消失もこれで即日気づけた）
  let history = [];
  try { history = JSON.parse(fs.readFileSync(HISTORY, 'utf-8')); } catch { /* 初回 */ }
  const prev = history[history.length - 1];
  // schemaVersionを上げた初回は、意図した一括修復によるnull増を新しい基準値にする。
  if (prev?.schemaVersion === report.schemaVersion) {
    for (const table of ['shops', 'therapists']) {
      const jump = report[table].nulls - (prev[table]?.nulls ?? report[table].nulls);
      if (!QUIET) console.log(`  前回比: ${table} の null ${jump >= 0 ? '+' : ''}${jump}件`);
      if (jump >= JUMP_MAX) {
        failures.push(`${table} の null が前回から ${jump}件 急増＝一括処理でデータを壊した可能性（直近のスクリプト実行を確認）`);
      }
    }
  }
  history.push(report);
  fs.mkdirSync(path.dirname(HISTORY), { recursive: true });
  fs.writeFileSync(HISTORY, JSON.stringify(history.slice(-120), null, 2));

  if (failures.length) {
    console.error('\n🚨 画像健全性チェック失敗:');
    failures.forEach((f) => console.error('  - ' + f));
    process.exit(1);
  }
  console.log('\n✅ 画像健全性チェック OK');
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
