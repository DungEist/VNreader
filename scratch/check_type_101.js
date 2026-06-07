import fs from 'fs';
import path from 'path';

const moviesDir = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movies';
const files = fs.readdirSync(moviesDir).filter(f => f.endsWith('.json'));

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

const configs = new Map();

for (const file of files) {
  try {
    const content = JSON.parse(fs.readFileSync(path.join(moviesDir, file), 'utf8'));
    for (const node of content) {
      if (node.Type === 101) {
        const params = parseParams(node.Params);
        if (params['4']) {
          const keys = Object.keys(params).sort().join(',');
          const sample = {};
          Object.keys(params).forEach(k => {
            if (k === '1') {
              sample[k] = params[k].substring(0, 15) + '...'; // truncate path
            } else {
              sample[k] = params[k];
            }
          });
          configs.set(keys, sample);
        }
      }
    }
  } catch (e) {
    // skip
  }
}

console.log('Distinct configurations when param 4 is present:');
for (const [keys, sample] of configs.entries()) {
  console.log(`Keys [${keys}]:`, sample);
}
