const fs = require('fs');
let code = fs.readFileSync('src/app/checkout/page.tsx', 'utf8');

const search = /const handleSubmit = async \(e: React\.FormEvent\) => \{/;
const replace = `const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponMsg("");
    try {
      const res = await fetch("/api/coupons/validate?code=" + couponCode + "&total=" + totalPrice);
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

  const handleSubmit = async (e: React.FormEvent) => {`;
code = code.replace(search, replace);
fs.writeFileSync('src/app/checkout/page.tsx', code);
