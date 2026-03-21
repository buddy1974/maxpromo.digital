import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: '#0A0A0A', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="md:col-span-1">
            <p
              className="text-base font-semibold mb-3"
              style={{ fontFamily: 'var(--font-ibm-mono)' }}
            >
              <span style={{ color: '#FFFFFF' }}>MaxPromo</span>
              <span style={{ color: '#F97316' }}>.digital</span>
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#888888', maxWidth: '220px' }}>
              AI agents and automation systems for businesses, NGOs, and government organisations.
            </p>
          </div>

          {/* Services */}
          <div>
            <p
              className="text-xs font-semibold mb-5 tracking-widest uppercase"
              style={{ fontFamily: 'var(--font-dm-sans)', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}
            >
              Services
            </p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/services" className="footer-link">AI Agentic Workflows</Link></li>
              <li><Link href="/ai-websites" className="footer-link">AI Websites</Link></li>
              <li><Link href="/services" className="footer-link">Custom Automation</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <p
              className="text-xs font-semibold mb-5 tracking-widest uppercase"
              style={{ fontFamily: 'var(--font-dm-sans)', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}
            >
              Platform
            </p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/automation-lab" className="footer-link">Automation Lab</Link></li>
              <li><Link href="/automation-audit" className="footer-link">Free Audit</Link></li>
              <li><Link href="/contact" className="footer-link">Contact</Link></li>
            </ul>
          </div>

          {/* Coming soon */}
          <div>
            <p
              className="text-xs font-semibold mb-5 tracking-widest uppercase"
              style={{ fontFamily: 'var(--font-dm-sans)', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}
            >
              Coming Soon
            </p>
            <ul className="space-y-3 text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>
              <li>Case Studies</li>
              <li>Template Library</li>
              <li>Blog</li>
              <li>Client Portal</li>
              <li>Pricing Calculator</li>
            </ul>
          </div>
        </div>

        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs" style={{ color: '#888888' }}>
            &copy; {year} MaxPromo Digital. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Built with Next.js &amp; deployed on Vercel
          </p>
        </div>
      </div>
    </footer>
  )
}
