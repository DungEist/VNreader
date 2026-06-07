import fs from 'fs';
import path from 'path';

const summaryPath = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/MovieSkipSummary.json';
const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

// Sample entries from different parts of the list
console.log(`Total entries: ${data.length}`);
const uniqueTitles = new Set();
data.forEach(item => {
  let title = item.Title;
  if (title.includes(':')) {
    title = title.split(':')[0].trim();
  } else if (title.includes('-')) {
    title = title.split('-')[0].trim();
  }
  uniqueTitles.add(title);
});

console.log('Storylines in MovieSkipSummary.json:');
console.log(Array.from(uniqueTitles));

console.log('\nFirst 10 entries details:');
console.log(data.slice(0, 10));

console.log('\nLast 10 entries details:');
console.log(data.slice(-10));
