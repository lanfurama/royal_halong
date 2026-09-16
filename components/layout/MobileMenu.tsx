'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { SmartLink } from '@/components/ui/SmartLink'
import { t, type Locale } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'

export function MobileMenu({
  lang,
  items,
  bookingItem,
}: {
  lang: Locale
  items: any[]
  /** Mục "ĐẶT PHÒNG" — bản thiết kế đặt nó thành nút vàng đặc ở ĐÁY panel,
   * tách khỏi danh sách link. Tuỳ chọn: test render `<MobileMenu>` trần
   * không truyền prop này. */
  bookingItem?: any
}) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()

  // Đóng khi điều hướng sang trang khác. Header/MobileMenu không remount
  // giữa các lần chuyển trang trong /[lang]/*, chỉ `children` đổi. Không có
  // effect này thì bấm một link trong panel sẽ điều hướng trong khi overlay
  // `fixed inset-0` và khoá cuộn nền vẫn còn nguyên, che mất trang mới.
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

  // Hook luôn chạy đủ ở trên trước khi rẽ nhánh render — không có gì để mở
  // thì không render nút hamburger lẫn panel rỗng.
  if (items.length === 0 && !bookingItem) return null

  const close = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  // Link cấp 1 trong panel: Playfair cỡ lớn, gạch chân bằng đường vàng mảnh
  // — đúng bản thiết kế, và nhân tiện cho mỗi hàng chiều cao thật > 44px.
  const topLink =
    'font-display text-ink hover:text-gold border-gold/25 flex min-h-14 items-center border-b text-2xl transition-colors'

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        // Header giờ nền kem: icon phải là vàng/nâu, không phải trắng.
        // Viền vàng mảnh biến nó thành một nút thấy rõ thay vì ba gạch trôi
        // nổi — bản thiết kế vẽ đúng như vậy.
        className="border-gold/25 text-gold flex size-11 items-center justify-center border nav:hidden"
      >
        <span className="sr-only">{ui('openMenu', lang)}</span>
        <span aria-hidden="true" className="flex flex-col gap-[5px]">
          <span className="bg-gold block h-[1.5px] w-5" />
          <span className="bg-gold block h-[1.5px] w-5" />
          <span className="bg-gold block h-[1.5px] w-3.5" />
        </span>
      </button>

      {/* Lớp phủ nền. Là phần tử RIÊNG, không nằm trong `#mobile-menu`: nếu
          đặt bên trong thì `panel.querySelectorAll('a, button')` của bẫy
          focus sẽ không thấy nó (nó là <div>), nhưng chiều rộng panel lại
          phải phủ kín màn hình để bắt được click ra ngoài — hai yêu cầu
          ngược nhau. Tách ra thì panel giữ đúng bề rộng 380px của bản thiết
          kế mà vẫn đóng được khi chạm ra ngoài. */}
      {open && (
        <div
          aria-hidden="true"
          onClick={close}
          className="fixed inset-0 z-50 bg-[rgb(20_15_5/0.55)] backdrop-blur-[4px] nav:hidden"
        />
      )}

      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="bg-cream border-gold/25 fixed inset-y-0 right-0 z-51 flex w-[min(380px,90vw)] flex-col overflow-y-auto border-l px-6 pb-8 sm:px-9"
        // Panel dính cả hai mép trên iOS: chừa notch/thanh home. Đặt qua
        // style vì `env()` không biểu diễn được bằng class Tailwind tĩnh.
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 1.75rem)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)',
        }}
      >
        <div className="mb-6 flex shrink-0 items-center justify-between">
          <span className="text-gold text-[0.6875rem] tracking-[0.14em] uppercase">{ui('menu', lang)}</span>
          <button
            type="button"
            onClick={close}
            className="text-gold -mr-2 flex size-11 items-center justify-center text-2xl leading-none"
          >
            <span className="sr-only">{ui('closeMenu', lang)}</span>
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <nav aria-label={ui('mainMenuMobile', lang)} className="flex-1">
          <ul>
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
                <li key={index}>
                  {hasOwnLink ? (
                    <SmartLink link={item.link} lang={lang} className={topLink}>
                      {label}
                    </SmartLink>
                  ) : (
                    label && (
                      <p
                        className={`${topLink} text-muted pointer-events-none`}
                      >
                        {label}
                      </p>
                    )
                  )}

                  {children.length > 0 && (
                    <ul className="border-gold/25 mb-2 ml-1 border-l pl-4">
                      {children.map((child: any, childIndex: number) => (
                        <li key={childIndex}>
                          <SmartLink
                            link={child.link}
                            lang={lang}
                            className="text-body hover:text-gold flex min-h-11 items-center text-sm transition-colors"
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

        {bookingItem && (
          <SmartLink
            link={bookingItem.link}
            lang={lang}
            className="bg-gold text-cream-hi hover:bg-gold-deep mt-8 flex min-h-13 shrink-0 items-center justify-center text-xs font-semibold tracking-[0.1em] uppercase transition-colors"
          >
            {t<string>(bookingItem.label, lang)}
          </SmartLink>
        )}
      </div>
    </>
  )
}
