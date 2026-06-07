import fs from 'fs';
import path from 'path';

const moviesDir = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movies';

function processFiles(pattern, dryRun = true) {
  const files = fs.readdirSync(moviesDir).filter(f => f.toUpperCase().includes(pattern.toUpperCase()) && f.endsWith('.json'));
  console.log(`Found ${files.length} files matching "${pattern}". DryRun: ${dryRun}`);
  
  let totalReplacements = 0;
  
  files.forEach(file => {
    const filePath = path.join(moviesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const regex = /\.(jpe?g)/gi;
    const matchCount = (content.match(regex) || []).length;
    
    if (matchCount > 0) {
      totalReplacements += matchCount;
      console.log(`- File ${file}: found ${matchCount} matches`);
      
      if (!dryRun) {
        const updatedContent = content.replace(regex, '.png');
        fs.writeFileSync(filePath, updatedContent, 'utf8');
      }
    }
  });
  
  console.log(`\nTotal occurrences found: ${totalReplacements}`);
  if (!dryRun) {
    console.log('Successfully wrote changes to files.');
  } else {
    console.log('Dry run complete. No files were modified.');
  }
}

// Parse args
const args = process.argv.slice(2);
const pattern = args[0] || 'ZX048';
const dryRun = args[1] !== 'false';

processFiles(pattern, dryRun);
