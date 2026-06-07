import http from 'https';

http.get('https://huaxu.app/ap/wiki/stories/1/1032', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex = /<h2[^>]*>\s*<span[^>]*>([^<]+)<\/span>\s*([^<]+)<\/h2>([\s\S]*?)(?=<h2|<article|<\/article|<div class="container|$)/gi;
    let match;
    console.log('Chapter 32 Stages:');
    while ((match = regex.exec(data)) !== null) {
      const stageNum = match[1].trim();
      const stageTitle = match[2].replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').trim();
      const subContent = match[3];
      
      const linkRegex = /\/ap\/wiki\/stories\/\d+\/\d+\/([a-zA-Z0-9]+)/gi;
      let linkMatch;
      const storyIds = [];
      while ((linkMatch = linkRegex.exec(subContent)) !== null) {
        storyIds.push(linkMatch[1].toUpperCase());
      }
      console.log(`  Stage: ${stageNum} - ${stageTitle} -> ${JSON.stringify(storyIds)}`);
    }
  });
}).on('error', (err) => {
  console.log('Error:', err);
});
