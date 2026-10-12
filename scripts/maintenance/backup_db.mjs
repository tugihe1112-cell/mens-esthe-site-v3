/**
 * backup_db.mjs — DB の中身を全部ファイルに書き出す（週1回 launchd が動かす・手でも動かせる）
 *
 * 【なぜ（2026-10-12・okabayashi「はい」）】
 *   Supabase は無料プランで、管理画面から戻せるバックアップが無い。Supabase の説明にも
 *   「無料プランは自分で定期的に書き出して、別の場所に置いて」とある。今までは作業ごとの部分的な控えしか無かった。
 *
 * 【方式】
 *   この Mac には pg_dump も Homebrew も無いので、サービスロールの鍵（.env に既にある）で全部の表を読み、
 *   gzip した JSON 1つにする。DB のパスワードは要らない。
 *
 * 【入るもの】
 *   ・public の全部の表の全行（ビュー user_badge_counts は除く）
 *   ・ログイン会員の一覧（auth.admin.listUsers：メール・作成日・メタ情報）
 *   ・表の作り（PostgREST の OpenAPI＝列・型・既定値・主キー・外部キー）
 * 【入らないもの】
 *   ・会員のパスワード（戻したら会員はパスワードを再設定する）
 *   ・関数・トリガー・RLS・権限（supabase_migrations/ の SQL にある。ただし shops・therapists・reviews・profiles
 *     を作った CREATE TABLE はリポジトリに無い＝上の OpenAPI の列から作り直す）
 *   ・写真（Cloudflare R2 にある＝Supabase とは別の会社）
 *
 * 【確かめ】表ごとに DB の件数と書き出した件数・主キーの重複なしを突き合わせ、書いたファイルを読み直して同じ件数かを見る。
 *   1つでも合わなければ失敗として扱い、古い控えは消さず、Mac に通知を出す。
 *
 * 【置き場所】backups/db/（.gitignore 済み＝git に入らない）。新しい KEEP 個を残し、それより古いものだけ消す。
 *   ⚠️ 中身は会員のメールを含む DB の完全な写し。リポジトリ・チャット・外部に出さない。
 *
 * 使い方:
 *   node scripts/maintenance/backup_db.mjs                       今すぐ書き出す
 *   node scripts/maintenance/backup_db.mjs --if-older-than-days=6 最後の成功から6日たっていなければ何もしない（launchd 用）
 *   node scripts/maintenance/backup_db.mjs --check               書き出さずに、表と件数だけ見る
 * 戻すとき: scripts/maintenance/restore_db_backup.mjs（既定は比べるだけ）
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'backups', 'db');
const KEEP = 8;
const PAGE = 1000;
const FILE_RE = /^mens-esthe-db-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json\.gz$/;
// ビュー（中身は他の表から作られる）。新しい表は自動で入る（OpenAPI から拾う）。
const SKIP = new Set(['user_badge_counts']);

const args = process.argv.slice(2);
const known = /^--(check|if-older-than-days=\d+(\.\d+)?)$/;
const bad = args.filter((a) => !known.test(a));
if (bad.length) { console.error(`知らない引数: ${bad.join(' ')}`); process.exit(2); }
const CHECK_ONLY = args.includes('--check');
const olderArg = args.find((a) => a.startsWith('--if-older-than-days='));
const OLDER_DAYS = olderArg ? Number(olderArg.split('=')[1]) : null;

const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const BASE = getEnv('VITE_SUPABASE_URL');
const KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
if (!BASE || !KEY) { console.error('.env に VITE_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が要る'); process.exit(2); }
const sb = createClient(BASE, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const log = (...m) => console.log(new Date().toISOString(), ...m);

function notify(title, msg) {
  if (process.platform !== 'darwin') return Promise.resolve();
  const q = (s) => String(s).replace(/["\\]/g, '');
  return new Promise((r) => execFile('osascript', ['-e', `display notification "${q(msg)}" with title "${q(title)}"`], () => r()));
}

function latestStatus() {
  try { return JSON.parse(fs.readFileSync(path.join(DIR, 'latest.json'), 'utf-8')); } catch { return null; }
}

/** OpenAPI から表の一覧と主キーを取る */
async function readSchema() {
  const res = await fetch(`${BASE}/rest/v1/`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: 'application/openapi+json' } });
  if (!res.ok) throw new Error(`OpenAPI が読めない: HTTP ${res.status}`);
  const spec = await res.json();
  const defs = spec.definitions || {};
  const tables = Object.keys(defs).filter((t) => !SKIP.has(t)).sort();
  if (tables.length < 5) throw new Error(`表が ${tables.length} 個しか見えない（鍵がサービスロールでない可能性）`);
  const pkOf = {};
  for (const t of tables) {
    const props = defs[t].properties || {};
    const pks = Object.keys(props).filter((c) => /<pk\/>/.test(props[c].description || ''));
    pkOf[t] = pks.length === 1 ? pks[0] : null;
  }
  return { spec, tables, pkOf };
}

async function countRows(t) {
  const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true });
  if (error) throw new Error(`${t} の件数が数えられない: ${error.message}`);
  return count;
}

/** 主キーの昇順で、主キーより大きいものを次々に取る（途中で行が増えても飛ばさない・重ねない） */
async function readAll(t, pk) {
  const rows = [];
  let last = null;
  for (let guard = 0; guard < 10000; guard++) {
    let q = sb.from(t).select('*').limit(PAGE);
    if (pk) { q = q.order(pk, { ascending: true }); if (last !== null) q = q.gt(pk, last); }
    else q = q.range(rows.length, rows.length + PAGE - 1);
    const { data, error } = await q;
    if (error) throw new Error(`${t} を読めない: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) return rows;
    if (pk) last = data[data.length - 1][pk];
  }
  throw new Error(`${t} のページ送りが終わらない`);
}

async function readAuthUsers() {
  const users = [];
  for (let page = 1; page < 1000; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`会員の一覧が読めない: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 1000) return { users, total: typeof data.total === 'number' ? data.total : null };
  }
  throw new Error('会員の一覧のページ送りが終わらない');
}

async function runOnce() {
  const { spec, tables, pkOf } = await readSchema();
  log(`表 ${tables.length} 個: ${tables.join(' ')}`);
  const before = {};
  for (const t of tables) before[t] = await countRows(t);
  if (CHECK_ONLY) {
    for (const t of tables) log(`  ${t}: ${before[t]} 行（主キー ${pkOf[t] || 'なし'}）`);
    const a = await readAuthUsers();
    log(`  会員: ${a.users.length} 人`);
    return null;
  }

  const data = {};
  const counts = {};
  const problems = [];
  for (const t of tables) {
    const rows = await readAll(t, pkOf[t]);
    data[t] = rows;
    counts[t] = rows.length;
    if (pkOf[t]) {
      const uniq = new Set(rows.map((r) => r[pkOf[t]]));
      if (uniq.size !== rows.length) problems.push(`${t}: 主キーの重複 ${rows.length - uniq.size} 件`);
    }
    if (rows.length !== before[t]) {
      // 読んでいるあいだに行が増減したかもしれないので、もう一度数える
      const after = await countRows(t);
      if (rows.length !== after) problems.push(`${t}: DB ${before[t]}→${after} 行・書き出し ${rows.length} 行`);
    }
    log(`  ${t}: ${rows.length} 行`);
  }
  const auth = await readAuthUsers();
  if (auth.total !== null && auth.total !== auth.users.length) problems.push(`会員: 一覧 ${auth.users.length} 人・総数 ${auth.total} 人`);
  log(`  会員: ${auth.users.length} 人`);
  if (problems.length) throw new Error(`件数が合わない（書き出しを残さない）:\n  ${problems.join('\n  ')}`);

  const at = new Date().toISOString();
  const payload = {
    format: 'mens-esthe-db-backup/1',
    created_at: at,
    source: BASE,
    note: '会員のパスワード・関数・トリガー・RLS・権限・写真は入っていない（scripts/maintenance/backup_db.mjs の冒頭）',
    counts,
    primary_keys: pkOf,
    auth_users: auth.users,
    openapi: spec,
    tables: data,
  };
  fs.mkdirSync(DIR, { recursive: true });
  const name = `mens-esthe-db-${at.replace(/\..*$/, 'Z').replace(/:/g, '-')}.json.gz`;
  const full = path.join(DIR, name);
  const tmp = `${full}.partial`;
  fs.writeFileSync(tmp, zlib.gzipSync(Buffer.from(JSON.stringify(payload)), { level: 9 }));

  // 書いたファイルを読み直して確かめる（壊れたファイルを「成功」と呼ばない）
  const back = JSON.parse(zlib.gunzipSync(fs.readFileSync(tmp)).toString('utf-8'));
  for (const t of tables) {
    if ((back.tables[t] || []).length !== counts[t]) throw new Error(`読み直しで ${t} の件数が違う`);
  }
  if ((back.auth_users || []).length !== auth.users.length) throw new Error('読み直しで会員の人数が違う');
  fs.renameSync(tmp, full);

  const buf = fs.readFileSync(full);
  const status = {
    ok: true, at, file: name, bytes: buf.length,
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    counts, auth_users: auth.users.length,
  };
  fs.writeFileSync(path.join(DIR, 'latest.json'), JSON.stringify(status, null, 2));

  // 新しい KEEP 個だけ残す（確かめが通った後だけ・この名前の形のファイルだけ）
  const old = fs.readdirSync(DIR).filter((f) => FILE_RE.test(f)).sort().reverse().slice(KEEP);
  for (const f of old) { fs.unlinkSync(path.join(DIR, f)); log(`古い控えを消した: ${f}`); }
  return status;
}

async function main() {
  if (OLDER_DAYS !== null) {
    const st = latestStatus();
    const age = st?.ok && st.at ? (Date.now() - Date.parse(st.at)) / 86400000 : Infinity;
    if (age < OLDER_DAYS) { log(`最後の成功から ${age.toFixed(1)} 日なので何もしない（${OLDER_DAYS} 日たったら書き出す）`); return; }
  }
  // スリープ明けは通信がまだ戻っていないことがあるので、間をあけて最大4回
  const waits = [0, 30, 60, 120];
  let lastErr = null;
  for (const w of waits) {
    if (w) { log(`${w} 秒待ってやり直す`); await new Promise((r) => setTimeout(r, w * 1000)); }
    try {
      const st = await runOnce();
      if (st) {
        const mb = (st.bytes / 1048576).toFixed(1);
        log(`✅ 書き出した: backups/db/${st.file}（${mb}MB・セラピスト ${st.counts.therapists ?? '?'} 行・口コミ ${st.counts.reviews ?? '?'} 件・会員 ${st.auth_users} 人）`);
        await notify('メンエスマップ DB バックアップ', `完了 ${mb}MB・口コミ ${st.counts.reviews ?? '?'} 件`);
      }
      return;
    } catch (e) {
      lastErr = e;
      log(`失敗: ${e.message}`);
      // 件数の食い違いはやり直しても同じことが多いが、書き込み中の偶然もあるので同じ回数だけ試す
    }
  }
  fs.mkdirSync(DIR, { recursive: true });
  const prev = latestStatus();
  fs.writeFileSync(path.join(DIR, 'last-failure.json'), JSON.stringify({ at: new Date().toISOString(), error: String(lastErr?.message || lastErr), last_success: prev?.at || null }, null, 2));
  await notify('メンエスマップ DB バックアップ失敗', String(lastErr?.message || lastErr).slice(0, 120));
  process.exit(1);
}

main().catch(async (e) => { console.error(e); await notify('メンエスマップ DB バックアップ失敗', String(e?.message || e).slice(0, 120)); process.exit(1); });
