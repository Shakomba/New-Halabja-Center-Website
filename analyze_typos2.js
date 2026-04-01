const fs = require('fs');
const data = JSON.parse(fs.readFileSync('assets/data/students.json', 'utf8'));

const recitation = data.categories.find(c => c.id === 'recitation-license').members;
const noorani = data.categories.find(c => c.id === 'noorani-qaida').members;

// Naive space split
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
    // console.log(`[REC Length mismatch]: ${m.name.ar} -> ${m.name.ku}`);
  }
});

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
    console.log(`[NOR Length mismatch]: AR: ${m.name.ar} -> KU: ${m.name.ku}`);
    // We should also look for standalone words in the string if it's a mismatch
    const kuWordsMismatch = m.name.ku.split(' ');
    kuWordsMismatch.forEach(kw => {
        // Find if this exact word exists as an expected word for ANY arabic word,
        // but it might be misspelled. Or we can just use the expected replacements 
        // derived from all length-matching phrases.
    });
  }
});
console.log(`Found ${typoCount} word typos`);
