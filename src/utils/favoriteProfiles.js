export function resolveFavoriteTargets(keys, shopById) {
  const shopIds = Object.keys(shopById || {}).sort((a, b) => b.length - a.length);
  return keys.map(uniqueKey => {
    const shopId = shopIds.find(id => uniqueKey.startsWith(`${id}_`));
    const therapistId = shopId ? uniqueKey.slice(shopId.length + 1) : '';
    return { uniqueKey, shopId: shopId || null, therapistId: therapistId || null };
  });
}

export async function fetchFavoriteProfiles(client, targets) {
  const ids = [...new Set(targets.map(t => t.therapistId).filter(Boolean))];
  const profiles = {};
  for (let start = 0; start < ids.length; start += 100) {
    const { data, error } = await client.from('therapists').select('*').in('id', ids.slice(start, start + 100));
    if (error || !Array.isArray(data)) throw new Error('Favorite profiles unavailable');
    for (const row of data) profiles[row.id] = row;
  }
  return profiles;
}
