import http from 'https';
import fs from 'fs';
import path from 'path';

// Define target chapters to scrape
const tasks = [];

// Category 1: Main Story (Normal) 1000 to 1041
for (let id = 1000; id <= 1041; id++) {
  tasks.push({ catId: 1, chapId: id, url: `https://huaxu.app/ap/wiki/stories/1/${id}` });
}

// Category 2: Main Story (Hidden) 2001 to 2016
for (let id = 2001; id <= 2016; id++) {
  tasks.push({ catId: 2, chapId: id, url: `https://huaxu.app/ap/wiki/stories/2/${id}` });
}

// Category 14: Floating Record 14001 to 14016
for (let id = 14001; id <= 14016; id++) {
  tasks.push({ catId: 14, chapId: id, url: `https://huaxu.app/ap/wiki/stories/14/${id}` });
}

// Category 8: Extra Story 8001 to 8005 (EX01-05) and Category 6: 6002 (EX00)
for (let id = 8001; id <= 8005; id++) {
  tasks.push({ catId: 8, chapId: id, url: `https://huaxu.app/ap/wiki/stories/8/${id}` });
}
tasks.push({ catId: 6, chapId: 6002, url: `https://huaxu.app/ap/wiki/stories/6/6002` });

console.log(`Prepared ${tasks.length} scraping tasks.`);

const categoryNames = {
  1: 'Main Story (Normal)',
  2: 'Main Story (Hidden)',
  14: 'Floating Record',
  8: 'Extra Story',
  6: 'Extra Story' // Map EX00 to Extra Story
};

// Queue helper to run requests in parallel with concurrency limit
async function runWithLimit(tasks, limit) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const task = tasks[index++];
      try {
        const html = await fetchHtml(task.url);
        const parsed = parsePage(html, task.catId, task.chapId);
        results.push(...parsed);
      } catch (err) {
        console.error(`Failed task ${task.url}: ${err.message}`);
      }
    }
  }

  const workers = Array(limit).fill(null).map(worker);
  await Promise.all(workers);
  return results;
}

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Status code ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parsePage(html, catId, chapId) {
  // Extract Chapter Title
  // Look for: <title>ChapterTitle | Stories | Huaxu</title>
  const titleMatch = html.match(/<title>([^|]+)\|/i);
  let chapterTitle = titleMatch ? titleMatch[1].trim() : `Chapter ${chapId}`;
  
  // Clean chapterTitle
  chapterTitle = chapterTitle
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();

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

    const linkRegex = /\/ap\/wiki\/stories\/\d+\/\d+\/([a-zA-Z0-9]+)/gi;
    let linkMatch;
    const storyIds = [];
    while ((linkMatch = linkRegex.exec(subContent)) !== null) {
      storyIds.push(linkMatch[1].toUpperCase());
    }

    stages.push({
      category: categoryNames[catId] || 'Extra Story',
      chapterId: chapId,
      chapterTitle: chapterTitle,
      stageNum: stageNum,
      stageTitle: stageTitle,
      storyIds: storyIds
    });
  }
  return stages;
}

async function main() {
  console.log('Scraping huaxu.app pages...');
  const allStages = await runWithLimit(tasks, 10);
  console.log(`Scraped ${allStages.length} stages total.`);
  
  // Save to JSON database
  const outputPath = '/home/deist/Downloads/Work/PGR_reader/wiki_db.json';
  fs.writeFileSync(outputPath, JSON.stringify(allStages, null, 2), 'utf8');
  console.log(`Saved database to ${outputPath}`);
}

main().catch(console.error);
