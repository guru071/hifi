const fs = require('fs');
let code = fs.readFileSync('src/app/product/[id]/page.tsx', 'utf8');

// 1. Dynamic Description Parsing
const descriptionRegex = /const inrPrice = \(n: number\) => \`₹\$\{Number\(n\)\.toFixed\(2\)\}\`;/;
const newDescription = `const inrPrice = (n: number) => \`₹\${Number(n).toFixed(2)}\`;
  
  let descObj = { text: product.description || "", fabric: "", printing: "", shipping: "" };
  try {
    if (product.description && product.description.startsWith('{')) {
      const parsed = JSON.parse(product.description);
      if (parsed.text !== undefined) descObj = parsed;
    }
  } catch (e) {}`;

code = code.replace(descriptionRegex, newDescription);

// 2. Change availableSizes to ONLY show sizes for the selectedColor
const sizeRegex = /const availableSizes = Array\.from\(new Set\(product\.product_variants\?\.map\(\(v\) => v\.size\) \|\| \[\]\)\);/;
const newSizeRegex = `const availableSizes = Array.from(new Set(product.product_variants?.filter(v => v.color === selectedColor).map((v) => v.size) || []));`;

code = code.replace(sizeRegex, newSizeRegex);

// 3. Render the parsed descriptions instead of hardcoded text
const textReplaceRegex = /<p className=\{styles\.description\}>[\s\S]*?<\/p>/;
code = code.replace(textReplaceRegex, `<p className={styles.description}>{descObj.text || product.description}</p>`);

const fabricReplaceRegex = /Knitted from 100% organic cotton at a substantial 240gsm\. Features a relaxed, boxy fit with dropped shoulders and a tight crewneck\. Pre-shrunk for lasting structure\./;
code = code.replace(fabricReplaceRegex, `{descObj.fabric || 'Premium quality material for comfort and durability.'}`);

const printingReplaceRegex = /High-definition DTG printing using eco-friendly, water-based inks\. The print is embedded into the fabric for a soft hand-feel that won't crack or peel over time\./;
code = code.replace(printingReplaceRegex, `{descObj.printing || 'High quality printing with lasting colors.'}`);

const shippingReplaceRegex = /Orders process in 1-2 business days\. Standard shipping takes 3-5 days domestically\. All orders ship in 100% compostable mailers\./;
code = code.replace(shippingReplaceRegex, `{descObj.shipping || 'Fast and reliable shipping to your doorstep.'}`);

fs.writeFileSync('src/app/product/[id]/page.tsx', code);
