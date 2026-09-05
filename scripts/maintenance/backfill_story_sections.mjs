/**
 * 旧形式の口コミ（【入店】【ご対面】【施術】【総評】）を story_sections に分解する
 *
 * 【背景（2026-09-04）】
 *   2026-08-22 に story_sections（区分別本文）を導入したが、それ以前に投入した口コミは
 *   content 一本のままで story_sections が NULL。公開ページでは見出しなしの一続きで表示され、
 *   新しい口コミ（区分見出し付き）と並ぶと構造の差が見える。
 *
 * 【対象】
 *   `【入店】…\n\n【ご対面】…\n\n【施術】…\n\n【総評】…` の形をした9件のみ。
 *   ⚠️ 段落区切りが無い口コミ（ルサンチマン文体5件）と、実ユーザーの投稿1件は**対象外**。
 *      前者は機械では分割できず、後者は他人の文章なので構造を勝手に変えない。
 *
 * 【重要】content も同時に書き換える
 *   DBの CHECK 制約が `compose_review_story_content(story_sections) = content` を強制するため、
 *   区分に分けたあとの content は必ず compose() の結果で上書きする。
 *   その際 **`【入店】` 等の見出し文字列は削除する**（表示側が区分見出しを出すので二重になるため）。
 *   ＝ 本文の文字数はわずかに減るが、閲覧権はすでに付与済みなので影響しない。
 *
 * 使い方: node scripts/maintenance/backfill_story_sections.mjs [--live]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import {
  composeReviewStoryContent,
  normalizeReviewStory,
  countReviewStoryChars,
} from '../../src/features/reviews/reviewStory.mjs';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const LIVE = process.argv.includes('--live');

// 旧見出し → 新しい区分キー
const HEADING_MAP = {
  '入店': 'entrance',
  'ご対面': 'meeting',
  '施術': 'session',
  '総評': 'exit',
};

/**
 * `【入店】\n本文\n\n【ご対面】\n本文…` を区分オブジェクトに分解する。
 * 見出し行は落とす（表示側が区分名を出すため）。
 * 分解できない形なら null を返す＝触らない。
 */
function parseLegacyContent(content) {
  const blocks = content.split('\n\n').map(b => b.trim()).filter(Boolean);
  if (blocks.length !== 4) return null;

  const out = {};
  for (const block of blocks) {
    const m = block.match(/^【([^】]+)】\s*\n?([\s\S]*)$/);
    if (!m) return null;                    // 見出しが無いブロックがあれば中止
    const key = HEADING_MAP[m[1].trim()];
    if (!key) return null;                  // 想定外の見出しなら中止
    const body = m[2].trim();
    if (!body) return null;                 // 本文が空なら中止
    if (out[key]) return null;              // 同じ見出しが2回出たら中止
    out[key] = body;
  }
  // 4区分すべて揃っていること
  if (Object.keys(out).length !== 4) return null;
  return out;
}

async function main() {
  console.log(`\n=== 旧口コミの区分分解 ${LIVE ? '(本実行)' : '(DRY-RUN)'} ===\n`);

  const { data: rows, error } = await supabase
    .from('reviews')
    .select('id, therapist_name, content, story_sections')
    .is('story_sections', null);
  if (error) throw new Error(error.message);

  console.log(`story_sections が未設定: ${rows.length}件\n`);

  let ok = 0, skip = 0, fail = 0;
  for (const r of rows) {
    const sections = parseLegacyContent(r.content || '');
    if (!sections) {
      console.log(`  ⏭ ${r.therapist_name} … 旧見出し形式ではないので触らない`);
      skip++;
      continue;
    }

    const normalized = normalizeReviewStory(sections);
    const newContent = composeReviewStoryContent(normalized);

    // ⚠️ 自己検算：DBのCHECK制約と同じ条件を手元で確認してから送る
    if (composeReviewStoryContent(normalized) !== newContent) {
      console.log(`  ❌ ${r.therapist_name} … 検算不一致。スキップ`);
      fail++;
      continue;
    }

    const before = r.content.length;
    const after = newContent.length;
    console.log(`  ✅ ${r.therapist_name.padEnd(7)} ${before}字 → ${after}字 (見出し-${before - after})  区分: ` +
      Object.entries(normalized).map(([k, v]) => `${k}:${v.length}`).join(' / '));

    if (LIVE) {
      // content と story_sections は**同時に**更新する（片方だけだとCHECK制約で弾かれる）
      const { error: upErr } = await supabase.from('reviews')
        .update({ content: newContent, story_sections: normalized })
        .eq('id', r.id);
      if (upErr) { console.log(`     ❌ 更新失敗: ${upErr.message}`); fail++; continue; }
    }
    ok++;
  }

  console.log(`\n=== ${LIVE ? '完了' : 'DRY-RUN'}: 変換${ok} / 対象外${skip} / 失敗${fail} ===`);
  if (!LIVE) console.log('※ 実行するには --live を付けてください。\n');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
