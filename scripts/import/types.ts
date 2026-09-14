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
