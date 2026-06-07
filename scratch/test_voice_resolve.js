import fs from 'fs';
import path from 'path';

const audioDir = '/home/deist/Downloads/Work/pgr_extracted/audio/ja';
const movieDir = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movies';
const lipSyncDir = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movieaudiolip/ja';

// Let's inspect v215alpha and MovieHD03401BA.json
const voiceFolder = 'v215alpha';
const movieFile = 'MovieHD03401BA.json';

const lipSyncPath = path.join(lipSyncDir, voiceFolder, movieFile);
const moviePath = path.join(movieDir, movieFile);

console.log('Lip sync file exists:', fs.existsSync(lipSyncPath));
console.log('Movie file exists:', fs.existsSync(moviePath));

if (fs.existsSync(moviePath)) {
  const movieData = JSON.parse(fs.readFileSync(moviePath, 'utf8'));
  const nodes = movieData.filter(n => n.Type === 301 && n.Params.includes('18:'));
  console.log(`Found ${nodes.length} voiced nodes in movie`);
  
  nodes.slice(0, 10).forEach(n => {
    console.log('Node Params:', n.Params);
  });
}

// List all files in the audio ja folders
const folders = fs.readdirSync(audioDir);
console.log('\nSample folders in audio/ja:');
folders.slice(0, 20).forEach(f => {
  const stat = fs.statSync(path.join(audioDir, f));
  if (stat.isDirectory()) {
    console.log(`- ${f} (${fs.readdirSync(path.join(audioDir, f)).length} files)`);
  }
});

// Let's see if we can find files containing cueId parts
const searchCue = '100005157';
console.log(`\nSearching for any files related to ${searchCue} inside ${audioDir}...`);

function traverse(dir) {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      traverse(full);
    } else {
      if (item.includes(searchCue) || item.includes('5157') || item.includes('57')) {
        // If it's a match, print it
        if (full.includes('v_luciaalpha') || full.includes('lucia')) {
          console.log('Match:', full);
        }
      }
    }
  }
}

traverse(audioDir);
