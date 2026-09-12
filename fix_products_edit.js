const fs = require('fs');
let editCode = fs.readFileSync('src/app/admin/products/[id]/edit/page.tsx', 'utf8');

// 1. Remove Main Image Upload
const oldMainImageUI = /<div>\s*<label style=\{\{ display: 'block', marginBottom: '0\.25rem', fontWeight: 600 \}\}>Main Product Image<\/label>[\s\S]*?<\/div>/;
editCode = editCode.replace(oldMainImageUI, '');

// 2. Parse existing JSON description
const getDescRegex = /const \[loading, setLoading\] = useState\(true\);/;
const addDescParsing = `const [loading, setLoading] = useState(true);
  const [descText, setDescText] = useState("");
  const [descFabric, setDescFabric] = useState("");
  const [descPrinting, setDescPrinting] = useState("");
  const [descShipping, setDescShipping] = useState("");`;
editCode = editCode.replace(getDescRegex, addDescParsing);

const setProductRegex = /setProduct\(data\.product\);/;
const newSetProduct = `setProduct(data.product);
        if (data.product.description && data.product.description.startsWith('{')) {
          try {
            const parsed = JSON.parse(data.product.description);
            setDescText(parsed.text || "");
            setDescFabric(parsed.fabric || "");
            setDescPrinting(parsed.printing || "");
            setDescShipping(parsed.shipping || "");
          } catch(e) {
            setDescText(data.product.description);
          }
        } else {
          setDescText(data.product.description || "");
        }`;
editCode = editCode.replace(setProductRegex, newSetProduct);

// 3. Update payload
const oldPayload = /description: formData\.get\("description"\),/;
const newPayload = `description: JSON.stringify({
        text: formData.get("description") || "",
        fabric: formData.get("fabric") || "",
        printing: formData.get("printing") || "",
        shipping: formData.get("shipping") || ""
      }),`;
editCode = editCode.replace(oldPayload, newPayload);

// 4. Update UI for Details
const uiSearchRegex = /<div>\s*<label style=\{\{ display: 'block', marginBottom: '0\.5rem', fontWeight: 600 \}\}>Description<\/label>\s*<textarea name="description" defaultValue=\{product\.description \|\| ""\} rows=\{4\}[\s\S]*?<\/textarea>\s*<\/div>/;
const newUi = `<div style={{ padding: '1rem', background: 'var(--color-surface-variant)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Product Details & Tabs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Main Description</label>
                <textarea name="description" defaultValue={descText} rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', resize: 'vertical' }}></textarea>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Fabric & Fit</label>
                <textarea name="fabric" defaultValue={descFabric} rows={2} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', resize: 'vertical' }}></textarea>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Printing Process</label>
                <textarea name="printing" defaultValue={descPrinting} rows={2} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', resize: 'vertical' }}></textarea>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Shipping</label>
                <textarea name="shipping" defaultValue={descShipping} rows={2} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', resize: 'vertical' }}></textarea>
              </div>
            </div>
          </div>`;
editCode = editCode.replace(uiSearchRegex, newUi);

fs.writeFileSync('src/app/admin/products/[id]/edit/page.tsx', editCode);
