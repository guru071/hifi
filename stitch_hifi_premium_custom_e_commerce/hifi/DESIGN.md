---
name: HIFI
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1b1b1b'
  on-surface-variant: '#4c4546'
  inverse-surface: '#303030'
  inverse-on-surface: '#f1f1f1'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0e0'
  on-secondary-container: '#616363'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1b1b'
  on-tertiary-container: '#848484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#f9f9f9'
  on-background: '#1b1b1b'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  section-gap: 128px
---

## Brand & Style
The design system for this brand is rooted in the "Liquid Glass" aesthetic, a sophisticated fusion of high-end fashion editorial and cutting-edge hardware interface design. It targets a premium audience that values precision, craftsmanship, and the tactile nature of luxury goods.

The UI is built on a foundation of **Glassmorphism**, characterized by multi-layered translucent surfaces, high-refractive backdrop blurs, and 1px "inner-glow" borders that mimic the edge of a physical glass pane. The emotional response is one of clarity, depth, and effortless modernity—evoking the feeling of a premium device or a high-end gallery space. 

**Core Principles:**
- **Refractive Depth:** Use overlapping glass layers to establish hierarchy.
- **Physicality:** Elements should feel like physical objects through subtle soft shadows and light-catching borders.
- **Minimalist Authority:** Heavy use of whitespace and a strict monochrome-heavy palette to let product photography lead.

## Colors
The palette is hyper-disciplined, focusing on high-contrast neutrals to ground the translucent glass elements.

- **Primary (Ink Black):** Used for critical typography and primary structural elements.
- **Secondary (Paper White):** The clean, neutral canvas for all layouts.
- **Accent (Electric Blue):** A high-energy, digital-first blue reserved exclusively for primary calls to action, active states, and interactive highlights.
- **Glass System:** Surfaces are defined by `rgba(250, 250, 250, 0.7)` with a `20px` to `40px` backdrop-blur. In dark mode or on dark backgrounds, glass surfaces shift to `rgba(0, 0, 0, 0.5)`.
- **Subtle Borders:** All glass elements are contained by a 1px solid border at low opacity to provide definition against similar background colors.

## Typography
This design system utilizes **Inter** for its systematic, utilitarian, yet modern feel. The type scale is aggressive in its contrast, moving from massive, tightly-tracked display headers to highly legible, airy body copy.

- **Display & Headlines:** Use tight letter-spacing (-0.02em to -0.04em) for a "high-fashion" editorial look.
- **Labels:** Small labels use uppercase with increased letter-spacing to provide a technical, "spec-sheet" aesthetic for garment details.
- **Hierarchy:** Rely on weight and scale rather than color. Headers should almost always be Ink Black (#000000).

## Layout & Spacing
The layout philosophy is "Airy Precision." It uses a fixed-grid approach for desktop to maintain the integrity of white space, while transitioning to a fluid model for mobile.

- **Desktop (1440px+):** 12-column grid with 24px gutters and wide 64px margins.
- **Tablet (768px - 1439px):** 8-column grid with 24px gutters.
- **Mobile (Up to 767px):** 4-column grid with 16px gutters and 20px margins.
- **Vertical Rhythm:** A strict 8px baseline grid ensures alignment. Section gaps are intentionally large (128px) to create the "gallery" feel where each product or message has room to breathe.

## Elevation & Depth
Depth is not created through heavy shadows, but through **Refractive Stacking**.

1. **Level 0 (Base):** Paper White or subtle light-grey canvas.
2. **Level 1 (Cards/Lists):** Solid white surfaces with a 1px border (#000/0.05) and a very soft, large-radius shadow (Blur: 40px, Y: 10px, Opacity: 0.04).
3. **Level 2 (Glass Floating UI):** Floating navigation and variant selectors. Backdrop blur (30px) + white tint (70%) + 1px white "specular" border (top/left) and dark border (bottom/right).
4. **Level 3 (Modals/Overlays):** Darkened backdrop dimming (20%) with a high-blur glass container centered.

Shadows must be "ambient"—multi-layered with low opacity to avoid a muddy look.

## Shapes
The shape language follows an "Apple-esque" philosophy of continuous curves and soft geometry. 

- **Primary Containers:** Use `rounded-2xl` (1.5rem / 24px) for product cards and main containers.
- **Interactive Elements:** Buttons and input fields use `rounded-xl` (1rem / 16px).
- **Glass Floating Elements:** Navigation bars and floating action buttons should utilize `rounded-full` (pill-shaped) or `3xl` for a more organic, liquid appearance.
- **Borders:** Always 1px. Never use thick borders. The border color should be a slightly darker version of the surface it contains to look like a "refractive edge."

## Components
- **Buttons:** Primary buttons are solid Ink Black with white text. Secondary buttons are "Glass" with Electric Blue text. The "Active" state for primary actions uses the Electric Blue accent.
- **Product Cards:** Minimalist. No borders on the card itself, just a soft shadow. The image fills the top 80% of the card, with metadata in small, precise typography at the bottom.
- **Glass Navigation:** A floating bar at the bottom or top of the screen. It uses `backdrop-filter: blur(40px)` and a pill shape.
- **Variant Selectors:** Small glass circles or squares with a 1px border. When selected, they gain an Electric Blue "ring" highlight.
- **Admin Tables:** Use solid surfaces. Rows are separated by 1px Paper Grey lines. No vertical borders. Headers are `label-sm` (uppercase).
- **Motion:** Use "spring" physics (stiffness: 120, damping: 20) for all glass transitions. Elements should feel light and responsive, not linear.