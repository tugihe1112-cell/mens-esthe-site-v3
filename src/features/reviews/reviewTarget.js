import { RATING_AXES } from './reviewStory.mjs';

export function emptyReviewValues() {
  return {
    shopId: '', therapistId: null, therapistName: '',
    ratings: Object.fromEntries(RATING_AXES.map(({ id }) => [id, 3])),
    ratingNotes: Object.fromEntries(RATING_AXES.map(({ id }) => [id, ''])),
    tags: [], story: { entrance: '', meeting: '', session: '', afterglow: '', exit: '' },
  };
}

export function completeReviewValues(values = {}) {
  const defaults = emptyReviewValues();
  return {
    ...defaults, ...values,
    ratings: { ...defaults.ratings, ...values.ratings },
    ratingNotes: { ...defaults.ratingNotes, ...values.ratingNotes },
    story: { ...defaults.story, ...values.story },
    tags: Array.isArray(values.tags) ? [...values.tags] : [],
  };
}

const text = (value) => typeof value === 'string' ? value : '';
export function reviewTargetSignature(values = {}) {
  return JSON.stringify([text(values.shopId), text(values.therapistId), text(values.therapistName).trim()]);
}

// A fixed field order makes an untouched restored draft equal to its last successful save.
export function reviewFormSignature(input = {}) {
  const values = completeReviewValues(input);
  return JSON.stringify([
    values.shopId, values.therapistId || null, values.therapistName,
    RATING_AXES.map(({ id }) => values.ratings[id]),
    RATING_AXES.map(({ id }) => values.ratingNotes[id]), values.tags,
    ['entrance', 'meeting', 'session', 'afterglow', 'exit'].map((id) => values.story[id]),
  ]);
}

export function sameReviewDestination(left = {}, right = {}) {
  if (text(left.shopId) !== text(right.shopId)) return false;
  const leftId = text(left.therapistId), rightId = text(right.therapistId);
  if (leftId || rightId) return leftId === rightId;
  return text(left.therapistName).trim() === text(right.therapistName).trim();
}

export function planReviewInitialization(requestedTarget, draft) {
  if (!draft?.data) return { action: 'fresh' };
  const hasRequestedTarget = Boolean(requestedTarget?.shopId || requestedTarget?.therapistId);
  const conflict = hasRequestedTarget && !sameReviewDestination(requestedTarget, draft.data);
  if (draft.pendingPublish && !conflict) return { action: 'resume', draft };
  return { action: 'choose', draft, conflict };
}

export function reviewTargetMatches(values, canonical) {
  if (!canonical?.shopId || values.shopId !== canonical.shopId) return false;
  if ((values.therapistId || null) !== (canonical.therapistId || null)) return false;
  return !values.therapistId || text(values.therapistName).trim() === canonical.therapistName;
}

// Read the actual parent/child relationship before applying a URL or publishing a draft.
// Never infer a person's name from another saved draft or move its text to a new ID.
export async function resolveReviewTarget(values, client) {
  const signature = reviewTargetSignature(values);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    if (!values.shopId) return { ok: false, kind: 'mismatch', signature };
    const shopResult = await client.from('shops').select('id').eq('id', values.shopId).abortSignal(controller.signal).maybeSingle();
    if (shopResult.error) return { ok: false, kind: 'unavailable', signature };
    if (shopResult.data?.id !== values.shopId) return { ok: false, kind: 'mismatch', signature };
    if (!values.therapistId) {
      return { ok: true, signature, target: { shopId: values.shopId, therapistId: null, therapistName: text(values.therapistName).trim() } };
    }
    const result = await client.from('therapists').select('id,name,shop_id').eq('id', values.therapistId).abortSignal(controller.signal).maybeSingle();
    if (result.error) return { ok: false, kind: 'unavailable', signature };
    const row = result.data;
    if (!row || row.id !== values.therapistId || row.shop_id !== values.shopId || !text(row.name).trim()) {
      return { ok: false, kind: 'mismatch', signature };
    }
    return { ok: true, signature, target: { shopId: row.shop_id, therapistId: row.id, therapistName: row.name.trim() } };
  } catch {
    return { ok: false, kind: 'unavailable', signature };
  } finally {
    clearTimeout(timer);
  }
}
