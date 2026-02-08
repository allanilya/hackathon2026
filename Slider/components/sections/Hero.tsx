'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Button from '@/components/ui/Button'

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const [email, setEmail] = useState('')

  useGSAP(() => {
    const mm = gsap.matchMedia()

    // Full animation for users with no motion preference
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from([
        '.hero-badge',
        '.hero-headline',
        '.hero-subline',
        '.hero-form',
        '.hero-visual'
      ], {
        autoAlpha: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out"
      })
    })

    // Simplified animation for reduced motion users
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.from([
        '.hero-badge',
        '.hero-headline',
        '.hero-subline',
        '.hero-form',
        '.hero-visual'
      ], {
        autoAlpha: 0,
        duration: 0.3,
        stagger: 0.1,
        ease: "none"
      })
    })

    return () => mm.revert()
  }, { scope: heroRef })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Placeholder only — no backend submission
  }

  return (
    <section
      ref={heroRef}
      id="hero"
      className="min-h-screen flex items-center bg-stone-950 pt-24 pb-20 sm:pt-28 lg:pt-32 lg:pb-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column — Text content + form */}
          <div>
            {/* Skills mention badge */}
            <span className="hero-badge inline-block text-sm font-medium text-burnt-orange tracking-wide uppercase mb-4">
              AI-Powered Presentation Skills
            </span>

            {/* Headline */}
            <h1 className="hero-headline text-display font-bold text-white leading-tight">
              Build stunning presentations with AI, right inside PowerPoint
            </h1>

            {/* Subline */}
            <p className="hero-subline text-xl text-stone-300 mt-6 max-w-lg">
              Slider is your AI copilot that lives in your PowerPoint sidebar. Use expert-crafted Skills to create professional decks in minutes.
            </p>

            {/* Waitlist form */}
            <form onSubmit={handleSubmit} className="hero-form mt-8">
              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <input
                  type="email"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address for waitlist"
                  className="flex-1 px-5 py-3.5 rounded-button bg-stone-800 border border-stone-700 text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-burnt-orange focus:border-transparent text-base"
                />
                <Button variant="primary" size="lg" type="button">
                  Join Waitlist
                </Button>
              </div>
              <p className="text-stone-500 text-sm mt-3">
                Free during beta. No credit card required.
              </p>
            </form>
          </div>

          {/* Right column — PowerPoint sidebar mockup */}
          <div className="hero-visual relative w-full max-w-lg mx-auto lg:mx-0">
            {/* PowerPoint window chrome */}
            <div className="bg-stone-800 rounded-xl border border-stone-700 overflow-hidden shadow-2xl">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-stone-900 border-b border-stone-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-stone-600"></div>
                  <div className="w-3 h-3 rounded-full bg-stone-600"></div>
                  <div className="w-3 h-3 rounded-full bg-stone-600"></div>
                </div>
                <span className="text-stone-500 text-xs ml-2">Quarterly Report.pptx</span>
              </div>

              {/* Content area with sidebar */}
              <div className="flex">
                {/* Main slide area */}
                <div className="flex-1 p-6 min-h-[280px] flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-32 h-3 bg-stone-600 rounded mx-auto"></div>
                    <div className="w-48 h-2 bg-stone-700 rounded mx-auto"></div>
                    <div className="w-40 h-2 bg-stone-700 rounded mx-auto"></div>
                    <div className="mt-6 w-24 h-16 bg-stone-700 rounded mx-auto"></div>
                  </div>
                </div>

                {/* Slider sidebar */}
                <div className="w-[200px] bg-stone-900 border-l border-stone-700 p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-burnt-orange flex items-center justify-center">
                      <span className="text-white text-xs font-bold">S</span>
                    </div>
                    <span className="text-white text-sm font-medium">Slider</span>
                  </div>

                  {/* Chat bubbles */}
                  <div className="bg-stone-800 rounded-lg p-2.5 text-xs text-stone-400">
                    Make this slide more visual
                  </div>
                  <div className="bg-burnt-orange/20 rounded-lg p-2.5 text-xs text-burnt-orange border border-burnt-orange/30">
                    Adding chart and updating layout...
                  </div>
                  <div className="bg-stone-800 rounded-lg p-2.5 text-xs text-stone-400">
                    Apply Sales Pitch skill
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
