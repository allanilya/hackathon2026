---
name: lenis-gsap-scroll
description: Comprehensive reference for building scroll-animated websites using Lenis smooth scroll (v1.3.x) and GSAP ScrollTrigger (v3.14.x). Use this skill whenever the user asks for smooth scrolling, scroll-triggered animations, parallax effects, pinned sections, scroll-linked timelines, snap scrolling, horizontal scroll, or any immersive scroll-driven web experience. Covers full API for both libraries, all setup patterns (vanilla JS, React, Vue, Next.js), integration between them, and common scroll animation recipes.
---

# Lenis + GSAP ScrollTrigger — Complete Reference

This skill covers two libraries that work together to create scroll-animated websites:
- **Lenis** handles smooth scrolling (intercepting native scroll and applying lerp/easing)
- **GSAP ScrollTrigger** handles scroll-linked animations (triggering, scrubbing, pinning, snapping based on scroll position)

They are independent but best used together. Lenis smooths the scroll input; ScrollTrigger animates based on scroll position.

---

## TABLE OF CONTENTS

1. Lenis — Full API
2. GSAP ScrollTrigger — Full API
3. Integration: Lenis + ScrollTrigger
4. Framework Setup (React, Vue, Next.js)
5. Scroll Animation Recipes
6. Performance & Troubleshooting

---

# 1. LENIS — FULL API (v1.3.15)

Lenis ("smooth" in Latin) is a lightweight, performant smooth scroll library by darkroom.engineering.
MIT licensed. 12.6k+ GitHub stars. Used by Rockstar Games (GTA VI), Microsoft Design, Shopify, Metamask.

## 1.1 Installation

```bash
npm i lenis       # or yarn add lenis / pnpm add lenis
```

CDN:
```html
<script src="https://unpkg.com/lenis@1.3.15/dist/lenis.min.js"></script>
```

ESM import:
```js
import Lenis from 'lenis'
```

## 1.2 Required CSS

Without these styles, features like `data-lenis-prevent`, `autoToggle`, and stopped states break.

Import in JS:
```js
import 'lenis/dist/lenis.css'
```

Or link:
```html
<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.15/dist/lenis.css">
```

Or add manually:
```css
html.lenis, html.lenis body {
  height: auto;
}
.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}
.lenis.lenis-smooth [data-lenis-prevent] {
  overscroll-behavior: contain;
}
.lenis.lenis-stopped {
  overflow: hidden;
}
.lenis.lenis-smooth iframe {
  pointer-events: none;
}
```

## 1.3 Setup Patterns

### Basic (autoRaf — simplest, no external animation library):
```js
const lenis = new Lenis({ autoRaf: true })

lenis.on('scroll', (e) => {
  console.log(e)
})
```

### Custom RAF loop (manual control):
```js
const lenis = new Lenis()

function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)
```

### GSAP ticker (recommended when using GSAP):
```js
const lenis = new Lenis()

lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => {
  lenis.raf(time * 1000) // GSAP gives seconds, Lenis needs ms
})
gsap.ticker.lagSmoothing(0)
```

## 1.4 Constructor Options — Complete

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `wrapper` | `HTMLElement \| Window` | `window` | Scroll container element |
| `content` | `HTMLElement` | `document.documentElement` | Scrolled content element, usually wrapper's direct child |
| `eventsTarget` | `HTMLElement \| Window` | `wrapper` | Element listening to wheel/touch events |
| `smoothWheel` | `boolean` | `true` | Smooth scroll from wheel events |
| `lerp` | `number` | `0.1` | Linear interpolation intensity (0–1). Higher = snappier, lower = smoother. **When set, `duration` and `easing` are ignored** |
| `duration` | `number` | `1.2` | Scroll animation duration in seconds. **Only used when `lerp` is NOT set** |
| `easing` | `function` | `(t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))` | Easing function. **Only used when `lerp` is NOT set**. Pick from easings.net |
| `orientation` | `string` | `'vertical'` | `'vertical'` or `'horizontal'` |
| `gestureOrientation` | `string` | `'vertical'` | `'vertical'`, `'horizontal'`, or `'both'` |
| `syncTouch` | `boolean` | `false` | Sync touch scroll (can be unstable on iOS < 16) |
| `syncTouchLerp` | `number` | `0.075` | Lerp during syncTouch inertia |
| `touchInertiaExponent` | `number` | `1.7` | Strength of syncTouch inertia |
| `wheelMultiplier` | `number` | `1` | Multiplier for wheel events |
| `touchMultiplier` | `number` | `1` | Multiplier for touch events |
| `infinite` | `boolean` | `false` | Infinite scrolling. Requires `syncTouch: true` on touch devices |
| `autoResize` | `boolean` | `true` | Auto-resize via ResizeObserver. If false, call `.resize()` manually |
| `prevent` | `function` | `undefined` | Return `true` to prevent smoothing on traversed elements. Example: `(node) => node.classList.contains('modal')` |
| `virtualScroll` | `function` | `undefined` | Modify/filter events before consumption. Return `false` to skip smoothing. Examples: `(e) => { e.deltaY /= 2 }` to halve speed, `({ event }) => !event.shiftKey` to skip when shift held |
| `overscroll` | `boolean` | `true` | Like CSS `overscroll-behavior` |
| `autoRaf` | `boolean` | `false` | Auto requestAnimationFrame loop |
| `anchors` | `boolean \| ScrollToOptions` | `false` | Smooth scroll to anchor links on click. Pass `true` for defaults or options `{ offset, onComplete }` |
| `autoToggle` | `boolean` | `false` | Auto start/stop based on wrapper overflow. Needs Lenis CSS. Safari >17.3, Chrome >116, Firefox >128 |
| `allowNestedScroll` | `boolean` | `false` | Allow nested scroll. Use with caution — prefer `prevent` or `data-lenis-prevent` |

### lerp vs duration — choosing:
- `lerp` (default 0.1): Exponential decay. Scroll feels "alive" — fast scrolls decelerate smoothly. Most common choice.
- `duration` + `easing`: Fixed-time animation. Predictable timing. Good for snappy, controlled feel.
- They are mutually exclusive. If `lerp` is defined, `duration` and `easing` are ignored.

## 1.5 Instance Properties

| Property | Type | Description |
|----------|------|-------------|
| `animatedScroll` | `number` | Current animated scroll position |
| `actualScroll` | `number` | Browser's native scroll position |
| `targetScroll` | `number` | Where scroll is heading |
| `velocity` | `number` | Current scroll velocity |
| `lastVelocity` | `number` | Previous frame velocity |
| `direction` | `number` | `1` scrolling down/right, `-1` scrolling up/left |
| `time` | `number` | Elapsed time since instance creation |
| `isScrolling` | `boolean \| string` | `'smooth'`, `'native'`, or `false` |
| `isStopped` | `boolean` | Whether scrolling is paused |
| `isHorizontal` | `boolean` | Whether orientation is horizontal |
| `limit` | `number` | Maximum scroll value |
| `progress` | `number` | Scroll progress 0–1 |
| `scroll` | `number` | Current scroll (handles infinite mode) |
| `rootElement` | `HTMLElement` | Element Lenis is instanced on |
| `className` | `string` | rootElement className |

## 1.6 Methods

### raf(time)
Must be called every frame unless `autoRaf: true`. Time in milliseconds.
```js
function loop(time) {
  lenis.raf(time)
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
```

### scrollTo(target, options?)
Programmatic scroll to a target.

**Target types:**
- `number` — pixel value: `lenis.scrollTo(500)`
- `string` — CSS selector or keyword: `'#section'`, `'top'`, `'bottom'`, `'left'`, `'right'`, `'start'`, `'end'`
- `HTMLElement` — DOM element reference

**Options:**
```js
lenis.scrollTo('#features', {
  offset: -100,         // like scroll-padding-top (pixels)
  lerp: 0.1,            // override instance lerp
  duration: 2,          // override (seconds), ignored if lerp set
  easing: (t) => t,     // override easing
  immediate: false,     // true = jump instantly, skip animation
  lock: false,          // true = prevent user scroll until reached
  force: false,         // true = scroll even if instance is stopped
  onComplete: () => {}, // fires when target reached
  userData: {}          // passed through scroll events
})
```

### on(event, callback)
```js
lenis.on('scroll', (lenis) => {
  // lenis.scroll, lenis.velocity, lenis.direction, lenis.progress
})

lenis.on('virtual-scroll', ({ deltaX, deltaY, event }) => {
  // raw scroll input before smoothing
})
```

### stop() / start()
Pause and resume scrolling.
```js
// Modal open
lenis.stop()
// Modal close
lenis.start()
```

### resize()
Recompute internal sizes. Only needed if `autoResize: false`.

### destroy()
Destroys the instance and removes all event listeners.

## 1.7 HTML Data Attributes

```html
<!-- Prevent smooth scroll entirely on this element -->
<div data-lenis-prevent>scrollable modal</div>

<!-- Prevent wheel events only -->
<div data-lenis-prevent-wheel>...</div>

<!-- Prevent touch events only -->
<div data-lenis-prevent-touch>...</div>
```

## 1.8 Packages

| Package | Import | Purpose |
|---------|--------|---------|
| `lenis` | `import Lenis from 'lenis'` | Core (vanilla JS) |
| `lenis/react` | `import { ReactLenis, useLenis } from 'lenis/react'` | React wrapper |
| `lenis/vue` | `import { VueLenis, useLenis } from 'lenis/vue'` | Vue wrapper |
| `lenis/nuxt` | module in `nuxt.config.js` | Nuxt module |
| `lenis/snap` | separate package | Snap-to-section (replaces CSS scroll-snap) |

## 1.9 Limitations

- No CSS scroll-snap support — use `lenis/snap`
- Safari capped at 60fps (30fps low power mode)
- Smooth scroll stops over iframes (they don't forward wheel events)
- `position: fixed` may lag on pre-M1 MacOS Safari
- `syncTouch` unstable on iOS < 16
- Nested scroll containers need `data-lenis-prevent` or `prevent` option

---

# 2. GSAP SCROLLTRIGGER — FULL API (v3.14.x)

GSAP ScrollTrigger links animations to scroll position. It does NOT handle smooth scrolling itself — that's Lenis's job.

## 2.1 Installation

```bash
npm i gsap
```

```js
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)
```

CDN:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
```

Note: Since Webflow acquired GSAP in 2024, ScrollTrigger is completely free for all uses including commercial.

## 2.2 Usage Modes

### Inline (on a tween):
```js
gsap.to('.box', {
  scrollTrigger: '.box', // shorthand — just the trigger element
  x: 500
})
```

### Inline with config object:
```js
gsap.to('.box', {
  scrollTrigger: {
    trigger: '.box',
    start: 'top center',
    end: 'bottom top',
    scrub: true,
  },
  x: 500
})
```

### On a timeline:
```js
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '.container',
    pin: true,
    scrub: 1,
    start: 'top top',
    end: '+=2000',
  }
})
tl.to('.a', { opacity: 0 })
  .from('.b', { y: 50 })
```

### Standalone (no animation):
```js
ScrollTrigger.create({
  trigger: '#section',
  start: 'top center',
  end: 'bottom center',
  onEnter: () => console.log('entered'),
  onLeave: () => console.log('left'),
  onUpdate: (self) => console.log(self.progress),
})
```

## 2.3 Config Properties — Complete

### Trigger & Position

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `trigger` | `String \| Element` | — | Element whose position determines start |
| `endTrigger` | `String \| Element` | trigger | Different element for end calculation |
| `start` | `String \| Number \| Function` | `"top bottom"` (`"top top"` if pinned) | When to activate. Format: `"trigger-pos scroller-pos"`. Keywords: `top`, `center`, `bottom`, `left`, `right`. Percentages: `"80%"`. Pixels: `"100px"`. Relative: `"+=300"`, `"+=100%"`. Wrap in `clamp()` to cap at page bounds |
| `end` | `String \| Number \| Function` | `"bottom top"` | When to deactivate. Same format as start. `"max"` = max scroll position |
| `scroller` | `String \| Element` | viewport | Custom scroll container |
| `horizontal` | `boolean` | `false` | Set `true` for horizontal scroll setups |

**start/end format explained:**
`"top center"` means "when the TOP of the trigger hits the CENTER of the viewport."
`"bottom 80%"` means "when the BOTTOM of the trigger hits 80% from the top of the viewport."
`"top bottom-=100px"` means "when the TOP of the trigger hits 100px above the bottom of the viewport."
`"+=2000"` means "2000px beyond where start is."

### Animation Control

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `animation` | `Tween \| Timeline` | — | Animation to control (used with `ScrollTrigger.create()`) |
| `toggleActions` | `String` | `"play none none none"` | 4 actions: `onEnter onLeave onEnterBack onLeaveBack`. Values: `play`, `pause`, `resume`, `reset`, `restart`, `complete`, `reverse`, `none` |
| `scrub` | `Boolean \| Number` | `false` | Link animation to scrollbar. `true` = instant. Number = seconds to catch up (e.g. `scrub: 1` = 1s smoothing) |
| `toggleClass` | `String \| Object` | — | Add/remove class when active. String: class on trigger. Object: `{ targets: ".el", className: "active" }` |

### Pinning

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `pin` | `Boolean \| String \| Element` | `false` | Pin element while active. `true` = pin trigger. Don't animate the pinned element itself — animate children |
| `pinSpacing` | `Boolean \| String` | `true` (`false` in flex) | Add padding so content catches up after unpin. `"margin"` uses margin instead. `false` disables |
| `pinType` | `"fixed" \| "transform"` | auto | Force pin method. Default: `fixed` for body scroller, `transform` for nested |
| `pinReparent` | `Boolean` | `false` | Reparent to `<body>` while pinned. Fixes ancestor `transform`/`will-change` breaking `position: fixed`. Use only if needed |
| `pinnedContainer` | `Element \| String` | — | Set when trigger is inside another pinned element (rare) |
| `pinSpacer` | `Element \| String` | auto | Custom spacer element (rare, for iframe-in-pin edge case) |
| `anticipatePin` | `Number` | `0` | Pixels to anticipate pin to prevent flash. Usually `1` is enough |

### Snapping

| Property | Type | Description |
|----------|------|-------------|
| `snap` | `Number` | Snap in increments: `0.1` = 10%, 20%, etc. For N sections: `1 / (N - 1)` |
| `snap` | `Array` | Snap to specific values: `[0, 0.25, 0.5, 0.75, 1]` |
| `snap` | `Function` | Custom logic: `(value) => Math.round(value / 0.2) * 0.2` |
| `snap` | `"labels"` | Snap to closest timeline label |
| `snap` | `"labelsDirectional"` | Snap to closest label in scroll direction |
| `snap` | `Object` | Full config (see below) |

**Snap object config:**
```js
snap: {
  snapTo: "labels",              // Number | Array | Function | "labels"
  delay: 0.1,                    // seconds after last scroll
  directional: true,             // snap in scroll direction (default true since 3.8)
  duration: { min: 0.2, max: 3 },// clamp duration based on velocity
  ease: "power3",                // snap animation ease
  inertia: true,                 // factor in scroll velocity
  onStart: () => {},
  onInterrupt: () => {},
  onComplete: () => {},
}
```

### Callbacks

All callbacks receive the ScrollTrigger instance with `progress`, `direction`, `isActive`, `getVelocity()`.

| Callback | Fires when |
|----------|------------|
| `onEnter` | Scroll forward past start (enters view) |
| `onLeave` | Scroll forward past end (leaves view) |
| `onEnterBack` | Scroll backward past end (re-enters from below) |
| `onLeaveBack` | Scroll backward past start (leaves above) |
| `onToggle` | Active state changes either direction |
| `onUpdate` | Progress changes (every scroll frame) |
| `onRefresh` | Positions recalculated (resize) |
| `onScrubComplete` | Numeric scrub finishes catching up |
| `onSnapComplete` | Snap animation finishes |

### Other

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id` | `String` | — | Unique ID, usable with `ScrollTrigger.getById()` |
| `markers` | `Boolean \| Object` | `false` | Debug markers. Object: `{ startColor, endColor, fontSize, fontWeight, indent }` |
| `once` | `Boolean` | `false` | Kill after first activation. Sets toggleActions to `"play none none none"` |
| `fastScrollEnd` | `Boolean \| Number` | `false` | Force completion if leaving faster than velocity (default 2500px/s) |
| `preventOverlaps` | `Boolean \| String` | `false` | Force preceding ScrollTrigger animations to end state. String = group name |
| `invalidateOnRefresh` | `Boolean` | `false` | Re-record start values on refresh/resize |
| `refreshPriority` | `Number` | `0` | Order of refresh calculation. Higher = earlier. Create ScrollTriggers top-to-bottom to avoid needing this |
| `containerAnimation` | `Tween \| Timeline` | — | For triggering inside horizontal scroll driven by vertical scroll. Container must use `ease: "none"`. No pin/snap available |

## 2.4 Instance Properties

| Property | Type | Description |
|----------|------|-------------|
| `.animation` | `Tween \| Timeline \| undefined` | Associated animation |
| `.direction` | `Number` | `1` forward, `-1` backward |
| `.end` | `Number` | End scroll position (px) |
| `.start` | `Number` | Start scroll position (px) |
| `.isActive` | `Boolean` | Between start and end |
| `.pin` | `Element \| undefined` | Pin element |
| `.progress` | `Number` | 0 (start) to 1 (end) |
| `.scroller` | `Element \| Window` | Scroll container |
| `.trigger` | `Element \| undefined` | Trigger element |
| `.vars` | `Object` | Config object |
| `ScrollTrigger.isTouch` | `Number` | `0` mouse only, `1` touch only, `2` both |

## 2.5 Instance Methods

| Method | Description |
|--------|-------------|
| `.disable(revert?)` | Disable, unpin, restore DOM. Pass `true` to revert inline styles |
| `.enable(reset?)` | Re-enable |
| `.getTween(snap?)` | Get scrub tween (default) or snap tween (`getTween(true)`) |
| `.getVelocity()` | Scroll velocity in px/s |
| `.kill(revert?, allowAnimation?)` | Permanently destroy. Remove listeners, eligible for GC |
| `.labelToScroll(label)` | Convert timeline label to scroll position (px) |
| `.next()` | Next ScrollTrigger in refresh order |
| `.previous()` | Previous ScrollTrigger in refresh order |
| `.refresh()` | Recalculate start/end positions |
| `.scroll(position?)` | Get/set scroll position of scroller |

## 2.6 Static Methods

| Method | Description |
|--------|-------------|
| `ScrollTrigger.create(config)` | Create standalone instance |
| `ScrollTrigger.batch(targets, config)` | Batch callbacks for multiple elements entering viewport around same time. Great for staggered reveals |
| `ScrollTrigger.defaults(config)` | Set default values for all future instances |
| `ScrollTrigger.config(config)` | Global config like `limitCallbacks` |
| `ScrollTrigger.getAll()` | Array of all instances |
| `ScrollTrigger.getById(id)` | Get instance by `id` |
| `ScrollTrigger.killAll()` | Kill all instances |
| `ScrollTrigger.refresh(safe?)` | Recalculate all positions. Pass `true` for safe mode (waits for images) |
| `ScrollTrigger.update()` | Force check scroll position and update all instances |
| `ScrollTrigger.sort(func?)` | Sort refresh order |
| `ScrollTrigger.addEventListener(type, cb)` | Global events: `"scrollStart"`, `"scrollEnd"`, `"refreshInit"`, `"revert"`, `"matchMedia"`, `"refresh"` |
| `ScrollTrigger.removeEventListener(type, cb)` | Remove global listener |
| `ScrollTrigger.isInViewport(el, proportion?, horizontal?)` | Check if element is in viewport. `proportion: 0.2` = at least 20% visible |
| `ScrollTrigger.isScrolling()` | Whether any scroller is currently scrolling |
| `ScrollTrigger.maxScroll(el, horizontal?)` | Max scroll value for element |
| `ScrollTrigger.positionInViewport(el, ref?, horiz?)` | Normalized position 0 (top) to 1 (bottom) |
| `ScrollTrigger.normalizeScroll(config)` | Force scroll to JS thread. Prevents mobile address bar show/hide |
| `ScrollTrigger.observe(config)` | Unified touch/mouse/pointer input detection |
| `ScrollTrigger.scrollerProxy(scroller, config)` | Hijack scroll getters/setters for 3rd-party smooth scroll libs |
| `ScrollTrigger.snapDirectional(increment)` | Returns directional snap function |
| `ScrollTrigger.saveStyles(targets)` | Record inline styles for proper revert during refresh/matchMedia |
| `ScrollTrigger.clearScrollMemory()` | Clear recorded scroll positions |
| `ScrollTrigger.clearMatchMedia(query)` | Clear matchMedia setup |

## 2.7 How ScrollTrigger Works Internally

ScrollTrigger does NOT constantly check element positions. It pre-calculates start/end scroll positions once (and on resize). At runtime it ONLY watches the scroll position number — making it extremely fast. Resize events are debounced (200ms gap). Updates sync with requestAnimationFrame and GSAP ticker.

---

# 3. INTEGRATION: LENIS + SCROLLTRIGGER

## 3.1 The Critical 3-Line Bridge

This is the most important pattern. Missing any line causes desync, jank, or broken triggers.

```js
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import 'lenis/dist/lenis.css'

gsap.registerPlugin(ScrollTrigger)

const lenis = new Lenis()

// LINE 1: Tell ScrollTrigger about Lenis scroll position changes
lenis.on('scroll', ScrollTrigger.update)

// LINE 2: Drive Lenis from GSAP's ticker (GSAP uses seconds, Lenis needs ms)
gsap.ticker.add((time) => {
  lenis.raf(time * 1000)
})

// LINE 3: Prevent GSAP lag compensation from interfering with smooth scroll
gsap.ticker.lagSmoothing(0)
```

**Why each line matters:**
- Without Line 1: ScrollTrigger doesn't know scroll changed → animations don't fire
- Without Line 2: Lenis never updates → no smooth scrolling
- Without Line 3: GSAP tries to compensate for frame drops, causing scroll jank

## 3.2 Alternative: scrollerProxy (advanced)

For custom scroll containers or more control:
```js
const lenis = new Lenis()

ScrollTrigger.scrollerProxy(document.body, {
  scrollTop(value) {
    if (arguments.length) {
      lenis.scrollTo(value, { immediate: true })
    }
    return lenis.animatedScroll
  },
  getBoundingClientRect() {
    return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }
  },
})

lenis.on('scroll', ScrollTrigger.update)
```

---

# 4. FRAMEWORK SETUP

## 4.1 React

```jsx
import { useEffect } from 'react'
import { ReactLenis, useLenis } from 'lenis/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import 'lenis/dist/lenis.css'

gsap.registerPlugin(ScrollTrigger)

function App() {
  // useLenis callback fires every scroll frame
  useLenis((lenis) => {
    // access lenis.scroll, lenis.velocity, etc.
  })

  useEffect(() => {
    // GSAP animations with ScrollTrigger go here
    const ctx = gsap.context(() => {
      gsap.from('.reveal', {
        scrollTrigger: { trigger: '.reveal', start: 'top 85%' },
        y: 60, opacity: 0, duration: 0.8
      })
    })
    return () => ctx.revert() // cleanup all ScrollTriggers
  }, [])

  return (
    <ReactLenis root options={{ lerp: 0.1 }}>
      <main>{/* content */}</main>
    </ReactLenis>
  )
}
```

**ReactLenis props:**
- `root` — use `<html>` as scroller (most common). When `true`, instance is global via `useLenis()`
- `root="asChild"` — render wrapper divs for custom scroll container, still globally accessible
- `options` — Lenis constructor options
- `className` — class for wrapper div

**useLenis hook:**
```jsx
// With callback (runs every scroll frame):
const lenis = useLenis(({ scroll, velocity, direction }) => { ... })

// Without callback (just get instance):
const lenis = useLenis()
lenis?.scrollTo('#section')
```

**GSAP integration in React (with ref):**
```jsx
import { useEffect, useRef } from 'react'
import { ReactLenis } from 'lenis/react'
import type { LenisRef } from 'lenis/react'

function App() {
  const lenisRef = useRef<LenisRef>(null)

  useEffect(() => {
    const lenis = lenisRef.current?.lenis
    if (!lenis) return

    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => { lenis.raf(time * 1000) })
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(lenis.raf)
    }
  }, [])

  return (
    <ReactLenis ref={lenisRef} root options={{ autoRaf: false }}>
      {/* content */}
    </ReactLenis>
  )
}
```

**Framer Motion integration:**
```jsx
import { ReactLenis } from 'lenis/react'
import type { LenisRef } from 'lenis/react'
import { cancelFrame, frame } from 'framer-motion'

function App() {
  const lenisRef = useRef<LenisRef>(null)

  useEffect(() => {
    function update(data: { timestamp: number }) {
      lenisRef.current?.lenis?.raf(data.timestamp)
    }
    frame.update(update, true)
    return () => cancelFrame(update)
  }, [])

  return <ReactLenis root options={{ autoRaf: false }} ref={lenisRef} />
}
```

## 4.2 Vue / Nuxt

```vue
<script setup>
import { VueLenis, useLenis } from 'lenis/vue'

const lenis = useLenis((lenis) => {
  // called every scroll
})
</script>

<template>
  <VueLenis root :options="{ lerp: 0.1 }" />
  <!-- content -->
</template>
```

**Nuxt module:**
```js
// nuxt.config.js
export default defineNuxtConfig({
  modules: ['lenis/nuxt'],
})
```

**Vue + GSAP:**
```vue
<script setup>
import { ref, watchEffect } from 'vue'
import { VueLenis, useLenis } from 'lenis/vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const lenisRef = ref()

watchEffect((onInvalidate) => {
  if (!lenisRef.value?.lenis) return

  lenisRef.value.lenis.on('scroll', ScrollTrigger.update)

  function update(time) {
    lenisRef.value.lenis.raf(time * 1000)
  }
  gsap.ticker.add(update)
  gsap.ticker.lagSmoothing(0)

  onInvalidate(() => gsap.ticker.remove(update))
})
</script>

<template>
  <VueLenis ref="lenisRef" root :options="{ autoRaf: false }" />
</template>
```

## 4.3 Vanilla JS (full boilerplate)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/lenis@1.3.15/dist/lenis.css">
</head>
<body>
  <section class="hero">...</section>
  <section class="content">...</section>

  <script src="https://unpkg.com/lenis@1.3.15/dist/lenis.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
  <script>
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis();
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    // animations here
  </script>
</body>
</html>
```

---

# 5. SCROLL ANIMATION RECIPES

## 5.1 Fade-in on scroll (most common)

```js
gsap.utils.toArray('.reveal').forEach(el => {
  gsap.from(el, {
    scrollTrigger: {
      trigger: el,
      start: 'top 85%',
      toggleActions: 'play none none reverse',
    },
    y: 60,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
  })
})
```

## 5.2 Staggered batch reveal

```js
ScrollTrigger.batch('.card', {
  onEnter: (elements) => {
    gsap.from(elements, {
      y: 60,
      opacity: 0,
      stagger: 0.15,
      duration: 0.8,
      ease: 'power2.out',
    })
  },
  start: 'top 85%',
})
```

## 5.3 Parallax

```js
gsap.utils.toArray('.parallax-img').forEach(img => {
  gsap.to(img, {
    scrollTrigger: {
      trigger: img.parentElement,
      scrub: true,
    },
    yPercent: -20,
    ease: 'none',
  })
})
```

## 5.4 Pinned section with content swap

```js
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '.pinned-section',
    pin: true,
    scrub: 1,
    start: 'top top',
    end: '+=3000',
    snap: { snapTo: 1/3, duration: 0.3, ease: 'power1.inOut' },
  }
})

tl.to('.slide-1', { opacity: 0, y: -30 })
  .from('.slide-2', { opacity: 0, y: 30 })
  .to('.slide-2', { opacity: 0, y: -30 })
  .from('.slide-3', { opacity: 0, y: 30 })
```

## 5.5 Horizontal scroll section

```js
const panels = gsap.utils.toArray('.h-panel')

gsap.to(panels, {
  xPercent: -100 * (panels.length - 1),
  ease: 'none',
  scrollTrigger: {
    trigger: '.h-container',
    pin: true,
    scrub: 1,
    snap: 1 / (panels.length - 1),
    end: () => '+=' + document.querySelector('.h-container').offsetWidth,
  }
})
```

## 5.6 Number counter

```js
gsap.utils.toArray('[data-count]').forEach(el => {
  const target = parseInt(el.dataset.count)
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 80%', once: true },
    textContent: 0,
    duration: 2,
    ease: 'power1.out',
    snap: { textContent: 1 },
    onUpdate() {
      el.textContent = Math.round(this.targets()[0].textContent).toLocaleString()
    }
  })
})
```

## 5.7 Hero scroll-away

```js
gsap.to('.hero', {
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  },
  scale: 0.95,
  opacity: 0,
  borderRadius: '24px',
})
```

## 5.8 Text reveal line-by-line (with SplitText or manual)

```js
// Assumes lines are wrapped in spans
gsap.from('.line', {
  scrollTrigger: { trigger: '.text-block', start: 'top 75%' },
  y: '100%',
  opacity: 0,
  stagger: 0.1,
  duration: 0.6,
  ease: 'power2.out',
})
```

## 5.9 CSS class toggle (no animation library needed)

```js
ScrollTrigger.create({
  trigger: '.section',
  start: 'top center',
  end: 'bottom center',
  toggleClass: { targets: '.nav', className: 'dark' },
})
```

## 5.10 Responsive animations

```js
const mm = gsap.matchMedia()

mm.add('(min-width: 768px)', () => {
  // Desktop animations
  gsap.from('.hero-text', {
    scrollTrigger: { trigger: '.hero', start: 'top top' },
    y: 100, opacity: 0
  })
  return () => { /* cleanup if needed */ }
})

mm.add('(max-width: 767px)', () => {
  // Mobile — simpler or no animations
})
```

## 5.11 Lenis smooth scroll to anchor

```js
const lenis = new Lenis({ anchors: true })

// Or with options:
const lenis = new Lenis({
  anchors: {
    offset: -80, // account for fixed header
    onComplete: () => console.log('arrived'),
  }
})
```

## 5.12 Programmatic scroll

```js
// Smooth scroll to element
lenis.scrollTo('#contact', { duration: 2, offset: -100 })

// Instant jump
lenis.scrollTo(0, { immediate: true })

// Scroll to bottom
lenis.scrollTo('bottom')
```

---

# 6. PERFORMANCE & TROUBLESHOOTING

## 6.1 Performance Rules

1. **Only animate `transform` and `opacity`** — never `top`, `left`, `width`, `height`, `margin`, `padding`
2. **Use `will-change: transform`** sparingly on animated elements — remove after animation if possible
3. **`scrub: 1`** (with smoothing) is smoother than `scrub: true` (instant) and reduces jitter
4. **Limit pinned sections** — each adds scroll distance; costly on mobile
5. **Batch DOM reads before writes** to avoid layout thrashing
6. **Lazy load images** below the fold
7. **Avoid animating the pinned element itself** — animate its children

## 6.2 Accessibility

```js
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const lenis = new Lenis({
  lerp: reduced ? 1 : 0.1, // instant if reduced motion
})

if (!reduced) {
  // apply scroll animations
}
```

## 6.3 Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| No smooth scroll | Missing Lenis CSS or not calling `lenis.raf()` | Include CSS. Use `autoRaf: true` or manual RAF |
| ScrollTrigger not firing | Lenis not synced | Add `lenis.on('scroll', ScrollTrigger.update)` |
| Jank/stutter | GSAP lag smoothing interfering | Add `gsap.ticker.lagSmoothing(0)` |
| Wrong trigger positions | Dynamic content loaded after init | Call `ScrollTrigger.refresh()` after content loads |
| Pin flash on Safari | Browser paints pre-pin frame | Use `anticipatePin: 1` |
| Nested scroll broken | Lenis intercepts child scroll | Use `data-lenis-prevent` on scrollable child |
| Fixed elements shifting | Ancestor has `transform` or `will-change` | Use `pinReparent: true` on ScrollTrigger |
| Animations stuck on resize | Stale start/end positions | ScrollTrigger auto-refreshes; if custom sizes, call `ScrollTrigger.refresh()` |
| iframes not scrollable | Lenis blocks wheel on iframes | Lenis CSS includes `pointer-events: none` on iframes during smooth scroll — known limitation |
| Safari 30fps | Low power mode | Can't fix — Safari limitation |

## 6.4 Cleanup (SPA / React)

```js
// GSAP context (React)
useEffect(() => {
  const ctx = gsap.context(() => {
    // all ScrollTrigger/animation setup here
  })
  return () => ctx.revert() // kills all ScrollTriggers + animations in context
}, [])

// Lenis
useEffect(() => {
  const lenis = new Lenis()
  // ...
  return () => lenis.destroy()
}, [])
```

## 6.5 Debug Checklist

1. Add `markers: true` to ScrollTrigger to visualize start/end positions
2. Check console for "ScrollTrigger: No matching targets" warnings
3. Verify Lenis is running: `console.log(lenis.isScrolling)` should change on scroll
4. Verify sync: `console.log(lenis.scroll)` should match `window.scrollY` approximately
5. Check that `gsap.registerPlugin(ScrollTrigger)` is called before any ScrollTrigger use
6. Confirm Lenis CSS is loaded (inspect `<html>` for `lenis` class)

## 6.6 Recommended Lenis Configs

```js
// Buttery smooth, slightly heavy (premium/luxury feel)
new Lenis({ lerp: 0.08, wheelMultiplier: 0.8 })

// Snappy, responsive
new Lenis({ lerp: 0.15 })

// Duration-based (predictable timing, no lerp)
new Lenis({ duration: 1.4, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })

// Touch-enabled
new Lenis({ syncTouch: true, touchMultiplier: 1.5 })
```
