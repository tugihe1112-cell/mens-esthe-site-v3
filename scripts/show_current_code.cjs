const fs = require('fs');

const files = [
  'src/pages/PostReviewPage.jsx',
  'src/pages/PostReviewForThreadPage.jsx',
  'src/components/ModernReviewCard.jsx'
];

console.log("==================================================");
console.log("🔍 CURRENT CODE DUMP");
console.log("==================================================");

files.forEach(file => {
  console.log(`\n\n📄 FILE: ${file}`);
  console.log("--------------------------------------------------");
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      console.log(content);
    } else {
      console.log("❌ FILE NOT FOUND");
    }
  } catch (e) {
    console.log("❌ ERROR READING FILE");
  }
  console.log("--------------------------------------------------");
});
