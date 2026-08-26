import { supabase } from '../lib/supabase';
import { shapeShopRow } from '../utils/shopFields';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ShopContext = createContext();
export const useShopData = () => useContext(ShopContext);

export const DataProvider = ({ children }) => {
  const [shops, setShops] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(Date.now());

  const [loadedShopIds, setLoadedShopIds] = useState(new Set());
  const [loadedReviewShopIds, setLoadedReviewShopIds] = useState(new Set());

  useEffect(() => {
    // ── フォールバック: ブラウザから直接Supabaseを叩く従来経路 ──
    // ⚠️ 全件取得は必ず range() でページングすること。
    //    PostgREST はサーバー側の max-rows（既定1000）が優先されるため、
    //    limit も range も付けない素の select は 1,000 行で頭打ちになり、
    //    掲載1,098店のうち約98店がエラーも警告も出さずに欠落していた
    //    （サイトマップで潰したのと同じバグ。api/sitemap.xml.js と同方式に揃える）。
    //    .order('id') は range のページ境界で取りこぼし/重複を出さないために必須。
    //    NOTE: price_system / business_hours / phone_number は初回selectから外して
    //    軽量化したかったが、SearchPage の ShopCard（検索結果の「詳細▾」で料金・
    //    営業時間・電話を出す）が DataContext の shops から直接読んでいるため外せない。
    //    外すと検索結果の詳細パネルが無言で空になる。
    const fetchDirectFromSupabase = async () => {
      const PAGE = 1000;
      const out = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from('shops')
          .select('id, group_id, name, raw_data, website_url, schedule_url, phone_number, business_hours, price_system, image_url')
          .order('id')
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        out.push(...data);
        if (data.length < PAGE) break;
        if (out.length >= 50000) break; // 暴走ガード
      }
      return out;
    };

    const fetchInitialData = async () => {
      try {
        // ── 速度改善(2026-08-09) ──
        // まず /api/shops-lite（サーバー側で raw_data.threads を落としCDNキャッシュ済み）を試す。
        // threads は raw_data の96%を占める古い重複セラピストデータで、
        // 全ユーザーが全ページで推定12MBをDL+JSONパースしていた＝体感速度の主犯。
        // API側が落ちた場合だけ従来どおりブラウザから直接Supabaseを叩く（機能は落とさない）。
        let shopsData = [];
        try {
          const r = await fetch('/api/shops-lite');
          if (!r.ok) throw new Error('shops-lite ' + r.status);
          const j = await r.json();
          if (!Array.isArray(j) || j.length === 0) throw new Error('shops-lite empty');
          shopsData = j;
        } catch (liteErr) {
          console.warn('⚠️ /api/shops-lite 失敗 → 直接Supabaseにフォールバック:', liteErr.message);
          shopsData = await fetchDirectFromSupabase();
        }

        if (shopsData.length) {
          // ⚠️ 整形はここに直接書かない。shapeShopRow に一本化している
          //    （以前は DataContext / heroShops / ShopDetailPage で実装がバラバラで、
          //      ShopDetailPage は変換自体を通しておらず住所が全店で消えていた）。
          setShops(shopsData.map(shapeShopRow));
        }
      } catch (error) {
        console.error('❌ Failed to fetch initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const getBrandName = useCallback((shopName) => {
    if (!shopName) return '';
    let n = shopName;
    n = n.replace(/[（(].*?[)）]/g, '');
    n = n.replace(/\s+[^\s]+(店|ルーム|FC.*)$/g, '');
    if (n.includes('リンダスパ')) return 'LINDA SPA';
    return n.trim().toUpperCase();
  }, []);

    const getBrandShopIds = useCallback((shopId) => {
    const currentShop = shops.find(s => s.id === shopId);
    if (!currentShop) return [shopId];
    // group_id で束ねる（同ブランド全店舗のレビューを吸収）
    if (currentShop.group_id) {
      const relatedIds = shops
        .filter(s => s.group_id === currentShop.group_id)
        .map(s => s.id);
      return relatedIds.length > 0 ? relatedIds : [shopId];
    }
    // group_idがない場合はbrandIdで束ねる
    if (currentShop.brandId) {
      const relatedIds = shops
        .filter(s => s.brandId === currentShop.brandId)
        .map(s => s.id);
      return relatedIds.length > 0 ? relatedIds : [shopId];
    }
    return [shopId];
  }, [shops]);

  const loadTherapistsForShop = useCallback(async (shopId) => {
    if (!shopId || loadedShopIds.has(shopId)) return;
    const brandIds = getBrandShopIds(shopId);
    try {
      const { data, error } = await supabase
        .from('therapists')
        .select('*')
        .in('shop_id', brandIds)
        .not('image_url', 'is', null)
        .neq('image_url', '')
        .or('is_active.is.null,is_active.eq.true');
      if (error) throw error;
      if (data) {
        const newTherapists = data.map(d => ({ ...(d.raw_data || {}), ...d }));
        setTherapists(prev => {
          const merged = [...prev, ...newTherapists];
          return Array.from(new Map(merged.filter(t => t.name).map(t => [t.name, t])).values());
        });
        setLoadedShopIds(prev => {
          const newSet = new Set(prev);
          brandIds.forEach(id => newSet.add(id));
          return newSet;
        });
      }
    } catch (error) { console.error(`❌ セラピスト取得エラー:`, error); }
  }, [loadedShopIds, getBrandShopIds]);

  const loadReviewsForShop = useCallback(async (shopId) => {
    if (!shopId || loadedReviewShopIds.has(shopId)) return;
    const brandIds = getBrandShopIds(shopId);
    try {
      const { data, error } = await supabase.from('reviews').select('*').in('shop_id', brandIds).order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      if (data) {
        const formattedReviews = data.map(r => ({
          ...r,
          createdAt: r.created_at,
          date: r.created_at,
          reviewerName: r.user_name,
          score: r.rating,
          text: r.content,
          review_text: r.content
        }));
        setReviews(prev => {
          const merged = [...prev, ...formattedReviews];
          const uniqueById = Array.from(new Map(merged.map(r => [r.id, r])).values());
          return uniqueById.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        });
        setLoadedReviewShopIds(prev => {
          const newSet = new Set(prev);
          brandIds.forEach(id => newSet.add(id));
          return newSet;
        });
      }
    } catch (error) { console.error(`❌ クチコミ取得エラー:`, error); }
  }, [loadedReviewShopIds, getBrandShopIds]);

  const addReview = useCallback(async (newReview) => {
    // ⚠️ 2026-08-12 修正: 以前は (a)INSERT前に楽観的に画面へ追加し (b)エラーを
    //    `catch (e) { console.error(e) }` で握りつぶしていた。
    //    そのため **保存に失敗しても呼び出し側は成功扱い**になり、ユーザーには
    //    「投稿完了」画面が出るのに1件も保存されない、という最悪の壊れ方をしていた。
    //    公開INSERTポリシー（anonでも書ける穴）を閉じると、セッション切れ等で
    //    RLSに弾かれるケースが現実に発生するため、ここを直さずに閉じてはいけない。
    //    → 先にINSERTし、成功したときだけ画面に反映する。失敗は必ず throw する。
    const reviewId = newReview.id || `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const { error } = await supabase.from('reviews').insert([{
        id: reviewId,
        shop_id: newReview.shop_id || newReview.shopId || 'unknown',
        shop_name: newReview.shop_name || newReview.shopName || null,
        // ⚠️ 2026-08-12: reviews.therapist_id は **NOT NULL**（DBの列定義で確認）。
        //    「リストにいない」セラピストを手入力した場合 therapistId は null なので、
        //    そのまま送ると NOT NULL 違反で必ず INSERT が失敗していた。
        //    （従来はエラーを握りつぶしていたため、失敗しても完了画面が出ていて気づけなかった）
        //    ⚠️ 当初 `{shop_id}_{名前}` という既存規約に合わせた合成IDにしたが撤回した。
        //    本番60,999人で照合すると規約と完全一致するのは81.8%・同一合成IDの重複が943件あり、
        //    **別人の既存セラピストページに誤って紐づく**危険があったため。
        //    名前ベースは `manual_` を付けても衝突が残る（同店の同名別人／記号除去後の一致／
        //    絵文字だけの入力で空になる／表記揺れの誤統合）。
        //    → **レビュー単位の一意ID**にする。表示名は therapist_name に必ず保存し、
        //      後日 /admin から正式な therapist_id へ紐付ける運用にする。
        //    ⚠️ manual_* は therapists に存在しないためセラピストページは404になる。
        //      DB側のトリガーで manual_* は is_public=false に固定し、
        //      ホーム・人気口コミ・関連リンク・サイトマップ（いずれも is_public で絞る）に
        //      出さないことで404リンクの生成を防ぐ（12_のSQLを参照）。
        therapist_id:
          newReview.therapist_id || newReview.therapistId || `manual_${reviewId}`,
        therapist_name: newReview.therapist_name || newReview.therapistName || null,
        user_id: newReview.user_id || newReview.userId || 'anonymous',
        user_name: newReview.user_name || newReview.userName || newReview.user || '名無しさん',
        rating: newReview.rating || newReview.score || 5,
        course: newReview.course || null,
        detailed_ratings: newReview.detailed_ratings || newReview.detailedRatings || null,
        tags: newReview.tags || null,
        content: newReview.content || newReview.text || '',
        story_sections: newReview.story_sections || newReview.storySections || null,
      }]);

    if (error) {
      console.error('[addReview] 保存に失敗:', error);
      const detail = `${error.message || ''} ${error.code || ''}`;

      // ⚠️ 2026-08-26: 以前は 42501 をすべて「セッション切れ」と案内していたが、
      //    **42501 は RLS違反と列権限不足の両方で返る**。実際に
      //    `permission denied for column story_sections`（12_のGRANTに列を足し忘れた）
      //    が起きたとき、セッションは有効なのに「再ログインしてください」と表示され、
      //    オーナーが原因に辿り着けなかった。原因ごとに文言を分ける。
      const isColumnDenied = /permission denied for (column|table)/i.test(detail);
      const isRls = /row-level security|violates row-level/i.test(detail);

      let message;
      if (isColumnDenied) {
        // ユーザー側では絶対に直せない＝設定の不備なので、そう伝える
        message = '申し訳ありません。サイト側の不具合で投稿を保存できませんでした。'
          + '書いた内容は下書きとして残していますので、少し時間をおいて再度お試しください。';
      } else if (isRls) {
        message = 'ログインの有効期限が切れている可能性があります。再度ログインしてから投稿してください。';
      } else {
        message = `口コミの保存に失敗しました（${error.message || '原因不明'}）`;
      }

      const e = new Error(message);
      e.cause = error;
      throw e;
    }

    // 保存に成功したときだけ画面に反映する。
    // 生成したIDは管理者通知の深いリンクに使うため呼び出し元へ返す。
    setReviews(prev => [{ ...newReview, id: reviewId }, ...prev]);
    return reviewId;
  }, []);

  const shopById = useMemo(() => {
    return shops.reduce((acc, shop) => { acc[shop.id] = shop; return acc; }, {});
  }, [shops]);

  const therapistById = useMemo(() => {
    return therapists.reduce((acc, t) => { if (t.id) acc[t.id] = t; return acc; }, {});
  }, [therapists]);
  
  const getTherapistsByShopId = useCallback((shopId) => {
    const brandIds = getBrandShopIds(shopId);
    const fromTable = therapists.filter(t => brandIds.includes(t.shop_id) || brandIds.includes(t.shopId));
    
    const shop = shopById[shopId];
    let fromRaw = [];
    
    // 🌟 ここが最大の修正ポイント: 箱の中(raw_data)ではなく、直接展開された(shop.therapists)を最優先で探す！
    const shopTherapists = shop?.therapists || shop?.raw_data?.therapists;
    const shopThreads = shop?.threads || shop?.raw_data?.threads;
    
    if (shopTherapists && Array.isArray(shopTherapists)) {
      fromRaw = shopTherapists.map(t => {
        if (typeof t === 'string') {
          const nameParts = t.split('_');
          const cleanName = nameParts.length > 1 ? nameParts.pop() : t;
          return { 
            id: t, 
            name: cleanName, 
            therapistName: cleanName, 
            shopName: shop?.name || '',
            image: therapists.find(dbT => dbT.name === cleanName || dbT.id === t)?.image || therapists.find(dbT => dbT.name === cleanName || dbT.id === t)?.image_url || null
          };
        }
        return t;
      });
    } else if (shopThreads && Array.isArray(shopThreads)) {
      fromRaw = shopThreads;
    }

    return [...fromTable, ...fromRaw];
  }, [therapists, getBrandShopIds, shopById]);

  // 🌟【データ隠蔽セキュリティ】画面に渡す直前にダミー文字へすり替える！
  // ⚠️ 2026-08-12: ここに「2件目以降 かつ 無料会員 なら本文をプレミアム誘導文に差し替える」
  //    旧処理が残っていた。ShopDetailPage の直接取得が成功する限り使われないが、
  //    **直接取得が0件・失敗したときのフォールバック経路**では、
  //    credits保有者や公開口コミまで再びロックされてしまう。
  //    閲覧可否の正本はDBのRLS（reviews_public_read / own / entitled / admin）に一本化したので、
  //    ここでは返ってきた口コミをそのまま渡す（本文の伏せ字は ModernReviewCard が判定する）。
  //    第2引数 isPremiumUser は呼び出し側の互換のため残すが、もう使わない。
  const getReviewsByShopId = useCallback((shopId) => {
    const brandIds = getBrandShopIds(shopId);
    return reviews.filter(r => brandIds.includes(r.shop_id) || brandIds.includes(r.shopId));
  }, [reviews, getBrandShopIds]);

  const value = {
    shops, therapists, reviews, loading,
    shopById, therapistById, getTherapistsByShopId, getReviewsByShopId,
    version, addReview, loadTherapistsForShop, loadReviewsForShop
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};
