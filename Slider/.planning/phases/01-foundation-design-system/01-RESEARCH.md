# Phase 1: Foundation & Design System - Research

**Researched:** 2026-02-07
**Domain:** Next.js 15 App Router with Tailwind CSS v4, GSAP ScrollTrigger, and Lenis smooth scroll
**Confidence:** HIGH

## Summary

Phase 1 establishes the project foundation using Next.js 15 App Router with Tailwind CSS v4's new CSS-first configuration approach. The major shift is that Tailwind v4 moves away from `tailwind.config.js` to a CSS-first paradigm using the `@theme` directive, enabling design tokens as native CSS variables. Next.js 15 defaults to Geist font (Vercel's modern sans-serif) and includes automatic font optimization. The Lenis + GSAP ScrollTrigger integration requires a critical 3-line bridge pattern to synchronize smooth scrolling with scroll-triggered animations. Implementation requires client components (`"use client"`) with proper useEffect hooks for browser API access.

The standard approach is: PostCSS plugin configuration → CSS-first theme customization → fluid typography via clamp() or Tailwind plugins → client-side animation initialization with `prefers-reduced-motion` accessibility support.

**Primary recommendation:** Use Tailwind CSS v4's `@theme` directive in `globals.css` for all design tokens, leverage Next.js 15's built-in Geist font, implement fluid typography with `clamp()` utilities, and initialize Lenis + GSAP in a client component with the 3-line bridge pattern plus reduced-motion detection.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x (latest) | React framework with App Router | Industry standard for React SSR/SSG, built-in font optimization, excellent DX |
| Tailwind CSS | v4.0+ | Utility-first CSS framework | CSS-first config, 3-10x faster builds, Display P3 color space, native CSS variables |
| TypeScript | 5.x | Type safety | Next.js default, catches errors early, better IDE support |
| Lenis | 1.3.15 | Smooth scroll library | Premium scroll feel, 12.6k+ stars, used by Rockstar Games (GTA VI), Microsoft Design |
| GSAP | 3.14.x | Animation library with ScrollTrigger | Industry standard for scroll animations, free for commercial use (Webflow acquisition 2024) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tailwindcss/postcss` | 4.x | PostCSS plugin for Tailwind v4 | Required for Next.js integration |
| `lenis/dist/lenis.css` | 1.3.15 | Required Lenis styles | Critical for `data-lenis-prevent`, `autoToggle`, stopped states |
| `next/font` | Built-in | Font optimization | Always use for self-hosted fonts, prevents layout shift |
| Geist Font | Built-in Next.js 15 | Default Next.js font | Vercel's modern sans-serif, variable font, optimal performance |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind CSS v4 | Tailwind v3 | v3 uses JS config (more familiar), but v4 is 3-10x faster, CSS-first is more maintainable |
| Lenis | Locomotive Scroll | Locomotive is heavier (21KB vs 4KB), less actively maintained |
| GSAP ScrollTrigger | Framer Motion + react-scroll | Framer Motion lacks robust scroll-linked scrubbing, more React-specific patterns |
| Geist | Inter, Roboto | Inter/Roboto are fine alternatives, but Geist is pre-optimized in Next.js 15 |

**Installation:**
```bash
# Create Next.js 15 project with TypeScript, Tailwind, ESLint, App Router
npx create-next-app@latest spark --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"

# Install Tailwind CSS v4 + PostCSS plugin (replace v3 if needed)
npm install tailwindcss@next @tailwindcss/postcss

# Install Lenis smooth scroll
npm install lenis

# Install GSAP with ScrollTrigger
npm install gsap

# Install GSAP React hooks (optional but recommended for Next.js)
npm install @gsap/react
```

## Architecture Patterns

### Recommended Project Structure
```
spark/
├── app/
│   ├── layout.tsx           # Root layout with Geist font, Lenis wrapper
│   ├── page.tsx             # Homepage
│   └── globals.css          # Tailwind import + @theme customization
├── components/
│   ├── ui/                  # Reusable UI components (buttons, cards)
│   └── providers/           # Client-side providers (Lenis, animations)
├── lib/
│   ├── hooks/               # Custom hooks (usePrefersReducedMotion)
│   └── animations/          # GSAP animation configurations
├── public/                  # Static assets
├── postcss.config.mjs       # PostCSS with @tailwindcss/postcss
└── next.config.ts           # Next.js configuration
```

### Pattern 1: Tailwind CSS v4 Configuration (CSS-First)
**What:** Replace `tailwind.config.js` with `@theme` directive in CSS
**When to use:** All custom design tokens (colors, typography, spacing, etc.)
**Example:**
```css
/* app/globals.css */
/* Source: https://tailwindcss.com/blog/tailwindcss-v4 */
@import "tailwindcss";

@theme {
  /* Color palette - burnt orange primary, amber accent, teal secondary, warm stone neutrals */
  --color-burnt-orange: #C4501E;
  --color-burnt-orange-hover: #A8431A;
  --color-amber: #D97706;
  --color-teal: #0F766E;

  /* Stone neutrals (warm) - custom scale */
  --color-stone-50: #FAFAF9;
  --color-stone-100: #F5F5F4;
  --color-stone-200: #E7E5E4;
  --color-stone-300: #D6D3D1;
  --color-stone-400: #A8A29E;
  --color-stone-500: #78716C;
  --color-stone-600: #57534E;
  --color-stone-700: #44403C;
  --color-stone-800: #292524;
  --color-stone-900: #1C1917;
  --color-stone-950: #0C0A09;

  /* Fluid typography - clamp() approach */
  --font-size-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --font-size-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --font-size-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  --font-size-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --font-size-2xl: clamp(1.5rem, 1.3rem + 1vw, 2rem);
  --font-size-3xl: clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem);
  --font-size-4xl: clamp(2.25rem, 1.9rem + 1.75vw, 3rem);
  --font-size-5xl: clamp(3rem, 2.5rem + 2.5vw, 4rem);

  /* Rounded corners for cards */
  --radius-card: 1rem;
  --radius-button: 9999px; /* pill-shaped */

  /* Shadows */
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}
```

### Pattern 2: Next.js 15 Font Optimization with Geist
**What:** Use Next.js built-in Geist font with `next/font` optimization
**When to use:** Root layout for app-wide typography
**Example:**
```tsx
// app/layout.tsx
// Source: https://nextjs.org/docs/app/getting-started/fonts
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

// Geist Sans - default body font (variable font for optimal performance)
const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

// Geist Mono - for code/technical content
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
```

### Pattern 3: Lenis + GSAP ScrollTrigger Integration (The Critical 3-Line Bridge)
**What:** Synchronize Lenis smooth scroll with GSAP ScrollTrigger animations
**When to use:** Client component initialization (useEffect hook)
**Example:**
```tsx
// components/providers/SmoothScrollProvider.tsx
// Source: ~/.claude/skills/lenis-gsap-scroll/SKILL.md Section 3.1
'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import 'lenis/dist/lenis.css'

gsap.registerPlugin(ScrollTrigger)

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const lenis = new Lenis({
      lerp: prefersReducedMotion ? 1 : 0.1, // Instant scroll if reduced motion
      smoothWheel: !prefersReducedMotion,
    })

    // LINE 1: Tell ScrollTrigger about Lenis scroll position changes
    lenis.on('scroll', ScrollTrigger.update)

    // LINE 2: Drive Lenis from GSAP's ticker (GSAP uses seconds, Lenis needs ms)
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })

    // LINE 3: Prevent GSAP lag compensation from interfering with smooth scroll
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(lenis.raf)
    }
  }, [])

  return <>{children}</>
}
```

### Pattern 4: prefers-reduced-motion Hook (React)
**What:** Detect user's motion preference for accessibility
**When to use:** Any component with animations
**Example:**
```tsx
// lib/hooks/usePrefersReducedMotion.ts
// Source: https://www.joshwcomeau.com/react/prefers-reduced-motion/
'use client'

import { useState, useEffect } from 'react'

const QUERY = '(prefers-reduced-motion: no-preference)'

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true) // Default to disabled for SSR safety

  useEffect(() => {
    const mediaQueryList = window.matchMedia(QUERY)
    setPrefersReducedMotion(!mediaQueryList.matches)

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(!event.matches)
    }

    mediaQueryList.addEventListener('change', listener)
    return () => {
      mediaQueryList.removeEventListener('change', listener)
    }
  }, [])

  return prefersReducedMotion
}
```

### Pattern 5: Fluid Typography with Tailwind CSS v4
**What:** Responsive typography that scales smoothly between viewport sizes
**When to use:** Headings, body text, any text that needs viewport-aware scaling
**Example:**
```css
/* app/globals.css - Define in @theme */
@theme {
  /* Fluid scale using clamp(min, preferred, max) */
  --font-size-heading-xl: clamp(2.5rem, 2rem + 2.5vw, 4rem);
  --font-size-heading-lg: clamp(2rem, 1.5rem + 2vw, 3rem);
  --font-size-heading-md: clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem);
  --font-size-body: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
}
```

```tsx
// Usage in components
<h1 className="text-[--font-size-heading-xl]">Oversized Heading</h1>
<p className="text-[--font-size-body]">Readable body text</p>
```

### Pattern 6: PostCSS Configuration for Tailwind v4
**What:** Configure PostCSS to use Tailwind v4's new plugin
**When to use:** Always required for Next.js + Tailwind v4
**Example:**
```javascript
// postcss.config.mjs
// Source: https://tailwindcss.com/docs/installation/using-postcss
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### Anti-Patterns to Avoid
- **Don't use `tailwind.config.js` with v4:** The old JavaScript config file is deprecated. Use `@theme` directive in CSS instead.
- **Don't use `@tailwind base/components/utilities` directives:** In v4, use `@import "tailwindcss"` instead (single line).
- **Don't animate the pinned element itself in ScrollTrigger:** Animate its children to avoid conflicts with pinning logic.
- **Don't skip Lenis CSS import:** Features like `data-lenis-prevent` and `autoToggle` break without the required CSS.
- **Don't initialize animations in Server Components:** Always use `"use client"` and `useEffect` for browser APIs.
- **Don't forget the 3-line bridge:** Missing any line causes desync (animations don't fire), jank, or broken triggers.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Smooth scrolling | Custom RAF loop with lerp | Lenis (`new Lenis({ autoRaf: true })`) | Edge cases: nested scrollers, touch devices, iOS quirks, performance optimization |
| Scroll-linked animations | IntersectionObserver + manual progress | GSAP ScrollTrigger | Handles pinning, scrubbing, snapping, resize recalculation, performance batching |
| Fluid typography | Manual `calc()` with breakpoints | Tailwind v4 `clamp()` in `@theme` or plugins | Cross-browser consistency, readable syntax, automatic utility generation |
| Font optimization | Manual preload/font-face | Next.js `next/font` | Prevents layout shift, self-hosting, automatic subsetting, zero config |
| Reduced motion detection | Manual mediaQuery listeners | Hook pattern (see Pattern 4) | SSR safety, cleanup handling, reactive updates |
| Color palette management | Manual CSS variables | Tailwind v4 `@theme` directive | Automatic utility class generation, type-safe access, runtime CSS variables |

**Key insight:** Animation infrastructure is deceptively complex. Lenis handles 20+ edge cases (iOS scroll behavior, nested containers, iframe interactions). ScrollTrigger pre-calculates scroll positions and debounces resize events efficiently. Next.js font optimization prevents cumulative layout shift (CLS) automatically. Don't rebuild these—they're battle-tested with thousands of real-world projects.

## Common Pitfalls

### Pitfall 1: Tailwind v4 Plugin Mismatch
**What goes wrong:** Build errors like "Plugin not found" or styles not generating
**Why it happens:** Tailwind v4 moved the PostCSS plugin to a separate package `@tailwindcss/postcss`. The old `tailwindcss` plugin syntax doesn't work.
**How to avoid:**
- Install `@tailwindcss/postcss` explicitly
- Use `@tailwindcss/postcss` (not `tailwindcss`) in `postcss.config.mjs`
- Use `@import "tailwindcss"` (not `@tailwind` directives) in CSS
**Warning signs:** Console errors mentioning "postcss-import" or "unknown at-rule @tailwind"
**Source:** https://medium.com/@hardikkumarpro0005/fixing-next-js-15-and-tailwind-css-v4-build-issues-complete-solutions-guide-438b0665eabe

### Pitfall 2: Missing Lenis CSS Import
**What goes wrong:** Features like `data-lenis-prevent` don't work, stopped states break, smooth scroll feels inconsistent
**Why it happens:** Lenis requires specific CSS rules (`.lenis.lenis-smooth`, `.lenis.lenis-stopped`) that control scroll behavior and DOM state.
**How to avoid:** Always import `import 'lenis/dist/lenis.css'` in your client component or `globals.css`
**Warning signs:** Scroll doesn't stop when calling `lenis.stop()`, nested scrollers don't respect `data-lenis-prevent`
**Source:** ~/.claude/skills/lenis-gsap-scroll/SKILL.md Section 1.2

### Pitfall 3: Incomplete 3-Line Bridge (Lenis + ScrollTrigger Desync)
**What goes wrong:** Animations don't trigger, scroll feels janky, ScrollTrigger markers don't align with scroll position
**Why it happens:** Missing any of the 3 critical lines breaks synchronization:
  - Line 1: ScrollTrigger doesn't know scroll changed
  - Line 2: Lenis never updates (no smooth scrolling)
  - Line 3: GSAP lag compensation interferes
**How to avoid:** Copy the exact 3-line pattern (see Pattern 3), don't modify or skip lines
**Warning signs:** Animations fire at wrong positions, smooth scroll stutters, console logs show `lenis.scroll` ≠ `window.scrollY`
**Source:** ~/.claude/skills/lenis-gsap-scroll/SKILL.md Section 3.1

### Pitfall 4: Server Component Animation Initialization
**What goes wrong:** Runtime errors: "window is not defined", hydration mismatches, useEffect not recognized
**Why it happens:** Server Components render on the server where browser APIs (`window`, `document`) don't exist. Animation libraries require browser context.
**How to avoid:**
- Add `"use client"` directive at top of file
- Wrap animation code in `useEffect` hook
- Initialize in client components only
**Warning signs:** Next.js errors mentioning "server" or "hydration", animations work in dev but break in production
**Source:** https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/static-exports.mdx

### Pitfall 5: Ignoring prefers-reduced-motion
**What goes wrong:** Animations trigger vestibular motion disorders, poor accessibility scores, user complaints
**Why it happens:** Developers focus on "wow factor" and forget that 35% of users have motion sensitivity or prefer reduced motion for cognitive reasons.
**How to avoid:**
- Always check `window.matchMedia('(prefers-reduced-motion: reduce)').matches`
- Set `lerp: 1` (instant) in Lenis for reduced motion users
- Use CSS `@media (prefers-reduced-motion: reduce)` for pure CSS animations
- Default to animations disabled during SSR (see Pattern 4)
**Warning signs:** Accessibility audits fail, users report dizziness/nausea, WCAG 2.1 (2.3.3) violation
**Source:** https://www.joshwcomeau.com/react/prefers-reduced-motion/

### Pitfall 6: Next.js 15 Caching Assumptions
**What goes wrong:** Stale data appears, API routes return cached responses when they shouldn't
**Why it happens:** Next.js 15 changed caching defaults—GET Route Handlers are no longer cached by default (opposite of v14).
**How to avoid:**
- Understand new caching behavior: dynamic by default
- Use explicit cache controls when needed
- Don't assume v14 caching patterns carry over
**Warning signs:** Data fetching behavior differs from v14, unexpected "fresh" data in production
**Source:** https://prateeksha.com/blog/nextjs-15-upgrade-guide-app-router-caching-migration

### Pitfall 7: Animating Only `transform` and `opacity` (Performance)
**What goes wrong:** Janky animations, low FPS, especially on mobile devices
**Why it happens:** Animating properties like `top`, `left`, `width`, `height`, `margin` triggers layout recalculation (reflow) on every frame. Only `transform` and `opacity` can be GPU-accelerated.
**How to avoid:**
- ALWAYS animate `transform: translate()` instead of `top`/`left`
- Use `opacity` instead of `display` or `visibility` transitions
- Use `transform: scale()` instead of `width`/`height`
- Add `will-change: transform` sparingly (removes after animation if possible)
**Warning signs:** Animations feel sluggish, browser DevTools Performance shows "Layout" spikes
**Source:** ~/.claude/skills/lenis-gsap-scroll/SKILL.md Section 6.1

## Code Examples

Verified patterns from official sources:

### Complete Next.js 15 + Tailwind v4 Setup
```bash
# Source: https://medium.com/@nurmhm/how-to-set-up-a-modern-next-js-15-project-with-tailwind-css-v4-react-18-shadcn-ui-ec94f33bb651

# 1. Create Next.js 15 project
npx create-next-app@latest spark --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"

# 2. Install Tailwind CSS v4 (replace v3 if auto-installed)
npm install tailwindcss@next @tailwindcss/postcss

# 3. Install animation libraries
npm install lenis gsap @gsap/react
```

```javascript
// postcss.config.mjs
// Source: https://tailwindcss.com/docs/installation/using-postcss
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

```css
/* app/globals.css */
/* Source: https://tailwindcss.com/blog/tailwindcss-v4 */
@import "tailwindcss";

@theme {
  /* Color palette */
  --color-burnt-orange: #C4501E;
  --color-burnt-orange-hover: #A8431A;
  --color-amber: #D97706;
  --color-teal: #0F766E;

  /* Stone neutrals */
  --color-stone-950: #0C0A09;
  --color-stone-900: #1C1917;
  --color-stone-800: #292524;
  --color-stone-700: #44403C;
  --color-stone-600: #57534E;
  --color-stone-500: #78716C;
  --color-stone-400: #A8A29E;
  --color-stone-300: #D6D3D1;
  --color-stone-200: #E7E5E4;
  --color-stone-100: #F5F5F4;
  --color-stone-50: #FAFAF9;

  /* Fluid typography */
  --font-size-5xl: clamp(3rem, 2.5rem + 2.5vw, 4rem);
  --font-size-4xl: clamp(2.25rem, 1.9rem + 1.75vw, 3rem);
  --font-size-3xl: clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem);
  --font-size-2xl: clamp(1.5rem, 1.3rem + 1vw, 2rem);
  --font-size-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --font-size-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  --font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);

  /* Border radius */
  --radius-card: 1rem;
  --radius-button: 9999px;
}
```

```tsx
// app/layout.tsx
// Source: https://nextjs.org/docs/app/getting-started/fonts
import { Geist, Geist_Mono } from 'next/font/google'
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
```

### Lenis + GSAP ScrollTrigger Client Component
```tsx
// components/providers/SmoothScrollProvider.tsx
// Source: ~/.claude/skills/lenis-gsap-scroll/SKILL.md
'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import 'lenis/dist/lenis.css'

gsap.registerPlugin(ScrollTrigger)

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const lenis = new Lenis({
      lerp: prefersReducedMotion ? 1 : 0.1,
      smoothWheel: !prefersReducedMotion,
    })

    // THE CRITICAL 3-LINE BRIDGE
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => { lenis.raf(time * 1000) })
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(lenis.raf)
    }
  }, [])

  return <>{children}</>
}
```

### Simple ScrollTrigger Animation Example
```tsx
// components/FadeInSection.tsx
// Source: ~/.claude/skills/lenis-gsap-scroll/SKILL.md Section 5.1
'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'

gsap.registerPlugin(ScrollTrigger)

export default function FadeInSection({ children }: { children: React.ReactNode }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (!sectionRef.current || prefersReducedMotion) return

    gsap.from(sectionRef.current, {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
      y: 60,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
    })
  }, [prefersReducedMotion])

  return <div ref={sectionRef}>{children}</div>
}
```

### Pill-Shaped CTA Button Component
```tsx
// components/ui/Button.tsx
// Source: Tailwind CSS v4 + Square design reference
export default function Button({
  children,
  variant = 'primary',
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}) {
  const baseClasses = 'px-6 py-3 rounded-[--radius-button] font-medium transition-colors duration-200'
  const variantClasses = {
    primary: 'bg-[--color-burnt-orange] hover:bg-[--color-burnt-orange-hover] text-white',
    secondary: 'bg-[--color-teal] hover:bg-[--color-teal]/90 text-white',
  }

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  )
}
```

### Rounded Card Component
```tsx
// components/ui/Card.tsx
// Source: Tailwind CSS v4 design tokens
export default function Card({
  children,
  dark = false,
}: {
  children: React.ReactNode
  dark?: boolean
}) {
  return (
    <div
      className={`
        rounded-[--radius-card]
        border border-stone-200 dark:border-stone-800
        shadow-[--shadow-card]
        p-6
        ${dark ? 'bg-stone-900' : 'bg-white'}
      `}
    >
      {children}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 with `tailwind.config.js` | Tailwind v4 with `@theme` directive in CSS | December 2024 (v4.0 release) | 3-10x faster builds, design tokens as CSS variables, no separate config file |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` (single line) | Tailwind v4 | Simpler setup, one import replaces three directives |
| Lenis `scrollerProxy` pattern | 3-line bridge (ticker integration) | Lenis 1.1+ | More reliable, simpler, better performance |
| Next.js custom font loading | `next/font` built-in optimization | Next.js 13+ (stable in 15) | Zero-config self-hosting, automatic CLS prevention |
| Manual `prefers-reduced-motion` checks | Hook pattern with SSR safety | React 18+ best practice | Prevents hydration errors, reactive updates |
| Next.js Pages Router | Next.js App Router | Next.js 13+ (default in 15) | React Server Components, streaming, nested layouts |
| GSAP paid license | GSAP fully free (commercial use) | Webflow acquisition 2024 | No licensing concerns for ScrollTrigger |

**Deprecated/outdated:**
- **Tailwind v3 PostCSS plugin syntax:** Use `@tailwindcss/postcss` package, not `tailwindcss` in plugins array
- **`@tailwind` directives:** Replaced by `@import "tailwindcss"` in v4
- **Lenis `scrollerProxy`:** Still works but 3-line bridge is cleaner and officially recommended
- **Next.js Pages Router for new projects:** App Router is the default and recommended path in Next.js 15

## Open Questions

Things that couldn't be fully resolved:

1. **Tailwind CSS v4 Plugin Ecosystem Maturity**
   - What we know: v4 is stable (released Dec 2024), but third-party plugins may not all support CSS-first config yet
   - What's unclear: Whether plugins like `@tailwindcss/forms` or `@tailwindcss/typography` have v4-compatible versions
   - Recommendation: Check plugin compatibility before installation, may need to use v4-alpha versions or wait for updates. For Phase 1, we don't need these plugins (custom design system).

2. **Geist Font Licensing for Self-Hosting**
   - What we know: Geist is "free and open sourced under the SIL Open Font License" (Source: https://www.npmjs.com/package/geist)
   - What's unclear: Exact hosting requirements if self-hosting outside Next.js context
   - Recommendation: Use via `next/font` as intended—Next.js handles hosting automatically. No action needed.

3. **Next.js 15 Production Build Performance vs v14**
   - What we know: Community reports (GitHub discussions) suggest App Router may be 2.5x slower than Pages Router in some scenarios
   - What's unclear: Whether this affects all project types or specific patterns (data fetching, streaming, etc.)
   - Recommendation: Proceed with App Router as planned (it's the standard), benchmark in Phase 3-4 if performance concerns arise. Likely not an issue for marketing sites.

## Sources

### Primary (HIGH confidence)
- **Context7:** `/vercel/next.js` - Next.js 15 setup, client components, font optimization
- **Context7:** `/websites/tailwindcss` - Tailwind CSS v4 @theme directive, custom colors
- **Skill:** `~/.claude/skills/lenis-gsap-scroll/SKILL.md` - Lenis + GSAP integration, 3-line bridge, required CSS
- **Official:** [Tailwind CSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4) - CSS-first config, installation, @theme directive
- **Official:** [Next.js Font Optimization Docs](https://nextjs.org/docs/app/getting-started/fonts) - next/font, Geist usage, variable fonts
- **Official:** [Josh W. Comeau - prefers-reduced-motion](https://www.joshwcomeau.com/react/prefers-reduced-motion/) - React hook pattern, SSR safety, accessibility

### Secondary (MEDIUM confidence)
- [Tailwind CSS v4 Migration Guide (Medium)](https://medium.com/@oumuamuaa/transitioning-from-tailwind-config-js-to-css-first-in-tailwind-css-v4-4afb3bfca4ee) - CSS-first transition patterns
- [Next.js 15 + Tailwind v4 Setup (Medium)](https://medium.com/@nurmhm/how-to-set-up-a-modern-next-js-15-project-with-tailwind-css-v4-react-18-shadcn-ui-ec94f33bb651) - Complete setup walkthrough
- [Tailwind CSS v4 Build Issues Fix (Medium)](https://medium.com/@hardikkumarpro0005/fixing-next-js-15-and-tailwind-css-v4-build-issues-complete-solutions-guide-438b0665eabe) - PostCSS plugin troubleshooting
- [Next.js 15 Upgrade Guide](https://prateeksha.com/blog/nextjs-15-upgrade-guide-app-router-caching-migration) - Caching changes, gotchas
- [Peerlist - Geist Font in Next.js](https://peerlist.io/blog/engineering/how-to-use-vercel-geist-font-in-nextjs) - Font implementation details
- [DevDreaming - Lenis + GSAP in Next.js](https://devdreaming.com/blogs/nextjs-smooth-scrolling-with-lenis-gsap) - Practical implementation guide
- [Fluid Typography with Tailwind (Hoverify)](https://tryhoverify.com/blog/fluid-typography-tricks-scaling-text-seamlessly-across-devices-with-tailwind-and-css-clamp/) - clamp() patterns

### Tertiary (LOW confidence - not used for primary recommendations)
- GSAP Forums discussions - patterns validated against official docs
- GitHub issue threads - used to identify common pitfalls only

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH - All libraries verified via Context7, official docs, or established usage (Lenis by Rockstar Games, GSAP free license confirmed)
- **Architecture patterns:** HIGH - Patterns sourced from official documentation (Tailwind v4 blog, Next.js docs) and verified skill reference (Lenis+GSAP)
- **Pitfalls:** HIGH - Based on official migration guides, Josh W. Comeau's SSR pattern (widely cited), and skill reference warnings
- **Fluid typography:** MEDIUM - clamp() approach is standard but specific scale values not officially documented by Tailwind (community best practice)
- **Next.js 15 performance:** LOW - Community reports vary, not officially documented as issue

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days - stable ecosystem, minor updates expected)

**Key dependencies verified:**
- Tailwind CSS v4.0+ stable (released Dec 2024)
- Next.js 15 stable and current
- Lenis 1.3.15 stable
- GSAP 3.14.x stable, free for commercial use
- Geist font built into Next.js 15 by default
