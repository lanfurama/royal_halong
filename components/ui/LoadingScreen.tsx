import type { CSSProperties } from 'react'
import { ui } from '@/lib/ui-strings'
import type { Locale } from '@/lib/i18n'

/** Đường dẫn bản logo TRẮNG trong `public/`.
 *
 * Vì sao là file tĩnh chứ không phải `settings.logoLight` từ Sanity như
 * `Header`/`Footer`: component này là fallback của `<Suspense>` (xem
 * `app/(site)/[lang]/loading.tsx`). Nó phải vẽ ra được NGAY, ở đúng khung
 * hình mà dữ liệu trang chưa về — mọi `await` thêm vào đây đều tự mâu thuẫn:
 * màn hình chờ mà phải chờ dữ liệu thì không còn là màn hình chờ. Logo cũng
 * là hằng số thương hiệu, không phải nội dung biên tập viên đổi hằng tuần.
 *
 * Lấy bản TRẮNG (không phải bản vàng) vì nền ở đây là nâu mực tối. */
const LOGO_SRC = '/logo-royal-halong-white.png'

/** Số kinh tuyến của quả cầu. Bốn vòng chia đều 180° (0/45/90/135) là đủ dày
 * để đọc ra hình cầu mà chưa rối: mỗi khung hình luôn có 2 vòng gần chính
 * diện và 2 vòng gần nghiêng, nên đường nét thay đổi liên tục trong lúc
 * quay. Sáu vòng đo thử thì phần chồng nét biến rìa cầu thành một vệt đặc. */
const MERIDIANS = [0, 45, 90, 135]

/**
 * MỘT nhánh của hoa văn góc, vẽ ở tư thế chạy dọc mép DƯỚI của ô 120×120:
 * thân cuộn vút lên rồi cuốn lại thành vòng xoắn (volute), hai lá nhọn bám
 * trên thân, một chấm nhuỵ ở mắt vòng xoắn.
 *
 * Chỉ vẽ một nhánh vì nhánh thứ hai LÀ chính nó soi gương qua đường chéo 45°
 * của ô — `matrix(0,-1,-1,0,120,120)` đúng là phép `(x,y) -> (120-y, 120-x)`.
 * Vẽ tay hai nhánh thì lần chỉnh nét đầu tiên chỉ sửa được một bên, và hoa
 * văn lệch đối xứng theo cách rất khó nhìn ra là vì sao.
 */
const CORNER_ARM = (
  <>
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      d="M10 112 C 52 112, 82 106, 98 88 C 107 77, 104 64, 95 62 C 87 60, 84 68, 89 72 C 93 75, 99 72, 98 66"
    />
    <path fill="currentColor" d="M56 111 C 58 101, 62 93, 64 86 C 68 95, 66 105, 56 111 Z" />
    <path fill="currentColor" d="M30 111 C 31 105, 33 100, 34 95 C 38 101, 37 107, 30 111 Z" />
    <circle fill="currentColor" cx="94" cy="67" r="1.6" />
  </>
)

type LoadingScreenProps = {
  lang: Locale
  /** `true` (mặc định) — phủ kín viewport, dùng cho `loading.tsx` của route.
   *  `false` — chỉ chiếm chỗ trong luồng, dùng khi bọc `<Suspense>` quanh
   *  một khối nhỏ bên trong trang mà header/footer đã hiện rồi. */
  fullscreen?: boolean
}

/**
 * Màn hình chờ — huy hiệu khách sạn quay quanh trục dọc như trái đất, đặt
 * giữa một nền hoạ tiết hoàng gia.
 *
 * Ba quyết định đáng ghi lại:
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
 * 3. **Vòng cầu quay, còn quầng sáng và vòng tia thì không.** Nếu mọi thứ
 *    cùng quay thì ở hai thời điểm logo nằm nghiêng đúng 90°, giữa màn hình
 *    trống trơn trong khoảng 1/4 giây. Quầng sáng tĩnh + vòng tia chấm giữ
 *    cho tâm màn hình luôn có một điểm neo.
 *
 * Toàn bộ phần NHÌN THẤY nằm ở khối `.rhl-loader` trong `app/globals.css`,
 * cùng chỗ với `.rhl-header` — component này chỉ dựng cấu trúc. Không có
 * state, không `useEffect`, không `'use client'`: mọi chuyển động là CSS
 * thuần nên nó chạy được ngay trong HTML server trả về, trước cả khi React
 * hydrate xong (đúng lúc người dùng cần thấy nó nhất).
 */
export function LoadingScreen({ lang, fullscreen = true }: LoadingScreenProps) {
  const label = ui('loading', lang)

  return (
    // `role="status"` + `aria-live="polite"`: người dùng screen reader được
    // báo "đang tải" khi vùng này xuất hiện, thay vì gặp một trang im lặng.
    // Không dùng `aria-busy` trên đây — `aria-busy` thuộc về vùng nội dung
    // ĐANG bận, còn đây là thông báo về nó.
    <div
      className={fullscreen ? 'rhl-loader rhl-loader--fullscreen' : 'rhl-loader'}
      role="status"
      aria-live="polite"
    >
      {/* --- Nền hoạ tiết ---
          Ba lớp chồng nhau, tất cả `aria-hidden` vì không mang nghĩa:
          (a) hoạ tiết damask lặp — khung ogee + sao bốn cánh, cùng ngôn ngữ
              hình với năm ngôi sao trong logo;
          (b) bốn góc là hoa văn cuộn (acanthus), soi gương theo cả hai trục
              để bốn góc khép thành một khung;
          (c) màn tối viền ngoài (vignette) kéo mắt về giữa. */}
      <span className="rhl-loader__damask" aria-hidden="true" />

      {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
        <svg
          key={corner}
          className={`rhl-loader__corner rhl-loader__corner--${corner}`}
          viewBox="0 0 120 120"
          aria-hidden="true"
          focusable="false"
        >
          {CORNER_ARM}
          <g transform="matrix(0,-1,-1,0,120,120)">{CORNER_ARM}</g>
          {/* Sao bốn cánh ở chân, đúng chỗ hai nhánh gặp nhau — cùng mô-típ
              với hoạ tiết damask ở nền và với năm ngôi sao trong logo, nên
              bốn góc và mặt nền đọc ra là MỘT bộ chứ không phải hai thứ
              trang trí rời nhau. */}
          <path
            fill="currentColor"
            d="M20 100C21 94 23.5 91.5 29.5 90.5C23.5 89.5 21 87 20 81C19 87 16.5 89.5 10.5 90.5C16.5 91.5 19 94 20 100Z"
          />
        </svg>
      ))}

      <span className="rhl-loader__vignette" aria-hidden="true" />

      {/* --- Quả cầu --- */}
      <div className="rhl-loader__stage">
        {/* Quầng vàng tĩnh, thở nhẹ. Đứng SAU quả cầu nên logo trắng luôn có
            một nền ấm để nổi lên, kể cả ở khung hình logo nằm nghiêng. */}
        <span className="rhl-loader__halo" aria-hidden="true" />

        {/* Vòng tia chấm — quay NGƯỢC chiều quả cầu và chậm hơn nhiều. Hai
            chiều ngược nhau làm mắt tách được hai lớp; cùng chiều thì chúng
            dính thành một khối quay. */}
        <span className="rhl-loader__rays" aria-hidden="true" />
        <span className="rhl-loader__rim" aria-hidden="true" />

        {/* Trục quay: một nét dọc mảnh xuyên qua cầu, thò ra hai đầu. Đây là
            thứ nói rõ nhất "quay như trái đất" — không có nó, chuyển động dễ
            bị đọc thành một tấm thẻ đang lật. */}
        <span className="rhl-loader__axis" aria-hidden="true" />

        <div className="rhl-loader__spin">
          {MERIDIANS.map((deg) => (
            <span
              key={deg}
              className="rhl-loader__meridian"
              style={{ '--rhl-meridian': `${deg}deg` } as CSSProperties}
              aria-hidden="true"
            />
          ))}

          {/* Hai mặt của tấm huy hiệu — xem ghi chú (2) ở đầu file.
              `alt=""`: logo ở đây là trang trí, tên khách sạn đã nằm trong
              nhãn của `role="status"` ngay bên dưới. Để `alt` có chữ thì
              screen reader đọc tên khách sạn hai lần mỗi lần chuyển trang. */}
          <img
            className="rhl-loader__face"
            src={LOGO_SRC}
            alt=""
            width={1200}
            height={1033}
            /* `fetchPriority="high"`: ảnh này là thứ duy nhất người dùng nhìn
               trong lúc chờ, phải xuống trước mọi ảnh của trang đích. */
            fetchPriority="high"
          />
          <img
            className="rhl-loader__face rhl-loader__face--back"
            src={LOGO_SRC}
            alt=""
            width={1200}
            height={1033}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* --- Nhãn + thanh tiến trình ---
          Thanh KHÔNG có `role="progressbar"`: không biết được phần trăm nào
          thật, mà một progressbar không có `aria-valuenow` chỉ làm screen
          reader đọc thừa. Nó thuần trang trí, phần thông báo do `role="status"`
          của khung ngoài đảm nhiệm. */}
      <p className="rhl-loader__label">{label}</p>
      <span className="rhl-loader__bar" aria-hidden="true" />
    </div>
  )
}
