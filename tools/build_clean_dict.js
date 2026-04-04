const fs = require('fs');

const d = JSON.parse(fs.readFileSync('D:/Projects/New-Halabja-Center-Website/tools/translation_dict.json', 'utf8'));
const missing = JSON.parse(fs.readFileSync('D:/Projects/New-Halabja-Center-Website/tools/missing_dict.json', 'utf8'));

// Hardcoded explicit mappings for tricky and Arabic-origin names
const explicitAr = {
  "ئاراس": "آراس", "ئارام": "آرام", "ئازاد": "آزاد", "ئاسودە": "آسودة", "ئاسوودە": "آسودة",
  "ئاسۆ": "آسو", "ئیسرا": "إسراء", "ئیسماعیل": "إسماعيل", "ئیلهام": "إلهام", "ئیمان": "إيمان",
  "ئیناس": "إيناس", "ئیکرام": "إكرام", "ئەبووبەکر": "أبو بكر", "ئەحمەد": "أحمد",
  "ئەرکان": "أركان", "ئەسما": "أسماء", "ئەمیر": "أمير", "ئەمین": "أمين", "ئەنوەر": "أنور",
  "ئەنەس": "أنس", "ئەکرەم": "أكرم", "ئەییووب": "أيوب", "محەممەد": "محمد", "عەبدوڵڵا": "عبدالله",
  "عەبدوڕەحمان": "عبدالرحمن", "مستەفا": "مصطفى", "حەمەساڵح": "محمد صالح", "حەمەعەلی": "محمد علي",
  "ئیبراهیم": "إبراهيم", "عوسمان": "عثمان", "تەها": "طه", "عیسی": "عيسى", "مووسا": "موسى",
  "حەمەڕەشید": "محمد رشيد", "حەمەسەعید": "محمد سعيد", "عەبدولقادر": "عبدالقادر",
  "عەبدولکەریم": "عبدالكريم", "عەبدولڕەحیم": "عبدالرحيم", "عەبدولغەفوور": "عبدالغفور",
  "عەبدولحامید": "عبدالحامد", "عەبدولئەمیر": "عبدالأمير", "عەبدولستار": "عبدالستار",
  "عەلی": "علي", "سەعید": "سعيد", "مەحموود": "محمود", "بەکر": "بكر", "خەدیجە": "خديجة",
  "فاتمە": "فاطمة", "عائیشە": "عائشة", "زەینەب": "زينب", "لوقمان": "لقمان", "یەحیا": "يحيى",
  "سلێمان": "سليمان", "یونس": "يونس", "یووسف": "يوسف", "عومەر": "عمر", "سابیر": "صابر",
  "سادق": "صادق", "سدیق": "صديق", "سەلاح": "صلاح", "ساڵح": "صالح", "هاشم": "هاشم",
  "قاسم": "قاسم", "تۆفیق": "توفيق", "تاهیر": "طاهر", "تارق": "طارق", "فەتاح": "فتاح",
  "مەنسوور": "منصور", "عاسی": "عاصي", "ناسیح": "ناصح", "فاروق": "فاروق", "فارووق": "فاروق",
  "عیماد": "عماد", "دروود": "درود", "رەسوول": "رسول", "ڕەسوول": "رسول", "موئەیەد": "مؤيد",
  "عرووبە": "عروبة", "سومەییە": "سمية", "شەیما": "شيماء", "هودا": "هدى", "بەهادین": "بهاء الدين",
  "نورەدین": "نور الدين", "محێدین": "محيي الدين", "نەجمەدین": "نجم الدين", "عیززەت": "عزت",
  "حەسەن": "حسن", "حوسێن": "حسين", "شەهاب": "شهاب", "مەجید": "مجيد", "قوباد": "قباد",
  "فازڵ": "فاضل", "جەعفەر": "جعفر", "سەعد": "سعد", "سەلمان": "سلمان", "جەلال": "جلال",
  "جەمال": "جمال", "جەلیل": "جليل", "خەلیل": "خليل", "زاهیر": "زاهر", "غەریب": "غريب",
  "فەرحان": "فرحان", "فەلاح": "فلاح", "لەتیف": "لطيف", "حەمەغەریب":"محمد غريب",
  "حەمەشەریف":"محمد شريف", "حەمەکەریم": "محمد كريم", "حەمەعەزیز": "محمد عزيز",
  "حەمەفەرەج": "محمد فرج", "یەقین": "يقين", "خەلیفە": "خليفة", "زەیدان": "زيدان",
  "شیرین": "شيرين", "شەرمین": "شرمين", "نەجیبە": "نجيبة", "عەزەم": "عزم", "کەلسووم": "كلثوم",
  "موختار": "مختار", "زیکرا": "ذكرى", "حەمە": "محمد", "عەبد": "عبد"
};

const explicitEn = {
  "ئەبووبەکر": "Abu Bakr", "محەممەد": "Muhammad", "عەبدوڵڵا": "Abdullah", "عەبدوڕەحمان": "Abdulrahman",
  "مستەفا": "Mustafa", "حەمەساڵح": "Muhammad Salih", "حەمەعەلی": "Muhammad Ali", "حەمەڕەشید": "Muhammad Rashid",
  "حەمەسەعید": "Muhammad Saeed", "حەمەکەریم": "Muhammad Karim", "حەمەعەزیز": "Muhammad Aziz", 
  "حەمەفەرەج": "Muhammad Faraj", "حەمەغەریب": "Muhammad Gharib", "حەمەشەریف": "Muhammad Sharif",
  "عەبدولقادر": "Abdulqadir", "عەبدولکەریم": "Abdulkarim", "عەبدولڕەحیم": "Abdulrahim",
  "عەبدولغەفوور": "Abdulghafoor", "عەبدولحامید": "Abdulhamid", "عەبدولئەمیر": "Abdulameer",
  "عەبدولستار": "Abdulstar", "بەهادین": "Bahaaddin", "نورەدین": "Nuraddin", "محێدین": "Muhiyaddin",
  "نەجمەدین": "Najmaddin", "ئەحمەد": "Ahmed", "تەها": "Taha", "عیسی": "Isa", "مووسا": "Musa",
  "عومەر": "Omar", "عوسمان": "Othman", "ئیبراهیم": "Ibrahim", "ئیسماعیل": "Ismail", "حەمە": "Hama"
};

let finalAr = {};
let finalEn = {};

// Fill missing words
missing.forEach(m => d[m] = { ar: '', en: '' });

const allWords = Object.keys(d);

function cleanAr(ku, arOrig) {
    if (explicitAr[ku]) return explicitAr[ku];
    
    // Use previously recorded translation, and just fix Kurdish letters
    let cleaned = (arOrig || ku);
    
    // Only basic safe normalization
    cleaned = cleaned.replace(/ڕ/g, "ر").replace(/ڵ/g, "ل")
                     .replace(/ڤ/g, "ف").replace(/پ/g, "ب")
                     .replace(/چ/g, "ش").replace(/گ/g, "غ")
                     .replace(/ۆ/g, "و").replace(/ێ/g, "ي")
                     .replace(/ژ/g, "ج");
                     
    // Fix Ta marbuta approximations for female looking endings:
    // If it historically had 'ة', replace it, otherwise replace ە with empty or ا
    if(cleaned.includes("ە") || cleaned.includes("ة")) {
       cleaned = cleaned.replace(/ە/g, "ة"); // Safe naive for names usually ending in ta marbuta
    }
    return cleaned;
}

function cleanEn(ku, enOrig) {
    if (explicitEn[ku]) return explicitEn[ku];
    
    // Capitalize first letter logic
    let cleaned = enOrig || "Unknown";
    // Usually English is passed as is, we just title case it
    if(cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    }
    
    // Specific standard mappings for letters in English from Kurdish phonetics
    cleaned = cleaned.replace(/ء/g, ""); // remove stray arabic characters
    cleaned = cleaned.replace(/[أإآ]/g, "A");
    
    return cleaned;
}

allWords.forEach(kw => {
    finalAr[kw] = cleanAr(kw, d[kw].ar);
    finalEn[kw] = cleanEn(kw, d[kw].en);
});

fs.writeFileSync('D:/Projects/New-Halabja-Center-Website/tools/final_ar_dict.json', JSON.stringify(finalAr, null, 2));
fs.writeFileSync('D:/Projects/New-Halabja-Center-Website/tools/final_en_dict.json', JSON.stringify(finalEn, null, 2));

console.log("Created final dictionaries!");
