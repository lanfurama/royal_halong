'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/** Cuộn quá ngần này thì header rời trạng thái "trôi trên ảnh". 32px đủ xa để
 * một cú lăn chuột nhỏ hay đà nảy của iOS không làm thanh nhấp nháy, và đủ
 * gần để người dùng thấy nó phản ứng ngay khi bắt đầu cuộn. */
const SCROLL_THRESHOLD = 32

/**
 * Vỏ `<header>`.
 *
 * Toàn bộ phần NHÌN THẤY của header (hai trạng thái sáng/tối, nền kính, chiều
 * cao, màu chữ) nằm ở `.rhl-header` trong `app/globals.css`. Component này chỉ
 * bật/tắt đúng một attribute — `data-scrolled` — vì đó là thứ DUY NHẤT CSS
 * không tự biết được. Việc "trang này có mở đầu bằng hero tối không" đã được
 * `body:has(main > .rhl-hero:first-child)` trả lời ngay trong CSS, nên không
 * có prop nào phải truyền tay xuống đây và không có nhịp loé nền kem trước
 * khi JS hydrate xong.
 *
 * Đặt attribute bằng DOM chứ không bằng `useState`: React sẽ phải render lại
 * TOÀN BỘ cây con (menu, chuyển ngôn ngữ, nút đặt phòng) mỗi lần vượt ngưỡng,
 * trong khi kết quả duy nhất là một attribute đổi giá trị. `children` ở đây
 * còn là cây do Server Component sinh ra — giữ nó bất động là cách rẻ nhất.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Nhớ giá trị đã ghi để không chạm DOM ở mỗi khung hình cuộn — trình
    // duyệt bắn `scroll` liên tục, còn attribute chỉ đổi hai lần mỗi chuyến.
    let applied: boolean | null = null
    const sync = () => {
      const scrolled = window.scrollY > SCROLL_THRESHOLD
      if (scrolled === applied) return
      applied = scrolled
      el.toggleAttribute('data-scrolled', scrolled)
    }

    // Chạy ngay một lần: người dùng tải lại trang ở giữa bài (trình duyệt tự
    // khôi phục vị trí cuộn) phải thấy thanh kính chứ không phải chữ kem trôi
    // trên nền sáng.
    sync()
    window.addEventListener('scroll', sync, { passive: true })
    return () => window.removeEventListener('scroll', sync)
  }, [])

  return (
    <header ref={ref} className="rhl-header">
      {children}
    </header>
  )
}
