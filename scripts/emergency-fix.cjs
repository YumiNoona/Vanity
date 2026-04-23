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
  let changed = false;

  // Fix 1: description={``...$${var}...``} -> description={`...${var}...`}
  const badDescRe = /description=\{\`\`([\s\S]+?)\`\`\}/g;
  if (badDescRe.test(content)) {
    content = content.replace(badDescRe, (match, p1) => {
      const fixedInner = p1.replace(/\$\$\{/g, '${');
      return `description={\`${fixedInner}\`}`;
    });
    changed = true;
  }

  // Fix 2: onBack missing closing brace for block
  const onBackRe = /onBack=\{([^}]+?\{[^}]+?\})\s+backLabel=/g;
  if (onBackRe.test(content)) {
    content = content.replace(onBackRe, 'onBack={$1} backLabel=');
    changed = true;
  }

  // Fix 3: ToolLayout missing closing tag (closing with </div>)
  // This is tricky. We look for a return that starts with <ToolLayout and ends with </div>
  if (content.includes('<ToolLayout') && !content.includes('</ToolLayout>')) {
     content = content.replace(/<\/div>(\s+)\)\s+\}/, '</ToolLayout>$1)}');
     changed = true;
  }
  
  if (content.includes('<ToolUploadLayout') && !content.includes('</ToolUploadLayout>')) {
     content = content.replace(/<\/div>(\s+)\)\s+\}/, '</ToolUploadLayout>$1)}');
     changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf-8');
    fixed++;
    console.log('FIXED:', path.relative(toolsDir, file));
  }
}

console.log(`\nFixed ${fixed} files`);
