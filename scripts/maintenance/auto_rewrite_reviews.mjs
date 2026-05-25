/**
 * men-esthe_import の口コミを Claude API で自動書き直し
 *
 * 実行前: npm install @anthropic-ai/sdk
 * 実行:   node scripts/maintenance/auto_rewrite_reviews.mjs [--dry-run] [--shop-id tokyo_shibuya_silk]
 *
 * フロー:
 *   1. reviews テーブルから user_id='menesthe_import' のレコードを取得
 *   2. Claude Haiku API で v2品質基準に書き直し
 *   3. content / detailed_ratings / rating / tags を更新
 *   4. user_id を 'menesthe_rewritten' に変更（再処理を防ぐ）
 */

import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const shopIdFilter = (() => {
  const idx = process.argv.indexOf('--shop-id');
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const anthropic = new Anthropic({ apiKey: getEnv('ANTHROPIC_API_KEY') });

if (isDryRun) console.log('=== DRY RUN ===\n');

// ============================================================
// 対象レコード取得
// ============================================================
let query = supabase
  .from('reviews')
  .select('*')
  .eq('user_id', 'menesthe_import');

if (shopIdFilter) {
  query = query.eq('shop_id', shopIdFilter);
  console.log(`🏢 shop_id フィルタ: ${shopIdFilter}\n`);
}

const { data: reviews, error: fetchErr } = await query;
if (fetchErr) { console.error('取得失敗:', fetchErr.message); process.exit(1); }
if (!reviews || reviews.length === 0) { console.log('対象レコードなし'); process.exit(0); }

console.log(`📋 対象: ${reviews.length}件\n`);

// ============================================================
// Claude API プロンプト
// ============================================================
const buildPrompt = (review) => `
以下のメンズエステ口コミを、サイト掲載用に全面的に書き直してください。

【元の口コミ】
セラピスト名: ${review.therapist_name}
内容:
${review.content}

【書き直し要件】
1. 構成は必ず【入店】【ご対面】【施術】【総評】の4セクション（各セクション3〜6文程度）
2. 元の事実（価格帯・総合評価・施術内容の良し悪し・密着度・マッサージ技術）は保持する
3. 訪問のきっかけ・場所・具体的エピソードは全て別の設定に変更する
4. 元文の語彙・フレーズを一切再利用しない。全く独自の表現で書く
5. 特定しやすいディテール（駅名・具体的な金額の端数・固有の会話内容）は変更または除去
6. 自然な口語体で、実際に体験した30代男性が書いたような文体にする
7. 【最重要】訪問のきっかけは元の「流れ」や「パターン」ごと変える。例：元が「友人との飲みの流れで」なら、「出張の合間に」「休日に一人で」「ネットで見つけて計画的に予約」など全く別の動機にすること。言葉だけ変えて同じ構造を残すのは禁止

【回答形式】JSONのみを返してください（コードブロック不要）:
{
  "content": "書き直した口コミ本文（セクション間は改行2つ）",
  "detailed_ratings": {
    "cleanliness": 1〜5の整数,
    "looks": 1〜5の整数,
    "style": 1〜5の整数,
    "service": 1〜5の整数,
    "massage": 1〜5の整数,
    "intimacy": 1〜5の整数
  },
  "rating": 1.0〜5.0の小数（detailed_ratingsの平均に近い値）,
  "tags": ["タグ1", "タグ2"]
}

tagsは以下の20個のみ使用可能。口コミの内容から2〜5個選ぶ。リスト外の文字列は一切使用禁止:
["スレンダー","グラマー","巨乳","美脚","小柄","高身長","可愛い系","美人系","清楚系","ギャル系","お姉さん系","10代","20代前半","20代後半","30代","40代","色白","健康的","ベテラン","外国人"]
`.trim();

// ============================================================
// 許可タグ一覧（UIの選択肢と完全一致）
// ============================================================
const ALLOWED_TAGS = new Set([
  'スレンダー','グラマー','巨乳','美脚','小柄','高身長',
  '可愛い系','美人系','清楚系','ギャル系','お姉さん系',
  '10代','20代前半','20代後半','30代','40代',
  '色白','健康的','ベテラン','外国人',
]);

// ============================================================
// 1件書き直し
// ============================================================
async function rewriteReview(review, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: buildPrompt(review) }],
      });

      const raw = msg.content[0].text.trim();
      // コードブロックがあれば除去
      const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(json);
      // タグをバリデーション（許可リスト外を除去）
      const invalidTags = (parsed.tags || []).filter(t => !ALLOWED_TAGS.has(t));
      if (invalidTags.length > 0) {
        console.log(`  ⚠️  無効タグ除去: ${invalidTags.join(', ')}`);
      }
      parsed.tags = (parsed.tags || []).filter(t => ALLOWED_TAGS.has(t));
      return parsed;
    } catch (e) {
      if (attempt < retries) {
        console.log(`  ⚠️  リトライ ${attempt + 1}/${retries}: ${e.message}`);
        await new Promise(r => setTimeout(r, 2000));
      } else {
        throw e;
      }
    }
  }
}

// ============================================================
// メイン処理
// ============================================================
let success = 0, fail = 0;

for (const review of reviews) {
  console.log(`🔄 ${review.therapist_name} (${review.id})`);

  let result;
  try {
    result = await rewriteReview(review);
  } catch (e) {
    console.error(`  ❌ API失敗: ${e.message}`);
    fail++;
    continue;
  }

  if (isDryRun) {
    console.log('  content preview:', result.content.slice(0, 80) + '...');
    console.log('  ratings:', result.detailed_ratings);
    console.log('  rating:', result.rating, '  tags:', result.tags);
    success++;
    continue;
  }

  const { error: updateErr } = await supabase
    .from('reviews')
    .update({
      content: result.content,
      detailed_ratings: result.detailed_ratings,
      rating: result.rating,
      tags: result.tags,
      user_id: 'menesthe_rewritten', // 書き直し済みフラグ
    })
    .eq('id', review.id);

  if (updateErr) {
    console.error(`  ❌ DB更新失敗: ${updateErr.message}`);
    fail++;
  } else {
    console.log(`  ✅ 更新完了`);
    success++;
  }

  // レート制限対策（1件ごとに1秒待機）
  await new Promise(r => setTimeout(r, 1000));
}

console.log(`\n完了: 成功${success}件 / 失敗${fail}件`);
