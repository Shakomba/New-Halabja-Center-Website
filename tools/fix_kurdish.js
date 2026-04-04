const fs = require('fs');

const dataPath = 'D:/Projects/New-Halabja-Center-Website/assets/data/students.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const fixMap = {
    "موحەممەد": "محەممەد",
    "أکبر": "ئەکبەر",
    "أورحمان": "ئەورەحمان",
    "إیمان": "ئیمان",
    "إبراهیم": "ئیبراهیم",
    "أکرم": "ئەکرەم",
    "إسراء": "ئیسرا",
    "آلاء": "ئالا",
    "أرکان": "ئەرکان",
    "أول": "ئەووەل",
    "أنس": "ئەنەس",
    "عبدالأمیر": "عەبدولئەمیر",
    "أبوبکر": "ئەبووبەکر",
    "محمدأمین": "محەممەدئەمین",
    "إلهام": "ئیلهام",
    "نبأ": "نەبەئ",
    "إیناس": "ئیناس",
    "أسماء": "ئەسما",
    "حمەأمین": "حەمەئەمین",
    "أبو": "ئەبوو",
    "إلیاس": "ئیلیاس",
    "أیوب": "ئەییووب",
    "أسامە": "ئوسامە",
    "عبدالرحمن": "عەبدوڕەحمان",
    "عبدالله": "عەبدوڵڵا",
    "عبدالرحیم": "عەبدولڕەحیم",
    "عبدالقادر": "عەبدولقادر"
};

let changes = 0;

data.categories.forEach(c => {
    if (c.members) {
        c.members.forEach(m => {
            if (m.name && m.name.ku) {
                let original = m.name.ku;
                let modified = original;

                // Replace specific words
                // Doing this word by word matching or using global replace
                // because of names like "محمدأمین" might be mixed. Let's do simple global replace on strings
                
                // First global replace on "موحەممەد" -> "محەممەد"
                modified = modified.replace(/موحەممەد/g, "محەممەد");

                // Then other specific fixes
                for (let [ar, ku] of Object.entries(fixMap)) {
                    if(ar !== "موحەممەد") { // already did it
                        modified = modified.replace(new RegExp(ar, 'g'), ku);
                    }
                }

                // Generic Character fixes, just in case they slipped through
                modified = modified.replace(/ي/g, 'ی');
                modified = modified.replace(/ك/g, 'ک');
                modified = modified.replace(/ة/g, 'ە');
                modified = modified.replace(/أ/g, 'ئە'); // generic fallback
                modified = modified.replace(/إ/g, 'ئی'); // generic fallback
                modified = modified.replace(/آ/g, 'ئا'); // generic fallback

                // Fix any potential double 'ە' or 'ئی' that string replacements might have caused if they were already partial
                modified = modified.replace(/ئەئە/g, 'ئە').replace(/ئیئی/g, 'ئی').replace(/ەە+/g, 'ە');

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
