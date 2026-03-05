import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ChatAgent from '@/components/ChatAgent'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-slate-900`}>
        <Navbar />
        {children}
        <Footer />
        <ChatAgent />
      </body>
    </html>
  )
}
