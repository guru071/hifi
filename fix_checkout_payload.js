const fs = require('fs');
let code = fs.readFileSync('src/app/checkout/page.tsx', 'utf8');

const search = /body: JSON\.stringify\(\{\n\s*shippingAddress,\n\s*items: items\.map/;
const replace = `body: JSON.stringify({
            coupon_code: discountAmount > 0 ? couponCode : null,
            shippingAddress,
            items: items.map`;
            
code = code.replace(search, replace);
fs.writeFileSync('src/app/checkout/page.tsx', code);
