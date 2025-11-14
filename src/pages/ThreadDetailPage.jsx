// src/pages/ThreadDetailPage.jsx (新規作成)

import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom'; // (後でインストールします)
import { useAppContext } from '../context/AppContext';

// これまでに作成した部品をすべてインポート
import ThreadHeader from '../components/ThreadHeader';
import ReviewForm from '../components/ReviewForm';
import PostSorter from '../components/PostSorter';
import ReviewCard from '../components/ReviewCard';

export default function ThreadDetailPage() {
  // --- 1. URLから :shopId と :threadId を取得 ---
  // (例: /shop/1/thread/1 -> { shopId: '1', threadId: '1' })
  const { shopId, threadId } = useParams();

  // --- 2. Contextから必要なデータと関数を取得 ---
  const { 
    shops, 
    likedPosts, 
    favorites, 
    toggleLike, 
    toggleFavorite 
  } = useAppContext();

  // --- 3. ソート状態を管理 ---
  const [sortKey, setSortKey] = useState('newest'); // 'newest', 'likes', 'rating', 'length'

  // --- 4. 該当スレッドの口コミ一覧を取得・ソート ---
  const sortedPosts = useMemo(() => {
    const shop = shops.find((s) => s.id == shopId);
    if (!shop) return [];
    
    const thread = shop.threads.find((t) => t.id == threadId);
    if (!thread) return [];

    // ソートのために配列をコピー
    const posts = [...thread.posts];

    // 仕様書通りのソートロジック
    switch (sortKey) {
      case 'likes':
        posts.sort((a, b) => b.likes - a.likes);
        break;
      case 'rating':
        posts.sort((a, b) => b.rating - a.rating);
        break;
      case 'length':
        posts.sort((a, b) => b.content.length - a.content.length);
        break;
      case 'newest':
      default:
        posts.sort((a, b) => b.id - a.id); // ID降順 (新しいものが上)
        break;
    }
    return posts;

  }, [shops, shopId, threadId, sortKey]); // 関連データが変わったら再ソート

  return (
    // bodyに適用したグラデーション背景の上に配置
    <main className="max-w-6xl mx-auto p-4 md:p-6">
      
      {/* 1. スレッドヘッダー (集計データを表示) */}
      <ThreadHeader shopId={shopId} threadId={threadId} />
      
      {/* 2. 口コミ投稿フォーム (仕様書通り) */}
      <ReviewForm shopId={shopId} threadId={threadId} />
      
      {/* 3. 口コミソート機能 (仕様書通り) */}
      <PostSorter sortKey={sortKey} setSortKey={setSortKey} />
      
      {/* 4. 口コミ一覧 (ソート済み) */}
      <section className="space-y-4 mt-6">
        <h2 className="text-xl font-bold text-pink-400">口コミ一覧 ({sortedPosts.length}件)</h2>
        {sortedPosts.length === 0 ? (
          <p className="text-gray-400 bg-slate-800 p-6 rounded-lg text-center">
            このスレッドにはまだ口コミがありません。
          </p>
        ) : (
          sortedPosts.map(post => (
            <ReviewCard
              key={post.id}
              review={post}
              isLiked={likedPosts.includes(post.id)}
              isFavorited={favorites.includes(parseInt(threadId))} // threadIdを数値に変換
              onLike={() => toggleLike(post.id)}
              onFav={() => toggleFavorite(parseInt(threadId))}
              onTagClick={() => {}} // (一覧ページではないのでタグクリック機能は一旦停止)
            />
          ))
        )}
      </section>

    </main>
  );
}