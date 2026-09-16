import { PortableText, type PortableTextComponents } from '@portabletext/react'
import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
    h2: ({ children }) => (
      <h2 className="font-display mt-10 mb-4 text-3xl">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-display mt-8 mb-3 text-2xl">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-ink mt-6 mb-2 text-lg font-semibold">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-gold my-6 border-l-4 pl-5 italic">{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-6">{children}</ul>,
    number: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-6">{children}</ol>,
  },
  marks: {
    link: ({ value, children }) => {
      const href: string = value?.href ?? '#'
      const external = /^https?:\/\//.test(href)
      return external ? (
        <a
          href={href}
          target={value?.blank ? '_blank' : undefined}
          rel={value?.blank ? 'noopener noreferrer' : undefined}
          className="text-gold-text underline underline-offset-2"
        >
          {children}
        </a>
      ) : (
        <Link href={href} className="text-gold-text underline underline-offset-2">
          {children}
        </Link>
      )
    },
  },
}

export function RichText({ value, lang }: { value: any; lang: Locale }) {
  const blocks = t<any[]>(value, lang)
  if (!blocks || blocks.length === 0) return null
  return <PortableText value={blocks} components={components} />
}
