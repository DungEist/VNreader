import fs from 'fs';
import path from 'path';

const moviesDir = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movies';
const files = fs.readdirSync(moviesDir).filter(f => f.endsWith('.json'));

const typeCounts = {};

for (const file of files) {
  try {
    const content = JSON.parse(fs.readFileSync(path.join(moviesDir, file), 'utf8'));
    for (const node of content) {
      const type = node.Type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
  } catch (e) {
    // skip
  }
}

console.log('All distinct node Types and their counts across all movies:');
console.log(typeCounts);
