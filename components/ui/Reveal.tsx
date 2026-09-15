'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Hiện dần khi cuộn tới. Thay cho anime.js + waypoints của bản gốc.
 * Tôn trọng prefers-reduced-motion: người dùng tắt chuyển động thì hiện ngay.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  // Trước đây chỉ dùng prefers-reduced-motion để BỎ QUA việc chờ cuộn tới
  // (hiện luôn), nhưng vẫn giữ nguyên class `transition-all duration-700` —
  // nghĩa là opacity vẫn chạy animation 700ms như thường, chỉ là bắt đầu sớm
  // hơn. Quét axe ngay sau khi trang tải (trước khi transition kết thúc) bắt
  // trúng một khung hình opacity phân số của CHÍNH transition đó, ra màu chữ
  // pha trộn với nền có contrast dưới ngưỡng — lỗi thật, không phải axe sai:
  // "giảm chuyển động" phải tắt hẳn animation, không chỉ tắt độ trễ chờ cuộn.
  // Theo dõi riêng `reducedMotion` để bỏ hẳn class transition khi bật.
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setReducedMotion(true)
      setShown(true)
      return
    }
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: reducedMotion ? '0ms' : `${delay}ms` }}
      className={`${reducedMotion ? '' : 'transition-all duration-700 ease-out'} ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}
