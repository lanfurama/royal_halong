import { t, type Locale } from '@/lib/i18n'
import { SanityImage } from '@/components/ui/SanityImage'
import { Container } from '@/components/ui/Container'
import { HeroBookingBar, type RoomChoice } from './HeroBookingBar'

/**
 * Hero trang chủ theo bản thiết kế: ảnh tràn viền, lớp phủ nâu vàng, tiêu đề
 * Playfair, và thanh đặt phòng ĐÈ LÊN mép dưới.
 *
 * Khác `components/sections/HeroSection.tsx` (dùng cho mọi trang con) ở đúng
 * hai điểm: dòng địa danh phía trên tiêu đề, và thanh đặt phòng. Không gộp
 * hai component: thanh đặt phòng chỉ có nghĩa ở trang chủ, và nó kéo theo
 * cả cặp `pb-*` / `-mt-*` bên dưới — thứ mà mọi trang con sẽ phải mang theo
 * dù không dùng tới.
 *
 * Trả về FRAGMENT chứ không phải một `<section>` duy nhất: thanh đặt phòng
 * phải nằm ngoài hero để tự chiếm chỗ trong luồng (lý do đầy đủ ở ghi chú
 * ngay trên `<Container>` cuối hàm).
 */
export function HomeHero({
  section,
  lang,
  settings,
  reservationHref,
  rooms,
}: {
  section: any
  lang: Locale
  settings: any
  reservationHref: string
  rooms: RoomChoice[]
}) {
  const heading = t<string>(section?.heading, lang)
  const subheading = t<string>(section?.subheading, lang)
  // Dòng địa danh: bản thiết kế viết cứng "Bãi Cháy · Hạ Long · Quảng Ninh".
  // Dữ liệu thật có sẵn ở `siteSettings.addressShort` ("Bãi cháy, TP. Hạ
  // Long, Việt Nam.") — dùng nó, đổi dấu phẩy thành dấu chấm giữa cho khớp
  // nhịp thị giác của bản thiết kế. Không có settings thì bỏ cả dòng.
  const place = t<string>(settings?.addressShort, lang)
    ?.replace(/\.\s*$/, '')
    .split(/,\s*/)
    .join(' · ')

  return (
    <>
      <section
        id="booking"
        // `dvh` bám viewport động của iOS Safari (thanh địa chỉ thu/giãn);
        // `vh` đứng trước làm dự phòng cho trình duyệt cũ — thứ tự khai báo
        // quyết định, cái sau ghi đè nếu hiểu được.
        //
        // `pb-*` chừa chỗ cho phần thanh đặt phòng kéo ngược lên (`-mt-*` bên
        // dưới, cùng cặp số): chữ hero nằm sát đáy vì `justify-end`, không có
        // đệm này thì thanh che mất dòng mô tả.
        //
        // `rhl-hero`: đánh dấu "section này là hero tối". Header đọc dấu ấy
        // qua `body:has(main > .rhl-hero:first-child)` để tự chuyển sang trạng
        // thái trôi trên ảnh, và `<main>` nhờ đó biết KHÔNG phải chừa chỗ cho
        // header (xem `app/globals.css`). Class cũng tự đặt `padding-top`
        // bằng đúng chiều cao header.
        className="rhl-hero on-dark relative flex min-h-[95vh] min-h-[95dvh] flex-col justify-end pb-28 lg:pb-32"
      >
        {section?.background && (
          <div className="absolute inset-0 overflow-hidden">
            <SanityImage
              image={section.background}
              lang={lang}
              sizes="100vw"
              priority
              decorative
              className="h-full w-full object-cover"
            />
            <div className="scrim-hero absolute inset-0" />
          </div>
        )}

        <Container size="wide" className="text-cream-hi relative pt-28">
          {place && (
            <p className="text-gold-hi rhl-animate flex items-center gap-3.5 text-xs tracking-[0.18em] uppercase [animation:rhl-fade_0.9s_ease_both]">
              <span aria-hidden="true" className="bg-gold-hi block h-px w-12" />
              {place}
            </p>
          )}

          {heading && (
            // `max-w-[20ch]` + `clamp` tới 3.5rem chứ không phải 84px như bản
            // thiết kế: tiêu đề trong Sanity là chữ HOA dài 79 ký tự ("ROYAL
            // HẠ LONG - ĐIỂM ĐẾN LÝ TƯỞNG…"), trong khi bản thiết kế minh hoạ
            // bằng một câu chữ thường 44 ký tự. Ở 84px/14ch, tiêu đề thật
            // chiếm hơn 7 dòng và đẩy thanh đặt phòng ra khỏi màn hình.
            <h1 className="rhl-animate mt-6 max-w-[20ch] text-[clamp(1.875rem,4vw,3.5rem)] [animation:rhl-fade_1s_0.15s_ease_both]">
              {heading}
            </h1>
          )}

          {subheading && (
            <p className="text-cream-hi/90 rhl-animate mt-7 max-w-[32rem] text-base leading-relaxed [animation:rhl-fade_1s_0.3s_ease_both]">
              {subheading}
            </p>
          )}
        </Container>
      </section>

      {/* Thanh đặt phòng đè lên mép dưới hero, đúng bản thiết kế — nhưng nằm
          NGOÀI `<section>` và TRONG luồng, chỉ kéo ngược lên bằng `-mt-*`.
          Nó tự chiếm đúng chiều cao của mình, nên khối kế tiếp không phải
          biết nó cao bao nhiêu.

          Bản trước dùng `translate-y-1/2` — một transform KHÔNG chiếm chỗ —
          rồi bù bằng `pt-44` cố định ở `HomeIntro`. Cách đó đứng được ở
          desktop (thanh 1 hàng, cao 154px) nhưng vỡ ở điện thoại: xếp 1 cột
          thanh cao 406px, nửa dưới thò ra 203px > 176px và ĐÈ LÊN chữ khối
          giới thiệu 27px. Quan trọng hơn: phần đè phụ thuộc chiều cao thanh,
          nên mọi thay đổi ở `HeroBookingBar` (thêm một ô, chữ dịch dài hơn,
          nâng chiều cao control cho đủ 44px) lại âm thầm đội con số đó lên.
          Ở đây `-mt-*` là một hằng số THẬT — phần đè luôn đúng 56/80px bất kể
          thanh cao bao nhiêu. */}
      <Container size="wide" className="relative z-10 -mt-14 lg:-mt-20">
        <HeroBookingBar lang={lang} reservationHref={reservationHref} rooms={rooms} />
      </Container>
    </>
  )
}
