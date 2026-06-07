import fs from 'fs';
import path from 'path';

const filePath = '/home/deist/.gemini/antigravity/brain/1060fc8c-f8a7-4417-9843-8b2bed8cd991/.system_generated/steps/804/content.md';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Look for any links like /ap/wiki/stories/14/... or similar and their titles
  const regex = /href="\/ap\/wiki\/stories\/14\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    console.log(`ID: ${match[1]}, Name: ${match[2].replace(/<[^>]*>/g, '').trim()}`);
  }
} else {
  console.log('File not found');
}
