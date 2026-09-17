import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'
import type { SlugField } from '@/lib/routes'
import { SanityImage } from '@/components/ui/SanityImage'
import { SmartLink } from '@/components/ui/SmartLink'
import { HeaderShell } from './HeaderShell'
import { MobileMenu } from './MobileMenu'
import { NavDisclosure } from './NavDisclosure'
import { LangSwitcher } from './LangSwitcher'

// `siteSettings` có thể chưa có document -> link về trang chủ vẫn cần một
// tên truy cập, nên có fallback tĩnh thay vì để trống.
const BRAND_FALLBACK = 'Royal Halong Hotel'

// Mục điều hướng "ĐẶT PHÒNG" là hành động chính của cả trang -> tách ra
// thành nút viền vàng ở góc phải. Tách theo slug đích (`reservation`), không
// theo nhãn: nhãn đổi theo ngôn ngữ ("ĐẶT PHÒNG"/"BOOK NOW") còn slug thì không.
const BOOKING_SLUG = 'reservation'

function isBookingItem(item: any): boolean {
  const slug = item?.link?.internalSlug
  return Boolean(slug && Object.values(slug).some((s: any) => s?.current === BOOKING_SLUG))
}

/**
 * Một nửa menu ngang. Logo cắt menu làm đôi nên đây là hai vùng `<nav>` THẬT,
 * mỗi vùng một tên truy cập riêng — xem `mainMenuMore` trong `lib/ui-strings.ts`.
 *
 * `hidden nav:block`: dưới 1180px menu sống trong panel của `MobileMenu`, và
 * `MobileMenu` nhận TOÀN BỘ `items` (không phải nửa nào) nên thứ tự mục trong
 * panel vẫn đúng thứ tự biên tập viên sắp trong Sanity.
 */
function NavHalf({
  items,
  label,
  lang,
  align,
}: {
  items: any[]
  label: string
  lang: Locale
  /** Nửa trái ép sát về phía logo (`end`), nửa phải ép sát từ logo ra
   * (`start`) — hai nửa ôm lấy logo với cùng một khoảng hở, phần dư dồn ra
   * hai mép ngoài nơi có chip ngôn ngữ và nút đặt phòng. */
  align: 'end' | 'start'
}) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label={label}
      className={`hidden min-w-0 nav:block ${align === 'end' ? 'ml-auto' : 'mr-auto'}`}
    >
      <ul
        className={`flex items-center gap-x-[clamp(0.6875rem,1.35vw,1.5rem)] ${
          align === 'end' ? 'justify-end' : 'justify-start'
        }`}
      >
        {items.map((item, index) => {
          const itemLabel = t<string>(item.label, lang)
          const children: any[] = item.children ?? []

          // Nhóm có menu con -> disclosure (nút thật, mở được bằng
          // chuột/bàn phím/chạm). Xử lý được cả nhóm KHÔNG có `link` —
          // trường hợp trước đây làm mục rộng 0px, xem NavDisclosure.
          if (children.length > 0 && itemLabel) {
            return (
              <li key={index}>
                <NavDisclosure label={itemLabel} items={children} lang={lang} />
              </li>
            )
          }

          return (
            <li key={index}>
              <SmartLink
                link={item.link}
                lang={lang}
                className="rhl-navlink flex h-11 items-center text-[clamp(0.6875rem,1.1vw,0.78125rem)] font-medium tracking-[0.05em] whitespace-nowrap uppercase"
              >
                {itemLabel}
              </SmartLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
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
   * trỏ đúng bản dịch riêng từng locale thay vì hoán prefix mù. */
  slug?: SlugField | null
}) {
  const allItems: any[] = navigation?.header ?? []
  const brand = t<string>(settings?.brandName, lang) ?? BRAND_FALLBACK

  const bookingItem = allItems.find(isBookingItem)
  const items = allItems.filter((item) => item !== bookingItem)

  // Menu ngang bị logo cắt làm đôi. Chia theo SỐ MỤC chứ không theo bề ngang
  // chữ: bề ngang đổi theo từng thứ tiếng trong sáu bản dịch, nên cân theo nó
  // sẽ cho mỗi ngôn ngữ một điểm cắt khác nhau — cùng một trang, sáu bố cục.
  // `ceil` để nửa trái nhận mục lẻ (8 mục -> 4/4; 9 mục -> 5/4).
  const splitAt = Math.ceil(items.length / 2)
  const itemsLeft = items.slice(0, splitAt)
  const itemsRight = items.slice(splitAt)

  // Bản logo TRẮNG dùng khi header trôi trên ảnh hero. Chân trang đã dùng
  // đúng ảnh này trên nền vàng đậm. Chọn bằng CSS chứ không bằng điều kiện ở
  // đây: xem `.rhl-logo--light` trong `app/globals.css`.
  const logoLight = settings?.logoLight?.asset ? settings.logoLight : null

  return (
    // Nền, chiều cao và hai trạng thái màu nằm ở `.rhl-header`
    // (`app/globals.css`); `HeaderShell` chỉ gắn `data-scrolled`.
    // Link "bỏ qua điều hướng" KHÔNG còn ở đây — nó đã chuyển lên
    // `app/(site)/[lang]/layout.tsx`. Lý do ở ghi chú tại đó: `Header` nằm
    // trong ranh giới Suspense của `loading.tsx`, nên trong lúc màn hình chờ
    // còn hiện thì skip link chưa tồn tại để focus.
    <HeaderShell>
      {/* --- MỘT hàng duy nhất: logo nằm GIỮA menu ---
          Bản trước tách làm hai hàng (logo ở trên, menu ngang ở dưới) vì tám
          mục cấp 1 tiếng Việt cần ~614px ở cỡ chữ nhỏ nhất và không hàng đơn
          nào chứa nổi cả menu lẫn logo. Cắt menu làm đôi giải được đúng chỗ
          đó: mỗi nửa chỉ ~300px, và logo lọt vào giữa — lớn tới 120px mà vẫn
          không đụng mục menu nào.

          Ngân sách bề ngang ở 1180px (ngưỡng `nav`, chật nhất): khung 1132px
          (1180 trừ lề riêng 24px mỗi bên) = menu 614 + logo 139 + chip ngôn
          ngữ 86 + nút đặt phòng 155, còn dư ~138px chia cho bốn khe. Đây là
          chỗ đã HAI LẦN sinh lỗi chồng lấn (xem CLAUDE.md), nên thêm mục vào
          menu, nới cỡ chữ hay phóng logo thêm nữa thì phải đo lại ở CẢ SÁU
          ngôn ngữ — nhãn mỗi thứ tiếng một bề ngang. */}
      <div className="rhl-header-top">
        {/* `minmax(0,1fr)` chứ không phải `1fr` trần: `1fr` là
            `minmax(auto,1fr)`, tức cột KHÔNG hẹp hơn nội dung của nó được.
            Ở 375px, cụm trái (nút menu + chip ngôn ngữ) rộng hơn nửa chỗ còn
            lại sau khi trừ logo, nên cột trái nở ra và đẩy logo lệch phải —
            đúng thứ mà bố cục này sinh ra để tránh. Với `minmax(0,1fr)` hai
            cột luôn bằng nhau, nên logo nằm giữa KHUNG ở mọi bề ngang và mọi
            thứ tiếng, chứ không phải giữa phần còn lại sau khi trừ nút. */}
        {/* Không dùng `<Container>` ở riêng hàng này: lề ngang của nó
            (`px-5 sm:px-6 lg:px-10`) đúng cho một khối NỘI DUNG, nhưng ở
            header thì 40px mỗi bên vừa đẩy chip ngôn ngữ và nút đặt phòng
            thụt sâu vào trong, vừa lấy mất 80px khỏi ngân sách bề ngang vốn
            đã chỉ dư ~106px. Lề riêng 16/20/24px giữ lại được 64px trong số
            đó. Đè `px-*` lên `Container` bằng class là không đáng tin — hai
            utility cùng thuộc tính, cùng độ đặc hiệu, thứ tự thắng do thứ tự
            Tailwind xuất CSS quyết định chứ không phải thứ tự viết trong
            `className`. `max-w` vẫn là 87.5rem, cùng con số với `size="wide"`
            để header và nội dung bên dưới thẳng mép nhau ở màn rộng. */}
        <div className="mx-auto grid w-full max-w-[87.5rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 sm:gap-3 sm:px-5 lg:gap-5 lg:px-6">
          {/* Cột trái: mở menu (dưới `nav`) · ngôn ngữ · nửa đầu của menu. */}
          <div className="flex min-w-0 items-center justify-start gap-2 sm:gap-3">
            <MobileMenu lang={lang} items={items} bookingItem={bookingItem} />
            <LangSwitcher lang={lang} slug={slug} />
            <NavHalf items={itemsLeft} label={ui('mainMenu', lang)} lang={lang} align="end" />
          </div>

          {/* Cột giữa: logo. Vì sao chỉ còn ẢNH, không kèm khối chữ tên khách
              sạn như bản trước: khối chữ ấy vốn là giải pháp cho một logo cao
              52px nép bên trái, nơi dòng "ROYAL HALONG HOTEL" in trong ảnh chỉ
              còn ~7px. Ở 120px giữa header, phần chữ trong ảnh đọc được, và đặt
              thêm một tên nữa ngay cạnh một logo đã có tên là lặp. Tên thật
              vẫn là tên truy cập của link, nên screen reader không mất gì. */}
          <Link
            href={`/${lang}`}
            aria-label={brand}
            className="flex shrink-0 items-center justify-center py-1"
          >
            {settings?.logo?.asset && (
              <SanityImage
                image={settings.logo}
                lang={lang}
                sizes="160px"
                priority
                decorative
                className="rhl-logo rhl-logo--dark"
              />
            )}
            {logoLight && (
              <SanityImage
                image={logoLight}
                lang={lang}
                sizes="160px"
                priority
                decorative
                className="rhl-logo rhl-logo--light"
              />
            )}
            {/* Sanity chưa có logo -> monogram chữ R, vẫn tròn thật nên vẫn
                được bo (`rounded-pill` là ngoại lệ đã chốt của bản thiết kế). */}
            {!settings?.logo?.asset && !logoLight && (
              <span
                aria-hidden="true"
                className="border-gold text-gold font-display rounded-pill grid size-14 place-items-center text-[1.75rem] font-semibold"
              >
                R
              </span>
            )}
          </Link>

          {/* Cột phải: nửa sau của menu · hành động chính. Nút đặt phòng ẩn
              dưới `sm` (đã có nút vàng đặc ở đáy panel menu) để 390px không
              phải nhồi bốn thứ vào một hàng. */}
          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
            <NavHalf items={itemsRight} label={ui('mainMenuMore', lang)} lang={lang} align="start" />
            {bookingItem && (
              <SmartLink
                link={bookingItem.link}
                lang={lang}
                className="rhl-cta ml-auto hidden h-11 items-center px-5 text-xs font-semibold tracking-[0.08em] whitespace-nowrap uppercase sm:flex"
              >
                {t<string>(bookingItem.label, lang)}
              </SmartLink>
            )}
          </div>
        </div>
      </div>
    </HeaderShell>
  )
}
