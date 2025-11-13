import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Vocal Trainer - Improve Your Singing',
  description: 'A comprehensive vocal training app to help you improve your singing skills with real-time pitch detection and vocal range analysis.',
  keywords: ['vocal training', 'singing', 'pitch detection', 'vocal range', 'music education'],
  authors: [{ name: 'Vocal Trainer Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}