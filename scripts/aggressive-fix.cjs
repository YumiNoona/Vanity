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

  // 1. Fix the horrible double-backtick double-dollar pattern
  // Matches: description={``...$${var}...``}
  const megaFailRe = /description=\{\`\`([\s\S]+?)\`\`\}/g;
  if (megaFailRe.test(content)) {
    content = content.replace(megaFailRe, (match, p1) => {
      const fixedInner = p1.replace(/\$\$\{/g, '${').replace(/\`\`/g, '`');
      return `description={\`${fixedInner}\`}`;
    });
    changed = true;
  }

  // 2. Fix the broken ternary/expression pattern
  // Matches: description={Anything: {var}}
  const propRe = /description=\{\s*([^{}]+?)\s*:\s*\{([^}]+?)\}\s*\}/g;
  if (propRe.test(content)) {
    content = content.replace(propRe, "description={`$1: ${$2}`}");
    changed = true;
  }

  // 3. Fix onBack missing closing brace
  const onBackRe = /onBack=\{([^}]+?\{[^}]+?\})\s+backLabel=/g;
  if (onBackRe.test(content)) {
    content = content.replace(onBackRe, 'onBack={$1} backLabel=');
    changed = true;
  }

  // 4. Fix closing tags
  if (content.includes('<ToolLayout') && !content.includes('</ToolLayout>')) {
     // Find the return statement and replace the last </div> before it ends
     content = content.replace(/<\/div>(\s*)\)\s*(\n\s*\}|\n\s*if)/g, '</ToolLayout>$1)$2');
     changed = true;
  }
  if (content.includes('<ToolUploadLayout') && !content.includes('</ToolUploadLayout>')) {
     content = content.replace(/<\/div>(\s*)\)\s*(\n\s*\}|\n\s*if)/g, '</ToolUploadLayout>$1)$2');
     changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf-8');
    fixed++;
    console.log('FIXED:', path.relative(toolsDir, file));
  }
}

console.log(`\nFixed ${fixed} files`);
