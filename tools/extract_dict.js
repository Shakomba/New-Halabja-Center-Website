const fs = require('fs');

const dataPath = 'D:/Projects/New-Halabja-Center-Website/assets/data/students.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let kuWords = new Set();
// Get all ku words
data.categories.forEach(c => c.members && c.members.forEach(m => {
    if(m.name && m.name.ku) {
        m.name.ku.split(/\s+/).forEach(w => kuWords.add(w));
    }
}));

let map = {};
kuWords.forEach(w => {
    map[w] = { ar: {}, en: {} };
});

data.categories.forEach(c => c.members && c.members.forEach(m => {
    if(m.name && m.name.ku && m.name.ar && m.name.en) {
        let kuArr = m.name.ku.split(/\s+/);
        let arArr = m.name.ar.split(/\s+/);
        let enArr = m.name.en.split(/\s+/);
        
        // Only use 1-to-1 names to seed the dictionary securely
        if(kuArr.length === arArr.length && kuArr.length === enArr.length) {
            for(let i=0; i<kuArr.length; i++) {
                let kw = kuArr[i];
                let aw = arArr[i];
                let ew = enArr[i];
                
                if(map[kw]) {
                    map[kw].ar[aw] = (map[kw].ar[aw] || 0) + 1;
                    map[kw].en[ew] = (map[kw].en[ew] || 0) + 1;
                }
            }
        }
    }
}));

let finalDict = {};
let missing = [];

for(let kw in map) {
    let bestAr = Object.keys(map[kw].ar).sort((a,b) => map[kw].ar[b] - map[kw].ar[a])[0];
    let bestEn = Object.keys(map[kw].en).sort((a,b) => map[kw].en[b] - map[kw].en[a])[0];
    
    if(bestAr && bestEn) {
        finalDict[kw] = { ar: bestAr, en: bestEn };
    } else {
        missing.push(kw);
    }
}

fs.writeFileSync('D:/Projects/New-Halabja-Center-Website/tools/translation_dict.json', JSON.stringify(finalDict, null, 2));
fs.writeFileSync('D:/Projects/New-Halabja-Center-Website/tools/missing_dict.json', JSON.stringify(missing, null, 2));

console.log(`Generated translation_dict.json with ${Object.keys(finalDict).length} entries.`);
console.log(`Missing translations for ${missing.length} composite words (saved to missing_dict.json).`);
