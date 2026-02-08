# Requirements: Slider Landing Page

**Defined:** 2026-02-07
**Core Value:** The page must feel premium and intentional — every scroll interaction reinforces that Slider is a polished, trustworthy product worth signing up for.

## v1 Requirements

### Navigation

- [x] **NAV-01**: Sticky top navbar with logo, section links, and CTA button
- [x] **NAV-02**: Nav links smooth-scroll to corresponding page sections via Lenis
- [x] **NAV-03**: Mobile hamburger menu that collapses nav into slide-out/dropdown
- [x] **NAV-04**: Navbar background transitions from transparent to solid on scroll

### Hero

- [x] **HERO-01**: Bold oversized headline with supporting subline copy
- [x] **HERO-02**: Primary CTA — email input field + "Join Waitlist" button (placeholder, no submission)
- [x] **HERO-03**: Hero visual — PowerPoint sidebar mockup or abstract product visual

### Feature Showcase

- [x] **FEAT-01**: Pinned scroll section — viewport locks while user scrolls through features
- [x] **FEAT-02**: 3-5 feature content slides that swap within the pinned section
- [x] **FEAT-03**: Each feature slide has an icon/illustration and descriptive copy
- [x] **FEAT-04**: Smooth scrub-driven transitions between feature slides via GSAP ScrollTrigger

### Product Demo

- [ ] **DEMO-01**: Scroll-driven animated walkthrough showing the Slider sidebar in action
- [ ] **DEMO-02**: PowerPoint chrome frame mockup wrapping the demo content
- [ ] **DEMO-03**: Placeholder content structured to swap in real screenshots/assets later

### Skills Section

- [ ] **SKIL-01**: Grid of Skill preset cards grouped by category labels (e.g. Sales, Education, Startup)
- [ ] **SKIL-02**: Cards have hover interaction (scale, shadow lift, or preview detail)
- [ ] **SKIL-03**: Staggered reveal animation as cards scroll into view (ScrollTrigger batch)

### Use Cases

- [ ] **UCAS-01**: Use case cards showing specific scenarios where Slider helps
- [ ] **UCAS-02**: Each card has title, description, and visual/icon
- [ ] **UCAS-03**: Cards animate in with scroll-triggered fade-in and stagger

### Final CTA

- [ ] **CTA-01**: Full-width section with compelling headline and waitlist signup form
- [ ] **CTA-02**: Email input + "Join Waitlist" button (placeholder, mirrors hero CTA)

### Footer

- [ ] **FOOT-01**: Minimal footer with copyright, social links, and legal links
- [ ] **FOOT-02**: Consistent with dark section styling

### Scroll Animations

- [ ] **ANIM-01**: Lenis smooth scroll initialized with GSAP ticker integration (3-line bridge)
- [x] **ANIM-02**: Fade-in-on-scroll reveals for content sections
- [ ] **ANIM-03**: Parallax effects on select background elements
- [x] **ANIM-04**: Pinned section with scrub-driven content swap (feature showcase)
- [ ] **ANIM-05**: Staggered batch reveals for card grids (Skills, Use Cases)
- [ ] **ANIM-06**: Respects `prefers-reduced-motion` — disables/reduces animations when set

### Design System

- [ ] **DSGN-01**: Tailwind config with custom color palette (burnt orange, amber, teal, warm stone neutrals)
- [ ] **DSGN-02**: Fluid typography scale — oversized headings, readable body text
- [ ] **DSGN-03**: Alternating dark (stone-900/950) and light (stone-50/100) section backgrounds
- [ ] **DSGN-04**: Pill-shaped CTA buttons with hover state transitions
- [ ] **DSGN-05**: Rounded cards with subtle borders or shadows
- [ ] **DSGN-06**: Responsive layout — desktop-first, adapts cleanly to tablet and mobile

## v2 Requirements

### Social Proof

- **SOCL-01**: Animated number counters (e.g. "10,000+ decks created")
- **SOCL-02**: Testimonial quote cards
- **SOCL-03**: Company/partner logo bar

### Enhanced Waitlist

- **WAIT-01**: Waitlist form submits to backend API or email service
- **WAIT-02**: Confirmation email sent on signup
- **WAIT-03**: Waitlist position or thank-you page

### Advanced Animations

- **ADVN-01**: Hero scroll-away effect (scale down + fade on scroll)
- **ADVN-02**: Text reveal line-by-line with split text
- **ADVN-03**: Cursor-following effects or interactive elements

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend API / database | Placeholder UI only, add real submission post-launch |
| Multi-page site / blog | Single-page marketing site only |
| CMS integration | Static content, hardcoded copy for speed |
| Authentication / dashboard | Marketing site, not app |
| Real product screenshots | Use mockups/placeholders, swap in later |
| Video embeds | Adds complexity and load time, defer |
| Internationalization (i18n) | English only for v1 |
| Analytics / tracking | Can add post-launch with minimal effort |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 2 | Complete |
| NAV-02 | Phase 2 | Complete |
| NAV-03 | Phase 2 | Complete |
| NAV-04 | Phase 2 | Complete |
| HERO-01 | Phase 2 | Complete |
| HERO-02 | Phase 2 | Complete |
| HERO-03 | Phase 2 | Complete |
| FEAT-01 | Phase 3 | Complete |
| FEAT-02 | Phase 3 | Complete |
| FEAT-03 | Phase 3 | Complete |
| FEAT-04 | Phase 3 | Complete |
| DEMO-01 | Phase 4 | Pending |
| DEMO-02 | Phase 4 | Pending |
| DEMO-03 | Phase 4 | Pending |
| SKIL-01 | Phase 5 | Pending |
| SKIL-02 | Phase 5 | Pending |
| SKIL-03 | Phase 5 | Pending |
| UCAS-01 | Phase 5 | Pending |
| UCAS-02 | Phase 5 | Pending |
| UCAS-03 | Phase 5 | Pending |
| CTA-01 | Phase 6 | Pending |
| CTA-02 | Phase 6 | Pending |
| FOOT-01 | Phase 6 | Pending |
| FOOT-02 | Phase 6 | Pending |
| ANIM-01 | Phase 1 | Complete |
| ANIM-02 | Phase 2, Phase 4 | Complete |
| ANIM-03 | Phase 4 | Pending |
| ANIM-04 | Phase 3 | Complete |
| ANIM-05 | Phase 5 | Pending |
| ANIM-06 | Phase 1 | Complete |
| DSGN-01 | Phase 1 | Complete |
| DSGN-02 | Phase 1 | Complete |
| DSGN-03 | Phase 1 | Complete |
| DSGN-04 | Phase 1 | Complete |
| DSGN-05 | Phase 1 | Complete |
| DSGN-06 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0
- Coverage: 100%

**Notes:**
- ANIM-02 appears in both Phase 2 (Hero fade-in) and Phase 4 (Demo section fade-in) as it's a reusable animation pattern applied to multiple sections

---
*Requirements defined: 2026-02-07*
*Last updated: 2026-02-08 after Phase 3 completion*
