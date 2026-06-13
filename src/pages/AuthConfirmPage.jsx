import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '../compat/router';
import { supabase } from '../lib/supabase';

export default function AuthConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('confirming'); // confirming | success | error

  useEffect(() => {
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const next = searchParams.get('next') || '/';

    if (!token_hash || !type) {
      setStatus('error');
      return;
    }

    supabase.auth.verifyOtp({ token_hash, type })
      .then(({ error }) => {
        if (error) {
          console.error('Confirm error:', error);
          setStatus('error');
        } else {
          setStatus('success');
          setTimeout(() => navigate(next), 2000);
        }
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
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
            <p className="text-slate-400 text-sm">ログインページに移動します...</p>
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
