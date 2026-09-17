import { t, type Locale } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'
import { Container } from '@/components/ui/Container'

/**
 * Phần BẢNG trần, không có `<section>`/`<Container>` bọc ngoài.
 *
 * Tách ra vì bảng xuất hiện ở HAI chỗ: là một khối riêng xếp dọc trang
 * (`TableSection` bên dưới), và là phần thân của một khối gập trong
 * `CollapsibleGroup` — nơi `<section>` và `Container` đã do nhóm cha lo. Chép
 * lại phần `<table>` ở chỗ thứ hai nghĩa là hai bản sao của cùng một bảng
 * luật Baccarat sẽ trôi khỏi nhau (và vùng cuộn ngang focus được ở dưới rất
 * dễ bị bỏ quên ở bản chép).
 */
export function TableBody({
  caption,
  headers,
  rows,
  lang,
  label,
}: {
  caption?: any
  headers?: any[]
  rows?: any[]
  lang: Locale
  /** Tên truy cập của vùng cuộn, đã dịch sẵn. Nơi gọi truyền tiêu đề của
   * khối — trong `CollapsibleGroup` tiêu đề đó nằm ở `<summary>` chứ không
   * còn là prop của bảng, nên bảng không tự lấy được. */
  label?: string
}) {
  // Xem chú thích cùng lớp lỗi ở CardGridSection/VenueListSection — default
  // parameter không chặn được `null` tường minh.
  const headerList: any[] = headers ?? []
  const rowList: any[] = rows ?? []

  return (
    /* Bảng luật Baccarat rộng hơn màn hình điện thoại -> cuộn ngang riêng,
       không để cả trang cuộn ngang. `tabIndex=0` + `role="group"` để vùng
       cuộn này vào được tab order — axe `scrollable-region-focusable`: không
       có chúng, người dùng chỉ dùng bàn phím không cách nào cuộn ngang tới
       phần bảng bị tràn (phát hiện thật trên /vi/casino ở khổ điện thoại, nơi
       bảng min-w-[480px] tràn khỏi khung 390px). */
    <div
      className="overflow-x-auto"
      tabIndex={0}
      role="group"
      aria-label={t<string>(caption, lang) ?? label ?? ui('dataTableScroll', lang)}
    >
      <table className="border-line w-full min-w-[480px] border-collapse border text-sm">
        {caption && <caption className="mb-2 text-left text-xs">{t<string>(caption, lang)}</caption>}
        <thead>
          <tr className="bg-cream-alt">
            {headerList.map((cell: any, index: number) => (
              <th
                key={cell._key ?? index}
                scope="col"
                className="border-line border px-3 py-2 text-left font-semibold"
              >
                {t<string>(cell, lang)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowList.map((row: any, rowIndex: number) => (
            <tr key={row._key ?? rowIndex} className={rowIndex % 2 ? 'bg-cream-alt/50' : ''}>
              {(row.cells ?? []).map((cell: any, cellIndex: number) => (
                <td key={cell._key ?? cellIndex} className="border-line border px-3 py-2">
                  {t<string>(cell, lang)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TableSection({
  heading,
  caption,
  headers,
  rows,
  lang,
}: any & { lang: Locale }) {
  return (
    <section className="py-12">
      <Container>
        {heading && (
          <h2 className="font-display mb-4 text-2xl">{t<string>(heading, lang)}</h2>
        )}
        <TableBody
          caption={caption}
          headers={headers}
          rows={rows}
          lang={lang}
          label={t<string>(heading, lang)}
        />
      </Container>
    </section>
  )
}
