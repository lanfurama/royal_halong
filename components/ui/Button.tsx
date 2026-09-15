import Link from 'next/link'

// Viền focus PHẢI đạt 3:1 với màu nền ngay dưới nó (SC 1.4.11), không phải
// với nền trang. `outline-gold-deep` trên chính nền `gold` chỉ 1.30:1 — gần
// như vô hình với người dùng bàn phím. Mỗi variant tự chọn màu viền focus
// theo đúng nền của nó, tra theo bảng đo, không đoán bằng mắt:
// - solid (nền gold) -> outline-ink: 6.66:1 (ink trên gold, đã đo ở nơi khác).
// - outline/ghost (nền sáng/trắng) -> outline-gold-deep: 3.85:1, đạt 3:1.
const VARIANTS = {
  // nền gold + chữ ink = 6.66:1. KHÔNG đổi sang chữ trắng (chỉ 2.97:1).
  solid: 'bg-gold text-ink hover:bg-gold-hi focus-visible:outline-ink',
  outline: 'border border-gold-deep text-gold-text hover:bg-cream focus-visible:outline-gold-deep',
  ghost: 'text-gold-text hover:underline focus-visible:outline-gold-deep',
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
      className={`inline-block px-6 py-3 text-sm font-semibold tracking-wide uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  )
}
