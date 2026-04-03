import type { Metadata } from 'next'
import { Space_Grotesk, Space_Mono, DM_Sans } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ChatAgent from '@/components/ChatAgent'
import CookieBanner from '@/components/CookieBanner'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: {
    default: 'MaxPromo Digital — AI Automation Platform',
    template: '%s | MaxPromo Digital',
  },
  description:
    'AI agents, workflow automation, and intelligent systems for businesses that are serious about growth.',
  keywords: [
    'AI automation',
    'AI agents',
    'workflow automation',
    'business automation',
    'n8n',
    'Claude API',
    'automation systems',
  ],
  openGraph: {
    title: 'MaxPromo Digital — AI Automation Platform',
    description:
      'AI agents, workflow automation, and intelligent systems for businesses serious about growth.',
    type: 'website',
    locale: 'en_GB',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${spaceMono.variable} ${dmSans.variable} antialiased`}
        style={{ background: '#030305', color: '#FAFAFF' }}
      >
        <Navbar />
        {children}
        <Footer />
        <ChatAgent />
        <CookieBanner />
      </body>
    </html>
  )
}
