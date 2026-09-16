import { describe, it, expect } from 'vitest'
import type { ReactElement, ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { HeaderShell } from '@/components/layout/HeaderShell'
import { Footer } from '@/components/layout/Footer'

// `siteSettings` và `navigation` chưa có document nào trong Sanity hôm nay —
// getSiteSettings()/getNavigation() trả null. Header/Footer là Server
// Component thuần (không hook), nên gọi trực tiếp như hàm và soi cây phần
// tử React trả về mà không cần render DOM thật — bắt đúng kiểu lỗi mà kế
// hoạch này lo nhất: component "trông đúng với ca đã thử, rỗng lặng lẽ với
// ca thật" (menu rỗng lẽ ra phải KHÔNG có <nav>, chứ không phải <nav> rỗng).

type Fiber = ReactElement<Record<string, unknown>> | ReactNode

function collectTags(node: Fiber, acc: Set<string> = new Set()): Set<string> {
  if (node == null || typeof node !== 'object') return acc
  if (Array.isArray(node)) {
    for (const child of node) collectTags(child as Fiber, acc)
    return acc
  }
  const el = node as ReactElement<Record<string, unknown>>
  if (!('type' in el)) return acc
  if (typeof el.type === 'string') acc.add(el.type)
  const children = el.props?.children as ReactNode
  if (children !== undefined) collectTags(children as Fiber, acc)
  return acc
}

function collectText(node: Fiber, acc: string[] = []): string[] {
  if (node == null) return acc
  if (typeof node === 'string') {
    acc.push(node)
    return acc
  }
  if (typeof node !== 'object') return acc
  if (Array.isArray(node)) {
    for (const child of node) collectText(child as Fiber, acc)
    return acc
  }
  const el = node as ReactElement<Record<string, unknown>>
  if (!('type' in el)) return acc
  const children = el.props?.children as ReactNode
  if (children !== undefined) collectText(children as Fiber, acc)
  return acc
}

/** Gom mọi `aria-label` trong cây. Cần vì tên khách sạn không còn hiện thành
 * CHỮ trong header — logo đã ra chính giữa và nó tự mang tên trong ảnh, nên
 * tên thật giờ sống ở tên truy cập của link về trang chủ. `collectText` không
 * thấy được thứ nằm trong prop. */
function collectAriaLabels(node: Fiber, acc: string[] = []): string[] {
  if (node == null || typeof node !== 'object') return acc
  if (Array.isArray(node)) {
    for (const child of node) collectAriaLabels(child as Fiber, acc)
    return acc
  }
  const el = node as ReactElement<Record<string, unknown>>
  if (!('type' in el)) return acc
  const label = el.props?.['aria-label']
  if (typeof label === 'string') acc.push(label)
  const children = el.props?.children as ReactNode
  if (children !== undefined) collectAriaLabels(children as Fiber, acc)
  return acc
}

describe('Header — settings/navigation rỗng (trạng thái thực tế hôm nay)', () => {
  it('không crash với settings/navigation null', () => {
    expect(() => Header({ lang: 'vi', navigation: null, settings: null })).not.toThrow()
  })

  it('không render <nav> desktop khi navigation.header rỗng — không phải <nav> rỗng', () => {
    const tree = Header({ lang: 'vi', navigation: null, settings: null })
    expect(collectTags(tree).has('nav')).toBe(false)
  })

  it('vẫn bọc trong <header> và liên kết trang chủ có tên truy cập (fallback brandName)', () => {
    const tree = Header({ lang: 'vi', navigation: null, settings: null })
    // `<header>` nay nằm trong `HeaderShell` — một Client Component giữ trạng
    // thái cuộn — nên nó không còn là một tag CHUỖI trong cây mà `Header()`
    // trả về. Kiểm tra đúng thứ kiểm tra được ở đây: header vẫn được bọc bởi
    // vỏ ấy, chứ không phải rơi mất đi đâu.
    expect((tree as ReactElement).type).toBe(HeaderShell)
    expect(collectAriaLabels(tree)).toContain('Royal Halong Hotel')
  })

  it('cũng không crash khi navigation/settings là object rỗng {}', () => {
    expect(() => Header({ lang: 'en', navigation: {}, settings: {} })).not.toThrow()
    const tree = Header({ lang: 'en', navigation: {}, settings: {} })
    expect(collectTags(tree).has('nav')).toBe(false)
  })
})

describe('Footer — settings/navigation rỗng (trạng thái thực tế hôm nay)', () => {
  it('không crash với settings/navigation null', () => {
    expect(() => Footer({ lang: 'vi', navigation: null, settings: null })).not.toThrow()
  })

  it('không render <nav> cột chân trang khi footerColumns rỗng', () => {
    const tree = Footer({ lang: 'vi', navigation: null, settings: null })
    expect(collectTags(tree).has('nav')).toBe(false)
  })

  it('bỏ qua cả cột khi có tiêu đề nhưng không có link nào — không render <nav> bọc <ul> rỗng', () => {
    const tree = Footer({
      lang: 'vi',
      navigation: { footerColumns: [{ title: { vi: 'Khám phá' }, links: [] }] },
      settings: null,
    })
    expect(collectTags(tree).has('nav')).toBe(false)
  })

  it('render <nav> khi cột có ít nhất một link', () => {
    const tree = Footer({
      lang: 'vi',
      navigation: {
        footerColumns: [
          {
            title: { vi: 'Khám phá' },
            links: [{ kind: 'external', href: 'https://example.com', label: { vi: 'Ví dụ' } }],
          },
        ],
      },
      settings: null,
    })
    expect(collectTags(tree).has('nav')).toBe(true)
  })

  it('vẫn có <footer>, không render <address>/badge/liên hệ rỗng khi thiếu dữ liệu', () => {
    const tree = Footer({ lang: 'vi', navigation: null, settings: null })
    const tags = collectTags(tree)
    expect(tags.has('footer')).toBe(true)
    // Không có tel/mobile/email -> <address> không render (thay vì render rỗng).
    expect(tags.has('address')).toBe(false)
    // motBadge/motBadgeUrl thiếu, socials thiếu, contact links thiếu ->
    // không có <a> nào được tạo ra trong toàn bộ Footer.
    expect(tags.has('a')).toBe(false)
  })

  it('có <address> khi có ít nhất một chi tiết liên hệ', () => {
    const tree = Footer({
      lang: 'vi',
      navigation: null,
      settings: { tel: '0203 3123 456' },
    })
    expect(collectTags(tree).has('address')).toBe(true)
  })
})
