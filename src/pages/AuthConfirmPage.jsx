import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '../compat/router';
import { supabase } from '../lib/supabase';
import SeoHead from '../components/SeoHead.jsx';

const SITE_URL = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';

function safeNextPath(value, actionType) {
  const fallback = actionType === 'recovery' ? '/reset-password' : '/';
  if (!value) return fallback;
  try {
    const parsed = new URL(value, SITE_URL);
    const site = new URL(SITE_URL);
    if (parsed.origin !== site.origin) return fallback;
    const next = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return next.startsWith('/') && !next.startsWith('//') && !/[\r\n]/.test(next)
      ? next
      : fallback;
  } catch {
    return fallback;
  }
}

export default function AuthConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('confirming'); // confirming | success | error
  const queryString = searchParams.toString();

  useEffect(() => {
    const params = new URLSearchParams(queryString);
    const token_hash = params.get('token_hash');
    const type = params.get('type');
    const next = safeNextPath(params.get('next'), type);
    let active = true;
    let redirectTimer;

    if (!token_hash || !type) {
      setStatus('error');
      return;
    }

    supabase.auth.verifyOtp({ token_hash, type })
      .then(({ error }) => {
        if (!active) return;
        if (error) {
          console.error('Confirm error:', error);
          setStatus('error');
        } else {
          setStatus('success');
          redirectTimer = window.setTimeout(() => navigate(next), 2000);
        }
      });
    return () => {
      active = false;
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [navigate, queryString]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <SeoHead title="メール確認" noindex />
      <div className="text-center">
        {status === 'confirming' && (
          <>
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <p className="text-white font-bold text-lg">確認中...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <p className="text-white font-bold text-xl mb-2">メール確認完了！</p>
            <p className="text-slate-400 text-sm">続きの画面へ移動します...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <p className="text-white font-bold text-xl mb-2">リンクが無効です</p>
            <p className="text-slate-400 text-sm mb-6">リンクの有効期限が切れているか、すでに使用済みです。</p>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3 bg-pink-600 text-white rounded-xl font-bold"
            >
              もう一度登録する
            </button>
          </>
        )}
      </div>
    </div>
  );
}
