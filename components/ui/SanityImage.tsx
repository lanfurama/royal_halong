import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import { t, type Locale } from '@/lib/i18n'

interface Props {
  image: any
  lang: Locale
  sizes: string
  priority?: boolean
  className?: string
  /** Ảnh thuần trang trí — alt rỗng để screen reader bỏ qua. Đặt tường minh,
   * không để nó là hệ quả tình cờ của thiếu dữ liệu. */
  decorative?: boolean
  /**
   * Alt dự phòng khi ảnh không có field `alt` riêng (phần lớn ảnh import —
   * mọi thứ trừ `galleryAlbum` dùng kiểu `image` trần, không có `alt`).
   * Nơi gọi truyền dữ liệu liền kề có ý nghĩa: tên phòng, tên venue,
   * `brandName`... Bỏ qua khi `decorative`. Không tự bịa mô tả chung chung
   * kiểu "ảnh khách sạn" khi không có gì để truyền — khi đó alt là rỗng.
   */
  fallbackAlt?: string
}

/**
 * Quyết định alt text theo đúng thứ tự ưu tiên:
 * 1. decorative=true -> luôn '' (đúng WCAG cho ảnh trang trí, không phải hệ
 *    quả của thiếu dữ liệu).
 * 2. Ảnh có field `alt` riêng (chỉ `galleryAlbum`) -> dùng bản dịch theo locale.
 * 3. Không có alt -> `fallbackAlt` do nơi gọi truyền vào.
 * 4. Không có gì cả -> '' — không tự bịa mô tả chung chung.
 *
 * Tách riêng hàm thuần này để có thể test độc lập, không cần render DOM.
 */
export function resolveImageAlt(
  image: any,
  lang: Locale,
  { decorative, fallbackAlt }: { decorative?: boolean; fallbackAlt?: string } = {},
): string {
  if (decorative) return ''
  const own = t<string>(image?.alt, lang)
  if (own) return own
  return fallbackAlt ?? ''
}

export function SanityImage({ image, lang, sizes, priority, className, decorative, fallbackAlt }: Props) {
  if (!image?.asset) return null

  const dimensions = image.asset.metadata?.dimensions
  const alt = resolveImageAlt(image, lang, { decorative, fallbackAlt })

  // Sanity CDN thay cho `/_next/image` — xem `lib/sanity-image-loader.ts`
  // (wired qua `images.loader: 'custom'` trong `next.config.ts`) để biết vì
  // sao KHÔNG dùng prop `loader` tại đây: `next/image` cần gọi lại loader ở
  // phía client (responsive width), và một prop `loader` là hàm JS trần
  // KHÔNG serialize được qua ranh giới Server -> Client Component — build
  // thật sự nổ (`Functions cannot be passed directly to Client Components`)
  // với đúng cách viết inline này, vì SanityImage được hầu hết section
  // (Server Component, không "use client") gọi trực tiếp. Cấu hình loader
  // toàn cục qua file (`loaderFile`) là cách Next hỗ trợ chính thức cho đúng
  // nhu cầu này, không đụng ranh giới serialize đó.
  return (
    <Image
      src={urlFor(image).url()}
      alt={alt}
      width={dimensions?.width ?? 1600}
      height={dimensions?.height ?? 1067}
      sizes={sizes}
      priority={priority}
      placeholder={image.asset.metadata?.lqip ? 'blur' : undefined}
      blurDataURL={image.asset.metadata?.lqip}
      className={className}
    />
  )
}
