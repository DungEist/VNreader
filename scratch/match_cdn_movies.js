import fs from 'fs';

const cdnMovies = JSON.parse(fs.readFileSync('/home/deist/Downloads/Work/PGR_reader/scratch/cdn_movies.json', 'utf8'));
const type503Nodes = [
  "50001", "50002", "10026", "20002", "10006", "10007", "10009", "10015", "10017",
  "10019", "10021", "10022", "10032", "10035", "10038", "10036", "10045", "10052",
  "10055", "10071", "10072", "10079", "10080", "10082", "10084", "10099", "10107"
];

for (const id of type503Nodes) {
  const matches = cdnMovies.filter(m => m.name.includes(id));
  console.log(`ID ${id}:`, matches.map(m => m.name));
}
