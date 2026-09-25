/**
 * register_new_therapists.mjs — collect_new_therapists.mjs で集めた新人を登録する
 *
 *   node scripts/maintenance/register_new_therapists.mjs --file=outputs/roster-audit/new-therapists-YYYY-MM-DD.json          （下見）
 *   node scripts/maintenance/register_new_therapists.mjs --file=... --live                                                   （書き込む）
 *
 * 【やること】（D-014: 名簿はブランドで1つ）
 *  ・新人 → そのブランドのルームのうち在籍の行が一番多いルームに追加（写真は R2 へ・店ごとのキー）
 *  ・戻った人（退店扱いの行に同じ名前がある）→ その行を在籍に戻す（写真が空なら入れる）
 *
 * 【安全装置】
 *  1. 既定は下見。知らない引数は止める。
 *  2. 足す行の id（<ルーム>_<名前>）が既にあれば、その人は足さない（上書きしない）。
 *  3. 写真は公式サイトの人物ページから来たものだけ（assertOfficialRosterSource）。写真判定で弾かれたら写真なしで足す。
 *  4. 1サイトで新人が60人を超えるときは、そのサイトは足さない（読み取りの失敗・名前でないものの混入を疑う）。
 *  4b.（2026-09-25）名前を rosterNameClean で整え、日本語の名前の形にならないものは足さない。整えた名前で
 *     同じブランドの DB の行と照合し直す（「リリカ大阪 黒崎あいみ」→「黒崎あいみ」が既にいれば足さない）。
 *  5. 足した id と戻した id を outputs/added-therapists/ に残す（消すときの手掛かり）。書いたあと読み直して照合。
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { assertOfficialRosterSource, scopedImageKey, rootDomainOf } from '../lib/sourceProvenance.mjs';
import { cleanRosterName, detectSitePrefix, selfTestRosterNameClean } from '../lib/rosterNameClean.mjs';

const args = process.argv.slice(2);
for (const a of args) if (!/^(--live|--file=.+)$/.test(a)) { console.error(`❌ 知らない引数です: ${a}`); process.exit(1); }
const LIVE = args.includes('--live');
const FILE = args.find((a) => a.startsWith('--file='))?.slice(7);
if (!FILE) { console.error('使い方: --file=outputs/roster-audit/new-therapists-YYYY-MM-DD.json [--live]'); process.exit(1); }
const MAX_PER_SITE = 60;
{
  const problems = selfTestRosterNameClean();
  if (problems.length) { console.error('❌ 名前の整え方が壊れています:', problems); process.exit(1); }
}
const nameKey = (v) => String(v || '').normalize('NFKC').replace(/[\s\u3000]/g, '').toLowerCase();

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } });

const data = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
// 同じブランド（同じドメインのルーム＋同じ group_id のルーム）の DB の名前
const shops = [];
for (let from = 0; ; from += 1000) {
  const { data: rows, error } = await supabase.from('shops').select('id,website_url,group_id').range(from, from + 999);
  if (error) { console.error('❌', error.message); process.exit(1); }
  shops.push(...rows); if (rows.length < 1000) break;
}
async function brandNames(domain) {
  const own = shops.filter((x) => rootDomainOf(x.website_url) === domain);
  const groups = new Set(own.map((x) => x.group_id).filter(Boolean));
  const all = shops.filter((x) => own.includes(x) || (x.group_id && groups.has(x.group_id)));
  const active = new Set(); const inactive = new Map();
  for (const sh of all) {
    const { data: rows } = await supabase.from('therapists').select('id,name,is_active').eq('shop_id', sh.id);
    for (const t of rows || []) { const k = nameKey(t.name); if (t.is_active === false) inactive.set(k, t.id); else active.add(k); }
  }
  return { active, inactive };
}
const plan = [];
let rejected = 0;
// 同じブランドの別ドメイン（Lynx の池袋・赤羽・新宿など）で同じ人を二重に足さない
const brandKeyOf = (shopId) => shops.find((x) => x.id === shopId)?.group_id || shopId;
const plannedByBrand = new Map();
for (const r of data.results) {
  if (!r.addTo) continue;
  // collect が整え済み（cleaned）なら頭の文字は外し終わっている。整え直すと別の語を外しかねないので検出しない
  const prefix = r.cleaned ? '' : detectSitePrefix([...r.newPeople, ...r.revive].map((x) => x.name));
  const { active, inactive } = await brandNames(r.domain);
  const bk = brandKeyOf(r.addTo);
  const planned = plannedByBrand.get(bk) || plannedByBrand.set(bk, new Set()).get(bk);
  const seen = new Set(); const add = []; const revive = [];
  for (const x of [...r.newPeople, ...r.revive]) {
    const name = cleanRosterName(x.name, prefix);
    if (!name) { rejected += 1; continue; }
    const k = nameKey(name);
    if (seen.has(k) || active.has(k) || planned.has(k)) continue;
    seen.add(k);
    try { assertOfficialRosterSource({ officialWebsiteUrl: r.website, rosterUrl: x.profileUrl }); } catch { continue; }
    if (inactive.has(k)) revive.push({ ...x, name, therapistId: inactive.get(k) }); else add.push({ ...x, name });
  }
  const tooMany = add.length > MAX_PER_SITE;
  if (!tooMany) for (const x of [...add, ...revive]) planned.add(nameKey(x.name));
  plan.push({ domain: r.domain, website: r.website, addTo: r.addTo, prefix, add: tooMany ? [] : add, revive: tooMany ? [] : revive, skipped: tooMany ? `新人${add.length}人（${MAX_PER_SITE}人超）` : null });
}
console.log(`名前の形にならず足さない候補: ${rejected}件`);
// 既にある id は足さない
const existing = new Set();
for (const p of plan) {
  if (!p.add.length) continue;
  const { data: rows } = await supabase.from('therapists').select('id').eq('shop_id', p.addTo);
  for (const t of rows || []) existing.add(t.id);
}
for (const p of plan) p.add = p.add.filter((x) => !existing.has(`${p.addTo}_${x.name}`));

const nAdd = plan.reduce((n, p) => n + p.add.length, 0);
const nRev = plan.reduce((n, p) => n + p.revive.length, 0);
console.log(`\n${LIVE ? '🔴 本番書き込み' : '🟢 下見（何も書きません）'}: 新人 ${nAdd}人を追加・戻った人 ${nRev}人を在籍に戻す（${plan.filter((p) => p.add.length || p.revive.length).length}サイト）`);
const skipped = plan.filter((p) => p.skipped);
if (skipped.length) console.log(`  足さないサイト: ${skipped.map((p) => `${p.domain}（${p.skipped}）`).join('、')}`);
for (const p of plan.filter((q) => q.add.length || q.revive.length).sort((a, b) => b.add.length - a.add.length)) {
  console.log(`  ${p.domain.padEnd(34)} 追加 ${String(p.add.length).padStart(3)}  戻す ${String(p.revive.length).padStart(3)}  → ${p.addTo}${p.prefix ? `（頭の「${p.prefix}」を外した）` : ''}   例: ${p.add.slice(0, 5).map((x) => x.name).join('、')}`);
}
if (!LIVE) {
  const planPath = FILE.replace(/\.json$/, '.plan.json');
  fs.writeFileSync(planPath, JSON.stringify(plan.filter((p) => p.add.length || p.revive.length).map((p) => ({ domain: p.domain, addTo: p.addTo, add: p.add.map((x) => x.name), revive: p.revive.map((x) => x.name) })), null, 1));
  console.log(`\n予定の一覧: ${planPath}`);
  console.log('→ 本番に書くときは --live を付けて同じコマンドを流す。');
  process.exit(0);
}

const { uploadImage } = await import('../lib/r2Upload.mjs');
const now = new Date().toISOString();
fs.mkdirSync('outputs/added-therapists', { recursive: true });
const logPath = path.join('outputs/added-therapists', `new-${now.replace(/[:.]/g, '-')}.json`);
const done = { at: now, file: FILE, added: [], revived: [] };
const save = () => fs.writeFileSync(logPath, JSON.stringify(done, null, 1));
save();
const fail = (m) => { save(); console.error(`❌ ${m}（記録: ${logPath}）`); process.exit(1); };
for (const p of plan) {
  const rows = [];
  for (const x of p.add) {
    const image = await uploadImage(x.imgUrl, scopedImageKey({ shopId: p.addTo, castId: x.castId || x.key, sourceUrl: x.imgUrl }), p.website, 'therapist-images', { officialWebsiteUrl: p.website, sourcePageUrl: x.profileUrl });
    rows.push({ id: `${p.addTo}_${x.name}`, shop_id: p.addTo, name: x.name, image_url: image, is_active: true, last_seen_at: now });
  }
  if (rows.length) {
    const { error } = await supabase.from('therapists').insert(rows);
    if (error) fail(`${p.domain}: 追加できません（${error.message}）`);
    done.added.push(...rows.map((r) => r.id)); save();
  }
  for (const x of p.revive) {
    const { data: cur } = await supabase.from('therapists').select('image_url').eq('id', x.therapistId).maybeSingle();
    const patch = { is_active: true, last_seen_at: now };
    if (cur && !cur.image_url) patch.image_url = await uploadImage(x.imgUrl, scopedImageKey({ shopId: p.addTo, castId: x.castId || x.key, sourceUrl: x.imgUrl }), p.website, 'therapist-images', { officialWebsiteUrl: p.website, sourcePageUrl: x.profileUrl });
    const { error } = await supabase.from('therapists').update(patch).eq('id', x.therapistId);
    if (error) fail(`${p.domain}: 戻せません（${error.message}）`);
    done.revived.push(x.therapistId);
  }
  save();
}
// 読み直し
let okA = 0;
for (const p of plan) {
  if (!p.add.length) continue;
  const { data: rows } = await supabase.from('therapists').select('id,is_active').eq('shop_id', p.addTo);
  const set = new Set((rows || []).filter((t) => t.is_active !== false).map((t) => t.id));
  okA += p.add.filter((x) => set.has(`${p.addTo}_${x.name}`)).length;
}
console.log(`\n読み直し: 追加 ${okA}/${nAdd}・戻した ${done.revived.length}/${nRev}`);
console.log(`記録: ${logPath}`);
if (okA !== nAdd || done.revived.length !== nRev) fail('予定と合いません');
console.log('✅ 予定どおり');
