import fs from 'fs';

const data = JSON.parse(fs.readFileSync('/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/MovieSkipSummary.json', 'utf8'));

// Search for titles containing "ER" or "Floating Record" or "Reveries" or "Ark"
const keywords = ['ER', 'Floating Record', 'Reveries', 'The Ark Beyond', 'Cinder Burns', 'Left Unsaid', 'The Floating Reverie', 'Sands of Wrath', 'When Day Breaks'];
const matches = data.filter(item => {
  const title = item.Title.toLowerCase();
  return keywords.some(k => title.includes(k.toLowerCase()));
});

console.log('Matches:');
matches.forEach(m => console.log(`${m.StoryId} -> ${m.Title}`));
