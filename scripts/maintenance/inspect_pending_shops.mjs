/**
 * inspect_pending_shops.mjs — 判断待ちの店舗について、決めるのに要る数字だけを読む
 *
 * 【読むだけ】本番DBを1行も変更しない。
 *
 * 対象（2026-09-15 オーナー回答を受けて）:
 *   - オトナコード4030 / リオラ … 県ずれ。何レコードあるかで直し方が変わる
 *   - Lynx 横浜関内の重複2件   … どちらを残すか＝口コミ・在籍・最終確認日で決める
 *   - Lynx 秋葉原店            … 「なしでいい」。消す前に口コミが付いていないか確認する
 *   - ゆりかご                 … 2レコードの現状確認
 *
 * ⚠️ 口コミが付いている店を消してはいけない。口コミは利用者が書いた一次情報で、
 *    店を消すと読めなくなる。付いていたら「消す」ではなく「閉店の帯」を選ぶこと。
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const IDS = [
  ['Lynx 横浜関内 A', 'kanagawa_kannai_lynx'],
  ['Lynx 横浜関内 B', 'kanagawa_yokohama_lynx'],
  ['Lynx 秋葉原', 'tokyo_chiyoda_akihabara_lynx'],
  ['リオラ', 'kanagawa_yokohama_liora'],
  ['ゆりかご 京都(京都id)', 'kyoto_kyoto_yurikago'],
  ['ゆりかご 京都(滋賀id)', 'shiga_otsu_station_yurikago'],
];

const show = (v) => (v == null || v === '' ? '—' : Array.isArray(v) ? v.join('/') : String(v));

async function counts(shopId) {
  const [r, t] = await Promise.all([
    sb.from('reviews').select('id', { count: 'exact', head: true }).eq('shop_id', shopId),
    sb.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', shopId),
  ]);
  if (r.error) throw r.error;
  if (t.error) throw t.error;
  return { reviews: r.count || 0, therapists: t.count || 0 };
}

async function dump(label, shop) {
  const c = await counts(shop.id);
  const raw = shop.raw_data || {};
  console.log(`\n■ ${label} [${shop.id}]`);
  console.log(`   name       : ${shop.name}`);
  console.log(`   group_id   : ${show(shop.group_id)}`);
  console.log(`   website    : ${show(shop.website_url)}`);
  console.log(`   所在地      : ${show(raw.prefecture)} / ${show(raw.city)} / ${show(raw.area)}`);
  console.log(`   address    : ${show(raw.address)}`);
  console.log(`   口コミ      : ${c.reviews}件   在籍: ${c.therapists}人`);
  console.log(`   last_seen  : ${show(shop.last_seen_at)}   is_active: ${show(shop.is_active)}`);
}

for (const [label, id] of IDS) {
  const { data, error } = await sb.from('shops').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) { console.log(`\n■ ${label} [${id}] … 見つかりません`); continue; }
  await dump(label, data);
}

// ブランド単位で何レコードあるか（県ずれの直し方が変わるので全ルームを見る）
console.log('\n\n━━ ブランドに何ルームあるか ━━');
const { data: all, error } = await sb.from('shops').select('id, name, group_id, website_url, raw_data');
if (error) throw error;
const norm = (v) => String(v ?? '').normalize('NFKC').toLowerCase();
for (const [label, test] of [
  ['オトナコード4030', (s) => /オトナコード|オトナクチュール|otona.?co/i.test(norm(s.name)) || /otona/i.test(s.id)],
  ['リオラ / マリラ', (s) => /リオラ|マリラ|liora|marira/i.test(norm(s.name)) || /liora/i.test(s.id)],
  ['ゆりかご(京都ブランド)', (s) => s.group_id === 'g_brand_yurikago_kyoto'],
]) {
  const hits = (all || []).filter(test);
  console.log(`\n── ${label} … ${hits.length}件`);
  for (const s of hits.sort((a, b) => String(a.id).localeCompare(String(b.id)))) {
    const raw = s.raw_data || {};
    const c = await counts(s.id);
    console.log(`   ${s.id}`);
    console.log(`      name=${s.name} / group=${show(s.group_id)}`);
    console.log(`      所在地=${show(raw.prefecture)} / ${show(raw.city)} / ${show(raw.area)}`);
    console.log(`      website=${show(s.website_url)}`);
    console.log(`      口コミ=${c.reviews}件 在籍=${c.therapists}人`);
  }
}
