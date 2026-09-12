const fs = require('fs');
let code = fs.readFileSync('src/app/checkout/page.tsx', 'utf8');

// 1. Add states for coupon
const stateSearch = /const \[loading, setLoading\] = useState\(false\);/;
const stateReplace = `const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
`;
code = code.replace(stateSearch, stateReplace);

// 2. Add applyCoupon function
const funcSearch = /const handleCheckout = async \(e: React\.FormEvent\) => \{/;
const funcReplace = `
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponMsg("");
    try {
      const res = await fetch("/api/admin/coupons?validate=true&code=" + couponCode + "&total=" + totalPrice);
      const data = await res.json();
      if (!res.ok) {
        setCouponMsg(data.error || "Invalid coupon");
        setDiscountAmount(0);
      } else {
        setDiscountAmount(data.discount);
        setCouponMsg(\`Coupon applied! Saved \${inr(data.discount)}\`);
      }
    } catch (e) {
      setCouponMsg("Failed to validate coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
`;
code = code.replace(funcSearch, funcReplace);

// 3. Add Coupon UI
const uiSearch = /<div className=\{styles\.costRow\}>\n\s*<span>Subtotal<\/span>/;
const uiReplace = `<div className={styles.costRow} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" placeholder="Coupon Code" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-outline)' }} />
                    <button type="button" onClick={applyCoupon} disabled={applyingCoupon || !couponCode} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--radius-sm)', border: 'none', cursor: applyingCoupon ? 'not-allowed' : 'pointer' }}>
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponMsg && <span style={{ fontSize: '0.85rem', color: discountAmount > 0 ? 'var(--color-success, green)' : 'var(--color-error, red)' }}>{couponMsg}</span>}
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--color-outline-variant)', margin: '0.5rem 0' }} />
                <div className={styles.costRow}>
                  <span>Subtotal</span>`;
code = code.replace(uiSearch, uiReplace);

// 4. Update Discount row
const discountSearch = /<span>Shipping<\/span>\n\s*<span>\{inr\(estimate\)\}<\/span>\n\s*<\/div>/;
const discountReplace = `<span>Shipping</span>
                  <span>{inr(estimate)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className={styles.costRow} style={{ color: 'var(--color-success, green)', fontWeight: 600 }}>
                    <span>Discount</span>
                    <span>-{inr(discountAmount)}</span>
                  </div>
                )}`;
code = code.replace(discountSearch, discountReplace);

// 5. Update Total calculation
const totalSearch = /\{inr\(totalPrice \+ estimate\)\}/;
const totalReplace = `{inr(Math.max(0, totalPrice + estimate - discountAmount))}`;
code = code.replace(totalSearch, totalReplace);

// 6. Pass coupon to order payload
const payloadSearch = /total_amount: totalPrice \+ estimate,/;
const payloadReplace = `total_amount: Math.max(0, totalPrice + estimate - discountAmount),
        coupon_code: discountAmount > 0 ? couponCode : null,
        discount_amount: discountAmount,`;
code = code.replace(payloadSearch, payloadReplace);

fs.writeFileSync('src/app/checkout/page.tsx', code);
