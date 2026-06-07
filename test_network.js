import http from 'https';

http.get('https://huaxu.app/ap/wiki/stories/1/1032', (res) => {
  console.log('Status code:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Data length:', data.length);
  });
}).on('error', (err) => {
  console.error('Fetch error:', err.message);
});
