import type { Locale } from '@/lib/i18n'

/**
 * PLACEHOLDER — Task 5 (SectionRenderer + 15 component khối) thay bằng ánh xạ
 * `_type` -> component thật. Ở đây chỉ nhận đúng props mà `app/[lang]/page.tsx`
 * và `app/[lang]/[slug]/page.tsx` truyền vào và không render gì, để các route
 * đọc dữ liệu Sanity thật (homePage, page, ...) biên dịch và chạy được trong
 * lúc Task 5 chưa chạy.
 */
export function SectionRenderer(_props: { sections: unknown[]; lang: Locale }) {
  return null
}
