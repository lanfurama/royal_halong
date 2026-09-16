'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { SmartLink } from '@/components/ui/SmartLink'
import { t, type Locale } from '@/lib/i18n'

export function MobileMenu({ lang, items }: { lang: Locale; items: any[] }) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()

  // Đóng khi điều hướng sang trang khác. `app/[lang]/layout.tsx` — nơi
  // Header/MobileMenu sống — không remount giữa các lần chuyển trang trong
  // /[lang]/*, chỉ `children` đổi. Không có effect này thì bấm một link
  // trong panel sẽ điều hướng trong khi overlay `fixed inset-0` và khoá
  // cuộn nền vẫn còn nguyên, che mất trang mới.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

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
        className="-mr-2 flex size-11 items-center justify-center text-white lg:hidden"
      >
        <span className="sr-only">Mở menu</span>
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
      </button>

      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="bg-ink on-dark fixed inset-0 z-50 flex flex-col overflow-y-auto"
        // Panel dính cả hai mép trên iOS: chừa notch/thanh home. Đặt qua
        // style vì `env()` không biểu diễn được bằng class Tailwind tĩnh.
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex h-18 shrink-0 items-center justify-end px-3">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              buttonRef.current?.focus()
            }}
            className="flex size-11 items-center justify-center text-white"
          >
            <span className="sr-only">Đóng menu</span>
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav aria-label="Menu chính (di động)" className="flex-1 px-5 pb-8">
          <ul className="divide-y divide-white/10">
            {items.map((item, index) => {
              const label = t<string>(item.label, lang)
              const children: any[] = item.children ?? []
              // Nhóm cha không có `link` (HỘI NGHỊ & TIỆC CƯỚI, TIN TỨC):
              // `SmartLink` trả null, nên trước đây panel hiện các mục con
              // thụt lề mà KHÔNG có tên nhóm — người dùng thấy 4 link lơ
              // lửng không rõ thuộc về đâu. Render nhãn thành tiêu đề nhóm
              // (chữ thường, không phải link) khi không có đích để đi tới.
              const hasOwnLink = Boolean(item.link)

              return (
                <li key={index} className="py-1">
                  {hasOwnLink ? (
                    <SmartLink
                      link={item.link}
                      lang={lang}
                      className="text-gold-hi flex min-h-12 items-center text-base tracking-widest uppercase"
                    >
                      {label}
                    </SmartLink>
                  ) : (
                    label && (
                      <p className="flex min-h-12 items-center text-base tracking-widest text-white/50 uppercase">
                        {label}
                      </p>
                    )
                  )}

                  {children.length > 0 && (
                    <ul className="border-gold/30 mb-2 ml-1 border-l pl-4">
                      {children.map((child: any, childIndex: number) => (
                        <li key={childIndex}>
                          <SmartLink
                            link={child.link}
                            lang={lang}
                            className="flex min-h-12 items-center text-sm text-white/85"
                          >
                            {t<string>(child.label, lang)}
                          </SmartLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </>
  )
}
