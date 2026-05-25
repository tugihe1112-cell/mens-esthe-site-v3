import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext.tsx";
import RatingDisplay from "../components/ui/RatingDisplay.jsx";
import Tag from "../components/ui/Tag.jsx";
import LikeButton from "../components/LikeButton.jsx";

export default function NewReviewsPage() {
  const { shops } = useAppContext();
  const [selectedPrefecture, setSelectedPrefecture] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");

  // すべての口コミを収集
  const allReviews = useMemo(() => {
    const reviews = [];
    shops?.forEach((shop) => {
      shop.threads?.forEach((thread) => {
        thread.posts?.forEach((post) => {
          reviews.push({
            ...post,
            shop_id: shop.id,
            shopName: shop.name,
            shopPrefecture: shop.prefecture,
            shopCity: shop.city,
            threadId: thread.id,
            therapistName: thread.therapistName,
          });
        });
      });
    });
    return reviews;
  }, [shops]);

  // 都道府県リスト
  const prefectures = useMemo(() => {
    const prefs = new Set(shops?.map((shop) => shop.prefecture) || []);
    return ["all", ...Array.from(prefs).sort()];
  }, [shops]);

  // フィルタリング
  const filteredReviews = useMemo(() => {
    let result = allReviews;

    if (selectedPrefecture !== "all") {
      result = result.filter((r) => r.shopPrefecture === selectedPrefecture);
    }

    if (selectedRating !== "all") {
      const minRating = Number(selectedRating);
      result = result.filter((r) => r.rating >= minRating);
    }

    // 新着順（IDが大きい方が新しいと仮定）
    return result.sort((a, b) => b.id - a.id);
  }, [allReviews, selectedPrefecture, selectedRating]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 text-slate-200">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">📰 新着口コミ</h1>
        <p className="text-gray-400">最新の口コミをチェック！</p>
      </div>

      {/* フィルター */}
      <div className="bg-slate-800 rounded-lg p-4 mb-6 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 都道府県フィルター */}
          <select
            value={selectedPrefecture}
            onChange={(e) => setSelectedPrefecture(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
          >
            <option value="all">すべてのエリア</option>
            {prefectures.slice(1).map((pref) => (
              <option key={pref} value={pref}>
                {pref}
              </option>
            ))}
          </select>

          {/* 評価フィルター */}
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
          >
            <option value="all">すべての評価</option>
            <option value="4.5">4.5以上</option>
            <option value="4.0">4.0以上</option>
            <option value="3.5">3.5以上</option>
          </select>

          {/* 結果表示 */}
          <div className="flex items-center justify-center text-sm text-gray-400">
            {filteredReviews.length}件の口コミ
          </div>
        </div>
      </div>

      {/* 口コミ一覧 */}
      {filteredReviews.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-white mb-2">
            該当する口コミが見つかりません
          </h3>
          <p className="text-gray-400">フィルターを変更してみてください</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <article
              key={`${review.shop_id}-${review.threadId}-${review.id}`}
              className="bg-slate-800 rounded-lg p-5 border border-slate-700 hover:border-slate-600 transition"
            >
              {/* 店舗・セラピスト情報 */}
              <div className="mb-3">
                <div className="flex items-center gap-2 text-sm mb-1">
                  <Link
                    to={`/shops/${review.shop_id}`}
                    className="text-gray-400 hover:text-pink-400 transition"
                  >
                    {review.shopName}
                  </Link>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-400">
                    {review.shopPrefecture} {review.shopCity}
                  </span>
                </div>
                <Link
                  to={`/shops/${review.shop_id}/threads/${review.threadId}`}
                  className="text-xl font-bold text-white hover:text-pink-400 transition"
                >
                  {review.therapistName}
                </Link>
              </div>

              {/* 口コミヘッダー */}
              <div className="flex justify-between items-start gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white">{review.userName || review.user || '匿名'}</span>
                    {review.isPremium && <Tag variant="premium">プレミアム</Tag>}
                    {review.isVerified && (
                      <Tag variant="verified">実地確認済み</Tag>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{review.timestamp ? new Date(review.timestamp).toLocaleDateString('ja-JP') : review.time || '日付不明'}</p>
                  {review.course && (
                    <p className="text-xs text-gray-300 mt-1">
                      💰 コース: {review.course}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <RatingDisplay
                    rating={review.rating}
                    size="small"
                    showStars={true}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    👍 {review.likes || 0} ・ 💬 {review.replies || 0}
                  </p>
                </div>
              </div>

              {/* 詳細評価 */}
              {review.detailedRatings && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 mb-3 text-xs bg-slate-900/50 p-3 rounded">
                  {review.detailedRatings.cleanliness !== undefined && (
                    <div className="flex justify-between text-gray-300">
                      <span className="text-gray-400">清潔感:</span>
                      <span className="font-bold text-white">
                        {review.detailedRatings.cleanliness}
                      </span>
                    </div>
                  )}
                  {review.detailedRatings.looks !== undefined && (
                    <div className="flex justify-between text-gray-300">
                      <span className="text-gray-400">ルックス:</span>
                      <span className="font-bold text-white">
                        {review.detailedRatings.looks}
                      </span>
                    </div>
                  )}
                  {review.detailedRatings.style !== undefined && (
                    <div className="flex justify-between text-gray-300">
                      <span className="text-gray-400">スタイル:</span>
                      <span className="font-bold text-white">
                        {review.detailedRatings.style}
                      </span>
                    </div>
                  )}
                  {review.detailedRatings.service !== undefined && (
                    <div className="flex justify-between text-gray-300">
                      <span className="text-gray-400">接客:</span>
                      <span className="font-bold text-white">
                        {review.detailedRatings.service}
                      </span>
                    </div>
                  )}
                  {review.detailedRatings.massage !== undefined && (
                    <div className="flex justify-between text-gray-300">
                      <span className="text-gray-400">技術:</span>
                      <span className="font-bold text-white">
                        {review.detailedRatings.massage}
                      </span>
                    </div>
                  )}
                  {review.detailedRatings.intimacy !== undefined && (
                    <div className="flex justify-between text-gray-300">
                      <span className="text-gray-400">密着度:</span>
                      <span className="font-bold text-white">
                        {review.detailedRatings.intimacy}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* タグ */}
              {review.tags && review.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {review.tags.map((tag, idx) => (
                    <Tag key={idx} variant="primary">
                      {tag}
                    </Tag>
                  ))}
                </div>
              )}

              {/* 本文 */}
              <p className="text-sm leading-relaxed text-gray-100 mb-3 whitespace-pre-wrap">
                {review.content || '内容なし'}
              </p>

              {/* 秘密の感想 */}
              {review.hasSecret && review.secretContent && (
                <div className="mt-3 text-xs text-pink-200 bg-pink-900/30 p-3 rounded border border-pink-700/50">
                  <span className="font-bold">🔒 秘密の感想:</span>{" "}
                  {review.secretContent}
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-700">
                <LikeButton postId={review.id} initialLikes={review.likes || 0} />
                <Link
                  to={`/shops/${review.shop_id}/threads/${review.threadId}`}
                  className="px-4 py-1.5 rounded-full text-xs font-bold border bg-slate-700 border-slate-600 hover:bg-slate-600 transition"
                >
                  💬 スレッドを見る
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
