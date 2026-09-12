const fs = require('fs');

// 1. Update API route
let apiCode = fs.readFileSync('src/app/api/orders/route.ts', 'utf8');
apiCode = apiCode.replace(/const result = await createOrder\(\{ profileId: profile\.id, items, address: shippingAddress \}\);/, 'const result = await createOrder({ profileId: profile.id, items, address: shippingAddress, couponCode: body.coupon_code });');
fs.writeFileSync('src/app/api/orders/route.ts', apiCode);

// 2. Update service
let srvCode = fs.readFileSync('src/lib/services/orders.ts', 'utf8');

const defSearch = /export async function createOrder\(\{ profileId, items, address \}: \{ profileId: string; items: OrderItemInput\[\]; address: ShippingAddressInput \}\) \{/;
const defReplace = `export async function createOrder({ profileId, items, address, couponCode }: { profileId: string; items: OrderItemInput[]; address: ShippingAddressInput; couponCode?: string }) {`;
srvCode = srvCode.replace(defSearch, defReplace);

const totalSearch = /const total = subtotal \+ shippingFee;/;
const totalReplace = `let discountAmount = 0;
  if (couponCode) {
    const { data: cData } = await supabase.from('delivery_settings').select('setting_value').eq('setting_key', 'discount_coupons').single();
    if (cData && cData.setting_value) {
      const coupons = cData.setting_value;
      const coupon = coupons.find((c: any) => c.code.toUpperCase() === couponCode.toUpperCase());
      if (coupon && coupon.active && (subtotal + shippingFee) >= Number(coupon.min_order || 0)) {
        if (coupon.type === 'percentage') discountAmount = ((subtotal + shippingFee) * Number(coupon.value)) / 100;
        else discountAmount = Number(coupon.value);
        snapshotItems.push({ type: 'discount', title: 'Coupon Applied', code: couponCode, amount: -discountAmount });
      }
    }
  }
  const total = Math.max(0, subtotal + shippingFee - discountAmount);`;
srvCode = srvCode.replace(totalSearch, totalReplace);

fs.writeFileSync('src/lib/services/orders.ts', srvCode);
