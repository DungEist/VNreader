import fs from 'fs';
import path from 'path';

const moviesDir = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movies';
const files = fs.readdirSync(moviesDir).filter(f => f.endsWith('.json'));

const matches = [];

for (const file of files) {
  try {
    const content = JSON.parse(fs.readFileSync(path.join(moviesDir, file), 'utf8'));
    for (let idx = 0; idx < content.length; idx++) {
      const node = content[idx];
      const paramsStr = JSON.stringify(node.Params || '');
      if (paramsStr.toLowerCase().includes('soloreform')) {
        matches.push({ file, index: idx, type: node.Type, params: node.Params });
      }
    }
  } catch (e) {
    // skip
  }
}

console.log(`Found ${matches.length} matches:`);
console.log(JSON.stringify(matches, null, 2));
