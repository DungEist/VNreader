import http from 'https';

function deserializeNuxtData(dataList) {
  const resolved = new Map();
  function resolve(index, pathStack = []) {
    if (index === null || index === undefined) return null;
    if (typeof index !== 'number') return index;
    if (resolved.has(index)) return resolved.get(index);
    if (pathStack.includes(index)) return `[Circular reference to ${index}]`;

    const val = dataList[index];
    if (val === null || val === undefined) return val;

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
  return resolve(1);
}

const url = 'https://huaxu.app/ap/wiki/stories/14/14004/zx03101ba';
http.get(url, (res) => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    const scriptMatch = html.match(/id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!scriptMatch) {
      console.log('No NUXT_DATA script tag found!');
      return;
    }
    const nuxtData = JSON.parse(scriptMatch[1]);
    const rootResolved = deserializeNuxtData(nuxtData);
    
    let actions = null;
    const fetchedData = rootResolved.data;
    if (Array.isArray(fetchedData)) {
      const reactiveObj = fetchedData[1];
      for (const key in reactiveObj) {
        if (reactiveObj[key] && reactiveObj[key].movie) {
          actions = reactiveObj[key].movie.actions;
          break;
        }
      }
    }
    
    if (actions) {
      console.log('Total actions:', actions.length);
      const soundPlays = actions.filter(a => a.type === 'SoundPlay' || a.soundType || a.audio);
      console.log('SoundPlay actions:', JSON.stringify(soundPlays.slice(0, 10), null, 2));
    } else {
      console.log('No movie actions found in Nuxt data!');
    }
  });
}).on('error', (err) => {
  console.error('Error fetching story:', err.message);
});
