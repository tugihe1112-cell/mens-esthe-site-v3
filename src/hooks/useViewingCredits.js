import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authHeaders } from '../utils/supabaseRest';
import { fetchViewingCredits } from '../utils/viewingCredits.js';

/** anonymous / loading / error / expired / active。通信失敗を期限切れへ変換しない。 */
export function useViewingCredits() {
  const { user, userPlan, loading: authLoading } = useAuth();
  const userId = user?.id || '';
  const isPremium = userPlan === 'premium' || userPlan === 'vip';
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const requestKey = useMemo(() => ({ user, userId, userPlan, authLoading, attempt }), [user, userId, userPlan, authLoading, attempt]);

  useEffect(() => {
    if (authLoading || !userId || isPremium) return;
    let cancelled = false;
    let expiryTimer;
    (async () => {
      try {
        const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${encodeURIComponent(userId)}&select=credits_days,expires_at`;
        const credits = await fetchViewingCredits(url, await authHeaders());
        if (cancelled) return;
        setResult({ ...credits, requestKey });
        if (credits.status === 'active' && credits.expiresAt) {
          const delay = Math.max(1, Math.min(Date.parse(credits.expiresAt) - Date.now(), 2147483647));
          expiryTimer = setTimeout(retry, delay);
        }
      } catch {
        if (!cancelled) setResult({ status: 'error', days: 0, requestKey });
      }
    })();
    return () => { cancelled = true; clearTimeout(expiryTimer); };
  }, [authLoading, userId, isPremium, requestKey, retry]);

  // ユーザー切替・再試行直後にも前回の権利や期限切れを表示しない。
  if (authLoading) return { status: 'loading', days: 0, retry };
  if (!userId) return { status: 'anonymous', days: 0, retry };
  if (isPremium) return { status: 'active', days: 0, retry };
  if (result?.requestKey !== requestKey) return { status: 'loading', days: 0, retry };
  return { status: result.status, days: result.days, retry };
}
