import { defineQuery } from 'next-sanity'
import { LOCALES } from '../../lib/i18n'

// Chiếu slug của TẤT CẢ locale, sinh từ `LOCALES` thay vì liệt kê tay
// `"vi": slug.vi.current, "en": slug.en.current`. Hai chỗ dưới đây (danh
// sách route cho sitemap/generateStaticParams, và tra document theo slug)
// phải luôn phủ đúng cùng một tập ngôn ngữ — liệt kê tay ở hai nơi là cách
// chắc chắn để thêm ngôn ngữ thứ bảy rồi quên một chỗ.
const ROUTE_SLUGS = LOCALES.map((l) => `"${l}": slug.${l}.current`).join(',\n  ')
const SLUG_MATCH_ANY_LOCALE = LOCALES.map((l) => `slug.${l}.current == $slug`).join(' || ')

const IMAGE = `{ ..., asset->{ _id, url, metadata { dimensions, lqip } } }`

/**
 * Chiếu một field `localeBlock` sao cho `figure` chèn giữa dòng chữ cũng được
 * mở `asset->`.
 *
 * Vì sao cần: `localeBlock` nhận `figure` làm phần tử mảng (xem
 * `sanity/schemaTypes/objects/localeBlock.ts`), nhưng projection trước đây chỉ
 * mở `asset->` cho các field ẢNH ĐỨNG RIÊNG (`image`, `background`,
 * `heroImage`…). Ảnh nằm trong nội dung rich text tới component chỉ có
 * `asset._ref` trần — mất `metadata.dimensions` và `lqip`, nên `SanityImage`
 * phải đoán 1600×1067 và không có ảnh mờ chờ tải. Sai tỉ lệ thật thì ảnh bị
 * méo và trang nhảy layout khi ảnh tải xong.
 *
 * Sinh từ `LOCALES` chứ không liệt kê tay sáu nhánh — cùng lý do với
 * `ROUTE_SLUGS` ngay trên.
 */
const localeBlockWithFigures = (field: string) =>
  `${field}{ ${LOCALES.map((l) => `${l}[]{ ..., _type == "figure" => ${IMAGE} }`).join(', ')} }`

const LINK = `{
  kind,
  label,
  blank,
  href,
  "internalSlug": reference->slug
}`

/** Mở đủ tham chiếu cho 14 loại section. */
// Ba nhánh `roomListSection`/`hallListSection`/`venueListSection` dưới đây
// chạy `select(...)` rồi chiếu (project) kết quả bằng `{...}`. `select()` trả
// một MẢNG (dù nhánh nào khớp), và một object-projection trần áp thẳng lên
// mảng đó không map qua từng phần tử — nó trả `null`. Phải có `[]` ngay sau
// `select(...)` trước dấu `{` để chiếu lên từng phần tử của mảng kết quả.
// Thiếu `[]` từng khiến `resolved` là `null` với MỌI trang có dữ liệu thật
// (đã kiểm bằng `groq-js` chạy trên `documents.ndjson`, xem
// `tests/unit/queries.projection.test.ts`) dù test string-match vẫn xanh.
// `background` CHỈ là ảnh (heroSection, ctaBandSection). Nền màu của
// richTextSection/imageTextSection là field riêng tên `tone` (chuỗi enum) —
// hai thứ này từng trùng tên, và projection ảnh bên dưới sẽ phá giá trị chuỗi
// nếu ai đó đặt lại tên cho trùng.
const SECTIONS = `sections[]{
  ...,
  background ${IMAGE},
  image ${IMAGE},
  cta ${LINK},
  ${localeBlockWithFigures('content')},
  cards[]{ ..., image ${IMAGE}, cta ${LINK} },
  _type == "galleryCarouselSection" => { album-> { _id, title, images[] ${IMAGE} } },
  _type == "roomListSection" => {
    "resolved": select(
      count(rooms) > 0 => rooms[]->,
      *[_type == "room"] | order(order asc)
    )[]{ _id, title, slug, summary, areaSqm, capacity, view, heroImage ${IMAGE} }
  },
  _type == "hallListSection" => {
    "resolved": select(
      count(halls) > 0 => halls[]->,
      *[_type == "hall"] | order(order asc)
    )[]{ _id, name, slug, areaSqm, capacity, description, image ${IMAGE} }
  },
  _type == "postListSection" => {
    "resolved": *[
      _type == "post" && (^.category == "all" || category == ^.category)
    ] | order(publishedAt desc) [0...50]{
      _id, title, slug, excerpt, publishedAt, coverImage ${IMAGE}
    }
  },
  _type == "venueListSection" => {
    "resolved": select(
      filterKind == "manual" => venues[]->,
      *[_type == "venue" && kind == ^.filterKind] | order(order asc)
    )[]{ _id, name, slug, location, capacity, hours, highlights, menuUrl, phone, description, image ${IMAGE} }
  }
}`

// Ghi chú: `postListSection` lấy cận trên cố định 50 rồi để component cắt theo
// `limit`. Cố nhét `coalesce(^.limit, 12)` vào slice GROQ là chỗ dễ vỡ — slice
// nhận biểu thức tham chiếu scope cha không đáng tin, và 50 bài là thừa sức cho
// một site khách sạn.

export const ALL_ROUTES_QUERY = defineQuery(`
*[
  (_type == "page" || _type == "room" || _type == "post" || _type == "offer")
  && defined(slug.vi.current)
]{
  _type,
  ${ROUTE_SLUGS}
}
`)

// `cta ${LINK}` ở CẤP DOCUMENT (không chỉ trong `sections[]`): `offer` có
// field `cta` riêng ngoài mọi section. Thiếu dòng này thì `cta` tới
// `SmartLink` mà KHÔNG có `internalSlug` (nó do `reference->slug` sinh ra),
// nên mọi nút "nội bộ" trên trang ưu đãi lặng lẽ trỏ về trang chủ thay vì
// trang đích — không lỗi, không cảnh báo, chỉ là một cái nút dẫn sai chỗ.
export const DOC_BY_SLUG_QUERY = defineQuery(`
*[
  (_type == "page" || _type == "room" || _type == "post" || _type == "offer")
  && (${SLUG_MATCH_ANY_LOCALE})
][0]{
  ...,
  heroImage ${IMAGE},
  coverImage ${IMAGE},
  image ${IMAGE},
  gallery[] ${IMAGE},
  features[]{ ..., icon ${IMAGE} },
  seo{ ..., ogImage ${IMAGE} },
  cta ${LINK},
  ${localeBlockWithFigures('body')},
  ${localeBlockWithFigures('description')},
  ${SECTIONS}
}
`)

export const HOME_QUERY = defineQuery(`
*[_id == "homePage"][0]{
  ...,
  seo{ ..., ogImage ${IMAGE} },
  testimonials[]->,
  ${SECTIONS}
}
`)

export const SITE_SETTINGS_QUERY = defineQuery(`
*[_id == "siteSettings"][0]{
  ...,
  logo ${IMAGE},
  logoLight ${IMAGE},
  motBadge ${IMAGE}
}
`)

export const NAVIGATION_QUERY = defineQuery(`
*[_id == "navigation"][0]{
  header[]{ label, link ${LINK}, children[]{ label, link ${LINK} } },
  footerColumns[]{ title, links[] ${LINK} }
}
`)

export const POSTS_BY_CATEGORY_QUERY = defineQuery(`
*[_type == "post" && category == $category] | order(publishedAt desc){
  _id, title, slug, excerpt, publishedAt, coverImage ${IMAGE}
}
`)

export const ROOMS_QUERY = defineQuery(`
*[_type == "room"] | order(order asc){
  _id, title, slug, summary, areaSqm, capacity, view, heroImage ${IMAGE}
}
`)

export const VENUES_BY_KIND_QUERY = defineQuery(`
*[_type == "venue" && kind == $kind] | order(order asc){
  _id, name, slug, location, capacity, hours, highlights, menuUrl, phone, image ${IMAGE}
}
`)

export const HALLS_QUERY = defineQuery(`
*[_type == "hall"] | order(order asc){
  _id, name, slug, areaSqm, capacity, description, image ${IMAGE}
}
`)

// `_id` tất định `page.<slug-vi>` do script import sinh ra (xem
// `scripts/import/transform.ts` — `docId('page', page.slug)`), giống hệt
// cách `homePage`/`siteSettings`/`navigation` đã được truy vấn bằng `_id`
// cố định thay vì đoán slug. Dùng để suy ra đường dẫn trang đặt phòng ĐÚNG
// theo dữ liệu Sanity (xem `RoomPage.tsx`), thay vì hardcode `/${lang}/
// reservation` — hardcode đó gãy ngay khi trang "Đặt phòng" đổi slug hoặc có
// slug EN riêng.
export const RESERVATION_SLUG_QUERY = defineQuery(`
*[_id == "page.reservation"][0]{ slug }
`)

/**
 * Danh sách loại phòng cho ô "Loại phòng" của thanh đặt phòng trên hero
 * (`components/home/HeroBookingBar.tsx`).
 *
 * Lấy từ document `room` THẬT chứ không hardcode bốn lựa chọn như bản
 * thiết kế ("Deluxe / Premier Seaview / Royal Suite / Villa") — khách sạn
 * này thực tế có PHÒNG DELUXE, PHÒNG PREMIUM, VILLAS DELUXE, VILLAS SUITE.
 * Một ô chọn liệt kê loại phòng không tồn tại là lời hứa sai ngay ở hành
 * động chính của trang.
 */
/**
 * Slug của một `page` theo `_id` tất định do script import sinh ra
 * (`page.<slug-vi>`). Cùng cơ chế với `RESERVATION_SLUG_QUERY`, nhưng nhận
 * `_id` qua tham số để không phải thêm một query gần-giống-hệt cho mỗi
 * trang cần trỏ tới. Trả `null` khi trang bị xoá/đổi `_id` — nơi gọi tự bỏ
 * link thay vì trỏ vào 404.
 */
export const PAGE_SLUG_BY_ID_QUERY = defineQuery(`
*[_id == $id][0]{ slug }
`)

export const ROOM_OPTIONS_QUERY = defineQuery(`
*[_type == "room"] | order(order asc){ _id, title, slug }
`)
