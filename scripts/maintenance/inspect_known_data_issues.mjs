/**
 * inspect_known_data_issues.mjs — オーナーが指摘した「直さないといけないデータ」5件の現状を読むだけの道具
 *
 * 【読むだけ】本番DBを1行も変更しない。UPDATE も DELETE も持たない。
 *
 * 【なぜ先にこれを作るか】
 * 直す前に「いま何が入っているか」を確定させないと、直す対象を取り違える。
 * 2026-09-13 に「消してよい35店」を出して、実際は15店が営業中だった件と同じ型を避ける。
 *
 * 対象（okabayashi 指摘・2026-09-14）:
 *  1. 岡山「ミセス美オーラ」の公式URLが viaura.jp（ポータル5社は mrs-viaura-okayama.com）
 *  2. 大阪「ミセス美オーラ」は桜川＋高槻の2拠点なのに高槻だけ
 *  3. doigt de fee 3件の所在地が全部「神奈川県川崎」（実際は厚木・川崎・自由が丘）
 *  4. 「ゆりかご京都」が滋賀のidに入っている
 *  5. Lynx 13店が全部 esthe-lynx-shinjuku.com を公式URLにしている（横浜関内は2レコード）
 *
 * 実行: node scripts/maintenance/inspect_known_data_issues.mjs
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// PostgREST は1回に最大1000行。全件を取り切ってからJSで絞る（名前の表記ゆれに強くするため）。
async function allShops() {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('shops')
      .select('id, name, group_id, website_url, raw_data')
      .range(from, from + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

const norm = (v) => String(v ?? '').normalize('NFKC').replace(/[\s　]/g, '').toLowerCase();
const place = (s) => {
  const r = s.raw_data || {};
  const area = Array.isArray(r.area) ? r.area.join('/') : (r.area || '');
  return `${r.prefecture || '—'} / ${r.city || '—'} / ${area || '—'}`;
};

const shops = await allShops();
console.log(`全店舗 ${shops.length}件を読み込み\n`);

const groups = [
  ['① ミセス美オーラ', (s) => /美オーラ|viaura|ビオーラ/i.test(norm(s.name)) || /viaura/i.test(s.website_url || '')],
  ['③ doigt de fee', (s) => /doigtdefee|ドゥワドフェ/i.test(norm(s.name))],
  ['④ ゆりかご', (s) => /ゆりかご|yurikago/i.test(norm(s.name)) || /yurikago/i.test(s.id)],
  ['⑤ Lynx', (s) => /^lynx|リンクス/i.test(norm(s.name)) || /lynx/i.test(s.id)],
];

for (const [label, match] of groups) {
  const hits = shops.filter(match);
  console.log(`━━ ${label} … ${hits.length}件 ━━`);
  for (const s of hits.sort((a, b) => String(a.id).localeCompare(String(b.id)))) {
    console.log(`  id        : ${s.id}`);
    console.log(`  name      : ${s.name}`);
    console.log(`  group_id  : ${s.group_id || '—'}`);
    console.log(`  website   : ${s.website_url || '—'}`);
    console.log(`  所在地     : ${place(s)}`);
    console.log(`  address   : ${s.raw_data?.address || '—'}`);
    console.log('');
  }
}

// 「idの県名」と「raw_data.prefecture」がずれている店（④の一般化。他にも無いかを見る）
const PREF_IN_ID = {
  hokkaido: '北海道', aomori: '青森県', iwate: '岩手県', miyagi: '宮城県', akita: '秋田県', yamagata: '山形県', fukushima: '福島県',
  ibaraki: '茨城県', tochigi: '栃木県', gunma: '群馬県', saitama: '埼玉県', chiba: '千葉県', tokyo: '東京都', kanagawa: '神奈川県',
  niigata: '新潟県', toyama: '富山県', ishikawa: '石川県', fukui: '福井県', yamanashi: '山梨県', nagano: '長野県',
  gifu: '岐阜県', shizuoka: '静岡県', aichi: '愛知県', mie: '三重県', shiga: '滋賀県', kyoto: '京都府', osaka: '大阪府',
  hyogo: '兵庫県', nara: '奈良県', wakayama: '和歌山県', tottori: '鳥取県', shimane: '島根県', okayama: '岡山県',
  hiroshima: '広島県', yamaguchi: '山口県', tokushima: '徳島県', kagawa: '香川県', ehime: '愛媛県', kochi: '高知県',
  fukuoka: '福岡県', saga: '佐賀県', nagasaki: '長崎県', kumamoto: '熊本県', oita: '大分県', miyazaki: '宮崎県',
  kagoshima: '鹿児島県', okinawa: '沖縄県',
};
const mismatched = [];
for (const s of shops) {
  const head = String(s.id).split('_')[0];
  const fromId = PREF_IN_ID[head];
  const actual = s.raw_data?.prefecture;
  if (fromId && actual && fromId !== actual) mismatched.push({ id: s.id, name: s.name, fromId, actual });
}
console.log(`━━ idの県名と raw_data.prefecture の不一致 … ${mismatched.length}件 ━━`);
console.log('  （④「ゆりかご京都が滋賀のidに入っている」と同じ型が他にもないかの全件確認）');
for (const m of mismatched.slice(0, 40)) {
  console.log(`  ${m.id}\n     name=${m.name} / idの県=${m.fromId} / 実データ=${m.actual}`);
}
if (mismatched.length > 40) console.log(`  …他 ${mismatched.length - 40}件`);
