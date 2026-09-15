import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { OUT_DIR } from './paths'
import type {
  ParsedDataset, ParsedImageRef, ParsedRoom, ParsedPost, ParsedOffer,
  ParsedVenue, ParsedHall, ParsedAlbum, ParsedTestimonial, ParsedPage, ParsedSection,
  ParsedNavigation, ParsedSiteSettings, NavTarget, ParsedCta,
} from './types'
import type { AssetCache } from './assets'

/** _id tất định: chạy lại script không tạo document trùng. */
export function docId(kind: string, slug: string): string {
  const safe = slug.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
  return safe ? `${kind}.${safe}` : kind
}

export function localeValue<T>(vi: T | undefined | null): { vi: T } | undefined {
  if (vi === undefined || vi === null) return undefined
  if (typeof vi === 'string' && vi.trim() === '') return undefined
  if (Array.isArray(vi) && vi.length === 0) return undefined
  return { vi }
}

export function imageValue(ref: ParsedImageRef | undefined, cache: AssetCache) {
  if (!ref) return undefined
  const assetId = cache[ref.filePath]
  if (!assetId) return undefined
  return {
    _type: 'figure' as const,
    asset: { _type: 'reference' as const, _ref: assetId },
    ...(ref.alt ? { alt: { vi: ref.alt } } : {}),
  }
}

function slugValue(slug: string) {
  return { vi: { _type: 'slug', current: slug } }
}

function roomDoc(room: ParsedRoom, cache: AssetCache) {
  return {
    _id: docId('room', room.slug),
    _type: 'room',
    title: localeValue(room.title),
    slug: slugValue(room.slug),
    category: room.category,
    areaSqm: room.areaSqm,
    capacity: localeValue(room.capacity),
    view: localeValue(room.view),
    bedType: localeValue(room.bedType),
    summary: localeValue(room.summary),
    description: localeValue(room.description),
    heroImage: imageValue(room.heroImage, cache),
    // Mảng `figure` cần `_key` trên từng phần tử (không chỉ `_type`) để Studio
    // theo dõi/kéo-thả được — thiếu `_key` từng làm mất 10 ảnh thư viện của
    // phòng Deluxe (đã đo: 4/4 phòng đều có gallery, không phải trường hợp hiếm).
    gallery: room.gallery
      .map((g, i) => {
        const value = imageValue(g, cache)
        return value ? { _key: `img-${i}`, ...value } : undefined
      })
      .filter(Boolean),
    features: room.features.map((f, i) => ({
      _key: `feature-${i}`,
      _type: 'feature',
      label: localeValue(f.label),
      ...(f.icon && cache[f.icon.filePath]
        ? { icon: { _type: 'image', asset: { _type: 'reference', _ref: cache[f.icon.filePath] } } }
        : {}),
    })),
    order: room.order,
  }
}

function postDoc(post: ParsedPost, cache: AssetCache) {
  return {
    _id: docId('post', post.slug),
    _type: 'post',
    title: localeValue(post.title),
    slug: slugValue(post.slug),
    category: post.category,
    publishedAt: post.publishedAt,
    excerpt: localeValue(post.excerpt),
    coverImage: imageValue(post.coverImage, cache),
    body: localeValue(post.body),
    author: post.author,
  }
}

function offerDoc(offer: ParsedOffer, cache: AssetCache) {
  return {
    _id: docId('offer', offer.slug),
    _type: 'offer',
    title: localeValue(offer.title),
    slug: slugValue(offer.slug),
    excerpt: localeValue(offer.excerpt),
    image: imageValue(offer.image, cache),
    body: localeValue(offer.body),
    priceNote: localeValue(offer.priceNote),
    order: offer.order,
  }
}

function venueDoc(venue: ParsedVenue, cache: AssetCache) {
  return {
    _id: docId('venue', venue.slug),
    _type: 'venue',
    name: localeValue(venue.name),
    slug: slugValue(venue.slug),
    // Trường schema tên là `kind`, KHÔNG phải `venueKind` (đó là tên field ở
    // ParsedVenue) — dễ gõ nhầm vì hai bên khác tên.
    kind: venue.venueKind,
    location: localeValue(venue.location),
    capacity: localeValue(venue.capacity),
    hours: localeValue(venue.hours),
    // Phần tử mảng thuộc kiểu object có tên (ở đây là localeString) PHẢI mang
    // `_type`, nếu không Studio không biết render bằng gì.
    highlights: venue.highlights.map((h, i) => ({
      _key: `h-${i}`,
      _type: 'localeString',
      vi: h,
    })),
    description: localeValue(venue.description),
    image: imageValue(venue.image, cache),
    menuUrl: venue.menuUrl,
    phone: venue.phone,
    order: venue.order,
  }
}

function hallDoc(hall: ParsedHall, cache: AssetCache) {
  return {
    _id: docId('hall', hall.slug),
    _type: 'hall',
    name: localeValue(hall.name),
    slug: slugValue(hall.slug),
    areaSqm: hall.areaSqm,
    capacity: localeValue(hall.capacity),
    description: localeValue(hall.description),
    image: imageValue(hall.image, cache),
    order: hall.order,
  }
}

function albumDoc(album: ParsedAlbum, cache: AssetCache) {
  return {
    _id: docId('galleryAlbum', album.slug),
    _type: 'galleryAlbum',
    title: localeValue(album.title),
    slug: slugValue(album.slug),
    images: album.images
      .map((img, i) => {
        const value = imageValue(img, cache)
        return value ? { _key: `img-${i}`, ...value } : undefined
      })
      .filter(Boolean),
    order: album.order,
  }
}

function testimonialDoc(item: ParsedTestimonial, index: number) {
  return {
    // testimonial không có slug trong schema lẫn dữ liệu nguồn — dùng chỉ số
    // trong mảng (thứ tự cố định vì cùng đọc từ cùng một trang) làm phần định
    // danh duy nhất. Vẫn tất định: chạy lại parse+transform luôn ra cùng thứ tự.
    _id: docId('testimonial', `${index}`),
    _type: 'testimonial',
    heading: localeValue(item.heading),
    quote: localeValue(item.quote),
    author: item.author,
    source: item.source,
    order: item.order,
  }
}

/** Link trong section -> object `link` của schema, reference tới document thật. */
function ctaValue(cta: ParsedCta | undefined, routes: Map<string, string>, key: string) {
  if (!cta) return undefined
  const id = routes.get(cta.route)
  if (!id) {
    // Cùng nguyên tắc với linkValue() của navigation: một nút bấm vào thì 404
    // phải làm FAIL lúc dựng, không phải lúc khách bấm.
    throw new Error(
      `ctaValue(): nút "${cta.label}" trỏ route "${cta.route}" nhưng không document nào có route đó.`,
    )
  }
  return {
    _key: key,
    _type: 'link',
    kind: 'internal',
    label: localeValue(cta.label),
    reference: { _type: 'reference', _ref: id },
  }
}

function sectionValue(
  section: ParsedSection,
  index: number,
  cache: AssetCache,
  routes: Map<string, string>,
) {
  const key = `sec-${index}`
  switch (section._type) {
    case 'heroSection':
      return {
        _key: key, _type: 'heroSection',
        heading: localeValue(section.heading),
        subheading: localeValue(section.subheading),
        background: imageValue(section.background, cache),
        videoUrl: section.videoUrl,
      }
    case 'cardGridSection':
      return {
        _key: key, _type: 'cardGridSection',
        heading: localeValue(section.heading),
        subheading: localeValue(section.subheading),
        columns: section.columns,
        cards: section.cards.map((card, i) => ({
          _key: `card-${i}`,
          _type: 'card',
          title: localeValue(card.title),
          description: localeValue(card.description),
          image: imageValue(card.image, cache),
          cta: ctaValue(card.cta, routes, `cta-${i}`),
        })),
      }
    case 'imageTextSection':
      return {
        _key: key, _type: 'imageTextSection',
        heading: localeValue(section.heading),
        eyebrow: localeValue(section.eyebrow),
        content: localeValue(section.content),
        image: imageValue(section.image, cache),
        imageSide: section.imageSide,
        tone: section.tone,
        cta: ctaValue(section.cta, routes, 'cta'),
      }
    case 'mapSection':
      return {
        _key: key, _type: 'mapSection',
        heading: localeValue(section.heading),
        zoom: section.zoom,
      }
    case 'richTextSection':
      return {
        _key: key, _type: 'richTextSection',
        heading: localeValue(section.heading),
        content: localeValue(section.content),
        // Field màu nền của richTextSection tên là `tone` (enum
        // white/cream/ink) — KHÔNG phải `background` (đó là field ảnh, chỉ có
        // ở heroSection/ctaBandSection).
        tone: section.tone,
      }
    case 'tableSection':
      return {
        _key: key, _type: 'tableSection',
        heading: localeValue(section.heading),
        // Phần tử mảng thuộc kiểu object có tên PHẢI mang `_type`, nếu không
        // Studio không biết render bằng gì.
        headers: section.headers.map((h, i) => ({
          _key: `th-${i}`,
          _type: 'localeString',
          vi: h,
        })),
        rows: section.rows.map((row, r) => ({
          _key: `tr-${r}`,
          _type: 'row',
          cells: row.map((cell, c) => ({
            _key: `td-${c}`,
            _type: 'localeString',
            vi: cell,
          })),
        })),
      }
    case 'bookingWidgetSection':
      return { _key: key, _type: 'bookingWidgetSection' }
    case 'postListSection':
      return {
        _key: key, _type: 'postListSection',
        heading: localeValue(section.heading),
        category: section.category,
        limit: section.limit,
      }
    case 'galleryCarouselSection':
      return {
        _key: key, _type: 'galleryCarouselSection',
        heading: localeValue(section.heading),
        album: { _type: 'reference', _ref: docId('galleryAlbum', section.albumSlug) },
      }
    case 'venueListSection':
      return {
        _key: key, _type: 'venueListSection',
        heading: localeValue(section.heading),
        filterKind: section.filterKind,
        // `venues` (chọn tay) cố tình để trống — schema coi mảng rỗng/vắng
        // mặt là "lọc tự động theo filterKind", không phải "rỗng thì hiện 0
        // venue" (xem venueListSection.ts: field `venues` chỉ hiện trong
        // Studio khi filterKind === 'manual').
      }
    case 'hallListSection':
      return {
        _key: key, _type: 'hallListSection',
        heading: localeValue(section.heading),
        // `halls` để trống — theo đúng mô tả field trong hallListSection.ts:
        // "Để trống thì hiển thị tất cả."
      }
    case 'roomListSection':
      return {
        _key: key, _type: 'roomListSection',
        heading: localeValue(section.heading),
        // `rooms` để trống — theo đúng mô tả field trong roomListSection.ts:
        // "Để trống thì hiển thị tất cả loại phòng theo thứ tự."
      }
    default: {
      // Đảm bảo tại thời điểm biên dịch: nếu ParsedSection có thêm biến thể
      // mới mà switch chưa xử lý, tsc báo lỗi ở đây thay vì âm thầm bỏ sót.
      const exhaustive: never = section
      throw new Error(`Loại section chưa được transform: ${JSON.stringify(exhaustive)}`)
    }
  }
}

function pageDoc(
  page: ParsedPage,
  cache: AssetCache,
  testimonialIds: string[],
  routes: Map<string, string>,
) {
  const isHome = page.slug === ''
  const sections = page.sections
    .map((s, i) => sectionValue(s, i, cache, routes))
    .filter(Boolean)
  const seo = page.metaDescription
    ? { seo: { _type: 'seo', metaDescription: localeValue(page.metaDescription) } }
    : {}

  if (isHome) {
    return {
      _id: 'homePage',
      _type: 'homePage',
      title: localeValue(page.title),
      sections,
      // Tham chiếu tới CHÍNH `_id` mà `testimonialDoc()` đã sinh ra (nhận từ
      // tham số, không tự gọi lại `docId()` ở đây) — nếu không, hai nơi tính id
      // độc lập có thể lệch nhau và tạo reference treo mà không cách nào phát
      // hiện qua test đơn thuần so sánh chuỗi.
      testimonials: testimonialIds.map((id, i) => ({
        _key: `testimonial-${i}`,
        _type: 'reference' as const,
        _ref: id,
      })),
      ...seo,
    }
  }
  return {
    _id: docId('page', page.slug),
    _type: 'page',
    title: localeValue(page.title),
    slug: slugValue(page.slug),
    sections,
    ...seo,
  }
}

/** Ảnh cho trường schema kiểu `image` trần (logo/badge) — KHÔNG phải `figure`. */
function plainImage(ref: ParsedImageRef | undefined, cache: AssetCache) {
  if (!ref) return undefined
  const assetId = cache[ref.filePath]
  if (!assetId) return undefined
  return { _type: 'image' as const, asset: { _type: 'reference' as const, _ref: assetId } }
}

/**
 * Route (theo bản clone) -> `_id` document. Dựng TỪ chính dataset thay vì đoán
 * theo loại: nếu một route đổi từ `page` sang `room` thì map tự đúng theo.
 */
export function routeDocIds(dataset: ParsedDataset): Map<string, string> {
  const map = new Map<string, string>()
  for (const p of dataset.pages) {
    if (p.slug !== '') map.set(p.slug, docId('page', p.slug))
  }
  for (const r of dataset.rooms) map.set(r.slug, docId('room', r.slug))
  for (const p of dataset.posts) map.set(p.slug, docId('post', p.slug))
  return map
}

function linkValue(target: NavTarget, label: string, routes: Map<string, string>, key: string) {
  if (target.kind === 'none') return undefined
  if (target.kind === 'external') {
    return { _key: key, _type: 'link', kind: 'external', href: target.href, label: localeValue(label) }
  }
  // Trang chủ không có slug để tham chiếu; `hrefFor()` ở frontend trả về
  // `/<lang>` khi thiếu `internalSlug`, nên link nội bộ KHÔNG reference là
  // đúng nghĩa "về trang chủ".
  if (target.route === '') {
    return { _key: key, _type: 'link', kind: 'internal', label: localeValue(label) }
  }
  const id = routes.get(target.route)
  if (!id) {
    // Im lặng bỏ qua ở đây nghĩa là một mục menu biến mất mà không ai biết —
    // đúng kiểu lỗi đã tái diễn ở pha import trước. Cho fail to.
    throw new Error(
      `linkValue(): mục menu "${label}" trỏ tới route "${target.route}" nhưng không document nào có route đó.`,
    )
  }
  return {
    _key: key,
    _type: 'link',
    kind: 'internal',
    label: localeValue(label),
    reference: { _type: 'reference', _ref: id },
  }
}

export function navigationDoc(nav: ParsedNavigation, dataset: ParsedDataset) {
  const routes = routeDocIds(dataset)
  return {
    _id: 'navigation',
    _type: 'navigation',
    header: nav.header.map((item, i) => ({
      _key: `nav-${i}`,
      _type: 'navItem',
      label: localeValue(item.label),
      link: linkValue(item.target, item.label, routes, `link-${i}`),
      children: item.children.map((child, j) => ({
        _key: `nav-${i}-${j}`,
        _type: 'navChild',
        label: localeValue(child.label),
        link: linkValue(child.target, child.label, routes, `link-${i}-${j}`),
      })),
    })),
    footerColumns: nav.footerColumns.map((col, i) => ({
      _key: `col-${i}`,
      _type: 'footerColumn',
      title: localeValue(col.title),
      links: col.links.map((l, j) => linkValue(l.target, l.label, routes, `col-${i}-${j}`)),
    })),
  }
}

export function siteSettingsDoc(settings: ParsedSiteSettings, cache: AssetCache) {
  return {
    _id: 'siteSettings',
    _type: 'siteSettings',
    brandName: localeValue(settings.brandName),
    logo: plainImage(settings.logo, cache),
    logoLight: plainImage(settings.logoLight, cache),
    tel: settings.tel,
    mobile: settings.mobile,
    hotline: settings.hotline,
    emails: settings.emails.length > 0 ? settings.emails : undefined,
    addressShort: localeValue(settings.addressShort),
    addressFull: localeValue(settings.addressFull),
    // `initialValue` của schema chỉ áp dụng khi tạo document TRONG Studio, không
    // áp cho document import — thiếu ba số này thì MapSection không có toạ độ.
    lat: 20.9538,
    lng: 107.0435,
    mapZoom: 15,
    socials:
      settings.socials.length > 0
        ? settings.socials.map((s, i) => ({
            _key: `social-${i}`,
            _type: 'social',
            platform: s.platform,
            url: s.url,
          }))
        : undefined,
    companyName: localeValue(settings.companyName),
    businessLicense: settings.businessLicense,
    licenseIssuer: localeValue(settings.licenseIssuer),
    licenseDate: settings.licenseDate,
    motBadge: plainImage(settings.motBadge, cache),
    motBadgeUrl: settings.motBadgeUrl,
    copyright: localeValue(settings.copyright),
    secureBookingsWidgetId: settings.secureBookingsWidgetId,
  }
}

export function buildDocuments(dataset: ParsedDataset, cache: AssetCache): unknown[] {
  const routes = routeDocIds(dataset)
  const testimonialDocs = dataset.testimonials.map(testimonialDoc)
  const testimonialIds = testimonialDocs.map((t) => t._id)
  const documents = [
    ...dataset.rooms.map((r) => roomDoc(r, cache)),
    ...dataset.posts.map((p) => postDoc(p, cache)),
    ...dataset.offers.map((o) => offerDoc(o, cache)),
    ...dataset.venues.map((v) => venueDoc(v, cache)),
    ...dataset.halls.map((h) => hallDoc(h, cache)),
    ...dataset.albums.map((a) => albumDoc(a, cache)),
    ...testimonialDocs,
    ...dataset.pages.map((p) => pageDoc(p, cache, testimonialIds, routes)),
    navigationDoc(dataset.navigation, dataset),
    siteSettingsDoc(dataset.settings, cache),
  ]

  // `_id` của galleryAlbum/venue/hall/offer đến từ slugify() của một tiêu đề —
  // hai tiêu đề khác nhau slugify ra CÙNG một chuỗi sẽ âm thầm collapse thành
  // MỘT document qua createOrReplace (số lượng document ghi ra vẫn "hợp lý",
  // không có gì báo lỗi). Hiện tại 45/45 _id là duy nhất, nhưng đó là một sự
  // kiện quan sát được, không phải điều gì được đảm bảo về cấu trúc — chặn
  // tường minh ở đây để một va chạm slug trong tương lai làm build FAIL ngay,
  // thay vì âm thầm mất một document.
  const seenIds = new Set<string>()
  for (const doc of documents as Array<{ _id: string }>) {
    if (seenIds.has(doc._id)) {
      throw new Error(
        `buildDocuments(): trùng _id "${doc._id}" — hai document khác nhau sẽ collapse thành một qua createOrReplace.`,
      )
    }
    seenIds.add(doc._id)
  }

  return documents
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const dataset: ParsedDataset = JSON.parse(await readFile(`${OUT_DIR}/parsed.json`, 'utf-8'))

  let cache: AssetCache = {}
  try {
    cache = JSON.parse(await readFile(`${OUT_DIR}/assets.json`, 'utf-8'))
  } catch {
    console.warn('Chưa có out/assets.json — document sẽ không có ảnh. Chạy pnpm import:assets trước.')
  }

  const documents = buildDocuments(dataset, cache)
  const ndjson = documents.map((d) => JSON.stringify(d)).join('\n')
  await writeFile(`${OUT_DIR}/documents.ndjson`, ndjson, 'utf-8')
  console.log(`Đã dựng ${documents.length} document -> out/documents.ndjson`)
}

if (process.argv[1]?.endsWith('transform.ts')) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
