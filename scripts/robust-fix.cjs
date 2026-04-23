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

  // 1. Fix template literal escaping
  const badTplRe = /description=\{\`\`([\s\S]+?)\`\`\}/g;
  if (badTplRe.test(content)) {
    content = content.replace(badTplRe, (match, p1) => {
      const fixedInner = p1.replace(/\$\$\{/g, '${');
      return `description={\`${fixedInner}\`}`;
    });
    changed = true;
  }

  // 2. Fix nested expression props
  const nestedRe = /description=\{\s*([^`{}]+?)\s*:\s*\{([^}]+?)\}\s*\}/g;
  if (nestedRe.test(content)) {
    content = content.replace(nestedRe, "description={`$1: ${$2}`}");
    changed = true;
  }

  // 3. Fix onBack missing closing brace
  const onBackRe = /onBack=\{([^}]+?\{[^}]+?\})\s+backLabel=/g;
  if (onBackRe.test(content)) {
    content = content.replace(onBackRe, 'onBack={$1} backLabel=');
    changed = true;
  }

  // 4. Fix closing tags for ToolLayout and ToolUploadLayout
  // We find the last </div> before the end of a return statement
  if (content.includes('<ToolLayout') && !content.includes('</ToolLayout>')) {
     // Replace the LAST </div> in the file with </ToolLayout>
     const parts = content.split('</div>');
     if (parts.length > 1) {
       const last = parts.pop();
       content = parts.join('</div>') + '</ToolLayout>' + last;
       changed = true;
     }
  }
  
  if (content.includes('<ToolUploadLayout') && !content.includes('</ToolUploadLayout>')) {
     const parts = content.split('</div>');
     if (parts.length > 1) {
       const last = parts.pop();
       content = parts.join('</div>') + '</ToolUploadLayout>' + last;
       changed = true;
     }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf-8');
    fixed++;
    console.log('FIXED:', path.relative(toolsDir, file));
  }
}

console.log(`\nFixed ${fixed} files`);
