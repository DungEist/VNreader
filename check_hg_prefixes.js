import fs from 'fs';
import path from 'path';

const moviesDir = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movies';
const files = fs.readdirSync(moviesDir).filter(f => f.startsWith('MovieHG'));

const prefixToFirst = {};
files.forEach(f => {
  const match = f.match(/^MovieHG(\d{3})/);
  if (match) {
    const num = match[1];
    if (!prefixToFirst[num]) prefixToFirst[num] = f;
  }
});

console.log('HG prefixes in movies folder:');
console.log(Object.keys(prefixToFirst).sort());
