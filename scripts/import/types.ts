import type { PortableTextBlock } from 'sanity'

/** Hạt giống song ngữ: chỉ đổ vi, en để trống cho biên tập viên nhập sau. */
export interface LocaleSeed<T> {
  vi: T
}

/** Tham chiếu tới một file ảnh trên đĩa, sẽ được thay bằng asset id ở pha transform. */
export interface ParsedImageRef {
  /** Đường dẫn tuyệt đối tới ảnh GỐC (đã khử biến thể srcset). */
  filePath: string
  alt?: string
}

export interface ParsedRoomFeature {
  icon?: ParsedImageRef
  label: string
}

export interface ParsedRoom {
  kind: 'room'
  slug: string
  title: string
  category: 'hotel' | 'villa'
  areaSqm?: number
  capacity?: string
  view?: string
  bedType?: string
  summary?: string
  description: PortableTextBlock[]
  heroImage?: ParsedImageRef
  gallery: ParsedImageRef[]
  features: ParsedRoomFeature[]
  order: number
}

export interface ParsedPost {
  kind: 'post'
  slug: string
  title: string
  category: 'news' | 'announcement'
  publishedAt: string // ISO 8601
  excerpt?: string
  coverImage?: ParsedImageRef
  body: PortableTextBlock[]
  author?: string
}

export interface ParsedOffer {
  kind: 'offer'
  slug: string
  title: string
  excerpt?: string
  image?: ParsedImageRef
  body: PortableTextBlock[]
  priceNote?: string
  order: number
}

export interface ParsedVenue {
  kind: 'venue'
  slug: string
  name: string
  venueKind: 'dining' | 'facility'
  location?: string
  capacity?: string
  hours?: string
  highlights: string[]
  description: PortableTextBlock[]
  image?: ParsedImageRef
  menuUrl?: string
  phone?: string
  order: number
}

export interface ParsedHall {
  kind: 'hall'
  slug: string
  name: string
  areaSqm?: number
  capacity?: string
  description: PortableTextBlock[]
  image?: ParsedImageRef
  order: number
}

export interface ParsedAlbum {
  kind: 'album'
  slug: string
  title: string
  images: ParsedImageRef[]
  order: number
}

export interface ParsedTestimonial {
  kind: 'testimonial'
  heading: string
  quote: string
  author: string
  source: string
  order: number
}

export type ParsedSection =
  | { _type: 'heroSection'; heading: string; subheading?: string; background?: ParsedImageRef }
  | {
      _type: 'richTextSection'
      heading?: string
      content: PortableTextBlock[]
      tone: 'white' | 'cream' | 'ink'
    }
  | { _type: 'tableSection'; heading?: string; headers: string[]; rows: string[][] }
  | { _type: 'bookingWidgetSection' }
  | { _type: 'galleryCarouselSection'; heading?: string; albumSlug: string }
  | { _type: 'postListSection'; heading?: string; category: 'news' | 'announcement'; limit: number }
  // Ba loại "danh sách" — schema đã có (sanity/schemaTypes/sections/), nhưng
  // trước bản sửa này KHÔNG parser nào sinh ra chúng: 8 document venue + 3
  // document hall không được section nào trên trang trỏ tới (không thể truy
  // cập từ Plan C). Để trống mảng tham chiếu (venues/halls/rooms) — quy ước
  // của CHÍNH schema (xem trường `description`/`hidden` trong
  // sections/hallListSection.ts, roomListSection.ts, venueListSection.ts):
  // để trống nghĩa là "hiển thị tất cả", nên transform.ts không cần render gì
  // thêm ngoài `heading`/`filterKind`.
  | { _type: 'venueListSection'; heading?: string; filterKind: 'dining' | 'facility' }
  | { _type: 'hallListSection'; heading?: string }
  | { _type: 'roomListSection'; heading?: string }

export interface ParsedPage {
  kind: 'page'
  slug: string
  title: string
  sections: ParsedSection[]
  metaDescription?: string
}

/** Đích của một mục điều hướng sau khi đã chuẩn hoá href của bản clone. */
export type NavTarget =
  | { kind: 'internal'; route: string }
  | { kind: 'external'; href: string }
  | { kind: 'none' }

export interface ParsedNavItem {
  label: string
  target: NavTarget
  children: ParsedNavItem[]
}

export interface ParsedFooterColumn {
  title: string
  links: Array<{ label: string; target: NavTarget }>
}

export interface ParsedNavigation {
  header: ParsedNavItem[]
  footerColumns: ParsedFooterColumn[]
}

export interface ParsedSocial {
  platform: 'facebook' | 'instagram' | 'tripadvisor' | 'x' | 'youtube'
  url: string
}

export interface ParsedSiteSettings {
  brandName: string
  logo?: ParsedImageRef
  logoLight?: ParsedImageRef
  tel?: string
  mobile?: string
  hotline?: string
  emails: string[]
  addressShort?: string
  addressFull?: string
  socials: ParsedSocial[]
  companyName?: string
  businessLicense?: string
  licenseIssuer?: string
  /** ISO yyyy-mm-dd — schema siteSettings.licenseDate là kiểu `date`. */
  licenseDate?: string
  motBadge?: ParsedImageRef
  motBadgeUrl?: string
  copyright?: string
  secureBookingsWidgetId?: string
}

export interface ParsedDataset {
  rooms: ParsedRoom[]
  posts: ParsedPost[]
  offers: ParsedOffer[]
  venues: ParsedVenue[]
  halls: ParsedHall[]
  albums: ParsedAlbum[]
  testimonials: ParsedTestimonial[]
  pages: ParsedPage[]
  navigation: ParsedNavigation
  settings: ParsedSiteSettings
}
