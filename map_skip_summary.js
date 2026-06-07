import fs from 'fs';
import path from 'path';

const summaryPath = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/MovieSkipSummary.json';
const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

const prefixToTitles = {};
data.forEach(item => {
  const match = item.StoryId.match(/^([A-Za-z]+\d+)/);
  if (match) {
    const prefix = match[1];
    if (!prefixToTitles[prefix]) prefixToTitles[prefix] = new Set();
    prefixToTitles[prefix].add(item.Title);
  }
});

console.log('--- Prefix to Titles in MovieSkipSummary.json ---');
Object.entries(prefixToTitles).sort().forEach(([pref, titles]) => {
  console.log(`${pref}:`);
  titles.forEach(t => console.log(`  - ${t}`));
});
