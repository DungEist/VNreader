import fs from 'fs';

const content = fs.readFileSync('/home/deist/.gemini/antigravity/brain/1060fc8c-f8a7-4417-9843-8b2bed8cd991/.system_generated/steps/746/content.md', 'utf8');

// A robust regex to find <h2> tags containing <span class="mr-1">StageNum </span> StageTitle
// followed by any links up to the next h2 or section boundary
const regex = /<h2[^>]*>\s*<span[^>]*>([^<]+)<\/span>\s*([^<]+)<\/h2>([\s\S]*?)(?=<h2|<article|<\/article|<div class="container|$)/gi;

let match;
while ((match = regex.exec(content)) !== null) {
  const stageNum = match[1].trim();
  const stageTitle = match[2].replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').trim();
  const subContent = match[3];
  
  // Find links like "/ap/wiki/stories/..."
  const linkRegex = /\/ap\/wiki\/stories\/\d+\/\d+\/([a-zA-Z0-9]+)/gi;
  let linkMatch;
  const storyIds = [];
  while ((linkMatch = linkRegex.exec(subContent)) !== null) {
    storyIds.push(linkMatch[1].toUpperCase());
  }
  
  console.log(`Stage: "${stageNum}" -> Title: "${stageTitle}" -> StoryIds: ${JSON.stringify(storyIds)}`);
}
