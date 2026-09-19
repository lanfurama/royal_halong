import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'
import { Reveal } from '@/components/ui/Reveal'
import { ui } from '@/lib/ui-strings'

export function HallListSection({
  heading,
  eyebrow,
  description,
  layout = 'stack',
  resolved,
  lang,
}: any & { lang: Locale }) {
  // Xem chú thích cùng lớp lỗi ở CardGridSection/VenueListSection — default
  // parameter không chặn được `null` tường minh.
  const list: any[] = resolved ?? []

  if (layout === 'cards') return <HallCards {...{ heading, eyebrow, description, list, lang }} />

  return (
    <section className="bg-cream-alt py-16">
      <Container>
        {heading && (
          <h2 className="font-display mb-10 text-center text-3xl">
            {t<string>(heading, lang)}
          </h2>
        )}
        <div className="space-y-12">
          {list.map((hall: any, index: number) => {
            const hallName = t<string>(hall.name, lang)
            return (
              <article key={hall._id} className="grid items-center gap-8 md:grid-cols-2">
                <div className={index % 2 ? 'md:order-2' : ''}>
                  {hall.image && (
                    <SanityImage
                      image={hall.image}
                      lang={lang}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      fallbackAlt={hallName}
                      className="h-auto w-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-display text-2xl">{hallName}</h3>
                  <p className="text-gold-text mt-1 text-xs tracking-widest uppercase">
                    {[
                      hall.areaSqm ? `${ui('labelArea', lang)}: ${hall.areaSqm} m²` : null,
                      t<string>(hall.capacity, lang)
                        ? `${ui('labelCapacity', lang)}: ${t<string>(hall.capacity, lang)}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' | ')}
                  </p>
                  <div className="mt-3 text-sm">
                    <RichText value={hall.description} lang={lang} />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

/**
 * Biến thể `cards` — ba sảnh xếp ngang, mỗi sảnh một thẻ: ảnh 4:3 ở trên,
 * thân thẻ kem sáng ở dưới với diện tích/kích thước làm nhãn và các kiểu bố
 * trí làm danh sách dẫn chấm.
 *
 * Vì sao là biến thể chứ không phải component thứ hai: dữ liệu vào giống hệt
 * (`resolved` từ cùng một projection GROQ), chỉ khác cách bày. Tách file là
 * mở đường cho hai bản trôi khỏi nhau khi schema `hall` thêm field.
 *
 * Vì sao biến thể `stack` vẫn là MẶC ĐỊNH: trang Cung Hội nghị đang dùng nó
 * với ba đoạn mô tả dài — bày chúng thành thẻ sẽ cắt cụt phần mô tả đó. Đổi
 * mặc định là đổi một trang không nằm trong phạm vi việc này.
 *
 * KHÔNG hiển thị `description` ở thẻ: mô tả của `hall` là hai đoạn văn dài
 * (đo trên `hall.ha-long`: 480 ký tự), và ba thẻ cạnh nhau chứa từng ấy chữ
 * đọc thành ba cột văn bản — đúng thứ mà bản `stack` sinh ra để làm. Thẻ chỉ
 * mang con số; ai cần đọc kỹ thì bảng sức chứa ngay dưới đã có đủ.
 */
function HallCards({
  heading,
  eyebrow,
  description,
  list,
  lang,
}: {
  heading?: any
  eyebrow?: any
  description?: any
  list: any[]
  lang: Locale
}) {
  return (
    <section id="khong-gian" className="bg-cream py-16 lg:py-24">
      <Container size="wide">
        <div className="mb-10 max-w-[60ch] lg:mb-14">
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

        {/* `auto-fit` + `minmax(18.75rem,1fr)`: ba thẻ ở 1440px, hai ở tablet,
            một ở điện thoại — cùng lý do với `ProcessSection`, số cột bám chỗ
            trống thật chứ không bám một mốc đoán trước. */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(18.75rem,1fr))] gap-7">
          {list.map((hall: any, index: number) => {
            const hallName = t<string>(hall.name, lang)
            const dimensions = t<string>(hall.dimensions, lang)
            // `specs`, KHÔNG phải `layouts`. Hai thứ khác nhau và trộn được
            // là do `layouts` tới giờ chưa component nào render:
            // - `layouts` = sáu kiểu kê bàn MICE (nhà hát, chữ U đôi, vuông
            //   rỗng…), dữ liệu của trang Cung Hội nghị. Bày đủ sáu lên thẻ
            //   tiệc cưới là bắt cô dâu chú rể đọc qua bốn kiểu kê phòng họp
            //   để tìm hai dòng họ cần.
            // - `specs` = ba dòng biên tập viên CHỌN cho thẻ, và nó nói được
            //   cả thứ không phải kiểu kê bàn: "Chia nhỏ — 2 sảnh 384 m²".
            //   `layouts` không có chỗ nào diễn đạt dòng đó.
            const specs: any[] = hall.specs ?? []

            return (
              <Reveal key={hall._id} delay={index * 90}>
                <article className="shadow-card bg-cream-soft flex h-full flex-col">
                  {hall.image && (
                    <SanityImage
                      image={hall.image}
                      lang={lang}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
                      fallbackAlt={hallName}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  )}
                  <div className="flex flex-auto flex-col p-7">
                    <h3 className="font-display text-2xl">{hallName}</h3>
                    <p className="text-gold-deep mt-2.5 text-xs tracking-[0.16em] uppercase">
                      {/* `gold-deep` (4.59:1) chứ không `gold-text` (2.92:1):
                          ngoại lệ tương phản đã chốt ở đầu `globals.css` chỉ
                          dành cho nhãn eyebrow TRANG TRÍ. Dòng này mang diện
                          tích và kích thước thật của sảnh — đó là THÔNG TIN
                          khách dùng để chọn, cùng hạng với nhãn màn hình chờ. */}
                      {[hall.areaSqm ? `${hall.areaSqm} m²` : null, dimensions]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {specs.length > 0 && (
                      <dl className="mt-6 grid gap-2.5 text-[0.9375rem]">
                        {specs.map((row: any, rowIndex: number) => (
                          <div key={row._key ?? rowIndex} className="rhl-leader">
                            {/* Màu và độ đậm đặt bằng utility chứ không nhét
                                vào `.rhl-leader`: class đó dùng chung với
                                trang Ẩm thực (bảng giá món), nơi hai vế có
                                sắc độ khác. Hình dáng chung ở CSS, sắc độ
                                riêng ở nơi gọi. */}
                            <dt className="text-muted">{t<string>(row.label, lang)}</dt>
                            <dd className="font-semibold">{t<string>(row.value, lang)}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </article>
              </Reveal>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
