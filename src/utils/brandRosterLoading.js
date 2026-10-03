/** 全ページの成功を確認してから返す。途中の失敗を完全な名簿にしない。 */
export async function fetchBrandRows(base, table, select, shopIds, headers, fetchImpl = fetch) {
  const inList = shopIds.map(id => `"${id}"`).join(',');
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const response = await fetchImpl(
      `${base}/rest/v1/${table}?select=${select}&shop_id=in.(${inList})&order=id.asc`,
      { headers: { ...headers, Range: `${from}-${from + 999}` }, cache: 'no-store' },
    );
    if (!response.ok) throw new Error('Brand data unavailable');
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error('Invalid brand data');
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}
