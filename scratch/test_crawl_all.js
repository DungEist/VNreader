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

function parseChapterPage(html, catId, chapId) {
  const titleMatch = html.match(/<title>([^|]+)\|/i);
  let chapterTitle = titleMatch ? titleMatch[1].trim() : `Chapter ${chapId}`;
  const stages = [];
  const regex = /<h2[^>]*>\s*<span[^>]*>([^<]+)<\/span>\s*([^<]+)<\/h2>([\s\S]*?)(?=<h2|<article|<\/article|<div class="container|$)/gi;

  let match;
  while ((match = regex.exec(html)) !== null) {
    const stageNum = match[1].trim();
    const stageTitle = match[2].trim();
    const subContent = match[3];

    const linkRegex = /\/ap\/wiki\/stories\/\d+\/\d+\/([a-zA-Z0-9]+)/gi;
    let linkMatch;
    const storyIds = [];
    while ((linkMatch = linkRegex.exec(subContent)) !== null) {
      storyIds.push(linkMatch[1].toUpperCase());
    }

    stages.push({
      category: String(catId),
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
  const rootHtml = await fetchHtml('https://huaxu.app/ap/wiki/stories');
  const catRegex = /\/ap\/wiki\/stories\/(\d+)(?=["'\s>])/g;
  let catMatch;
  const categories = new Set();
  while ((catMatch = catRegex.exec(rootHtml)) !== null) {
    categories.add(parseInt(catMatch[1]));
  }
  
  const results = {};
  for (const catId of categories) {
    const catHtml = await fetchHtml(`https://huaxu.app/ap/wiki/stories/${catId}`);
    const chapRegex = new RegExp(`\\/ap\\/wiki\\/stories\\/${catId}\\/(\\d+)(?=["'\\s>])`, 'g');
    let chapMatch;
    const chaps = new Set();
    while ((chapMatch = chapRegex.exec(catHtml)) !== null) {
      chaps.add(parseInt(chapMatch[1]));
    }
    
    let totalStages = 0;
    // Fetch only the first chapter of each category to see if it parses correctly
    const firstChap = Array.from(chaps)[0];
    if (firstChap) {
      try {
        const chapHtml = await fetchHtml(`https://huaxu.app/ap/wiki/stories/${catId}/${firstChap}`);
        const stages = parseChapterPage(chapHtml, catId, firstChap);
        totalStages = stages.length;
        console.log(`Category ${catId} (First Chap ${firstChap}): parsed ${totalStages} stages`);
      } catch (err) {
        console.log(`Category ${catId} (First Chap ${firstChap}): failed: ${err.message}`);
      }
    }
  }
}

main().catch(console.error);
