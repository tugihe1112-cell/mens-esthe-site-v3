/**
 * apply_official_links.mjs — collect_official_links.mjs が集めた公式プロフィール・公式の在籍一覧のURLを DB に書く
 *
 *   node scripts/maintenance/apply_official_links.mjs --file=outputs/official-links/plan-YYYY-MM-DD.json          # 下見（既定）
 *   node scripts/maintenance/apply_official_links.mjs --file=outputs/official-links/plan-YYYY-MM-DD.json --live   # 書く
 *
 * 書く場所: therapists.raw_data.profileUrl ／ shops.raw_data.rosterUrl（raw_data のほかの項目は触らない＝読み直して足すだけ）。
 * ⚠️ 書く直前に DB の今の値で確かめ直す: 在籍中であること・公式サイト（website_url）と同じホストであること・http/https であること。
 *    共用のポータル（estama.jp・daysnavi.info）は店の番号まで同じこと・別のブランドの店が公式サイトにしているアドレスでないこと。
 * ⚠️ 同じ人（同じ行）に違うURLが2つ以上届いたら、その行は書かない（どちらが正しいか分からない）。
 * ⚠️ 書く前に、変える行の raw_data を全部 JSON に保存する（outputs/official-links/backup-*.json）。保存できなければ1行も書かない。
 * ⚠️ 書いた後に読み直して、書いた数と一致するか確かめる。
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { safeHttpUrl, sameOfficialSite, officialSiteScope, selfTestOfficialLinks } from '../../src/utils/officialLinks.js';

const selfProblems = selfTestOfficialLinks();
if (selfProblems.length) { console.error('❌ 公式サイトの判定の自己診断が通りません:\n  ' + selfProblems.join('\n  ')); process.exit(1); }

const args = process.argv.slice(2);
for (const a of args) if (!/^--(file=.+|live)$/.test(a)) { console.error(`❌ 知らない引数です: ${a}`); process.exit(1); }
const FILE = args.find((a) => a.startsWith('--file='))?.slice(7);
const LIVE = args.includes('--live');
if (!FILE) { console.error('使い方: --file=outputs/official-links/plan-YYYY-MM-DD.json [--live]'); process.exit(1); }

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } });

const plan = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
// 行ごとに1つのURLへ（違うURLが2つ以上なら書かない）
function collapse(entries, idKey, urlKey) {
  const m = new Map(); const conflict = new Set();
  for (const e of entries) {
    const u = safeHttpUrl(e[urlKey]); if (!u) continue;
    if (m.has(e[idKey]) && m.get(e[idKey]) !== u) conflict.add(e[idKey]);
    m.set(e[idKey], u);
  }
  for (const id of conflict) m.delete(id);
  return { map: m, conflict: [...conflict] };
}
const T = collapse(plan.results.flatMap((r) => r.therapists), 'id', 'profileUrl');
const S = collapse(plan.results.flatMap((r) => r.shops), 'id', 'rosterUrl');

// id は日本語を含み URL で1件 60〜150字になる。200件まとめると URL が長すぎて接続ごと切られる
// （2026-10-05 に 35,902行で "fetch failed"）。1回50件・通信の失敗は3回までやり直す。
async function readRows(table, cols, ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    let data, error;
    for (let attempt = 1; attempt <= 3; attempt++) {
      ({ data, error } = await supabase.from(table).select(cols).in('id', ids.slice(i, i + 50)));
      if (!error || !/fetch failed|network|timeout/i.test(error.message)) break;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
    if (error) { console.error('❌', table, error.message); process.exit(1); }
    out.push(...data);
  }
  return out;
}
const shops = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase.from('shops').select('id,website_url,group_id,raw_data').range(from, from + 999);
  if (error) { console.error('❌ shops', error.message); process.exit(1); }
  shops.push(...data); if (data.length < 1000) break;
}
const shopById = new Map(shops.map((s) => [s.id, s]));
// そのアドレスを公式サイトにしている店（ブランド）。別のブランドの店のアドレスなら、その店の人のページではない。
// （同じ貸しサーバーのサブドメインを別の店が使う形＝aroma-terrace.men-este.com と fairy.men-este.com など）
const brandOf = (s) => s.group_id || `solo:${s.id}`;
const owners = new Map();
for (const s of shops) {
  const k = officialSiteScope(s.website_url); if (!k) continue;
  (owners.get(k) || owners.set(k, new Set()).get(k)).add(brandOf(s));
}
const otherBrandsSite = (url, shop) => { const o = owners.get(officialSiteScope(url)); return !!o && !o.has(brandOf(shop)); };
// 在籍一覧がほかの店の公式サイト（トップ）そのものなら、その店の一覧ではない（SUHADA SPA 柏店に千葉店の /chiba/ が入った）
const normUrl = (u) => String(u || '').trim().replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '').toLowerCase();
const websiteOwner = new Map(shops.filter((s) => s.website_url).map((s) => [normUrl(s.website_url), s.id]));
const otherShopsTop = (url, shop) => { const o = websiteOwner.get(normUrl(url)); return !!o && o !== shop.id; };
const tRows = await readRows('therapists', 'id,shop_id,is_active,raw_data', [...T.map.keys()]);

const skipEx = [];
const changes = []; const skipped = { inactive: 0, offSite: 0, otherBrand: 0, notObject: 0, same: 0, missing: 0 };
const isObj = (v) => v == null || (typeof v === 'object' && !Array.isArray(v));
for (const t of tRows) {
  const url = T.map.get(t.id);
  const shop = shopById.get(t.shop_id); const site = shop?.website_url;
  if (t.is_active === false) { skipped.inactive += 1; continue; }
  if (!site || !sameOfficialSite(url, site)) { skipped.offSite += 1; skipEx.push(`公式の外 ${t.id} → ${url}（公式 ${site}）`); continue; }
  if (otherBrandsSite(url, shop)) { skipped.otherBrand += 1; skipEx.push(`別の店 ${t.id} → ${url}`); continue; }
  if (!isObj(t.raw_data)) { skipped.notObject += 1; continue; }
  if (t.raw_data?.profileUrl === url) { skipped.same += 1; continue; }
  changes.push({ table: 'therapists', id: t.id, before: t.raw_data ?? null, after: { ...(t.raw_data || {}), profileUrl: url } });
}
skipped.missing += T.map.size - tRows.length;
for (const [id, url] of S.map) {
  const s = shopById.get(id);
  if (!s) { skipped.missing += 1; continue; }
  if (!s.website_url || !sameOfficialSite(url, s.website_url)) { skipped.offSite += 1; continue; }
  if (otherBrandsSite(url, s) || otherShopsTop(url, s)) { skipped.otherBrand += 1; skipEx.push(`別の店 ${id} → ${url}`); continue; }
  if (!isObj(s.raw_data)) { skipped.notObject += 1; continue; }
  if (s.raw_data?.rosterUrl === url) { skipped.same += 1; continue; }
  changes.push({ table: 'shops', id, before: s.raw_data ?? null, after: { ...(s.raw_data || {}), rosterUrl: url } });
}
const nT = changes.filter((c) => c.table === 'therapists').length;
const nS = changes.filter((c) => c.table === 'shops').length;
const replace = changes.filter((c) => c.table === 'therapists' && c.before?.profileUrl).length;
console.log(`書く予定: セラピスト ${nT}行（公式プロフィール・うち今の値を置き換え ${replace}）・店 ${nS}店（公式の在籍一覧）`);
console.log(`書かない: 在籍中でない ${skipped.inactive}・公式サイトの外 ${skipped.offSite}・別の店のサイト ${skipped.otherBrand}・raw_data が形違い ${skipped.notObject}・同じ値 ${skipped.same}・行が無い ${skipped.missing}・違うURLが2つ ${T.conflict.length + S.conflict.length}`);
for (const c of changes.filter((x) => x.table === 'therapists').slice(0, 5)) console.log(`  例 ${c.id} → ${c.after.profileUrl}`);
for (const x of skipEx.slice(0, 12)) console.log(`  書かない例 ${x}`);
if (!LIVE) { console.log('\n（下見です。書くときは --live）'); process.exit(0); }

// ── バックアップ → 書く → 読み直し ─────────────────────────
fs.mkdirSync('outputs/official-links', { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = path.join('outputs/official-links', `backup-${stamp}.json`);
try { fs.writeFileSync(backup, JSON.stringify({ at: new Date().toISOString(), file: FILE, rows: changes.map(({ table, id, before }) => ({ table, id, before })) }, null, 1)); }
catch (e) { console.error(`❌ バックアップを保存できないので1行も書きません: ${e.message}`); process.exit(1); }
console.log(`バックアップ: ${backup}`);

let done = 0; let failed = 0; let next = 0;
async function worker() {
  while (next < changes.length) {
    const c = changes[next++];
    const { error } = await supabase.from(c.table).update({ raw_data: c.after }).eq('id', c.id);
    if (error) { failed += 1; console.error(`  ❌ ${c.table} ${c.id}: ${error.message}`); } else done += 1;
    if ((done + failed) % 1000 === 0) console.log(`  ${done + failed}/${changes.length}`);
  }
}
await Promise.all(Array.from({ length: 12 }, worker));
console.log(`書いた: ${done}・失敗 ${failed}`);

// 読み直し
let ok = 0;
for (const table of ['therapists', 'shops']) {
  const key = table === 'therapists' ? 'profileUrl' : 'rosterUrl';
  const mine = changes.filter((c) => c.table === table);
  const rows = await readRows(table, 'id,raw_data', mine.map((c) => c.id));
  const got = new Map(rows.map((r) => [r.id, r.raw_data?.[key]]));
  ok += mine.filter((c) => got.get(c.id) === c.after[key]).length;
}
console.log(`読み直し: ${ok}/${changes.length} 一致`);
if (ok !== changes.length) process.exit(1);
