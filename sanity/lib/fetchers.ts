import { cachedSanity, cachedSanityStaticParams } from './live'
import type { Locale } from '@/lib/i18n'
import type { SlugField } from '@/lib/routes'
import {
  ALL_ROUTES_QUERY,
  DOC_BY_SLUG_QUERY,
  HOME_QUERY,
  SITE_SETTINGS_QUERY,
  NAVIGATION_QUERY,
  RESERVATION_SLUG_QUERY,
  ROOM_OPTIONS_QUERY,
  PAGE_SLUG_BY_ID_QUERY,
} from './queries'

/**
 * Dự án chưa chạy Sanity TypeGen, nên `cachedSanity` trả `data: unknown`
 * (xem `ClientReturn<Query, Fallback>` của `@sanity/client` — không có
 * `SanityQueries` augmentation thì rơi về `Fallback = unknown`). Khai lỏng
 * hai kiểu dưới đây để các route ở Task 2 dùng được `_type`/`vi`/`en`/
 * `sections` mà không phá `strict` của tsconfig. Các task sau (5, 6) tự thu
 * hẹp kiểu theo `_type` khi cần.
 */
/**
 * Một route với slug của MỌI locale (`ALL_ROUTES_QUERY` chiếu đủ sáu, sinh
 * từ `LOCALES`). `vi` luôn có — query đã lọc `defined(slug.vi.current)`;
 * các locale còn lại có thể `null` và được `resolveRouteSlug()`
 * (`lib/routes.ts`) giải quyết theo đúng chuỗi fallback của `t()`.
 */
export type RouteEntry = {
  _type: 'page' | 'room' | 'post' | 'offer'
  vi: string
} & Partial<Record<Locale, string | null>>

export interface SanityDoc {
  _id: string
  _type: string
  sections?: unknown[]
  [key: string]: unknown
}

export async function getAllRoutes(): Promise<RouteEntry[]> {
  const { data } = await cachedSanityStaticParams({ query: ALL_ROUTES_QUERY })
  return (data as RouteEntry[] | null) ?? []
}

/**
 * `defineLive({ strict: true })` bắt MỌI lời gọi `cachedSanity` phải khai
 * `perspective` và `stega`. Thiếu là hỏng typecheck, và hỏng cả lúc chạy.
 * Gói lại một chỗ để không chỗ gọi nào quên.
 */
const PUBLISHED = { perspective: 'published', stega: false } as const

export async function getDocBySlug(slug: string): Promise<SanityDoc | null> {
  const { data } = await cachedSanity({
    query: DOC_BY_SLUG_QUERY,
    params: { slug },
    ...PUBLISHED,
  })
  return data as SanityDoc | null
}

export async function getHome(): Promise<SanityDoc | null> {
  const { data } = await cachedSanity({ query: HOME_QUERY, ...PUBLISHED })
  return data as SanityDoc | null
}

export async function getSiteSettings() {
  const { data } = await cachedSanity({ query: SITE_SETTINGS_QUERY, ...PUBLISHED })
  return data
}

export async function getNavigation() {
  const { data } = await cachedSanity({ query: NAVIGATION_QUERY, ...PUBLISHED })
  return data
}

/**
 * Slug của trang "Đặt phòng" (`_id` tất định `page.reservation` — xem chú
 * thích ở `RESERVATION_SLUG_QUERY`). Dùng thay cho hardcode `/${lang}/
 * reservation` ở `RoomPage.tsx`. `null` khi document đó bị xoá/đổi `_id` —
 * chỗ gọi tự fallback về path tĩnh cũ, không throw.
 */
export async function getReservationSlug(): Promise<SlugField | null> {
  const { data } = await cachedSanity({ query: RESERVATION_SLUG_QUERY, ...PUBLISHED })
  return (data as { slug?: SlugField } | null)?.slug ?? null
}

export interface RoomOption {
  _id: string
  title?: Record<string, string | null> | null
  slug?: SlugField | null
}

/** Loại phòng cho thanh đặt phòng trên hero — xem `ROOM_OPTIONS_QUERY`. */
export async function getRoomOptions(): Promise<RoomOption[]> {
  const { data } = await cachedSanity({ query: ROOM_OPTIONS_QUERY, ...PUBLISHED })
  return (data as RoomOption[] | null) ?? []
}

/** Slug của một trang theo `_id` tất định — xem `PAGE_SLUG_BY_ID_QUERY`. */
export async function getPageSlugById(id: string): Promise<SlugField | null> {
  const { data } = await cachedSanity({
    query: PAGE_SLUG_BY_ID_QUERY,
    params: { id },
    ...PUBLISHED,
  })
  return (data as { slug?: SlugField } | null)?.slug ?? null
}
