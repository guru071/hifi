const fs = require('fs');
let code = fs.readFileSync('src/app/api/products/[id]/route.ts', 'utf8');

code = code.replace(
  /if \(v\.inventory_count !== undefined\) \{/,
  "if (v.color !== undefined) { patch.color = v.color; }\n      if (v.inventory_count !== undefined) {"
);

fs.writeFileSync('src/app/api/products/[id]/route.ts', code);
