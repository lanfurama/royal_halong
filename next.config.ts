import type { NextConfig } from 'next'
import { sanity } from 'next-sanity/live/cache-life'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: { default: sanity },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
    // Gọi thẳng Sanity CDN thay vì proxy qua `/_next/image` — xem
    // `lib/sanity-image-loader.ts` cho lý do và một cách khác đã thử (prop
    // `loader` inline) nhưng vỡ build vì không serialize được qua ranh giới
    // Server -> Client Component.
    loader: 'custom',
    loaderFile: './lib/sanity-image-loader.ts',
  },
  experimental: {
    // Bật `app/global-not-found.tsx` (xem file đó để biết vì sao cần nó).
    // Đo được bằng curl: `/vi/khong-ton-tai` (slug hợp lệ locale, không có
    // document khớp -> `notFound()`) rơi vào `_not-found` GỐC của Next, không
    // đi qua `app/(site)/[lang]/layout.tsx` — vì `[slug]` là dynamic param
    // NGOÀI `generateStaticParams()`, và project không có `app/layout.tsx`
    // gốc truyền thống (chỉ có layout theo route group). Không bật cờ này,
    // Next tự chèn shell mặc định `<html id="__next_error__">` KHÔNG có
    // `lang` cho đúng ca đó.
    globalNotFound: true,
  },
}

export default nextConfig
