// ========================================
// validation.js - バリデーションヘルパー
// ========================================

/**
 * 口コミ投稿のバリデーション
 */
export const validateReviewPost = (data) => {
  const errors = [];

  // 総合評価チェック
  if (!data.rating || data.rating === 0) {
    errors.push("総合評価を選択してください");
  }

  // 詳細評価チェック
  const detailedRatings = data.detailedRatings || {};
  const ratingLabels = {
    cleanliness: "清潔感",
    appearance: "ルックス",
    style: "スタイル",
    service: "接客",
    skill: "技術",
    intensity: "密着度",
  };

  for (const [key, label] of Object.entries(ratingLabels)) {
    if (!detailedRatings[key] || detailedRatings[key] === 0) {
      errors.push(`${label}の評価を選択してください`);
    }
  }

  // 口コミ内容チェック
  if (!data.content || data.content.trim().length === 0) {
    errors.push("口コミ内容を入力してください");
  } else if (data.content.trim().length < 10) {
    errors.push(`口コミ内容は10文字以上入力してください（現在: ${data.content.trim().length}文字）`);
  } else if (data.content.trim().length > 5000) {
    errors.push("口コミ内容は5000文字以内で入力してください");
  }

  // 禁止ワードチェック（簡易版）
  const forbiddenWords = ["死ね", "殺す", "バカ"];
  const hasForbiddenWord = forbiddenWords.some((word) =>
    data.content.includes(word)
  );
  if (hasForbiddenWord) {
    errors.push("不適切な表現が含まれています");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * メールアドレスのバリデーション
 */
export const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: "メールアドレスを入力してください" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "有効なメールアドレスを入力してください" };
  }

  return { isValid: true, error: null };
};

/**
 * パスワードのバリデーション
 */
export const validatePassword = (password) => {
  if (!password || password.length === 0) {
    return { isValid: false, error: "パスワードを入力してください" };
  }

  if (password.length < 8) {
    return { isValid: false, error: "パスワードは8文字以上で入力してください" };
  }

  if (password.length > 100) {
    return { isValid: false, error: "パスワードは100文字以内で入力してください" };
  }

  return { isValid: true, error: null };
};

/**
 * 必須フィールドのチェック
 */
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === "string" && value.trim().length === 0)) {
    return { isValid: false, error: `${fieldName}は必須です` };
  }
  return { isValid: true, error: null };
};

/**
 * 数値範囲のチェック
 */
export const validateNumberRange = (value, min, max, fieldName) => {
  const num = Number(value);
  
  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName}は数値で入力してください` };
  }

  if (num < min || num > max) {
    return { isValid: false, error: `${fieldName}は${min}〜${max}の範囲で入力してください` };
  }

  return { isValid: true, error: null };
};