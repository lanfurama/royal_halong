'use client'

import { useId, useMemo, useState } from 'react'
import { t, INTL_LOCALES, type Locale } from '@/lib/i18n'
import { ui, guestsLabel, capacityNote, capacityNoMatch } from '@/lib/ui-strings'
import { Container } from '@/components/ui/Container'

/** Sáu cột của bảng, theo đúng thứ tự hiển thị. Khai một lần ở đây để hàng
 * tiêu đề và hàng dữ liệu không thể lệch nhau — trước mỗi hàng tự liệt kê
 * là chỗ một lần thêm cột sẽ đẩy mọi con số sang sai ô. */
const COLUMNS = ['name', 'area', 'banquet', 'cocktail', 'theatre', 'classroom'] as const

/**
 * Bảng sức chứa có thanh trượt số khách: kéo tới số khách dự kiến, những
 * sảnh còn nhận được sẽ sáng lên.
 *
 * Vì sao không dùng `tableSection` sẵn có: bảng đó chiếu `localeString` —
 * mọi ô đã là CHỮ, kể cả con số. Muốn so "sảnh này có chứa nổi 420 khách
 * không" thì phải parse ngược "1.000" / "1,000" / "1.000 ท่าน" về số, và
 * quy tắc phân tách hàng nghìn khác nhau ở sáu ngôn ngữ. Ở đây sức chứa là
 * `number` thật trong Sanity và chỉ được ĐỊNH DẠNG lúc render, theo
 * `INTL_LOCALES` — một chiều, không có đường quay ngược để sai.
 *
 * Trạng thái rỗng: không có hàng nào thì không render gì (xem `rows`).
 * Không có trạng thái tải/lỗi — dữ liệu đến cùng trang từ Server Component,
 * không có lượt gọi mạng nào sau khi trang hiện.
 */
export function CapacityPickerSection({
  eyebrow,
  heading,
  description,
  caption,
  headers,
  rows,
  defaultGuests,
  lang,
}: any & { lang: Locale }) {
  // Xem chú thích cùng lớp lỗi ở CardGridSection — GROQ trả `null` tường minh.
  const list: any[] = rows ?? []

  // `useId` chứ không phải một chuỗi cố định: biên tập viên hoàn toàn có thể
  // đặt HAI khối này trên cùng một trang (tiệc cưới + hội nghị), và hai
  // `<label for="guest-range">` trỏ vào cùng một id thì bấm nhãn dưới sẽ
  // focus thanh trượt trên.
  const rangeId = useId()

  /** Sảnh lớn nhất trong bảng — trần của thanh trượt. */
  const max = useMemo(
    () => list.reduce((top, row) => Math.max(top, row.banquet ?? 0, row.cocktail ?? 0), 0),
    [list],
  )
  /** Sảnh nhỏ nhất — sàn của thanh trượt. Kéo xuống dưới mức này thì mọi
   * hàng đều sáng, tức thanh trượt không còn nói gì. */
  const min = useMemo(
    () =>
      list.reduce(
        (floor, row) => Math.min(floor, row.banquet ?? Infinity, row.cocktail ?? Infinity),
        Infinity,
      ),
    [list],
  )

  const initial = clamp(defaultGuests ?? Math.round(max / 2), min, max)
  const [guests, setGuests] = useState(initial)

  // `INTL_LOCALES` (lib/i18n.ts) chứ không phải `lang` trần: mã locale của
  // site (`vi`, `zh`) không phải lúc nào cũng là mã BCP-47 mà `Intl` cần, và
  // dấu phân tách hàng nghìn của tiếng Việt là dấu CHẤM trong khi năm ngôn
  // ngữ còn lại dùng dấu phẩy — đúng quy ước mà `n()` trong script seed đang
  // giữ. Một nguồn cho cả hai phía.
  const fmt = useMemo(() => new Intl.NumberFormat(INTL_LOCALES[lang as Locale]), [lang])

  if (list.length === 0 || !Number.isFinite(min) || max <= 0) return null

  const fits = (row: any) => Math.max(row.banquet ?? 0, row.cocktail ?? 0) >= guests
  const matches = list.filter(fits)

  return (
    <section id="suc-chua" className="bg-cream-alt py-16 lg:py-24">
      <Container size="wide">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-7">
          <div className="max-w-[52ch]">
            {eyebrow && (
              <p className="text-gold-text mb-3 text-xs tracking-[0.18em] uppercase">
                {t<string>(eyebrow, lang)}
              </p>
            )}
            {heading && (
              <h2 className="font-display text-[clamp(1.5rem,4vw,2.25rem)]">
                {t<string>(heading, lang)}
              </h2>
            )}
            {description && <p className="mt-4">{t<string>(description, lang)}</p>}
          </div>

          <div className="w-full max-w-[32.5rem] flex-[1_1_20rem]">
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <label
                htmlFor={rangeId}
                className="text-xs font-semibold tracking-[0.12em] uppercase"
              >
                {ui('expectedGuests', lang)}
              </label>
              {/* `<output>` chứ không phải `<span>`: đây là KẾT QUẢ của thanh
                  trượt, và screen reader đọc lại nó mỗi lần đổi mà không cần
                  `aria-live` thủ công. */}
              <output htmlFor={rangeId} className="font-display text-gold-deep text-2xl leading-none">
                {guestsLabel(guests, lang)}
              </output>
            </div>
            {/* `h-11` (44px): vùng chạm của `input[type=range]` là CHÍNH nó,
                không bọc được. Bản thiết kế để 24px — kéo trượt bằng ngón cái
                trên điện thoại ở 24px là trượt hụt.

                `aria-valuetext` vì mặc định screen reader đọc số trần
                ("420"); ở đây nó phải là "420 khách" để biết đơn vị. */}
            <input
              id={rangeId}
              type="range"
              min={min}
              max={max}
              step={2}
              value={guests}
              aria-valuetext={guestsLabel(guests, lang)}
              onChange={(event) => setGuests(Number(event.target.value))}
              className="accent-gold h-11 w-full cursor-pointer"
            />
            <div className="text-muted flex justify-between text-xs">
              <span>{fmt.format(min)}</span>
              <span>{fmt.format(max)}</span>
            </div>
          </div>
        </div>

        {/* Cùng lớp lỗi và cùng cách chữa với `TableBody`: bảng 6 cột rộng
            hơn màn hình điện thoại, nên vùng cuộn ngang phải vào được tab
            order (axe `scrollable-region-focusable`) — ở đây bảng KHÔNG có
            phần tử focus được nào bên trong, khác thanh mục lục. */}
        <div
          className="shadow-card bg-cream-soft overflow-x-auto"
          tabIndex={0}
          role="group"
          aria-label={t<string>(caption, lang) ?? t<string>(heading, lang)}
        >
          <table className="w-full min-w-[47.5rem] border-collapse text-sm">
            {caption && (
              <caption className="text-gold-deep px-7 pt-6 text-left text-xs tracking-[0.14em] uppercase">
                {t<string>(caption, lang)}
              </caption>
            )}
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className={`border-line border-b px-4 pt-5 pb-3.5 text-xs font-semibold tracking-[0.12em] uppercase ${
                      col === 'name' ? 'pl-7 text-left' : 'text-right'
                    } ${col === 'classroom' ? 'pr-7' : ''}`}
                  >
                    {t<string>(headers?.[col], lang)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((row: any, index: number) => {
                const ok = fits(row)
                return (
                  <tr
                    key={row._key ?? index}
                    // Sáng lên = nền vàng rất nhạt; không vừa = mờ đi.
                    // KHÔNG dùng `display:none` cho hàng không vừa: khách cần
                    // thấy mình vừa loại bỏ cái gì, và một cái bảng co giãn
                    // theo thanh trượt đọc ra là lỗi chứ không phải bộ lọc.
                    className={ok ? 'bg-gold/[0.09]' : 'opacity-45'}
                  >
                    <th
                      scope="row"
                      className="border-line border-b py-4 pr-4 pl-7 text-left font-semibold"
                    >
                      <span className="flex items-center gap-2.5">
                        {t<string>(row.name, lang)}
                        {ok && (
                          <span className="bg-gold text-ink inline-flex items-center px-2 py-0.5 text-[0.625rem] font-semibold tracking-[0.12em] uppercase">
                            {ui('capacityFits', lang)}
                          </span>
                        )}
                      </span>
                    </th>
                    <Cell value={row.area} fmt={fmt} lang={lang} muted suffix=" m²" />
                    <Cell value={row.banquet} fmt={fmt} lang={lang} />
                    <Cell value={row.cocktail} fmt={fmt} lang={lang} />
                    <Cell value={row.theatre} fmt={fmt} lang={lang} />
                    <Cell value={row.classroom} fmt={fmt} lang={lang} last />
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Câu tóm tắt dưới bảng. `aria-live="polite"` để người dùng screen
            reader biết kết quả đổi sau khi kéo — `<output>` ở trên chỉ đọc
            lại con số khách, không đọc số sảnh còn lại. */}
        <p className="text-muted mt-5 text-sm" aria-live="polite">
          {matches.length > 0
            ? capacityNote(
                guestsLabel(guests, lang),
                fmt.format(matches.length),
                fmt.format(list.length),
                lang,
              )
            : capacityNoMatch(guestsLabel(guests, lang), lang)}
        </p>
      </Container>
    </section>
  )
}

function clamp(value: number, low: number, high: number) {
  return Math.min(high, Math.max(low, value))
}

function Cell({
  value,
  fmt,
  lang,
  muted,
  suffix = '',
  last,
}: {
  value: number | null | undefined
  fmt: Intl.NumberFormat
  lang: Locale
  muted?: boolean
  suffix?: string
  last?: boolean
}) {
  const empty = value === null || value === undefined
  return (
    <td
      className={`border-line border-b px-4 py-4 text-right ${muted ? 'text-muted' : ''} ${
        last ? 'pr-7' : ''
      }`}
    >
      {empty ? (
        // Dấu gạch ngang là dấu hiệu THỊ GIÁC; screen reader đọc nó ra
        // "gạch ngang" hoặc bỏ qua hẳn, nên nghĩa thật đi kèm ở `aria-label`.
        <span aria-label={ui('capacityNotOffered', lang)}>—</span>
      ) : (
        `${fmt.format(value)}${suffix}`
      )}
    </td>
  )
}
