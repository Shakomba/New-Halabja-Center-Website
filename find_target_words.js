const fs = require('fs');
const filePath = 'assets/data/students.json';
const students = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const targetCats = ['tuhfat-alatfal', 'muqaddimah-jazariyyah', 'adhan-iqamah'];

let words = new Set();
let count = 0;

students.categories.forEach(category => {
  if (targetCats.includes(category.id)) {
    category.members.forEach(member => {
      if (member.name && member.name.ku) {
        const kuWords = member.name.ku.split(/\s+/).map(w => w.trim()).filter(Boolean);
        kuWords.forEach(w => words.add(w));
        count++;
      }
    });
  }
});

const sortedWords = Array.from(words).sort();
fs.writeFileSync('target_words.json', JSON.stringify({
  count: count,
  uniqueWords: sortedWords.length,
  words: sortedWords
}, null, 2));

console.log(`Found ${count} names to translate in target categories. Extracted ${sortedWords.length} unique words.`);
