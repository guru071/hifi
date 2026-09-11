const fs = require('fs');
let code = fs.readFileSync('src/app/admin/products/create/page.tsx', 'utf8');

// Add state
code = code.replace(
  'const [uploading, setUploading] = useState(false);',
  'const [uploading, setUploading] = useState(false);\n  const [deliveryType, setDeliveryType] = useState("global");'
);

// Replace select and input
const oldDelivInput = `<select name="delivery_type" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', marginBottom: '0.5rem' }}>
              <option value="global">Global Fee (Uses default from Settings)</option>
              <option value="free">Free Delivery (₹0 for this product)</option>
              <option value="custom">Custom Fee (Enter below)</option>
            </select>
            <input name="delivery_fee_custom" min="0" step="0.01" type="number" placeholder="Enter custom fee (if Custom is selected)" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} />`;

const newDelivInput = `<select name="delivery_type" value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', marginBottom: '0.5rem' }}>
              <option value="global">Global Fee (Uses default from Settings)</option>
              <option value="free">Free Delivery (₹0 for this product)</option>
              <option value="custom">Custom Fee (Per product)</option>
            </select>
            {deliveryType === "custom" && (
              <input name="delivery_fee_custom" min="0" step="0.01" type="number" placeholder="Enter custom fee in INR" required style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} />
            )}`;

code = code.replace(oldDelivInput, newDelivInput);

fs.writeFileSync('src/app/admin/products/create/page.tsx', code);
