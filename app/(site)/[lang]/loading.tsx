'use client'

import { usePathname } from 'next/navigation'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n'

/**
 * Fallback `<Suspense>` cho toàn bộ `/[lang]/*`.
 *
 * Vì sao phải là Client Component trong khi `LoadingScreen` thì không:
 * `loading.js` KHÔNG nhận tham số nào — Next quy định rõ ("Loading UI
 * components do not accept any parameters", `node_modules/next/dist/docs/
 * 01-app/03-api-reference/03-file-conventions/loading.md`). Nó nằm ở segment
 * `[lang]` nhưng vẫn không thấy `params.lang`, nên ngôn ngữ phải lấy từ URL.
 *
 * `usePathname()` chứ không `useParams()`: trong lúc chuyển trang, URL đã
 * đổi sang trang ĐÍCH trước khi fallback hiện ra, nên đoạn đầu của pathname
 * luôn là locale đúng của trang sắp tới. `useParams()` đọc từ context của
 * router và ở ranh giới Suspense có thể còn là params của trang CŨ — tức
 * khách đang bấm sang bản tiếng Nhật vẫn thấy chữ "Đang tải".
 *
 * `isLocale` chặn mọi thứ khác (ảnh 404, đường dẫn rác) rơi vào `ui()` —
 * `DICT[key][undefined]` sẽ ném ở runtime chứ không im lặng.
 */
export default function Loading() {
  const first = usePathname().split('/')[1] ?? ''
  return <LoadingScreen lang={isLocale(first) ? first : DEFAULT_LOCALE} />
}
