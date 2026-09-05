/**
 * 段落区切りが無い旧口コミ（ルサンチマン文体・5件）を story_sections に分解する
 *
 * 【前提】
 *   backfill_story_sections.mjs は `【入店】` 等の見出しがある9件を機械的に処理した。
 *   残る5件は見出しが無く、`\n` で段落が分かれているだけなので機械では判定できない。
 *   → **どの段落がどの区分か**を人間が読んで決め、下の SPLITS に段落番号で指定する。
 *
 * 【本文は1文字も変えない】
 *   やることは「段落の境目のうち、区分の切れ目にあたる箇所だけ `\n` を `\n\n` にする」だけ。
 *   実行前に**改行を除いた文字列が完全一致するか**を検算し、1文字でも変化したら中止する。
 *
 * 使い方: node scripts/maintenance/backfill_story_sections_manual.mjs [--live]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { composeReviewStoryContent, normalizeReviewStory } from '../../src/features/reviews/reviewStory.mjs';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const LIVE = process.argv.includes('--live');

// 段落番号（1始まり）→ 区分。本文を読んで判断した割り当て。
const SPLITS = {
  // [1]訪問録・コース確保 [2]童顔と声と体型 [3]ウェルカムティーとカウンセリング
  // [4]ストレッチから施術開始 [5]仰向け・デコルテ [6]際どいゾーンと総括
  owner_yurikago_seiryu_1: { entrance: [1], meeting: [2, 3], session: [4, 5], exit: [6] },

  // [1]初突撃・コース [2]オートロックと出迎え・長身 [3]お茶と支払いとシャワー
  // [4]昼間もサロン勤務という施術スタイル [5]施術の構成 [6]際どいラインと総括
  owner_yurikago_marina_1: { entrance: [1], meeting: [2, 3], session: [4, 5], exit: [6] },

  // [1]対戦記録・コース・レスポンス [2]笑顔とプロポーション [3]ウェルカムドリンクと世間話
  // [4]ローテーション [5]うつ伏せとミラー [6]オイル [7]デコルテ [8]マーメイドと総括
  owner_yurikago_ayaka_1: { entrance: [1], meeting: [2, 3], session: [4, 5, 6, 7], exit: [8] },

  // [1]広島遠征 [2]綺麗な熟女 [3]料金の安さ [4]パウダーのオプション
  // [5]施術の流れ [6]まとめ
  // ⚠️ [3]料金の話は entrance に近い内容だが、位置が [2] の後なので順序を保てない。
  //    施術の条件説明として session に含めた。
  owner_hitozuma_aoyama_1: { entrance: [1], meeting: [2], session: [3, 4, 5], exit: [6] },

  // [1]広島遠征・予約 [2]マンション到着・入室 [3]明るい部屋で容姿を確認
  // [4]施術開始・パウダー [5]仰向けと線引き [6]次回への言及
  owner_hitozuma_otani_1: { entrance: [1, 2], meeting: [3], session: [4, 5], exit: [6] },
};

const stripNewlines = (s) => s.replace(/\n/g, '');

async function main() {
  console.log(`\n=== 段落なし旧口コミの区分分解 ${LIVE ? '(本実行)' : '(DRY-RUN)'} ===\n`);

  let ok = 0, fail = 0;
  for (const [id, split] of Object.entries(SPLITS)) {
    const { data: r, error } = await supabase
      .from('reviews').select('id, therapist_name, content, story_sections').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!r) { console.log(`  ❌ ${id} … 見つからない`); fail++; continue; }
    if (r.story_sections) { console.log(`  ⏭ ${r.therapist_name} … すでに区分あり`); continue; }

    const paras = r.content.split('\n').map(p => p.trim()).filter(Boolean);

    // 指定された段落番号がすべて実在し、かつ全段落を漏れなく使っているか
    const used = Object.values(split).flat().sort((a, b) => a - b);
    const expected = Array.from({ length: paras.length }, (_, i) => i + 1);
    if (JSON.stringify(used) !== JSON.stringify(expected)) {
      console.log(`  ❌ ${r.therapist_name} … 段落の指定が実際と合わない（実際${paras.length}段落 / 指定[${used}]）`);
      fail++;
      continue;
    }

    const sections = {};
    for (const [key, nums] of Object.entries(split)) {
      sections[key] = nums.map(n => paras[n - 1]).join('\n');
    }

    const normalized = normalizeReviewStory(sections);
    const newContent = composeReviewStoryContent(normalized);

    // ⚠️ 本文が変わっていないことの検算：改行を除けば元と完全一致するはず
    if (stripNewlines(newContent) !== stripNewlines(r.content)) {
      console.log(`  ❌ ${r.therapist_name} … 本文が変化している。中止`);
      fail++;
      continue;
    }

    console.log(`  ✅ ${r.therapist_name.padEnd(6)} ${paras.length}段落 → ` +
      Object.entries(normalized).map(([k, v]) => `${k}:${v.length}`).join(' / '));

    if (LIVE) {
      const { error: upErr } = await supabase.from('reviews')
        .update({ content: newContent, story_sections: normalized }).eq('id', id);
      if (upErr) { console.log(`     ❌ 更新失敗: ${upErr.message}`); fail++; continue; }
    }
    ok++;
  }

  console.log(`\n=== ${LIVE ? '完了' : 'DRY-RUN'}: 変換${ok} / 失敗${fail} ===`);
  if (!LIVE) console.log('※ 実行するには --live を付けてください。\n');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
