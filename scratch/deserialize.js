import fs from 'fs';
import path from 'path';

const filePath = '/home/deist/Downloads/Work/PGR_reader/scratch/nuxt_data.json';
const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

const resolved = new Map();

function resolve(index, pathStack = []) {
  if (index === null || index === undefined) return null;
  if (typeof index !== 'number') return index;
  
  if (resolved.has(index)) {
    return resolved.get(index);
  }
  
  if (pathStack.includes(index)) {
    return `[Circular reference to ${index}]`;
  }
  
  const val = data[index];
  if (val === null || val === undefined) {
    return val;
  }
  
  if (Array.isArray(val)) {
    const arr = [];
    resolved.set(index, arr);
    val.forEach(item => {
      arr.push(resolve(item, [...pathStack, index]));
    });
    return arr;
  }
  
  if (typeof val === 'object') {
    const obj = {};
    resolved.set(index, obj);
    for (const key in val) {
      obj[key] = resolve(val[key], [...pathStack, index]);
    }
    return obj;
  }
  
  resolved.set(index, val);
  return val;
}

const rootResolved = resolve(1);

// Let's print out all values in rootResolved.data (which contains the raw fetched data)
console.log('Resolving rootResolved.data:');
const fetchedData = rootResolved.data;
if (Array.isArray(fetchedData)) {
  const reactiveObj = fetchedData[1];
  for (const key in reactiveObj) {
    console.log(`Key in fetchedData: ${key}`);
    const val = reactiveObj[key];
    console.log('Keys of val:', Object.keys(val || {}));
    if (val && val.movie) {
      const movie = val.movie;
      console.log('Movie detail:');
      console.log('- ID:', movie.id);
      console.log('- Name:', movie.name);
      console.log('- Actions Count:', movie.actions ? movie.actions.length : 0);
      if (movie.actions) {
        // print out all action IDs and their types and audio paths if they have audio
        movie.actions.forEach((act, i) => {
          if (act.type === 'SoundPlay' || act.audio || act.soundType) {
            console.log(`Action ${i} (ActionId: ${act.actionId}):`, act);
          }
        });
      }
    }
  }
}
