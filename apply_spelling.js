const fs = require('fs');

const data = JSON.parse(fs.readFileSync('assets/data/students.json', 'utf8'));

const recitation = data.categories.find(c => c.id === 'recitation-license').members;
const noorani = data.categories.find(c => c.id === 'noorani-qaida').members;

// Map full exact names first
const fullar2ku = new Map();
recitation.forEach(m => {
  fullar2ku.set(m.name.ar, m.name.ku);
});

// Map individual words
const wordMap = new Map();
recitation.forEach(m => {
  const arWords = m.name.ar.split(' ');
  const kuWords = m.name.ku.split(' ');
  if (arWords.length === kuWords.length) {
    for (let i = 0; i < arWords.length; i++) {
        // If an arabic word maps to multiple kurdish words, maybe pick the most frequent?
        // But in our case they should be very consistent.
        wordMap.set(arWords[i], kuWords[i]);
    }
  }
});

// Add some known compound mappings that might be in Recitation
// We can just find them in Recitation by checking if "عبد الرحمن" is in AR and "عەبدوڕەحمان" in KU.
recitation.forEach(m => {
    // If there's a length mismatch, it's usually compound
    const arStr = m.name.ar;
    const kuStr = m.name.ku;
    // We can extract known compounds
    const compounds = [
      ["عبد الله", "عەبدوڵڵا"],
      ["عبد الرحمن", "عەبدوڕەحمان"],
      ["عبد القادر", "عەبدولقادر"],
      ["عبد الغفور", "عەبدولغەفوور"],
      ["نجم الدين", "نەجمەدین"],
      ["محيي الدين", "موحیەدین"],
      ["نور الدين", "نوورەدین"],
      ["حمه رشيد", "حەمەڕەشید"],
      ["حمه صالح", "حەمەساڵح"],
      ["حمه أمين", "حەمەئەمین"],
      ["حمه سعيد", "حەمەسەعید"],
      ["حمة غريب", "حەمەغەریب"]
    ];
    // They are already mapped manually here for safety.
});

const compounds = [
    { ar: "عبد الله", ku: "عەبدوڵڵا" },
    { ar: "عبد الرحمن", ku: "عەبدوڕەحمان" },
    { ar: "عبد القادر", ku: "عەبدولقادر" },
    { ar: "عبد الغفور", "ku": "عەبدولغەفوور" },
    { ar: "نجم الدين", ku: "نەجمەدین" },
    { ar: "محيي الدين", ku: "موحیەدین" },
    { ar: "نور الدين", ku: "نوورەدین" },
    { ar: "نورالدين", ku: "نوورەدین" },
    { ar: "حمه رشيد", ku: "حەمەڕەشید" },
    { ar: "حمه صالح", ku: "حەمەساڵح" },
    { ar: "حمه أمين", ku: "حەمەئەمین" },
    { ar: "حمه سعيد", ku: "حەمەسەعید" },
    { ar: "حمة غريب", ku: "حەمەغەریب" }
];

let changedCount = 0;

noorani.forEach((m, idx) => {
    const origKu = m.name.ku;
    
    if (fullar2ku.has(m.name.ar)) {
        m.name.ku = fullar2ku.get(m.name.ar);
    } else {
        // We will reconstruct the Kurdish name based on Arabic name words!
        // Wait, NO. What if the Kurdish name has some special kurdish-only prefix?
        // Let's replace only the words we KNOW are misspelled, by finding the expected word for each Arabic word.
        
        let newKuWords = m.name.ku.split(' ');
        let arWords = m.name.ar.split(' ');
        
        // Manual typo replacements based on observation
        let currentKu = m.name.ku;
        
        // Let's just fix the known bad words directly
        let words = currentKu.split(' ');
        words = words.map(w => {
            if (w === "دنیا") return "دونیا";
            if (w === "منیر") return "مونیر";
            if (w === "فرج") return "فەرەج";
            if (w === "شهاب") return "شەهاب";
            if (w === "رۆوف") return "ڕەئووف";
            if (w === "حامد") return "حامید";
            if (w === "سنور") return "سنوور";
            if (w === "عبید") return "عوبەید";
            if (w === "نجیبە") return "نەجیبە";
            if (w === "مهاباد") return "مەهاباد";
            if (w === "تریە") return "ترێ";
            if (w === "نورالدین") return "نوورەدین";
            if (w === "محەممەد") return "موحەممەد";
            return w;
        });
        currentKu = words.join(' ');
        
        // Also fix compounding
        currentKu = currentKu.replace(/نجم الدين/g, 'نەجمەدین');
        currentKu = currentKu.replace(/عبد الله/g, 'عەبدوڵڵا');
        // ...actually if there was a typo in the compound in Noorani it would be in Kurdish.
        // Wait, "نورالدین" is already fixed above.
        
        m.name.ku = currentKu;
    }
    
    if (origKu !== m.name.ku) {
        console.log(`Changed: ${origKu} -> ${m.name.ku}`);
        changedCount++;
    }
});

console.log(`Changed ${changedCount} names in noorani-qaida`);
fs.writeFileSync('assets/data/students.json', JSON.stringify(data, null, 2));

