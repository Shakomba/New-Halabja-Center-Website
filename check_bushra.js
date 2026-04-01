const fs = require('fs');
const data = JSON.parse(fs.readFileSync('assets/data/students.json', 'utf8'));
const recitation = data.categories.find(c => c.id === 'recitation-license').members;
recitation.forEach(m => {
  if (m.name.ar.includes('بشرى')) {
     console.log('Recitation بشرى -> ' + m.name.ku);
  }
});
