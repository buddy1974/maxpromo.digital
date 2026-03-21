import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: '#0D1014', borderTop: '1px solid rgba(255,106,0,0.12)' }}>
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <p
              className="text-lg font-semibold mb-3"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: '#F0EDE8' }}
            >
              MaxPromo<span style={{ color: '#FF6A00' }}>.digital</span>
            </p>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(240,237,232,0.45)' }}>
              AI agents and automation systems for businesses, NGOs, and government organisations.
            </p>
          </div>

          {/* Services */}
          <div>
            <p
              className="text-xs font-semibold mb-4 tracking-widest uppercase"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(240,237,232,0.35)' }}
            >
              Services
            </p>
            <ul className="space-y-2.5 text-sm" style={{ color: 'rgba(240,237,232,0.55)' }}>
              <li><Link href="/services" className="hover:text-white transition-colors" style={{ color: 'inherit' }}>AI Agentic Workflows</Link></li>
              <li><Link href="/ai-websites" className="hover:text-white transition-colors" style={{ color: 'inherit' }}>AI Websites</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors" style={{ color: 'inherit' }}>Custom Automation</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <p
              className="text-xs font-semibold mb-4 tracking-widest uppercase"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(240,237,232,0.35)' }}
            >
              Platform
            </p>
            <ul className="space-y-2.5 text-sm" style={{ color: 'rgba(240,237,232,0.55)' }}>
              <li><Link href="/automation-lab" className="hover:text-white transition-colors" style={{ color: 'inherit' }}>Automation Lab</Link></li>
              <li><Link href="/automation-audit" className="hover:text-white transition-colors" style={{ color: 'inherit' }}>Free Audit</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors" style={{ color: 'inherit' }}>Contact</Link></li>
            </ul>
          </div>

          {/* Coming soon */}
          <div>
            <p
              className="text-xs font-semibold mb-4 tracking-widest uppercase"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(240,237,232,0.35)' }}
            >
              Coming Soon
            </p>
            <ul className="space-y-2.5 text-sm" style={{ color: 'rgba(240,237,232,0.25)' }}>
              <li>Case Studies</li>
              <li>Template Library</li>
              <li>Blog</li>
              <li>Client Portal</li>
              <li>Pricing Calculator</li>
            </ul>
          </div>
        </div>

        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{ borderTop: '1px solid rgba(255,106,0,0.1)', color: 'rgba(240,237,232,0.3)', fontFamily: 'var(--font-ibm-mono)' }}
        >
          <p>&copy; {year} MaxPromo Digital. All rights reserved.</p>
          <p>Built with Next.js &amp; deployed on Vercel</p>
        </div>
      </div>
    </footer>
  )
}
