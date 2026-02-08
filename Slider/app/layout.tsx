import { Geist, Geist_Mono } from 'next/font/google'
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider'
import Navbar from '@/components/layout/Navbar'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata = {
  title: 'Slider — AI Copilot for PowerPoint',
  description: 'Build professional slide decks with AI-powered Skills. Join the waitlist.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <SmoothScrollProvider>
          <Navbar />
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
