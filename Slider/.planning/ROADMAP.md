# Roadmap: Slider Landing Page

## Overview

This roadmap delivers a premium single-page marketing site with scroll-driven animations inspired by Square's bold aesthetic. Starting with design system foundations, we build progressively from navigation and hero through sophisticated pinned showcases, to card grids and closing sections. Animations are woven throughout using Lenis + GSAP ScrollTrigger, creating a cohesive scroll experience that reinforces Slider's polished positioning.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Design System** - Next.js setup, Tailwind config, Lenis + GSAP integration
- [x] **Phase 2: Navigation & Hero** - Sticky navbar and hero section with entry animations
- [x] **Phase 3: Feature Showcase** - Pinned scroll section with scrub-driven content transitions
- [ ] **Phase 4: Product Demo** - Scroll-driven animated sidebar walkthrough
- [ ] **Phase 5: Skills & Use Cases** - Card grid sections with staggered reveals
- [ ] **Phase 6: Final CTA & Footer** - Closing waitlist section and footer

## Phase Details

### Phase 1: Foundation & Design System
**Goal**: Project foundation is established with custom design system and animation infrastructure ready for content sections
**Depends on**: Nothing (first phase)
**Requirements**: DSGN-01, DSGN-02, DSGN-03, DSGN-04, DSGN-05, DSGN-06, ANIM-01, ANIM-06
**Success Criteria** (what must be TRUE):
  1. Next.js 15 app runs locally with TypeScript and Tailwind CSS v4 configured
  2. Custom color palette (burnt orange, amber, teal, warm stone neutrals) available as Tailwind utilities
  3. Lenis smooth scroll initializes with GSAP ticker integration (3-line bridge pattern working)
  4. Fluid typography scale renders oversized headings and readable body text across viewports
  5. Alternating dark/light section backgrounds work with responsive layout adapting to tablet and mobile
  6. Animations respect prefers-reduced-motion setting (disable when detected)
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold, dependencies, and PostCSS configuration
- [x] 01-02-PLAN.md — Design tokens (@theme) and animation infrastructure (Lenis + GSAP)
- [x] 01-03-PLAN.md — Section skeleton with alternating backgrounds and UI components (Button, Card)

### Phase 2: Navigation & Hero
**Goal**: Users land on a compelling hero section with functional navigation that sets premium tone
**Depends on**: Phase 1
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, HERO-01, HERO-02, HERO-03, ANIM-02
**Success Criteria** (what must be TRUE):
  1. Sticky navbar appears at top with logo, section links, and CTA button
  2. Nav links smooth-scroll to page sections via Lenis integration
  3. Mobile hamburger menu collapses navigation into slide-out menu
  4. Navbar background transitions from transparent to solid as user scrolls down
  5. Hero displays bold oversized headline with subline and PowerPoint sidebar visual
  6. Hero contains email input and "Join Waitlist" button (placeholder, no submission)
  7. Hero content fades in on initial page load
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Sticky navbar with Lenis anchor scrolling and scroll-based background transition
- [x] 02-02-PLAN.md — Hero section with waitlist form, product mockup visual, and fade-in animation
- [x] 02-03-PLAN.md — Mobile hamburger menu with accessible slide-out panel and visual verification

### Phase 3: Feature Showcase
**Goal**: Users experience pinned scroll showcase where features swap smoothly as they scroll
**Depends on**: Phase 2
**Requirements**: FEAT-01, FEAT-02, FEAT-03, FEAT-04, ANIM-04
**Success Criteria** (what must be TRUE):
  1. Viewport locks on feature section while user scrolls through 3-5 feature slides
  2. Each feature slide displays icon/illustration and descriptive copy
  3. Feature slides transition smoothly driven by scroll progress (GSAP ScrollTrigger scrub)
  4. Pinned section releases after final feature, allowing scroll to continue
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — FeatureSlide component and feature content data with SVG icons
- [x] 03-02-PLAN.md — FeatureShowcase with GSAP ScrollTrigger pin + scrub animation and page integration

### Phase 4: Product Demo
**Goal**: Users see animated walkthrough showing Slider sidebar in action through scroll-driven storytelling
**Depends on**: Phase 3
**Requirements**: DEMO-01, DEMO-02, DEMO-03, ANIM-02, ANIM-03
**Success Criteria** (what must be TRUE):
  1. Demo section displays PowerPoint chrome frame mockup wrapping content area
  2. Sidebar walkthrough animates as user scrolls through demo section
  3. Content structure supports swapping in real screenshots later (placeholder-ready)
  4. Parallax effects work on select background elements for depth
  5. Demo content fades in as section enters viewport
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Skills & Use Cases
**Goal**: Users browse Skills presets and use cases through interactive card grids with smooth reveals
**Depends on**: Phase 4
**Requirements**: SKIL-01, SKIL-02, SKIL-03, UCAS-01, UCAS-02, UCAS-03, ANIM-05
**Success Criteria** (what must be TRUE):
  1. Skills section displays grid of preset cards grouped by category labels (Sales, Education, Startup)
  2. Skill cards have hover interactions (scale, shadow lift, or preview detail)
  3. Skills cards reveal with staggered animation as they scroll into view (ScrollTrigger batch)
  4. Use case cards display with title, description, and visual/icon for each scenario
  5. Use case cards animate in with fade and stagger as section enters viewport
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Final CTA & Footer
**Goal**: Users reach compelling closing CTA and complete footer to finish page experience
**Depends on**: Phase 5
**Requirements**: CTA-01, CTA-02, FOOT-01, FOOT-02
**Success Criteria** (what must be TRUE):
  1. Final CTA section displays full-width with compelling headline
  2. CTA contains email input and "Join Waitlist" button (placeholder, mirrors hero)
  3. Footer appears with copyright, social links, and legal links
  4. Footer styling matches dark section theme
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Design System | 3/3 | Complete | 2026-02-07 |
| 2. Navigation & Hero | 3/3 | Complete | 2026-02-08 |
| 3. Feature Showcase | 2/2 | Complete | 2026-02-08 |
| 4. Product Demo | 0/TBD | Not started | - |
| 5. Skills & Use Cases | 0/TBD | Not started | - |
| 6. Final CTA & Footer | 0/TBD | Not started | - |
