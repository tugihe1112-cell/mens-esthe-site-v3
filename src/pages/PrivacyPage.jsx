import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import SeoHead from '../components/SeoHead.jsx';

export default function PrivacyPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200 font-sans">
      <SeoHead title="プライバシーポリシー" />
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition font-bold text-sm">
          <span>←</span> 戻る
        </button>

        <h1 className="text-2xl md:text-3xl font-black text-white mb-8 border-b border-white/10 pb-4">プライバシーポリシー</h1>

        <div className="bg-slate-900/50 backdrop-blur rounded-2xl border border-white/5 p-6 md:p-8 shadow-xl space-y-8 text-sm md:text-base leading-relaxed text-slate-300">
          <p>
            当サイト（以下、「本サービス」といいます。）は、ユーザーの皆様の個人情報について、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます。）を定めます。
          </p>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. 個人情報の収集方法</h2>
            <p>本サービスは、ユーザーが会員登録や有料プランの購入をする際に、メールアドレス、クレジットカード情報（※決済代行会社を通じて処理され、当サイトのサーバーには保存されません）などの個人情報をお尋ねすることがあります。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. 個人情報を収集・利用する目的</h2>
            <p>本サービスが個人情報を収集・利用する目的は、以下のとおりです。</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>本サービスの提供・運営のため</li>
              <li>ユーザーからのお問い合わせに回答するため</li>
              <li>有料プランの利用料金を請求するため</li>
              <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. 個人情報の第三者提供</h2>
            <p>本サービスは、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>決済処理等のために、秘密保持契約を締結した決済代行会社に業務を委託する場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Cookie（クッキー）等の使用について</h2>
            <p>本サービスでは、ログイン状態の維持やアクセスの解析のためにCookieを使用しています。ユーザーはブラウザの設定によりCookieを無効にすることができますが、その場合、本サービスの一部機能が利用できなくなる可能性があります。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. プライバシーポリシーの変更</h2>
            <p>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく変更することができるものとします。変更後のプライバシーポリシーは、本サービスに掲載したときから効力を生じるものとします。</p>
          </section>
        </div>
      </div>
    </div>
  );
}
