import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { toPortableText, textOf } from '../html'
import { toImageRef, realSrc } from './shared'
import type { ParsedRoom, ParsedRoomFeature } from '../types'

const ORDER: Record<string, number> = {
  deluxe: 1,
  premium: 2,
  'villas-suite': 3,
  'villas-deluxe': 4,
}

/** Lấy phần sau dấu hai chấm: "Diện tích: 39 m2" -> "39 m2" */
function afterColon(label: string): string {
  const i = label.indexOf(':')
  return i === -1 ? label.trim() : label.slice(i + 1).trim()
}

export function parseRoom(html: string, slug: string): ParsedRoom {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, slug, 'index.html'))

  const title = textOf($('h3').first().html() ?? '')

  // Tiện nghi: mỗi mục là .iwithtext gồm .iwt-icon img + .iwt-text
  const features: ParsedRoomFeature[] = []
  $('.iwithtext').each((_, el) => {
    const label = textOf($(el).find('.iwt-text').html() ?? '')
    if (!label) return
    features.push({
      label,
      icon: toImageRef(realSrc($(el).find('.iwt-icon img')), routeDir),
    })
  })

  const findFeature = (prefix: string) =>
    features.find((f) => f.label.toLowerCase().startsWith(prefix.toLowerCase()))?.label

  const areaLabel = findFeature('Diện tích')
  const areaMatch = areaLabel?.match(/(\d+(?:[.,]\d+)?)/)

  // Mô tả: các <p> trong khối nội dung chính, trước phần "TÍNH NĂNG PHÒNG"
  const bodyHtml = $('.wpb_text_column').slice(0, 2).html() ?? ''

  const gallery: ParsedRoom['gallery'] = []
  $('.wpb_gallery img, .nectar-flickity img').each((_, el) => {
    const ref = toImageRef(realSrc($(el)), routeDir)
    if (ref) gallery.push(ref)
  })

  // Ảnh đại diện không phải <img> mà là nền của khối #intro (banner đầu trang),
  // gán qua data-nectar-img-src trên .row-bg — không có class .page-header-bg-image
  // như brief dự đoán ban đầu (selector đó không khớp gì trên HTML thật).
  const heroImage =
    toImageRef(realSrc($('#intro .row-bg').first()), routeDir) ??
    toImageRef(realSrc($('.page-header-bg-image img').first()), routeDir) ??
    toImageRef(realSrc($('img').first()), routeDir)

  const capacityLabel = findFeature('Sức chứa')
  const viewLabel = findFeature('Hướng phòng')
  const bedTypeLabel = findFeature('Loại giường')

  return {
    kind: 'room',
    slug,
    title,
    category: slug.startsWith('villas') ? 'villa' : 'hotel',
    areaSqm: areaMatch ? Number(areaMatch[1].replace(',', '.')) : undefined,
    capacity: capacityLabel ? afterColon(capacityLabel) : undefined,
    view: viewLabel ? afterColon(viewLabel) : undefined,
    bedType: bedTypeLabel ? afterColon(bedTypeLabel) : undefined,
    summary: textOf(bodyHtml).slice(0, 300) || undefined,
    description: toPortableText(bodyHtml),
    heroImage,
    gallery,
    features,
    order: ORDER[slug] ?? 99,
  }
}
