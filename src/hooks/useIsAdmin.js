import { useCallback, useEffect, useState } from 'react';
import { authHeaders } from '../utils/supabaseRest';

/**
 * ログイン中の人が管理者かどうかを、サーバー（/api/admin-grant-credit の GET）に聞く。
 *
 * 🚩 2026-10-13: 以前は管理画面・マイページのJSに管理者のメールアドレスをそのまま書いて
 *    `ADMIN_EMAILS.includes(user.email)` で比べていた。JSは誰でも読めるので、
 *    サイトを開いた人が運営者の個人アドレスを知ることができた
 *    （オーナー「個人でやっているのがバレる」）。画面には判定の結果しか持たせない。
 *    ⚠️ ここで止めるのは「画面に出すか」だけ。データの保護はRLSとAPI側の検証が担っている。
 *
 * 返り値 status: 'checking'（確認中）| 'yes' | 'no' | 'error'（確認できなかった）
 */
export function useIsAdmin(user) {
  const userId = user?.id || null;
  const [state, setState] = useState({ userId: null, status: 'no' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) {
      setState({ userId: null, status: 'no' });
      return undefined;
    }
    let cancelled = false;
    setState({ userId, status: 'checking' });
    (async () => {
      try {
        const headers = await authHeaders();
        const res = await fetch('/api/admin-grant-credit', { method: 'GET', headers, cache: 'no-store' });
        if (res.status === 401 || res.status === 403) {
          if (!cancelled) setState({ userId, status: 'no' });
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (!cancelled) setState({ userId, status: body?.admin === true ? 'yes' : 'no' });
      } catch {
        if (!cancelled) setState({ userId, status: 'error' });
      }
    })();
    return () => { cancelled = true; };
  }, [userId, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  // 別の人に切り替わった直後は、前の人の結果を使わない
  const status = !userId ? 'no' : state.userId === userId ? state.status : 'checking';
  return { status, retry };
}
