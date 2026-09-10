const fs = require('fs');
let code = fs.readFileSync('src/app/layout.tsx', 'utf8');

code = code.replace(
  /keywords: \["custom t-shirts", "premium blanks", "apparel printing", "custom clothing", "HIFI customs"\],/,
  'keywords: ["custom t-shirts", "premium blanks", "apparel printing", "custom clothing", "HIFI customs", "GOAT\'ECH", "Maghgo", "Abdul Kapur"],\n  authors: [{ name: "Abdul Kapur" }],\n  creator: "GOAT\'ECH",\n  publisher: "Maghgo",'
);

fs.writeFileSync('src/app/layout.tsx', code);
