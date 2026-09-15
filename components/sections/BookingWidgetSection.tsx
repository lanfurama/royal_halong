'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { Container } from '@/components/ui/Container'

export function BookingWidgetSection({ widgetId, lang }: { widgetId?: string; lang: string }) {
  useEffect(() => {
    if (!widgetId) {
      console.warn('BookingWidgetSection: chưa có secureBookingsWidgetId trong Cấu hình site.')
    }
  }, [widgetId])

  if (!widgetId) return null

  return (
    <section className="py-12">
      <Container>
        <link rel="stylesheet" href="https://book.securebookings.net/css/app.css" />
        <div className="hbe-bws">
          <section id="hbe-bws-page">
            <div id="hbe-bws-wrapper" />
          </section>
        </div>
        <Script src="https://book.securebookings.net/js/widget.all.js" strategy="afterInteractive" />
        <Script
          src={`https://book.securebookings.net/widgetCustomize?lang=${lang}&widgetType=Widget&id=${widgetId}&ajax=true`}
          strategy="afterInteractive"
        />
      </Container>
    </section>
  )
}
