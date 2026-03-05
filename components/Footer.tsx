import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        <div className="md:col-span-1">
          <p className="text-white font-bold text-lg mb-3">
            MaxPromo<span className="text-indigo-400">.digital</span>
          </p>
          <p className="text-sm leading-relaxed max-w-xs">
            AI agents and automation systems for businesses, NGOs, and government organisations.
          </p>
        </div>

        <div>
          <p className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Services</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/services" className="hover:text-white transition-colors">AI Agentic Workflows</Link></li>
            <li><Link href="/ai-websites" className="hover:text-white transition-colors">AI Websites</Link></li>
            <li><Link href="/services" className="hover:text-white transition-colors">Custom Automation</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Platform</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/automation-lab" className="hover:text-white transition-colors">Automation Lab</Link></li>
            <li><Link href="/automation-audit" className="hover:text-white transition-colors">Free Audit</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Coming Soon</p>
          <ul className="space-y-2.5 text-sm">
            <li className="opacity-40">Case Studies</li>
            <li className="opacity-40">Template Library</li>
            <li className="opacity-40">Blog</li>
            <li className="opacity-40">Client Portal</li>
            <li className="opacity-40">Pricing Calculator</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <p>&copy; {year} MaxPromo Digital. All rights reserved.</p>
        <p className="text-xs text-slate-500">Built with Next.js &amp; deployed on Vercel</p>
      </div>
    </footer>
  )
}
