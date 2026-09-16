'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT, type Locale } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'
import { resolveSlug, type SlugField } from '@/lib/routes'

/**
 * Chỉ đổi prefix locale, giữ nguyên slug. Dùng làm FALLBACK khi nơi gọi
 * không truyền `slug`. Hành vi thật (khi có `slug`) suy ra đúng slug riêng
 * theo từng locale qua `resolveSlug`.
 */
export function swapLocalePrefix(pathname: string, from: Locale, to: Locale): string {
  return pathname.replace(new RegExp(`^/${from}`), `/${to}`)
}

/**
 * Bộ chuyển ngôn ngữ.
 *
 * Vì sao là DROPDOWN chứ không phải dãy link như trước: site có sáu ngôn ngữ.
 * Dãy cũ render mỗi locale một vùng chạm 44×44 — sáu cái là 264px nằm ngang
 * trong một header vốn đã phải chứa logo, 8 mục menu và nút đặt phòng. Đo
 * được ở 1440px: dãy ấy đẩy mục menu cuối ("ƯU ĐÃI") đè lên chính nó.
 *
 * Nội dung panel vẫn là `<a hreflang>` THẬT (không phải `<button>` +
 * router.push): người dùng mở tab mới bằng chuột giữa vẫn được, và cây liên
 * kết giữa các bản dịch không phụ thuộc JS. Bản thân tín hiệu hreflang cho
 * công cụ tìm kiếm đã nằm ở `alternates.languages` trong metadata
 * (`lib/seo.ts`), nên việc panel đóng lúc đầu không làm mất gì về SEO.
 */
export function LangSwitcher({ lang, slug }: { lang: Locale; slug?: SlugField | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  // Đóng khi bấm ra ngoài, khi focus rời khỏi cụm, hoặc khi nhấn Escape.
  // Không dùng `onBlur` trên từng phần tử: focus nhảy giữa nút và các link
  // BÊN TRONG cụm cũng kích hoạt blur, panel sẽ đóng ngay khi Tab vào nó.
  useEffect(() => {
    if (!open) return
    const inside = (target: EventTarget | null) => wrapRef.current?.contains(target as Node)
    const onPointerDown = (event: PointerEvent) => {
      if (!inside(event.target)) setOpen(false)
    }
    const onFocusIn = (event: FocusEvent) => {
      if (!inside(event.target)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Đóng sau khi điều hướng sang bản dịch khác — cùng lý do với MobileMenu:
  // header không remount giữa các lần chuyển trang trong /[lang]/*.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  function hrefFor(locale: Locale): string {
    // Bug thật: hoán prefix thuần (`/vi/<slug-vi>` -> `/en/<slug-vi>`) giả
    // định slug giống nhau ở mọi locale. `hreflang` (`lib/seo.ts`) đã suy ra
    // đúng slug riêng từng locale qua `resolveSlug` — ngày biên tập viên
    // thêm slug riêng, hoán prefix trỏ sai trong khi hreflang trỏ đúng.
    // `slug === undefined` (nơi gọi chưa truyền) mới rơi về hoán prefix.
    if (slug === undefined) return swapLocalePrefix(pathname, lang, locale)
    const localeSlug = resolveSlug(slug, locale)
    return localeSlug ? `/${locale}/${localeSlug}` : `/${locale}`
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        // Tên truy cập ghép "Ngôn ngữ" + tên ngôn ngữ đang chọn, vì phần chữ
        // nhìn thấy chỉ là "VI"/"日本語" — không nói lên đây là nút gì.
        aria-label={`${ui('language', lang)}: ${LOCALE_LABELS[lang]}`}
        onClick={() => setOpen((value) => !value)}
        className="text-muted hover:text-ink flex h-11 items-center gap-1.5 px-2 text-xs tracking-[0.04em] transition-colors"
      >
        <span aria-hidden="true">{LOCALE_SHORT[lang]}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 4l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* `hidden` (không chỉ opacity-0) để panel đang đóng nằm ngoài thứ tự
          Tab — panel mờ nhưng vẫn focus được là lỗi bàn phím kinh điển. */}
      <ul
        id={panelId}
        hidden={!open}
        className="bg-cream-soft ring-gold/25 shadow-lift absolute top-full right-0 z-50 min-w-40 py-1.5 ring-1"
      >
        {LOCALES.map((locale) => {
          const active = locale === lang
          return (
            <li key={locale}>
              <Link
                href={hrefFor(locale)}
                hrefLang={locale}
                // `lang` trên chính link: tên ngôn ngữ được viết BẰNG ngôn ngữ
                // đó ("日本語" trong một trang tiếng Việt). Không khai thì
                // screen reader đọc chuỗi Nhật bằng bộ quy tắc phát âm tiếng
                // Việt — ra âm vô nghĩa.
                lang={locale}
                aria-current={active ? 'true' : undefined}
                className={`flex min-h-11 items-center px-4 text-sm transition-colors ${
                  active ? 'text-gold-text font-semibold' : 'text-ink hover:bg-gold/8'
                }`}
              >
                {LOCALE_LABELS[locale]}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
