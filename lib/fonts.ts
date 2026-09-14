import { Arsenal, Inter, Cormorant, Fahkwang } from 'next/font/google'

export const display = Arsenal({
  weight: ['700'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-arsenal',
})

export const body = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
})

export const accent = Cormorant({
  weight: ['500'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-cormorant',
})

export const alt = Fahkwang({
  weight: ['500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fahkwang',
})
