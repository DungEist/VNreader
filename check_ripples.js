import fs from 'fs';
import path from 'path';

const moviesDir = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movies';

function parseParams(str) {
  if (!str) return {};
  let s = str.trim();
  if (s.startsWith('{')) s = s.slice(1);
  if (s.endsWith('}')) s = s.slice(0, -1);
  const result = {};
  const tokens = s.split(/,(?=(?:[^\']*\'[^\']*\')*[^\']*$)/);
  for (const token of tokens) {
    const colonIndex = token.indexOf(':');
    if (colonIndex === -1) continue;
    let key = token.slice(0, colonIndex).trim().replace(/['"]/g, '');
    let val = token.slice(colonIndex + 1).trim();
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

function dumpDialogues(filename) {
  const filepath = path.join(moviesDir, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`File not found: ${filename}`);
    return;
  }
  const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  console.log(`=== ${filename} ===`);
  let count = 0;
  for (const node of content) {
    if (node.Type === 301) {
      const params = parseParams(node.Params);
      const speaker = params[2] || 'Narrator';
      const text = params[3] || '';
      if (text) {
        console.log(`  [${speaker}]: ${text}`);
        count++;
        if (count >= 15) {
          console.log('  ...');
          break;
        }
      }
    }
  }
}

dumpDialogues('MovieZX04829BA.json');
dumpDialogues('MovieZX04830BA.json');
