'use client'

import dynamic from 'next/dynamic'
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'

// Leaflet đụng `window` khi import -> bắt buộc tắt SSR.
const LeafletMap = dynamic(() => import('@/components/ui/LeafletMap').then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => <div className="bg-cream h-96 w-full" aria-hidden="true" />,
})

export function MapSection({ heading, lat, lng, zoom = 15, lang }: any & { lang: Locale }) {
  // Toạ độ Bãi Cháy làm mặc định nếu Cấu hình site chưa có.
  const latitude = typeof lat === 'number' ? lat : 20.9538
  const longitude = typeof lng === 'number' ? lng : 107.0435

  return (
    <section className="py-16">
      <Container>
        {heading && (
          <h2 className="font-display text-gold-deep mb-6 text-center text-3xl">
            {t<string>(heading, lang)}
          </h2>
        )}
        <LeafletMap lat={latitude} lng={longitude} zoom={zoom} />
      </Container>
    </section>
  )
}
