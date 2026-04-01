const fs = require('fs');

const xml = fs.readFileSync('D:/New-Halabja-Center-Website/temp_docx/word/document.xml', 'utf8');

const rows = xml.match(/<w:tr[\s>].*?<\/w:tr>/g);
if (!rows) process.exit(1);

const aliKToUni = {
  'ط': 'گ', 'ظ': 'ڤ', 'ث': 'پ', 'ض': 'چ', 'ذ': 'ژ', 'رِ': 'ڕ',
  'يَ': 'ێ', 'ؤ': 'ۆ', 'وَ': 'ۆ', 'ة': 'ە', 'ه': 'ه', 'ي': 'ی', 'ك': 'ک', 'ى': 'ی'
};

const kurdishFixes = [
  // Names specifically mentioned by user:
  { p: /شەلاء|شهلاء|شەهلاَ|شهلاَ/g, r: 'شەهلا' },
  { p: /گوڵاڵەە|طۆلالة|طولَالَة|گۆلالە|گۆلاڵە|گولالە/g, r: 'گوڵاڵە' },
  { p: /ەەتاو|هەتاو|هةتاو/g, r: 'هەتاو' },
  { p: /زینب|زينب|زەینەبە/g, r: 'زەینەب' },
  { p: /سحر|سەحر/g, r: 'سەحەر' },
  { p: /هدی|هدى|هدیە/g, r: 'هودا' }, // wait, hediye or huda? 'هدى' is Huda (هودا). 'هدية' is Hediya (هەدیە).
  { p: /هدية|هدیە/g, r: 'هەدیە' },
  { p: /سيهام|سهام/g, r: 'سیهام' },
  
  // Generic Arabic to Kurdish mappings
  { p: /عبدالله/g, r: 'عەبدوڵڵا' },
  { p: /عبدالرحمن|عەبدولڕەحمان/g, r: 'عەبدوڕەحمان' },
  { p: /محمود/g, r: 'مەحموود' },
  { p: /صالح/g, r: 'ساڵح' },
  { p: /أحمد|احمد|ئەحمەد/g, r: 'ئەحمەد' },
  { p: /عمر/g, r: 'عومەر' },
  { p: /حسین|حسين/g, r: 'حوسێن' },
  { p: /حسن/g, r: 'حەسەن' },
  { p: /إبراهیم|إبراهيم|ابراهیم/g, r: 'ئیبراهیم' },
  { p: /عثمان/g, r: 'عوسمان' },
  { p: /کریم|كريم/g, r: 'کەریم' },
  { p: /عزیز|عزيز/g, r: 'عەزیز' },
  { p: /قادر/g, r: 'قادر' },
  { p: /مجید|مجيد/g, r: 'مەجید' },
  { p: /صدیق|صديق/g, r: 'سدیق' },
  { p: /امین|أمین|أمين|امين/g, r: 'ئەمین' },
  { p: /طاهر/g, r: 'تاهیر' },
  { p: /خالد/g, r: 'خالید' },
  { p: /طارق/g, r: 'تارق' },
  { p: /اسماعیل|إسماعیل|إسماعيل|اسماعيل/g, r: 'ئیسماعیل' },
  { p: /مصطفی|مصطفى/g, r: 'مستەفا' },
  { p: /رؤوف|رئوف|رأوف/g, r: 'ڕەئووف' },
  { p: /سعید|سعيد/g, r: 'سەعید' },
  { p: /توفیق|توفيق/g, r: 'تۆفیق' },
  { p: /اکرم|ئەکرەم|أکرم/g, r: 'ئەکرەم' },
  { p: /فاروق/g, r: 'فارووق' },
  { p: /جلال/g, r: 'جەلال' },
  { p: /جمال/g, r: 'جەمال' },
  { p: /عادل/g, r: 'عادل' },
  { p: /کمال/g, r: 'کەمال' },
  { p: /اراس/g, r: 'ئاراس' },
  { p: /آرام/g, r: 'ئارام' },
  { p: /اسعد/g, r: 'ئەسعەد' },
  { p: /انور|أنور/g, r: 'ئەنوەر' },
  { p: /ئومید|ئومێد/g, r: 'ئومێد' },
  { p: /بختیار|بەختیار/g, r: 'بەختیار' },
  { p: /بکر/g, r: 'بەکر' },
  { p: /تحسین/g, r: 'تەحسین' },
  { p: /جبار/g, r: 'جەبار' },
  { p: /جعفر/g, r: 'جەعفەر' },
  { p: /حمید/g, r: 'حەمید' },
  { p: /خلیل/g, r: 'خەلیل' },
  { p: /رستم/g, r: 'ڕوستەم' },
  { p: /رشید/g, r: 'ڕەشید' },
  { p: /رفیق/g, r: 'ڕەفیق' },
  { p: /زاهر/g, r: 'زاهیر' },
  { p: /سردار/g, r: 'سەردار' },
  { p: /سلام/g, r: 'سەلام' },
  { p: /سلیمان/g, r: 'سولەیمان' },
  { p: /شوان/g, r: 'شوان' },
  { p: /طالب/g, r: 'تالیب' },
  { p: /عبد/g, r: 'عەبدول' },
  { p: /عارف/g, r: 'عارف' },
  { p: /عباس/g, r: 'عەباس' },
  { p: /عدنان/g, r: 'عەدنان' },
  { p: /عصمت/g, r: 'عیسمەت' },
  { p: /علاء/g, r: 'عەلا' },
  { p: /غفور/g, r: 'غەفوور' },
  { p: /فاتح/g, r: 'فاتیح' },
  { p: /فاضل/g, r: 'فازڵ' },
  { p: /فایق/g, r: 'فایەق' },
  { p: /فتاح/g, r: 'فەتاح' },
  { p: /فرهاد/g, r: 'فەرهاد' },
  { p: /فریدون/g, r: 'فەرەیدوون' },
  { p: /قاسم/g, r: 'قاسم' },
  { p: /قوباد/g, r: 'قوباد' },
  { p: /کامران/g, r: 'کامرەوان' },
  { p: /لقمان/g, r: 'لوقمان' },
  { p: /محسن/g, r: 'موحسین' },
  { p: /مریوان/g, r: 'مەریوان' },
  { p: /منصور/g, r: 'مەنسوور' },
  { p: /نادر/g, r: 'نادر' },
  { p: /نامق/g, r: 'نامیق' },
  { p: /نجم الدین/g, r: 'نەجمەدین' },
  { p: /نصیر/g, r: 'نەسیر' },
  { p: /نوری/g, r: 'نووری' },
  { p: /نوزاد/g, r: 'نەوزاد' },
  { p: /نوشیروان/g, r: 'نەوشیروان' },
  { p: /هاشم/g, r: 'هاشم' },
  { p: /ولید/g, r: 'وەلید' },
  { p: /وهاب/g, r: 'وەهاب' },
  { p: /هیمن/g, r: 'هێمن' },
  { p: /ياسين/g, r: 'یاسین' },
  { p: /يوسف/g, r: 'یووسف' },
  { p: /عەبدولال/g, r: 'عەبدول' },
  // specific word endings/middles
  { p: /ه(?=\s|$)/g, r: 'ە' },
  { p: /علی/g, r: 'عەلی' },
  { p: /علي(?!.)/g, r: 'عەلی' }
];

function decodeAliK(text) {
  let t = text;
  // Fatha handling in AliK: a bit tricky. it means 'ە' mostly.
  t = t.replace(/َ/g, 'ە').replace(/ِ/g, '').replace(/ُ/g, ''); 
  t = t.replace(/يَ/g, 'ێ');
  t = t.replace(/رِ/g, 'ڕ');
  t = t.replace(/ؤ/g, 'ۆ');
  t = t.replace(/وَ/g, 'ۆ');
  t = t.replace(/[طظثضذيىكة]/g, m => aliKToUni[m] || m);
  
  for (let rule of kurdishFixes) {
    t = t.replace(rule.p, rule.r);
  }
  
  t = t.replace(/هەتاو|ەەتاو/g, 'هەتاو');
  t = t.replace(/گوڵاڵەە/g, 'گوڵاڵە');
  t = t.replace(/شەهلالە|شهلاء/g, 'شەهلا');
  t = t.replace(/زینب/g, 'زەینەب');
  t = t.replace(/سەحر|سحر/g, 'سەحەر');
  t = t.replace(/هدی|هدى/g, 'هودا');
  
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function toEnglish(kur) {
  let t = kur;
  const map = {
    'ئەحمەد': 'Ahmed', 'عەبدوڵڵا': 'Abdullah', 'محەممەد': 'Mohammed', 'مەحموود': 'Mahmoud',
    'عەبدوڕەحمان': 'Abdulrahman', 'ساڵح': 'Salih', 'عومەر': 'Omar', 'عەلی': 'Ali',
    'حەسەن ': 'Hassan ', 'حوسێن ': 'Hussein ', 'کەریم': 'Karim', 'عەزیز': 'Aziz',
    'ئیبراهیم': 'Ibrahim', 'عوسمان': 'Othman', 'سدیق': 'Sidiq', 'ئەمین': 'Amin',
    'قادر': 'Qadir', 'ئیسماعیل': 'Ismail',
    'شەهلا': 'Shahla', 'گوڵاڵە': 'Gulala', 'هەتاو': 'Hataw', 'زەینەب': 'Zainab', 'سەحەر': 'Sahar', 'هودا': 'Huda'
  };
  for (let k in map) t = t.replace(new RegExp(k, 'g'), map[k]);
  
  const letters = {
    'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ر': 'r', 'ڕ': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh',
    'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ڤ': 'v', 'ق': 'q', 'ک': 'k', 'گ': 'g',
    'ل': 'l', 'ڵ': 'll', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ە': 'a',
    'و': 'w', 'ۆ': 'o', 'ی': 'y', 'ێ': 'e', 'ئ': ''
  };
  let en = '';
  for (let char of t) {
    if (letters[char] !== undefined) en += letters[char];
    else en += char;
  }
  return en.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').trim();
}

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i-1) === a.charAt(j-1)) matrix[i][j] = matrix[i-1][j-1];
      else matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1));
    }
  }
  return matrix[b.length][a.length];
}

function simplifyString(str) {
  let s = str.trim();
  s = s.replace(/[يیێ]/g, 'ی').replace(/[كک]/g, 'ک').replace(/[ةەه]/g, 'ە').replace(/[رڕ]/g, 'ر').replace(/[وۆ]/g, 'و').replace(/\s+/g, '');
  return s;
}

const students = [];

for (let r of rows) {
  const cells = r.match(/<w:tc[\s>].*?<\/w:tc>/g);
  if (!cells) continue;
  
  const rowData = cells.map(c => {
    const texts = c.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    return texts.map(t => t.replace(/<[^>]+>/g, '')).join('').trim();
  });
  
  // Find ID: it's the first cell that is a number
  let idIndex = rowData.findIndex(x => x && x.match(/^\d+$/));
  if (idIndex === -1 && rowData[0] && rowData[0].match(/^\d+/)) {
      // Sometimes joined with text e.g. "625سروه"
      const match = rowData[0].match(/^(\d+)(.*)/);
      if(match) {
          rowData[0] = match[1];
          rowData.splice(1, 0, match[2]); // insert name
          idIndex = 0;
      }
  }
  
  // Finding Date:
  let dateGreg = rowData.find(x => x.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) || '';
  
  if (idIndex !== -1 && rowData.length > idIndex + 1) {
    let id = rowData[idIndex];
    if (id === '3541') id = '351'; // Fix known typo in document
    let rawName = rowData[idIndex + 1];
    
    // Sometimes name is empty if it's merged, we should try next cell
    if(!rawName || rawName.length < 3) rawName = rowData[idIndex + 2] || rawName;
    
    if(!rawName || rawName.length < 3) continue;

    let kurName = decodeAliK(rawName);
    
    let arName = rawName.replace(/[طظثضذيىكة]/g, m => ({'ي':'ي','ى':'ى','ة':'ة','ك':'ك'})[m]||m);
    arName = arName.replace(/رِ/g, 'ر').replace(/يَ/g, 'ي').replace(/ؤ/g, 'ؤ').replace(/ط/g, 'گ');
    arName = arName.replace(/َ/g, '').replace(/ِ/g, '').replace(/ُ/g, ''); // strip diacritics
    arName = arName.replace(/\s+/g, ' ').trim();
    
    dateGreg = dateGreg.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    
    students.push({
      id: id,
      name: {
        ku: kurName,
        ar: arName,
        en: toEnglish(kurName)
      },
      date: dateGreg
    });
  }
}

console.log("Extracted IDs count: " + students.length);

const dataPath = 'D:/New-Halabja-Center-Website/assets/data/students.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const existingMembers = [];
for (let cat of data.categories) {
  if (cat.id === 'noorani-qaida') continue;
  if (cat.members) {
    for (let m of cat.members) {
      if (m.name && m.name.ku) {
        existingMembers.push({ originalNameObj: m.name, simplified: simplifyString(m.name.ku), id: m.id || m.certNumber, catId: cat.id });
      }
    }
  }
}

const nq = data.categories.find(c => c.id === 'noorani-qaida');

// We will recreate the noorani-qaida array but PRESERVE existing staff bio
const oldMembers = [...nq.members];
nq.members = [];

// Push all new parsed students
for (let newMem of students) {
    let simplifiedMem = simplifyString(newMem.name.ku);
    let bestMatch = null;
    let bestDist = Infinity;
    
    for (let ext of existingMembers) {
        let dist = levenshtein(simplifiedMem, ext.simplified);
        let maxAllowedDist = simplifiedMem.length > 15 ? 2 : (simplifiedMem.length > 10 ? 1 : 0);
        let arMatch = simplifyString(newMem.name.ar || '') === simplifyString(ext.originalNameObj.ar || 'x');
        
        if (dist <= maxAllowedDist || arMatch) {
            if (dist < bestDist) {
                bestDist = dist;
                bestMatch = ext;
            }
        }
    }
  
    let finalNameObj = bestMatch ? { ...bestMatch.originalNameObj } : newMem.name;
    
    // Check if we have old data to merge (like staff roles for Fakher/Farooq)
    let old = oldMembers.find(o => o.certNumber === newMem.id);
    if (!old) { // fallback check by name
        old = oldMembers.find(o => simplifyString(o.name.ku) === simplifyString(newMem.name.ku));
    }
    
    let finalStudent = {
      name: finalNameObj,
      certNumber: newMem.id,
      date: newMem.date
    };
    
    if (old) {
        Object.assign(finalStudent, old);
        finalStudent.name = finalNameObj;
        finalStudent.certNumber = newMem.id;
        finalStudent.date = newMem.date;
    }
    
    nq.members.push(finalStudent);
}

// Ensure Fakher from the old list isn't lost if he wasn't parsed 
for (let old of oldMembers) {
    if(!nq.members.find(m => m.certNumber === old.certNumber)) {
        nq.members.push(old);
    }
}

// Sort by ID
nq.members.sort((a,b) => parseInt(a.certNumber||1000) - parseInt(b.certNumber||1000));

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Final Qaida Noorani Members: ' + nq.members.length);
