import fs from 'fs';
import path from 'path';

const filepath = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movies/MovieHG14801BA.json';
if (fs.existsSync(filepath)) {
  const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  console.log('HG14801BA dialogue:');
  let count = 0;
  for (const node of content) {
    if (node.Type === 301) {
      console.log(`  ${node.Params}`);
      count++;
      if (count >= 10) break;
    }
  }
} else {
  console.log('File not found');
}
