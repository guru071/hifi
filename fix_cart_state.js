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
    'const { items, updateQuantity, removeItem, totalPrice } = useCart();', 
    'const { items, updateQuantity, removeItem, totalPrice } = useCart();\n' + s1
  );
}

// And let's type 'c' explicitly to avoid TS7006 implicit any error
code = code.replace(/availableCoupons\.map\(c => \{/g, 'availableCoupons.map((c: any) => {');

fs.writeFileSync('src/app/cart/page.tsx', code);
