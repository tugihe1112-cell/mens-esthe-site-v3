// ========================================
// RequestReviewPage.jsx（新規店舗への口コミ投稿・セレクトボックス版）
// ========================================

import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext.tsx";

export default function RequestReviewPage() {
  const navigate = useNavigate();
  const { currentUser, handleReviewRequest } = useAppContext();

  // ステップ管理
  const [step, setStep] = useState(1);

  // フォームデータ
  const [prefecture, setPrefecture] = useState("");
  const [city, setCity] = useState("");
  const [customCity, setCustomCity] = useState(""); // その他選択時の入力
  const [shopName, setShopName] = useState("");
  const [therapistName, setTherapistName] = useState("");
  const [rating, setRating] = useState(0);
  const [detailedRatings, setDetailedRatings] = useState({
    cleanliness: 0,
    appearance: 0,
    style: 0,
    service: 0,
    skill: 0,
    intensity: 0,
  });
  const [course, setCourse] = useState("");
  const [price, setPrice] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  // 都道府県リスト
  const prefectures = [
    "東京都", "神奈川県", "埼玉県", "千葉県", "大阪府", "愛知県", 
    "北海道", "福岡県", "兵庫県", "京都府", "その他"
  ];

  // 都道府県ごとの主要市区町村リスト
  const citiesByPrefecture = {
    "東京都": [
      "千代田区", "中央区", "港区", "新宿区", "文京区", "台東区", "墨田区", "江東区",
      "品川区", "目黒区", "大田区", "世田谷区", "渋谷区", "中野区", "杉並区", "豊島区",
      "北区", "荒川区", "板橋区", "練馬区", "足立区", "葛飾区", "江戸川区",
      "八王子市", "立川市", "武蔵野市", "三鷹市", "府中市", "調布市", "町田市", "その他"
    ],
    "神奈川県": [
      "横浜市", "川崎市", "相模原市", "横須賀市", "平塚市", "鎌倉市", "藤沢市",
      "小田原市", "茅ヶ崎市", "厚木市", "大和市", "海老名市", "その他"
    ],
    "埼玉県": [
      "さいたま市", "川越市", "川口市", "所沢市", "越谷市", "草加市", "春日部市",
      "熊谷市", "狭山市", "上尾市", "新座市", "久喜市", "その他"
    ],
    "千葉県": [
      "千葉市", "船橋市", "松戸市", "市川市", "柏市", "市原市", "八千代市",
      "流山市", "浦安市", "習志野市", "野田市", "その他"
    ],
    "大阪府": [
      "大阪市", "堺市", "東大阪市", "豊中市", "吹田市", "高槻市", "枚方市",
      "茨木市", "八尾市", "寝屋川市", "岸和田市", "その他"
    ],
    "愛知県": [
      "名古屋市", "豊田市", "岡崎市", "一宮市", "豊橋市", "春日井市", "安城市",
      "豊川市", "西尾市", "刈谷市", "その他"
    ],
    "北海道": [
      "札幌市", "旭川市", "函館市", "釧路市", "苫小牧市", "帯広市", "小樽市",
      "北見市", "江別市", "その他"
    ],
    "福岡県": [
      "福岡市", "北九州市", "久留米市", "飯塚市", "大牟田市", "春日市", "筑紫野市",
      "大野城市", "宗像市", "その他"
    ],
    "兵庫県": [
      "神戸市", "姫路市", "尼崎市", "明石市", "西宮市", "芦屋市", "伊丹市",
      "宝塚市", "川西市", "その他"
    ],
    "京都府": [
      "京都市", "宇治市", "亀岡市", "城陽市", "長岡京市", "八幡市", "京田辺市",
      "その他"
    ],
    "その他": ["その他"]
  };

  // 選択された都道府県の市区町村リスト
  const availableCities = useMemo(() => {
    return citiesByPrefecture[prefecture] || [];
  }, [prefecture]);

  const tagCategories = {
    容姿: ["美人", "可愛い", "綺麗", "清楚", "ギャル系", "大人っぽい"],
    体型: ["スレンダー", "巨乳", "グラマー", "美脚", "色白", "スタイル抜群"],
    性格: ["明るい", "優しい", "癒し系", "フレンドリー", "話を聞く"],
    年代: ["10代", "20代前半", "20代後半", "30代前半", "30代後半", "40代以上"],
    テクニック: ["上手", "丁寧", "力強い", "繊細", "積極的"],
    距離感: ["密着", "積極的", "控えめ", "距離感近い"],
    人気: ["人気", "新人", "おすすめ", "リピート確定"],
    写真: ["写真通り", "写真より良い", "写真とギャップあり"],
  };

  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-white text-center">
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
          <p className="text-xl mb-4">ログインが必要です</p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 rounded-lg bg-pink-600 hover:bg-pink-700 font-bold transition"
          >
            ログインする
          </Link>
        </div>
      </div>
    );
  }

  const StarRating = ({ value, onChange, label }) => (
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      <div className="flex gap-2 items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="text-3xl transition hover:scale-110"
          >
            {star <= value ? "⭐" : "☆"}
          </button>
        ))}
        <span className="ml-2 text-white font-bold text-lg">{value}.0</span>
      </div>
    </div>
  );

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handlePrefectureChange = (e) => {
    setPrefecture(e.target.value);
    setCity(""); // 市区町村をリセット
    setCustomCity(""); // カスタム入力もリセット
  };

  const handleNext = () => {
    if (step === 1) {
      if (!prefecture) {
        alert("都道府県を選択してください");
        return;
      }
      
      // 市区町村のチェック
      if (!city) {
        alert("市区町村を選択してください");
        return;
      }
      
      // 「その他」選択時はカスタム入力が必須
      if (city === "その他" && !customCity.trim()) {
        alert("市区町村名を入力してください");
        return;
      }
      
      setStep(2);
    } else if (step === 2) {
      if (!shopName) {
        alert("店舗名を入力してください");
        return;
      }
      if (!therapistName) {
        alert("セラピスト名を入力してください");
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert("総合評価を選択してください");
      return;
    }

    if (Object.values(detailedRatings).some((v) => v === 0)) {
      alert("詳細評価をすべて入力してください");
      return;
    }

    if (content.trim().length < 10) {
      alert("口コミ内容は10文字以上入力してください");
      return;
    }

    // 市区町村の最終決定（「その他」の場合はカスタム入力を使用）
    const finalCity = city === "その他" ? customCity.trim() : city;

    const newReviewData = {
      requestedPrefecture: prefecture,
      requestedCity: finalCity,
      requestedShopName: shopName,
      requestedTherapistName: therapistName,
      content: content.trim(),
      userTags: selectedTags,
      course: course ? `${course} ${price}` : undefined,
    };

    handleReviewRequest(newReviewData, detailedRatings);
    alert("掲載リクエストを送信しました！運営の承認をお待ちください。");
    navigate("/mypage");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* 進捗バー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 1 ? "bg-pink-600 text-white" : "bg-slate-700 text-gray-400"
              }`}
            >
              1
            </div>
            <span className="text-white font-bold hidden md:inline">地域選択</span>
          </div>
          <div className="flex-1 h-1 bg-slate-700 mx-4">
            <div
              className={`h-full transition-all ${
                step >= 2 ? "bg-pink-600 w-full" : "bg-slate-700 w-0"
              }`}
            ></div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 2 ? "bg-pink-600 text-white" : "bg-slate-700 text-gray-400"
              }`}
            >
              2
            </div>
            <span className="text-white font-bold hidden md:inline">店舗情報</span>
          </div>
          <div className="flex-1 h-1 bg-slate-700 mx-4">
            <div
              className={`h-full transition-all ${
                step >= 3 ? "bg-pink-600 w-full" : "bg-slate-700 w-0"
              }`}
            ></div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 3 ? "bg-pink-600 text-white" : "bg-slate-700 text-gray-400"
              }`}
            >
              3
            </div>
            <span className="text-white font-bold hidden md:inline">口コミ内容</span>
          </div>
        </div>
      </div>

      {/* ヘッダー */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">新規店舗への口コミ投稿</h1>
        <p className="text-gray-400 text-sm">
          未掲載の店舗やセラピストの口コミを投稿できます
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: 地域選択 */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">地域を選択</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    都道府県 <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={prefecture}
                    onChange={handlePrefectureChange}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-pink-500 focus:outline-none"
                  >
                    <option value="">選択してください</option>
                    {prefectures.map((pref) => (
                      <option key={pref} value={pref}>
                        {pref}
                      </option>
                    ))}
                  </select>
                </div>

                {prefecture && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      市区町村 <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-pink-500 focus:outline-none"
                    >
                      <option value="">選択してください</option>
                      {availableCities.map((cityName) => (
                        <option key={cityName} value={cityName}>
                          {cityName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 「その他」選択時の入力フィールド */}
                {city === "その他" && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      市区町村名を入力 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      placeholder="例: 渋谷区"
                      className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      ※ リストにない市区町村を入力してください
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-3 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-bold transition"
              >
                次へ →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 店舗情報 */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">店舗・セラピスト情報</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    店舗名 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="例: アロマリラクゼーション 渋谷店"
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    正確な店舗名を入力してください
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    セラピスト名 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={therapistName}
                    onChange={(e) => setTherapistName(e.target.value)}
                    placeholder="例: 恵子"
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    源氏名・呼び名を入力してください
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="px-8 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition"
              >
                ← 戻る
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-3 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-bold transition"
              >
                次へ →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 口コミ内容 */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">総合評価 <span className="text-red-400">*</span></h2>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-4xl transition hover:scale-110"
                  >
                    {star <= rating ? "⭐" : "☆"}
                  </button>
                ))}
                <span className="ml-2 text-white font-bold text-2xl">
                  {rating}.0
                </span>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">詳細評価 <span className="text-red-400">*</span></h2>
              <StarRating
                value={detailedRatings.cleanliness}
                onChange={(v) =>
                  setDetailedRatings({ ...detailedRatings, cleanliness: v })
                }
                label="清潔感"
              />
              <StarRating
                value={detailedRatings.appearance}
                onChange={(v) =>
                  setDetailedRatings({ ...detailedRatings, appearance: v })
                }
                label="ルックス"
              />
              <StarRating
                value={detailedRatings.style}
                onChange={(v) =>
                  setDetailedRatings({ ...detailedRatings, style: v })
                }
                label="スタイル"
              />
              <StarRating
                value={detailedRatings.service}
                onChange={(v) =>
                  setDetailedRatings({ ...detailedRatings, service: v })
                }
                label="接客"
              />
              <StarRating
                value={detailedRatings.skill}
                onChange={(v) =>
                  setDetailedRatings({ ...detailedRatings, skill: v })
                }
                label="技術"
              />
              <StarRating
                value={detailedRatings.intensity}
                onChange={(v) =>
                  setDetailedRatings({ ...detailedRatings, intensity: v })
                }
                label="密着度"
              />
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">
                コース・料金情報
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    コース
                  </label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="例: 90分"
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    料金
                  </label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="例: 12,000円"
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">
                口コミ内容 <span className="text-red-400">*</span>
              </h2>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="具体的な感想を書いてください（10文字以上）"
                rows={8}
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-400 mt-2">
                {content.length}文字 / 最低10文字
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">
                タグを選択（複数選択可）
              </h2>
              {Object.entries(tagCategories).map(([category, tags]) => (
                <div key={category} className="mb-6">
                  <h3 className="text-sm font-bold text-pink-400 mb-3">
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition ${
                          selectedTags.includes(tag)
                            ? "bg-pink-600 text-white"
                            : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <h3 className="text-yellow-300 font-bold mb-2">⚠️ 投稿前の注意</h3>
              <ul className="text-yellow-200 text-sm space-y-1">
                <li>• 虚偽の情報や誹謗中傷は禁止です</li>
                <li>• 個人を特定できる情報の記載は控えてください</li>
                <li>• 公序良俗に反する内容は削除される場合があります</li>
                <li>• 投稿後、運営の承認をお待ちください</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="px-8 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition"
              >
                ← 戻る
              </button>
              <button
                type="submit"
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white font-bold transition"
              >
                掲載リクエストを送信
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}