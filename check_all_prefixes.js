import fs from 'fs';
import path from 'path';

const moviesDir = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movies';
const files = fs.readdirSync(moviesDir).filter(f => f.endsWith('.json'));

const prefixCounts = {};
files.forEach(f => {
  const match = f.match(/^Movie([A-Za-z]+)/);
  if (match) {
    const prefix = match[1];
    prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
  }
});

console.log('All prefixes and file counts:');
console.log(prefixCounts);
