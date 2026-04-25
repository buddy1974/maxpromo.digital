import type { Metadata } from 'next'
import { Space_Grotesk, Inter, Roboto_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ChatAgent from '@/components/ChatAgent'
import CookieBanner from '@/components/CookieBanner'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'MAXPROMO DIGITAL — AI Automation Platform',
    template: '%s | MAXPROMO DIGITAL',
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
    title: 'MAXPROMO DIGITAL — AI Automation Platform',
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
        className={`${spaceGrotesk.variable} ${inter.variable} ${robotoMono.variable} antialiased`}
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
