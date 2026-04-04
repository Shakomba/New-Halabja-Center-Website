const fs = require('fs');
const file = 'D:/Projects/New-Halabja-Center-Website/assets/data/students.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

const enFixes = {
  "Aadl": "Adil", "Aarf": "Arif", "Aasha": "Aisha", "Aawl": "Awl", "Abas": "Abbas",
  "Abdalwahd": "Abdulwahid", "Akbr": "Akbar", "Akrm": "Akram", "Ans": "Anas",
  "Azt": "Izzat", "Bkr": "Bakr", "Bshry": "Bushra", "Faq": "Faiq", "Faraa": "Faraa",
  "Fath": "Fatih", "Fazil": "Fadhil", "Flah": "Falah", "Frhan": "Farhan", "Fryd": "Farid",
  "Ftah": "Fatah", "Fwzya": "Fawzia", "Hady": "Hadi", "Hallkawt": "Halkawt", "Hars": "Haris",
  "Hdy": "Huda", "Hdya": "Hadia", "Hkmt": "Hikmat", "Hna": "Hana", "Idris": "Idris",
  "Jafr": "Jafar", "Jbar": "Jabar", "Jlal": "Jalal", "Jlyl": "Jalil", "Jmal": "Jamal",
  "Jmyla": "Jamila", "Kaml": "Kamil", "Kmal": "Kamal", "Lbnan": "Lubnan", "Luqman": "Luqman",
  "Maazh": "Muadh", "Madh": "Madih", "Marwf": "Maruf", "Mbark": "Mubarak", "Mbyn": "Mubin",
  "Mdyna": "Madina", "Mhdy": "Mahdi", "Mhsa": "Mahsa", "Mhsn": "Muhsin", "Mkhtar": "Mukhtar",
  "Moyd": "Muayad", "Mrwa": "Marwa", "Mrwan": "Marwan", "Msawd": "Masoud", "Mwlwd": "Mawloud",
  "NbA": "Nabaa", "Nda": "Nida", "Nha": "Nuha", "Nhayt": "Nihayat", "Njyb": "Najib",
  "Njym": "Najim", "Nsym": "Nasim", "Nwaf": "Nawaf", "Nwfyq": "Tawfiq", "Nwr": "Noor",
  "Qasm": "Qasim", "Rfat": "Rifat", "Rfyq": "Rafiq", "Rhym": "Rahim", "Rmchan": "Ramadhan",
  "Rswl": "Rasoul", "Rwqya": "Ruqayya", "Rwya": "Ruya", "Sad": "Saad", "Sady": "Saadi",
  "Sadya": "Saadia", "Sbhan": "Subhan", "Sdra": "Sidra", "Shkrya": "Shukriya", "Shryf": "Sharif",
  "Slman": "Salman", "Slyman": "Sulaiman", "Smya": "Sumayya", "Snds": "Sundus", "Thsyn": "Tahsin",
  "Vahr": "Zahir", "Wahd": "Wahid", "Yhyy": "Yahya", "Yqyn": "Yaqin", "Ysry": "Yusra",
  "Chnwr": "Chnur", "Srwsht": "Srusht", "Hmt": "Himat", "Jwhr": "Jawhar", "Mnswr": "Mansour", "Drwd": "Drud"
};

let count = 0;

data.categories.forEach(c => {
    if (c.members) {
        c.members.forEach(m => {
            if (m.name && m.name.en) {
                let parts = m.name.en.split(' ');
                let changed = false;
                for (let i = 0; i < parts.length; i++) {
                    if (enFixes[parts[i]]) {
                        parts[i] = enFixes[parts[i]];
                        changed = true;
                    }
                }
                if (changed) {
                    m.name.en = parts.join(' ');
                    count++;
                }
            }
        });
    }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log(`Replaced ${count} English abbreviations/typos.`);
