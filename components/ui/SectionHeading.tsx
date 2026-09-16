import { t, type Locale, type LocaleField } from '@/lib/i18n'

/**
 * Tiêu đề khối dùng chung. Trước bản này mỗi section tự viết
 * `font-display text-gold-deep mb-2 text-center text-3xl` (CardGrid),
 * `... mb-8 ...` (Gallery), `mb-6` (Map), `mb-10` (Testimonials) — bốn nhịp
 * khác nhau cho cùng một vai trò, thấy rõ khi cuộn hết trang chủ.
 *
 * Màu: `gold-deep` chỉ đạt 3.85:1 trên nền trắng — hợp lệ cho chữ >= 24px
 * (text-3xl = 30px), nhưng phần phụ đề cỡ nhỏ thì KHÔNG, nên phụ đề dùng
 * `text-body`. Đây là lý do hai dòng ngay cạnh nhau lại khác màu.
 */
export function SectionHeading({
  heading,
  subheading,
  lang,
  align = 'center',
  tone = 'light',
}: {
  heading?: LocaleField<string> | null
  subheading?: LocaleField<string> | null
  lang: Locale
  align?: 'center' | 'left'
  tone?: 'light' | 'dark'
}) {
  const headingText = t<string>(heading, lang)
  const subText = t<string>(subheading, lang)
  if (!headingText && !subText) return null

  const centered = align === 'center'

  return (
    <div className={`mb-10 lg:mb-14 ${centered ? 'text-center' : ''}`}>
      {/* Đường kẻ vàng ngắn thay cho việc phóng to/đậm thêm chữ — giữ một
          dấu hiệu thương hiệu nhất quán ở mọi khối mà không đụng tương phản. */}
      <span
        aria-hidden="true"
        className={`bg-gold mb-5 block h-px w-12 ${centered ? 'mx-auto' : ''}`}
      />
      {headingText && (
        <h2
          className={`font-display text-[clamp(1.5rem,4vw,2.25rem)] ${
            tone === 'dark' ? 'text-gold-hi' : 'text-gold-deep'
          }`}
        >
          {headingText}
        </h2>
      )}
      {subText && (
        <p
          className={`mt-3 text-sm tracking-[0.18em] uppercase ${
            centered ? 'mx-auto' : ''
          } max-w-2xl ${tone === 'dark' ? 'text-white/80' : 'text-body'}`}
        >
          {subText}
        </p>
      )}
    </div>
  )
}
