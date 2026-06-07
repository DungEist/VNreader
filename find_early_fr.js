import fs from 'fs';

const data = JSON.parse(fs.readFileSync('/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/MovieSkipSummary.json', 'utf8'));

const keywords = ['whale', 'ark', 'cinder', 'unsaid', 'reverie', 'wrath', 'day breaks'];
const matches = [];

data.forEach(item => {
  const title = item.Title.toLowerCase();
  const content = item.SummaryContent.toLowerCase();
  if (keywords.some(k => title.includes(k) || content.includes(k))) {
    matches.push(item);
  }
});

console.log(`Found ${matches.length} matches:`);
matches.forEach(m => console.log(`${m.StoryId} -> Title: "${m.Title}"`));
