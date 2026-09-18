import { PortableText, type PortableTextComponents } from '@portabletext/react'
import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { SanityImage } from './SanityImage'

/**
 * `components` phải nhận `lang`: `figure` bên trong một `localeBlock` có
 * `alt`/`caption` đa ngữ, mà `@portabletext/react` không truyền ngôn ngữ
 * xuống renderer. Dựng bảng component theo từng locale thay vì để hằng số
 * toàn cục.
 */
function buildComponents(lang: Locale): PortableTextComponents {
  return {
  /**
   * `localeBlock` cho phép chèn `figure` giữa dòng chữ (xem
   * `sanity/schemaTypes/objects/localeBlock.ts`), nhưng trước đây không có
   * renderer nào cho nó — `@portabletext/react` gặp type lạ thì render một
   * `<div style="display:none">`, tức là ẢNH BIẾN MẤT KHÔNG BÁO LỖI. Biên tập
   * viên chèn ảnh trong Studio, lưu, xem trang và không thấy gì.
   */
  types: {
    figure: ({ value }: any) => {
      if (!value?.asset) return null
      const caption = t<string>(value.caption, lang)
      return (
        <figure className="my-8">
          <SanityImage
            image={value}
            lang={lang}
            sizes="(max-width: 768px) 100vw, 768px"
            className="h-auto w-full object-cover"
          />
          {caption && (
            <figcaption className="text-muted mt-3 text-sm">{caption}</figcaption>
          )}
        </figure>
      )
    },
  },

  block: {
    normal: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
    h2: ({ children }) => (
      <h2 className="font-display mt-10 mb-4 text-3xl">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-display mt-8 mb-3 text-2xl">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-ink mt-6 mb-2 text-lg font-semibold">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-gold my-6 border-l-4 pl-5 italic">{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-6">{children}</ul>,
    number: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-6">{children}</ol>,
  },
  marks: {
    link: ({ value, children }) => {
      const href: string = value?.href ?? '#'
      const external = /^https?:\/\//.test(href)
      return external ? (
        <a
          href={href}
          target={value?.blank ? '_blank' : undefined}
          rel={value?.blank ? 'noopener noreferrer' : undefined}
          className="text-gold-text underline underline-offset-2"
        >
          {children}
        </a>
      ) : (
        <Link href={href} className="text-gold-text underline underline-offset-2">
          {children}
        </Link>
      )
    },
  },
  }
}

export function RichText({ value, lang }: { value: any; lang: Locale }) {
  return <RichTextBlocks blocks={t<any[]>(value, lang)} lang={lang} />
}

/**
 * Cùng bộ renderer, nhưng nhận mảng block ĐÃ giải theo ngôn ngữ.
 *
 * Dùng khi nơi gọi cần tự tách nội dung thành từng đơn vị trước khi render —
 * trang /culinary xếp bốn đoạn của khối "Nhịp một ngày" thành bốn mốc trên
 * một trục dọc, mỗi đoạn một mốc riêng.
 *
 * Tách theo BLOCK (hình dạng dữ liệu), không tách theo dấu câu hay theo cụm
 * chữ mở đầu: mọi cách bóc chuỗi đều vỡ ở ngôn ngữ thứ hai, nơi trật tự từ
 * và dấu câu khác hẳn. Một đoạn trong Sanity = một mốc, sáu ngôn ngữ cùng ra
 * đúng ngần ấy mốc.
 */
export function RichTextBlocks({ blocks, lang }: { blocks?: any[] | null; lang: Locale }) {
  if (!blocks || blocks.length === 0) return null
  return <PortableText value={blocks} components={buildComponents(lang)} />
}
