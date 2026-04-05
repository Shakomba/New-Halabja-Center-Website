const fs = require('fs');

const students = JSON.parse(fs.readFileSync('assets/data/students.json', 'utf8'));
students.categories.forEach(cat => {
  console.log(`ID: ${cat.id}, Name: ${cat.name.en}`);
});
