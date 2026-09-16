'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { t, type Locale } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'
import { useNearViewport } from '@/lib/use-near-viewport'
import { Container } from '@/components/ui/Container'

// Leaflet đụng `window` khi import -> bắt buộc tắt SSR. Khung chờ tải phải
// cao ĐÚNG bằng bản đồ thật, lệch một pixel là trang nhảy khi Leaflet gắn vào.
const LeafletMap = dynamic(() => import('@/components/ui/LeafletMap').then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => (
    <div
      className="bg-cream h-full min-h-[460px] w-full animate-pulse motion-reduce:animate-none"
      aria-hidden="true"
    />
  ),
})

/** Đổi vòng sau ngần này. Bản thiết kế dùng 7s. */
const ROTATE_MS = 7000

/**
 * Dải "cảm nhận của khách + bản đồ" — hai cột trên một nền kem ngả nâu.
 *
 * Gộp hai thứ vốn là hai khối riêng trong dữ liệu: `homePage.testimonials[]`
 * (trường riêng, không nằm trong `sections[]`) và `mapSection`. Bản thiết kế
 * đặt chúng cạnh nhau vì cả hai đều là "bằng chứng": người khác nói gì, và
 * chỗ này ở đâu.
 *
 * Tự đổi trích dẫn sau 7 giây, NHƯNG:
 * - dừng khi rê chuột hoặc khi focus vào trong (người đang đọc không bị
 *   giật mất câu đang đọc — và đó cũng là yêu cầu WCAG 2.2.2 về nội dung tự
 *   chuyển động quá 5 giây);
 * - không chạy khi người dùng bật `prefers-reduced-motion`;
 * - luôn có dãy nút chấm để tự điều khiển.
 */
export function HomeReviewMap({
  testimonials,
  mapHeading,
  lat,
  lng,
  zoom,
  addressFull,
  brand,
  lang,
}: {
  testimonials: unknown[] | null | undefined
  mapHeading?: any
  lat: number
  lng: number
  zoom: number
  addressFull?: string
  brand: string
  lang: Locale
}) {
  // GROQ trả `null` tường minh khi trường vắng mặt — default parameter chỉ
  // bắt `undefined`.
  const list = ((testimonials ?? []) as any[]).filter((item) => t<string>(item?.quote, lang))
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapNear = useNearViewport(mapRef)

  useEffect(() => {
    if (paused || list.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % list.length), ROTATE_MS)
    return () => clearInterval(timer)
  }, [paused, list.length])

  // `index` có thể trỏ ra ngoài mảng nếu biên tập viên xoá bớt trích dẫn
  // trong lúc trang đang mở (Sanity Live cập nhật tại chỗ, không reload).
  const current = list[Math.min(index, Math.max(list.length - 1, 0))]

  const heading = t<string>(mapHeading, lang) ?? ui('findOnMap', lang)
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

  return (
    <section
      id="map"
      className="bg-cream-alt border-gold/20 border-y"
    >
      <Container size="wide" className="grid gap-14 py-20 lg:grid-cols-2 lg:items-stretch">
        {/* --- Cột trích dẫn --- */}
        {list.length > 0 && current ? (
          <div
            className="flex flex-col justify-between"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <div>
              <h2 className="text-muted flex items-center gap-3.5 text-xs tracking-[0.1em] uppercase">
                {ui('guestReviews', lang)}
                {current.source && (
                  <span className="text-gold-text normal-case">· {current.source}</span>
                )}
              </h2>

              <span
                aria-hidden="true"
                className="font-display text-gold mt-10 block text-[6rem] leading-[0.6]"
              >
                &ldquo;
              </span>

              {/* <figure> bọc blockquote + figcaption: `<figcaption>` chỉ hợp
                  lệ khi là con trực tiếp của `<figure>`.
                  `aria-live="polite"`: nội dung đổi tại chỗ mà không có điều
                  hướng — không thông báo thì người dùng screen reader không
                  biết đã sang trích dẫn khác. */}
              <figure aria-live="polite" className="m-0">
                <blockquote className="font-display mt-2.5 min-h-[9.375rem] text-[clamp(1.375rem,2vw,1.875rem)] leading-[1.4] text-pretty italic">
                  {t<string>(current.quote, lang)}
                </blockquote>
                <figcaption className="mt-7 flex items-center gap-4">
                  <span aria-hidden="true" className="bg-gold block h-px w-11" />
                  <span>
                    <span className="block text-sm font-medium">{current.author}</span>
                    {t<string>(current.heading, lang) && (
                      <span className="text-muted mt-0.5 block text-xs">
                        {t<string>(current.heading, lang)}
                      </span>
                    )}
                  </span>
                </figcaption>
              </figure>
            </div>

            {list.length > 1 && (
              <div className="mt-12 flex gap-2.5">
                {list.map((item: any, dotIndex: number) => (
                  <button
                    key={item._id ?? dotIndex}
                    type="button"
                    onClick={() => setIndex(dotIndex)}
                    aria-label={`${ui('viewReview', lang)} ${dotIndex + 1}`}
                    aria-current={dotIndex === index ? 'true' : undefined}
                    // Vạch nhìn thấy chỉ cao 2px, nhưng nút bọc cao 44px nên
                    // vẫn bấm trúng bằng ngón cái. `py-[21px]` tạo vùng chạm,
                    // `-my-[21px]` thu lại khoảng chiếm chỗ để hàng vạch không
                    // đẩy bố cục cao thêm.
                    //
                    // 21 chứ không phải 20: `py-5` cho 20+2+20 = 42px, hụt
                    // ngưỡng 44px mà chính ghi chú này khẳng định là đã đạt.
                    className="group -my-[21px] py-[21px]"
                  >
                    <span
                      className={`block h-0.5 transition-all duration-400 ${
                        dotIndex === index ? 'bg-gold w-12' : 'bg-gold/30 group-hover:bg-gold/60 w-6'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div />
        )}

        {/* --- Cột bản đồ --- */}
        <div className="relative min-h-[460px]">
          {/* Tiêu đề của khối bản đồ ("TÌM CHÚNG TÔI TRÊN BẢN ĐỒ" trong
              Sanity) không hiện thành chữ trong bản thiết kế — bản đồ tự nói
              lên nó là gì. Vẫn giữ trong cây tiêu đề để cấu trúc trang đúng
              và để người dùng screen reader biết vùng này là gì. */}
          <h2 className="sr-only">{heading}</h2>

          {/* Chỉ dựng bản đồ khi nó trôi tới gần khung nhìn — xem
              `lib/use-near-viewport.ts`. `next/dynamic` một mình vẫn nạp
              ngay lúc render; đo trên bản production thì Leaflet + ô bản đồ
              OSM về hết trước khi người xem cuộn quá khối giới thiệu.

              Chỗ giữ chỗ KHÔNG `animate-pulse` như fallback `loading` của
              `dynamic()`: khối này nằm ngoài màn hình phần lớn thời gian,
              một animation chạy vô ích ở đó chỉ tốn thêm lần vẽ lại. Pulse
              vẫn còn ở đúng lúc có nghĩa — khi chunk đang thật sự tải. */}
          <div ref={mapRef} className="ring-gold/20 h-full w-full overflow-hidden ring-1">
            {mapNear ? (
              <LeafletMap lat={lat} lng={lng} zoom={zoom} className="h-full min-h-[460px] w-full" />
            ) : (
              <div className="bg-cream h-full min-h-[460px] w-full" aria-hidden="true" />
            )}
          </div>

          {/* `z-[500]`: các pane của Leaflet nằm ở z-index 200–700, một lớp
              phủ không khai z-index sẽ chui xuống dưới ô tile bản đồ. 500
              nằm trên pane marker (600 là popup, để nguyên cho Leaflet). */}
          {/* `bottom-9` chứ không `bottom-5`: dòng ghi công "Leaflet |
              OpenStreetMap" nằm sát góc dưới phải và CHỊU RÀNG BUỘC GIẤY
              PHÉP — nó phải đọc được, không được che. */}
          <div className="pointer-events-none absolute inset-x-5 bottom-9 z-[500] flex flex-wrap items-center justify-between gap-4">
            {addressFull && (
              <p className="text-ink bg-cream-hi/92 px-3.5 py-2.5 text-[0.78125rem] backdrop-blur-[6px]">
                <span className="sr-only">{brand} — </span>
                {addressFull}
              </p>
            )}
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gold-deep text-cream-hi hover:bg-gold pointer-events-auto inline-flex min-h-11 items-center gap-2 px-4 text-[0.6875rem] font-semibold tracking-[0.1em] uppercase transition-colors"
            >
              {ui('getDirections', lang)}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </Container>
    </section>
  )
}
