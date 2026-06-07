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

function getFirstDialogue(filename) {
  try {
    const content = JSON.parse(fs.readFileSync(path.join(moviesDir, filename), 'utf8'));
    for (const node of content) {
      if (node.Type === 301) {
        const params = parseParams(node.Params);
        const speaker = params[2] || 'Narrator';
        const text = params[3] || '';
        if (text) {
          return `[${speaker}]: ${text.slice(0, 60)}`;
        }
      }
    }
  } catch (e) {}
  return '(No dialogue)';
}

const prefixToFirstFile = {};
files.forEach(f => {
  const match = f.match(/^Movie([A-Za-z]+)(\d{3})/);
  if (match) {
    const key = match[1] + match[2];
    if (!prefixToFirstFile[key]) {
      prefixToFirstFile[key] = f;
    }
  }
});

console.log('--- Scanning First Files for ZX prefixes ---');
Object.entries(prefixToFirstFile).sort().forEach(([pref, filename]) => {
  if (pref.startsWith('ZX')) {
    console.log(`${pref} -> ${filename}: ${getFirstDialogue(filename)}`);
  }
});
