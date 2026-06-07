import fs from 'fs';
import path from 'path';

const searchDir = '/home/deist/Downloads/Work/PGR_Data/EN/bytes';
const query = 'Echoes of Nightmare'.toLowerCase();

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file === 'movies') continue; // skip the giant folder
      search(fullPath);
    } else if (file.endsWith('.json')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(query)) {
        console.log(`Found in: ${fullPath}`);
      }
    }
  }
}

search(searchDir);
