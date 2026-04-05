const fs = require('fs');

const missingWords = {
  'بورهان': { ar: 'برهان', en: 'Burhan' },
  'ڕێکار': { ar: 'ريكار', en: 'Rekar' },
  'سوکنا': { ar: 'سكنا', en: 'Sukna' },
  'حەوا': { ar: 'حواء', en: 'Hawa' },
  'فوئاد': { ar: 'فؤاد', en: 'Fuad' },
  'هۆگر': { ar: 'هوكر', en: 'Hogir' },
  'سوپا': { ar: 'سوبا', en: 'Supa' },
  'رۆغزاد': { ar: 'روغزاد', en: 'Roghzad' },
  'پەخشان': { ar: 'بخشان', en: 'Pakhshan' },
  'نەزیرە': { ar: 'نزيرة', en: 'Nazira' },
  'حەمەموراد': { ar: 'حمة مراد', en: 'Hama Murad' },
  'نزا': { ar: 'نزا', en: 'Nza' },
  'گەرمیان': { ar: 'كرميان', en: 'Garmyan' },
  'نەسیم': { ar: 'نسيم', en: 'Naseem' },
  'شنان': { ar: 'شنان', en: 'Shnan' },
  'هاروون': { ar: 'هارون', en: 'Harun' },
  'خاتوون': { ar: 'خاتون', en: 'Khatoon' },
  'هەلاڵە': { ar: 'هلالة', en: 'Halala' },
  'عەبدولعەزیز': { ar: 'عبدالعزيز', en: 'Abdulaziz' },
  'لوبنا': { ar: 'لبنى', en: 'Lubna' },
  'عەبدوڕەحیم': { ar: 'عبدالرحيم', en: 'Abdulrahim' },
  'بەهەشت': { ar: 'بهشت', en: 'Bahasht' },
  'سۆیبە': { ar: 'سويبة', en: 'Swayba' },
  'قازی': { ar: 'قاضي', en: 'Qazi' },
  'جەمشید': { ar: 'جمشيد', en: 'Jamshid' },
  'باوەڕ': { ar: 'باور', en: 'Bawar' },
  'لۆنا': { ar: 'لونا', en: 'Lona' },
  'شوناس': { ar: 'شوناس', en: 'Shunas' },
  'نزیرە': { ar: 'نزيرة', en: 'Nazira' },
  'ماریە': { ar: 'مارية', en: 'Maria' },
  'کەژاڵ': { ar: 'كژال', en: 'Kazhal' },
  'حەیدەر': { ar: 'حيدر', en: 'Haidar' },
  'حەمیدە': { ar: 'حميدة', en: 'Hamida' },
  'شاد': { ar: 'شاد', en: 'Shad' },
  'کارزان': { ar: 'كارزان', en: 'Karzan' },
  'محمد': { ar: 'محمد', en: 'Mohammed' },
  'وسەین': { ar: 'وسين', en: 'Wisayn' },
  'سەرکەوت': { ar: 'سركوت', en: 'Sarkawt' },
  'حەمەخورشید': { ar: 'حمة خورشيد', en: 'Hama Khurshid' },
  'بەرزان': { ar: 'برزان', en: 'Barzan' },
  'فارس': { ar: 'فارس', en: 'Faris' },
  'سەهەند': { ar: 'سهند', en: 'Sahand' },
  'مونیرە': { ar: 'منيرة', en: 'Munira' },
  'ئەشرەف': { ar: 'أشرف', en: 'Ashraf' },
  'غەفوور': { ar: 'غفور', en: 'Ghafoor' },
  'شیراز': { ar: 'شيراز', en: 'Shiraz' },
  'دیمان': { ar: 'ديمان', en: 'Diman' },
  'شەپۆل': { ar: 'شبول', en: 'Shapol' },
  'مەدحەت': { ar: 'مدحت', en: 'Midhat' },
  'گەشین': { ar: 'كشين', en: 'Gashin' },
  'سیدرا': { ar: 'سدرة', en: 'Sidra' },
  'شارۆ': { ar: 'شارو', en: 'Sharo' },
  'ڕزگار': { ar: 'رزكار', en: 'Rizgar' },
  'بەڵێن': { ar: 'بلين', en: 'Ballen' },
  'نۆڤا': { ar: 'نوفا', en: 'Nova' },
  'سەلما': { ar: 'سلمى', en: 'Salma' },
  'حەبیب': { ar: 'حبيب', en: 'Habib' },
  'جەزا': { ar: 'جزا', en: 'Jaza' },
  'کۆژین': { ar: 'كوژين', en: 'Kozhin' },
  'ڕەزا': { ar: 'رضا', en: 'Ridha' },
  'نەرمین': { ar: 'نرمين', en: 'Narmin' },
  'ئاوارە': { ar: 'آوارة', en: 'Awara' },
  'دەروون': { ar: 'درون', en: 'Daroon' },
  'گۆڤەند': { ar: 'كوفند', en: 'Govand' },
  'خەسرەو': { ar: 'خسرو', en: 'Khasraw' },
  'مژدە': { ar: 'مجدة', en: 'Mizhda' },
  'هیدایەت': { ar: 'هداية', en: 'Hidayat' },
  'فریشتە': { ar: 'فرشتة', en: 'Frishta' },
  'ئەرمەن': { ar: 'أرمن', en: 'Arman' },
  'سەناریا': { ar: 'سناريا', en: 'Sanarya' },
  'نیگا': { ar: 'نيكا', en: 'Niga' },
  'لەمیعە': { ar: 'لميعة', en: 'Lameaa' },
  'بەیاد': { ar: 'بياد', en: 'Bayad' },
  'ڕۆیا': { ar: 'رويا', en: 'Roya' },
  'ڕوقیە': { ar: 'رقية', en: 'Ruqia' },
  'وەلی': { ar: 'ولي', en: 'Wali' },
  'سوعاد': { ar: 'سعاد', en: 'Suad' },
  'حەمەڕەحیم': { ar: 'حمة رحيم', en: 'Hama Rahim' }
};

const arDict = JSON.parse(fs.readFileSync('tools/final_ar_dict.json', 'utf8'));
const enDict = JSON.parse(fs.readFileSync('tools/final_en_dict.json', 'utf8'));

Object.keys(missingWords).forEach(w => {
   arDict[w] = missingWords[w].ar;
   enDict[w] = missingWords[w].en;
});

fs.writeFileSync('tools/final_ar_dict.json', JSON.stringify(arDict, null, 2), 'utf8');
fs.writeFileSync('tools/final_en_dict.json', JSON.stringify(enDict, null, 2), 'utf8');

let file = './assets/data/students.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));
let changes = 0;

data.categories.forEach(c => {
  if (c.id === 'tajweed-theory' && c.members) {
    c.members.forEach(m => {
      if (m.name && m.name.ku) {
        let kuWords = m.name.ku.split(/\s+/);
        let newAr = kuWords.map(w => arDict[w] || w).join(' ').replace(/\s+/g, ' ').trim();
        let newEn = kuWords.map(w => enDict[w] || w).join(' ').replace(/\s+/g, ' ').trim();
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
console.log('Applied ' + changes + ' updates.');

