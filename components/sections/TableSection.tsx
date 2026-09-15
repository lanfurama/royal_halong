import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'

export function TableSection({
  heading,
  caption,
  headers = [],
  rows = [],
  lang,
}: any & { lang: Locale }) {
  return (
    <section className="py-12">
      <Container>
        {heading && (
          <h2 className="font-display text-gold-deep mb-4 text-2xl">{t<string>(heading, lang)}</h2>
        )}
        {/* Bảng luật Baccarat rộng hơn màn hình điện thoại -> cuộn ngang riêng,
            không để cả trang cuộn ngang. */}
        <div className="overflow-x-auto">
          <table className="border-line w-full min-w-[480px] border-collapse border text-sm">
            {caption && <caption className="mb-2 text-left text-xs">{t<string>(caption, lang)}</caption>}
            <thead>
              <tr className="bg-cream">
                {headers.map((cell: any, index: number) => (
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
              {rows.map((row: any, rowIndex: number) => (
                <tr key={row._key ?? rowIndex} className={rowIndex % 2 ? 'bg-cream/40' : ''}>
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
      </Container>
    </section>
  )
}
