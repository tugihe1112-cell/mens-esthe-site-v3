import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 会員とプランを同時に切り替える。旧プランが次の会員に見える1描画も作らない。
  const [auth, setAuth] = useState({ user: null, userPlan: 'free', planStatus: 'anonymous', loading: true });
  const mountedRef = useRef(false);
  const userRef = useRef(null);
  const sessionGenerationRef = useRef(0);
  const profileGenerationRef = useRef(0);
  const signInGenerationRef = useRef(0);
  const profileTimersRef = useRef(new Set());

  const isCurrentProfile = useCallback((request) => mountedRef.current
    && request.generation === profileGenerationRef.current
    && request.userId === userRef.current?.id, []);

  const fetchProfile = useCallback(async (request) => {
    if (!isCurrentProfile(request)) return;
    try {
      const { data, error } = await supabase.from('profiles').select('plan').eq('id', request.userId).single();
      if (error) throw error;
      const plan = data?.plan || 'free';
      if (!data || !['free', 'premium', 'vip'].includes(plan)) throw new Error('Profile plan unavailable');
      if (!isCurrentProfile(request)) return;
      setAuth((current) => isCurrentProfile(request) ? { ...current, userPlan: plan, planStatus: 'ready' } : current);
    } catch (error) {
      if (!isCurrentProfile(request)) return;
      console.error('プロフィール取得エラー:', error);
      setAuth((current) => isCurrentProfile(request) ? { ...current, userPlan: null, planStatus: 'error' } : current);
    }
  }, [isCurrentProfile]);

  // 初回セッション・認証イベント・ログイン成功・再試行はすべて同じ世代管理を通す。
  const applyUser = useCallback((nextUser, deferProfile = false) => {
    if (!mountedRef.current) return;
    userRef.current = nextUser;
    sessionGenerationRef.current += 1;
    const request = { userId: nextUser?.id || '', generation: ++profileGenerationRef.current };
    setAuth({ user: nextUser, userPlan: nextUser ? null : 'free', planStatus: nextUser ? 'loading' : 'anonymous', loading: false });
    if (!nextUser) return;
    if (deferProfile) {
      // onAuthStateChangeのコールバック内でSupabaseの非同期APIを呼ばない。
      const timer = setTimeout(() => {
        profileTimersRef.current.delete(timer);
        void fetchProfile(request);
      }, 0);
      profileTimersRef.current.add(timer);
    } else {
      void fetchProfile(request);
    }
  }, [fetchProfile]);

  useEffect(() => {
    mountedRef.current = true;
    const sessionGeneration = sessionGenerationRef.current;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null, true);
    });
    // 認証イベントの後に古いgetSessionが到着しても、現在の会員へ戻さない。
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mountedRef.current || sessionGeneration !== sessionGenerationRef.current) return;
      if (error) throw error;
      applyUser(data?.session?.user ?? null);
    }).catch((error) => {
      if (!mountedRef.current || sessionGeneration !== sessionGenerationRef.current) return;
      console.error('セッション取得エラー:', error);
      setAuth((current) => ({ ...current, loading: false }));
    });
    const profileTimers = profileTimersRef.current;
    return () => {
      mountedRef.current = false;
      sessionGenerationRef.current += 1;
      profileGenerationRef.current += 1;
      signInGenerationRef.current += 1;
      profileTimers.forEach(clearTimeout);
      profileTimers.clear();
      subscription.unsubscribe();
    };
  }, [applyUser]);

  const retryPlan = useCallback(() => {
    if (userRef.current) applyUser(userRef.current);
  }, [applyUser]);
  const signUp = (email, password) => supabase.auth.signUp({ email, password });
  const signIn = async (email, password) => {
    const signInGeneration = ++signInGenerationRef.current;
    const sessionGeneration = sessionGenerationRef.current;
    const result = await supabase.auth.signInWithPassword({ email, password });
    // 成功セッションは即時反映する。別会員のイベント・ログアウト・新しいログインは優先する。
    if (!result.error && result.data?.user && mountedRef.current
      && signInGeneration === signInGenerationRef.current
      && (sessionGeneration === sessionGenerationRef.current || userRef.current?.id === result.data.user.id)) {
      applyUser(result.data.user);
    }
    // プラン問い合わせの完了でログイン後の画面復帰を待たせない。
    return result;
  };
  const signOut = async () => {
    signInGenerationRef.current += 1;
    applyUser(null);
    return supabase.auth.signOut();
  };

  return (
    // SSRでも公開状態の子要素を描画し、本文とJSON-LDを初期HTMLへ保持する。
    <AuthContext.Provider value={{ ...auth, signUp, signIn, signOut, retryPlan }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
