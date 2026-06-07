import fs from 'fs';

const data = JSON.parse(fs.readFileSync('/home/deist/Downloads/Work/PGR_reader/wiki_db.json', 'utf8'));
console.log(`Loaded ${data.length} stages from wiki_db.json`);

const categoryCounts = {};
data.forEach(item => {
  categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
});
console.log('Category stage counts:', categoryCounts);

const sampleStages = data.filter(item => item.chapterId === 1032);
console.log('Sample stages from chapter 1032 (To the Galaxies):');
console.log(sampleStages.slice(0, 3));
