/**
 * restore_db_backup.mjs — backup_db.mjs の控えと今の DB を比べる／消えた行を戻す
 *
 * 既定は**比べるだけ**（DB に書かない）。表ごとに次の数と例を出す:
 *   ・控えにあって DB に無い行（＝その後に消えた）
 *   ・DB にあって控えに無い行（＝その後に増えた）
 *   ・両方にあって中身が違う行（＝その後に書き換わった）
 *
 * 戻す（--live を付けたときだけ・1つの表ずつ）:
 *   ・--table=<表> --live                 控えにあって DB に無い行を**足すだけ**（既にある行は触らない）
 *   ・--table=<表> --ids=a,b --overwrite --live
 *                                          指定した主キーの行だけ、控えの中身で上書きする。
 *                                          上書きの前に今の行を backups/db/restore-before-*.json に残す。
 *   ⚠️ 消す処理は無い。--ids を付けない上書きはできない（全部を巻き戻す道具にしない）。
 *   ⚠️ 本番の DB への書き込みなので、okabayashi に確認してから流す。
 *
 * 使い方:
 *   node scripts/maintenance/restore_db_backup.mjs                          最新の控えと全部の表を比べる
 *   node scripts/maintenance/restore_db_backup.mjs backups/db/<file>.json.gz --table=reviews
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'backups', 'db');
const PAGE = 1000;

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const okFlags = new Set(['table', 'ids', 'overwrite', 'live']);
const badFlags = Object.keys(flags).filter((k) => !okFlags.has(k));
if (badFlags.length) { console.error(`知らない引数: ${badFlags.map((k) => `--${k}`).join(' ')}`); process.exit(2); }
const fileArg = args.find((a) => !a.startsWith('--'));
const LIVE = flags.live === true;
const OVERWRITE = flags.overwrite === true;
const TABLE = typeof flags.table === 'string' ? flags.table : null;
const IDS = typeof flags.ids === 'string' ? flags.ids.split(',').map((s) => s.trim()).filter(Boolean) : null;
if (LIVE && !TABLE) { console.error('--live は --table=<表> と一緒に（1つの表ずつ戻す）'); process.exit(2); }
if (OVERWRITE && !IDS?.length) { console.error('--overwrite は --ids=<主キー,…> と一緒に（全部を上書きしない）'); process.exit(2); }

const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const sb = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });

const file = fileArg || (() => {
  const st = JSON.parse(fs.readFileSync(path.join(DIR, 'latest.json'), 'utf-8'));
  return path.join(DIR, st.file);
})();
const backup = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf-8'));
if (backup.format !== 'mens-esthe-db-backup/1') { console.error(`控えの形が違う: ${backup.format}`); process.exit(2); }
console.log(`控え: ${path.relative(ROOT, file)}（${backup.created_at}）`);

// キーの順に左右されない比較用の文字列
const stable = (v) => (v === null || typeof v !== 'object') ? JSON.stringify(v)
  : Array.isArray(v) ? `[${v.map(stable).join(',')}]`
  : `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;

async function readAll(t, pk) {
  const rows = [];
  let last = null;
  for (;;) {
    let q = sb.from(t).select('*').order(pk, { ascending: true }).limit(PAGE);
    if (last !== null) q = q.gt(pk, last);
    const { data, error } = await q;
    if (error) throw new Error(`${t} を読めない: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) return rows;
    last = data[data.length - 1][pk];
  }
}

const tables = TABLE ? [TABLE] : Object.keys(backup.tables);
const report = {};
for (const t of tables) {
  const pk = backup.primary_keys?.[t];
  const saved = backup.tables[t];
  if (!saved) { console.error(`控えに ${t} が無い`); process.exit(2); }
  if (!pk) { console.log(`  ${t}: 主キーが無いので比べられない（${saved.length} 行）`); continue; }
  const live = await readAll(t, pk);
  const liveMap = new Map(live.map((r) => [r[pk], r]));
  const savedMap = new Map(saved.map((r) => [r[pk], r]));
  const missing = saved.filter((r) => !liveMap.has(r[pk]));
  const added = live.filter((r) => !savedMap.has(r[pk]));
  const changed = saved.filter((r) => liveMap.has(r[pk]) && stable(r) !== stable(liveMap.get(r[pk])));
  report[t] = { missing, added, changed, pk };
  const ex = (list) => list.slice(0, 3).map((r) => r[pk]).join(' / ');
  console.log(`  ${t}: 控え ${saved.length}・今 ${live.length}｜消えた ${missing.length}${missing.length ? `（${ex(missing)}）` : ''}・増えた ${added.length}${added.length ? `（${ex(added)}）` : ''}・書き換わった ${changed.length}${changed.length ? `（${ex(changed)}）` : ''}`);
}

if (!LIVE) {
  console.log('\n比べただけ（DB には書いていない）。戻すときは --table=<表> --live（足すだけ）か --ids=… --overwrite --live。');
  process.exit(0);
}

const { missing, pk } = report[TABLE];
if (OVERWRITE) {
  const want = new Set(IDS);
  const rows = backup.tables[TABLE].filter((r) => want.has(String(r[pk])));
  const notFound = IDS.filter((id) => !rows.some((r) => String(r[pk]) === id));
  if (notFound.length) { console.error(`控えに無い主キー: ${notFound.join(' ')}（1件も書かない）`); process.exit(1); }
  const { data: current, error: e0 } = await sb.from(TABLE).select('*').in(pk, IDS);
  if (e0) throw e0;
  const keep = path.join(DIR, `restore-before-${TABLE}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(keep, JSON.stringify(current, null, 2));
  console.log(`上書きの前の今の行を残した: ${path.relative(ROOT, keep)}`);
  const { error } = await sb.from(TABLE).upsert(rows, { onConflict: pk });
  if (error) throw error;
  const { data: after } = await sb.from(TABLE).select('*').in(pk, IDS);
  const bad = rows.filter((r) => stable(r) !== stable((after || []).find((a) => a[pk] === r[pk])));
  console.log(bad.length ? `⚠️ 読み直しで ${bad.length} 行が控えと違う` : `✅ ${rows.length} 行を控えの中身に戻した`);
  process.exit(bad.length ? 1 : 0);
}

if (!missing.length) { console.log(`${TABLE}: 戻す行は無い`); process.exit(0); }
for (let i = 0; i < missing.length; i += 500) {
  const { error } = await sb.from(TABLE).upsert(missing.slice(i, i + 500), { onConflict: pk, ignoreDuplicates: true });
  if (error) throw error;
}
const { count } = await sb.from(TABLE).select('*', { count: 'exact', head: true }).in(pk, missing.map((r) => r[pk]).slice(0, 1000));
console.log(`✅ ${TABLE}: 消えていた ${missing.length} 行を足した（読み直しで ${count} 行を確認・先頭1000件まで）`);
