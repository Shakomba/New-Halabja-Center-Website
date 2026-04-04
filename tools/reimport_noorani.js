const fs = require('fs');

const xml = fs.readFileSync('D:/Projects/New-Halabja-Center-Website/temp_docx/word/document.xml', 'utf8');

const rows = xml.match(/<w:tr[\s>].*?<\/w:tr>/g);
if (!rows) {
    console.error("No rows found");
    process.exit(1);
}

const dataPath = 'D:/Projects/New-Halabja-Center-Website/assets/data/students.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const recitation = data.categories.find(c => c.id === 'recitation-license').members;

// Master Dictionaries
const dictAR = new Map();
const dictKU = new Map();
const dictFull = new Map();

for (const m of recitation) {
    dictFull.set(m.name.ar, m.name);
    dictFull.set(m.name.ku, m.name);
    
    const arWords = m.name.ar.split(' ');
    const kuWords = m.name.ku.split(' ');
    const enWords = (m.name.en || '').split(' ');
    
    if (arWords.length === kuWords.length) {
        for (let i = 0; i < arWords.length; i++) {
            const entry = { ar: arWords[i], ku: kuWords[i], en: enWords[i] || '' };
            dictAR.set(arWords[i], entry);
            dictKU.set(kuWords[i], entry);
            
            // Add stripped AR variant (without hamza etc) to catch more
            const strippedAr = arWords[i].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
            if(!dictAR.has(strippedAr)) dictAR.set(strippedAr, entry);
        }
    }
}

// Additional manual seed words (from common recitation/kurdish mappings)
const manualWords = [
    { ar: 'عبد', ku: 'عەبد', en: 'Abd' },
    { ar: 'الله', ku: 'وڵڵا', en: 'Ullah' },
    { ar: 'عبدالله', ku: 'عەبدوڵڵا', en: 'Abdullah' },
    { ar: 'عبدالرحمن', ku: 'عەبدوڕەحمان', en: 'Abdulrahman' },
    { ar: 'عبدالرحيم', ku: 'عەبدولڕەحیم', en: 'Abdulrahim' },
    { ar: 'عبدالغفور', ku: 'عەبدولغەفوور', en: 'Abdulghafoor' },
    { ar: 'نجم', ku: 'نەجم', en: 'Najm' },
    { ar: 'الدين', ku: 'ەدین', en: 'addin' }, // e.g. نەجمەدین
    { ar: 'محيي', ku: 'موحی', en: 'Muhi' }, 
    { ar: 'محمود', ku: 'مەحموود', en: 'Mahmoud' },
    { ar: 'محمد', ku: 'موحەممەد', en: 'Mohammed' },
    { ar: 'احمد', ku: 'ئەحمەد', en: 'Ahmed' },
    { ar: 'أحمد', ku: 'ئەحمەد', en: 'Ahmed' },
    { ar: 'عمر', ku: 'عومەر', en: 'Omar' },
    { ar: 'علي', ku: 'عەلی', en: 'Ali' },
    { ar: 'حسن', ku: 'حەسەن', en: 'Hassan' },
    { ar: 'حسين', ku: 'حوسێن', en: 'Hussein' },
    { ar: 'مصطفى', ku: 'مستەفا', en: 'Mustafa' },
    { ar: 'كريم', ku: 'کەریم', en: 'Karim' },
    { ar: 'عزيز', ku: 'عەزیز', en: 'Aziz' },
    { ar: 'صالح', ku: 'ساڵح', en: 'Salih' },
    { ar: 'عثمان', ku: 'عوسمان', en: 'Othman' },
    { ar: 'رؤوف', ku: 'ڕەئووف', en: 'Rauf' },
    { ar: 'غفور', ku: 'غەفوور', en: 'Ghafoor' },
    { ar: 'توفيق', ku: 'تۆفیق', en: 'Tawfiq' },
    { ar: 'فريدون', ku: 'فەرەیدوون', en: 'Faraidoon' },
    { ar: 'لقمان', ku: 'لوقمان', en: 'Luqman' },
    { ar: 'خالد', ku: 'خالید', en: 'Khalid' },
    { ar: 'فاروق', ku: 'فارووق', en: 'Farooq' },
    { ar: 'اسماعيل', ku: 'ئیسماعیل', en: 'Ismail' },
    { ar: 'إسماعيل', ku: 'ئیسماعیل', en: 'Ismail' },
    { ar: 'صباح', ku: 'سەباح', en: 'Sabah' },
    { ar: 'غفار', ku: 'غەفار', en: 'Ghaffar' },
    { ar: 'ميرزا', ku: 'میرزا', en: 'Mirza' },
    { ar: 'جميل', ku: 'جەمیل', en: 'Jameel' },
    { ar: 'سعيد', ku: 'سەعید', en: 'Saeed' },
    { ar: 'قادر', ku: 'قادر', en: 'Qadir' },
    { ar: 'حسن', ku: 'حەسەن', en: 'Hassan' },
    { ar: 'مجيد', ku: 'مەجید', en: 'Majeed' },
    { ar: 'طاهر', ku: 'تاهیر', en: 'Tahir' },
    { ar: 'سحر', ku: 'سەحەر', en: 'Sahar' },
    { ar: 'شهلاء', ku: 'شەهلا', en: 'Shahla' },
    { ar: 'دنيا', ku: 'دونیا', en: 'Dunya' },
    { ar: 'دُنيا', ku: 'دونیا', en: 'Dunya' }
];

for(let m of manualWords) {
    if (!dictAR.has(m.ar)) dictAR.set(m.ar, m);
    if (!dictKU.has(m.ku)) dictKU.set(m.ku, m);
}

function decodeAliKWord(word) {
    let t = word;
    t = t.replace(/يَ/g, 'ێ');
    t = t.replace(/رِ/g, 'ڕ');
    t = t.replace(/ؤ/g, 'ۆ');
    t = t.replace(/وَ/g, 'ۆ');
    t = t.replace(/لَا/g, 'ڵا');
    t = t.replace(/لَ/g, 'ڵ');
    // Fatha in AliK means 'ە' mostly
    t = t.replace(/َ/g, 'ە').replace(/ِ/g, '').replace(/ُ/g, ''); 
    t = t.replace(/ط/g, 'گ');
    t = t.replace(/ظ/g, 'ڤ');
    t = t.replace(/ث/g, 'پ');
    t = t.replace(/ض/g, 'چ');
    t = t.replace(/ذ/g, 'ژ');
    t = t.replace(/ي/g, 'ی');
    t = t.replace(/ى/g, 'ی');
    t = t.replace(/ك/g, 'ک');
    t = t.replace(/ة/g, 'ە');
    // clean multiple ە
    t = t.replace(/ەە+/g, 'ە');
    // fix known weird ones
    if (t.endsWith('ه')) t = t.substring(0, t.length - 1) + 'ە'; 
    return t;
}

function toEnglish(kur) {
    const letters = {
      'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh',
      'د': 'd', 'ر': 'r', 'ڕ': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh',
      'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ڤ': 'v', 'ق': 'q', 'ک': 'k', 'ك': 'k', 'گ': 'g',
      'ل': 'l', 'ڵ': 'll', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ە': 'a',
      'و': 'w', 'ۆ': 'o', 'ی': 'y', 'ێ': 'e', 'ئ': ''
    };
    let en = '';
    for (let char of kur) {
      if (letters[char] !== undefined) en += letters[char];
      else en += char;
    }
    return en.charAt(0).toUpperCase() + en.slice(1);
}

function processName(rawStr) {
    let arClean = rawStr.replace(/[َُِ]/g, '');
    if (dictFull.has(arClean)) return dictFull.get(arClean);
    
    let words = rawStr.split(/\s+/);
    let finalKu = [];
    let finalAr = [];
    let finalEn = [];
    
    for (let i = 0; i < words.length; i++) {
        let w = words[i];
        let wClean = w.replace(/[َُِ]/g, '');
        
        let dec = decodeAliKWord(w);
        
        if (dictAR.has(wClean)) {
            let mapping = dictAR.get(wClean);
            finalKu.push(mapping.ku);
            finalAr.push(mapping.ar);
            finalEn.push(mapping.en);
        } else if (dictKU.has(dec)) {
            let mapping = dictKU.get(dec);
            finalKu.push(mapping.ku);
            finalAr.push(mapping.ar);
            finalEn.push(mapping.en);
        } else {
            // Check for compound like "عبدالرحمن" or "عبد الله"
            // Wait, we split by space, so they are separate words.
            // If it's a known kurdish name like "شةرمين" -> "شەرمین"
            finalKu.push(dec);
            // generate AR by swapping kurdish letters to standard if not found
            let arW = wClean.replace(/ط/g, 'ط').replace(/ي/g, 'ي').replace(/ة/g, 'ة').replace(/ك/g, 'ك');
            // actually if they used ط for گ, the Arabic equivalent is usually غ or ج or stays گ in persian. 
            // the safest is to strip kurdish letters back to AR equivalents for `m.name.ar`
            arW = dec.replace(/ێ/g, 'ي').replace(/ۆ/g, 'و').replace(/ە/g, 'ة').replace(/ڕ/g, 'ر').replace(/ڵ/g, 'ل').replace(/ی/g, 'ي').replace(/ک/g, 'ك');
            finalAr.push(arW);
            finalEn.push(toEnglish(dec));
        }
    }
    
    // Fix compounds
    let kuName = finalKu.join(' ').replace(/عەبد وڵڵا/g, 'عەبدوڵڵا').replace(/نەجم ەدین/g, 'نەجمەدین').replace(/موحی ەدین/g, 'موحیەدین').replace(/عەبد وڕەحمان/g, 'عەبدوڕەحمان');
    let arName = finalAr.join(' ').replace(/عبد الله/g, 'عبدالله').replace(/عبد الرحمن/g, 'عبدالرحمن');
    let enName = finalEn.join(' ').replace(/Abd Ullah/i, 'Abdullah').replace(/Abd Ulrahman/i, 'Abdulrahman');
    
    return {
        ku: kuName,
        ar: arName,
        en: enName
    };
}

const students = [];

for (let r of rows) {
    const cells = r.match(/<w:tc[\s>].*?<\/w:tc>/g);
    if (!cells) continue;
    
    const rowData = cells.map(c => {
      const texts = c.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
      return texts.map(t => t.replace(/<[^>]+>/g, '')).join('').trim();
    });
    
    let idIndex = rowData.findIndex(x => x && x.match(/^\d+$/));
    if (idIndex === -1 && rowData[0] && rowData[0].match(/^\d+/)) {
        const match = rowData[0].match(/^(\d+)(.*)/);
        if(match) {
            rowData[0] = match[1];
            rowData.splice(1, 0, match[2]);
            idIndex = 0;
        }
    }
    
    let dateGreg = rowData.find(x => x.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) || '';
    
    if (idIndex !== -1 && rowData.length > idIndex + 1) {
        let id = rowData[idIndex];
        if (id === '3541') id = '351'; 
        let rawName = rowData[idIndex + 1];
        
        if(!rawName || rawName.length < 3) rawName = rowData[idIndex + 2] || rawName;
        if(!rawName || rawName.length < 3) continue;
        
        rawName = rawName.replace(/\s+/g, ' ').trim();
        let processed = processName(rawName);
        
        dateGreg = dateGreg.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
        
        students.push({
            id: id,
            name: processed,
            date: dateGreg,
            _raw: rawName
        });
    }
}

const nq = data.categories.find(c => c.id === 'noorani-qaida');
const oldMembers = [...nq.members];

nq.members = [];

for (let newMem of students) {
    // Preserve staff by id or name
    let old = oldMembers.find(o => o.certNumber === newMem.id);
    if (!old) { // fallback check by name
        old = oldMembers.find(o => o.name.ku === newMem.name.ku);
    }
    
    let finalStudent = {
      name: newMem.name,
      certNumber: newMem.id,
      date: newMem.date
    };
    
    if (old && old.role) {
        finalStudent.role = old.role;
        // Keep their manually set name if they are staff and it was specifically curated
        // Or better yet, we just apply the mapped name because it is more accurate.
    }
    
    nq.members.push(finalStudent);
}

// Re-add unparsed staff
for (let old of oldMembers) {
    if(!nq.members.find(m => m.certNumber === old.certNumber)) {
        nq.members.push(old);
    }
}

nq.members.sort((a,b) => parseInt(a.certNumber||1000) - parseInt(b.certNumber||1000));

// Dry run output
for(let i=0; i<10; i++) {
    console.log(students[i].id, '=>', students[i]._raw);
    console.log('   KU:', students[i].name.ku);
    console.log('   AR:', students[i].name.ar);
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Extracted Noorani count: ' + students.length);
