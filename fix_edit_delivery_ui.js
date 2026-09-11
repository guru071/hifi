const fs = require('fs');
let code = fs.readFileSync('src/app/admin/products/[id]/edit/page.tsx', 'utf8');

// Add state
code = code.replace(
  'const [uploading, setUploading] = useState(false);',
  'const [uploading, setUploading] = useState(false);\n  const [deliveryType, setDeliveryType] = useState("global");'
);

// We need to set the initial deliveryType based on product data.
// In the loadProduct useEffect:
const oldLoad = `        setProduct(data.product);
        if (data.product.image_url) {
          setImageUrl(data.product.image_url);
          setImagePreview(data.product.image_url);
        }`;

const newLoad = `        setProduct(data.product);
        if (data.product.image_url) {
          setImageUrl(data.product.image_url);
          setImagePreview(data.product.image_url);
        }
        if (data.product.delivery_fee === null) {
          setDeliveryType("global");
        } else if (Number(data.product.delivery_fee) === 0) {
          setDeliveryType("free");
        } else {
          setDeliveryType("custom");
        }`;

code = code.replace(oldLoad, newLoad);

// Replace UI
const oldUI = `          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Delivery Fee (₹)</label>
            <input name="delivery_fee" defaultValue={product.delivery_fee ?? 0} min="0" step="0.01" type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} />
          </div>`;

const newUI = `          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Delivery Fee</label>
            <select name="delivery_type" value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', marginBottom: '0.5rem' }}>
              <option value="global">Global Fee (Uses default from Settings)</option>
              <option value="free">Free Delivery (₹0 for this product)</option>
              <option value="custom">Custom Fee (Per product)</option>
            </select>
            {deliveryType === "custom" && (
              <input name="delivery_fee_custom" defaultValue={product.delivery_fee ?? ""} min="0" step="0.01" type="number" placeholder="Enter custom fee in INR" required style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} />
            )}
          </div>`;

code = code.replace(oldUI, newUI);

// Replace payload
const oldPayload = `delivery_fee: Number(formData.get("delivery_fee") || 0),`;
const newPayload = `delivery_fee: formData.get("delivery_type") === "global" ? null : (formData.get("delivery_type") === "free" ? 0 : Number(formData.get("delivery_fee_custom") || 0)),`;

code = code.replace(oldPayload, newPayload);

fs.writeFileSync('src/app/admin/products/[id]/edit/page.tsx', code);
