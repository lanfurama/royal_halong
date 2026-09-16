'use client'

import { useEffect, useState, type RefObject } from 'react'

/**
 * `true` kể từ khi phần tử trôi tới gần khung nhìn, và KHÔNG quay lại `false`.
 *
 * Dùng để hoãn những thứ đắt nằm dưới màn hình đầu — bản đồ Leaflet, iframe
 * YouTube. `next/dynamic` một mình KHÔNG đủ: nó tách chunk riêng nhưng vẫn
 * nạp ngay khi component được render, mà component thì nằm sẵn trong cây
 * ngay từ lần render đầu. Đo trên bản production: trang chủ tải 470KB JS
 * Leaflet + 208KB ô bản đồ OpenStreetMap trước cả khi người xem cuộn tới
 * chúng.
 *
 * Không quay lại `false` là cố ý: cuộn qua rồi cuộn lại mà tháo bản đồ ra
 * thì Leaflet phải dựng lại từ đầu và tải lại ô bản đồ — đắt hơn hẳn việc
 * giữ nó trong DOM.
 */
export function useNearViewport(
  ref: RefObject<Element | null>,
  {
    /** Nạp TRƯỚC khi phần tử lọt vào khung nhìn ngần này, để lúc cuộn tới
     * thì nội dung đã sẵn sàng thay vì bắt đầu tải. */
    rootMargin = '200px',
    /** `false` -> không bao giờ trả `true`. Dùng cho các nhánh chủ động từ
     * chối nạp (vd. `prefers-reduced-motion`, chế độ tiết kiệm dữ liệu). */
    enabled = true,
  }: { rootMargin?: string; enabled?: boolean } = {},
): boolean {
  const [near, setNear] = useState(false)

  useEffect(() => {
    if (!enabled || near) return
    const el = ref.current
    if (!el) return

    // Trình duyệt không có IntersectionObserver -> nạp luôn. Thà trả đúng
    // chi phí như trước khi có tối ưu này, còn hơn một bản đồ không bao giờ
    // xuất hiện.
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setNear(true)
        io.disconnect()
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin, enabled, near])

  return near
}
