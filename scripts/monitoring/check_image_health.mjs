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
 *   2. 非nullのURLをランダムサンプリングして実際に画像バイトが返るか
 *      --all では公開対象の全URLを重複排除して走査する
 *   3. 人物写真ではない既知の画像・広告名・同一画像の大量使い回し
 *   4. 前回値との差分（scripts/monitoring/image_health_history.json に追記）
 *
 * 【落とす条件】（環境変数で調整可）
 *   - shops の null率が SHOPS_NULL_MAX(既定 20%) を超える
 *   - サンプルの死亡率が DEAD_MAX(既定 5%) を超える
 *   - null件数が前回から JUMP_MAX(既定 30件) 以上増えた ＝ 一括破壊の検知
 *
 * 実行: node scripts/monitoring/check_image_health.mjs [--sample=100] [--all] [--no-history] [--report=/tmp/report.json] [--quiet]
 *   CI/cron で毎日回す。ローカルでも .env があれば動く。
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  findRepeatedTherapistImageGroups,
  findUnrelatedRepeatedTherapistImageGroups,
  isKnownBadTherapistImageUrl,
  isSuspiciousTherapistName,
} from '../lib/therapistImageQuality.mjs';
import { checkImageBody, mapConcurrent } from '../lib/imageDeliveryQuality.mjs';

const args = process.argv.slice(2);
const SAMPLE = Number((args.find((a) => a.startsWith('--sample=')) || '').split('=')[1]) || 40;
const QUIET = args.includes('--quiet');
const FULL_SCAN = args.includes('--all');
const NO_HISTORY = args.includes('--no-history');
const REPORT_FILE = (args.find((a) => a.startsWith('--report=')) || '').split('=').slice(1).join('=');
const CONCURRENCY = Math.max(
  1,
  Math.min(64, Number((args.find((a) => a.startsWith('--concurrency=')) || '').split('=')[1]) || 24),
);

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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry(label, operation, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(500 * attempt);
    }
  }
  throw new Error(`${label}: ${lastError?.message || 'unknown error'}`);
}

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

async function fetchAllImageRows(table) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from(table)
      .select('id,image_url')
      .not('image_url', 'is', null)
      .neq('image_url', '')
      .order('id')
      .range(from, from + pageSize - 1);
    const { data } = await withRetry(`${table} full image scan`, async () => {
      const result = await query;
      if (result.error) throw result.error;
      return result;
    });
    rows.push(...(data || []));
    if ((data || []).length < pageSize) break;
  }
  return rows;
}

async function fetchAllActiveTherapists() {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data } = await withRetry('therapists semantic check', async () => {
      const result = await supabase
        .from('therapists')
        .select('id,shop_id,name,image_url')
        .or('is_active.is.null,is_active.eq.true')
        .order('id')
        .range(from, from + pageSize - 1);
      if (result.error) throw result.error;
      return result;
    });
    rows.push(...(data || []));
    if ((data || []).length < pageSize) break;
  }
  return rows;
}

async function main() {
  const report = {
    // v4: 全件の実バイト検査と、意図した破損参照476行の除去後を新基準にする。
    schemaVersion: 4,
    at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
  const failures = [];
  const saveReport = () => {
    if (REPORT_FILE) fs.writeFileSync(REPORT_FILE, JSON.stringify({ report, failures }, null, 2));
  };

  for (const table of ['shops', 'therapists']) {
    const total = await countOf(table);
    const nulls = await countOf(table, 'null');
    const fullRows = FULL_SCAN ? await fetchAllImageRows(table) : [];
    const urls = FULL_SCAN
      ? [...new Set(fullRows.map((row) => row.image_url).filter(Boolean))]
      : await sampleUrls(table, SAMPLE);
    let lastProgress = 0;
    const results = await mapConcurrent(urls, CONCURRENCY, checkImageBody, (completed, totalUrls) => {
      if (FULL_SCAN && !QUIET && completed - lastProgress >= 2500) {
        lastProgress = completed;
        console.log(`  全件走査 ${completed.toLocaleString()} / ${totalUrls.toLocaleString()}`);
      }
    });
    const badUrls = urls
      .map((url, index) => ({ url, ...results[index] }))
      .filter((result) => !result.ok);
    const badUrlSet = new Set(badUrls.map((result) => result.url));
    const affectedRows = FULL_SCAN ? fullRows.filter((row) => badUrlSet.has(row.image_url)) : [];
    const dead = badUrls.length;
    const deadPct = urls.length ? (dead / urls.length) * 100 : 0;
    const nullPct = total ? (nulls / total) * 100 : 0;

    report[table] = {
      total,
      nulls,
      nullPct: +nullPct.toFixed(1),
      mode: FULL_SCAN ? 'all' : 'sample',
      checkedUrls: urls.length,
      dead,
      deadPct: +deadPct.toFixed(1),
      affectedRows: affectedRows.length,
      badExamples: badUrls
        .slice(0, REPORT_FILE ? undefined : 20)
        .map(({ url, status, contentType, reason }) => ({ url, status, contentType, reason })),
      affectedExamples: affectedRows
        .slice(0, REPORT_FILE ? undefined : 20)
        .map(({ id, image_url: imageUrl }) => ({ id, imageUrl })),
    };

    if (!QUIET) {
      console.log(`\n■ ${table}`);
      console.log(`  総数 ${total.toLocaleString()} / image_url=null ${nulls.toLocaleString()} (${nullPct.toFixed(1)}%)`);
      console.log(`  ${FULL_SCAN ? '全登録URL' : 'サンプル'} ${urls.length.toLocaleString()}件 → 配信NG ${dead}件 (${deadPct.toFixed(1)}%)`);
      badUrls.slice(0, 20).forEach((bad) => console.log(`    NG ${bad.reason}: ${bad.url}`));
    }

    if (table === 'shops' && nullPct > SHOPS_NULL_MAX) {
      failures.push(`shops の image_url=null が ${nullPct.toFixed(1)}%（閾値 ${SHOPS_NULL_MAX}%）`);
    }
    if (FULL_SCAN && dead > 0) {
      failures.push(`${table} の全画像実体検査で${dead} URL（${affectedRows.length}行）の異常を検出`);
    } else if (deadPct > DEAD_MAX) {
      failures.push(`${table} の配信NGが ${deadPct.toFixed(1)}%（閾値 ${DEAD_MAX}%）＝Worker/R2/元URLの異常を疑う`);
    }
    // 長時間の全件走査は後続の一時的なDB障害で結果を失わないよう逐次保存する。
    saveReport();
  }

  const therapistRows = await fetchAllActiveTherapists();
  const knownBad = therapistRows.filter((row) => isKnownBadTherapistImageUrl(row.image_url));
  const suspiciousNames = therapistRows.filter((row) => isSuspiciousTherapistName(row.name));
  const repeatedGroups = findRepeatedTherapistImageGroups(therapistRows, 5);
  const unrelatedRepeatedGroups = findUnrelatedRepeatedTherapistImageGroups(therapistRows);
  report.therapistSemantic = {
    checked: therapistRows.length,
    knownBad: knownBad.length,
    suspiciousNames: suspiciousNames.length,
    repeatedGroups: repeatedGroups.length,
    repeatedRows: repeatedGroups.reduce((sum, group) => sum + group.rowCount, 0),
    unrelatedRepeatedGroups: unrelatedRepeatedGroups.length,
  };
  if (!QUIET) {
    console.log('\n■ therapist semantic quality');
    console.log(`  既知の誤画像 ${knownBad.length}件 / 広告・プレースホルダー名 ${suspiciousNames.length}件`);
    console.log(`  1店舗で5名以上への同一画像使い回し ${repeatedGroups.length}組`);
    console.log(`  1店舗で別人名への同一画像使い回し ${unrelatedRepeatedGroups.length}組`);
  }
  if (knownBad.length) failures.push(`目視確認済みの誤画像が${knownBad.length}件、表示対象に戻っています`);
  if (suspiciousNames.length) failures.push(`広告・プレースホルダー名に画像が付いた行が${suspiciousNames.length}件あります`);
  if (repeatedGroups.length) {
    const examples = repeatedGroups.slice(0, 3).map((g) => `${g.shopId}:${g.distinctNames}名`).join(', ');
    failures.push(`同じ画像を1店舗内の5名以上へ使った組が${repeatedGroups.length}件あります（${examples}）`);
  }
  if (unrelatedRepeatedGroups.length) {
    const examples = unrelatedRepeatedGroups
      .slice(0, 3)
      .map((group) => `${group.shopId}:${group.names.join('/')}`)
      .join(', ');
    failures.push(
      `同じ画像を別人名へ使った組が${unrelatedRepeatedGroups.length}件あります（${examples}）`,
    );
  }

  // 前回との差分＝「一括でnull化した」事故の検知（今回の82件消失もこれで即日気づけた）
  let history = [];
  try { history = JSON.parse(fs.readFileSync(HISTORY, 'utf-8')); } catch { /* 初回 */ }
  const prev = history[history.length - 1];
  // schemaVersionを上げた初回は、意図した一括修復によるnull増を新しい基準値にする。
  if (!NO_HISTORY && prev?.schemaVersion === report.schemaVersion) {
    for (const table of ['shops', 'therapists']) {
      const jump = report[table].nulls - (prev[table]?.nulls ?? report[table].nulls);
      if (!QUIET) console.log(`  前回比: ${table} の null ${jump >= 0 ? '+' : ''}${jump}件`);
      if (jump >= JUMP_MAX) {
        failures.push(`${table} の null が前回から ${jump}件 急増＝一括処理でデータを壊した可能性（直近のスクリプト実行を確認）`);
      }
    }
  }
  if (!NO_HISTORY) {
    history.push(report);
    fs.mkdirSync(path.dirname(HISTORY), { recursive: true });
    fs.writeFileSync(HISTORY, JSON.stringify(history.slice(-120), null, 2));
  }
  saveReport();

  if (failures.length) {
    console.error('\n🚨 画像健全性チェック失敗:');
    failures.forEach((f) => console.error('  - ' + f));
    process.exit(1);
  }
  console.log('\n✅ 画像健全性チェック OK');
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
