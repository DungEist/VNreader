import http from 'https';

function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve({ url, statusCode: res.statusCode });
    }).on('error', (err) => {
      resolve({ url, statusCode: 500, error: err.message });
    });
  });
}

const urls = [
  'https://huaxu.app/ap/wiki/stories/14/14004/zx03101ba',
  'https://huaxu.app/ap/wiki/stories/14/14004/hd03101ba',
  'https://huaxu.app/ap/wiki/stories/1/1031/zx03101ba',
  'https://huaxu.app/ap/wiki/stories/1/1031/hd03101ba'
];

Promise.all(urls.map(checkUrl)).then((results) => {
  console.log(JSON.stringify(results, null, 2));
});
