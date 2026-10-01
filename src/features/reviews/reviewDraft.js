export const DRAFT_KEY = 'reviewDraft';
export const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000;

// Storageへの書き込みだけでなく、保存値の読み戻しまで成功した場合だけ成功を返す。
// 失敗してもフォームの入力や既存の下書きは消さない。
export function saveReviewDraft(data, step = 1, pendingPublish = false, storage) {
  try {
    const target = storage || window.localStorage;
    const savedAt = Date.now();
    const serialized = JSON.stringify({ savedAt, step, pendingPublish, data });
    target.setItem(DRAFT_KEY, serialized);
    if (target.getItem(DRAFT_KEY) !== serialized) return { success: false };
    return { success: true, savedAt };
  } catch {
    return { success: false };
  }
}
