const fs = require('fs');
let code = fs.readFileSync('src/lib/ai/chatbot.ts', 'utf8');
code = code.replace(/product_id: product.id,/g, '/* Removed invalid product_id */');
code = code.replace(/total_price: totalAmount,/g, '/* Removed invalid total_price */');
code = code.replace(/custom_design_id: null,/g, '');
fs.writeFileSync('src/lib/ai/chatbot.ts', code);
