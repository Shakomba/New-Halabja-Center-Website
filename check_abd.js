const fs = require('fs');
const data = JSON.parse(fs.readFileSync('assets/data/students.json', 'utf8'));
const noorani = data.categories.find(c => c.id === 'noorani-qaida').members;
noorani.forEach(m => {
  if (m.name.ku.includes('عەبد')) {
      console.log(m.name.ku);
  }
});
