export async function fetchPostedReviewCount(url, headers, fetcher = fetch) {
  const response = await fetcher(url, { headers });
  if (!response.ok) throw new Error('Review count unavailable');
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length > 1) throw new Error('Invalid review count');
  if (!rows.length) return 0;
  const raw = rows[0]?.total_reviews_posted;
  const count = typeof raw === 'number' || typeof raw === 'string' && raw.trim() ? Number(raw) : NaN;
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid review count');
  return count;
}
