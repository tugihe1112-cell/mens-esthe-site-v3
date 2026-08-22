import React, { useEffect } from 'react';
import { Link, useNavigate } from '../compat/router';
import Header from '../components/Header.jsx';
import SeoHead from '../components/SeoHead.jsx';

export default function PrivacyPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200 font-sans">
      <SeoHead title="プライバシーポリシー" />
      <Header />
      {/* pt-24: 固定ヘッダー(最大約76px)を確実に避ける。py-12(48px)では「← 戻る」が隠れていた */}
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-12">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition font-bold text-sm">
          <span>←</span> 戻る
        </button>

        <h1 className="text-2xl md:text-3xl font-black text-white mb-8 border-b border-white/10 pb-4">プライバシーポリシー</h1>

        <div className="bg-slate-900/50 backdrop-blur rounded-2xl border border-white/5 p-6 md:p-8 shadow-xl space-y-8 text-sm md:text-base leading-relaxed text-slate-300">
          <p>
            当サイト（以下、「本サービス」といいます。）は、ユーザーの皆様の個人情報について、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます。）を定めます。
          </p>
          <p className="text-xs text-slate-500">制定日：2026年8月22日</p>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. 取得する情報</h2>
            <p>本サービスは、会員登録時のメールアドレス・表示名、投稿した口コミ・お問い合わせ内容、ログインや閲覧に関する記録、端末・ブラウザ・IPアドレス等のアクセス情報を取得することがあります。現在、当サイトは有料プランの販売およびクレジットカード情報の取得を行っていません。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. 個人情報を収集・利用する目的</h2>
            <p>本サービスが個人情報を収集・利用する目的は、以下のとおりです。</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>本サービスの提供・運営のため</li>
              <li>本人確認、ログイン、重要なお知らせの送信のため</li>
              <li>口コミの公開、閲覧権の付与、不正利用や連続送信の防止のため</li>
              <li>ユーザーからのお問い合わせに回答するため</li>
              <li>利用状況を分析し、表示・操作性・安全性を改善するため</li>
              <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. 個人情報の第三者提供</h2>
            <p>本サービスは、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>サービス運営に必要な範囲で、クラウド、認証、メール配信、アクセス解析等の委託先に取扱いを委託する場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. 委託先・外部サービス</h2>
            <p>本サービスでは、運営に必要な範囲で Supabase（データベース・認証）、Vercel（ホスティング）、Resend（メール配信）、Google Analytics（アクセス解析）を利用します。各事業者は、それぞれの利用規約・プライバシーポリシーに基づき情報を取り扱います。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Cookie・端末内保存</h2>
            <p>本サービスでは、ログイン状態の維持、下書き・お気に入り・閲覧履歴の端末内保存、アクセス解析のためにCookieまたはローカルストレージを使用します。ブラウザの設定で無効化・削除できますが、その場合は一部機能を利用できないことがあります。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. 安全管理・保存期間</h2>
            <p>アクセス制御、通信の暗号化、権限分離、送信回数制限等により、取得した情報の漏えい・改ざん・不正アクセスの防止に努めます。情報は利用目的、法令上の義務、不正防止および紛争対応に必要な期間保持し、不要になった情報は削除または匿名化します。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. 開示・訂正・削除等のお問い合わせ</h2>
            <p>ご本人の情報について、開示、訂正、利用停止、削除等を希望する場合は、本人確認に必要な情報を添えて<Link to="/contact" className="text-pink-300 underline underline-offset-4">お問い合わせフォーム</Link>からご連絡ください。法令に従い対応します。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. プライバシーポリシーの変更</h2>
            <p>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく変更することができるものとします。変更後のプライバシーポリシーは、本サービスに掲載したときから効力を生じるものとします。</p>
          </section>
        </div>
      </div>
    </div>
  );
}
