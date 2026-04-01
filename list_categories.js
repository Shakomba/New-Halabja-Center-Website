const fs = require('fs');
const data = JSON.parse(fs.readFileSync('assets/data/students.json', 'utf8'));
data.categories.forEach(c => {
  console.log(c.id);
});
