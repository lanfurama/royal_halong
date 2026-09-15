import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'
import { display, body, accent, alt } from '@/lib/fonts'
import { SanityLive } from '@/sanity/lib/live'
import './globals.css'

export const metadata: Metadata = {
  title: 'Royal Halong Hotel',
}

// Root layout không nhận `params` của segment [lang] — App Router bắt buộc
// <html>/<body> chỉ được khai ở đây (route /studio nằm ngoài [lang] cũng đi
// qua layout này), nên không thể biết locale tại thời điểm render. Không dùng
// headers()/cookies() để suy ra: dưới `cacheComponents: true`, một API động ở
// đây sẽ kéo TOÀN BỘ site (kể cả 57 trang tĩnh) sang render động — không chấp
// nhận được, và middleware.ts không được sửa cho task này. Thay vào đó
// `app/[lang]/layout.tsx` (nơi có `lang` tĩnh, đúng theo `generateStaticParams`)
// tự sửa `document.documentElement.lang` bằng script `beforeInteractive` — chạy
// trước khi trang tương tác được, không có nháy sai ngôn ngữ. `vi` ở đây chỉ là
// giá trị ban đầu trong lúc chờ HTML parse tới script đó.
export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const { isEnabled: isDraftMode } = await draftMode()
  const fontVars = [display, body, accent, alt].map((f) => f.variable).join(' ')
  return (
    <html lang="vi" className={fontVars} suppressHydrationWarning>
      <body>
        {children}
        <SanityLive includeDrafts={isDraftMode} />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
