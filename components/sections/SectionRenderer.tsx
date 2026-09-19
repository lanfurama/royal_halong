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
import { CollapsibleGroup } from './CollapsibleGroup'
import { PageNavSection } from './PageNavSection'
import { CapacityPickerSection } from './CapacityPickerSection'
import { ProcessSection } from './ProcessSection'

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
  pageNavSection: PageNavSection,
  capacityPickerSection: CapacityPickerSection,
  processSection: ProcessSection,
}

/**
 * Hai loại section có thể mang cờ `collapsible` (xem schema tương ứng). Khai
 * ở ĐÂY chứ không hỏi `'collapsible' in section`: một section bất kỳ do biên
 * tập viên thêm cờ nhầm vào không được phép biến mất vào accordion — nó vẫn
 * phải render bằng component của chính nó.
 */
const COLLAPSIBLE_TYPES = new Set(['richTextSection', 'tableSection'])

function isCollapsible(section: any): boolean {
  return section?.collapsible === true && COLLAPSIBLE_TYPES.has(section?._type)
}

/**
 * Gom các section GẬP ĐỨNG LIỀN NHAU thành một cụm.
 *
 * Vì sao gom thay vì để mỗi khối tự render một `<details>`: mỗi section là
 * một `<section className="py-16 lg:py-24">` riêng với nền xen kẽ trắng/kem.
 * Chín khối gập liên tiếp, mỗi khối khi đóng chỉ cao 56px, sẽ thành chín dải
 * màu luân phiên cao 248px với một dòng chữ ở giữa — nhiều khoảng trống hơn
 * cả nội dung. Một cụm = một nền, một danh sách có đường kẻ ngăn, đọc ra
 * đúng thứ nó là: mục lục tra cứu.
 *
 * Trả về mảng phẳng để `index` của từng section GỐC được giữ nguyên — `isFirst`
 * (quyết định `priority` của ảnh hero) phải bám chỉ số thật, không phải chỉ số
 * sau khi gom.
 */
type RenderItem =
  | { kind: 'single'; section: any; index: number }
  | { kind: 'group'; sections: any[]; index: number }

export function groupSections(sections: any[]): RenderItem[] {
  const items: RenderItem[] = []
  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i]
    if (!isCollapsible(section)) {
      items.push({ kind: 'single', section, index: i })
      continue
    }
    const run: any[] = []
    const start = i
    while (i < sections.length && isCollapsible(sections[i])) {
      run.push(sections[i])
      i += 1
    }
    i -= 1 // vòng `for` sẽ +1 ngay sau đây
    items.push({ kind: 'group', sections: run, index: start })
  }
  return items
}

export function SectionRenderer({
  sections,
  lang,
  widgetId,
  siteSettings,
  currentSlug,
}: {
  sections: any[]
  lang: Locale
  widgetId?: string
  /** Truyền cho `mapSection` — dùng khi `overrideCoords` tắt (mặc định), lấy
   * toạ độ từ `siteSettings.lat/lng/mapZoom` đúng như schema mô tả. */
  siteSettings?: any
  /** Truyền cho `leadFormSection` làm `sourcePage` — slug của trang đang
   * render (trang chủ truyền `''`), để lead ghi lại nó được gửi từ đâu. */
  currentSlug?: string
}) {
  return (
    <>
      {groupSections((sections ?? []).filter(Boolean)).map((item) => {
        if (item.kind === 'group') {
          return (
            <CollapsibleGroup
              key={item.sections[0]?._key ?? `group-${item.index}`}
              sections={item.sections}
              lang={lang}
            />
          )
        }

        const { section, index } = item
        const Component = REGISTRY[section._type]
        if (!Component) {
          // Biên tập viên có thể thêm block mới trước khi component tồn tại —
          // bỏ qua thay vì làm sập cả trang.
          console.warn(`SectionRenderer: chưa có component cho _type "${section._type}"`)
          return null
        }
        return (
          <Component
            key={section._key ?? index}
            {...section}
            lang={lang}
            isFirst={index === 0}
            {...(section._type === 'bookingWidgetSection' ? { widgetId } : {})}
            {...(section._type === 'mapSection' ? { siteSettings } : {})}
            {...(section._type === 'leadFormSection' ? { sourcePage: currentSlug } : {})}
          />
        )
      })}
    </>
  )
}
