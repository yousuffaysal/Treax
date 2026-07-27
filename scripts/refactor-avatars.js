const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/app/(app)/messages/thread-list.tsx',
  'src/app/(app)/admin/admin-users.tsx',
  'src/app/(app)/u/[handle]/page.tsx',
  'src/app/(app)/game/signal-rush.tsx',
  'src/app/(app)/search/page.tsx',
  'src/app/(app)/team/page.tsx',
  'src/app/(app)/experts/page.tsx',
  'src/app/(app)/market/page.tsx',
  'src/app/(app)/p/[id]/page.tsx',
  'src/components/messages/chat-dock.tsx',
  'src/components/layout/left-rail.tsx',
  'src/components/layout/top-bar.tsx',
  'src/components/feed/feed-client.tsx',
  'src/components/feed/composer.tsx',
  'src/components/feed/post-card.tsx'
];

function replaceAvatarBlocks() {
  filesToUpdate.forEach(file => {
    const filePath = path.join(__dirname, '../', file);
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // We will use a regex to match the blocks. 
    // Usually it looks like:
    // <div style={{ ... background: var.avatarColor ... width: XX, height: YY ... }}> {var.initials} </div>
    // or <Link ... > {var.initials} </Link>
    // We can just replace the innermost {var.initials} and the background style, 
    // or replace the entire block.
    // It's easier to replace `{var.initials}` with `<Avatar user={var} size={48} />`
    // AND remove `background: var.avatarColor,` and `color: '#fff',` and `font: ...` from the enclosing tag.

    // Regex to match `{xxx.initials}`
    const initialsRegex = /\{([a-zA-Z0-9_?.]+)\.initials(?: \?\? [^}]+)?\}/g;
    
    // First, let's find all variables used for initials.
    let match;
    const vars = new Set();
    while ((match = initialsRegex.exec(content)) !== null) {
       let varName = match[1];
       if (varName.endsWith('?')) varName = varName.slice(0, -1);
       vars.add(varName);
    }

    if (vars.size > 0 && !content.includes("import { Avatar } from '@/components/ui/avatar';")) {
       // Add import after the last import
       const importRegex = /^import .+;$/gm;
       let lastImportIndex = 0;
       while (importRegex.exec(content) !== null) {
          lastImportIndex = importRegex.lastIndex;
       }
       content = content.slice(0, lastImportIndex) + "\nimport { Avatar } from '@/components/ui/avatar';" + content.slice(lastImportIndex);
    }

    vars.forEach(v => {
       // We replace `{v.initials}` with `<Avatar user={v} size={48} />`
       // But wait, what if size is different? 
       // In Treax, sizes are usually 48, 40, 32. 
       // We can extract size from the preceding width: XX
       // It's a bit complex, let's just do size={48} or let CSS scale it by changing the component to w-full h-full.
       // Actually, in our Avatar component, we take size.
       
       // Let's do a smart regex replacement:
       // We look for `<div ... width: 32 ... {v.initials} </div>`
       // This is hard to do with simple regex. Let's just replace the whole files where possible or use a fallback size.
    });

    // Instead of full AST parsing, let's just manually replace the {v.initials} with `<Avatar user={v} />`
    // And modify Avatar component to take 100% width/height of its parent if size is not provided, 
    // OR we just use a default size and it might look slightly off in some places but it will work.
  });
}
