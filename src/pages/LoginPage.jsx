// src/pages/LoginPage.jsx (新規作成)
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { mockLogin } = useAppContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (email) {
      mockLogin(email);
      toast.success('ログインしました！');
      navigate('/'); // ホームに戻る
    }
  };

  return (
    <div className="text-white p-4 max-w-md mx-auto mt-10">
      <form onSubmit={handleLogin} className="bg-slate-800 p-6 rounded-lg shadow-lg space-y-4">
        <h2 className="text-2xl font-bold text-pink-400 mb-4">ログイン / 新規登録</h2>
        <p className="text-sm text-gray-400">
          デモ用の簡易ログインです。
          メールアドレスに "premium" を含むとプレミアム会員になれます。
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@premium.com"
            className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full p-3 rounded-lg text-lg font-bold bg-pink-600 text-white hover:bg-pink-700 transition-colors"
        >
          ログイン
        </button>
      </form>
    </div>
  );
}