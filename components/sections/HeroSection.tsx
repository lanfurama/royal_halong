import { t, type Locale } from '@/lib/i18n'
import { SanityImage } from '@/components/ui/SanityImage'
import { Container } from '@/components/ui/Container'
import { SmartLink } from '@/components/ui/SmartLink'
import { CTA_BAND_BUTTON_CLASSES } from '@/components/ui/Button'

// `vh` trên iOS Safari đo theo viewport KHI thanh địa chỉ đã thu nhỏ, nên
// `85vh` thực tế cao hơn màn hình thấy được lúc mới tải — hero bị cắt mất
// phần đáy. `dvh` bám theo viewport động; `vh` đứng trước làm dự phòng cho
// trình duyệt cũ (thứ tự khai báo quyết định, cái sau ghi đè nếu hiểu được).
const HEIGHTS = {
  full: 'min-h-[85vh] min-h-[85dvh]',
  medium: 'min-h-[68vh] min-h-[68dvh]',
  short: 'min-h-[42vh] min-h-[42dvh]',
} as const

export function HeroSection({
  heading,
  subheading,
  background,
  cta,
  height = 'medium',
  lang,
  isFirst,
}: any & { lang: Locale; isFirst?: boolean }) {
  return (
    <section
      // `rhl-hero`: dấu cho biết section này là hero tối. Header đọc nó qua
      // `body:has(main > .rhl-hero:first-child)` để chuyển sang trạng thái
      // trôi trên ảnh, và `<main>` nhờ đó biết không phải chừa chỗ cho header
      // (xem `app/globals.css`). Đặt ở MỌI hero chứ không chỉ khi `isFirst`:
      // điều kiện "có phải section đầu không" đã do `:first-child` trả lời,
      // giữ một nguồn sự thật thay vì hai.
      className={`rhl-hero on-dark relative flex items-end overflow-hidden ${
        HEIGHTS[height as keyof typeof HEIGHTS] ?? HEIGHTS.medium
      }`}
    >
      {background && (
        <div className="absolute inset-0 -z-10">
          <SanityImage
            image={background}
            lang={lang}
            sizes="100vw"
            priority={isFirst}
            decorative
            className="h-full w-full object-cover"
          />
          {/* Trước đây là `bg-black/45` phẳng: làm xám đều cả bức ảnh khách
              sạn — thứ đắt giá nhất trên trang — chỉ để cứu tương phản chữ.
              Gradient đậm ở đáy (nơi có chữ) và nhạt dần lên đỉnh giữ được
              chi tiết ảnh mà chữ trắng vẫn trên nền ~72% đen, > 12:1. */}
          <div className="scrim-hero absolute inset-0" />
        </div>
      )}

      <Container size="wide" className="relative pt-28 pb-14 text-white lg:pb-20">
        <div className="max-w-3xl">
          {/* Đường kẻ vàng ngắn thay cho việc tô cả tiêu đề bằng màu vàng:
              vàng trên ảnh không đảm bảo tương phản ở mọi khung hình, còn
              trắng thì luôn đạt nhờ scrim. Vàng vẫn có mặt, làm điểm nhấn. */}
          <span aria-hidden="true" className="bg-gold-hi mb-6 block h-0.5 w-16" />
          <h1 className="font-display text-[clamp(1.75rem,6vw,3.5rem)] tracking-wide">
            {t<string>(heading, lang)}
          </h1>
          {subheading && (
            <p className="mt-5 max-w-xl text-sm tracking-[0.18em] text-white/85 uppercase md:text-base">
              {t<string>(subheading, lang)}
            </p>
          )}
          {cta && <SmartLink link={cta} lang={lang} className={CTA_BAND_BUTTON_CLASSES} />}
        </div>
      </Container>
    </section>
  )
}
