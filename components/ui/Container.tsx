const SIZES = {
  narrow: 'max-w-3xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
} as const

export function Container({
  size = 'default',
  className = '',
  children,
}: {
  size?: keyof typeof SIZES
  className?: string
  children: React.ReactNode
}) {
  return <div className={`mx-auto px-6 ${SIZES[size]} ${className}`}>{children}</div>
}
