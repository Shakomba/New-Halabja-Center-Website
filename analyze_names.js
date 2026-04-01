const fs = require('fs');

const data = JSON.parse(fs.readFileSync('D:/New-Halabja-Center-Website/assets/data/students.json', 'utf8'));

// Dictionaries for standardizing Kurdish spelling
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
  s = s.replace(/[يیێ]/g, 'ی');
  s = s.replace(/[كک]/g, 'ک');
  s = s.replace(/[ةەه]/g, 'ە');
  s = s.replace(/[رڕ]/g, 'ر');
  s = s.replace(/[وۆ]/g, 'و');
  s = s.replace(/[ئإأ]/g, '');
  s = s.replace(/\s+/g, '');
  return s;
}

const existingMembers = [];
for (let cat of data.categories) {
  if (cat.id === 'noorani-qaida') continue;
  if (cat.members) {
    for (let m of cat.members) {
      if (m.name && m.name.ku) {
        existingMembers.push({ originalNameObj: m.name, simplified: simplifyString(m.name.ku), catId: cat.id });
      }
    }
  }
}

const nq = data.categories.find(c => c.id === 'noorani-qaida');

let suggestions = [];

for (let i = 0; i < nq.members.length; i++) {
  let mem = nq.members[i];
  let currentKu = mem.name.ku;
  
  let simplifiedMem = simplifyString(currentKu);
  
  if (currentKu.includes("ال")) {
    suggestions.push(`ARABIC_ARTICLE: ${currentKu}`);
  }
  if (currentKu.match(/[طظضثذ]/)) {
    suggestions.push(`ALI_K_CHARS: ${currentKu}`);
  }
  if (currentKu.match(/ە[ا-ی]/)) {
    suggestions.push(`WEIRD_HA: ${currentKu}`);
  }

  let bestMatch = null;
  let bestDist = Infinity;
  
  // Find close matches
  for (let ext of existingMembers) {
    let dist = levenshtein(simplifiedMem, ext.simplified);
    // Allow dist 1-3 based on length
    let maxAllowedDist = simplifiedMem.length > 20 ? 3 : (simplifiedMem.length > 12 ? 2 : (simplifiedMem.length > 8 ? 1 : 0));
    
    if (dist > 0 && dist <= maxAllowedDist) { // exact matches are already in sync or boring to review
      if (dist < bestDist) {
        bestDist = dist;
        bestMatch = ext;
      }
    }
  }
  
  if (bestMatch) {
    suggestions.push(`FUZZY_MATCH (dist: ${bestDist}): "${currentKu}" => EXACT MATCH TO OTHER CATEGORY: "${bestMatch.originalNameObj.ku}"`);
  }
}

fs.writeFileSync('D:/New-Halabja-Center-Website/analyze_output.txt', suggestions.join('\n'));
console.log('Suggestions generated: ' + suggestions.length);
