import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'
import { display, body, accent, alt } from '@/lib/fonts'
import { SanityLive } from '@/sanity/lib/live'
import './globals.css'

export const metadata: Metadata = {
  title: 'Royal Halong Hotel',
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const { isEnabled: isDraftMode } = await draftMode()
  const fontVars = [display, body, accent, alt].map((f) => f.variable).join(' ')
  return (
    <html lang="vi" className={fontVars}>
      <body>
        {children}
        <SanityLive includeDrafts={isDraftMode} />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
