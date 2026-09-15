'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LOCALES, type Locale } from '@/lib/i18n'

/**
 * Chỉ đổi prefix locale, giữ nguyên slug. Tách hàm thuần để test không cần
 * router context (usePathname() đòi App Router runtime, không gọi được
 * trong test node thường).
 *
 * Slug EN riêng (nếu có) sẽ được xử lý ở Task 7 khi sinh `hreflang` — ở đây
 * giữ đơn giản vì đa số trang dùng chung slug.
 */
export function swapLocalePrefix(pathname: string, from: Locale, to: Locale): string {
  return pathname.replace(new RegExp(`^/${from}`), `/${to}`)
}

export function LangSwitcher({ lang }: { lang: Locale }) {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-2 text-xs tracking-wider uppercase">
      {LOCALES.map((locale) => {
        const href = swapLocalePrefix(pathname, lang, locale)
        const active = locale === lang
        return (
          <Link
            key={locale}
            href={href}
            hrefLang={locale}
            aria-current={active ? 'true' : undefined}
            className={active ? 'text-gold-hi font-semibold' : 'text-white/70 hover:text-white'}
          >
            {locale.toUpperCase()}
          </Link>
        )
      })}
    </div>
  )
}
