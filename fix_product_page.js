const fs = require('fs');
let code = fs.readFileSync('src/app/product/[id]/page.tsx', 'utf8');

const oldColors = 'const availableColors = Array.from(new Set(product.product_variants?.map((v) => v.color) || []));';
const newColors = 'const availableColors = Array.from(new Set(product.product_variants?.map((v) => v.color) || []));\n  const cleanColor = (c: string) => c ? c.split("[IMG:")[0].trim() : "";';
code = code.replace(oldColors, newColors);

code = code.replace(
  '<span className={styles.selectorLabel}>Color: {selectedColor}</span>',
  '<span className={styles.selectorLabel}>Color: {cleanColor(selectedColor || "")}</span>'
);

code = code.replace(
  'style={{ backgroundColor: color.toLowerCase() === \'bone\' ? \'#f5f5dc\' : color.toLowerCase() }}',
  'style={{ backgroundColor: cleanColor(color).toLowerCase() === \'bone\' ? \'#f5f5dc\' : cleanColor(color).toLowerCase() }}'
);

code = code.replace(
  'title={color}',
  'title={cleanColor(color)}'
);

fs.writeFileSync('src/app/product/[id]/page.tsx', code);
