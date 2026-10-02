import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authHeaders } from '../utils/supabaseRest';
import { fetchPostedReviewCount } from '../utils/postedReviewCount.js';

export function usePostedReviewCount() {
  const { user, loading } = useAuth();
  const userId = user?.id || '';
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const retry = useCallback(() => setAttempt(n => n + 1), []);
  const requestKey = useMemo(() => ({ userId, user, attempt, loading }), [userId, user, attempt, loading]);
  useEffect(() => {
    if (!userId || loading) return;
    let active = true;
    (async () => {
      try {
        const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${encodeURIComponent(userId)}&select=total_reviews_posted`;
        const count = await fetchPostedReviewCount(url, await authHeaders());
        if (active) setResult({ requestKey, status: 'ready', count });
      } catch {
        if (active) setResult({ requestKey, status: 'error' });
      }
    })();
    return () => { active = false; };
  }, [userId, loading, requestKey]);
  if (!userId || loading || result?.requestKey !== requestKey) return { status: 'loading', retry };
  return { ...result, retry };
}
