const fs = require('fs');

const contextPath = 'src/contexts/DataContext.jsx';
const pagePath = 'src/pages/PostReviewPage.jsx';

console.log('🔄 Starting Review System Repair...');

// --- 1. DataContext.jsx の修正 ---
// 目的: JSONデータ(サーバー)とLocalStorage(ブラウザ)を合体させて表示する
try {
  let content = fs.readFileSync(contextPath, 'utf8');
  let originalContent = content;

  // A. addReview関数の追加 (保存機能)
  const addReviewCode = `
  // --- 🆕 クチコミ機能: 保存と反映 ---
  const addReview = useCallback((newReview) => {
    // 1. 画面に追加
    setReviews(prev => [newReview, ...prev]);
    // 2. ブラウザに保存 (キー名は発見された 'mens_esthe_local_reviews' を使用)
    try {
      const localData = JSON.parse(localStorage.getItem('mens_esthe_local_reviews') || '[]');
      localData.push(newReview);
      localStorage.setItem('mens_esthe_local_reviews', JSON.stringify(localData));
    } catch (e) { console.error("Save Error:", e); }
  }, []);`;

  if (!content.includes('const addReview = useCallback')) {
    content = content.replace('const value = {', addReviewCode + '\n\n  const value = {');
    console.log('✅ DataContext: addReview function added.');
  }

  // B. 読み込みロジックの修正 (JSON + LocalStorage)
  // setReviews(reviewsData); を探して、マージロジックに書き換える
  if (!content.includes('const localReviews = JSON.parse')) {
    const fetchLogic = `
        const reviewsData = await reviewsRes.json();
        
        // --- 🆕 修正: ローカル保存された投稿を合体させる ---
        try {
          const localReviews = JSON.parse(localStorage.getItem('mens_esthe_local_reviews') || '[]');
          // 日付の新しい順に並べ替え
          const merged = [...localReviews, ...reviewsData].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
          setReviews(merged);
        } catch (e) {
          console.error("Merge Error:", e);
          setReviews(reviewsData);
        }
        // -------------------------------------------------
    `;
    
    // 既存の setReviews(reviewsData); を置換
    // 正規表現で柔軟にマッチさせる
    content = content.replace(/const reviewsData = await reviewsRes\.json\(\);[\s\S]*?setReviews\(reviewsData\);/, fetchLogic);
    
    // もし上記でマッチしなかった場合（コードが少し違う場合）の予備策
    if (content === originalContent && content.includes('setReviews(reviewsData)')) {
       content = content.replace('setReviews(reviewsData);', 
         `const localReviews = JSON.parse(localStorage.getItem('mens_esthe_local_reviews')||'[]'); setReviews([...localReviews, ...reviewsData]);`);
    }
    console.log('✅ DataContext: LocalStorage merging logic enabled.');
  }

  // C. valueへの公開
  if (!content.includes('addReview //')) {
    content = content.replace('version', 'version,\n    addReview // 👈 Logic Enabled');
    console.log('✅ DataContext: addReview exposed.');
  }

  fs.writeFileSync(contextPath, content);
} catch (e) { console.error('❌ DataContext Error:', e); }


// --- 2. PostReviewPage.jsx の修正 ---
// 目的: デモ用アラートを消して、addReviewを呼び出す
try {
  let pageContent = fs.readFileSync(pagePath, 'utf8');

  // フックの修正
  if (!pageContent.includes('addReview } = useShopData')) {
    pageContent = pageContent.replace(/} = useShopData\(\);/, ', addReview } = useShopData();');
  }

  // 送信ロジックの修正
  const submitLogic = `const submitData = {
      id: \`local_\${Date.now()}\`,
      shop_id: selectedShopId,
      therapistId: selectedTherapistId,
      rating: form.calculatedRating,
      detailedRatings: form.detailedRatings,
      content: form.combinedContent,
      user: userName || '匿名ユーザー',
      createdAt: new Date().toISOString(),
      date: new Date().toISOString(),
      isLocal: true
    };

    if (addReview) {
      addReview(submitData); // 本保存
    } else {
      console.error("System Error: addReview missing");
      alert("エラー: 保存機能が見つかりません");
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      clearDraft();
      setIsSubmitting(false);
      navigate(\`/shops/\${selectedShopId}\`);
    }, 500);`;

  // 古いロジック（alertがある部分）を特定して置換
  const oldRegex = /const submitData = \{[\s\S]*?\}, 1500\);/m;
  if (pageContent.match(oldRegex)) {
    pageContent = pageContent.replace(oldRegex, submitLogic);
    fs.writeFileSync(pagePath, pageContent);
    console.log('✅ PostReviewPage: Connected to real storage logic.');
  } else {
    console.log('ℹ️ PostReviewPage: Already updated.');
  }

} catch (e) { console.error('❌ PostReviewPage Error:', e); }

console.log('🎉 Review System Fixed!');
