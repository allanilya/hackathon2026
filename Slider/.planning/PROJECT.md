# Slider Landing Page

## What This Is

A single-page marketing website for **Slider** — an AI copilot that lives inside PowerPoint as a chatbot sidebar, helping users build professional slide decks with AI-powered presets called "Skills." The landing page drives waitlist signups with a premium, scroll-animated experience inspired by Square's bold, product-centric aesthetic.

## Core Value

The page must feel premium and intentional — every scroll interaction should reinforce that Slider is a polished, trustworthy product worth signing up for.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Hero section with headline, subline, CTA, and Skills mention
- [ ] Pinned scroll-through feature showcase (content swaps while viewport locked)
- [ ] Animated product demo section (scroll-driven sidebar walkthrough)
- [ ] Dedicated Skills/presets section with cards
- [ ] Use case cards section
- [ ] Social proof / stats section
- [ ] Final CTA section with waitlist signup
- [ ] Footer with links
- [ ] Lenis smooth scroll + GSAP ScrollTrigger animations throughout
- [ ] Waitlist email capture form (placeholder UI, no backend)
- [ ] Responsive design (desktop-first, mobile-friendly)
- [ ] Alternating dark/light sections with sharp contrast
- [ ] Prefers-reduced-motion accessibility support

### Out of Scope

- Backend / API for waitlist submission — placeholder UI only for now
- Blog or multi-page content — single page only
- Authentication or dashboard — marketing site only
- Mobile app — web only
- CMS integration — static content, hardcoded copy
- Real product screenshots — use mockups/placeholders, swap in later

## Context

- **Product**: Slider is a PowerPoint add-in sidebar with an AI chatbot that uses "Skills" (curated presets/templates for specific industries and use cases) to help users create professional decks fast
- **Design reference**: Square (squareup.com) — bold typography, dramatic scroll animations, pinned showcases, alternating dark/light, product-centric
- **Animation reference**: Lenis + GSAP ScrollTrigger skill installed at `~/.claude/skills/lenis-gsap-scroll/` — use as primary reference for all scroll animation patterns
- **Color palette**:
  - Primary: `#C4501E` (burnt orange) — CTAs, links, logo
  - Primary Hover: `#A8431A` — pressed/hover states
  - Amber: `#D97706` — accent highlights, stats
  - Teal: `#0F766E` — secondary actions, success states
  - Neutrals (warm stone): 950 `#0C0A09` · 900 `#1C1917` · 800 `#292524` · 700 `#44403C` · 600 `#57534E` · 500 `#78716C` · 400 `#A8A29E` · 300 `#D6D3D1` · 200 `#E7E5E4` · 100 `#F5F5F4` · 50 `#FAFAF9`
  - Semantic: Success `#16A34A` · Error `#DC2626`
- **Typography**: Fluid, oversized headings (Square-style). System font stack or Inter/Geist
- **Strategy**: Ship structure and animations first, refine copy and visuals later

## Constraints

- **Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Lenis v1.3.x, GSAP v3.14.x with ScrollTrigger
- **Scope**: Single-page marketing site only — no multi-page routing needed
- **Timeline**: Ship fast, iterate later — structure and animations first
- **Animations**: Must use Lenis + GSAP ScrollTrigger integration (3-line bridge pattern from skill reference)
- **Accessibility**: Respect `prefers-reduced-motion` — disable/reduce animations when set

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Lenis + GSAP ScrollTrigger for animations | Premium scroll feel, proven integration pattern, skill reference available | — Pending |
| Placeholder waitlist (no backend) | Ship fast, add real submission later | — Pending |
| Next.js 15 App Router | Modern React framework, good DX, easy deployment to Vercel | — Pending |
| Square as design reference | Bold, product-centric, premium feel matches Slider's positioning | — Pending |
| Burnt orange primary color | Distinctive, warm, stands out from typical blue/purple SaaS sites | — Pending |

---
*Last updated: 2026-02-07 after initialization*
