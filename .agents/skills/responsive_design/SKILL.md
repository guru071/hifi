---
name: responsive_design
description: Mobile-first responsive design rules for HIFI customer storefront and admin CRM.
---

# Responsive Design Skill

## 1. Breakpoints
```css
/* Mobile first */
@media (min-width: 768px)  { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1440px) { /* Large desktop */ }
```

## 2. Critical Mobile Workflows
These MUST work perfectly on mobile:
- Browse products, Search, Product detail
- Custom design (WhatsApp link)
- Cart management
- Checkout + payment
- Order history + Invoice view

## 3. Grid Patterns
```css
.product-grid {
  display: grid;
  grid-template-columns: 1fr;           /* Mobile: 1 col */
  gap: 1rem;
}
@media (min-width: 768px) {
  .product-grid { grid-template-columns: repeat(2, 1fr); } /* Tablet: 2 col */
}
@media (min-width: 1024px) {
  .product-grid { grid-template-columns: repeat(3, 1fr); } /* Desktop: 3 col */
}
```

## 4. Rules
- Do NOT simply shrink desktop components for mobile.
- Touch targets: minimum 44px × 44px.
- Navigation: hamburger menu on mobile, full navbar on desktop.
- Images: use responsive sizes, lazy loading.
- Admin: sidebar navigation collapses to bottom tabs on mobile.
