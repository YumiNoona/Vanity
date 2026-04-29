const fs = require('fs');

function fixEnvEditor() {
  let content = fs.readFileSync('src/components/tools/dev/EnvEditor.tsx', 'utf8');
  if (!content.includes('useDownload')) {
    content = content.replace('import { toast } from "sonner"', 'import { toast } from "sonner"\nimport { useDownload } from "@/hooks/useDownload"');
  }
  if (!content.includes('const { download } = useDownload()')) {
    content = content.replace(/const \[rows, setRows\] = useState<EnvRow\[\]>\(\[\]\)/, 'const [rows, setRows] = useState<EnvRow[]>([])\n  const { download } = useDownload()');
  }
  fs.writeFileSync('src/components/tools/dev/EnvEditor.tsx', content);
}

function fixFakeData() {
  let content = fs.readFileSync('src/components/tools/text/FakeData.tsx', 'utf8');
  content = content.replace('const download = useDownload()', 'const { download: downloadBlob } = useDownload()');
  content = content.replace(/download\(blob, (.*?)\)/, 'downloadBlob(blob, $1)');
  fs.writeFileSync('src/components/tools/text/FakeData.tsx', content);
}

function fixNameFormatter() {
  let content = fs.readFileSync('src/components/tools/text/NameFormatter.tsx', 'utf8');
  content = content.replace('const download = useDownload()', 'const { download } = useDownload()');
  fs.writeFileSync('src/components/tools/text/NameFormatter.tsx', content);
}

function fixPasswordGenerator() {
  let content = fs.readFileSync('src/components/tools/text/PasswordGenerator.tsx', 'utf8');
  if (!content.includes('useDownload')) {
    content = content.replace('import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"', 'import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"\nimport { useDownload } from "@/hooks/useDownload"');
  }
  if (!content.includes('const { download } = useDownload()')) {
    content = content.replace('const { isCopied: copied, copy } = useCopyToClipboard()', 'const { isCopied: copied, copy } = useCopyToClipboard()\n  const { download } = useDownload()');
  }
  fs.writeFileSync('src/components/tools/text/PasswordGenerator.tsx', content);
}

function fixTomlJson() {
  let content = fs.readFileSync('src/components/tools/text/TomlJson.tsx', 'utf8');
  content = content.replace('const download = useDownload()', 'const { download } = useDownload()');
  fs.writeFileSync('src/components/tools/text/TomlJson.tsx', content);
}

function fixReadmeViewer() {
  let content = fs.readFileSync('src/components/tools/text/ReadmeViewer.tsx', 'utf8');
  if (!content.includes('useDownload')) {
    content = content.replace('import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"', 'import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"\nimport { useDownload } from "@/hooks/useDownload"');
  }
  content = content.replace('const download = useDownload()', 'const { download } = useDownload()');
  fs.writeFileSync('src/components/tools/text/ReadmeViewer.tsx', content);
}

fixEnvEditor();
fixFakeData();
fixNameFormatter();
fixPasswordGenerator();
fixTomlJson();
fixReadmeViewer();
console.log('Fixed all files');
