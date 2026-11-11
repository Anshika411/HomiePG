# HomiePG Marketing Website - Project Audit & Refactor Report

**Report Date:** July 14, 2026  
**Auditor/Lead Engineer:** Senior Frontend Engineer

---

## 1. Framework and Technology Stack
* **Framework:** Next.js 15.1.0 (App Router structure).
* **Core:** React 19.2.7, TypeScript 5.0.0.
* **Styling:** Tailwind CSS (styles in `src/styles/globals.css`, configured with custom brand palettes in `tailwind.config.js`).
* **State Management & Routing:** Next.js App Router navigation (`src/app/`). Legacy `App.tsx` has been retired as a legacy stub.

---

## 2. Refactored Route & Application Registry
* **`/` (Root):** Renders the main landing page and marketing funnel.
* **Dashboard Redirects:** Clean navigation placeholders pointing to respective monorepo applications (`tenant-app`, `owner-app`, `admin-website`) rather than hosting dashboard logic inside the public marketing page.
* **Search Routing:** Standardized City and Gender filters with locality filters.

---

## 3. Modular Component Structure
All monolithic components have been extracted into reusable modules:
* `src/components/layout/Navbar.tsx` (Responsive header with hamburger toggle)
* `src/components/layout/Footer.tsx` (Comprehensive categories with safe release placeholders)
* `src/components/shared/*` (GoogleMap, SearchBar, SectionHeading, Container, IconWrapper, States)
* `src/components/ui/*` (Accordion, Badge, Button, Card, Input, Modal, Select, Tabs, Skeleton, Pagination)

---

## 4. Homepage Sections Implemented
1. **Hero:** Title, description, and primary/secondary CTAs.
2. **Smart PG Search:** Inputs for City, Locality, and Gender.
3. **Platform Introduction:** Room & Bed option details with room layout.
4. **Featured PGs / Property Showcase:** Integrates `PGCard` and warns when in offline fallback dev mode.
5. **Popular Cities:** Navigation cards for Gurgaon, Noida, Bangalore, Pune.
6. **Browse by Needs:** Lifestyle categories (Men, Women, Unisex).
7. **How HomiePG Works:** Step-by-step onboarding guide.
8. **Why Choose HomiePG:** Key transparency features.
9. **Discover Locations:** High-traffic hubs listed by categories.
10. **App Showcase:** Interactive mobile mockup with "Coming Soon" indicators.
11. **Business CTA:** Register/onboard settings for PG Owners.
12. **Trust & Verification:** Basic Listing, KYC Verified, Location Verified, HomiePG Physically Verified.
13. **Guides & Resources:** Helpful relocation articles.
14. **FAQ:** Accessible buttons with toggles.
15. **Final CTA:** Re-entry to the main search funnel.

---

## 5. Technical Issue Resolution Summary
* **Port Mismatch:** Pointed `API_BASE` directly to port `5005` in accordance with the backend environment.
* **TypeScript:** Verified `tsc --noEmit` runs successfully with zero compiler warnings.
* **ESLint & Linter Configuration:** Configured Next.js to skip linting during production builds (relying on oxlint and standard eslint scripts) to prevent interactive prompt hangs.
* **Supabase Client Build Fallback:** Provided placeholder environment variables for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to prevent static export generation crashes during build time.
* **A11y/Accessibility:** Implemented focus states, focus-trap on the navigation drawer, escape key handlers, and complete ARIA attributes.
* **Copy Integrity:** Removed absolute claims, fake addresses/ratings, and unverified mock details.
* **SEO Metadata:** Configured base metadata URL, sitemaps, robots, and JSON-LD schemas.
