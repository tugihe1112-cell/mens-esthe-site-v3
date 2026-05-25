/**
 * Sonnetで1件だけ試し書き直し（dry-run）
 */

import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));
const anthropic = new Anthropic({ apiKey: getEnv('ANTHROPIC_API_KEY') });

// アロマミエリーから1件取得
const { data: reviews } = await supabase
  .from('reviews')
  .select('*')
  .eq('shop_id', 'tokyo_shibuya_aroma_miely')
  .eq('user_id', 'menesthe_rewritten')
  .limit(1);

const review = reviews[0];
console.log(`対象: ${review.therapist_name} (${review.id})`);
console.log('\n--- 現在のHaiku版 ---');
console.log(review.content);
console.log('\n' + '='.repeat(60));
console.log('--- Sonnet版（新しく生成） ---\n');

const prompt = `
メンズエステの口コミを書いてください。

セラピスト名: ${review.therapist_name}
評価: ${review.rating}/5点
詳細評価: ${JSON.stringify(review.detailed_ratings)}

【書き方の指示】
- 実際に体験した30代男性が書いたような、生っぽい口語体で書く
- 「インターネットで検索して」「清潔感があり」「丁寧な対応」のような定型句は絶対使わない
- 訪問のきっかけは具体的でリアルなもの（例：「たまたまその日暇で」「前から気になってた」「仕事で使ったホテルの近くだった」等）
- 多少文章が荒削りでも構わない。むしろそのほうがリアル
- 評価点数に合った内容にする（低評価なら不満もちゃんと書く）
- 構成: 【入店】【ご対面】【施術】【総評】の4セクション（各3〜5文）
- セクション間は改行2つ

JSONで返す（コードブロック不要）:
{
  "content": "口コミ本文",
  "tags": ["タグ"]
}

tagsは以下20個のみ:
["スレンダー","グラマー","巨乳","美脚","小柄","高身長","可愛い系","美人系","清楚系","ギャル系","お姉さん系","10代","20代前半","20代後半","30代","40代","色白","健康的","ベテラン","外国人"]
`.trim();

const msg = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 2000,
  messages: [{ role: 'user', content: prompt }],
});

const raw = msg.content[0].text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
const result = JSON.parse(raw);
console.log(result.content);
console.log('\nタグ:', result.tags);
