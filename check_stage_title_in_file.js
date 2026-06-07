import fs from 'fs';
import path from 'path';

const filepath = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movies/MovieZX04801BA.json';
const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

console.log('Action nodes in MovieZX04801BA.json:');
data.forEach((node, idx) => {
  if (idx < 15 || node.Type === 102 || node.Params.includes('Echoes')) {
    console.log(`Index ${idx}: Type ${node.Type}, Params: ${node.Params}`);
  }
});
