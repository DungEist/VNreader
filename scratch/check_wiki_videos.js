import fs from 'fs';

const wikiDb = JSON.parse(fs.readFileSync('/home/deist/Downloads/Work/PGR_reader/wiki_db.json', 'utf8'));

// Search for any keys or values containing video or mp4 in the database
const videoEntries = [];

for (const entry of wikiDb) {
  const entryStr = JSON.stringify(entry).toLowerCase();
  if (entryStr.includes('video') || entryStr.includes('.mp4') || entryStr.includes('movie') || entryStr.includes('cutscene')) {
    videoEntries.push(entry);
    if (videoEntries.length >= 10) break;
  }
}

console.log('Sample entries matching video/movie/cutscene in wiki_db.json:');
console.log(JSON.stringify(videoEntries, null, 2));
