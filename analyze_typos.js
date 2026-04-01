const fs = require('fs');
const data = JSON.parse(fs.readFileSync('assets/data/students.json', 'utf8'));

const recitation = data.categories.find(c => c.id === 'recitation-license').members;
const noorani = data.categories.find(c => c.id === 'noorani-qaida').members;

// Build a dictionary of full Arabic names -> Kurdish names
const fullar2ku = new Map();
recitation.forEach(m => {
  fullar2ku.set(m.name.ar, m.name.ku);
});

// Check how many overlap
let fullMatch = 0;
noorani.forEach(m => {
  if (fullar2ku.has(m.name.ar)) {
    if (fullar2ku.get(m.name.ar) !== m.name.ku) {
      console.log(`FULL TITLE TYPO: AR: ${m.name.ar} | Rec: ${fullar2ku.get(m.name.ar)} | Nor: ${m.name.ku}`);
    } else {
      fullMatch++;
    }
  }
});
console.log(`Matched full Arabic names with identical Kurdish names: ${fullMatch}`);

// Now let's build a word map
// Using naive split by space
const wordMap = new Map();
recitation.forEach(m => {
  const arWords = m.name.ar.split(' ');
  const kuWords = m.name.ku.split(' ');
  if (arWords.length === kuWords.length) {
    for (let i = 0; i < arWords.length; i++) {
        if (!wordMap.has(arWords[i])) {
            wordMap.set(arWords[i], new Set());
        }
        wordMap.get(arWords[i]).add(kuWords[i]);
    }
  } else {
    // console.log(`Length mismatch: ${m.name.ar} -> ${m.name.ku}`);
  }
});

// Find potential word typos in noorani
let typoCount = 0;
noorani.forEach(m => {
  const arWords = m.name.ar.split(' ');
  const kuWords = m.name.ku.split(' ');
  if (arWords.length === kuWords.length) {
    for (let i = 0; i < arWords.length; i++) {
      const expectedSet = wordMap.get(arWords[i]);
      if (expectedSet && !expectedSet.has(kuWords[i])) {
         console.log(`WORD TYPO: AR: ${arWords[i]} | Expected: ${[...expectedSet].join(' or ')} | Found: ${kuWords[i]} (in ${m.name.ku})`);
         typoCount++;
      }
    }
  } else {
    // console.log(`Nor Length mismatch: ${m.name.ar} -> ${m.name.ku}`);
  }
});
console.log(`Found ${typoCount} word typos`);

// Complex replacements like عبدالرحمن
const complexArToKu = new Map();
recitation.forEach(m => {
  const ar = m.name.ar;
  const ku = m.name.ku;
  // Let's identify things like "عبد الرحمن" -> "عەبدوڕەحمان"
  // Actually, we can just replace full words from a sorted by length word/phrase map.
});

