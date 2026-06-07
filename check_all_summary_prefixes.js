import fs from 'fs';

const data = JSON.parse(fs.readFileSync('/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/MovieSkipSummary.json', 'utf8'));

const prefixToSample = {};
data.forEach(item => {
  const match = item.StoryId.match(/^([A-Za-z]+)(\d+)/);
  if (match) {
    const key = match[1];
    if (!prefixToSample[key]) {
      prefixToSample[key] = [];
    }
    if (prefixToSample[key].length < 3) {
      prefixToSample[key].push(`${item.StoryId}: ${item.Title}`);
    }
  }
});

console.log('Prefix mappings in MovieSkipSummary.json:');
Object.entries(prefixToSample).sort().forEach(([pref, samples]) => {
  console.log(`${pref}:`);
  samples.forEach(s => console.log(`  - ${s}`));
});
