import fs from 'fs';

const filePath = '/home/deist/.gemini/antigravity/brain/1060fc8c-f8a7-4417-9843-8b2bed8cd991/.system_generated/steps/746/content.md';
const content = fs.readFileSync(filePath, 'utf8');

// Regex to find <h2><span class="mr-1">31-X </span> Title</h2>
// and then find any <a href="/ap/wiki/stories/1/1031/zx...ba" style tags or text before the next <h2>
const h2Regex = /<span class="mr-1">(31-\d+)\s*<\/span>\s*([^<]+)<\/h2>([\s\S]*?)(?=<h2|<div class="container|$)/g;

let match;
while ((match = h2Regex.exec(content)) !== null) {
  const stage = match[1];
  const title = match[2].trim();
  const subContent = match[3];
  
  // Find all hrefs inside subContent
  const hrefRegex = /\/ap\/wiki\/stories\/1\/1031\/([a-zA-Z0-9]+)/g;
  let hrefMatch;
  const links = [];
  while ((hrefMatch = hrefRegex.exec(subContent)) !== null) {
    links.push(hrefMatch[1]);
  }
  
  console.log(`${stage} - ${title}: [${links.join(', ')}]`);
}
