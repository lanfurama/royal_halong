import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { LeadForm } from '@/components/forms/LeadForm'

export function LeadFormSection({
  heading,
  eyebrow,
  description,
  contacts,
  layout = 'stack',
  formType = 'general',
  successMessage,
  lang,
  sourcePage,
}: any & { lang: Locale }) {
  // Xem chú thích cùng lớp lỗi ở CardGridSection — GROQ trả `null` tường minh.
  const contactList: any[] = contacts ?? []

  if (layout !== 'split') {
    return (
      <section className="bg-cream-alt py-16">
        <Container size="narrow">
          {heading && (
            <h2 className="font-display mb-3 text-3xl">{t(heading, lang)}</h2>
          )}
          {description && <p className="mb-8 text-sm">{t(description, lang)}</p>}
          <LeadForm
            formType={formType}
            lang={lang}
            sourcePage={sourcePage}
            successMessage={t(successMessage, lang)}
          />
        </Container>
      </section>
    )
  }

  /* Bố cục `split` — cách liên hệ bên trái, biểu mẫu bên phải.
     Vì sao thêm: ở bản `stack`, số hotline chỉ tồn tại trong câu trả lời
     cuối của khối FAQ phía trên. Một cặp đôi đang chọn nơi cưới thường gọi
     trước khi điền form, và bắt họ mở accordion để tìm số điện thoại là đặt
     đường đi NHANH nhất sau một cú bấm không có dấu hiệu gì.

     Biểu mẫu vẫn là `LeadForm` nguyên vẹn — khối này chỉ đổi chỗ đứng của
     nó, không đụng field, không đụng validation, không đụng đường dữ liệu
     chạy về `app/actions/lead.ts`. */
  return (
    <section id="tu-van" className="bg-cream-alt py-16 lg:py-24">
      <Container size="wide">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
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
            {description && <p className="mt-5 max-w-[52ch]">{t<string>(description, lang)}</p>}

            {contactList.length > 0 && (
              <dl className="border-line mt-9 grid gap-6 border-t pt-8">
                {contactList.map((item: any, index: number) => {
                  const value = t<string>(item.value, lang)
                  if (!value) return null
                  return (
                    <div key={item._key ?? index}>
                      <dt className="text-gold-deep text-[0.6875rem] tracking-[0.18em] uppercase">
                        {t<string>(item.label, lang)}
                      </dt>
                      <dd className="font-display mt-2 text-xl">
                        {item.href ? (
                          /* `min-h-11` + `inline-flex`: số điện thoại trên
                             trang tiệc cưới là thứ được bấm nhiều nhất ở khổ
                             điện thoại, và một dòng chữ 20px cao 28px là
                             dưới ngưỡng vùng chạm. Không có `href` thì đây
                             chỉ là chữ (địa chỉ), không cần vùng chạm. */
                          <a
                            href={item.href}
                            className="text-gold-deep inline-flex min-h-11 items-center hover:underline"
                          >
                            {value}
                          </a>
                        ) : (
                          value
                        )}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            )}
          </div>

          {/* Thẻ kem sáng nổi lên khỏi nền `cream-alt` — cùng cách phân tầng
              với thanh đặt phòng ở trang chủ, để biểu mẫu đọc ra là một vật
              thể đặt trên trang chứ không phải một vùng nền đổi màu. */}
          <div className="shadow-card bg-cream-soft p-7 lg:p-9">
            <LeadForm
              formType={formType}
              lang={lang}
              sourcePage={sourcePage}
              successMessage={t(successMessage, lang)}
            />
          </div>
        </div>
      </Container>
    </section>
  )
}
