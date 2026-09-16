'use client'

import { useEffect, useRef, useState } from 'react'
import type { Locale } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'

/**
 * Lấy id video từ các dạng URL YouTube thường gặp. Trả `null` cho mọi thứ
 * không nhận dạng được — nơi gọi khi đó không render nút phát, thay vì nhúng
 * một iframe trỏ vào URL hỏng.
 */
export function youTubeId(url: string | null | undefined): string | null {
  if (!url) return null
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  )
  return match ? match[1] : null
}

/**
 * Ảnh tĩnh + nút phát; chỉ khi người dùng bấm mới nạp iframe YouTube.
 *
 * Vì sao không nhúng thẳng iframe: một iframe YouTube kéo theo ~1.5 MB
 * JavaScript của bên thứ ba và đặt cookie NGAY KHI TẢI TRANG, kể cả khi
 * không ai bấm phát — trên trang chủ thì đó là chi phí mọi khách phải trả
 * cho một video phần lớn không xem. Đây là mẫu "facade": nạp theo yêu cầu.
 *
 * `youtube-nocookie.com` thay cho `youtube.com`: không đặt cookie theo dõi
 * cho tới khi video thực sự chạy.
 *
 * Bản thiết kế gốc để `onClick={() => alert('Mở video giới thiệu')}` — một
 * chỗ giữ sẵn. Đây là phần nối vào dữ liệu thật (`heroSection.videoUrl`).
 */
export function VideoFacade({
  videoUrl,
  lang,
  children,
}: {
  videoUrl: string
  lang: Locale
  /** Ảnh nền (thumbnail) — truyền vào từ Server Component để `SanityImage`
   * không phải vượt ranh giới client. */
  children: React.ReactNode
}) {
  const [playing, setPlaying] = useState(false)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const id = youTubeId(videoUrl)

  // Chuyển focus vào iframe sau khi nó xuất hiện: người dùng bàn phím vừa
  // bấm Enter trên một nút VỪA BIẾN MẤT, focus sẽ rơi về <body> và họ mất
  // dấu vị trí trong trang.
  useEffect(() => {
    if (playing) frameRef.current?.focus()
  }, [playing])

  // Escape đóng video, trả focus về nút phát — cùng hợp đồng với MobileMenu
  // và LangSwitcher, để cả site chỉ có một cách thoát khỏi thứ đang mở.
  useEffect(() => {
    if (!playing) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setPlaying(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [playing])

  if (!id) {
    // URL không phải YouTube nhận dạng được -> vẫn hiện ảnh, bỏ nút phát.
    return <>{children}</>
  }

  if (playing) {
    return (
      <div className="relative h-full w-full bg-black">
        <iframe
          ref={frameRef}
          tabIndex={-1}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={ui('playVideo', lang)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
        <button
          type="button"
          onClick={() => {
            setPlaying(false)
            buttonRef.current?.focus()
          }}
          className="bg-cream-hi text-ink hover:bg-gold hover:text-cream-hi absolute top-3 right-3 z-10 flex size-11 items-center justify-center text-xl leading-none transition-colors"
        >
          <span className="sr-only">{ui('closeVideo', lang)}</span>
          <span aria-hidden="true">×</span>
        </button>
      </div>
    )
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative block h-full w-full cursor-pointer"
    >
      <span className="sr-only">{ui('playVideo', lang)}</span>
      {children}
      <span
        aria-hidden="true"
        className="absolute inset-0 grid place-items-center"
      >
        <span className="border-gold rhl-animate grid size-21 place-items-center rounded-pill border bg-[rgb(143_106_28/0.8)] backdrop-blur-[6px] transition-transform duration-300 group-hover:scale-110 [animation:rhl-pulse_2.4s_infinite]">
          {/* Tam giác dựng bằng viền CSS, đúng bản thiết kế — không cần tải
              thêm một icon SVG cho một hình ba cạnh. `ml` bù phần lệch tâm
              thị giác của tam giác trong hình tròn. */}
          <span className="ml-1.5 block h-0 w-0 border-y-[11px] border-l-[18px] border-y-transparent border-l-[#fff8e8]" />
        </span>
      </span>
    </button>
  )
}
