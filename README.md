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

## ✨ 3D, Motion & Transitions (FX layer)

An additive effects layer lives in `/fx/` and is injected into every page's `<head>`. It never edits the compiled React islands: effects only write inline transform/opacity (restored when they finish) and `data-fx-*` attributes, and every canvas and overlay is appended to `<body>`.

| What | Where |
|---|---|
| Homepage hero: floating pill nav that tightens on scroll (hamburger menu, Contact us), blue arch, and a phone playing a reel that rises to the centre as you scroll while a curved strip of video and image cards opens out behind it. Markup lives in `fx/partials/home-hero.html` and is injected by `scripts/inject-fx.js`; the cloned header and hero stay in the page (hidden) so React hydrates normally | `fx/hero.js`, `fx/hero.css`, `fx/media/` |
| Homepage "Selected work": one big card per project (real case-study results) stacked with sticky scrolling — each new project slides up over the last, which sinks back and dims; stats count up, chips, charts and reels animate in as each card lands | `fx/projects.js`, `fx/projects.css`, `fx/partials/home-projects.html` |
| Homepage trust strip: drifting marquee of the platforms we publish to, and rating cards (reviews, Clutch, Sortlist) whose scores count up and stars fill, with 3D tilt and pointer glow | `fx/trust.js`, `fx/trust.css`, `fx/partials/home-trust.html` |
| Homepage "How it works": pinned stage with the three steps on a progress rail and a 3D app window that changes as you scroll — services get picked and the plan total adds up, the onboarding checklist ticks off, posts go from awaiting to approved to published. Steps are clickable; replaces the cloned section (hidden, so React hydrates as usual) | `fx/hiw.js`, `fx/hiw.css`, `fx/partials/home-hiw.html` |
| Homepage portfolio as a shop: sticky filter sidebar (format, industry → sub-industry, with counts), removable filter pills, grid-size toggle, product-style tiles with 3D tilt + glare and hover-to-play video, load more with progress, and a quick-view dialog with prev/next. Data is generated from the site's examples bundle by `node scripts/build-portfolio.mjs`, keeping only items whose media exists | `fx/portfolio.js`, `fx/portfolio.css`, `fx/portfolio-data.js`, `fx/partials/home-portfolio.html` |
| Homepage, pricing down: new pricing heading over the (restyled) React plan builder; rebuilt Pro strip + money-back guarantee (3D "Day 14" seal and 14-day track driven by scroll), cost comparison (price bars that grow, Feedbird highlighted), reviews (3D cover-flow of video reviews with drag/keys and sound on click, plus drifting columns of 24 text reviews), FAQ (sticky heading, animated accordion) and final CTA (light arch card, 3D floaters, counting stats). Content comes from the site itself | `fx/bottom.js`, `fx/bottom.css`, `fx/partials/home-pricing-head.html`, `fx/partials/home-bottom.html` |
| Floating 3D social icons (heart, play, chat, star…) over each page hero and the final CTA, with pointer parallax, cursor repulsion and scroll drift | `fx/three/floaters.js` |
| 3D helix gallery of portfolio work on the homepage — pinned, scroll-driven, drag to spin, click to open `/examples/` | `fx/three/gallery.js` |
| Tilted 3D card wall with pointer parallax (home + service heroes) | `fx/fx.js` → `bindWall` |
| Landing page: card groups staged in 3D like the helix gallery — curved arcs that turn with the scroll and can be dragged, a pinned ring for "how it works", a cover-flow review row, a vertical drum of text reviews, and the hero wall bent into a cylinder | `fx/stage.js` |
| Landing page: "From scroll to sale" 3D sales funnel — five glossy tiers with people pouring in, dropping off and looping back as referrals; the section pins while scrolling walks through each stage in plain language | `fx/funnel.js`, `fx/three/funnel3d.js` |
| Industry & service pages: the funnel retold per page (restaurants → "From scroll to reservation", email → "From inbox to income", ads → "From ad to customer"…) | `fx/funnel-data.js` |
| Pricing: 3D ROI estimator — pick a business, budget and customer value; bars show reach → customers with an illustrative return | `fx/roi.js`, `fx/three/bars3d.js` |
| Compare: 3D cost towers for each way of getting social media done | `fx/towers.js`, `fx/three/towers3d.js` |
| Social media management: "A month of content, handled" — 3D calendar whose days flip to reveal posts as you scroll | `fx/calendar.js`, `fx/three/calendar3d.js` |
| Page explainers (shared shell `fx/explainer.js`, content in `fx/explainers.js`): SEO "Climb to page one", conversion tracking "Follow the customer", short-form video "Win the first 3 seconds", Instagram "Real followers actually engage", book a demo call ring, reseller white-label layers, About globe, city-page local reach | `fx/three/ex-*.js`, `fx/three/base.js` |
| Branded 3D curtain on load and between pages, Lenis smooth scroll, scroll progress bar | `fx/fx.js` |
| 3D scroll reveals for headings, copy, cards and media; hover tilt + glare on cards; magnetic CTAs; cursor ring; count-up stats; flip-in on tab/filter swaps | `fx/fx.js` |

Libraries are vendored in `fx/vendor/` (GSAP 3.15 + ScrollTrigger, Lenis 1.3, Three.js r186), so the site still works offline. Three.js is loaded on demand, after first paint.

```bash
node scripts/inject-fx.js           # add / refresh the FX tags in all pages (idempotent)
node scripts/inject-fx.js --remove  # strip the FX layer again
```

**Accessibility & fallbacks:** with `prefers-reduced-motion` there is no curtain, smooth scroll or reveal animation, and the 3D scenes render as still images. Touch devices get no cursor, tilt or magnetic effects. If a script fails, the page shows as normal after at most 4 seconds.

---

## 🛠️ Verification Suite

A built-in verification suite validates all local assets and subpage routes:

```bash
npm run validate
```

All 98 homepage assets/links and 29 primary routes pass with `200 OK` and 0 failures.
"# birdfeed" 
