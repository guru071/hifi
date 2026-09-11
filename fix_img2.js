const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

code = code.replace(
  /\{\/\* eslint-disable-next-line @next\/next\/no-img-element \*\/\}\n\s*<img src=\{cat\.image_url\}/g,
  '<img src={cat.image_url} data-eslint-disable="true"'
);

code = code.replace(
  /\{\/\* eslint-disable-next-line @next\/next\/no-img-element \*\/\}\n\s*<img src=\{b\.image_url\}/g,
  '<img src={b.image_url} data-eslint-disable="true"'
);

fs.writeFileSync('src/app/page.tsx', code);
