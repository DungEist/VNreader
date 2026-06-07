import fs from 'fs';
import path from 'path';

const moviesDir = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movies';
const files = fs.readdirSync(moviesDir).filter(f => f.endsWith('.json'));

function parseParams(str) {
  if (!str) return {};
  let s = str.trim();
  if (s.startsWith('{')) s = s.slice(1);
  if (s.endsWith('}')) s = s.slice(0, -1);
  const result = {};
  const tokens = s.split(/,(?=(?:[^\']*\'[^\']*\')*[^\']*$)/);
  for (const token of tokens) {
    const colonIndex = token.indexOf(':');
    if (colonIndex === -1) continue;
    let key = token.slice(0, colonIndex).trim().replace(/['"]/g, '');
    let val = token.slice(colonIndex + 1).trim();
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

for (let i = 32; i <= 53; i++) {
  const prefix = `HD${i.toString().padStart(3, '0')}`;
  const matchingFiles = files.filter(f => f.startsWith(`Movie${prefix}`)).sort();
  if (matchingFiles.length === 0) continue;
  
  const testFile = matchingFiles[0];
  const filepath = path.join(moviesDir, testFile);
  const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  
  // Collect unique speakers
  const speakers = new Set();
  let firstDiag = '';
  for (const node of content) {
    if (node.Type === 301) {
      const params = parseParams(node.Params);
      const speaker = params[2] || 'Narrator';
      const text = params[3] || '';
      if (speaker && speaker !== 'Narrator') {
        speakers.add(speaker);
      }
      if (text && !firstDiag) {
        firstDiag = `[${speaker}]: ${text.slice(0, 80)}`;
      }
    }
  }
  
  console.log(`${prefix} (${matchingFiles.length} files) -> Speakers: [${Array.from(speakers).join(', ')}]`);
  console.log(`  First: ${firstDiag}`);
}
