# Feedbird.com - End-to-End Complete Clone

An exact, end-to-end, pixel-perfect clone of **[Feedbird.com](https://feedbird.com/)**.

All libraries, interactive components, stylesheets, custom typography, images, video reviews, portfolio showcases, and subpages have been fully mirrored and re-wired to work locally and offline.

---

## 🚀 Quick Start

To run the cloned website locally:

```bash
# Start the local server
node server.js
# Or
npm start
```

Then open your browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

---

## 📦 What Has Been Cloned

### 1. **Complete Design & Styles**
- Full **Astro & Tailwind** styling bundled in `_astro/BareLayout.D1AS6OLU.css` and modular inline styles.
- Custom brand styling tokens (`--fb-bg: #f3f2f1`, `--fb-primary: #3b5bff`, `--fb-card: #fbfaf8`, grain textures, rayfans, and contour overlays).
- Full mobile responsiveness with custom mobile slider arrows (`slider-arrows.js`).

### 2. **Typography & Web Fonts**
All self-hosted WOFF2 fonts located in `/fonts/`:
- **Geist Sans**: 400, 500, 600, 700, 800 Normal
- **JetBrains Mono**: 400, 500, 600 Normal

### 3. **Assets & Media (100% Downloaded & Re-linked)**
- **Branding & Logos**: `/assets/feedbird-logo.svg`, `/assets/feedbird-mark.jpg`.
- **Work Showcase Assets**: All 15 webp showcase graphics in `/assets/work/`.
- **Featured Samples**: All 8 high-res previews in `/img/ex/`.
- **Case Studies**: All original imagery in `/img/`.
- **Portfolio Showcase**: All **407** high-resolution example showcase images in `/px/`.
- **Client Video Testimonials**: All 8 video review posters (`/reviews/*.webp`) and MP4 video files (`/reviews/*.mp4`).
- **Demo Videos**: Product walkthrough video (`/vx/feedbird-demo.mp4`) and UGC assets in `/ugc/`.

### 4. **Astro Islands & Interactive React Components**
All compiled React client islands (`FBHomeTop`, `FBHomeMain`, `FBHomeBottom`, etc.) stored in `_astro/`:
- **Navigation Mega-menus**: Interactive "Services" and "Company" multi-column dropdowns.
- **Interactive Pricing Calculator**: Real-time service selection, dynamic pricing updates, add-on toggles, and plan generation.
- **Interactive Portfolio Gallery**: Category tabs (Social Media, Short-Form Videos, UGC, Ad Creative, etc.) with responsive masonry/grid previews.
- **Video Players**: Interactive modal video player with custom play controls.
- **FAQ Accordions**: Expandable and collapsible question drawers.
- **Sticky Conversion Bar**: Dynamic sticky bar responding to viewport scroll.

### 5. **Complete Multi-Page Routing (50+ Pages)**
All subpages are fully replicated with complete content, meta tags, and layouts:
- **Core Pages**: `/pricing/`, `/examples/`, `/reviews/`, `/about/`, `/compare/`, `/case-studies/`, `/book-demo/`, `/reseller/`, `/pro/`, `/all-services/`, `/video-demo/`
- **Service Pages**: `/social-media-management/`, `/short-form-video/`, `/instagram-growth/`, `/ugc-videos/`, `/ad-creative/`, `/ppc-services/`, `/meta-ads-management/`, `/google-ads-management/`, `/seo-services/`, `/seo-blog-posts/`, `/seo-backlinks/`, `/managed-seo/`, `/email-design/`, `/conversion-tracking/`, `/landing-pages/`
- **Industry Pages**: Restaurants, Real Estate, Dentists, Gyms, Law Firms, Salons, E-commerce, Medical, Car Dealerships, Coaches, Home Services.
- **City Landing Pages**: New York, Los Angeles, Chicago, Houston, Miami, Atlanta, Seattle, Denver, San Diego, Toronto, Vancouver, Montreal.
- **Legal & Info**: `/privacy/`, `/terms/`, `/refund/`, `/blog/`, `/seo-glossary/`.

---

## 🛠️ Verification Suite

A built-in verification suite validates all local assets and subpage routes:

```bash
npm run validate
```

All 98 homepage assets/links and 29 primary routes pass with `200 OK` and 0 failures.
"# birdfeed" 
