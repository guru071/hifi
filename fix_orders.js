const fs = require('fs');
let code = fs.readFileSync('src/lib/services/orders.ts', 'utf8');

// The corrupted line is: if (cData if (cData && cData.setting_value) {if (cData && cData.setting_value) { Array.isArray(cData.setting_value)) {
code = code.replace(/if \(cData.*Array\.isArray\(cData\.setting_value\)\) \{/, 'if (cData && Array.isArray(cData.setting_value)) {');

fs.writeFileSync('src/lib/services/orders.ts', code);
