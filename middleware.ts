import { NextResponse, type NextRequest } from 'next/server'
import { LOCALES, DEFAULT_LOCALE } from './lib/i18n'

const SKIP = /^\/(?:studio|api|_next|favicon\.ico|robots\.txt|sitemap\.xml)/

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (SKIP.test(pathname)) return NextResponse.next()

  const hasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  )
  if (hasLocale) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`
  // 308 (permanent): NextResponse.redirect() mặc định là 307 (tạm thời), nhưng
  // ghi chú thiết kế ở trên nói rõ đây phải là redirect vĩnh viễn cho SEO.
  return NextResponse.redirect(url, 308)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
