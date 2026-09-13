const fs = require('fs');
let code = fs.readFileSync('src/app/cart/page.tsx', 'utf8');

const s1 = `  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/coupons/active').then(r=>r.json()).then(d=> {
      if(d.coupons) setAvailableCoupons(d.coupons);
    }).catch(console.error);
  }, []);`;

if (!code.includes("setAvailableCoupons")) {
  code = code.replace(
    'const { items, removeItem, updateQuantity } = useCart();', 
    'const { items, removeItem, updateQuantity } = useCart();\n' + s1
  );
}

const uiSearch = `<div className={styles.securityNote}>`;

const uiReplace = `{availableCoupons.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-surface-variant)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>Available Offers at Checkout:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {availableCoupons.map(c => {
                      const isEligible = totalPrice >= (Number(c.min_order) || 0);
                      return (
                        <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: isEligible ? 1 : 0.6, background: 'var(--color-surface)', padding: '0.5rem', borderRadius: '4px', border: '1px dashed var(--color-outline)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary)' }}>{c.code}</span>
                            <span style={{ fontSize: '0.8rem' }}>{c.type === 'percentage' ? c.value + '% OFF' : '₹' + c.value + ' OFF'} {c.min_order > 0 ? \`on orders above ₹\${c.min_order}\` : ''}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className={styles.securityNote}>`;

if (!code.includes("Available Offers at Checkout:")) {
  code = code.replace(uiSearch, uiReplace);
}

fs.writeFileSync('src/app/cart/page.tsx', code);
