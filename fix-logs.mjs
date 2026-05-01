import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src/app/api');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('console.error') || content.includes('console.log')) {
    // Add import if missing
    if (!content.includes("import { logger } from '@/lib/logger'")) {
      // find last import
      const lines = content.split('\n');
      let lastImportIdx = -1;
      for (let i=0; i<lines.length; i++) {
        if (lines[i].startsWith('import ')) lastImportIdx = i;
      }
      if (lastImportIdx !== -1) {
        lines.splice(lastImportIdx + 1, 0, "import { logger } from '@/lib/logger'");
        content = lines.join('\n');
      } else {
        content = "import { logger } from '@/lib/logger'\n" + content;
      }
    }

    // replace console.error
    content = content.replace(/console\.error\(/g, 'logger.error(');
    // replace console.log
    content = content.replace(/console\.log\(/g, 'logger.info(');

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
