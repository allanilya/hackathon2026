'use client'
import { useEffect, useRef } from 'react'
import { useLenis } from '@/hooks/useLenis'
import Button from '@/components/ui/Button'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  links: { label: string; href: string }[]
}

export default function MobileMenu({ isOpen, onClose, links }: MobileMenuProps) {
  const lenis = useLenis()
  const navRef = useRef<HTMLElement>(null)

  // Handle Escape key to close menu
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Focus management and body scroll lock
  useEffect(() => {
    if (!isOpen) return

    // Focus first link when menu opens
    const firstButton = navRef.current?.querySelector('button')
    if (firstButton) {
      firstButton.focus()
    }

    // Lock body scroll
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  const handleLinkClick = (href: string) => {
    lenis?.scrollTo(href)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] max-w-[80vw] bg-stone-950 z-50 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 pt-20">
          {/* Navigation Links */}
          <nav id="mobile-menu" ref={navRef}>
            <ul className="space-y-0">
              {links.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => handleLinkClick(link.href)}
                    className="block w-full text-left py-3 text-lg text-stone-300 hover:text-white border-b border-stone-800 transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* CTA Button */}
          <Button variant="primary" className="w-full mt-6">
            Join Waitlist
          </Button>
        </div>
      </div>
    </>
  )
}
