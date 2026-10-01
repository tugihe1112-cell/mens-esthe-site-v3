import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { loadPublicRankingData } from '../utils/loadPublicRankingData.js';

const EMPTY_DATA = { reviews: [], shops: [], therapists: [] };
let cachedData = null;
let cachedAt = 0;
let pending = null;

function requestData(force = false) {
  if (pending) return pending;
  if (!force && cachedData && Date.now() - cachedAt < 60000) return Promise.resolve(cachedData);
  pending = loadPublicRankingData(supabase).then(data => {
    cachedData = data;
    cachedAt = Date.now();
    return data;
  }).finally(() => { pending = null; });
  return pending;
}

export function usePublicRankingData() {
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    requestData(attempt > 0).then(result => {
      if (active) setData(result);
    }).catch(error => {
      console.error('[ranking] public ratings fetch failed:', error);
      if (active) setError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [attempt]);

  return { data, loading, error, retry };
}
