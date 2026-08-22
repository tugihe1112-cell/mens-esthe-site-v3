// 旧ページはデモ用localStorageだけへ保存し、実際の投稿にならない状態だった。
// 現行の投稿画面には「リストにいない店舗・セラピスト」の正式経路があるため一本化する。
export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/post-review',
      permanent: false,
    },
  };
}

export default function RequestReviewRedirect() {
  return null;
}
