'use client'

import { useEffect, useRef, useState } from 'react'
import { SmartLink } from '@/components/ui/SmartLink'
import { t, type Locale } from '@/lib/i18n'

export function MobileMenu({ lang, items }: { lang: Locale; items: any[] }) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Đóng bằng Escape và khoá cuộn nền khi mở.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open])

  // Giữ focus trong panel khi đang mở.
  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    const focusables = panel.querySelectorAll<HTMLElement>('a, button')
    focusables[0]?.focus()

    const onTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    panel.addEventListener('keydown', onTab)
    return () => panel.removeEventListener('keydown', onTab)
  }, [open])

  // Hook luôn chạy đủ ở trên trước khi rẽ nhánh render — không có menu thì
  // không có gì để mở, không render nút hamburger lẫn panel rỗng.
  if (items.length === 0) return null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="p-2 text-white lg:hidden"
      >
        <span className="sr-only">Mở menu</span>
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="bg-ink fixed inset-0 z-50 overflow-y-auto p-6"
      >
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            buttonRef.current?.focus()
          }}
          className="mb-8 ml-auto block p-2 text-white"
        >
          <span className="sr-only">Đóng menu</span>
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <nav aria-label="Menu chính">
          <ul className="space-y-1">
            {items.map((item, index) => (
              <li key={index}>
                <SmartLink
                  link={item.link}
                  lang={lang}
                  className="text-gold-hi block py-3 text-lg tracking-wide uppercase"
                >
                  {t(item.label, lang)}
                </SmartLink>
                {item.children?.length > 0 && (
                  <ul className="mb-2 ml-4 space-y-1">
                    {item.children.map((child: any, childIndex: number) => (
                      <li key={childIndex}>
                        <SmartLink
                          link={child.link}
                          lang={lang}
                          className="block py-2 text-sm text-white/80"
                        >
                          {t(child.label, lang)}
                        </SmartLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  )
}
