// Bản tạm — Plan D thay bằng form thật nối vào Neon.
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'

export function LeadFormSection({ heading, description, lang }: any & { lang: Locale }) {
  return (
    <section className="bg-cream py-16">
      <Container size="narrow">
        {heading && (
          <h2 className="font-display text-gold-deep mb-3 text-3xl">{t<string>(heading, lang)}</h2>
        )}
        {description && <p className="mb-6 text-sm">{t<string>(description, lang)}</p>}
        <p className="text-sm italic">Form sẽ hoạt động sau khi hoàn tất Plan D.</p>
      </Container>
    </section>
  )
}
