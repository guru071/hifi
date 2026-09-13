import { createOrder } from './src/lib/services/orders';
import { createClient } from '@supabase/supabase-js';

// Setup mock env vars
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function run() {
  try {
    const res = await createOrder({
      profileId: 'e290f1ee-6c54-4b01-90e6-d701748f0851', // any valid uuid
      address: {
        full_name: "Test", email: "test@test.com", phone: "9999999999",
        line1: "123", city: "city", state: "state", postal_code: "123", country: "India"
      },
      items: [
        {
          productId: "f12712be-0f65-499f-96e1-d7889e2aa2d4",
          variantId: null,
          quantity: 1,
          customDesignId: null
        }
      ],
      couponCode: undefined
    });
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
run();
