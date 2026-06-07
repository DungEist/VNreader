import fs from 'fs';

const cachePath = '/home/deist/Downloads/Work/pgr_extracted/.cache.json';
if (fs.existsSync(cachePath)) {
  const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  console.log('Cache keys:', Object.keys(data).slice(0, 20));
  console.log('Sample entry:', Object.entries(data)[0]);
} else {
  console.log('File not found');
}
