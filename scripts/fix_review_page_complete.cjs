const fs = require('fs');
const pagePath = 'src/pages/PostReviewPage.jsx';

console.log('🛠 Fixing PostReviewPage (Selection Logic + Tags)...');

try {
  let content = fs.readFileSync(pagePath, 'utf8');

  // ------------------------------------------
  // 1. セラピスト選択の引継ぎロジック修正
  // ------------------------------------------
  
  // useSearchParams を探す
  if (!content.includes('const [searchParams] = useSearchParams();')) {
     // フックの宣言を追加（なければ）
     const hookRegex = /(export default function.*?\{)/s;
     content = content.replace(hookRegex, '$1\n  const [searchParams] = useSearchParams();');
  }

  // useState(null) を useState(URLの値 || null) に書き換え
  // 修正前: const [selectedTherapistId, setSelectedTherapistId] = useState(null);
  const stateRegex = /const \[selectedTherapistId, setSelectedTherapistId\] = useState\(null\);/;
  
  if (stateRegex.test(content)) {
    content = content.replace(
      stateRegex, 
      "const [selectedTherapistId, setSelectedTherapistId] = useState(searchParams.get('therapistId') || null);"
    );
    console.log('✅ Fixed: Therapist selection logic (now reads URL params).');
  } else {
    // すでに直っているか、書き方が違う場合
    if (content.includes("useState(searchParams.get")) {
      console.log('ℹ️ Selection logic seems already correct.');
    } else {
      console.log('⚠️ Warning: Could not find the exact useState line to fix.');
    }
  }

  // ------------------------------------------
  // 2. タグ機能 (TagSelector) の復活
  // ------------------------------------------
  
  // importの追加
  if (!content.includes('TagSelector')) {
    content = content.replace(
      /(import .*? from 'react';)/,
      "$1\nimport TagSelector from '../components/TagSelector';"
    );
  }

  // Stateの追加
  if (!content.includes('const [selectedTags, setSelectedTags]')) {
    const insertPoint = /const \[selectedTherapistId/;
    content = content.replace(insertPoint, 'const [selectedTags, setSelectedTags] = useState([]);\n  const [selectedTherapistId');
  }

  // 送信データへの追加 (submitData)
  if (!content.includes('tags: selectedTags')) {
    content = content.replace(
      /const submitData = \{/,
      'const submitData = {\n      tags: selectedTags,'
    );
  }

  // UIへの表示
  if (!content.includes('<TagSelector')) {
    const tagUi = `
        {/* --- 🏷 タグ選択エリア --- */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 mb-6">
          <h3 className="text-md font-bold text-slate-200 mb-3 flex items-center gap-2">
            <span>🏷</span> セラピストの特徴 (選択)
          </h3>
          <TagSelector selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
        </div>
        {/* ----------------------- */}
    `;
    
    // フォーム内の、詳細評価(DetailedRatings)の後ろあたりに入れる
    if (content.includes('<DetailedRatings')) {
      // DetailedRatingsコンポーネントの閉じタグの後のdiv閉じタグの後ろ...だと難しいので
      // "CombinedStoryInput" (体験談) の直前に入れるのが確実
      const storyInputRegex = /(<CombinedStoryInput)/;
      content = content.replace(storyInputRegex, `${tagUi}\n$1`);
      console.log('✅ Added: TagSelector UI.');
    }
  }

  fs.writeFileSync(pagePath, content);
  console.log('🎉 PostReviewPage is now fully operational!');

} catch (e) {
  console.error('❌ Error:', e);
}
