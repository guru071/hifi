const { createServerClient } = require('@supabase/ssr');
const fetch = require('node-fetch');

async function run() {
  const payload = {
    shippingAddress: {
      full_name: "Test User",
      email: "test@example.com",
      phone: "9999999999",
      line1: "Test Street",
      line2: null,
      city: "Test City",
      state: "Test State",
      postal_code: "123456",
      country: "India"
    },
    items: [
      {
        productId: "f12712be-0f65-499f-96e1-d7889e2aa2d4", // The ID user sent
        variantId: null,
        quantity: 1,
        customDesignId: null
      }
    ],
    coupon_code: null
  };

  try {
    const res = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log(res.status, await res.text());
  } catch (e) {
    console.error(e);
  }
}

run();
