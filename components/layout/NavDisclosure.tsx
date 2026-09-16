'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { SmartLink } from '@/components/ui/SmartLink'
import { t, type Locale } from '@/lib/i18n'

/**
 * Nhóm menu có menu con trên thanh điều hướng desktop.
 *
 * Vì sao cần component riêng (đo được, không phải sở thích):
 *
 * 1. Hai mục `HỘI NGHỊ & TIỆC CƯỚI` và `TIN TỨC` trong Sanity có `label`
 *    nhưng KHÔNG có `link` — chúng là nhóm cha thuần. Header cũ render nhãn
 *    qua `<SmartLink link={item.link}>`, mà `SmartLink` trả `null` khi thiếu
 *    `link` (đúng theo thiết kế của nó: không có tên truy cập thì không
 *    render). Hệ quả đo được trên bản production: `<li>` rộng **0px**, nhãn
 *    không hiện, và 4 trang con chỉ mở được khi hover đúng một phần tử rộng
 *    0px — tức là không bao giờ. Bốn đích điều hướng biến mất khỏi desktop.
 *
 * 2. Menu con cũ chỉ mở bằng `group-hover`/`group-focus-within`. Trên thiết
 *    bị có chạm + chuột (laptop cảm ứng, tablet nối bàn phím ở >= 1024px),
 *    chạm vào mục cha không mở được gì. Nút thật + trạng thái React mở được
 *    bằng chuột, bàn phím và chạm.
 *
 * Nhãn giờ nằm trên `<button>` (luôn render, không phụ thuộc `link`), nên
 * nhóm cha không-link vẫn hiện tên và vẫn mở được menu con.
 */
export function NavDisclosure({
  label,
  items,
  lang,
}: {
  label: string
  items: any[]
  lang: Locale
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  // Đóng khi bấm ra ngoài hoặc focus đi khỏi cụm. Không dùng `onBlur` trên
  // từng phần tử: focus nhảy giữa button và các link BÊN TRONG cụm cũng kích
  // hoạt blur, panel sẽ đóng ngay khi người dùng Tab vào menu con.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onFocusIn = (event: FocusEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
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

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="hover:text-gold-hi flex h-11 items-center gap-1.5 text-xs tracking-widest whitespace-nowrap uppercase transition-colors"
      >
        {label}
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

      {/* `hidden` (không phải chỉ opacity-0) để menu đang đóng nằm ngoài thứ
          tự Tab — panel mờ nhưng vẫn focus được là lỗi bàn phím kinh điển của
          dropdown chỉ dùng CSS. */}
      <div
        id={panelId}
        hidden={!open}
        className="bg-ink-soft ring-gold/20 shadow-lift absolute top-full left-0 z-50 min-w-60 rounded-b-card py-2 ring-1"
      >
        <ul>
          {items.map((child: any, index: number) => (
            <li key={index}>
              <SmartLink
                link={child.link}
                lang={lang}
                className="hover:text-gold-hi hover:bg-white/5 flex min-h-11 items-center px-5 text-xs tracking-wide uppercase transition-colors"
              >
                {t<string>(child.label, lang)}
              </SmartLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
