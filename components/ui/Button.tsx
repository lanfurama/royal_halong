import Link from 'next/link'

const VARIANTS = {
  // nền gold + chữ ink = 6.66:1. KHÔNG đổi sang chữ trắng (chỉ 2.97:1).
  solid: 'bg-gold text-ink hover:bg-gold-hi',
  outline: 'border border-gold-deep text-gold-text hover:bg-cream',
  ghost: 'text-gold-text hover:underline',
} as const

export function Button({
  href,
  variant = 'solid',
  children,
  className = '',
}: {
  href: string
  variant?: keyof typeof VARIANTS
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`focus-visible:outline-gold-deep inline-block px-6 py-3 text-sm font-semibold tracking-wide uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  )
}
