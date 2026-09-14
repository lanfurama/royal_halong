import type { Metadata } from 'next'
import { display, body, accent, alt } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'Royal Halong Hotel',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  const fontVars = [display, body, accent, alt].map((f) => f.variable).join(' ')
  return (
    <html lang="vi" className={fontVars}>
      <body>{children}</body>
    </html>
  )
}
