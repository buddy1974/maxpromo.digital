import type { Metadata } from 'next'
import { Syne, IBM_Plex_Mono, DM_Sans } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ChatAgent from '@/components/ChatAgent'

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
})

const ibmMono = IBM_Plex_Mono({
  variable: '--font-ibm-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: {
    default: 'MaxPromo Digital — AI Agents & Automation Systems',
    template: '%s | MaxPromo Digital',
  },
  description:
    'We design intelligent workflows and AI agents that automate business processes, reduce manual work, and improve operational efficiency for businesses, NGOs, and government organisations.',
  keywords: [
    'AI automation',
    'AI agents',
    'workflow automation',
    'business automation',
    'n8n',
    'Claude AI',
    'automation systems',
    'AI websites',
  ],
  openGraph: {
    title: 'MaxPromo Digital — AI Agents & Automation Systems',
    description:
      'Intelligent workflows and AI agents that automate business processes and improve operational efficiency.',
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
        className={`${syne.variable} ${ibmMono.variable} ${dmSans.variable} antialiased`}
        style={{ background: '#06080A', color: '#F0EDE8' }}
      >
        <Navbar />
        {children}
        <Footer />
        <ChatAgent />
      </body>
    </html>
  )
}
