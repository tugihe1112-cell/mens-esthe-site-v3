/**
 * /shops/:shopId/threads/:threadId/review — 口コミの投稿フォーム。
 *
 * 🚩 2026-10-10: このページは**最初のHTMLに <title> も noindex も無かった**（フォームの中身は
 *    投稿先を確かめたあとに描くので、それまでの「投稿先を確認しています…」だけがHTMLに出ていた）。
 *    中身が同じ183字のページが店の数だけ（/shops/:id/review）Google に載せてよい状態で、
 *    ブランドページからもリンクされていた。フォームは検索に出す価値の無いページ。
 *    → ここで最初から title と noindex を出す（SeoHead の noindex は nofollow も付ける）。
 */
import React from 'react';
import SeoHead from '../../../../../src/components/SeoHead.jsx';
import PostReviewPage from '../../../../../src/pages/PostReviewPage.jsx';

export default function TherapistReviewRoute(props) {
  return (
    <>
      <SeoHead title="口コミを投稿" noindex />
      <PostReviewPage {...props} />
    </>
  );
}
