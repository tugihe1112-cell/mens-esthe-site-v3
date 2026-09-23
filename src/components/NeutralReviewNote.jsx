import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { NEUTRAL_REVIEW_NOTE } from '../data/siteCopy.js';

/**
 * 口コミ欄の見出しの下に置く中立宣言（D-003）の一行。
 *
 * 【なぜ置くか（2026-09-23）】外部の指摘「広告費を受け取っていないという強みが埋もれている」。
 * ホームは口コミ欄の帯に出ていたが、**口コミを実際に読む**店舗・ブランド・セラピストのページでは
 * フッター（ページの一番下）にしか無かった。読んでいる口コミの横で「広告ではない」と分かることに意味がある。
 * ⚠️ 文言は siteCopy の NEUTRAL_REVIEW_NOTE だけを使う（ホームの帯と同じ文。写しを作らない）。
 * ⚠️ 1行の注記にとどめる。口コミ欄の構成（見出し・投稿ボタン・一覧）は変えない（D-001）。
 */
export default function NeutralReviewNote({ className = '' }) {
  return (
    <p className={`flex items-start gap-1.5 text-xs font-semibold leading-relaxed text-slate-400 ${className}`}>
      <ShieldCheck size={14} strokeWidth={2.2} aria-hidden="true" className="mt-0.5 shrink-0 text-pink-300" />
      <span>{NEUTRAL_REVIEW_NOTE}</span>
    </p>
  );
}
