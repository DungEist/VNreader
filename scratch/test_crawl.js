import http from 'https';
import fs from 'fs';

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
  // Let's check Category 1 (Main Story)
  const catHtml = await fetchHtml(`https://huaxu.app/ap/wiki/stories/1`);
  const chapRegex = /\/ap\/wiki\/stories\/1\/(\d+)(?=["'\s>])/g;
  let chapMatch;
  const chaps = new Set();
  while ((chapMatch = chapRegex.exec(catHtml)) !== null) {
    chaps.add(parseInt(chapMatch[1]));
  }
  console.log("Chapters in Category 1:", Array.from(chaps).length);
  
  // Fetch one chapter, e.g. 1006
  const chapHtml = await fetchHtml(`https://huaxu.app/ap/wiki/stories/1/1006`);
  const stages = parseChapterPage(chapHtml, 1, 1006);
  console.log("Stages in Chapter 1006:", stages.length);
  console.log("Stages detail:", JSON.stringify(stages, null, 2));
}

main().catch(console.error);
