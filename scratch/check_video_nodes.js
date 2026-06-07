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
      const params = node.Params || '';
      if (
        params.toLowerCase().includes('video') ||
        params.toLowerCase().includes('.mp4') ||
        params.toLowerCase().includes('.usm') ||
        params.toLowerCase().includes('.m4v')
      ) {
        matches.push({ file, index: idx, type: node.Type, params });
        if (matches.length >= 30) break;
      }
    }
    if (matches.length >= 30) break;
  } catch (e) {
    // skip
  }
}

console.log('Found video-related nodes:');
console.log(JSON.stringify(matches, null, 2));
