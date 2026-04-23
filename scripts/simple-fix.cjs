const fs = require('fs');
const path = require('path');

const toolsDir = 'd:/Unreal/AI/Vanity/src/components/tools';

function findFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findFiles(fullPath));
    else if (entry.name.endsWith('.tsx')) results.push(fullPath);
  }
  return results;
}

const files = findFiles(toolsDir);
let fixed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  // Manual string replacements for the most common fails
  content = content.replace(/description=\{\`\`\$\$\{/g, 'description={`${');
  content = content.replace(/\} images queued\`\`\}/g, '} images queued`}');
  content = content.replace(/description=\{\`\`Target: \$\$\{/g, 'description={`Target: ${');
  content = content.replace(/description=\{\`\`Processing: \$\$\{/g, 'description={`Processing: ${');
  content = content.replace(/description=\{\`\`File: \$\$\{/g, 'description={`File: ${');
  content = content.replace(/description=\{\`\`Extracted from \$\$\{/g, 'description={`Extracted from ${');
  content = content.replace(/\`\`\}/g, '`}');

  // Fix onBack
  content = content.replace(/\} backLabel=/g, '}} backLabel=');
  // Avoid double }} if it was already correct
  content = content.replace(/\}\}\} backLabel=/g, '}} backLabel=');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf-8');
    fixed++;
    console.log('FIXED:', path.relative(toolsDir, file));
  }
}

console.log(`\nFixed ${fixed} files`);
