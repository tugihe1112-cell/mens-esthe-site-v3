import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/icon-192.png" />
        {/* Google Search Console（旧アカウント発行分・削除しない） */}
        <meta name="google-site-verification" content="anNOZN2xei4Sb_JnJNpsLGSVtx00wOnuz7pw1szbTV8" />
        {/* Google Search Console（tugihe1112@gmail.com 用・2026-08-05追加＝GSC UIアクセス復旧） */}
        <meta name="google-site-verification" content="2JsdZ5Ml3ZJIqZqifqSr4S5mhvb4kQTct3mApIAfoq4" />
        {/* Supabase preconnect */}
        <link rel="preconnect" href="https://azuetkuzzmshqfbrhqmf.supabase.co" />
        <link rel="dns-prefetch" href="https://azuetkuzzmshqfbrhqmf.supabase.co" />
        {/* 画像配信の接続を先に張る＝キャスト写真の初動を速く。
            R2はWorker(workers.dev)配信に移行。crossOriginは付けない（<img>は非CORS取得＝付けると接続が再利用されない）。 */}
        <link rel="preconnect" href="https://mens-esthe-images.tugihe1112.workers.dev" />
        <link rel="dns-prefetch" href="https://mens-esthe-images.tugihe1112.workers.dev" />
        <link rel="preconnect" href="https://wsrv.nl" />
        <link rel="dns-prefetch" href="https://wsrv.nl" />
        {/* ChunkLoadError ガード（_app.jsx の ChunkErrorGuard と同じ役割の“先回り版”）。
            真っ黒事故ではメインのJSチャンク自体が404するためReactが一切起動せず、
            _app.jsx内のリスナーは登録される前に手遅れになる。
            ここ（NextScriptより前）でキャプチャ段階のerrorリスナーを張っておくことで、
            `/_next/static/**.js` の読み込み失敗を検知して1回だけリロードできる。
            sessionStorageのタイムスタンプで無限ループを防止（10分TTL）。 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
  var K='__chunkReloadedAt', TTL=600000;
  window.addEventListener('error', function(e){
    var t=e && e.target; if(!t) return;
    var u=t.src||t.href||'';
    if((t.tagName==='SCRIPT'||t.tagName==='LINK') && u.indexOf('/_next/static/')>-1){
      var last=0; try{last=Number(sessionStorage.getItem(K))||0;}catch(_){return;}
      if(last && Date.now()-last<TTL){console.error('[chunk-guard] reloaded already, stop:',u);return;}
      try{sessionStorage.setItem(K,String(Date.now()));}catch(_){return;}
      console.warn('[chunk-guard] stale HTML detected, reloading:',u);
      window.location.reload();
    }
  }, true);
}catch(_){}})();`,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
