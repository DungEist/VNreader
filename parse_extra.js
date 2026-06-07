import fs from 'fs';
import path from 'path';

const filePath = '/home/deist/.gemini/antigravity/brain/1060fc8c-f8a7-4417-9843-8b2bed8cd991/.system_generated/steps/808/content.md';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Find all links like href="/ap/wiki/stories/8/XXXX" or similar
  const regex = /href="\/ap\/wiki\/stories\/8\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    console.log(`ID: ${match[1]}, Name: ${match[2].replace(/<[^>]*>/g, '').trim()}`);
  }
} else {
  console.log('File not found');
}
