/**
 * reconcile_brand_rosters.mjs — brand_roster_audit.mjs の結果で、在籍確認と退店扱いを書く
 *
 *   node scripts/maintenance/reconcile_brand_rosters.mjs --file=outputs/roster-audit/audit-YYYY-MM-DD.json          （下見）
 *   node scripts/maintenance/reconcile_brand_rosters.mjs --file=... --live                                           （書き込む）
 *
 * 【やること】（D-014: 名簿はブランドで1つ。公式サイト単位で全ルームの行を照合する）
 *  ・公式で見つかった人 → 在籍を確認（is_active=true / last_seen_at=今）
 *  ・公式で見つからない人 → 退店扱い（is_active=false）。削除しない・last_seen_at は触らない（最後に確認した日のまま）
 *  ・公式にだけいる人 → 追加しない（写真の取り込みが要るので別の作業）
 *
 * 【安全装置】
 *  1. audit で「使える」と判定したサイトだけ（DBの在籍者の40%以上・5人以上が公式で見つかり、公式の人数がDBの30%以上）。
 *  2. 退店扱いにする前に公式ページの文字をもう一度全部見て、**名前がどこにも出てこない人だけ**を退店扱いにする。
 *     どこかに出てくる人は読み取りの取りこぼしの可能性があるので何も変えない。
 *  3. 1サイトで退店扱いが在籍者の60%を超えたらそのサイトは何もしない（読み取りの失敗を疑う）。
 *  3b.（2026-09-25 追加）一致率が60%未満のサイトは**在籍確認だけ**にして退店扱いはしない。
 *     一覧が「もっと見る」で分かれていて読み切れていない可能性があり、誤って退店扱いにするほうが害が大きい。
 *  4. 書き換える前の行（id・is_active・last_seen_at）を outputs/roster-reconcile/ に保存。書けなければ中止。
 *  5. 書いたあと読み直して件数を照合。既定は下見。
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
for (const a of args) if (!/^(--live|--file=.+)$/.test(a)) { console.error(`❌ 知らない引数です: ${a}`); process.exit(1); }
const LIVE = args.includes('--live');
const FILE = args.find((a) => a.startsWith('--file='))?.slice(7);
if (!FILE) { console.error('使い方: --file=outputs/roster-audit/audit-YYYY-MM-DD.json [--live]'); process.exit(1); }

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } });
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

const audit = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
const usable = audit.results.filter((r) => r.usable);

async function pageText(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ja' }, signal: AbortSignal.timeout(20000) });
    const buf = Buffer.from(await res.arrayBuffer());
    const head = buf.slice(0, 3000).toString('latin1');
    const cs = (res.headers.get('content-type') || '').match(/charset=([\w-]+)/i)?.[1] || head.match(/charset=["']?([\w-]+)/i)?.[1] || 'utf-8';
    const enc = /shift_?jis|sjis/i.test(cs) ? 'shift_jis' : /euc-jp/i.test(cs) ? 'euc-jp' : 'utf-8';
    return new TextDecoder(enc).decode(buf);
  } catch { return ''; }
}
const flat = (s) => String(s || '').normalize('NFKC').replace(/[\s　]/g, '');
const bare = (s) => flat(s).replace(/[（(【\[〔～~〜].*?[）)】\]〕～~〜]/g, '').replace(/\d+$/, '');

// ── 現在の行（audit の後に変わっていないか確かめるため読み直す）──────
// ⚠️ id は日本語を含み長いので、id でまとめて問い合わせると URL が長すぎて失敗する。店ごとに読む。
const shopIds = [...new Set(usable.flatMap((r) => r.shops))];
const current = new Map();
for (const sid of shopIds) {
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from('therapists').select('id,name,is_active,last_seen_at').eq('shop_id', sid).range(from, from + 999);
    if (error) { console.error('❌ DBを読めません:', error.message); process.exit(1); }
    for (const r of data) current.set(r.id, r);
    if (data.length < 1000) break;
  }
}

const plan = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < usable.length) {
    const r = usable[i++];
    // 画面を組み立ててから読んだサイト（--render）は、そのとき読んだ文字も念押し確認に使う
    const rendered = (() => { try { return fs.readFileSync(path.join('outputs/roster-audit/texts', `${r.domain}.txt`), 'utf-8'); } catch { return ''; } })();
    const texts = [(await Promise.all((r.pages || []).map(pageText))).map(flat).join('\n'), r.method === 'text' ? rendered : ''].join('\n');
    const confirm = r.confirmRows.map((id) => current.get(id)).filter((t) => t && t.is_active !== false);
    const departCand = r.departRows.map((id) => current.get(id)).filter((t) => t && t.is_active !== false);
    const keep = [];
    const depart = [];
    for (const t of departCand) {
      const a = flat(t.name); const b = bare(t.name);
      if (!texts || (a && texts.includes(a)) || (b.length >= 2 && texts.includes(b))) keep.push(t); else depart.push(t);
    }
    const activeRows = confirm.length + departCand.length;
    const skip = !texts || (activeRows && depart.length / activeRows > 0.6);
    const confirmOnly = !skip && (r.matchRate ?? 0) < 0.6;
    plan.push({ domain: r.domain, shops: r.shops.length, confirm: skip ? [] : confirm, depart: skip || confirmOnly ? [] : depart, keep: confirmOnly ? [...keep, ...depart] : keep, skipped: skip ? (!texts ? '公式ページを読み直せない' : '退店扱いが60%超') : confirmOnly ? `一致率${r.matchRate}＝在籍確認だけ` : null });
  }
}));
plan.sort((a, b) => (b.confirm.length + b.depart.length) - (a.confirm.length + a.depart.length));

const confirmRows = plan.flatMap((p) => p.confirm);
const departRows = plan.flatMap((p) => p.depart);
const keepRows = plan.flatMap((p) => p.keep);

// ── 監視の見込み（180日超の割合）──────────────────────────────
const all = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase.from('therapists').select('id,last_seen_at').or('is_active.is.null,is_active.eq.true').range(from, from + 999);
  if (error) { console.error('❌ DBを読めません:', error.message); process.exit(1); }
  all.push(...data);
  if (data.length < 1000) break;
}
const confirmSet = new Set(confirmRows.map((t) => t.id));
const departSet = new Set(departRows.map((t) => t.id));
const staleAt = (rows, daysAhead) => {
  const cut = Date.now() + daysAhead * 86400000 - 180 * 86400000;
  const s = rows.filter((t) => !t.last_seen_at || new Date(t.last_seen_at).getTime() < cut).length;
  return `${s}/${rows.length}（${(100 * s / rows.length).toFixed(1)}%）`;
};
const after = all.filter((t) => !departSet.has(t.id)).map((t) => (confirmSet.has(t.id) ? { ...t, last_seen_at: new Date().toISOString() } : t));

console.log(`\n${LIVE ? '🔴 本番書き込み' : '🟢 下見（何も書きません）'}  対象 ${usable.length}サイト（audit: ${FILE}）`);
console.log(`在籍を確認: ${confirmRows.length}行 ／ 退店扱い: ${departRows.length}行 ／ 名前が公式ページのどこかに出るので変えない: ${keepRows.length}行 ／ 何もしないサイト: ${plan.filter((p) => p.skipped && !/在籍確認だけ/.test(p.skipped)).length} ／ 在籍確認だけのサイト: ${plan.filter((p) => /在籍確認だけ/.test(p.skipped || '')).length}`);
console.log(`180日超の割合  いま ${staleAt(all, 0)} → 書いた後 ${staleAt(after, 0)}`);
console.log(`              30日後 ${staleAt(all, 30)} → ${staleAt(after, 30)}・60日後 ${staleAt(all, 60)} → ${staleAt(after, 60)}・90日後 ${staleAt(all, 90)} → ${staleAt(after, 90)}`);
console.log('\n  サイト                              ルーム  在籍確認  退店扱い  変えない');
for (const p of plan) console.log(`  ${p.domain.padEnd(34)} ${String(p.shops).padStart(4)}  ${String(p.confirm.length).padStart(8)}  ${String(p.depart.length).padStart(8)}  ${String(p.keep.length).padStart(8)}${p.skipped ? '  ← ' + p.skipped : ''}`);
if (!LIVE) { console.log('\n→ 本番に書くときは --live を付けて同じコマンドを流す。'); process.exit(0); }

// ── 書き込み ─────────────────────────────────────────
const now = new Date().toISOString();
fs.mkdirSync('outputs/roster-reconcile', { recursive: true });
const backupPath = path.join('outputs/roster-reconcile', `brand-${now.replace(/[:.]/g, '-')}.json`);
try {
  fs.writeFileSync(backupPath, JSON.stringify({ at: now, file: FILE, rows: [...confirmRows, ...departRows].map((t) => ({ id: t.id, is_active: t.is_active, last_seen_at: t.last_seen_at })), confirm: confirmRows.map((t) => t.id), depart: departRows.map((t) => t.id) }, null, 1));
} catch (e) { console.error('❌ バックアップを書けないので中止:', e.message); process.exit(1); }
const chunk = async (list, patch, label) => {
  for (let k = 0; k < list.length; k += 40) {
    const { error } = await supabase.from('therapists').update(patch).in('id', list.slice(k, k + 40).map((t) => t.id));
    if (error) { console.error(`❌ ${label}を書けません: ${error.message}（バックアップ: ${backupPath}）`); process.exit(1); }
  }
};
await chunk(confirmRows, { is_active: true, last_seen_at: now }, '在籍確認');
await chunk(departRows, { is_active: false }, '退店扱い');
// 読み直し
let okC = 0, okD = 0;
const check = [...confirmRows, ...departRows].map((t) => t.id);
for (let k = 0; k < check.length; k += 40) {
  const { data } = await supabase.from('therapists').select('id,is_active,last_seen_at').in('id', check.slice(k, k + 40));
  for (const r of data) {
    if (confirmSet.has(r.id) && r.is_active === true && r.last_seen_at && r.last_seen_at.slice(0, 16) === now.slice(0, 16)) okC++;
    if (departSet.has(r.id) && r.is_active === false) okD++;
  }
}
console.log(`\n読み直し: 在籍確認 ${okC}/${confirmRows.length}・退店扱い ${okD}/${departRows.length}`);
console.log(`バックアップ: ${backupPath}`);
if (okC !== confirmRows.length || okD !== departRows.length) { console.error('❌ 予定と合いません'); process.exit(1); }
console.log('✅ 予定どおり');
