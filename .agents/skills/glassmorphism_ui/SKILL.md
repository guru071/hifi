---
name: glassmorphism_ui
description: HIFI's liquid glass design system - blur, transparency, depth, and premium visual language.
---

# Liquid Glass UI Skill

## 1. Core Visual Language
HIFI uses a premium liquid-glass aesthetic. Key CSS properties:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

## 2. When to Use Glass
- **Customer storefront**: Premium glass + fashion aesthetic. Hero sections, product cards, modals.
- **Admin CRM**: Premium but information-dense. Use lighter glass on cards, keep data tables readable.
- **Never** turn ALL surfaces into glass. Data-heavy interfaces must prioritize readability.

## 3. Color Palette
- Background: Deep dark gradients (`#0a0a0a` to `#1a1a2e`).
- Accent: Gold/amber highlights (`#f0c040`, `#e8b830`).
- Text: White primary (`#ffffff`), muted secondary (`rgba(255,255,255,0.7)`).
- Borders: Subtle light borders (`rgba(255,255,255,0.08)`).

## 4. Typography
- Use Google Fonts: `Inter`, `Outfit`, or `Poppins`.
- Never use browser default fonts.
- Heading hierarchy: h1 > h2 > h3 with clear size progression.

## 5. Micro-Animations
- Hover effects on cards: subtle scale + glow.
- Page transitions: fade-in with slight upward movement.
- Button hover: background shift + slight shadow increase.
```css
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(240, 192, 64, 0.15);
  border-color: rgba(240, 192, 64, 0.3);
}
```

## 6. Responsive Rules
- Mobile: Stack layouts, full-width cards, larger touch targets.
- Tablet: 2-column grids.
- Desktop: 3-4 column grids with sidebar navigation.
