import fs from 'fs';

const removeLogs = (filePath) => {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  // Simplistic regex to remove console.log statements
  content = content.replace(/^[ \t]*console\.log\([^]*?\);?[ \t]*$/gm, '');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Cleaned ${filePath}`);
};

removeLogs('services/api.ts');
removeLogs('hooks/useAuth.tsx');
