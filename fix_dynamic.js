const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src/app/admin');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('export default async function')) {
    if (!content.includes("export const dynamic = 'force-dynamic';")) {
      content = "export const dynamic = 'force-dynamic';\n" + content;
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
    }
  }
});
