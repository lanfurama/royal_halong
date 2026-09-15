import type { Locale } from '@/lib/i18n'
import type { SanityDoc } from '@/sanity/lib/fetchers'

/**
 * PLACEHOLDER — Task 6 (trang phòng, bài viết, ưu đãi) thay bằng component
 * thật. Ở đây chỉ nhận đúng props mà `app/[lang]/[slug]/page.tsx` truyền vào
 * (dispatch theo `doc._type === 'room'`) và không render gì, để route catch-all
 * biên dịch và chạy được trong lúc Task 6 chưa chạy.
 */
export function RoomPage(_props: { doc: SanityDoc; lang: Locale }) {
  return null
}
