import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { OUT_DIR, ROUTES, routeToHtmlPath } from './paths'
import { parseRoom } from './parsers/room'
import { parsePost } from './parsers/post'
import { parseOffers } from './parsers/offer'
import { parseVenues } from './parsers/venue'
import { parseHalls } from './parsers/hall'
import { parseGalleryAlbums } from './parsers/gallery'
import { parseTestimonials } from './parsers/testimonial'
import { parsePage } from './parsers/page'
import type { ParsedDataset } from './types'

const ROOM_SLUGS = ['deluxe', 'premium', 'villas-deluxe', 'villas-suite']

/**
 * Liệt kê tường minh, KHÔNG lọc theo độ dài slug. Lọc `r.length > 40` tình cờ đúng
 * với 3 bài hiện có, nhưng độ dài slug không định nghĩa "đây là bài viết" — thêm một
 * bài tin tức tên ngắn hoặc một landing page tên dài là hỏng im lặng.
 */
const POST_SLUGS = [
  'canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel',
  'quy-2-2023-ctcp-quoc-te-hoang-gia-ric-kien-tri-voi-muc-tieu-kinh-doanh-on-dinh',
  'thong-cao-bao-chi-dhcd-ctcp-quoc-te-hoang-gia-khoi-sac-cung-du-lich-dia-phuong',
]

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const read = (r: string) => readFile(routeToHtmlPath(r), 'utf-8')

  const dataset: ParsedDataset = {
    rooms: [],
    posts: [],
    offers: [],
    venues: [],
    halls: [],
    albums: [],
    testimonials: [],
    pages: [],
  }

  for (const slug of ROOM_SLUGS) {
    dataset.rooms.push(parseRoom(await read(slug), slug))
  }
  for (const slug of POST_SLUGS) {
    dataset.posts.push(parsePost(await read(slug), slug))
  }

  dataset.offers = parseOffers(await read('offers'))
  dataset.venues = [
    ...parseVenues(await read('culinary'), 'culinary', 'dining'),
    ...parseVenues(await read('experiences'), 'experiences', 'facility'),
  ]
  dataset.halls = parseHalls(await read('royal-international-convention-palace'))
  dataset.albums = parseGalleryAlbums(await read('our-gallery'))
  dataset.testimonials = parseTestimonials(await read(''))

  // Mọi route còn lại thành `page` — kể cả culinary/experiences/royal-international-
  // convention-palace/our-gallery/offers: các route đó VỪA sinh venue/hall/album/offer
  // riêng ở trên VỪA có nội dung hero/rich-text cấp trang cần một document `page` để
  // giữ. Khớp bảng "Ánh xạ route → document" trong spec (mục 258-267): 14 route map
  // sang `page`, cộng route rỗng (trang chủ) cũng đi qua đây rồi được transform.ts
  // biến thành `homePage` — tổng 15 phần tử trong dataset.pages.
  const handled = new Set([...ROOM_SLUGS, ...POST_SLUGS])
  for (const route of ROUTES) {
    if (handled.has(route)) continue
    dataset.pages.push(parsePage(await read(route), route))
  }

  const outFile = `${OUT_DIR}/parsed.json`
  await writeFile(outFile, JSON.stringify(dataset, null, 2), 'utf-8')

  console.log('Đã ghi', outFile)
  console.table({
    rooms: dataset.rooms.length,
    posts: dataset.posts.length,
    offers: dataset.offers.length,
    venues: dataset.venues.length,
    halls: dataset.halls.length,
    albums: dataset.albums.length,
    testimonials: dataset.testimonials.length,
    pages: dataset.pages.length,
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
