const fs = require('fs');

// Create Page
let createCode = fs.readFileSync('src/app/admin/products/create/page.tsx', 'utf8');

// 1. Remove old main image state
createCode = createCode.replace(/const \[imageUrl, setImageUrl\] = useState\(""\);\n\s*const \[imagePreview, setImagePreview\] = useState\(""\);\n\s*const \[uploading, setUploading\] = useState\(false\);\n\n\s*const handleFileChange = [\s\S]*?\};\n\n/, '');

// 2. Change variants state to colorGroups
const variantsStateRegex = /const \[variants, setVariants\] = useState[\s\S]*?updateVariant \=[\s\S]*?\};\n/;
const newColorGroupsState = `
  const [colorGroups, setColorGroups] = useState([{ id: Date.now(), color: "", image_url: "", image_preview: "", uploading: false, sizes: [{ id: Date.now() + 1, size: "", stock: 10 }] }]);

  const handleColorImage = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setColorGroups(prev => prev.map((c, i) => i === index ? { ...c, image_preview: URL.createObjectURL(file), uploading: true } : c));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error("Upload failed");
      setColorGroups(prev => prev.map((c, i) => i === index ? { ...c, image_url: data.url, uploading: false } : c));
    } catch (err) {
      setColorGroups(prev => prev.map((c, i) => i === index ? { ...c, image_preview: "", image_url: "", uploading: false } : c));
    }
  };

  const addColorGroup = () => setColorGroups([...colorGroups, { id: Date.now(), color: "", image_url: "", image_preview: "", uploading: false, sizes: [{ id: Date.now() + 1, size: "", stock: 10 }] }]);
  const removeColorGroup = (id: number) => setColorGroups(colorGroups.filter(c => c.id !== id));
  const updateColorGroup = (id: number, field: string, value: any) => setColorGroups(colorGroups.map(c => c.id === id ? { ...c, [field]: value } : c));
  
  const addSizeToColor = (colorId: number) => {
    setColorGroups(colorGroups.map(c => c.id === colorId ? { ...c, sizes: [...c.sizes, { id: Date.now(), size: "", stock: 10 }] } : c));
  };
  const removeSizeFromColor = (colorId: number, sizeId: number) => {
    setColorGroups(colorGroups.map(c => c.id === colorId ? { ...c, sizes: c.sizes.filter(s => s.id !== sizeId) } : c));
  };
  const updateSizeInColor = (colorId: number, sizeId: number, field: string, value: any) => {
    setColorGroups(colorGroups.map(c => c.id === colorId ? { ...c, sizes: c.sizes.map(s => s.id === sizeId ? { ...s, [field]: value } : s) } : c));
  };
`;
createCode = createCode.replace(variantsStateRegex, newColorGroupsState);

// 3. Update payload construction
const payloadSearchRegex = /base_price:[\s\S]*?custom_variants: variants,\n\s*\};/;
const newPayload = `
      base_price: Number(formData.get("base_price")),
      subtitle: formData.get("mrp") ? String(formData.get("mrp")) : null,
      delivery_fee: formData.get("delivery_type") === "global" ? null : (formData.get("delivery_type") === "free" ? 0 : Number(formData.get("delivery_fee_custom") || 0)),
      category_id: formData.get("category_id") || null,
      image_url: colorGroups[0]?.image_url || null,
      description: JSON.stringify({
        text: formData.get("description") || "",
        fabric: formData.get("fabric") || "",
        printing: formData.get("printing") || "",
        shipping: formData.get("shipping") || ""
      }),
      custom_variants: colorGroups.flatMap(c => c.sizes.map(s => ({
        color: c.color,
        image_url: c.image_url,
        size: s.size,
        stock: s.stock
      }))),
    };
`;
createCode = createCode.replace(payloadSearchRegex, newPayload.trim());

// 4. Replace Variant UI
const variantUiRegex = /<div style=\{\{ padding: '1rem', background: 'var\(--color-surface-variant\)', borderRadius: 'var\(--radius-md\)' \}\}>[\s\S]*?<\!-- Image Upload -->/;
const newVariantUi = `<div style={{ padding: '1rem', background: 'var(--color-surface-variant)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Colors & Sizes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {colorGroups.map((c, i) => (
                <div key={c.id} style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 600 }}>Color Name</label>
                      <input placeholder="e.g. Acid Wash Black" value={c.color} onChange={e => updateColorGroup(c.id, 'color', e.target.value)} required style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-outline)', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 600 }}>Color Image</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ padding: '0.5rem 1rem', background: 'var(--color-surface-variant)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', border: '1px dashed var(--color-outline)' }}>
                          {c.uploading ? 'Uploading...' : (c.image_url ? 'Change Image' : 'Upload Image')}
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleColorImage(i, e)} />
                        </label>
                        {c.image_preview && <img src={c.image_preview} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '4px' }} />}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeColorGroup(c.id)} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem' }}>×</button>
                  </div>
                  
                  <div style={{ background: 'var(--color-surface-variant)', padding: '0.75rem', borderRadius: '4px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Sizes for {c.color || 'this color'}</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {c.sizes.map((s) => (
                        <div key={s.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input placeholder="Size (e.g. M)" value={s.size} onChange={e => updateSizeInColor(c.id, s.id, 'size', e.target.value)} required style={{ flex: 1, padding: '0.4rem', border: '1px solid var(--color-outline)', borderRadius: '4px' }} />
                          <input type="number" min="0" placeholder="Stock" value={s.stock} onChange={e => updateSizeInColor(c.id, s.id, 'stock', e.target.value)} required style={{ width: '80px', padding: '0.4rem', border: '1px solid var(--color-outline)', borderRadius: '4px' }} />
                          <button type="button" onClick={() => removeSizeFromColor(c.id, s.id)} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.2rem 0.5rem' }}>×</button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => addSizeToColor(c.id)} style={{ marginTop: '0.75rem', padding: '0.4rem 0.8rem', background: 'var(--color-surface)', border: '1px solid var(--color-outline)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>+ Add Size</button>
                  </div>
                </div>
              ))}
            </div>
            
            <button type="button" onClick={addColorGroup} style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
              + Add Another Color
            </button>
          </div>
          
          <div style={{ padding: '1rem', background: 'var(--color-surface-variant)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Product Details & Tabs</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Main Description</label>
                <textarea name="description" rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', resize: 'vertical' }} placeholder="Main product description..."></textarea>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Fabric & Fit</label>
                <textarea name="fabric" rows={2} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', resize: 'vertical' }} placeholder="e.g. Knitted from 100% organic cotton at 240gsm. Boxy fit..."></textarea>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Printing Process</label>
                <textarea name="printing" rows={2} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', resize: 'vertical' }} placeholder="e.g. High quality DTG printing..."></textarea>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Shipping</label>
                <textarea name="shipping" rows={2} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', resize: 'vertical' }} placeholder="e.g. Ships within 3-5 business days..."></textarea>
              </div>
            </div>
          </div>

          {/* Hidden Image Upload section, since we deleted the main image upload field completely */}`;
createCode = createCode.replace(variantUiRegex, newVariantUi);

// 5. Delete the main image upload section completely
const oldMainImageUI = /<div>\s*<label style=\{\{ display: 'block', marginBottom: '0\.25rem', fontWeight: 600 \}\}>Main Product Image<\/label>[\s\S]*?<\/div>/;
createCode = createCode.replace(oldMainImageUI, '');

// Also remove uploading from disabled state of the submit button, we don't have global uploading state anymore (we have it inside colorGroups)
createCode = createCode.replace(/disabled=\{loading \|\| uploading\}/g, 'disabled={loading}');
createCode = createCode.replace(/cursor: \(loading \|\| uploading\) \? 'not-allowed' : 'pointer'/g, "cursor: loading ? 'not-allowed' : 'pointer'");
createCode = createCode.replace(/opacity: \(loading \|\| uploading\) \? 0\.7 : 1/g, "opacity: loading ? 0.7 : 1");

fs.writeFileSync('src/app/admin/products/create/page.tsx', createCode);
