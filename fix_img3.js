const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

code = "/* eslint-disable @next/next/no-img-element */\n" + code;
fs.writeFileSync('src/app/page.tsx', code);
