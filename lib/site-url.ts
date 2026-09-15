/**
 * Nguồn duy nhất cho domain tuyệt đối dùng trong canonical/hreflang/og:url/
 * sitemap/robots. Trước đây bốn chỗ (`lib/seo.ts` x2, `app/sitemap.ts`,
 * `app/robots.ts`) tự lặp lại `process.env.NEXT_PUBLIC_SITE_URL ??
 * 'http://localhost:3000'` — không đồng bộ hoá là do sao chép, và không chỗ
 * nào validate: thiếu biến môi trường trên production chỉ lặng lẽ rơi về
 * localhost, dẫn tới `http://localhost:3000` xuất hiện 54 lần trong output đã
 * deploy (canonical, cả hai hreflang, og:url, sitemap, robots).
 *
 * Thứ tự ưu tiên:
 * 1. `NEXT_PUBLIC_SITE_URL` — biến chính, set thủ công (đã có sẵn trong
 *    `.env.local`/Vercel project settings).
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — Vercel tự set (không có scheme, chỉ
 *    hostname, vd. `royal-halong.vercel.app`), dùng khi biến trên chưa set
 *    (preview deploy quên cấu hình, hoặc domain production đổi).
 * 3. Không có gì cả:
 *    - `NODE_ENV === 'production'` (cả `next build` lẫn `next start`) ->
 *      throw. Domain sai lặng lẽ trên production (báo Google
 *      `lang="vi"`/canonical trỏ localhost) tệ hơn build fail rõ ràng.
 *    - Ngược lại (dev) -> `http://localhost:3000`, vẫn tiện cho phát triển.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelUrl) return `https://${vercelUrl}`

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Thiếu NEXT_PUBLIC_SITE_URL (và không có VERCEL_PROJECT_PRODUCTION_URL) trên production — ' +
        'không thể sinh URL tuyệt đối đúng domain cho canonical/hreflang/og:url/sitemap/robots. ' +
        'Set NEXT_PUBLIC_SITE_URL trong biến môi trường trước khi build/deploy.',
    )
  }

  return 'http://localhost:3000'
}
