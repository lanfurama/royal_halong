'use client'

import { useEffect, useRef, useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
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
 * Video giới thiệu ở khối `HomeIntro`, hai tầng:
 *
 * 1. **Xem trước tại chỗ** — tự chạy, TẮT TIẾNG, lặp, không có thanh điều
 *    khiển, phủ kín khung ảnh dọc 4:5 của bản thiết kế.
 * 2. **Bấm vào** — mở lightbox 16:9 có tiếng và có điều khiển đầy đủ.
 *
 * Vì sao phải tách hai tầng thay vì nhúng một iframe cho xong: khung của bản
 * thiết kế là ẢNH DỌC 4:5, còn video là 16:9. Nhét thẳng 16:9 vào 4:5 thì
 * YouTube tự viền đen — đo được 632×790 khung nhưng vùng hình thật chỉ
 * 632×356, thừa 217px đen trên và 217px dưới. Tầng 1 giải bằng cách phóng
 * iframe lên cho PHỦ KÍN rồi cắt hai bên (`min-w-full min-h-full` +
 * `aspect-video`, xem ghi chú tại chỗ); tầng 2 trả lại đúng 16:9 khi người
 * xem thật sự muốn xem.
 *
 * `youtube-nocookie.com` thay cho `youtube.com`: không đặt cookie theo dõi
 * cho tới khi video thực sự chạy.
 *
 * ĐÁNH ĐỔI ĐÃ ĐƯỢC CHỦ DỰ ÁN CHỌN: bản trước là "facade" thuần — chỉ ảnh
 * tĩnh, bấm mới nạp iframe — để không khách nào phải tải ~1.5MB JavaScript
 * của YouTube cho một video phần lớn không xem. Chủ dự án chọn đổi sang tự
 * chạy. Hai thứ dưới đây giữ lại phần lớn lợi ích đó, ĐỪNG BỎ:
 *
 * - `IntersectionObserver`: iframe chỉ nạp khi khối trôi tới gần khung nhìn.
 *   Khối này nằm dưới màn hình đầu, nên khách thoát ở hero không trả đồng
 *   nào. Bỏ nó đi là quay lại đúng chi phí mà cả mẫu facade cố tránh.
 * - `prefers-reduced-motion`: bật thì KHÔNG nạp bản xem trước, giữ ảnh tĩnh
 *   + nút phát. Một video tự chạy lặp vô hạn là đúng thứ cờ này nói là
 *   không muốn.
 */
export function VideoFacade({
  videoUrl,
  lang,
  children,
}: {
  videoUrl: string
  lang: Locale
  /** Ảnh nền (thumbnail) — truyền vào từ Server Component để `SanityImage`
   * không phải vượt ranh giới client. Vẫn là ảnh poster trong lúc bản xem
   * trước chưa nạp, và là hình duy nhất khi `prefers-reduced-motion`. */
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState(false)
  const hostRef = useRef<HTMLDivElement>(null)
  const id = youTubeId(videoUrl)

  useEffect(() => {
    if (!id) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const host = hostRef.current
    if (!host) return

    // `rootMargin` cho iframe bắt đầu nạp TRƯỚC khi khối lọt vào khung nhìn,
    // để lúc người xem cuộn tới thì video đã chạy chứ không phải đứng chờ
    // khung hình đầu tiên.
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setPreview(true)
        io.disconnect()
      },
      { rootMargin: '300px' },
    )
    io.observe(host)
    return () => io.disconnect()
  }, [id])

  if (!id) {
    // URL không phải YouTube nhận dạng được -> vẫn hiện ảnh, bỏ nút phát.
    return <>{children}</>
  }

  const embed = `https://www.youtube-nocookie.com/embed/${id}`

  return (
    <div ref={hostRef} className="relative h-full w-full">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block h-full w-full cursor-pointer overflow-hidden"
      >
        <span className="sr-only">{ui('playVideo', lang)}</span>
        {children}

        {preview && (
          <iframe
            // `loop=1` một mình KHÔNG lặp được video đơn — YouTube chỉ lặp
            // playlist, nên phải kèm `playlist=<chính id này>`. Thiếu nó thì
            // hết 2 phút 24 là khung hình đứng im ở màn hình kết thúc.
            src={`${embed}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1`}
            title={ui('playVideo', lang)}
            // Thuần trang trí: bản có tiếng và có điều khiển nằm trong
            // lightbox. Ẩn khỏi cây trợ năng và khỏi thứ tự Tab, nếu không
            // người dùng bàn phím Tab vào một iframe không điều khiển được.
            aria-hidden="true"
            tabIndex={-1}
            allow="autoplay; encrypted-media; picture-in-picture"
            // PHỦ KÍN khung 4:5 rồi cắt hai bên, thay vì co vừa khung và để
            // YouTube viền đen: `aspect-video` giữ 16:9, `min-w-full` +
            // `min-h-full` buộc nó phải đủ lớn theo CẢ HAI chiều (ở 4:5,
            // ràng buộc chiều cao thắng nên bề ngang nở ra ~2.2 lần khung),
            // rồi căn giữa và để `overflow-hidden` của cha cắt phần thừa.
            // `pointer-events-none` để cú bấm rơi xuống <button> bọc ngoài
            // chứ không bị iframe nuốt.
            className="pointer-events-none absolute top-1/2 left-1/2 aspect-video min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
          />
        )}

        <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
          <span className="border-gold rhl-animate grid size-21 place-items-center rounded-pill border bg-[rgb(143_106_28/0.8)] backdrop-blur-[6px] transition-transform duration-300 group-hover:scale-110 [animation:rhl-pulse_2.4s_infinite]">
            {/* Tam giác dựng bằng viền CSS, đúng bản thiết kế — không cần tải
                thêm một icon SVG cho một hình ba cạnh. `ml` bù phần lệch tâm
                thị giác của tam giác trong hình tròn. */}
            <span className="ml-1.5 block h-0 w-0 border-y-[11px] border-l-[18px] border-y-transparent border-l-[#fff8e8]" />
          </span>
        </span>
      </button>

      {/* Cùng thư viện lightbox với `HomeGallery`/`GalleryCarouselSection` —
          nền tối, Escape, bấm ra ngoài để đóng, quản lý focus đều lấy sẵn từ
          đó, không dựng một modal thứ hai với hợp đồng phím riêng. */}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src: embed }]}
        labels={{ Close: ui('closeVideo', lang) }}
        controller={{ closeOnBackdropClick: true }}
        carousel={{ finite: true }}
        render={{
          // Chỉ có một slide -> bỏ hẳn hai mũi tên, chúng không dẫn đi đâu.
          buttonPrev: () => null,
          buttonNext: () => null,
          // `max-w` theo CẢ bề ngang lẫn chiều cao khung nhìn: chỉ giới hạn
          // bề ngang thì ở màn thấp (laptop 13" ngang màn) khung 16:9 cao
          // quá và bị tràn ra ngoài đỉnh/đáy.
          slide: () => (
            <div className="relative aspect-video w-[min(92vw,calc(88vh*16/9))]">
              <iframe
                src={`${embed}?autoplay=1&rel=0`}
                title={ui('playVideo', lang)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          ),
        }}
      />
    </div>
  )
}
