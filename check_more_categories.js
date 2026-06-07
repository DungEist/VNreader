import http from 'https';

function checkCategory(catId) {
  return new Promise((resolve) => {
    http.get(`https://huaxu.app/ap/wiki/stories/${catId}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const regex = new RegExp(`href="\\/ap\\/wiki\\/stories\\/${catId}\\/(\\d+)"[^>]*>([\\s\\S]*?)<\\/a>`, 'gi');
        let match;
        const results = [];
        while ((match = regex.exec(data)) !== null) {
          results.push({ id: match[1], name: match[2].replace(/<[^>]*>/g, '').trim() });
        }
        resolve({ catId, results });
      });
    }).on('error', (err) => {
      resolve({ catId, error: err.message });
    });
  });
}

Promise.all([checkCategory(9), checkCategory(3)]).then((outputs) => {
  outputs.forEach(o => {
    console.log(`=== Category ${o.catId} ===`);
    if (o.error) {
      console.log('Error:', o.error);
    } else {
      console.log(`Found ${o.results.length} entries:`);
      o.results.forEach(r => console.log(`  ID: ${r.id}, Name: ${r.name}`));
    }
  });
});
