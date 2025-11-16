// src/pages/Home.jsx

import React, { useState, useMemo } from "react";
import { useAppContext } from "../context/AppContext.tsx";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import TopHeroSlider from "../components/TopHeroSlider.jsx";
import SearchSection from "../components/SearchSection.jsx";
import RankingSection from "../components/RankingSection.jsx";
import StarRating from "../components/ui/StarRating.tsx";

export default function Home() {
  const { shops } = useAppContext();
  const navigate = useNavigate();

  // =====================
  // 絞り込み用の state
  // =====================
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedPrefecture, setSelectedPrefecture] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const regions = useMemo(
    () => [...new Set(shops.map((s) => s.region))],
    [shops]
  );

  const prefectures = useMemo(
    () =>
      selectedRegion
        ? [
            ...new Set(
              shops
                .filter((s) => s.region === selectedRegion)
                .map((s) => s.prefecture)
            ),
          ]
        : [],
    [selectedRegion, shops]
  );

  const cities = useMemo(
    () =>
      selectedPrefecture
        ? [
            ...new Set(
              shops
                .filter((s) => s.prefecture === selectedPrefecture)
                .map((s) => s.city)
            ),
          ]
        : [],
    [selectedPrefecture, shops]
  );

  const filteredShops = useMemo(
    () =>
      shops.filter(
        (s) =>
          (!selectedRegion || s.region === selectedRegion) &&
          (!selectedPrefecture || s.prefecture === selectedPrefecture) &&
          (!selectedCity || s.city === selectedCity)
      ),
    [shops, selectedRegion, selectedPrefecture, selectedCity]
  );

  // =====================
  // 並び替え
  // =====================
  const [shopSortBy, setShopSortBy] = useState("new");

  const sortedShops = useMemo(() => {
    const r = [...filteredShops];
    if (shopSortBy === "rating") r.sort((a, b) => b.rating - a.rating);
    if (shopSortBy === "reviews") r.sort((a, b) => b.reviewCount - a.reviewCount);
    return r;
  }, [filteredShops, shopSortBy]);

  // =====================
  // 推奨タグ
  // =====================
  const recommendedTags = ["巨乳", "20代", "美人系", "可愛い系", "スレンダー", "東京", "渋谷"];

  const handleTagClick = (tag) => {
    navigate(`/shops?tag=${tag}`);
    toast(`タグ「${tag}」で検索します`);
  };

  // =====================
  // 店舗カードクリック
  // =====================
  const handleShopClick = (shop) => {
    navigate(`/shops/${shop.id}`);
  };

  // =====================
  // JSX
  // =====================
  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6">
      {/* 上部広告スライダー */}
      <TopHeroSlider />

      {/* 検索ブロック */}
      <SearchSection
        regions={regions}
        prefectures={prefectures}
        cities={cities}
        selectedRegion={selectedRegion}
        selectedPrefecture={selectedPrefecture}
        selectedCity={selectedCity}
        setSelectedRegion={setSelectedRegion}
        setSelectedPrefecture={setSelectedPrefecture}
        setSelectedCity={setSelectedCity}
      />

      {/* ランキング */}
      <RankingSection />

      {/* 推奨タグ */}
      <section className="my-6">
        <h2 className="text-xl font-bold text-white mb-3">推奨タグ</h2>
        <div className="flex flex-wrap gap-2">
          {recommendedTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="bg-white/10 text-gray-200 rounded-full px-4 py-1.5 text-sm hover:bg-white/20 transition"
            >
              #{tag}
            </button>
          ))}
        </div>
      </section>

      {/* 店舗一覧 */}
      <section className="my-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">
            店舗一覧 ({filteredShops.length}件)
          </h2>
          <div className="flex items-center gap-2">
            <label htmlFor="shop-sort" className="text-sm text-gray-300">
              並び替え:
            </label>
            <select
              id="shop-sort"
              value={shopSortBy}
              onChange={(e) => setShopSortBy(e.target.value)}
              className="p-2 rounded bg-slate-800 text-white border border-slate-700"
            >
              <option value="new">新着順</option>
              <option value="rating">評価順</option>
              <option value="reviews">口コミ数順</option>
            </select>
          </div>
        </div>

        {sortedShops.length === 0 ? (
          <div className="text-gray-400 bg-slate-800 p-6 rounded-lg text-center">
            該当する店舗がありません。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedShops.map((shop) => (
              <div
                key={shop.id}
                onClick={() => handleShopClick(shop)}
                className="bg-slate-800 rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <img
                  src={shop.image}
                  alt={shop.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4 border-t-4 border-pink-500">
                  <h3 className="text-lg font-bold text-white truncate">
                    {shop.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">
                    {shop.prefecture} {shop.city}
                  </p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-yellow-400 font-bold">
                      {shop.price}
                    </span>
                    <div className="flex items-center gap-1">
                      <StarRating rating={shop.rating} interactive={false} />
                      <span className="text-gray-300">
                        ({shop.reviewCount})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
