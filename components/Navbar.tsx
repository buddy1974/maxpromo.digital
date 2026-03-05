'use client'

import Link from 'next/link'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/automation-lab', label: 'Automation Lab' },
  { href: '/ai-websites', label: 'AI Websites' },
  { href: '/automation-audit', label: 'Free Audit' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-slate-900 tracking-tight">
          MaxPromo<span className="text-indigo-600">.digital</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.filter((l) => l.label !== 'Free Audit').map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-600 hover:text-indigo-600 transition-colors font-medium"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/automation-audit"
            className="bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-indigo-700 transition-colors"
          >
            Free Audit
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1 text-slate-700"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 flex flex-col gap-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-700 font-medium py-1"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
