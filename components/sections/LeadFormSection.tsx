import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { LeadForm } from '@/components/forms/LeadForm'

export function LeadFormSection({
  heading,
  description,
  formType = 'general',
  successMessage,
  lang,
  sourcePage,
}: any & { lang: Locale }) {
  return (
    <section className="bg-cream py-16">
      <Container size="narrow">
        {heading && (
          <h2 className="font-display text-gold-deep mb-3 text-3xl">{t(heading, lang)}</h2>
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
