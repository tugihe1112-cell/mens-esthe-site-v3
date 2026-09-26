/**
 * sync_yurikago_osaka.mjs — こころのゆりかご 大阪（osaka_umeda_kokoronoyurikago）の公式サイト移転に合わせて、URLと名簿を公式に揃える
 *
 *   node scripts/maintenance/sync_yurikago_osaka.mjs          （下見・何も書かない）
 *   node scripts/maintenance/sync_yurikago_osaka.mjs --live   （書き込み）
 *
 * 【なぜ（2026-09-27）】 登録している公式サイト kokoronoyurikago-osaka.site はパスワードがかかって読めなくなっていた。
 *  okabayashi が新しい公式サイト https://yurikago-osaka.net/ を見つけた（「ゆりかご大阪｜新大阪・北新地・堺筋本町」）。
 *  運営の口コミが付いた聖琉・彩華は新サイトにも同じ名前・年齢で載っている＝同じ店。
 *  DB の名簿9行のうち6行は別の店の名前が混ざったもの（葉月あや・橋本るい・双葉ゆりな・小鳥遊ゆり＝5/14 に小悪魔スパから消した4人など）で、写真は0。
 *
 * 【やること】
 *  1. 店の公式URL・出勤URLを新サイトに差し替える。
 *  2. 在籍一覧（/staff.html）の人を読む。名前は画像の説明文「楓～かえで～」の「～」より前（DBの既存の書き方「聖琉」「彩華」に合わせる）。
 *  3. DBに同じ名前の人がいれば在籍確認（写真が無ければ付ける）。いなければ追加（写真は店ごとのキーでR2へ・取れなければ名前だけ）。
 *  4. 公式にいないDBの人は退店扱い（削除しない・最終確認日は触らない）。
 *
 * 【安全装置】 既定は下見。公式が20人未満なら中止（読み取りの失敗）。書く前に今の行をJSONへ保存。書いた後に読み直して照合。
 */
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { uploadImage } from '../lib/r2Upload.mjs';
import { scopedImageKey } from '../lib/sourceProvenance.mjs';

const args = process.argv.slice(2);
for (const a of args) if (a !== '--live') { console.error(`❌ 知らない引数です: ${a}`); process.exit(1); }
const LIVE = args.includes('--live');

const SHOP_ID = 'osaka_umeda_kokoronoyurikago';
const SITE = 'https://yurikago-osaka.net/';
const STAFF = 'https://yurikago-osaka.net/staff.html';
const SCHEDULE = 'https://yurikago-osaka.net/schedule.html';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } });
const flat = (s) => String(s || '').normalize('NFKC').replace(/[\s　]/g, '');

// ── 公式の在籍一覧 ─────────────────────────────
const html = await (await fetch(STAFF, { headers: { 'User-Agent': UA } })).text();
const $ = cheerio.load(html);
const official = [];
const seen = new Set();
$('li.c-list-therapist__item').each((_, li) => {
  const a = $(li).find('a[href*="profile.html?"]').first();
  const castId = (a.attr('href') || '').match(/profile\.html\?(\d+)/)?.[1];
  const img = $(li).find('figure.c-list-therapist__img > img').first();
  const alt = (img.attr('alt') || '').trim();
  const name = alt.split(/[～〜~]/)[0].trim();
  if (!castId || !name || seen.has(castId)) return;
  if (/ゆりかご|[｜|]|ルーム/.test(alt)) return; // 「ゆりかご大阪｜新大阪」などルームの紹介枠は人ではない
  seen.add(castId);
  const src = img.attr('src');
  const imgUrl = src && !/noimage|now_?printing|no_image/i.test(src) ? new URL(src, SITE).href : null;
  official.push({ castId, name, reading: alt.match(/[～〜~](.+?)[～〜~]/)?.[1] || '', imgUrl, profileUrl: new URL(a.attr('href'), SITE).href });
});
console.log(`公式の在籍一覧: ${official.length}人（写真あり ${official.filter((o) => o.imgUrl).length}）`);
if (official.length < 20) { console.error('❌ 公式が20人未満＝読み取りの失敗とみて中止'); process.exit(1); }
const dupNames = official.map((o) => flat(o.name)).filter((n, i, arr) => arr.indexOf(n) !== i);
if (dupNames.length) { console.error(`❌ 公式に同じ名前が複数: ${dupNames.join(',')}（id が重なるので中止）`); process.exit(1); }

// ── DB ────────────────────────────────────────
const { data: shop, error: se } = await supabase.from('shops').select('id,name,website_url,schedule_url').eq('id', SHOP_ID).maybeSingle();
if (se || !shop) { console.error('❌ 店を読めません', se?.message || ''); process.exit(1); }
const { data: rows, error: te } = await supabase.from('therapists').select('id,name,image_url,is_active,last_seen_at').eq('shop_id', SHOP_ID);
if (te) { console.error('❌ 名簿を読めません', te.message); process.exit(1); }
const byName = new Map(rows.map((r) => [flat(r.name), r]));
const officialNames = new Set(official.map((o) => flat(o.name)));

const confirm = official.filter((o) => byName.has(flat(o.name)));
const add = official.filter((o) => !byName.has(flat(o.name)));
const depart = rows.filter((r) => !officialNames.has(flat(r.name)) && r.is_active !== false);
const { data: revs } = await supabase.from('reviews').select('therapist_id,therapist_name').eq('shop_id', SHOP_ID);
const reviewed = new Set((revs || []).map((r) => r.therapist_id));

console.log(`\n店: ${shop.name}\n  公式URL ${shop.website_url} → ${SITE}\n  出勤URL ${shop.schedule_url} → ${SCHEDULE}`);
console.log(`在籍確認 ${confirm.length}: ${confirm.map((o) => o.name).join('・')}`);
console.log(`追加 ${add.length}（写真あり ${add.filter((o) => o.imgUrl).length}）: ${add.map((o) => o.name).join('・')}`);
console.log(`退店扱い ${depart.length}: ${depart.map((r) => r.name + (reviewed.has(r.id) ? '（口コミあり）' : '')).join('・')}`);
if (!LIVE) { console.log('\n🟢 下見です。書くときは --live'); process.exit(0); }

// ── 書く ──────────────────────────────────────
const now = new Date().toISOString();
fs.mkdirSync('outputs/roster-reconcile', { recursive: true });
const backup = path.join('outputs/roster-reconcile', `yurikago-osaka-${now.replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(backup, JSON.stringify({ at: now, shop, therapists: rows }, null, 1));
console.log(`\n📦 バックアップ ${backup}`);

const { error: ue } = await supabase.from('shops').update({ website_url: SITE, schedule_url: SCHEDULE }).eq('id', SHOP_ID);
if (ue) { console.error('❌ 店のURLを書けません', ue.message); process.exit(1); }

const img = async (o) => {
  if (!o.imgUrl) return null;
  try { return await uploadImage(o.imgUrl, scopedImageKey({ shopId: SHOP_ID, castId: o.castId, sourceUrl: o.imgUrl }), SITE, 'therapist-images', { officialWebsiteUrl: SITE, sourcePageUrl: o.profileUrl }); }
  catch (e) { console.log(`  写真なしで登録: ${o.name}（${e.message.slice(0, 60)}）`); return null; }
};
for (const o of confirm) {
  const cur = byName.get(flat(o.name));
  const patch = { is_active: true, last_seen_at: now };
  if (!cur.image_url) patch.image_url = await img(o);
  const { error } = await supabase.from('therapists').update(patch).eq('id', cur.id);
  if (error) { console.error('❌', o.name, error.message); process.exit(1); }
}
const newRows = [];
for (const o of add) newRows.push({ id: `${SHOP_ID}_${o.name}`, shop_id: SHOP_ID, name: o.name, image_url: await img(o), is_active: true, last_seen_at: now });
if (newRows.length) { const { error } = await supabase.from('therapists').insert(newRows); if (error) { console.error('❌ 追加できません', error.message); process.exit(1); } }
if (depart.length) { const { error } = await supabase.from('therapists').update({ is_active: false }).in('id', depart.map((r) => r.id)); if (error) { console.error('❌ 退店扱いを書けません', error.message); process.exit(1); } }

// ── 読み直し ──────────────────────────────────
const { data: after } = await supabase.from('therapists').select('id,name,image_url,is_active').eq('shop_id', SHOP_ID);
const active = after.filter((r) => r.is_active !== false);
const okNames = official.every((o) => active.some((r) => flat(r.name) === flat(o.name)));
console.log(`\n読み直し: 在籍 ${active.length}（公式 ${official.length}）・写真あり ${active.filter((r) => r.image_url).length}・退店扱い ${after.length - active.length}`);
console.log(okNames && active.length === official.length ? '✅ 公式と一致' : '❌ 公式と一致しません');
