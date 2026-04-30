import fs from 'fs';
import vm from 'vm';

function main() {
  console.log('🔍 locations.js 内の不正なエリアデータ（アルファベット・重複した区）を調査します...\n');

  const filePath = 'src/data/locations.js';
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replaceAll('export const ', 'var ');
  code = code.replaceAll('export let ', 'var ');

  const sandbox = {};
  vm.createContext(sandbox);
  try {
    vm.runInNewContext(code, sandbox);
  } catch (e) {
    console.error('❌ ファイルの読み込みに失敗しました:', e);
    return;
  }

  const wards = sandbox.WARDS || {};

  const alphabetIssues = [];
  const kuIssues = [];

  // 全エリアの親子関係をループして検証
  for (const [parent, children] of Object.entries(wards)) {
    if (!Array.isArray(children)) continue;

    children.forEach(child => {
      if (!child || typeof child !== 'string') return;

      // ① アルファベットのみで構成されているか（半角英数字、アンダースコア、ハイフンなど）
      if (/^[a-zA-Z0-9_\-\s]+$/.test(child)) {
        alphabetIssues.push({ parent, child });
      }

      // ② 親が「〜区」なのに、子要素にも「区」が含まれているか
      if (parent.endsWith('区') && child.includes('区')) {
        kuIssues.push({ parent, child });
      }
    });
  }

  // --- 結果の出力フォーマット ---
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔤 【問題①】アルファベット表記になっている小エリア: ${alphabetIssues.length} 件`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const groupedAlphabet = {};
  alphabetIssues.forEach(({parent, child}) => {
    if (!groupedAlphabet[parent]) groupedAlphabet[parent] = [];
    groupedAlphabet[parent].push(child);
  });
  for (const [parent, children] of Object.entries(groupedAlphabet)) {
    console.log(`📍 ${parent}: ${children.join(', ')}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🏢 【問題②】小エリアに「区」がついている: ${kuIssues.length} 件`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const groupedKu = {};
  kuIssues.forEach(({parent, child}) => {
    if (!groupedKu[parent]) groupedKu[parent] = [];
    groupedKu[parent].push(child);
  });
  for (const [parent, children] of Object.entries(groupedKu)) {
    console.log(`📍 ${parent}: ${children.join(', ')}`);
  }
  
  console.log('\n✅ 調査のみ完了しました（ファイルは一切書き換えていません）。');
}

main();
