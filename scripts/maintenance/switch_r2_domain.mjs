/**
 * switch_r2_domain.mjs — DBの画像URLのドメイン部分だけを一括置換（R2カスタムドメイン切替）
 *
 * r2.dev(開発URL・レート制限あり)を卒業し、R2カスタムドメイン(img.<新ドメイン>)へ切り替える。
 * キー部分(therapist-images/xxx)は不変＝再アップロード不要・ドメイン文字列だけ差し替える。
 *
 * 対象: therapists.image_url / shops.image_url のうち FROM を含む行のみ（null・外部は不触）。
 * 冪等: FROMを含む行だけが対象なので再実行は残り分のみ。--rollback で逆方向。完全可逆。
 *
 * 前提: .env に VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / R2_PUBLIC_BASE
 * 実行:
 *   node scripts/maintenance/switch_r2_domain.mjs --to=https://img.example.com --dry-run   # 件数と置換例だけ
 *   node scripts/maintenance/switch_r2_domain.mjs --to=https://img.example.com             # 本実行（r2.dev→新ドメイン）
 *   node scripts/maintenance/switch_r2_domain.mjs --to=https://img.example.com --rollback  # 巻き戻し（新ドメイン→r2.dev）
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const E = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(E('VITE_SUPABASE_URL'), E('SUPABASE_SERVICE_ROLE_KEY'));

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const ROLLBACK = args.includes('--rollback');
const toArg = args.find((a) => a.startsWith('--to='))?.split('=')[1];

const R2DEV = (E('R2_PUBLIC_BASE') || 'https://pub-1eb6e3f48a044dd9b5841a8f4be21a89.r2.dev').replace(/\/+$/, '');
if (!toArg) { console.error('❌ --to=https://img.<新ドメイン> を指定して'); process.exit(1); }
const NEWBASE = toArg.replace(/\/+$/, '');

// 通常: r2.dev → 新ドメイン ／ rollback: 新ドメイン → r2.dev
const FROM = ROLLBACK ? NEWBASE : R2DEV;
const TO = ROLLBACK ? R2DEV : NEWBASE;

async function fetchTargets(table) {
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select('id, image_url').range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    for (const r of data) if ((r.image_url || '').includes(FROM)) rows.push(r);
    if (data.length < PAGE) break;
  }
  return rows;
}

async function migrate(table) {
  const targets = await fetchTargets(table);
  console.log(`\n── ${table} ── FROMを含む行: ${targets.length}件`);
  if (targets.length && DRY) {
    const ex = targets[0];
    console.log(`   例: ${ex.image_url}`);
    console.log(`    → ${ex.image_url.replace(FROM, TO)}`);
  }
  if (DRY) return;
  let done = 0, err = 0;
  for (const r of targets) {
    const next = r.image_url.replace(FROM, TO);
    const { error } = await supabase.from(table).update({ image_url: next }).eq('id', r.id);
    if (error) err++; else done++;
    if ((done + err) % 500 === 0) console.log(`   進捗 ${done + err}/${targets.length}`);
  }
  console.log(`   完了: 置換 ${done} / 失敗 ${err}`);
}

async function main() {
  console.log(`\n🔀 画像URLドメイン切替  ${DRY ? '[DRY-RUN]' : ''}${ROLLBACK ? ' [ROLLBACK]' : ''}`);
  console.log(`   FROM: ${FROM}`);
  console.log(`   TO  : ${TO}`);
  await migrate('shops');
  await migrate('therapists');
  console.log('\n✅ 終了。再実行すると残り（FROMを含む行）だけ処理します。\n');
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
