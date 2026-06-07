import fs from 'fs';
import path from 'path';

const moviesDir = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movies';
const files = fs.readdirSync(moviesDir).filter(f => f.endsWith('.json'));

const keywords = ['whale', 'cinder burns', 'sands of wrath', 'reveries with a whale', 'the ark beyond', 'left unsaid', 'the floating reverie', 'when day breaks'];

console.log('Searching in', files.length, 'files...');

const matches = [];

for (const file of files) {
  const contentStr = fs.readFileSync(path.join(moviesDir, file), 'utf8');
  if (keywords.some(k => contentStr.toLowerCase().includes(k))) {
    matches.push(file);
  }
}

console.log('Matching files:', matches);
