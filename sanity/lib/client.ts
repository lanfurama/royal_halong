import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

/**
 * Dataset là PRIVATE (không phải "public" như next-sanity mặc định giả định
 * cho các fetch `perspective: 'published'`). `sanityFetch` của
 * `next-sanity/live` (xem `sanity/lib/live.ts`) chỉ gắn `serverToken` cho
 * request khi `perspective !== 'published'` hoặc `stega: true` — với
 * `perspective: 'published', stega: false` (đúng như `PUBLISHED` trong
 * `sanity/lib/fetchers.ts`) nó gửi `token: undefined` xuống client bên dưới.
 * `@sanity/client` chỉ dùng `overrides.token || config.token`, nên nếu client
 * gốc không có token cấu hình sẵn, request published bị coi là ẩn danh và
 * dataset private trả về mảng rỗng — im lặng, không lỗi.
 *
 * Gắn `SANITY_API_READ_TOKEN` (token quyền VIEWER, đã dùng cho draft mode)
 * ngay ở client gốc để mọi fetch, kể cả khi `next-sanity` không forward
 * token, vẫn xác thực được. Không nới quyền: dataset vẫn private, chỉ là
 * server dùng đúng token đã được cấp cho việc đọc.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Live Content API cần useCdn: false
  token: process.env.SANITY_API_READ_TOKEN,
})
