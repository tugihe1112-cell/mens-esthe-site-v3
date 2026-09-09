import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authHeaders } from '../utils/supabaseRest';

/**
 * 閲覧権（user_credits）の状態を1回だけ読む。
 *
 * 戻り値の status:
 *   'anonymous' … 未ログイン
 *   'loading'   … 取得中（まだ出し分けない）
 *   'active'    … 閲覧権あり（残日数 > 0）
 *   'expired'   … ログイン済みだが閲覧権なし・期限切れ
 *
 * ⚠️ 取得に失敗したときは 'expired' ではなく 'loading' のまま据え置く。
 *    通信失敗を「期限切れ」と言い切ると、権利がある人に
 *    「期限を延長しませんか」と出してしまう（DESIGN.md U04の状態表）。
 * ⚠️ user_credits_read_own は TO authenticated なので anon キー固定で送らない
 *    （2026-08-12 にこれでW2Rが全滅している）。authHeaders を使う。
 */
export function useViewingCredits() {
  const { user, userPlan } = useAuth();
  const [status, setStatus] = useState('anonymous');
  const [days, setDays] = useState(0);

  useEffect(() => {
    if (!user) { setStatus('anonymous'); setDays(0); return; }
    if (userPlan === 'premium' || userPlan === 'vip') { setStatus('active'); setDays(0); return; }
    let cancelled = false;
    setStatus('loading');
    (async () => {
      try {
        const url = process.env.VITE_SUPABASE_URL;
        const res = await fetch(
          `${url}/rest/v1/user_credits?user_id=eq.${user.id}&select=credits_days,expires_at`,
          { headers: await authHeaders() }
        );
        if (!res.ok) return; // loading のまま据え置く
        const data = await res.json();
        if (cancelled || !Array.isArray(data)) return;
        if (data.length === 0) { setStatus('expired'); setDays(0); return; }
        const { credits_days: creditsDays, expires_at: expiresAt } = data[0];
        const expired = expiresAt && new Date(expiresAt) < new Date();
        const remaining = expired ? 0 : (Number(creditsDays) || 0);
        setDays(remaining);
        setStatus(remaining > 0 ? 'active' : 'expired');
      } catch {
        /* 通信失敗は loading のまま。期限切れ扱いにしない。 */
      }
    })();
    return () => { cancelled = true; };
  }, [user, userPlan]);

  return { status, days };
}
