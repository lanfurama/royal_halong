import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'
import type { SlugField } from '@/lib/routes'
import { SanityImage } from '@/components/ui/SanityImage'
import { SmartLink } from '@/components/ui/SmartLink'
import { Container } from '@/components/ui/Container'
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

  return (
    // Nền kem BÁN TRONG SUỐT + blur: bản thiết kế để header nổi trên ảnh
    // hero mà vẫn đọc được. Gradient (đậm hơn ở mép trên) thay cho một màu
    // phẳng để mép dưới hoà vào nội dung thay vì cắt thành một vạch.
    // Không dùng `on-dark`: header giờ là nền SÁNG, viền focus phải là
    // `gold-deep` chứ không phải `gold-hi` (xem `globals.css`).
    <header className="border-gold/20 sticky top-0 z-40 border-b bg-[linear-gradient(180deg,rgb(250_246_238/0.95),rgb(250_246_238/0.85))] backdrop-blur-[14px]">
      <a
        href="#main"
        className="focus:bg-gold focus:text-cream-hi sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2"
      >
        {ui('skipNav', lang)}
      </a>

      <Container size="wide" className="flex min-h-19 items-center gap-4 lg:gap-6">
        {/* Khối thương hiệu: dấu hiệu (logo thật của khách sạn — chữ R trong
            khung bầu dục, vàng trên nền trong suốt nên đọc được cả trên kem
            lẫn trên ảnh tối) + tên đặt cạnh.
            Vì sao vẫn viết tên bên cạnh dù logo đã có chữ "ROYAL HALONG
            HOTEL" bên trong: logo là ảnh dọc 1200×1033, ở chiều cao 56px của
            header thì dòng chữ trong ảnh chỉ còn ~7px — không đọc nổi. Phần
            đọc được ở cỡ đó là CHỮ R, đúng vai trò monogram mà bản thiết kế
            đặt ở vị trí này. Tên thật nằm ở khối chữ bên cạnh, cỡ thật. */}
        {/* Thứ tự ưu tiên khi hết chỗ: <nav> và cụm bên phải `shrink-0`
            (chúng quyết định bề ngang TỐI THIỂU cần có), khối thương hiệu là
            thứ duy nhất được co — và co bằng cách CẮT CHỮ (`min-w-0` +
            `truncate` bên dưới), không phải bằng cách đè lên hàng xóm.
            Trước bản này <nav> mang `min-w-0`, nên flex co chính nó xuống
            dưới bề ngang nội dung: đo ở 1920px ra khung <nav> 757px trong
            khi <ul> bên trong cần 810px — 53px thừa tràn ra ngoài và mục
            cuối ("ƯU ĐÃI") nằm chồng lên nút ngôn ngữ. */}
        <Link
          href={`/${lang}`}
          className="flex min-w-0 items-center gap-3 py-2"
          aria-label={brand}
        >
          {settings?.logo?.asset ? (
            <SanityImage
              image={settings.logo}
              lang={lang}
              sizes="80px"
              priority
              decorative
              className="h-13 w-auto shrink-0"
            />
          ) : (
            <span
              aria-hidden="true"
              className="border-gold text-gold font-display grid size-11 place-items-center rounded-pill text-[1.375rem] font-semibold"
            >
              R
            </span>
          )}

          {/* Tên lấy từ `siteSettings.brandName` (hôm nay: "ROYAL HẠ LONG
              HOTEL"), KHÔNG hardcode chuỗi trong bản thiết kế — đây là dữ
              liệu biên tập viên sửa được. Dòng phụ bên dưới là phần trang
              trí của bản thiết kế và đúng với thực tế khách sạn (156 phòng 5
              sao + 11 villa). */}
          {/* Hiện từ `sm`, ẨN từ `nav` (1180px) trở lên — tức là hễ menu
              ngang có mặt thì khối chữ nhường chỗ. Logo (chữ R trong khung
              bầu dục) vẫn ở lại, nên thương hiệu không biến mất.

              KHÔNG có `2xl:flex` để hiện lại chữ ở màn rộng, dù trông có vẻ
              màn rộng thì thừa chỗ. Hàng header bị chặn `max-w-[87.5rem]`
              (1400px), nên bề ngang dùng được ĐỨNG YÊN ở 1320px kể từ
              1536px trở đi — kéo màn hình rộng thêm không sinh ra một pixel
              nào. Đo ở 2560px: nav 810 + cụm phải 197 + logo 60 + gap 12
              chừa lại 241px, trong khi chữ cần 245px. Thiếu 4px, và thiếu
              mãi mãi. Bản trước có `2xl:flex` nên từ 1536px chữ hiện lại rồi
              đè lên mục menu đầu tiên (đo được −5px ở 1536, −29px ở 1920).
              Muốn đưa chữ trở lại thì phải giành thêm chỗ THẬT trước — nới
              `max-w`, thu `gap` của nav, hoặc giảm cỡ chữ tên — rồi mới bật
              lại; nhớ đo bằng cả 6 ngôn ngữ vì nhãn menu mỗi thứ tiếng một
              bề ngang. */}
          {/* `min-w-0` là lưới an toàn, giữ lại kể cả khi chữ đã ẩn ở dải
              nav: thiếu nó, khối này giữ `min-width:auto` (mặc định của flex
              item) nên không co theo `<Link>` được, và `truncate` ngay bên
              dưới không bao giờ kích hoạt — chữ tràn khỏi cha thay vì bị
              cắt. `min-w-0` trên `<Link>` (đã có sẵn) chỉ mở khoá cho CHÍNH
              `<Link>` co, không truyền xuống con. */}
          <span className="hidden min-w-0 flex-col leading-none sm:flex nav:hidden">
            <span className="font-display text-ink truncate text-[1.1875rem] font-bold tracking-[0.06em]">
              {brand}
            </span>
            <span className="text-gold mt-1.5 text-[0.5625rem] tracking-[0.1em]">
              HOTEL &amp; VILLAS · ★★★★★
            </span>
          </span>
        </Link>

        {/* Không có menu (navigation rỗng) -> không render <nav>, không phải
            <nav> rỗng. */}
        {items.length > 0 && (
          <nav aria-label={ui('mainMenu', lang)} className="ml-auto hidden shrink-0 nav:block">
            <ul className="flex items-center gap-x-[clamp(0.75rem,1.6vw,1.75rem)]">
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
                      className="text-ink hover:text-gold flex h-11 items-center text-[clamp(0.6875rem,1.1vw,0.78125rem)] font-medium tracking-[0.05em] whitespace-nowrap uppercase transition-colors"
                    >
                      {label}
                    </SmartLink>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}

        {/* `ml-auto` ở MỌI bề rộng dưới `nav` (menu ngang bị ẩn, không ai
            đẩy cụm này sang phải), và `nav:ml-4` từ đó trở lên — lúc ấy chính
            <nav> giữ `ml-auto`, cụm này chỉ cần khoảng cách với mục cuối. */}
        <div className={`flex shrink-0 items-center gap-1 sm:gap-3 ml-auto ${items.length > 0 ? 'nav:ml-4' : ''}`}>
          <LangSwitcher lang={lang} slug={slug} />

          {/* CTA chính — nút viền vàng, góc vuông (bản thiết kế không bo góc
              ở bất cứ đâu). Ẩn ở điện thoại hẹp (đã có trong panel menu) để
              không đẩy logo/ngôn ngữ vỡ hàng ở 390px. */}
          {bookingItem && (
            <SmartLink
              link={bookingItem.link}
              lang={lang}
              className="border-gold text-gold hover:bg-gold hover:text-cream-hi hidden h-11 items-center border px-5 text-xs font-semibold tracking-[0.08em] whitespace-nowrap uppercase transition-colors sm:flex"
            >
              {t<string>(bookingItem.label, lang)}
            </SmartLink>
          )}

          {/* `items` (đã bỏ mục đặt phòng) + `bookingItem` riêng: bản thiết
              kế đặt CTA đặt phòng thành nút vàng đặc ở đáy panel, không lẫn
              vào danh sách link. Trước đây truyền `allItems` nên nó là link
              thứ 9 giống hệt 8 link kia. */}
          <MobileMenu lang={lang} items={items} bookingItem={bookingItem} />
        </div>
      </Container>
    </header>
  )
}
