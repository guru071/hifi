const fs = require('fs');
let code = fs.readFileSync('src/app/admin/layout.tsx', 'utf8');

const search = /<Link href="\/admin\/banners" className=\{`\$\{styles\.navLink\} \$\{pathname \=\=\= "\/admin\/banners" \? styles\.navLinkActive : ""\}`\}>\n\s*<span className="material-symbols-outlined">view_carousel<\/span>\n\s*<span className=\{styles\.navLabel\}>Banners<\/span>\n\s*<\/Link>/;

const replace = `<Link href="/admin/banners" className={\`\${styles.navLink} \${pathname === "/admin/banners" ? styles.navLinkActive : ""}\`}>
            <span className="material-symbols-outlined">view_carousel</span>
            <span className={styles.navLabel}>Banners</span>
          </Link>
          <Link href="/admin/offers" className={\`\${styles.navLink} \${pathname === "/admin/offers" ? styles.navLinkActive : ""}\`}>
            <span className="material-symbols-outlined">sell</span>
            <span className={styles.navLabel}>Bulk Offers</span>
          </Link>`;

code = code.replace(search, replace);
fs.writeFileSync('src/app/admin/layout.tsx', code);
