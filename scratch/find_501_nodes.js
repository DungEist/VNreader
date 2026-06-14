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
      if (node.Type === 503) {
        matches.push({ file, index: idx, type: node.Type, params: node.Params });
      }
    }
  } catch (e) {
    // skip
  }
}

console.log(`Found ${matches.length} nodes of Type 503:`);
console.log(JSON.stringify(matches.slice(0, 30), null, 2));
if (matches.length > 30) {
  console.log(`... and ${matches.length - 30} more`);
}
