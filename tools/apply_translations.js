const fs = require('fs');

const arDict = JSON.parse(fs.readFileSync('D:/Projects/New-Halabja-Center-Website/tools/final_ar_dict.json', 'utf8'));
const enDict = JSON.parse(fs.readFileSync('D:/Projects/New-Halabja-Center-Website/tools/final_en_dict.json', 'utf8'));

const file = 'D:/Projects/New-Halabja-Center-Website/assets/data/students.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

let changes = 0;

data.categories.forEach(c => {
    if (c.members) {
        c.members.forEach(m => {
            if (m.name && m.name.ku) {
                let kuWords = m.name.ku.split(/\s+/);
                
                let newAr = kuWords.map(w => {
                    if(!arDict[w]) console.log("Missing AR for:", w);
                    return arDict[w] || w;
                }).join(' ').replace(/\s+/g, ' ').trim();
                
                let newEn = kuWords.map(w => {
                    if(!enDict[w]) console.log("Missing EN for:", w);
                    return enDict[w] || w;
                }).join(' ').replace(/\s+/g, ' ').trim();

                if(m.name.ar !== newAr || m.name.en !== newEn) {
                   m.name.ar = newAr;
                   m.name.en = newEn;
                   changes++;
                }
            }
        });
    }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log(`Applied translations to ${changes} entries successfully.`);
