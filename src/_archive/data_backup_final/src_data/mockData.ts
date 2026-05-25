interface Post {
  id: number;
  user: string;
  time: string;
  rating: number;
  content: string;
  
  // プレミアム口コミか
  isPremiumContent?: boolean;  // 追加
  
  // その他既存フィールド...
}