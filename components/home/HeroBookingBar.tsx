'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Locale } from '@/lib/i18n'
import { ui, guestsLabel } from '@/lib/ui-strings'

export interface RoomChoice {
  /** Giá trị gửi lên URL — slug của document `room`. */
  value: string
  label: string
}

/** `YYYY-MM-DD` theo giờ ĐỊA PHƯƠNG.
 *
 * `toISOString()` đổi sang UTC trước khi cắt chuỗi, nên ở múi giờ Việt Nam
 * (UTC+7) mọi thời điểm trước 07:00 sáng sẽ lùi về NGÀY HÔM TRƯỚC. Khách mở
 * trang lúc 6h sáng sẽ thấy ngày nhận phòng mặc định là hôm qua — và
 * `min={today}` ở dưới sẽ đánh dấu chính giá trị mặc định đó là không hợp lệ. */
function toLocalISODate(date: Date): string {
  const offsetMinutes = date.getTimezoneOffset()
  return new Date(date.getTime() - offsetMinutes * 60_000).toISOString().slice(0, 10)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/**
 * Thanh đặt phòng đè lên đáy hero.
 *
 * Nó KHÔNG tự đặt phòng: công cụ đặt phòng thật là widget SecureBookings ở
 * trang `/[lang]/reservation` (`bookingWidgetSection`). Form này thu thập
 * ngày/số khách/loại phòng rồi chuyển sang trang đó, mang theo lựa chọn
 * trong query string.
 *
 * Vì sao không nhúng thẳng widget vào hero: widget SecureBookings tự dựng
 * DOM và CSS riêng của nó (`https://book.securebookings.net/css/app.css`,
 * nạp toàn cục), không điều khiển được bố cục — không thể ép thành dải
 * ngang 5 cột đè lên ảnh như bản thiết kế.
 *
 * Vì sao vẫn đính query string dù widget hôm nay chưa đọc chúng: tham số
 * nằm trên URL là thứ DUY NHẤT sống sót qua bước điều hướng, nên khi nối
 * widget (hoặc đổi sang engine khác) thì dữ liệu đã có sẵn ở đúng chỗ. Nếu
 * bỏ đi, khách phải nhập lại ngày lần thứ hai ngay sau khi vừa nhập.
 */
export function HeroBookingBar({
  lang,
  reservationHref,
  rooms,
}: {
  lang: Locale
  /** Đích của form — `/[lang]/<slug trang đặt phòng>`. */
  reservationHref: string
  rooms: RoomChoice[]
}) {
  const router = useRouter()

  // Ngày mặc định tính SAU KHI MOUNT, không phải trong lúc render.
  //
  // Dưới `cacheComponents` (Next 16), đọc `new Date()` trong thân một Client
  // Component làm hỏng prerender thật — không phải cảnh báo suông:
  // "Next.js encountered the unstable value `new Date()` in a Client
  // Component". Lý do đúng: giá trị đó sẽ bị đóng băng vào HTML tĩnh lúc
  // build, nên "hôm nay" trong ô nhận phòng sẽ là ngày BUILD, và cứ thế đứng
  // yên cho tới lần deploy sau.
  //
  // Hệ quả: trong HTML server trả về, hai ô ngày rỗng và được điền ngay khi
  // JS chạy. Với người dùng không có JS, hai ô vẫn rỗng — nhưng form vẫn
  // submit được (xem `action`/`method` ở `<form>` bên dưới), và trang đặt
  // phòng tự có bộ chọn ngày riêng.
  const [today, setToday] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)
  const [roomType, setRoomType] = useState(rooms[0]?.value ?? '')

  useEffect(() => {
    const now = new Date()
    setToday(toLocalISODate(now))
    setCheckIn(toLocalISODate(now))
    setCheckOut(toLocalISODate(addDays(now, 2)))
  }, [])

  // Trả phòng phải sau nhận phòng. Thay vì báo lỗi sau khi bấm, kéo luôn
  // ngày trả phòng theo — `min` trên chính ô đó chặn người dùng chọn lùi,
  // nhưng `min` không tự sửa giá trị đã có khi ngày nhận phòng nhảy tới sau nó.
  function updateCheckIn(value: string) {
    setCheckIn(value)
    if (value && checkOut <= value) {
      setCheckOut(toLocalISODate(addDays(new Date(`${value}T00:00:00`), 1)))
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
      ...(roomType ? { roomType } : {}),
    })
    router.push(`${reservationHref}?${params.toString()}`)
  }

  const cell =
    'border-gold/20 flex flex-col gap-2 border-b px-5 py-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0'
  const label = 'text-gold text-[0.625rem] tracking-[0.14em] uppercase'
  const value =
    'font-display text-ink w-full min-w-0 border-none bg-transparent p-0 text-lg outline-none [color-scheme:light]'
  const stepper =
    'border-gold/40 text-gold hover:bg-gold hover:text-cream-hi grid size-8 shrink-0 place-items-center border text-lg leading-none transition-colors'

  return (
    <form
      // `action` + `method="get"` là đường đi khi JS chưa chạy: trình duyệt
      // tự gom các `name=` thành query string và điều hướng sang trang đặt
      // phòng — đúng thứ `submit()` làm bằng JS. `onSubmit` chỉ NÂNG CẤP nó
      // thành điều hướng phía client (không tải lại cả trang).
      action={reservationHref}
      method="get"
      onSubmit={submit}
      // `grid-cols-1` ở điện thoại rồi 2 cột từ `sm`, 4 cột từ `lg`: bản
      // thiết kế dùng `auto-fit minmax(170px,1fr)` — ở 390px công thức đó ra
      // đúng 1 cột, nhưng nó cũng cho phép 2 cột 175px ở 380px trên một số
      // trình duyệt, chật tới mức ô ngày bị cắt mất phần năm.
      className="bg-cream-soft border-gold/45 shadow-float grid grid-cols-1 border sm:grid-cols-2 lg:grid-cols-4"
    >
      <label className={cell}>
        <span className={label}>{ui('checkIn', lang)}</span>
        <input
          type="date"
          name="checkIn"
          value={checkIn}
          min={today}
          onChange={(event) => updateCheckIn(event.target.value)}
          className={value}
        />
      </label>

      <label className={cell}>
        <span className={label}>{ui('checkOut', lang)}</span>
        <input
          type="date"
          name="checkOut"
          value={checkOut}
          min={checkIn || today}
          onChange={(event) => setCheckOut(event.target.value)}
          className={value}
        />
      </label>

      <div className={cell}>
        {/* Không phải <label>: bên trong là hai <button> + một số đọc-thôi,
            không có control nào để `for` trỏ tới. Nhãn nhóm đi qua
            `aria-labelledby` của vùng số khách. */}
        <span className={label} id="hero-guests-label">
          {ui('guests', lang)}
        </span>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setGuests((n) => Math.max(1, n - 1))}
            aria-label={ui('removeGuest', lang)}
            className={stepper}
          >
            <span aria-hidden="true">−</span>
          </button>
          {/* `aria-live`: con số đổi tại chỗ khi bấm +/−, không có thông báo
              thì người dùng screen reader bấm mà không biết kết quả. */}
          <span
            aria-live="polite"
            aria-labelledby="hero-guests-label"
            className="font-display text-ink text-lg whitespace-nowrap"
          >
            {guestsLabel(guests, lang)}
          </span>
          <input type="hidden" name="guests" value={guests} />
          <button
            type="button"
            onClick={() => setGuests((n) => Math.min(8, n + 1))}
            aria-label={ui('addGuest', lang)}
            className={stepper}
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>

      {/* Không có document `room` nào -> bỏ hẳn ô chọn thay vì hiện một ô
          rỗng. Lưới tự co về 3 cột. */}
      {rooms.length > 0 && (
        <label className={cell}>
          <span className={label}>{ui('roomType', lang)}</span>
          <select
            name="roomType"
            value={roomType}
            onChange={(event) => setRoomType(event.target.value)}
            className={`${value} cursor-pointer`}
          >
            {rooms.map((room) => (
              <option key={room.value} value={room.value}>
                {room.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        type="submit"
        className="bg-gold-deep text-cream-hi hover:bg-gold col-span-full min-h-16 text-xs font-semibold tracking-[0.12em] uppercase transition-colors"
      >
        {ui('checkAvailability', lang)}
      </button>
    </form>
  )
}
