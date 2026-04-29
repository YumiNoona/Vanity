const fs = require('fs');

const files = [
  'src/components/tools/dev/EnvEditor.tsx',
  'src/components/tools/text/NameFormatter.tsx',
  'src/components/tools/text/FakeData.tsx',
  'src/components/tools/text/PasswordGenerator.tsx',
  'src/components/tools/text/TomlJson.tsx',
  'src/components/tools/text/ReadmeViewer.tsx',
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Add import
  if (!content.includes('useDownload')) {
    const importRegex = /import\s+.*?from\s+["'].*?["']/g;
    let lastMatch;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      lastMatch = match;
    }
    if (lastMatch) {
      const pos = lastMatch.index + lastMatch[0].length;
      content = content.slice(0, pos) + '\nimport { useDownload } from "@/hooks/useDownload"' + content.slice(pos);
    }
  }

  // Add useDownload() hook next to useCopyToClipboard or inside the component
  if (!content.includes('const download = useDownload()')) {
     if (content.includes('const { isCopied')) {
        content = content.replace(/const \{ isCopied.*?\n/, (m) => m + '  const download = useDownload()\n');
     } else if (content.includes('const { copiedId')) {
        content = content.replace(/const \{ copiedId.*?\n/, (m) => m + '  const download = useDownload()\n');
     } else {
        // Find the first useState
        content = content.replace(/const \[.*?\] = useState.*?\n/, (m) => m + '  const download = useDownload()\n');
     }
  }

  // Replace manual download block
  content = content.replace(/const blob = new Blob\[.*?\];\s*const url = URL\.createObjectURL\(blob\);\s*const a = document\.createElement\("a"\);\s*a\.href = url;\s*a\.download = (.*?);\s*a\.click\(\);\s*URL\.revokeObjectURL\(url\);?/gs, (match, p1) => {
    return `download(content, ${p1})`;
  });

  // some files use different names for the text/content variable
  content = content.replace(/const blob = new Blob\(\[(.+?)\].*?\)\s*const url = URL\.createObjectURL\(blob\)\s*const a = document\.createElement\("a"\)\s*a\.href = url\s*a\.download = (.*?)\s*a\.click\(\)\s*URL\.revokeObjectURL\(url\)/g, (match, p1, p2) => {
    return `download(${p1}, ${p2})`;
  });

  fs.writeFileSync(file, content);
  console.log('Processed ' + file);
});
