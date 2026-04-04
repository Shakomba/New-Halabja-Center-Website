const fs = require('fs');

const dataPath = 'D:/Projects/New-Halabja-Center-Website/assets/data/students.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Provide mappings to standardize Kurdish spelling
const fixMap = {
    // Leftover Arabic variants
    "صابر": "سابیر",
    "صادق": "سادق",
    "صدیق": "سدیق",
    "صلاح": "سەلاح",
    "عاصی": "عاسی",
    "منصور": "مەنسوور",
    "ناصح": "ناسیح",
    "صالح": "ساڵح",
    "محمدصالح": "حەمەساڵح",  
    "حمەصالح": "حەمەساڵح",
    "حەمەصالح": "حەمەساڵح",
    
    // Vocalizations & consistency
    "بکر": "بەکر",
    "جلال": "جەلال",
    "جلیل": "جەلیل",
    "جمال": "جەمال",
    "حمزە": "حەمزە",
    "حمید": "حەمید",
    "حمەرشید": "حەمەڕەشید",
    "حەمەرشید": "حەمەڕەشید",
    "حمەڕەشید": "حەمەڕەشید",
    "حمەسعید": "حەمەسەعید",
    "حەمەسعید": "حەمەسەعید",
    "حمەکریم": "حەمەکەریم",
    "خلیل": "خەلیل",
    "زاهر": "زاهیر",
    "زینب": "زەینەب",
    "سعد": "سەعد",
    "سلمان": "سەلمان",
    "سلیمان": "سلێمان",
    "سنا": "سەنا",
    "شاهد": "شاهید",
    "عباس": "عەباس",
    "غریب": "غەریب",
    "فائق": "فائیق",
    "فتاح": "فەتاح",
    "فرحان": "فەرحان",
    "فلاح": "فەلاح",
    "فهمی": "فەهمی",
    "مختار": "موختار",
    
    // Combining common "حەمە" strings that might have spaces after manual user edit
    "حمە ": "حەمە",
    "حەمە ": "حەمە",
    "عەبدول ": "عەبدول",
    "عەبدوڕ ": "عەبدوڕ"
};

let changes = 0;

data.categories.forEach(c => {
    if (c.members) {
        c.members.forEach(m => {
            if (m.name && m.name.ku) {
                let original = m.name.ku;
                let modified = original;

                // Simple word loop to avoid regex overlaps, preserving names
                // Wait, some mappings might be substrings (e.g. "حمەصالح"). 
                // So let's replace globally but carefully.
                
                // First global replace on combinations
                modified = modified.replace(/محمدصالح/g, "حەمەساڵح");
                modified = modified.replace(/(حمەصالح|حەمەصالح)/g, "حەمەساڵح");
                modified = modified.replace(/(حمەرشید|حەمەرشید|حمەڕەشید)/g, "حەمەڕەشید");
                modified = modified.replace(/(حمەسعید|حەمەسعید)/g, "حەمەسەعید");
                modified = modified.replace(/حمەکریم/g, "حەمەکەریم");
                
                modified = modified.replace(/(حمە|حەمە)\s+/g, 'حەمە');

                // Word replacing for names
                let words = modified.split(/\s+/);
                for(let i=0; i<words.length; i++) {
                    if (fixMap[words[i]]) {
                        words[i] = fixMap[words[i]];
                    }
                }
                modified = words.join(' ');

                if (original !== modified) {
                    m.name.ku = modified;
                    changes++;
                }
            }
        });
    }
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Updated ${changes} names successfully!`);
