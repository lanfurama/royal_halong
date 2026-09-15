import type { Locale } from '@/lib/i18n'
import { HeroSection } from './HeroSection'
import { RichTextSection } from './RichTextSection'
import { ImageTextSection } from './ImageTextSection'
import { CardGridSection } from './CardGridSection'
import { GalleryCarouselSection } from './GalleryCarouselSection'
import { VenueListSection } from './VenueListSection'
import { HallListSection } from './HallListSection'
import { RoomListSection } from './RoomListSection'
import { CtaBandSection } from './CtaBandSection'
import { MapSection } from './MapSection'
import { TableSection } from './TableSection'
import { BookingWidgetSection } from './BookingWidgetSection'
import { LeadFormSection } from './LeadFormSection'
import { FaqSection } from './FaqSection'
import { PostListSection } from './PostListSection'

const REGISTRY: Record<string, React.ComponentType<any>> = {
  heroSection: HeroSection,
  richTextSection: RichTextSection,
  imageTextSection: ImageTextSection,
  cardGridSection: CardGridSection,
  galleryCarouselSection: GalleryCarouselSection,
  venueListSection: VenueListSection,
  hallListSection: HallListSection,
  roomListSection: RoomListSection,
  ctaBandSection: CtaBandSection,
  mapSection: MapSection,
  tableSection: TableSection,
  bookingWidgetSection: BookingWidgetSection,
  leadFormSection: LeadFormSection,
  faqSection: FaqSection,
  postListSection: PostListSection,
}

export function SectionRenderer({ sections, lang }: { sections: any[]; lang: Locale }) {
  return (
    <>
      {(sections ?? []).map((section, index) => {
        const Component = REGISTRY[section._type]
        if (!Component) {
          // Biên tập viên có thể thêm block mới trước khi component tồn tại —
          // bỏ qua thay vì làm sập cả trang.
          console.warn(`SectionRenderer: chưa có component cho _type "${section._type}"`)
          return null
        }
        return (
          <Component key={section._key ?? index} {...section} lang={lang} isFirst={index === 0} />
        )
      })}
    </>
  )
}
