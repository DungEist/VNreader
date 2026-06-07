import fs from 'fs';
const data = JSON.parse(fs.readFileSync('/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/MovieKeyword.json', 'utf8'));
console.log('MovieKeyword sample:', data.slice(0, 20));
