import { heroSection } from './heroSection'
import { richTextSection } from './richTextSection'
import { imageTextSection } from './imageTextSection'
import { cardGridSection } from './cardGridSection'
import { galleryCarouselSection } from './galleryCarouselSection'
import { venueListSection } from './venueListSection'
import { hallListSection } from './hallListSection'
import { roomListSection } from './roomListSection'
import { ctaBandSection } from './ctaBandSection'
import { mapSection } from './mapSection'
import { tableSection } from './tableSection'
import { bookingWidgetSection } from './bookingWidgetSection'
import { leadFormSection } from './leadFormSection'
import { faqSection } from './faqSection'
import { postListSection } from './postListSection'
import { pageNavSection } from './pageNavSection'
import { capacityPickerSection } from './capacityPickerSection'
import { processSection } from './processSection'

export const sectionTypes = [
  heroSection,
  richTextSection,
  imageTextSection,
  cardGridSection,
  galleryCarouselSection,
  venueListSection,
  hallListSection,
  roomListSection,
  ctaBandSection,
  mapSection,
  tableSection,
  bookingWidgetSection,
  leadFormSection,
  faqSection,
  postListSection,
  pageNavSection,
  capacityPickerSection,
  processSection,
]

/** Tên 18 block, dùng cho field `of` của page.sections và homePage. */
export const SECTION_TYPE_NAMES = sectionTypes.map((s) => s.name)
