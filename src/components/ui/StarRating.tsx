// src/components/ui/StarRating.tsx
import { useState } from "react";

export interface StarRatingProps {
  rating: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
}

export default function StarRating({
  rating,
  interactive = false,
  onChange,
  size = "md",
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number>(0);

  const handleClick = (value: number) => {
    if (interactive && onChange) onChange(value);
  };

  const handleEnter = (value: number) => {
    if (interactive) setHoverRating(value);
  };

  const handleLeave = () => {
    if (interactive) setHoverRating(0);
  };

  const sizeClass =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-lg" : "text-xl";

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((value) => {
        const isFilled = value <= (hoverRating || rating);
        return (
          <span
            key={value}
            className={`
              ${sizeClass}
              ${isFilled ? "text-yellow-400" : "text-gray-600"}
              ${interactive ? "cursor-pointer hover:scale-125 transition" : ""}
            `}
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleEnter(value)}
            onMouseLeave={handleLeave}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}
