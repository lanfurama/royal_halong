import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import type { SlugField } from '@/lib/routes'
import { SanityImage } from '@/components/ui/SanityImage'
import { SmartLink } from '@/components/ui/SmartLink'
import { Container } from '@/components/ui/Container'
import { MobileMenu } from './MobileMenu'
import { NavDisclosure } from './NavDisclosure'
import { LangSwitcher } from './LangSwitcher'

// `siteSettings` chưa có document nào trong Sanity hôm nay (getSiteSettings()
// trả null) — link về trang chủ vẫn cần một tên truy cập, nên có fallback
// tĩnh thay vì để trống. Đây là tên đã dùng sẵn ở `app/layout.tsx` <title>,
// không phải bịa mới.
const BRAND_FALLBACK = 'Royal Halong Hotel'

// Mục điều hướng cuối cùng trong dữ liệu Sanity là "ĐẶT PHÒNG" — hành động
// chính của cả trang. Bản gốc render nó thành nút vàng tách riêng ở góc phải,
// bản dựng lại trước đây để nó lẫn vào 8 link chữ trắng giống hệt nhau. Tách
// ra theo slug đích (`reservation`), không theo nhãn: nhãn đổi theo ngôn ngữ
// ("ĐẶT PHÒNG"/"BOOK NOW") còn slug thì không.
const BOOKING_SLUG = 'reservation'

function isBookingItem(item: any): boolean {
  const slug = item?.link?.internalSlug
  return Boolean(slug && Object.values(slug).some((s: any) => s?.current === BOOKING_SLUG))
}

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
  const allItems: any[] = navigation?.header ?? []
  const brand = t<string>(settings?.brandName, lang) ?? BRAND_FALLBACK

  const bookingItem = allItems.find(isBookingItem)
  const items = allItems.filter((item) => item !== bookingItem)

  return (
    <header className="bg-ink on-dark sticky top-0 z-40 text-white">
      <a
        href="#main"
        className="focus:bg-gold focus:text-ink sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2"
      >
        Bỏ qua điều hướng
      </a>

      <Container size="wide" className="flex h-18 items-center justify-between gap-4 lg:h-20">
        <Link
          href={`/${lang}`}
          className="flex shrink-0 items-center gap-3 py-2"
          aria-label={brand}
        >
          {settings?.logoLight?.asset ? (
            <SanityImage
              image={settings.logoLight}
              lang={lang}
              sizes="120px"
              priority
              fallbackAlt={brand}
              className="h-11 w-auto"
            />
          ) : (
            <span className="font-display text-gold-hi text-lg">{brand}</span>
          )}
        </Link>

        {/* Không có menu (navigation rỗng hôm nay) -> không render <nav>,
            không phải <nav> rỗng. */}
        {items.length > 0 && (
          <nav aria-label="Menu chính" className="hidden min-w-0 lg:block">
            <ul className="flex items-center gap-x-6 xl:gap-x-7">
              {items.map((item, index) => {
                const label = t<string>(item.label, lang)
                const children: any[] = item.children ?? []

                // Nhóm có menu con -> disclosure (nút thật, mở được bằng
                // chuột/bàn phím/chạm). Xử lý được cả nhóm KHÔNG có `link` —
                // trường hợp trước đây làm mục rộng 0px, xem NavDisclosure.
                if (children.length > 0 && label) {
                  return (
                    <li key={index}>
                      <NavDisclosure label={label} items={children} lang={lang} />
                    </li>
                  )
                }

                return (
                  <li key={index}>
                    <SmartLink
                      link={item.link}
                      lang={lang}
                      className="hover:text-gold-hi flex h-11 items-center text-xs tracking-widest whitespace-nowrap uppercase transition-colors"
                    >
                      {label}
                    </SmartLink>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LangSwitcher lang={lang} slug={slug} />

          {/* CTA chính. Ẩn ở điện thoại hẹp (đã có trong panel menu) để không
              đẩy logo/ngôn ngữ vỡ hàng ở 390px — đo được: logo 47px +
              VI/EN 88px + hamburger 44px + CTA 132px = 311px, vừa khít 335px
              nội dung nhưng không còn khoảng thở nào. */}
          {bookingItem && (
            <SmartLink
              link={bookingItem.link}
              lang={lang}
              className="bg-gold text-ink hover:bg-gold-hi hidden h-11 items-center rounded-pill px-5 text-xs font-semibold tracking-widest whitespace-nowrap uppercase transition-colors sm:flex"
            >
              {t<string>(bookingItem.label, lang)}
            </SmartLink>
          )}

          <MobileMenu lang={lang} items={allItems} />
        </div>
      </Container>
    </header>
  )
}
