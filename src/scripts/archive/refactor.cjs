const fs = require('fs');
const path = require('path');

function traverse(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) traverse(fullPath, callback);
    else if (fullPath.endsWith('.tsx')) callback(fullPath);
  });
}

traverse('src/components/tools', file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('setTimeout(() => setCopied')) return;

  // Add import
  if (!content.includes('useCopyToClipboard')) {
    const importRegex = /import\s+.*?from\s+["'].*?["']/g;
    let lastMatch;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      lastMatch = match;
    }
    if (lastMatch) {
      const pos = lastMatch.index + lastMatch[0].length;
      content = content.slice(0, pos) + '\nimport { useCopyToClipboard } from "@/hooks/useCopyToClipboard"' + content.slice(pos);
    }
  }

  // Replace hook state
  content = content.replace(/const \[(?:copied|copiedId), (?:setCopied|setCopiedId)\] = useState(?:<[^>]+>)?\([^)]*\)/, 'const { isCopied: copied, copy } = useCopyToClipboard()');

  // Replace the manual copy logic block
  // This regex matches a block like:
  // navigator.clipboard.writeText(text)
  // setCopied(true)
  // toast.success("...") (optional)
  // setTimeout(...)
  
  content = content.replace(/navigator\.clipboard\.writeText\(([^)]+)\)\s*(?:;\s*)?(?:setCopied(?:Id)?\([^)]+\)\s*(?:;\s*)?)?(?:toast\.success\(([^)]+)\)\s*(?:;\s*)?)?setTimeout\(\(\)\s*=>\s*setCopied(?:Id)?\([^)]+\),\s*2000\)\s*(?:;\s*)?/g, (match, p1, p2) => {
     let msg = p2 ? `, ${p2}` : '';
     return `copy(${p1}${msg})\n    `;
  });
  
  // Handle the case where toast is after setTimeout
  content = content.replace(/navigator\.clipboard\.writeText\(([^)]+)\)\s*(?:;\s*)?(?:setCopied(?:Id)?\([^)]+\)\s*(?:;\s*)?)?setTimeout\(\(\)\s*=>\s*setCopied(?:Id)?\([^)]+\),\s*2000\)\s*(?:;\s*)?(?:toast\.success\(([^)]+)\)\s*(?:;\s*)?)?/g, (match, p1, p2) => {
     let msg = p2 ? `, ${p2}` : '';
     return `copy(${p1}${msg})\n    `;
  });

  fs.writeFileSync(file, content);
  console.log('Refactored ' + file);
});
