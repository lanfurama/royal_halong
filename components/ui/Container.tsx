const SIZES = {
  narrow: 'max-w-3xl',
  default: 'max-w-6xl',
  /** 1400px — bề ngang khung của bản redesign (Claude Design). Trước đây là
   * `max-w-7xl` (1280px); ở màn 1440px+ khung cũ để lại hai dải kem trống
   * 80px mỗi bên trong khi lưới dịch vụ và dải ảnh cần bề ngang để thở. */
  wide: 'max-w-[87.5rem]',
  /** Không giới hạn bề ngang — dùng cho dải ảnh tràn viền (thư viện ảnh,
   * lưới 4 thẻ). Vẫn giữ đúng lề an toàn hai bên như mọi Container khác. */
  full: 'max-w-none',
} as const

export function Container({
  size = 'default',
  className = '',
  children,
}: {
  size?: keyof typeof SIZES
  className?: string
  children: React.ReactNode
}) {
  // Lề ngang trước đây cố định `px-6` (24px) ở mọi bề rộng: chật ở 1440px và
  // hơi rộng ở 390px (375px khả dụng - 48px lề = 327px nội dung, khiến thẻ
  // ảnh 4:3 chỉ còn 245px cao). Thang theo bề rộng: 20px trên điện thoại,
  // 24px từ sm, 40px từ lg — đo ở cả 390/820/1440 đều còn >= 16px lề an toàn.
  return (
    <div className={`mx-auto w-full px-5 sm:px-6 lg:px-10 ${SIZES[size]} ${className}`}>
      {children}
    </div>
  )
}
