import http from 'https';

http.get('https://huaxu.app/ap/wiki/stories/2', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Search for links href="/ap/wiki/stories/2/XXXX"
    const regex = /href="\/ap\/wiki\/stories\/2\/(\d+)"[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    console.log('Hidden chapters found:');
    while ((match = regex.exec(data)) !== null) {
      console.log(`ID: ${match[1]}, Name: ${match[2].replace(/<[^>]*>/g, '').trim()}`);
    }
  });
}).on('error', (err) => {
  console.log('Error:', err);
});
