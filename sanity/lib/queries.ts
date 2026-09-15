import { defineQuery } from 'next-sanity'

const IMAGE = `{ ..., asset->{ _id, url, metadata { dimensions, lqip } } }`

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
  "vi": slug.vi.current,
  "en": slug.en.current
}
`)

export const DOC_BY_SLUG_QUERY = defineQuery(`
*[
  (_type == "page" || _type == "room" || _type == "post" || _type == "offer")
  && (slug.vi.current == $slug || slug.en.current == $slug)
][0]{
  ...,
  heroImage ${IMAGE},
  coverImage ${IMAGE},
  image ${IMAGE},
  gallery[] ${IMAGE},
  features[]{ ..., icon ${IMAGE} },
  seo{ ..., ogImage ${IMAGE} },
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
