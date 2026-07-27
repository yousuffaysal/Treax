const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFiles() {
  const srcDir = path.join(__dirname, '../src');
  
  walkDir(srcDir, (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      let changed = false;

      // 1. Add avatarUrl to type definitions
      if (content.includes('avatarColor: string;')) {
        content = content.replace(/avatarColor: string;/g, 'avatarColor: string; avatarUrl?: string | null;');
        changed = true;
      }
      
      // 2. Add avatarUrl to Prisma selects
      if (content.includes('avatarColor: true')) {
        content = content.replace(/avatarColor: true,?/g, 'avatarColor: true, avatarUrl: true,');
        changed = true;
      }
      
      // 3. Add avatarUrl to object passing (like viewer={{..., avatarColor: viewer.avatarColor}})
      if (content.includes('avatarColor: viewer.avatarColor')) {
        content = content.replace(/avatarColor: viewer.avatarColor/g, 'avatarColor: viewer.avatarColor, avatarUrl: viewer.avatarUrl');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Updated:', filePath);
      }
    }
  });
}

processFiles();
