import Link from 'next/link'

// Phần chữ/kiểu chung cho mọi nút — không có padding ở đây. Padding đổi theo
// variant (xem BUTTON_VARIANTS bên dưới): nhét `px-6` vào BASE từng khiến
// `ghost` (nút kiểu link chữ, cố tình không có đệm ngang) không thể bị
// className của nơi gọi ghi đè — Tailwind giải quyết xung đột cùng độ ưu tiên
// theo thứ tự trong stylesheet, không theo thứ tự chuỗi `className`, nên một
// `px-0` đứng sau `px-6` trong cùng chuỗi KHÔNG thắng. Đã đo trên
// `/vi/luu-tru-...`: padding ngang thực tế vẫn là 24px dù gọi
// `className="px-0"`.
export const BUTTON_BASE_CLASSES =
  'inline-block text-sm font-semibold tracking-wide uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'

// Viền focus PHẢI đạt 3:1 với màu nền ngay dưới nó (SC 1.4.11), không phải
// với nền trang. `outline-gold-deep` trên chính nền `gold` chỉ 1.30:1 — gần
// như vô hình với người dùng bàn phím. Mỗi variant tự chọn màu viền focus
// theo đúng nền của nó, tra theo bảng đo, không đoán bằng mắt:
// - solid (nền gold) -> outline-ink: 6.66:1 (ink trên gold, đã đo ở nơi khác).
// - outline/ghost (nền sáng/trắng) -> outline-gold-deep: 3.85:1, đạt 3:1.
//
// Tách riêng màu/viền focus (không padding) khỏi variant đầy đủ (có padding)
// để những chỗ cần CTA to hơn (hero, CTA band, ưu đãi — px-8 thay vì px-6)
// tái dùng đúng MỘT định nghĩa màu sắc mà không dính lại lỗi xung đột
// padding ở trên: gộp padding riêng của nơi gọi vào chuỗi không có padding
// sẵn, thay vì nối thêm `px-8` sau `px-6` của variant đầy đủ.
export const BUTTON_VARIANT_COLORS = {
  // nền gold + chữ ink = 6.66:1. KHÔNG đổi sang chữ trắng (chỉ 2.97:1).
  solid: 'bg-gold text-ink hover:bg-gold-hi focus-visible:outline-ink',
  outline: 'border border-gold-deep text-gold-text hover:bg-cream focus-visible:outline-gold-deep',
  ghost: 'text-gold-text hover:underline focus-visible:outline-gold-deep',
} as const

export const BUTTON_VARIANTS = {
  solid: `${BUTTON_VARIANT_COLORS.solid} px-6 py-3`,
  outline: `${BUTTON_VARIANT_COLORS.outline} px-6 py-3`,
  // Kiểu link chữ trần — cố tình không có đệm ngang, chỉ đệm dọc cho vùng bấm/focus.
  ghost: `${BUTTON_VARIANT_COLORS.ghost} py-3`,
} as const

// Nút CTA to (hero, dải CTA, trang ưu đãi) dùng chung MỘT định nghĩa — trước
// đây 3 file (HeroSection, CtaBandSection, OfferPage) tự chép cùng một chuỗi
// class tay, không qua Button vì `SmartLink` tự resolve href/label nên không
// gọi `<Button>` trực tiếp được. Kết quả: viền focus `outline-ink` (SC
// 1.4.11) bị thiếu ở cả 3 chỗ. Giờ cả 3 import hằng số này thay vì tự viết.
export const CTA_BAND_BUTTON_CLASSES = `${BUTTON_BASE_CLASSES} ${BUTTON_VARIANT_COLORS.solid} mt-8 px-8 py-3`

export function Button({
  href,
  variant = 'solid',
  children,
  className = '',
}: {
  href: string
  variant?: keyof typeof BUTTON_VARIANTS
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link href={href} className={`${BUTTON_BASE_CLASSES} ${BUTTON_VARIANTS[variant]} ${className}`}>
      {children}
    </Link>
  )
}
