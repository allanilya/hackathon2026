# Phase 2: Navigation & Hero - Research

**Researched:** 2026-02-07
**Domain:** React navigation patterns, GSAP animations, smooth scroll integration
**Confidence:** HIGH

## Summary

Phase 2 implements a premium sticky navigation bar with smooth scrolling and a compelling hero section. The research confirms that the established tech stack (Lenis + GSAP ScrollTrigger + Next.js 15 App Router) follows current 2026 best practices for performant, accessible animations.

Key findings indicate that sticky navbar implementation requires client-side scroll listeners with proper cleanup, mobile hamburger menus must follow strict accessibility guidelines (ARIA labels, focus management), and GSAP animations must respect prefers-reduced-motion for vestibular disorder accessibility. The Lenis library provides built-in anchor link support that pairs seamlessly with GSAP ScrollTrigger when configured correctly.

Critical for this phase: all animations must be client-side only (with "use client" directive), ScrollTriggers must be cleaned up on component unmount to prevent memory leaks, and the navbar background transition should use CSS transitions with JavaScript class toggling rather than heavy animation libraries.

**Primary recommendation:** Use client component with useState/useEffect for scroll state, implement accessibility-first hamburger menu with proper ARIA attributes, leverage Lenis anchors config for smooth section scrolling, and wrap GSAP animations in gsap.matchMedia() for reduced motion support.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @gsap/react | 2.1+ | GSAP React integration | Provides useGSAP hook for proper React lifecycle integration, prevents memory leaks |
| gsap | 3.12+ | Animation engine | Industry standard for performant animations, ScrollTrigger plugin integrates with Lenis |
| lenis | 1.3.17+ | Smooth scroll library | Lightweight, performant, built-in anchor link support, designed for GSAP integration |
| Next.js | 15+ | Framework | App Router provides server/client component separation, React 19 support |
| React | 19+ | UI library | Latest hooks API, improved performance, concurrent rendering |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | 4.x | Styling framework | Already established in Phase 1, use @theme directive for design tokens |
| TypeScript | 5.x | Type safety | Established in Phase 1, continue for components and hooks |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Lenis | Locomotive Scroll v5 | More features but heavier bundle, Lenis is lighter and sufficient |
| GSAP ScrollTrigger | Framer Motion | Framer Motion is great for component animations but ScrollTrigger better for scroll-linked effects |
| useState scroll tracking | Intersection Observer | IO better for element visibility, scroll state needs actual scroll position |

**Installation:**
```bash
# All dependencies already installed in Phase 1
# No additional packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── layout.tsx          # Root layout (server component)
│   └── page.tsx            # Homepage (server component)
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx      # Client component - navigation
│   │   └── MobileMenu.tsx  # Client component - hamburger menu
│   └── sections/
│       └── Hero.tsx        # Client component - hero section
└── hooks/
    └── useScrollPosition.ts # Custom hook for scroll tracking
```

### Pattern 1: Sticky Navbar with Scroll State
**What:** Client component that tracks scroll position and toggles navbar background
**When to use:** Any sticky navigation that changes appearance on scroll
**Example:**
```typescript
// Source: Multiple dev.to articles + Next.js 15 best practices
'use client'

import { useState, useEffect } from 'react'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    // Add listener
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Initial check
    handleScroll()

    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-surface/95 backdrop-blur-sm shadow-md' : 'bg-transparent'
    }`}>
      {/* Nav content */}
    </nav>
  )
}
```

### Pattern 2: Lenis Anchor Links Integration
**What:** Configure Lenis to handle smooth scrolling to page sections
**When to use:** Navigation links that scroll to sections on same page
**Example:**
```typescript
// Source: https://github.com/darkroomengineering/lenis
// In Lenis provider setup (from Phase 1)
new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
  anchors: true  // Enable anchor link support
})

// In Navbar component
<a href="#features" onClick={(e) => {
  e.preventDefault()
  lenis?.scrollTo('#features')
}}>
  Features
</a>
```

### Pattern 3: Accessible Hamburger Menu
**What:** Mobile menu with proper ARIA attributes and focus management
**When to use:** Responsive navigation requiring collapsed mobile view
**Example:**
```typescript
// Source: MDN ARIA menu role docs
'use client'

import { useState, useRef, useEffect } from 'react'

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLUListElement>(null)

  // Focus first item when menu opens
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstItem = menuRef.current.querySelector('a')
      firstItem?.focus()
    }
  }, [isOpen])

  return (
    <>
      <button
        aria-label="Main menu"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden"
      >
        {/* Hamburger icon - hide from screen readers */}
        <svg aria-hidden="true">
          {/* Icon paths */}
        </svg>
      </button>

      <nav
        id="mobile-menu"
        aria-labelledby="menu-button"
        className={isOpen ? 'block' : 'hidden'}
      >
        <ul ref={menuRef} role="menu">
          <li role="presentation">
            <a role="menuitem" href="#features">Features</a>
          </li>
        </ul>
      </nav>
    </>
  )
}
```

### Pattern 4: Hero Fade-In Animation with Reduced Motion Support
**What:** GSAP animation that respects user motion preferences
**When to use:** Any entrance animation on page load
**Example:**
```typescript
// Source: https://gsap.com/resources/a11y/ + GSAP docs
'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()

    // Full animation for users with no motion preference
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(heroRef.current, {
        autoAlpha: 0,  // Use autoAlpha instead of opacity
        y: 30,
        duration: 1,
        ease: "power2.out"
      })
    })

    // Simplified for reduced motion users
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.from(heroRef.current, {
        autoAlpha: 0,  // Only fade, no movement
        duration: 0.3,
        ease: "none"
      })
    })

    return () => mm.revert()  // Cleanup
  }, { scope: heroRef })

  return (
    <section ref={heroRef} className="min-h-screen">
      {/* Hero content */}
    </section>
  )
}
```

### Pattern 5: Fluid Typography for Hero Headlines
**What:** CSS clamp() for responsive text sizing with accessibility
**When to use:** Large display text that needs to scale smoothly
**Example:**
```css
/* Source: https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/ */
/* In Tailwind v4 @theme or component CSS */

.hero-headline {
  /* Mix viewport and rem units for zoom accessibility */
  font-size: clamp(2rem, 4vw + 1rem, 4rem);
  /*
    32px minimum (2rem)
    64px maximum (4rem)
    Scales fluidly between
    Responds to user zoom via rem units
  */
}

/* Alternative: Define in @theme for reusable utility */
@theme {
  --font-size-hero: clamp(2rem, 4vw + 1rem, 4rem);
  --font-size-hero-sub: clamp(1rem, 2vw + 0.5rem, 1.5rem);
}
```

### Anti-Patterns to Avoid
- **Animating LCP elements on load:** Don't fade-in hero images/main content—delays Largest Contentful Paint metric
- **Multiple ScrollTriggers in timeline tweens:** Logically impossible—timeline controls playhead AND scroll position can't both control it
- **Hard-coded scroll trigger start/end values:** Use function-based values for responsive layouts
- **Missing ScrollTrigger cleanup:** Causes memory leaks in Next.js App Router page transitions
- **Using only vw units in clamp():** Breaks zoom accessibility—always mix with rem units
- **role="menu" for site navigation:** Only use for application menus—site nav should use semantic `<nav>` and list of links
- **Forgetting passive: true on scroll listeners:** Hurts scroll performance

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Smooth scrolling to anchors | Custom scroll animation logic | Lenis anchors: true config + scrollTo() method | Handles edge cases: scroll interruption, hash updates, momentum, works with ScrollTrigger |
| Scroll position tracking | Manual scroll event with debouncing | useState + useEffect with passive listener | Well-established pattern, cleanup built-in, passive listener for performance |
| Reduced motion detection | Reading media query manually | gsap.matchMedia() with prefers-reduced-motion | Automatic cleanup, pairs with animations, handles query changes |
| Hamburger menu animation | Custom CSS transitions | CSS transform with transition classes | Hardware accelerated, simple, works everywhere |
| Focus management | Manual focus() calls | useRef + useEffect pattern | React-idiomatic, handles timing issues, proper cleanup |

**Key insight:** Animation and scroll interactions have many edge cases (cleanup, memory leaks, accessibility, performance). Use established libraries and patterns rather than custom implementations.

## Common Pitfalls

### Pitfall 1: ScrollTrigger Memory Leaks in App Router
**What goes wrong:** Navigating between pages creates new GSAP instances without cleaning up old ScrollTriggers, causing lag and memory leaks
**Why it happens:** Next.js App Router doesn't fully unmount components on navigation, and ScrollTrigger doesn't auto-cleanup
**How to avoid:**
- Use useGSAP hook's cleanup return function
- Call ScrollTrigger.refresh() after all animations initialized
- Kill ScrollTriggers explicitly in cleanup: `return () => mm.revert()`
**Warning signs:** Animations lag after page transitions, DevTools shows increasing memory usage, ScrollTrigger console warnings

### Pitfall 2: Server Component Trying to Use Window
**What goes wrong:** "ReferenceError: window is not defined" when using scroll listeners
**Why it happens:** Next.js App Router defaults to server components, window only exists client-side
**How to avoid:** Add "use client" directive at top of any component using window, document, or browser APIs
**Warning signs:** Build errors mentioning window/document, hydration mismatches

### Pitfall 3: Navbar Background Flicker on Hydration
**What goes wrong:** Navbar flashes with wrong background state before JavaScript loads
**Why it happens:** Initial scroll state doesn't match server-rendered HTML
**How to avoid:**
- Set initial state conservatively (assume not scrolled)
- Add suppressHydrationWarning if initial state must differ
- Or use CSS-only solution with scroll() timeline for no-JS fallback
**Warning signs:** Visual flash on page load, console hydration warnings

### Pitfall 4: Hamburger Menu Not Keyboard Accessible
**What goes wrong:** Menu works with mouse but not keyboard, screen readers can't navigate
**Why it happens:** Missing ARIA attributes, no focus management, keyboard event handlers
**How to avoid:**
- Add aria-expanded, aria-controls, aria-label to button
- Use role="menu" and role="menuitem" properly (or skip for simple nav)
- Focus first item when menu opens
- Handle Escape key to close menu
**Warning signs:** Tab doesn't reach menu items, screen reader says "button" with no context

### Pitfall 5: Vestibular Triggers in Animations
**What goes wrong:** Users report dizziness, nausea from large sweeping animations
**Why it happens:** Large X/Y axis movements, scaling, rotation triggers vestibular disorders (affects 70+ million people)
**How to avoid:**
- Always check prefers-reduced-motion
- Reduce/remove large movements for reduced motion users
- Prefer fade, small movements over scale/rotation
- Test with "Reduce motion" enabled in OS settings
**Warning signs:** User complaints, large scale/rotate values, no reduced motion handling

### Pitfall 6: Lenis Blocking Anchor Links
**What goes wrong:** Clicking nav links doesn't scroll to sections
**Why it happens:** Lenis prevents default anchor behavior without anchors: true config
**How to avoid:**
- Set anchors: true in Lenis config
- Or manually call lenis.scrollTo('#section-id') in onClick handlers
- Use lenis instance from context/provider
**Warning signs:** Links update URL hash but don't scroll, clicks do nothing

### Pitfall 7: Hard-Coded Scroll Values Breaking Responsive
**What goes wrong:** ScrollTrigger start/end positions wrong on different screen sizes
**Why it happens:** Used pixel values instead of function-based values
**How to avoid:**
- Use function-based values: `end: () => `+=${elem.offsetHeight}``
- Set invalidateOnRefresh: true on ScrollTrigger
- Call ScrollTrigger.refresh() after layout changes
**Warning signs:** Animations trigger at wrong scroll positions on mobile/tablet

## Code Examples

Verified patterns from official sources:

### Custom Hook: useScrollPosition
```typescript
// Source: Community pattern from multiple Next.js 15 articles
'use client'

import { useState, useEffect } from 'react'

export function useScrollPosition() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 0
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }

    // Passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrolled])

  return scrolled
}
```

### Email Input with Validation (Placeholder Only)
```typescript
// Source: shadcn/ui patterns + React 19 best practices
'use client'

import { useState } from 'react'

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    // Placeholder - no actual submission in this phase
    console.log('Waitlist email:', email)
    setEmail('')
    setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          setError('')
        }}
        placeholder="Enter your email"
        className="px-4 py-2 rounded-lg border"
        aria-label="Email address"
        aria-invalid={!!error}
        aria-describedby={error ? 'email-error' : undefined}
      />
      <button type="submit" className="button-primary">
        Join Waitlist
      </button>
      {error && (
        <span id="email-error" className="text-red-500 text-sm" role="alert">
          {error}
        </span>
      )}
    </form>
  )
}
```

### Scroll-Based Fade-In for Content Sections
```typescript
// Source: GSAP ScrollTrigger docs + Next.js examples
'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function FadeInSection({ children }: { children: React.ReactNode }) {
  const sectionRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(sectionRef.current, {
        autoAlpha: 0,
        y: 50,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",  // Start when element is 85% from top
          end: "top 60%",
          toggleActions: "play none none reverse",
          once: true  // Only animate once
        }
      })
    })

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.from(sectionRef.current, {
        autoAlpha: 0,
        duration: 0.2,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
          once: true
        }
      })
    })

    return () => mm.revert()
  }, { scope: sectionRef })

  return (
    <div ref={sectionRef}>
      {children}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind config.js | @theme directive in CSS | Tailwind v4 (2024) | CSS-first configuration, no JS config file needed |
| Framer Motion for scroll | GSAP ScrollTrigger + Lenis | 2023-2024 | Better performance, more control, smoother scroll |
| role="menu" for nav | Semantic `<nav>` with links | ARIA spec clarification | Simpler, more accessible for site navigation |
| opacity animation | autoAlpha property | GSAP best practice | Better performance, handles visibility automatically |
| React 18 hooks | React 19 hooks | React 19 (2024) | Same API, better concurrent rendering |
| @studio-freight/lenis | lenis package | 2024 rename | New package name, same functionality |

**Deprecated/outdated:**
- Using scroll event without passive: true flag - hurts performance
- Hard-coding ScrollTrigger values - breaks responsive
- Skipping reduced motion checks - accessibility failure
- Using window in server components - causes errors in Next.js 15

## Open Questions

Things that couldn't be fully resolved:

1. **Mobile menu slide-out animation approach**
   - What we know: CSS transforms are performant, Framer Motion provides good DX
   - What's unclear: Whether to use pure CSS or add Framer Motion for this phase
   - Recommendation: Start with CSS transforms + Tailwind transitions (already in stack), only add Framer Motion if complex choreography needed later

2. **Optimal debounce timing for scroll listener**
   - What we know: Passive listeners improve performance significantly
   - What's unclear: Whether additional debouncing/throttling needed for this use case
   - Recommendation: Start without debounce since we're only toggling a boolean state; add throttling if performance issues arise

3. **Hero image/visual loading strategy**
   - What we know: Don't animate LCP elements
   - What's unclear: Exact visual specified ("PowerPoint sidebar mockup or abstract product visual")
   - Recommendation: Use Next.js Image component with priority flag, no fade-in animation to preserve LCP

## Sources

### Primary (HIGH confidence)
- GSAP ScrollTrigger Tips & Mistakes - https://gsap.com/resources/st-mistakes/
- GSAP Accessible Animation Guide - https://gsap.com/resources/a11y/
- Lenis GitHub Repository - https://github.com/darkroomengineering/lenis
- MDN ARIA Menu Role - https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/menu_role
- Smashing Magazine Fluid Typography - https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/
- Next.js 15 Documentation - https://nextjs.org/docs/app/getting-started/server-and-client-components

### Secondary (MEDIUM confidence)
- Medium: Optimizing GSAP Animations in Next.js 15 - https://medium.com/@thomasaugot/optimizing-gsap-animations-in-next-js-15-best-practices-for-initialization-and-cleanup-2ebaba7d0232
- Medium: Guide to using GSAP ScrollTrigger in Next.js - https://medium.com/@ccjayanti/guide-to-using-gsap-scrolltrigger-in-next-js-with-usegsap-c48d6011f04a
- DEV.to: Next.js 15 Scroll Behavior Guide - https://dev.to/hijazi313/nextjs-15-scroll-behavior-a-comprehensive-guide-387j
- Tailwind CSS v4 Documentation - https://tailwindcss.com/docs/theme

### Tertiary (LOW confidence)
- Various dev.to articles on sticky navbar patterns (2020-2024)
- shadcn/ui hero section examples (design reference only)
- Community CodePen examples for menu animations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified with official docs, versions confirmed
- Architecture: HIGH - Patterns from official GSAP/Next.js docs and established community practices
- Pitfalls: HIGH - Based on official GSAP mistakes guide and Next.js GitHub issues
- Code examples: HIGH - Sourced from official documentation and verified patterns
- Accessibility: HIGH - MDN and GSAP official accessibility guides

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days - stack is stable, patterns are established)

**Notes:**
- Phase 1 foundation already provides Lenis, GSAP, and Tailwind v4 setup
- No additional package installations required
- All patterns follow React 19 + Next.js 15 App Router conventions
- Accessibility is critical for this phase - ARIA labels and reduced motion are requirements, not nice-to-haves
