import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, t } from '@/lib/i18n'
import { hrefFor } from '@/lib/routes'
import { buildMetadata } from '@/lib/seo'
import {
  getHome,
  getPageSlugById,
  getReservationSlug,
  getRoomOptions,
  getSiteSettings,
} from '@/sanity/lib/fetchers'
import { SectionRenderer } from '@/components/sections/SectionRenderer'
import { SiteChrome } from '@/components/layout/SiteChrome'
import { HomeHero } from '@/components/home/HomeHero'
import { HomeIntro } from '@/components/home/HomeIntro'
import { HomeGallery } from '@/components/home/HomeGallery'
import { HomeServices } from '@/components/home/HomeServices'
import { HomeReviewMap } from '@/components/home/HomeReviewMap'
import { HomeFeatureDuo } from '@/components/home/HomeFeatureDuo'

/** `_id` tất định do script import sinh ra (`page.<slug-vi>`) — cùng quy ước
 * với `page.reservation` ở `RESERVATION_SLUG_QUERY`. */
const GALLERY_PAGE_ID = 'page.our-gallery'

/** Toạ độ Bãi Cháy — chặng cuối khi cả `mapSection` lẫn `siteSettings` đều
 * thiếu toạ độ. Cùng giá trị với `components/sections/MapSection.tsx`. */
const FALLBACK_COORDS = { lat: 20.9538, lng: 107.0435, zoom: 15 }

export async function generateMetadata({ params }: PageProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const [home, settings] = await Promise.all([getHome(), getSiteSettings()])
  return buildMetadata({ doc: home, lang, settings })
}

/**
 * Trang chủ là một BỐ CỤC RIÊNG, không phải một chuỗi section xếp dọc.
 *
 * Bản thiết kế (Claude Design — "Royal Ha Long Home v2 Light") gộp và sắp
 * lại các khối theo cách `SectionRenderer` không diễn đạt được: thanh đặt
 * phòng đè lên hero, hai `richTextSection` liền nhau thành một khối hai cột
 * kèm video, `testimonials` + `mapSection` đứng cạnh nhau trên một dải nền,
 * hai `imageTextSection` cuối thành một hàng hai thẻ.
 *
 * Nên trang này KHÔNG duyệt `sections[]` theo thứ tự mà RÚT từng khối theo
 * `_type`, rồi đưa vào đúng vị trí của bản thiết kế. Hai hệ quả phải giữ:
 *
 * 1. Mỗi khối rút ra đều phải chịu được `undefined` — biên tập viên xoá một
 *    section trong Sanity thì trang mất đúng khối đó, không sập.
 * 2. Section nào KHÔNG thuộc bố cục này (biên tập viên thêm `faqSection`,
 *    `ctaBandSection`…) vẫn phải hiển thị. Chúng được gom vào `leftovers` và
 *    render bằng `SectionRenderer` ở cuối, thay vì biến mất không dấu vết —
 *    đó là khác biệt giữa "bố cục cố định" và "CMS bị vô hiệu hoá".
 */
export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  const [home, settings, reservationSlug, gallerySlug, rooms] = await Promise.all([
    getHome(),
    getSiteSettings(),
    getReservationSlug(),
    getPageSlugById(GALLERY_PAGE_ID),
    getRoomOptions(),
  ])
  if (!home) notFound()

  const sections = ((home.sections as any[]) ?? []).filter(Boolean)

  // Rút theo `_type`. `take()` lấy phần tử đầu tiên chưa dùng và ĐÁNH DẤU đã
  // dùng, nên `leftovers` bên dưới chỉ còn đúng những gì bố cục này không
  // đụng tới — kể cả khi có hai `mapSection` hay ba `imageTextSection`.
  const used = new Set<any>()
  const take = (type: string, count = 1): any[] => {
    const picked = sections.filter((s) => s._type === type && !used.has(s)).slice(0, count)
    picked.forEach((s) => used.add(s))
    return picked
  }

  const [hero] = take('heroSection')
  const [intro, location] = take('richTextSection', 2)
  const [gallery] = take('galleryCarouselSection')
  const [services] = take('cardGridSection')
  const [map] = take('mapSection')
  const features = take('imageTextSection', 2)
  const leftovers = sections.filter((s) => !used.has(s))

  // Ảnh thumbnail cho video giới thiệu: ưu tiên ảnh đầu của album trang chủ
  // (ảnh sảnh/khách sạn do biên tập viên chọn), rơi về ảnh nền hero nếu
  // album trống. Không có cả hai -> `HomeIntro` bỏ hẳn cột video.
  const videoImage = gallery?.album?.images?.[0] ?? hero?.background

  // Toạ độ bản đồ: `mapSection.overrideCoords` bật -> dùng toạ độ riêng của
  // khối; tắt (mặc định) -> lấy từ Cấu hình site. Cùng quy tắc với
  // `components/sections/MapSection.tsx` — hai chỗ cùng đọc một schema.
  const coord = (key: 'lat' | 'lng', settingsKey: 'lat' | 'lng') =>
    map?.overrideCoords && typeof map[key] === 'number'
      ? (map[key] as number)
      : typeof (settings as any)?.[settingsKey] === 'number'
        ? ((settings as any)[settingsKey] as number)
        : FALLBACK_COORDS[key]
  const zoom =
    map?.overrideCoords && typeof map.zoom === 'number'
      ? map.zoom
      : typeof (settings as any)?.mapZoom === 'number'
        ? ((settings as any).mapZoom as number)
        : FALLBACK_COORDS.zoom

  const brand = t<string>((settings as any)?.brandName, lang) ?? 'Royal Halong Hotel'
  const reservationHref = hrefFor(lang, reservationSlug)
  const galleryHref = gallerySlug ? hrefFor(lang, gallerySlug) : null

  const roomChoices = rooms
    .map((room) => ({
      value: room.slug?.[lang]?.current ?? room.slug?.vi?.current ?? room._id,
      label: t<string>(room.title as any, lang) ?? '',
    }))
    .filter((room) => room.label)

  return (
    // Trang chủ không có `slug` (route luôn là `/${lang}`) -> truyền
    // `slug={null}` TƯỜNG MINH để `LangSwitcher` đi nhánh suy-từ-slug thay vì
    // fallback hoán prefix — kết quả giống nhau (`/${locale}`) nhưng nhất
    // quán với mọi trang khác, không phụ thuộc `usePathname()`.
    <SiteChrome lang={lang} slug={null}>
      {hero && (
        <HomeHero
          section={hero}
          lang={lang}
          settings={settings}
          reservationHref={reservationHref}
          rooms={roomChoices}
        />
      )}

      {(intro || location) && (
        <HomeIntro
          intro={intro}
          location={location}
          videoUrl={hero?.videoUrl}
          videoImage={videoImage}
          lang={lang}
          mapHref="#map"
        />
      )}

      {gallery && (
        <HomeGallery
          heading={gallery.heading}
          album={gallery.album}
          lang={lang}
          viewAllHref={galleryHref}
        />
      )}

      {services && (
        <HomeServices
          heading={services.heading}
          subheading={services.subheading}
          cards={services.cards}
          lang={lang}
        />
      )}

      <HomeReviewMap
        testimonials={home.testimonials as unknown[]}
        mapHeading={map?.heading}
        lat={coord('lat', 'lat')}
        lng={coord('lng', 'lng')}
        zoom={zoom}
        addressFull={t<string>((settings as any)?.addressFull, lang)}
        brand={brand}
        lang={lang}
      />

      <HomeFeatureDuo sections={features} lang={lang} />

      {/* Section biên tập viên thêm mà bố cục trên không có chỗ — xem ghi chú
          (2) ở đầu file. */}
      {leftovers.length > 0 && (
        <SectionRenderer
          sections={leftovers}
          lang={lang}
          widgetId={(settings as any)?.secureBookingsWidgetId}
          siteSettings={settings}
          currentSlug=""
        />
      )}
    </SiteChrome>
  )
}
