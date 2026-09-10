const fs = require('fs');
let code = fs.readFileSync('next.config.ts', 'utf8');
code = code.replace(
  /\{ key: 'X-Frame-Options', value: 'DENY' \},/,
  "// Removed X-Frame-Options: DENY to allow Firebase Auth popups to communicate"
);
fs.writeFileSync('next.config.ts', code);
