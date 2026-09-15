import '../../../globals.css'

// `[[...tool]]` giờ là root param của nhóm route (studio) (layout này là root
// của nhóm, xem app/(site)/[lang]/layout.tsx để biết vì sao route group tồn
// tại). Dưới `cacheComponents: true`, root param bắt buộc generateStaticParams
// trả ít nhất một giá trị — khác với TRƯỚC route group, khi `/studio/[[...tool]]`
// không phải root (root khi đó là app/layout.tsx dùng chung với site) nên
// không bị đòi hỏi này. `{ tool: [] }` ứng với chính `/studio` (catch-all TUỲ
// CHỌN khớp cả khi không có segment con). Sanity Studio tự định tuyến phía
// client cho mọi đường dẫn con (`/studio/desk/...`) — những giá trị `tool`
// khác không được liệt kê ở đây vẫn render được nhờ `dynamicParams` mặc định
// là `true` (không tắt), y hệt cách `[lang]/[slug]/page.tsx` chỉ liệt kê slug
// đã biết mà không cần liệt kê tuyệt đối mọi khả năng.
export function generateStaticParams() {
  return [{ tool: [] }]
}

// Root layout riêng cho nhóm route (studio) — Sanity Studio là một app UI
// độc lập (tiếng Anh, @sanity/ui tự quản lý font/theme riêng, không dùng
// class Tailwind của site công khai). `lang="en"` cố định vì Studio luôn hiển
// thị tiếng Anh, không theo locale `/vi`|`/en` của site. Giữ import
// globals.css để không đổi hành vi so với trước (khi còn dùng chung root
// layout với site) — Tailwind reset không đụng gì tới UI của Studio vì
// Studio không dùng class nào của nó. Không nạp font thương hiệu
// (`lib/fonts.ts`) — Studio không dùng, không cần tải thêm.
export default function StudioLayout({ children }: LayoutProps<'/studio/[[...tool]]'>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
