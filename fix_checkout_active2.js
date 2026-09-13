const fs = require('fs');
let code = fs.readFileSync('src/app/checkout/page.tsx', 'utf8');

const s1 = `  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/coupons/active').then(r=>r.json()).then(d=> {
      if(d.coupons) setAvailableCoupons(d.coupons);
    }).catch(console.error);
  }, []);`;

if (!code.includes("setAvailableCoupons")) {
  code = code.replace(
    'const [applyingCoupon, setApplyingCoupon] = useState(false);', 
    'const [applyingCoupon, setApplyingCoupon] = useState(false);\n' + s1
  );
}

const uiSearch = `{couponMsg && <span style={{ fontSize: '0.85rem', color: discountAmount > 0 ? 'var(--color-success, green)' : 'var(--color-error, red)' }}>{couponMsg}</span>}`;

const uiReplace = `{couponMsg && <span style={{ fontSize: '0.85rem', color: discountAmount > 0 ? 'var(--color-success, green)' : 'var(--color-error, red)' }}>{couponMsg}</span>}
                  
                  {availableCoupons.length > 0 && discountAmount === 0 && (
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--color-surface-variant)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Available Offers:</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {availableCoupons.map(c => {
                          const isEligible = totalPrice >= (Number(c.min_order) || 0);
                          return (
                            <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: isEligible ? 1 : 0.6 }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary)' }}>{c.code}</span>
                                <span style={{ fontSize: '0.75rem' }}>{c.type === 'percentage' ? c.value + '% OFF' : '₹' + c.value + ' OFF'} {c.min_order > 0 ? \`on orders above ₹\${c.min_order}\` : ''}</span>
                              </div>
                              <button type="button" onClick={() => { setCouponCode(c.code); }} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: '4px', cursor: 'pointer' }}>
                                Use Code
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}`;

if (!code.includes("Available Offers:")) {
  code = code.replace(uiSearch, uiReplace);
}

fs.writeFileSync('src/app/checkout/page.tsx', code);
