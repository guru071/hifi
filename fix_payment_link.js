const fs = require('fs');
let code = fs.readFileSync('src/lib/services/payments.ts', 'utf8');
code = code.replace(
  /export async function createPaymentLink\(orderId: string, amount: number, customerPhone: string, description: string\) \{/,
  "export async function createPaymentLink(orderId: string | null, amount: number, customerPhone: string, description: string, notes?: Record<string, string>) {"
);
code = code.replace(
  /notes: \{\n\s*order_id: orderId,\n\s*\}/,
  "notes: { order_id: orderId || 'pending_checkout', ...notes }"
);
code = code.replace(
  /callback_url: \`\$\{process.env.NEXT_PUBLIC_SITE_URL \|\| 'https:\/\/hificustom.goatech.tech'\}\/checkout\/success\?order_id=\$\{orderId\}\`/,
  "callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hificustom.goatech.tech'}/checkout/success?payment_link=true`"
);
fs.writeFileSync('src/lib/services/payments.ts', code);
