import assert from 'node:assert/strict';
import fs from 'node:fs';
import { reviewSchema } from '../../src/features/reviews/schema/reviewSchema.js';
import { prepareReviewContent, reviewAuthorName, reviewBackupText } from '../../src/features/reviews/reviewSubmission.js';
import { saveReviewDraft, DRAFT_KEY } from '../../src/features/reviews/reviewDraft.js';
import { composeReviewStoryContent } from '../../src/features/reviews/reviewStory.mjs';

const draft = {
  shopId: 'fixture-shop',
  therapistId: 'fixture-therapist',
  therapistName: ' 天音 しおり ',
  ratings: { cleanliness: 3, looks: 4, style: 3, service: 3, massage: 5, intimacy: 3 },
  ratingNotes: { looks: ' 写真と同じ印象でした ', massage: ' 強さを確認してくれた ' },
  tags: ['丁寧', '会話上手'],
  story: { entrance: ` ${'入店本文'.repeat(30)} `, meeting: 'ご対面本文', session: '施術本文', exit: ` ${'総評本文'.repeat(30)} `, afterglow: '公開しない旧欄' },
};

// 確認前の生入力と、実際のhandleSubmit後のZod整形値から生成した公開内容が一致する。
const preview = prepareReviewContent(draft);
const submission = prepareReviewContent(reviewSchema.parse(draft));
assert.deepEqual(preview, submission);
assert.equal(preview.content, composeReviewStoryContent(preview.storySections));
assert.equal(preview.storySections.afterglow, undefined);
assert.equal(preview.storySections.ratings_note, 'ルックス（★4）写真と同じ印象でした\n技術（★5）強さを確認してくれた');
assert.equal(preview.rating, 3.5);
assert.equal(reviewAuthorName({ email: 'private@example.com' }), '名無しさん');
assert.equal(reviewAuthorName({ user_metadata: { display_name: '表示名' } }), '表示名');
const backup = reviewBackupText(draft, '確認店舗');
assert.ok(backup.includes('店舗: 確認店舗'));
assert.ok(backup.includes('セラピスト: 天音 しおり'));
assert.ok(backup.includes('タグ: 丁寧・会話上手'));
for (const text of Object.values(preview.storySections)) assert.ok(backup.includes(text));
assert.ok(!backup.includes('公開しない旧欄'));

const makeStorage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};
const storage = makeStorage();
const saved = saveReviewDraft(draft, 3, false, storage);
assert.equal(saved.success, true);
const restored = JSON.parse(storage.getItem(DRAFT_KEY));
assert.deepEqual(restored.data, draft);
assert.equal(restored.savedAt, saved.savedAt);
assert.equal(restored.step, 3);
assert.equal(restored.pendingPublish, false);
assert.equal(saveReviewDraft(draft, 4, true, storage).success, true);
assert.equal(JSON.parse(storage.getItem(DRAFT_KEY)).pendingPublish, true);

// 容量不足で書き込めないとき、成功を返さず、入力も前回の有効な保存値も壊さない。
const oldDraft = storage.getItem(DRAFT_KEY);
const inputBefore = JSON.stringify(draft);
storage.setItem = () => { throw new DOMException('storage full', 'QuotaExceededError'); };
assert.deepEqual(saveReviewDraft(draft, 3, false, storage), { success: false });
assert.equal(storage.getItem(DRAFT_KEY), oldDraft);
assert.equal(JSON.stringify(draft), inputBefore);
assert.deepEqual(saveReviewDraft(draft, 4, true, { setItem() {}, getItem() { return null; } }), { success: false });
assert.deepEqual(saveReviewDraft(draft, 3, false, { setItem() {}, getItem() { throw new Error('read denied'); } }), { success: false });

// 成功・失敗の分岐と、確認画面が本当に共有の生成処理を使うことも確認する。
const page = fs.readFileSync('src/pages/PostReviewPage.jsx', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const hook = fs.readFileSync('src/features/reviews/hooks/useReviewForm.js', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
assert.match(page, /const preview = prepareReviewContent\(data\)/);
assert.match(hook, /prepareReviewContent\(data\)/);
assert.match(page, /<ReviewStoryContent content=\{preview\.content\} storySections=\{preview\.storySections\}/);
assert.match(page, /if \(result\.success\) toast\.success\('下書きを保存しました/);
assert.match(page, /if \(!persistDraft\(data, TOTAL_STEPS, true\)\.success\)\s*\{[\s\S]*?return;/);
assert.match(page, /draftStatus === 'failed'/);
assert.match(page, /navigator\.clipboard\.writeText\(text\)/);
assert.match(page, /<textarea id="draft-backup"[\s\S]*?readOnly/);

console.log('✅ 投稿確認の公開本文一致・下書き保存失敗・コピー用本文チェック OK');
