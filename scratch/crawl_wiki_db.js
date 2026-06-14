import http from 'https';
import fs from 'fs';
import path from 'path';

const outputPath = '/home/deist/Downloads/Work/PGR_reader/public/wiki_db.json';

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Handle redirect
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

function parseChapterPage(html, catId, chapId) {
  const titleMatch = html.match(/<title>([^|]+)\|/i);
  let chapterTitle = titleMatch ? titleMatch[1].trim() : `Chapter ${chapId}`;
  chapterTitle = chapterTitle
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();

  // Try parsing NUXT_DATA first
  const scriptMatch = html.match(/id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    try {
      const nuxtData = JSON.parse(scriptMatch[1]);
      const rootResolved = deserializeNuxtData(nuxtData);
      const fetchedData = rootResolved.data;
      if (Array.isArray(fetchedData)) {
        const reactiveObj = fetchedData[1];
        for (const key in reactiveObj) {
          if (reactiveObj[key] && reactiveObj[key].details) {
            const details = reactiveObj[key].details;
            if (reactiveObj[key].chapter && reactiveObj[key].chapter.name) {
              chapterTitle = reactiveObj[key].chapter.name.trim();
            }
            
            const stages = details.map(item => {
              const stageNum = item.subName ? item.subName.replace(/_/g, '-') : (item.name || '');
              const stageTitle = item.subName ? (item.name || '') : '';
              const storyIds = [item.before, item.after]
                .filter(Boolean)
                .map(id => id.toUpperCase());
                
              return {
                category: String(catId),
                chapterId: chapId,
                chapterTitle: chapterTitle,
                stageNum: stageNum,
                stageTitle: stageTitle,
                storyIds: storyIds
              };
            });
            
            if (stages.length > 0) {
              return stages;
            }
          }
        }
      }
    } catch (err) {
      console.warn(`Nuxt data parsing failed for chapter ${chapId}, falling back to regex:`, err.message);
    }
  }

  // Fallback to HTML regex parsing
  const stages = [];
  const regex = /<h2[^>]*>\s*<span[^>]*>([^<]+)<\/span>\s*([^<]+)<\/h2>([\s\S]*?)(?=<h2|<article|<\/article|<div class="container|$)/gi;

  let match;
  while ((match = regex.exec(html)) !== null) {
    const stageNum = match[1].trim();
    const stageTitle = match[2]
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&')
      .trim();
    const subContent = match[3];

    // Find links like /ap/wiki/stories/catId/chapId/storyId
    const linkRegex = /\/ap\/wiki\/stories\/\d+\/\d+\/([a-zA-Z0-9]+)/gi;
    let linkMatch;
    const storyIds = [];
    while ((linkMatch = linkRegex.exec(subContent)) !== null) {
      storyIds.push(linkMatch[1].toUpperCase());
    }

    stages.push({
      category: String(catId), // Store category ID as string
      chapterId: chapId,
      chapterTitle: chapterTitle,
      stageNum: stageNum,
      stageTitle: stageTitle,
      storyIds: storyIds
    });
  }
  return stages;
}

// Queue runner to limit concurrency
async function runWithLimit(tasks, limit, workerFn) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const task = tasks[index++];
      try {
        const res = await workerFn(task);
        if (res) results.push(...res);
      } catch (err) {
        console.error(`Error processing task: ${err.message}`);
      }
    }
  }

  const workers = Array(limit).fill(null).map(worker);
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('Fetching root stories page to find categories...');
  const rootUrl = 'https://huaxu.app/ap/wiki/stories';
  const rootHtml = await fetchHtml(rootUrl);

  // Extract all category IDs (e.g. /ap/wiki/stories/1, /ap/wiki/stories/11)
  const catRegex = /\/ap\/wiki\/stories\/(\d+)(?=["'\s>])/g;
  let catMatch;
  const categories = new Set();
  while ((catMatch = catRegex.exec(rootHtml)) !== null) {
    categories.add(parseInt(catMatch[1]));
  }
  
  console.log('Found categories:', Array.from(categories));

  const chapterTasks = [];
  // For each category, fetch its index and find chapter links
  for (const catId of categories) {
    console.log(`Fetching category index page for category ${catId}...`);
    try {
      const catHtml = await fetchHtml(`https://huaxu.app/ap/wiki/stories/${catId}`);
      // Find chapter links like /ap/wiki/stories/catId/chapId
      const chapRegex = new RegExp(`\\/ap\\/wiki\\/stories\\/${catId}\\/(\\d+)(?=["'\\s>])`, 'g');
      let chapMatch;
      const chaps = new Set();
      while ((chapMatch = chapRegex.exec(catHtml)) !== null) {
        chaps.add(parseInt(chapMatch[1]));
      }
      console.log(`Category ${catId} has chapters:`, Array.from(chaps));
      for (const chapId of chaps) {
        chapterTasks.push({ catId, chapId });
      }
    } catch (err) {
      console.error(`Failed category ${catId}: ${err.message}`);
    }
  }

  console.log(`Total chapters to crawl: ${chapterTasks.length}`);

  const allStages = await runWithLimit(chapterTasks, 8, async (task) => {
    const url = `https://huaxu.app/ap/wiki/stories/${task.catId}/${task.chapId}`;
    console.log(`Crawling chapter: ${url}`);
    try {
      const html = await fetchHtml(url);
      return parseChapterPage(html, task.catId, task.chapId);
    } catch (err) {
      console.error(`Failed to crawl chapter ${url}: ${err.message}`);
      return [];
    }
  });

  console.log(`Crawled ${allStages.length} stages in total.`);
  fs.writeFileSync(outputPath, JSON.stringify(allStages, null, 2), 'utf8');
  console.log(`Saved comprehensive database to ${outputPath}`);
}

main().catch(console.error);
