import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userPlan, setUserPlan] = useState('free'); // 👈 新規：プラン状態を保持
  const [loading, setLoading] = useState(true);

  // 💡 Supabaseの profiles テーブルから本物のプランを取得する関数
  const fetchProfile = async (userId) => {
    if (!userId) {
      setUserPlan('free');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      if (data) {
        setUserPlan(data.plan || 'free'); // free, premium, vip のいずれかが入る！
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      setUserPlan('free');
    }
  };

  useEffect(() => {
    // 1. アプリを開いた時に「ログイン済みか？」を確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 2. ログイン・ログアウトの監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      fetchProfile(currentUser?.id); // ログイン状態が変わったらプランも再取得
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = (email, password) => supabase.auth.signUp({ email, password });
  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signOut = async () => {
    setUserPlan('free'); // ログアウト時にプランをリセット
    await supabase.auth.signOut();
  };

  return (
    // SSRではセッションを判定できないため、公開状態(user=null / plan=free)で子要素を描画する。
    // `!loading && children` で止めると全ページの初期HTMLが空になり、/stats の本文や
    // JSON-LDまで検索エンジン・引用元に届かない。認証確定後は通常どおり状態更新する。
    <AuthContext.Provider value={{ user, userPlan, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
