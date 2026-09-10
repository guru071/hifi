const fs = require('fs');
let code = fs.readFileSync('src/app/admin/products/page.tsx', 'utf8');

const importRegex = /import React, \{ useState \} from 'react';/;
code = code.replace(
  importRegex,
  "import React, { useState, useRef } from 'react';"
);

const uploadLogic = `
  async function uploadVariantImage(variantId, file) {
    if (!file) return;
    try {
      setMsg("Uploading variant image...");
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      
      // Update color field to include image using [IMG:url] syntax
      const variant = products.flatMap(p => p.product_variants || []).find(v => v.id === variantId);
      if (variant) {
        const baseColor = variant.color.split('[IMG:')[0].trim();
        const newColor = \`\${baseColor} [IMG:\${data.url}]\`;
        
        // Save to DB
        const saveRes = await fetch(\`/api/products/\${variant.product_id}\`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variants: [{ id: variantId, color: newColor }] })
        });
        if (!saveRes.ok) throw new Error("Failed to save variant image");
        
        setMsg("Variant image updated!");
        loadAll();
      }
    } catch (e) {
      setErr(e.message);
    }
  }
`;
code = code.replace(/async function loadAll\(\) \{/, uploadLogic + '\n  async function loadAll() {');

code = code.replace(
  /<span>\{v\.color\} \/ \{v\.size\}<\/span>/g,
  `<span>
    {v.color?.split('[IMG:')[0].trim()} / {v.size}
    {v.color?.includes('[IMG:') && <img src={v.color.split('[IMG:')[1].replace(']','')} style={{width:24, height:24, objectFit:'cover', marginLeft:8, borderRadius:4, verticalAlign:'middle'}} />}
    <label style={{marginLeft: 8, fontSize: 10, cursor:'pointer', background:'var(--color-surface-variant)', padding:'2px 6px', borderRadius:4}}>
      🖼️ Add Image
      <input type="file" style={{display:'none'}} accept="image/*" onChange={(e) => uploadVariantImage(v.id, e.target.files[0])} />
    </label>
  </span>`
);

code = code.replace(/method: "PATCH",\n\s*headers: \{ "Content-Type": "application\/json" \},\n\s*body: JSON\.stringify\(\{ variants \}\)/, `method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants })`);

fs.writeFileSync('src/app/admin/products/page.tsx', code);
