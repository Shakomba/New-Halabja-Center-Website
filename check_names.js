const fs = require('fs');
const data = JSON.parse(fs.readFileSync('assets/data/students.json', 'utf8'));

const recitation = data.categories.find(c => c.id === 'recitation-license').members;
let all_ku = recitation.map(m => m.name.ku).join(' ');

console.log("Count of موحەممەد: ", (all_ku.match(/موحەممەد/g) || []).length);
console.log("Count of محەممەد: ", (all_ku.match(/محەممەد/g) || []).length);
console.log("Count of عەبدوڵڵا: ", (all_ku.match(/عەبدوڵڵا/g) || []).length);
console.log("Count of عەبدوڕەحمان: ", (all_ku.match(/عەبدوڕەحمان/g) || []).length);
