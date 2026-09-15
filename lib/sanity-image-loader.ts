/**
 * Fix c9-7: thay `/_next/image` bằng gọi thẳng Sanity CDN cho mọi
 * `next/image`. Đo được thật trước khi sửa: `src` render ra là
 * `/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2F…-1600x1067.jpg&w=3840` —
 * Next tải bản GỐC (2560px) từ Sanity rồi tự resize LẦN NỮA ở tầng của nó;
 * trên Vercel mỗi width khác nhau trong srcset tính phí một lượt transform
 * riêng (214 asset × nhiều width = tốn thật, và mỗi origin fetch kéo bản
 * 2560px gốc thay vì đúng kích thước cần).
 *
 * ĐÃ THỬ VÀ BỎ: truyền `loader` như một prop trần trong
 * `components/ui/SanityImage.tsx` (cách trực tiếp nhất theo đúng chữ của
 * yêu cầu ban đầu). `pnpm build` nổ thật:
 *
 *   Error: Functions cannot be passed directly to Client Components unless
 *   you explicitly expose it by marking it with "use server"...
 *     {src: ..., loader: function loader, ...}
 *
 * `next/image` cần gọi lại `loader` ở phía CLIENT (sinh URL cho từng width
 * trong `sizes`/srcset một cách lazy) — một hàm JS trần không serialize
 * được qua ranh giới Server -> Client Component của React. `SanityImage`
 * hầu hết được gọi trực tiếp từ Server Component (không `"use client""`,
 * vd. `HeroSection`, `RoomListSection`...), nên prop `loader` dạng inline
 * closure vỡ ngay khi build 61 trang tĩnh.
 *
 * Next hỗ trợ CHÍNH THỨC đúng nhu cầu này qua `images.loader: 'custom'` +
 * `images.loaderFile` trong `next.config.ts`: file này được Next tự wire
 * vào cả bundle server lẫn client trong quá trình build, không đi qua
 * đường prop-serialize giữa Server/Client Component — cùng hành vi cuối
 * (gọi thẳng CDN Sanity với đúng `width`/`quality`, không qua
 * `/_next/image`), khác cơ chế truyền.
 */
export default function sanityImageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}): string {
  try {
    const url = new URL(src)
    url.searchParams.set('w', String(width))
    url.searchParams.set('q', String(quality ?? 75))
    return url.toString()
  } catch {
    // `src` không phải URL tuyệt đối hợp lệ (không nên xảy ra — SanityImage
    // luôn truyền `urlFor(image).url()`, đã là URL tuyệt đối) -> trả nguyên
    // src, để next/image tự xử lý thay vì throw.
    return src
  }
}
