import fs from 'fs';
import path from 'path';

const moviesDir = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movies';
const files = fs.readdirSync(moviesDir).filter(f => f.toUpperCase().includes('ZX048') && f.endsWith('.json'));

console.log(`Checking ${files.length} files for Chapter 31...`);
files.forEach(file => {
  const content = fs.readFileSync(path.join(moviesDir, file), 'utf8');
  const jpgMatches = content.match(/\.(jpe?g)/gi);
  if (jpgMatches) {
    console.log(`File: ${file} contains ${jpgMatches.length} references:`);
    // Find lines with .jpg or .jpeg
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.match(/\.(jpe?g)/i)) {
        console.log(`  Line ${idx + 1}: ${line.trim()}`);
      }
    });
  }
});
