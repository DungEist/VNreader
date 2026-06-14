import http from 'https';

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchHtml(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Status code ${res.statusCode} for ${url}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

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

async function main() {
  const html = await fetchHtml('https://huaxu.app/ap/wiki/stories/1/1006');
  const scriptMatch = html.match(/id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    const nuxtData = JSON.parse(scriptMatch[1]);
    const rootResolved = deserializeNuxtData(nuxtData);
    
    const fetchedData = rootResolved.data;
    if (Array.isArray(fetchedData)) {
      const reactiveObj = fetchedData[1];
      for (const key in reactiveObj) {
        if (reactiveObj[key] && reactiveObj[key].details) {
          console.log("Chapter name:", reactiveObj[key].chapter.name);
          console.log("First 3 stages:", JSON.stringify(reactiveObj[key].details.slice(0, 3), null, 2));
          break;
        }
      }
    }
  } else {
    console.log("No NUXT_DATA found!");
  }
}

main().catch(console.error);
