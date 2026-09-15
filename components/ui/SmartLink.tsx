import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { hrefFor } from '@/lib/routes'

/**
 * Nhận object `link` của Sanity (kiểu `link` trong schema: kind/href/label/
 * reference/blank) và render `<a>` (ngoài) hoặc `next/link` (trong site).
 *
 * Không render gì khi thiếu `link`, hoặc khi không có nhãn hiển thị (không
 * `children` truyền vào và `link.label` rỗng) — một liên kết không có tên
 * truy cập còn tệ hơn là không hiển thị nó. Đây là cùng nguyên tắc áp dụng
 * cho Header/Footer khi dữ liệu rỗng: thiếu thì không render, không render
 * rỗng.
 */
export function SmartLink({
  link,
  lang,
  className,
  children,
}: {
  link: any
  lang: Locale
  className?: string
  children?: React.ReactNode
}) {
  if (!link) return null
  const label = children ?? t(link.label, lang)
  if (!label) return null

  if (link.kind === 'external' && link.href) {
    return (
      <a
        href={link.href}
        target={link.blank ? '_blank' : undefined}
        rel={link.blank ? 'noopener noreferrer' : undefined}
        className={className}
      >
        {label}
      </a>
    )
  }

  return (
    <Link href={hrefFor(lang, link.internalSlug)} className={className}>
      {label}
    </Link>
  )
}
