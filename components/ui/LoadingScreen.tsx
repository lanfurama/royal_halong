import { ui } from '@/lib/ui-strings'
import type { Locale } from '@/lib/i18n'

/** Hai bản logo trong `public/`, chọn theo nền.
 *
 * Vì sao là file tĩnh chứ không phải `settings.logo` từ Sanity như
 * `Header`/`Footer`: component này là fallback của `<Suspense>` (xem
 * `app/(site)/[lang]/loading.tsx`). Nó phải vẽ ra được NGAY, ở đúng khung
 * hình mà dữ liệu trang chưa về — mọi `await` thêm vào đây đều tự mâu thuẫn:
 * màn hình chờ mà phải chờ dữ liệu thì không còn là màn hình chờ. Logo cũng
 * là hằng số thương hiệu, không phải nội dung biên tập viên đổi hằng tuần.
 *
 * Chọn ở PROP chứ không bằng CSS: CSS không đổi được `src`, nên cách duy nhất
 * để chuyển bằng class là render cả hai rồi ẩn một — trình duyệt vẫn tải đủ
 * hai file. Ở đây chỉ một file được nhắc tới, nên chỉ một file được tải. */
const LOGO_SRC = {
  cream: '/logo-royal-halong-gold.png',
  ink: '/logo-royal-halong-white.png',
} as const

/** Bốn hạt kim cương đậu ở góc khung kẻ. */
const PINS = ['tl', 'tr', 'bl', 'br'] as const

type LoadingScreenProps = {
  lang: Locale
  /** `'cream'` (mặc định) — nền kem, logo vàng: cùng hệ màu với toàn site,
   *  nên lúc trang thật hiện ra không có cú loé từ tối sang sáng.
   *  `'ink'` — nền nâu mực, logo trắng. Dùng khi màn hình chờ đứng trước một
   *  trang tối, hoặc khi chủ ý muốn hiệu ứng sân khấu. */
  theme?: keyof typeof LOGO_SRC
  /** `true` (mặc định) — phủ kín viewport, dùng cho `loading.tsx` của route.
   *  `false` — chỉ chiếm chỗ trong luồng, dùng khi bọc `<Suspense>` quanh
   *  một khối nhỏ bên trong trang mà header/footer đã hiện rồi. */
  fullscreen?: boolean
}

/**
 * Màn hình chờ — huy hiệu khách sạn quay quanh trục dọc như trái đất, trên
 * một mặt giấy kem có dấu chìm và khung kẻ đôi.
 *
 * Bản đầu (nền nâu tối, hoa văn lặp dày, khung dây quả cầu + vòng chấm +
 * trục) đã bị bỏ: ba lớp đường nét quay quanh một logo nhỏ đọc ra là đồ hoạ
 * "mạng toàn cầu" chứ không phải khách sạn nghỉ dưỡng. Bản này đi theo mô-típ
 * GIẤY TỜ KHÁCH SẠN — thực đơn, thiếp mời: rất nhiều khoảng trống, một khung
 * kẻ đôi, hoa văn chỉ ở mức dấu chìm, và huy hiệu phóng lớn làm nhân vật
 * chính.
 *
 * Hai quyết định đáng ghi lại:
 *
 * 1. **Quay quanh trục Y (`rotateY`), không phải `rotate` phẳng.** "Xoay như
 *    trái đất" là quay quanh một TRỤC nằm trong mặt phẳng màn hình, nên phải
 *    có `perspective` và `transform-style: preserve-3d`. Một `rotate()`
 *    thường chỉ cho ra cái vòng quay của spinner, và còn làm dòng chữ
 *    "ROYAL HALONG HOTEL" trong logo lộn ngược.
 *
 * 2. **Hai mặt logo chứ không một.** Một tấm ảnh phẳng quay 180° sẽ quay
 *    lưng lại người xem, tức chữ bị LẬT GƯƠNG suốt nửa vòng. Ở đây có hai
 *    bản logo chồng nhau, bản sau đặt sẵn `rotateY(180deg)`, cả hai
 *    `backface-visibility: hidden` — trình duyệt luôn chỉ vẽ mặt đang hướng
 *    về phía người xem, nên chữ đọc xuôi ở CẢ hai nửa vòng. Đây đúng là cách
 *    một tấm huy chương thật có hình dập ở hai mặt trông ra sao.
 *
 * Toàn bộ phần NHÌN THẤY nằm ở khối `.rhl-loader` trong `app/globals.css`,
 * cùng chỗ với `.rhl-header` — component này chỉ dựng cấu trúc. Không có
 * state, không `useEffect`, không `'use client'`: mọi chuyển động là CSS
 * thuần nên nó chạy được ngay trong HTML server trả về, trước cả khi React
 * hydrate xong (đúng lúc người dùng cần thấy nó nhất).
 */
export function LoadingScreen({ lang, theme = 'cream', fullscreen = true }: LoadingScreenProps) {
  const label = ui('loading', lang)
  const className = [
    'rhl-loader',
    theme === 'ink' && 'rhl-loader--ink',
    fullscreen && 'rhl-loader--fullscreen',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    // `role="status"` + `aria-live="polite"`: người dùng screen reader được
    // báo "đang tải" khi vùng này xuất hiện, thay vì gặp một trang im lặng.
    // Không dùng `aria-busy` trên đây — `aria-busy` thuộc về vùng nội dung
    // ĐANG bận, còn đây là thông báo về nó.
    <div className={className} role="status" aria-live="polite">
      {/* Dấu chìm fleur-de-lis + hạt giấy. Cả hai `aria-hidden` vì không mang
          nghĩa, và cả hai là background-image trong CSS chứ không phải ảnh —
          không tốn thêm một request nào. */}
      <span className="rhl-loader__damask" aria-hidden="true" />
      <span className="rhl-loader__grain" aria-hidden="true" />

      {/* Khung kẻ đôi với bốn hạt kim cương ở góc — mô-típ thực đơn / thiếp
          mời. Đây là chi tiết làm cả màn hình đọc ra là "một tấm thiệp" chứ
          không phải "một trang web đang tải". */}
      <span className="rhl-loader__frame" aria-hidden="true">
        {PINS.map((pin) => (
          <span key={pin} className={`rhl-loader__pin rhl-loader__pin--${pin}`} />
        ))}
      </span>

      <div className="rhl-loader__stage">
        {/* Vành huy chương tĩnh. Có việc thật chứ không chỉ trang trí: hai
            lần mỗi vòng, tấm logo quay đúng 90° và mỏng gần như biến mất —
            vành giữ cho giữa màn hình vẫn có hình. */}
        <span className="rhl-loader__ring" aria-hidden="true" />

        <div className="rhl-loader__spin">
          {/* Hai mặt của tấm huy hiệu — xem ghi chú (2) ở đầu file.
              `alt=""`: logo ở đây là trang trí, tên khách sạn đã nằm trong
              nhãn của `role="status"` ngay bên dưới. Để `alt` có chữ thì
              screen reader đọc tên khách sạn hai lần mỗi lần chuyển trang. */}
          <img
            className="rhl-loader__face"
            src={LOGO_SRC[theme]}
            alt=""
            width={1200}
            height={1033}
            /* `fetchPriority="high"`: ảnh này là thứ duy nhất người dùng nhìn
               trong lúc chờ, phải xuống trước mọi ảnh của trang đích. */
            fetchPriority="high"
          />
          <img
            className="rhl-loader__face rhl-loader__face--back"
            src={LOGO_SRC[theme]}
            alt=""
            width={1200}
            height={1033}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Nét dưới nhãn KHÔNG có `role="progressbar"`: không biết được phần
          trăm nào thật, mà một progressbar không có `aria-valuenow` chỉ làm
          screen reader đọc thừa. Nó thuần trang trí, phần thông báo do
          `role="status"` của khung ngoài đảm nhiệm. */}
      <p className="rhl-loader__label">{label}</p>
      <span className="rhl-loader__bar" aria-hidden="true" />
    </div>
  )
}
