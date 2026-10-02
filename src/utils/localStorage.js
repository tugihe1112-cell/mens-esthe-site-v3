/** 端末の保存拒否・容量不足・破損を画面の例外にしない。保存は読み戻しまで確認する。 */
export function readStoredJson(key, fallback, storage) {
  try {
    const raw = (storage || globalThis.localStorage).getItem(key);
    return { ok: true, found: raw !== null, value: raw === null ? fallback : JSON.parse(raw) };
  } catch {
    return { ok: false, found: false, value: fallback };
  }
}

export function writeStoredJson(key, value, storage) {
  try {
    const target = storage || globalThis.localStorage;
    const raw = JSON.stringify(value);
    target.setItem(key, raw);
    return { ok: target.getItem(key) === raw };
  } catch { return { ok: false }; }
}

export function removeStoredValue(key, storage) {
  try {
    const target = storage || globalThis.localStorage;
    target.removeItem(key);
    return { ok: target.getItem(key) === null };
  } catch { return { ok: false }; }
}

export function loadFavoriteIds(key, legacyKey, userId, storage) {
  const scoped = readStoredJson(key, [], storage);
  if (!scoped.ok || !Array.isArray(scoped.value)) return { ok: false, value: [] };
  if (scoped.found) return { ok: true, value: [...new Set(scoped.value.map(String))] };
  // 店舗・人物で同じ所有者を先に確定する。一方だけの移行失敗で別会員へ渡さない。
  const ownerKey = 'mens_esthe_favorites:migration_owner';
  const owner = readStoredJson(ownerKey, null, storage);
  if (!owner.ok) return { ok: false, value: [] };
  if (owner.value && owner.value !== userId) return { ok: true, value: [] };
  const legacy = readStoredJson(legacyKey, [], storage);
  if (!legacy.ok || !Array.isArray(legacy.value)) return { ok: false, value: [] };
  if (!legacy.found) return { ok: true, value: [] };
  const value = [...new Set(legacy.value.map(String))];
  // 削除拒否でも、旧データを次の会員へ渡さない。移行先を記録してから移す。
  if (!writeStoredJson(ownerKey, userId, storage).ok
    || !writeStoredJson(key, value, storage).ok) return { ok: false, value: [] };
  removeStoredValue(legacyKey, storage);
  return { ok: true, value };
}

export function toggleStoredId(key, previous, id, storage) {
  const normalized = String(id);
  const value = previous.includes(normalized) ? previous.filter(item => item !== normalized) : [...previous, normalized];
  return { ...writeStoredJson(key, value, storage), value };
}
