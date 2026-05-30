/**
 * GET /api/og?shop=店舗名&image=画像URL&sub=サブテキスト
 * 動的OGP画像生成（1200x630）
 * @vercel/og の Edge Runtime を使用
 */
import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('shop') || 'メンエスマップ';
  const sub   = searchParams.get('sub')  || 'メンズエステ 口コミ・店舗検索';
  const imageUrl = searchParams.get('image');

  // 画像を取得（外部URLはfetchしてbase64に変換）
  let imgData = null;
  if (imageUrl) {
    try {
      const imgRes = await fetch(imageUrl);
      if (imgRes.ok) {
        const buf = await imgRes.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        const mime = imgRes.headers.get('content-type') || 'image/jpeg';
        imgData = `data:${mime};base64,${base64}`;
      }
    } catch (_) {}
  }

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 100%)',
          position: 'relative',
          overflow: 'hidden',
        },
        children: [
          // 背景画像（右半分）
          imgData && {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                right: 0,
                top: 0,
                width: '520px',
                height: '630px',
                overflow: 'hidden',
              },
              children: [{
                type: 'img',
                props: {
                  src: imgData,
                  style: {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top',
                    opacity: 0.6,
                  },
                },
              }],
            },
          },
          // 右側グラデーション（画像との境界）
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                right: 0,
                top: 0,
                width: '620px',
                height: '630px',
                background: 'linear-gradient(to right, #0a0a1a 0%, transparent 40%)',
              },
            },
          },
          // 左側コンテンツ
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                left: 0,
                top: 0,
                width: '700px',
                height: '630px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '60px',
              },
              children: [
                // ロゴ
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '22px',
                      fontWeight: '900',
                      color: '#aaa',
                      marginBottom: '32px',
                      letterSpacing: '2px',
                    },
                    children: 'Mens Esthe.Map',
                  },
                },
                // メインタイトル
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: title.length > 12 ? '44px' : '56px',
                      fontWeight: '900',
                      color: '#ffffff',
                      lineHeight: 1.2,
                      marginBottom: '20px',
                    },
                    children: title,
                  },
                },
                // サブテキスト
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '24px',
                      color: '#cc88ff',
                      fontWeight: '600',
                    },
                    children: sub,
                  },
                },
                // ピンクライン装飾
                {
                  type: 'div',
                  props: {
                    style: {
                      marginTop: '40px',
                      width: '80px',
                      height: '4px',
                      background: 'linear-gradient(to right, #ff4488, #cc44ff)',
                      borderRadius: '2px',
                    },
                  },
                },
              ],
            },
          },
        ].filter(Boolean),
      },
    },
    {
      width: 1200,
      height: 630,
    }
  );
}
