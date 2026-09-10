const fs = require('fs');
let code = fs.readFileSync('src/app/api/webhooks/razorpay/route.ts', 'utf8');
code = code.replace(
  /if \(entity && \(event === 'payment.captured' \|\| event === 'payment.authorized' \|\| event === 'payment.failed'\)\) \{/,
  "if (event === 'payment_link.paid') {\n    await processPaymentEvent(payload?.id ?? 'payment_link', { entity: payload?.payload?.payment_link?.entity as any }, true);\n  } else if (entity && (event === 'payment.captured' || event === 'payment.authorized' || event === 'payment.failed')) {"
);
code = code.replace(
  /payment\?: \{\n\s*entity\?: RazorpayPaymentEntity;\n\s*\};/,
  "payment?: { entity?: RazorpayPaymentEntity; };\n    payment_link?: { entity?: any; };"
);
fs.writeFileSync('src/app/api/webhooks/razorpay/route.ts', code);
