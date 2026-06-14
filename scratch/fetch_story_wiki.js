import http from 'https';
import fs from 'fs';

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
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
    const val = dataList[index];
    if (val === null || val === undefined) return val;
    if (Array.isArray(val)) {
      const arr = [];
      resolved.set(index, arr);
      val.forEach(item => arr.push(resolve(item, [...pathStack, index])));
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

async function run() {
  const url = 'https://huaxu.app/ap/wiki/stories/1/1036/zx05801ba';
  console.log(`Fetching ${url}...`);
  const html = await fetchHtml(url);
  const scriptMatch = html.match(/id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    const nuxtData = JSON.parse(scriptMatch[1]);
    const root = deserializeNuxtData(nuxtData);
    const fetchedData = root.data;
    if (Array.isArray(fetchedData)) {
      const reactiveObj = fetchedData[1];
      for (const key in reactiveObj) {
        if (reactiveObj[key] && reactiveObj[key].movie) {
          console.log('Movie details from wiki:');
          console.log(JSON.stringify(reactiveObj[key].movie.actions.slice(0, 10), null, 2));
          return;
        }
      }
    }
  }
  console.log('Movie actions not found');
}

run().catch(console.error);
