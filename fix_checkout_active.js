const fs = require('fs');
let code = fs.readFileSync('src/app/checkout/page.tsx', 'utf8');

// 1. Add activeCoupons state
const stateSearch = /const \[applyingCoupon, setApplyingCoupon\] = useState\(false\);/;
const stateReplace = `const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/coupons/active').then(r=>r.json()).then(d=> {
      if(d.coupons) setAvailableCoupons(d.coupons);
    }).catch(console.error);
  }, []);
`;
code = code.replace(stateSearch, stateReplace);

// 2. Add UI for Available Coupons just under the Coupon input box
const uiSearch = /<div className=\{styles\.costRow\} style=\{\{ display: 'flex', flexDirection: 'column', gap: '0\.5rem', alignItems: 'stretch' \}\}>\n\s*<div style=\{\{ display: 'flex', gap: '0\.5rem' \}\}>\n\s*<input type="text" placeholder="Coupon Code" value=\{couponCode\}/;

const uiReplace = `<div className={styles.costRow} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" placeholder="Coupon Code" value={couponCode} onChange={e => {setCouponCode(e.target.value.toUpperCase()); setCouponMsg(""); setDiscountAmount(0);}} style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-outline)' }} />
                    <button type="button" onClick={applyCoupon} disabled={applyingCoupon || !couponCode} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--radius-sm)', border: 'none', cursor: applyingCoupon ? 'not-allowed' : 'pointer' }}>
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponMsg && <span style={{ fontSize: '0.85rem', color: discountAmount > 0 ? 'var(--color-success, green)' : 'var(--color-error, red)' }}>{couponMsg}</span>}
                  
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
                  )}
                </div>`;
                
const modifiedCode = code.replace(uiSearch, uiReplace.split('<input type="text" placeholder="Coupon Code" value={couponCode}')[1] ? uiReplace : code); 
// wait my regex was overly specific. I'll just use a safer string replace.

