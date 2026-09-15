import { cachedSanity, cachedSanityStaticParams } from './live'
import {
  ALL_ROUTES_QUERY,
  DOC_BY_SLUG_QUERY,
  HOME_QUERY,
  SITE_SETTINGS_QUERY,
  NAVIGATION_QUERY,
} from './queries'

/**
 * Dự án chưa chạy Sanity TypeGen, nên `cachedSanity` trả `data: unknown`
 * (xem `ClientReturn<Query, Fallback>` của `@sanity/client` — không có
 * `SanityQueries` augmentation thì rơi về `Fallback = unknown`). Khai lỏng
 * hai kiểu dưới đây để các route ở Task 2 dùng được `_type`/`vi`/`en`/
 * `sections` mà không phá `strict` của tsconfig. Các task sau (5, 6) tự thu
 * hẹp kiểu theo `_type` khi cần.
 */
export interface RouteEntry {
  _type: 'page' | 'room' | 'post' | 'offer'
  vi: string
  en: string | null
}

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
