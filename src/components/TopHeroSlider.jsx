// src/components/TopHeroSlider.jsx
import React, { useState, useEffect } from "react";

const slides = [
  {
    id: 1,
    image: "https://placehold.jp/900x350.png?text=広告枠A",
    alt: "広告枠A",
    link: "/shops/1",        // ダミー。あとで本物のURLに差し替え
  },
  {
    id: 2,
    image: "https://placehold.jp/900x350.png?text=広告枠B",
    alt: "広告枠B",
    link: "/shops/2",
  },
  {
    id: 3,
    image: "https://placehold.jp/900x350.png?text=広告枠C",
    alt: "広告枠C",
    link: "/shops/3",
  },
];

export default function TopHeroSlider() {
  const [index, setIndex] = useState(0);

  // 自動スライド（いらなければこのuseEffectを消せばOK）
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const goPrev = () => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="w-full flex justify-center mt-6 mb-4">
      <div
        className="
          relative overflow-hidden rounded-2xl
          border border-white/10 shadow-xl
          w-full max-w-5xl
          h-36 md:h-48 lg:h-56
          bg-slate-900/60
        "
      >
        {/* スライド本体 */}
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide) => (
            <a
              key={slide.id}
              href={slide.link}
              className="w-full h-full flex-none"
            >
              <img
                src={slide.image}
                alt={slide.alt}
                className="w-full h-full object-cover"
              />
            </a>
          ))}
        </div>

        {/* 左右ボタン */}
        <button
          type="button"
          onClick={goPrev}
          className="
            absolute left-3 top-1/2 -translate-y-1/2
            h-8 w-8 md:h-10 md:w-10
            rounded-full bg-black/40 hover:bg-black/70
            flex items-center justify-center
            text-white text-lg md:text-xl
          "
        >
          ‹
        </button>
        <button
          type="button"
          onClick={goNext}
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            h-8 w-8 md:h-10 md:w-10
            rounded-full bg-black/40 hover:bg-black/70
            flex items-center justify-center
            text-white text-lg md:text-xl
          "
        >
          ›
        </button>

        {/* 下のドット（現在位置のインジケータ） */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => setIndex(i)}
              className={`
                h-2.5 w-2.5 rounded-full
                ${i === index ? "bg-pink-400" : "bg-white/40"}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
