import React, { useEffect, useState } from 'react';
import { useNavigate } from '../compat/router';
import { AlertCircle, CheckCircle2, Mail, Send } from 'lucide-react';
import Header from '../components/Header.jsx';
import SeoHead from '../components/SeoHead.jsx';

const initialForm = {
  name: '',
  email: '',
  category: '掲載情報の修正',
  message: '',
  company: '',
};

export default function ContactPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('sending');
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error('送信に失敗しました。入力内容をご確認ください。');
      }

      setForm(initialForm);
      setStatus('success');
    } catch (e) {
      setStatus('error');
      setError(e.message || '送信に失敗しました。時間をおいて再度お試しください。');
    }
  };

  const isSending = status === 'sending';

  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200 font-sans">
      <SeoHead title="お問い合わせ" path="/contact" />
      <Header />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-12">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition font-bold text-sm">
          <span>←</span> 戻る
        </button>

        <div className="mb-8 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3 text-pink-300 font-black text-xs tracking-widest mb-3">
            <Mail className="w-4 h-4" />
            CONTACT
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">お問い合わせ</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur rounded-2xl border border-white/5 p-6 md:p-8 shadow-xl space-y-6">
          <div className="hidden" aria-hidden="true">
            <label>
              会社名
              <input name="company" value={form.company} onChange={handleChange} tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="block">
              <span className="block text-xs font-black text-slate-400 mb-2 tracking-widest">NAME</span>
              <input
                required
                maxLength={80}
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500/70 focus:ring-2 focus:ring-pink-500/10 transition"
                placeholder="お名前"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-black text-slate-400 mb-2 tracking-widest">EMAIL</span>
              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500/70 focus:ring-2 focus:ring-pink-500/10 transition"
                placeholder="mail@example.com"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-xs font-black text-slate-400 mb-2 tracking-widest">CATEGORY</span>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500/70 focus:ring-2 focus:ring-pink-500/10 transition"
            >
              <option>掲載情報の修正</option>
              <option>口コミ・投稿について</option>
              <option>有料プランについて</option>
              <option>その他</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-xs font-black text-slate-400 mb-2 tracking-widest">MESSAGE</span>
            <textarea
              required
              minLength={10}
              maxLength={4000}
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={8}
              className="w-full resize-y bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500/70 focus:ring-2 focus:ring-pink-500/10 transition leading-relaxed"
              placeholder="お問い合わせ内容"
            />
            <span className="mt-2 block text-right text-xs text-slate-500">{form.message.length}/4000</span>
          </label>

          {status === 'success' && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>送信しました。確認後、必要に応じてご連絡いたします。</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSending}
            className="inline-flex w-full md:w-auto items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-60 disabled:hover:bg-pink-600 text-white px-6 py-3 rounded-xl text-sm font-black transition"
          >
            <Send className="w-4 h-4" />
            {isSending ? '送信中' : '送信する'}
          </button>
        </form>
      </div>
    </div>
  );
}
