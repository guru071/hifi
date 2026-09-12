const fs = require('fs');
let code = fs.readFileSync('src/app/admin/products/[id]/edit/page.tsx', 'utf8');

code = code.replace(/const \[imageUrl, setImageUrl\] = useState\(""\);\n\s*const \[imagePreview, setImagePreview\] = useState\(""\);\n\s*const \[uploading, setUploading\] = useState\(false\);\n\n\s*const handleFileChange = [\s\S]*?\};\n\n/, '');
code = code.replace(/image_url: imageUrl \|\| product\.image_url,/, 'image_url: product.image_url,');

// Clean up upload loading states
code = code.replace(/disabled=\{loading \|\| uploading\}/g, 'disabled={loading}');
code = code.replace(/cursor: \(loading \|\| uploading\) \? 'not-allowed' : 'pointer'/g, "cursor: loading ? 'not-allowed' : 'pointer'");
code = code.replace(/opacity: \(loading \|\| uploading\) \? 0\.7 : 1/g, "opacity: loading ? 0.7 : 1");

fs.writeFileSync('src/app/admin/products/[id]/edit/page.tsx', code);
