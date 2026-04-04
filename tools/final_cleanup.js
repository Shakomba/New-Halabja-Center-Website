const fs = require('fs');

const file = 'D:/Projects/New-Halabja-Center-Website/assets/data/students.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Added extra overrides specifically for things spotted:
const arOverrides = {
  "ئەولمحەممەد": "أول محمد", "فائیق": "فائق", "زاهیر": "زاهر"
};

const enOverrides = {
  "مەنسوور": "Mansour", "عاسی": "Aasi", "ناسیح": "Nasih", "سەلاح": "Salah", "فائیق": "Faiq"
};

let changes = 0;

data.categories.forEach(c => {
    if (c.members) {
        c.members.forEach(m => {
            if (m.name && m.name.ku) {
                let kuWords = m.name.ku.split(/\s+/);
                
                let newAr = kuWords.map(w => {
                    // Check if there is an explicit override provided earlier or now
                    if (arOverrides[w]) return arOverrides[w];
                    
                    // Start from the current word
                    let ar = w;
                    
                    // Replace ALL Kurdish distinct alphabets with Arabic standard equivalents
                    ar = ar.replace(/ڕ/g, "ر").replace(/ڵ/g, "ل")
                           .replace(/ڤ/g, "ف").replace(/پ/g, "ب")
                           .replace(/چ/g, "ش").replace(/گ/g, "غ")
                           .replace(/ۆ/g, "و").replace(/ێ/g, "ي")
                           .replace(/ژ/g, "ج").replace(/وو/g, "و")
                           .replace(/ی/g, "ي") // Fix Kurdish Ya to Arabic Yaa
                           .replace(/ێ/g, "ي"); 
                           
                    // Intelligent 'ە' handler (Fatha / Ta Marbuta mapping)
                    ar = ar.replace(/ە/g, (match, offset, str) => {
                        return offset === str.length - 1 ? 'ة' : '';
                    });
                    
                    return ar;
                }).join(' ').trim();
                
                // Fallback loop over English replacements
                let newEn = m.name.en;
                // Spot-fix any old arabic characters in English (like Mnصwr)
                newEn = newEn.replace(/ص/g, "s").replace(/غ/g, "gh").replace(/ط/g, "t").replace(/ض/g, "dh").replace(/ظ/g, "dh").replace(/ث/g, "th").replace(/ذ/g, "dh");
                
                // Spot-fix explicit ones
                for (let kw in enOverrides) {
                    if (m.name.ku.includes(kw)) {
                        newEn = newEn.replace(new RegExp(kw, 'g'), enOverrides[kw]);
                    }
                }

                if (m.name.ar !== newAr || m.name.en !== newEn) {
                   m.name.ar = newAr;
                   m.name.en = newEn;
                   changes++;
                }
            }
        });
    }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log(`Successfully patched Arabic 'ي' and stray characters in ${changes} entries.`);
