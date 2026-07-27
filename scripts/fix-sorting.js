const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const srcDir = path.join(__dirname, '../src');

walkDir(srcDir, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // Replace desc
    content = content.replace(/orderBy: \{ createdAt: 'desc' \}/g, "orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]");
    
    // Replace asc
    content = content.replace(/orderBy: \{ createdAt: 'asc' \}/g, "orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]");

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Updated:', filePath);
    }
  }
});
