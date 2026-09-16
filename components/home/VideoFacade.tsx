'use client'

import { useEffect, useRef, useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import type { Locale } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'
import { useNearViewport } from '@/lib/use-near-viewport'

/**
 * Lấy id video từ các dạng URL YouTube thường gặp. Trả `null` cho mọi thứ
 * không nhận dạng được — nơi gọi khi đó không render nút phát, thay vì nhúng
 * một iframe trỏ vào URL hỏng.
 */
/**
 * Tỉ lệ khung hình THẬT của phần hình trong video giới thiệu.
 *
 * File trên YouTube là 16:9 đúng chuẩn, nhưng nội dung bên trong nó được
 * dựng ở 2.35:1 (CinemaScope) và hai dải đen đã được NUNG THẲNG vào từng
 * khung hình. Đo trong lightbox — một khung 16:9 thật, không có CSS nào can
 * thiệp: 12/12 mẫu đều cho viền 91px trên / 89px dưới trên khung cao 745px,
 * tức 24% chiều cao; phần hình còn lại 1325×565 = 2.345.
 *
 * Vì là pixel của chính video nên KHÔNG có cách nào bằng CSS làm chúng biến
 * mất — chỉ có thể phóng to rồi cắt bỏ. Hai chỗ dùng hằng số này (bản xem
 * trước và lightbox) đều làm đúng thế.
 *
 * ⚠️ ĐÂY LÀ THUỘC TÍNH CỦA ĐÚNG VIDEO HIỆN TẠI, không phải của component.
 * `videoUrl` lấy từ Sanity, biên tập viên đổi được. Thay bằng một video 16:9
 * bình thường mà quên sửa chỗ này thì 12% mép trên và mép dưới của video mới
 * sẽ bị cắt oan. Cách sửa dứt điểm là xuất lại video không kèm viền đen, rồi
 * đặt hằng số này về `16 / 9`.
 */
const TI_LE_NOI_DUNG = 2.35
const TI_LE_FILE = 16 / 9
/** Phải phóng chiều cao iframe lên bấy nhiêu lần thì phần hình (đã trừ viền
 *  nung sẵn) mới lấp đầy đúng chiều cao khung chứa. */
const BU_VIEN_NUNG = TI_LE_NOI_DUNG / TI_LE_FILE

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
 * - Hoãn theo khung nhìn (`useNearViewport`): iframe chỉ nạp khi khối trôi
 *   tới gần màn hình. Khối này nằm dưới màn hình đầu, nên khách thoát ở hero
 *   không trả đồng nào. Bỏ nó đi là quay lại đúng chi phí mà mẫu facade cố
 *   tránh.
 * - `prefers-reduced-motion` và mạng chậm / tiết kiệm dữ liệu: không nạp bản
 *   xem trước, giữ ảnh tĩnh + nút phát (xem ba nhánh trong `useEffect`).
 *
 * Con số đo được trên bản production, trang chủ 1440×900, tắt cache: bản xem
 * trước tốn 3.0MB JS + 0.5MB CSS của trình phát YouTube + ~6.9MB luồng video
 * — trong khi TOÀN BỘ phần còn lại của trang (HTML, JS, CSS, font, ảnh
 * Sanity) chỉ khoảng 1.8MB. Muốn cắt tiếp thì chỉ còn một cách thật: bỏ tự
 * chạy, quay lại facade bấm-mới-phát.
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
  const [choPhep, setChoPhep] = useState(false)
  const hostRef = useRef<HTMLDivElement>(null)
  const id = youTubeId(videoUrl)

  /**
   * Bản xem trước là thứ ĐẮT NHẤT trên trang chủ — đo trên bản production:
   * 3.0MB JavaScript + 0.5MB CSS của trình phát YouTube, cộng ~6.9MB luồng
   * video, tức gấp khoảng sáu lần toàn bộ phần còn lại của trang cộng lại.
   * Ba nhánh dưới đây từ chối nạp nó; người xem vẫn có ảnh tĩnh + nút phát
   * và bấm vào vẫn mở lightbox đầy đủ, nên không ai mất chức năng.
   */
  useEffect(() => {
    // Một video tự chạy lặp vô hạn là đúng thứ cờ này nói là không muốn.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const conn = (navigator as any).connection
    // Người dùng bật "tiết kiệm dữ liệu" trong trình duyệt/hệ điều hành.
    if (conn?.saveData) return
    // Mạng chậm: 10MB trên 3G là hàng chục giây và tiền data thật của khách.
    // `effectiveType` là ước lượng của trình duyệt theo tốc độ đo được, không
    // phải loại sóng thật — đúng thứ cần ở đây.
    if (typeof conn?.effectiveType === 'string' && /(^|-)[23]g$/.test(conn.effectiveType)) return

    setChoPhep(true)
  }, [])

  // `rootMargin: '0px'` — KHÔNG dùng mặc định 200px của hook như bản đồ.
  // Ở 1440×900 khối video chỉ nằm dưới nếp gấp khoảng 127px, nên biên 200px
  // với tới nó ngay lúc tải: đo được 16 request YouTube trước khi người xem
  // cuộn một pixel nào. Với 10MB thì "gần nhìn thấy" là chưa đủ lý do —
  // phải thật sự nhìn thấy. Bản đồ giữ biên 200px vì nó rẻ hơn hai bậc và
  // được lợi khi nạp sớm.
  const preview = useNearViewport(hostRef, {
    rootMargin: '0px',
    enabled: choPhep && Boolean(id),
  })

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
            // `minHeight` vượt 100% để đẩy hai dải đen nung sẵn ra NGOÀI vùng
            // cắt của cha (`overflow-hidden` ở `HomeIntro`) — xem
            // `BU_VIEN_NUNG`. Đặt bằng inline style chứ không phải class
            // Tailwind vì con số này được TÍNH ra; Tailwind quét mã nguồn
            // dạng văn bản nên một class ghép lúc chạy sẽ không có trong CSS.
            style={{ minHeight: `${BU_VIEN_NUNG * 100}%` }}
            className="pointer-events-none absolute top-1/2 left-1/2 aspect-video min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
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
          // Khung lightbox theo TỈ LỆ NỘI DUNG (2.35:1), không phải tỉ lệ
          // file (16:9): đặt 16:9 thì hai dải đen nung sẵn của video hiện
          // nguyên trong khung, thành ra một khung 16:9 chứa một hình
          // 2.35:1 — đúng thứ đang bị kêu. Iframe bên trong vẫn là 16:9
          // (đúng cái YouTube phát), chỉ bị `overflow-hidden` cắt bớt hai
          // dải đó. Xem `TI_LE_NOI_DUNG`.
          //
          // Bề ngang chặn theo CẢ chiều ngang lẫn chiều cao khung nhìn: chỉ
          // chặn bề ngang thì ở màn thấp (laptop 13") khung bị tràn ra ngoài
          // đỉnh/đáy.
          slide: () => (
            <div
              className="relative overflow-hidden w-[min(92vw,calc(88vh*2.35))]"
              style={{ aspectRatio: String(TI_LE_NOI_DUNG) }}
            >
              <iframe
                src={`${embed}?autoplay=1&rel=0`}
                title={ui('playVideo', lang)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                // `aspect-video` + `w-full`, KHÔNG phải `inset-0 h-full`:
                // khung cha giờ là 2.35:1, ép iframe 16:9 vừa khít nó sẽ kéo
                // méo hình. Giữ iframe đúng 16:9 rồi căn giữa, để hai dải
                // đen nung sẵn thò ra ngoài và bị cha cắt.
                className="absolute top-1/2 left-1/2 aspect-video w-full -translate-x-1/2 -translate-y-1/2 border-0"
              />
            </div>
          ),
        }}
      />
    </div>
  )
}
