import type { Locale } from '@/lib/i18n'

/**
 * PLACEHOLDER — Task 4 (Header, Footer, chuyển ngôn ngữ, menu mobile) thay
 * bằng component thật. Ở đây chỉ nhận đúng props mà `app/[lang]/layout.tsx`
 * truyền vào và không render gì, để layout biên dịch và các route đọc được
 * trong lúc Task 4 chưa chạy.
 *
 * Ruling 3 (progress.md): `navigation`/`settings` có thể rỗng (`siteSettings`
 * và `navigation` chưa có document nào trong Sanity) — component thật ở
 * Task 4 phải chịu được điều này mà không crash.
 */
export function Header(_props: { lang: Locale; navigation: unknown; settings: unknown }) {
  return null
}
