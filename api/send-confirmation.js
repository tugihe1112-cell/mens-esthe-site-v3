/**
 * 廃止済みAPIの墓石。
 * ファイル自体を消すとVercel/NextのfallbackがHTMLの404画面をHTTP 200で返し、
 * 旧クライアントや外形監視が確認メール送信に成功したと誤認するため410を固定する。
 */
export default function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json({ error: 'This endpoint has been removed' });
}
