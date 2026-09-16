'use client'

import dynamic from 'next/dynamic'
import { type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'

// Leaflet đụng `window` khi import -> bắt buộc tắt SSR.
const LeafletMap = dynamic(() => import('@/components/ui/LeafletMap').then((m) => m.LeafletMap), {
  ssr: false,
  // Trạng thái ĐANG TẢI của bản đồ: phải cao ĐÚNG bằng bản đồ thật
  // (h-96 = 384px, khớp LeafletMap) — lệch một pixel là trang nhảy khi
  // Leaflet gắn vào. Bo góc và nền kem giống khung thật để không loé
  // một hình chữ nhật lạ giữa lúc tải.
  loading: () => (
    <div
      className="bg-cream h-96 w-full animate-pulse rounded-media motion-reduce:animate-none"
      aria-hidden="true"
    />
  ),
})

export function MapSection({
  heading,
  overrideCoords,
  lat,
  lng,
  zoom,
  lang,
  siteSettings,
}: any & { lang: Locale; siteSettings?: any }) {
  // Đúng theo mô tả trong schema (`overrideCoords`: "Tắt thì lấy toạ độ từ
  // Cấu hình site"): overrideCoords bật -> dùng lat/lng riêng của khối; tắt
  // (mặc định) -> dùng `siteSettings.lat/lng`. `siteSettings` hôm nay chưa có
  // document nào (getSiteSettings() trả null), và không có instance
  // `mapSection` thật nào trong dữ liệu để chạy thử — nhánh "lấy từ Cấu hình
  // site" chưa được xác minh bằng dữ liệu thật, chỉ bằng cách đọc schema.
  // Toạ độ Bãi Cháy làm mặc định cuối cùng nếu cả hai đều thiếu.
  const latitude =
    overrideCoords && typeof lat === 'number'
      ? lat
      : typeof siteSettings?.lat === 'number'
        ? siteSettings.lat
        : 20.9538
  const longitude =
    overrideCoords && typeof lng === 'number'
      ? lng
      : typeof siteSettings?.lng === 'number'
        ? siteSettings.lng
        : 107.0435
  // Cùng logic override với lat/lng ở trên — trước đây field này bị bỏ qua,
  // luôn rơi về literal `15` dù `siteSettings.mapZoom` có giá trị, trái với
  // đúng ý định đã ghi ở `SectionRenderer.tsx` (siteSettings.lat/lng/mapZoom).
  const zoomLevel =
    overrideCoords && typeof zoom === 'number'
      ? zoom
      : typeof siteSettings?.mapZoom === 'number'
        ? siteSettings.mapZoom
        : 15

  return (
    <section className="bg-white py-16 lg:py-24">
      <Container size="wide">
        <SectionHeading heading={heading} lang={lang} />
        {/* `overflow-hidden` cắt các ô tile vuông góc của Leaflet theo bo góc
            của khung — không có nó, tile vẫn tràn ra bốn góc và bo góc chỉ
            là trang trí vô hình. */}
        <div className="shadow-card overflow-hidden rounded-media">
          <LeafletMap lat={latitude} lng={longitude} zoom={zoomLevel} />
        </div>
      </Container>
    </section>
  )
}
