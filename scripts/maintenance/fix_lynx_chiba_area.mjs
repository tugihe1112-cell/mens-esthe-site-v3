/**
 * fix_lynx_chiba_area.mjs — Lynx 千葉エリア4店（千葉・船橋・松戸・西船橋）の名簿を公式に合わせる
 *
 *   node scripts/maintenance/fix_lynx_chiba_area.mjs          （下見・何も書かない）
 *   node scripts/maintenance/fix_lynx_chiba_area.mjs --live   （書き込む）
 *
 * 【なぜ（2026-09-25）】
 *  4店の DB の名簿は各194人で、2026-04 にチェーン全体（秋葉原店の名簿）を写したもの（9/15 に判明）。
 *  公式の在籍一覧（/therapist-list/・人ごとに /therapist/?id=N）は4店でほぼ共通（千葉・船橋・松戸60人、西船橋57人）で、
 *  DB の194人とは3%しか一致しない＝一般の照合（一致40%以上が条件）には乗らない。
 *  一覧は画面を組み立てたあとの状態でないと写真の場所が分からないので、手元の Chrome を裏で動かして読む。
 *
 * 【やること】（D-014: Lynx は1ブランド g_brand_lynx。名簿はブランドで1つ）
 *  1. 4店それぞれ、DB の行のうち公式にいる人 → 在籍確認、いない人 → 退店扱い（削除しない）
 *  2. 公式にいて、Lynx のどのルームにも在籍中として入っていない人 → 千葉店（chiba_chiba_lynx）に写真付きで追加
 *  3. 「×」で2人を組んだ枠・「新人セラピスト出勤予定」の枠は人ではないので使わない
 *
 * 【安全装置】 既定は下見／書く前の行を outputs/roster-reconcile/ に保存／公式の人数が30人未満なら中止
 *  （読み取りの失敗を疑う）／書いたあと読み直して照合。
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';
import { scopedImageKey } from '../lib/sourceProvenance.mjs';

const args = process.argv.slice(2);
for (const a of args) if (a !== '--live') { console.error(`❌ 知らない引数です: ${a}`); process.exit(1); }
const LIVE = args.includes('--live');

const SITES = [
  { shopId: 'chiba_chiba_lynx', host: 'https://esthe-lynx-chiba.com' },
  { shopId: 'chiba_funabashi_lynx', host: 'https://esthe-lynx-funabashi.com' },
  { shopId: 'chiba_matsudo_lynx', host: 'https://esthe-lynx-matsudo.com' },
  { shopId: 'chiba_nishi_funabashi_lynx', host: 'https://www.esthe-lynx-koiwa.com' },
];
const ADD_TO = 'chiba_chiba_lynx';
const GROUP = 'g_brand_lynx';
const NOT_PERSON = /×|新人セラピスト|出勤予定|出勤中/;
const flat = (s) => String(s || '').normalize('NFKC').replace(/[\s　]/g, '');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } });

// ── 公式の在籍一覧を読む ──────────────────────────────────
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const official = {};
for (const s of SITES) {
  const p = await browser.newPage();
  await p.goto(`${s.host}/therapist-list/`, { waitUntil: 'networkidle2', timeout: 60000 });
  for (let i = 0; i < 15; i++) { await p.evaluate(() => window.scrollBy(0, 1500)); await new Promise((r) => setTimeout(r, 300)); }
  const items = await p.evaluate(() => {
    const m = new Map();
    for (const a of document.querySelectorAll('a[href*="therapist/?id="]')) {
      const id = new URL(a.href).searchParams.get('id');
      const img = a.querySelector('img');
      const src = img ? (img.currentSrc || img.getAttribute('data-src') || img.src) : '';
      const name = (img?.alt || a.textContent || '').replace(/\s+/g, ' ').trim();
      const prev = m.get(id) || {};
      m.set(id, { castId: id, name: prev.name || name, src: prev.src || src });
    }
    return [...m.values()];
  });
  await p.close();
  const people = items.filter((x) => x.name && !NOT_PERSON.test(x.name)).map((x) => ({
    ...x, imgUrl: /no-image/.test(x.src) || !x.src ? null : x.src.split('?')[0],
  }));
  if (people.length < 30) { console.error(`❌ ${s.host} の公式の人数が ${people.length} 人＝読み取りの失敗を疑うので中止`); await browser.close(); process.exit(1); }
  official[s.shopId] = people;
}
await browser.close();

// ── DB（Lynx ブランド全体）───────────────────────────────────
const { data: lynxShops } = await supabase.from('shops').select('id').eq('group_id', GROUP);
const brandRows = [];
for (const { id } of lynxShops) {
  const { data, error } = await supabase.from('therapists').select('id,shop_id,name,is_active,last_seen_at,image_url').eq('shop_id', id);
  if (error) { console.error('❌ DBを読めません:', error.message); process.exit(1); }
  brandRows.push(...data);
}
const activeInBrand = new Set(brandRows.filter((t) => t.is_active !== false).map((t) => flat(t.name)));

const plans = [];
for (const s of SITES) {
  const names = new Set(official[s.shopId].map((x) => flat(x.name)));
  const rows = brandRows.filter((t) => t.shop_id === s.shopId && t.is_active !== false);
  plans.push({ ...s, official: official[s.shopId].length, confirm: rows.filter((t) => names.has(flat(t.name))), depart: rows.filter((t) => !names.has(flat(t.name))) });
}
const addMap = new Map();
for (const s of SITES) for (const x of official[s.shopId]) if (!activeInBrand.has(flat(x.name)) && !addMap.has(flat(x.name))) addMap.set(flat(x.name), { ...x, host: s.host });
const toAdd = [...addMap.values()];

console.log(`\n${LIVE ? '🔴 本番書き込み' : '🟢 下見（何も書きません）'}`);
for (const p of plans) console.log(`  ${p.shopId.padEnd(28)} 公式 ${p.official}人 ／ DB在籍 ${p.confirm.length + p.depart.length}行 → 在籍確認 ${p.confirm.length}・退店扱い ${p.depart.length}`);
console.log(`  ${ADD_TO} に追加（Lynx のどのルームにも在籍中でない人）: ${toAdd.length}人（写真あり ${toAdd.filter((x) => x.imgUrl).length}）`);
console.log(`    ${toAdd.map((x) => x.name).join('、')}`);
if (!LIVE) { console.log('\n→ 本番に書くときは --live を付けて同じコマンドを流す。'); process.exit(0); }

// ── 書き込み ─────────────────────────────────────────
const { uploadImage } = await import('../lib/r2Upload.mjs');
const now = new Date().toISOString();
fs.mkdirSync('outputs/roster-reconcile', { recursive: true });
const backupPath = path.join('outputs/roster-reconcile', `lynx-chiba-${now.replace(/[:.]/g, '-')}.json`);
try {
  fs.writeFileSync(backupPath, JSON.stringify({ at: now, rows: plans.flatMap((p) => [...p.confirm, ...p.depart]).map((t) => ({ id: t.id, is_active: t.is_active, last_seen_at: t.last_seen_at })), add: toAdd.map((x) => x.name) }, null, 1));
} catch (e) { console.error('❌ バックアップを書けないので中止:', e.message); process.exit(1); }
const fail = (m) => { console.error(`❌ ${m}（バックアップ: ${backupPath}）`); process.exit(1); };
for (const p of plans) {
  for (let k = 0; k < p.confirm.length; k += 40) {
    const { error } = await supabase.from('therapists').update({ is_active: true, last_seen_at: now }).in('id', p.confirm.slice(k, k + 40).map((t) => t.id));
    if (error) fail(`在籍確認を書けません: ${error.message}`);
  }
  for (let k = 0; k < p.depart.length; k += 40) {
    const { error } = await supabase.from('therapists').update({ is_active: false }).in('id', p.depart.slice(k, k + 40).map((t) => t.id));
    if (error) fail(`退店扱いを書けません: ${error.message}`);
  }
}
const addRows = [];
for (const x of toAdd) {
  const site = `${x.host}/`;
  const image = x.imgUrl ? await uploadImage(x.imgUrl, scopedImageKey({ shopId: ADD_TO, castId: x.castId, sourceUrl: x.imgUrl }), site, 'therapist-images', { officialWebsiteUrl: site, sourcePageUrl: `${x.host}/therapist-list/` }) : null;
  addRows.push({ id: `${ADD_TO}_${x.name}`, shop_id: ADD_TO, name: x.name, image_url: image, is_active: true, last_seen_at: now });
}
if (addRows.length) { const { error } = await supabase.from('therapists').upsert(addRows, { onConflict: 'id' }); if (error) fail(`追加できません: ${error.message}`); }
// 読み直し
let ok = true;
for (const p of plans) {
  const { data } = await supabase.from('therapists').select('id,is_active').eq('shop_id', p.shopId);
  const active = data.filter((t) => t.is_active !== false).length;
  const expect = p.confirm.length + (p.shopId === ADD_TO ? addRows.length : 0);
  console.log(`読み直し ${p.shopId}: 在籍 ${active}/${expect}`);
  if (active !== expect) ok = false;
}
console.log(`追加 ${addRows.length}人（写真あり ${addRows.filter((r) => r.image_url).length}）／バックアップ: ${backupPath}`);
if (!ok) fail('予定と合いません');
console.log('✅ 予定どおり');
