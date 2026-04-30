import fs from 'fs';

const filePath = 'src/pages/PostReviewPage.jsx';
let code = fs.readFileSync(filePath, 'utf-8');

// 1. Step1_Select コンポーネントに paramShopId を受け取れるようにし、disabled 属性を追加
code = code.replace(
  /const Step1_Select = \({ shops, shopTherapists, selectedShopId, setSelectedShopId }\) => {/,
  'const Step1_Select = ({ shops, shopTherapists, selectedShopId, setSelectedShopId, paramShopId }) => {'
);

code = code.replace(
  /<select[\s\S]*?\{...register\('shopId'\)\}[\s\S]*?value=\{selectedShopId \|\| ''\}/,
  `<select 
            {...register('shopId')}
            value={selectedShopId || ''}
            disabled={!!paramShopId} // URLからIDが来ている場合は操作不可にする
            style={paramShopId ? { opacity: 1, backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'not-allowed' } : {}}`
);

// 2. PostReviewPage の呼び出し部分に paramShopId を渡す
code = code.replace(
  /<Step1_Select[\s\S]*?setSelectedShopId=\{setSelectedShopId\}[\s\S]*?\/>/,
  `<Step1_Select 
                    shops={shops} 
                    shopTherapists={shopTherapists} 
                    selectedShopId={selectedShopId} 
                    setSelectedShopId={setSelectedShopId}
                    paramShopId={paramShopId} 
                  />`
);

// 3. セラピストの抽出ロジックをより強力・確実なものに修正
code = code.replace(
  /const shopTherapists = useMemo\(\(\) => \{[\s\S]*?\}, \[selectedShopId, getTherapistsByShopId\]\);/,
  `const shopTherapists = useMemo(() => {
    if (!selectedShopId || !shops.length) return [];
    // getTherapistsByShopId が空振りした場合のバックアップとして、shops配列から直接セラピストを探す
    const targetShop = shops.find(s => String(s.id) === String(selectedShopId));
    if (targetShop && targetShop.therapists) {
      return targetShop.therapists;
    }
    return getTherapistsByShopId(selectedShopId) || [];
  }, [selectedShopId, shops, getTherapistsByShopId]);`
);

fs.writeFileSync(filePath, code);
console.log("✅ 修正成功！店舗の固定と、セラピストの確実な表示ロジックを組み込みました。");
