'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LOCALES, type Locale } from '@/lib/i18n'
import { resolveSlug, type SlugField } from '@/lib/routes'

/**
 * Chỉ đổi prefix locale, giữ nguyên slug. Dùng làm FALLBACK khi nơi gọi
 * không truyền `slug` (xem `LangSwitcher` bên dưới) — vd. test cũ gọi
 * `<LangSwitcher lang="vi" />` trần. Hành vi thật (khi có `slug`) giờ suy ra
 * đúng slug riêng theo từng locale qua `resolveSlug`, không hoán prefix nữa.
 */
export function swapLocalePrefix(pathname: string, from: Locale, to: Locale): string {
  return pathname.replace(new RegExp(`^/${from}`), `/${to}`)
}

export function LangSwitcher({ lang, slug }: { lang: Locale; slug?: SlugField | null }) {
  const pathname = usePathname()

  return (
    // Đo được trước bản này: hai link "VI"/"EN" chỉ 13×16px và 17×16px —
    // nhỏ hơn ngưỡng 44px gần ba lần, ngay cạnh nhau nên rất dễ bấm nhầm.
    // `size-11` cho vùng chạm đủ 44×44 mà chữ vẫn giữ nguyên cỡ 12px, và
    // `-mx-1` kéo lại phần lề thừa để cụm không chiếm thêm bề ngang header.
    <div className="-mx-1 flex items-center text-xs tracking-wider uppercase">
      {LOCALES.map((locale) => {
        // Bug thật: hoán prefix thuần (`/vi/<slug-vi>` -> `/en/<slug-vi>`)
        // giả định slug giống nhau ở mọi locale. `hreflang` (`lib/seo.ts`,
        // `buildMetadata`) đã suy ra đúng slug riêng theo từng locale qua
        // `resolveSlug` — ngày biên tập viên thêm slug EN khác slug VI,
        // hoán prefix trỏ sai trong khi hreflang trỏ đúng, ngược nhau.
        // Khi nơi gọi CÓ truyền `slug` (`Header` nhận từ `SiteChrome`, được
        // trang hiện tại truyền xuống — xem `SiteChrome.tsx`), suy ra href
        // đúng y hệt cách `buildMetadata` sinh `hreflang`, không phụ thuộc
        // `usePathname()` — đúng ngay trong HTML server trả về, không cần
        // JS. `slug === undefined` (nơi gọi cũ chưa truyền, vd. test render
        // trần bên dưới) mới rơi về hoán prefix cũ.
        const href =
          slug !== undefined
            ? (() => {
                const localeSlug = resolveSlug(slug, locale)
                return localeSlug ? `/${locale}/${localeSlug}` : `/${locale}`
              })()
            : swapLocalePrefix(pathname, lang, locale)
        const active = locale === lang
        return (
          <Link
            key={locale}
            href={href}
            hrefLang={locale}
            aria-current={active ? 'true' : undefined}
            className={`flex size-11 items-center justify-center transition-colors ${
              active ? 'text-gold-hi font-semibold' : 'text-white/70 hover:text-white'
            }`}
          >
            {locale.toUpperCase()}
          </Link>
        )
      })}
    </div>
  )
}
