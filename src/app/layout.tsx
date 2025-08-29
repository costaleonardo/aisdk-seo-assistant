import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import MainLayout from '@/components/main-layout'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
})

export const metadata: Metadata = {
  title: 'Concentrix SEO Assistant - Internal Team Portal',
  description: 'AI-powered SEO analysis and optimization tool for Concentrix team members',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} font-sans`}>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  )
}