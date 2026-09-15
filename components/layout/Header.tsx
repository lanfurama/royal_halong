import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import type { SlugField } from '@/lib/routes'
import { SanityImage } from '@/components/ui/SanityImage'
import { SmartLink } from '@/components/ui/SmartLink'
import { Container } from '@/components/ui/Container'
import { MobileMenu } from './MobileMenu'
import { LangSwitcher } from './LangSwitcher'

// `siteSettings` chưa có document nào trong Sanity hôm nay (getSiteSettings()
// trả null) — link về trang chủ vẫn cần một tên truy cập, nên có fallback
// tĩnh thay vì để trống. Đây là tên đã dùng sẵn ở `app/layout.tsx` <title>,
// không phải bịa mới.
const BRAND_FALLBACK = 'Royal Halong Hotel'

export function Header({
  lang,
  navigation,
  settings,
  slug,
}: {
  lang: Locale
  navigation: any
  settings: any
  /** Slug (song ngữ) của TRANG HIỆN TẠI — truyền xuống `LangSwitcher` để nó
   * trỏ đúng bản dịch riêng từng locale thay vì hoán prefix mù. `undefined`
   * (không truyền) giữ hành vi hoán prefix cũ — xem `LangSwitcher.tsx`. */
  slug?: SlugField | null
}) {
  const items: any[] = navigation?.header ?? []
  const brand = t<string>(settings?.brandName, lang) ?? BRAND_FALLBACK

  return (
    <header className="bg-ink sticky top-0 z-40 text-white">
      <a
        href="#main"
        className="focus:bg-gold focus:text-ink sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2"
      >
        Bỏ qua điều hướng
      </a>

      <Container size="wide" className="flex items-center justify-between py-4">
        <Link href={`/${lang}`} className="flex items-center gap-3">
          {settings?.logoLight?.asset ? (
            <SanityImage
              image={settings.logoLight}
              lang={lang}
              sizes="120px"
              priority
              fallbackAlt={brand}
              className="h-10 w-auto"
            />
          ) : (
            <span className="font-display text-gold-hi text-lg">{brand}</span>
          )}
        </Link>

        {/* Không có menu (navigation rỗng hôm nay) -> không render <nav>,
            không phải <nav> rỗng. */}
        {items.length > 0 && (
          <nav aria-label="Menu chính" className="hidden lg:block">
            <ul className="flex items-center gap-6">
              {items.map((item, index) => (
                <li key={index} className="group relative">
                  <SmartLink
                    link={item.link}
                    lang={lang}
                    className="hover:text-gold-hi py-2 text-xs tracking-widest uppercase transition-colors"
                  >
                    {t<string>(item.label, lang)}
                  </SmartLink>
                  {item.children?.length > 0 && (
                    <ul className="bg-ink invisible absolute top-full left-0 min-w-56 py-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                      {item.children.map((child: any, childIndex: number) => (
                        <li key={childIndex}>
                          <SmartLink
                            link={child.link}
                            lang={lang}
                            className="hover:text-gold-hi block px-4 py-2 text-xs tracking-wide uppercase"
                          >
                            {t<string>(child.label, lang)}
                          </SmartLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="flex items-center gap-4">
          <LangSwitcher lang={lang} slug={slug} />
          <MobileMenu lang={lang} items={items} />
        </div>
      </Container>
    </header>
  )
}
