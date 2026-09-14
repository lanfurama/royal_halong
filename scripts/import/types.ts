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
