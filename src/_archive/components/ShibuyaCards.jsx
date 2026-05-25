import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ShibuyaCards() {
  const [debugMsg, setDebugMsg] = useState('⏳ データ取得を開始しています...');
  const [shops, setShops] = useState([]);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const { data, error } = await supabase.from('shops').select('*');
        
        if (error) {
          setDebugMsg(`❌ Supabase通信エラー: ${error.message}`);
          return;
        }
        if (!data || data.length === 0) {
          setDebugMsg('⚠️ データが0件です。テーブルが空か、読み込めていません。');
          return;
        }

        let foundCount = 0;
        const shibuyaCards = data.filter(shop => {
          // エラーで落ちないように厳密にチェック（ここで死んでいた可能性大）
          const area = shop.raw_data?.area || '';
          const city = shop.raw_data?.city || '';
          const name = shop.name || '';
          
          if (area.includes('渋谷') || city.includes('渋谷') || name.includes('渋谷')) {
            foundCount++;
            return true;
          }
          return false;
        });

        if (foundCount === 0) {
          setDebugMsg(`⚠️ 全 ${data.length} 件の店舗データを取得しましたが、「渋谷」という文字が含まれる店舗が1件もありませんでした。`);
        } else {
          setDebugMsg(`✅ 全 ${data.length} 件中、${foundCount} 件の渋谷エリア店舗を発見しました！`);
          setShops(shibuyaCards);
        }

      } catch (err) {
        setDebugMsg(`💥 プログラムクラッシュ: ${err.message}`);
      }
    };
    fetchShops();
  }, []);

  return (
    <div className="p-6 bg-slate-800 border-2 border-red-500 rounded-xl text-white">
      <h2 className="text-xl font-black text-red-400 mb-2">【原因究明パネル】</h2>
      <p className="mb-4 text-lg font-bold text-yellow-300">{debugMsg}</p>
      
      {shops.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shops.map(s => (
            <div key={s.id} className="p-3 bg-slate-900 rounded border border-slate-700">
              <p className="font-bold">{s.name}</p>
              <p className="text-xs text-slate-400">city: {s.raw_data?.city || 'なし'} / area: {s.raw_data?.area || 'なし'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
