/**
 * Nhóm A — LƯU TRÚ.
 *
 * Ghi đúng sáu document, không hơn (sáu nhóm chạy song song trên CÙNG một
 * dataset thật):
 *
 *   page.luu-tru-phong-khach-san-villas
 *   room.suite · room.deluxe · room.premium · room.villas-deluxe · room.villas-suite
 *
 * Chạy: `npx tsx scripts/content/luu-tru.ts` — chạy lại bao nhiêu lần cũng ra
 * cùng một kết quả (mọi `_key` sinh tất định từ `resetKeys()` + thứ tự dựng,
 * và mọi lần ghi đều là `patch().set()` chứ không `createOrReplace`).
 *
 * ── Vòng 1 (Agent 1 — dựng) viết `vi` + `en`. ───────────────────────────────
 * ── Vòng 2 (Agent 2 — dịch & soát) điền `zh/ko/ja/th`, đủ sáu ở MỌI field.
 *
 * Ba lớp bọc `draft()` / `draftBlock()` / `draftFig()` vẫn giữ nguyên: chúng
 * uỷ quyền thẳng cho `loc()` / `blockLoc()` / `fig()` khi một mục đủ sáu ngôn
 * ngữ — hiện tại là mọi mục, nên toàn bộ file đi qua hàng rào kiểm tra gốc.
 * Giữ lớp bọc để vòng sau thêm nội dung mới vẫn dựng được bản nháp.
 *
 * ── Nguồn số liệu ──────────────────────────────────────────────────────────
 * HTML bản clone ở gốc repo: `luu-tru-phong-khach-san-villas/index.html`,
 * `deluxe/`, `premium/`, `villas-deluxe/`, `villas-suite/`. Không có số nào
 * trong file này mà bản clone không nói. Ba chỗ bản clone TỰ MÂU THUẪN được
 * ghi chú ngay tại điểm dùng (Villas Deluxe: hướng phòng và sức chứa; Villas
 * Suite: hướng phòng).
 *
 * `room.suite` (95 m², hướng biển) KHÔNG có trang riêng trong bản clone —
 * mọi số liệu lấy từ thẻ "PHÒNG SUITE" lặp ở năm trang: trang Lưu trú và khối
 * "PHÒNG LƯU TRÚ KHÁC" của cả bốn trang phòng. Thẻ đó chỉ nói ĐÚNG hai con
 * số: diện tích 95 m² và hướng biển. Vì vậy document này CỐ Ý không có
 * `capacity` và `bedType` — xem chú thích tại `suiteDoc()`.
 */
import { LOCALES, type Locale } from '../../lib/i18n'
import { loc, blockLoc, fig, linkTo, p, li, key, resetKeys } from './build'
import { assetIdFor } from './assets'
import { patchDoc, upsertDoc, assertFullyTranslated } from './write'

type Six = Record<Locale, string>

/** Đếm số field còn thiếu bản dịch, in ra ở cuối. Vòng 2 phải ra 0. */
let holes = 0
let images = 0

const full = (v: Six) => LOCALES.every((l) => v[l].trim() !== '')

/**
 * Bản nháp một chuỗi đa ngữ: `vi` + `en` bắt buộc, bốn ngôn ngữ còn lại mặc
 * định rỗng. Khi đủ sáu, uỷ quyền thẳng cho `loc()` để được kiểm tra như mọi
 * nội dung hoàn chỉnh khác.
 */
function draft(v: { vi: string; en: string; zh?: string; ko?: string; ja?: string; th?: string }): Six {
  if (!v.vi.trim()) throw new Error(`draft(): thiếu "vi" — ${JSON.stringify(v)}`)
  if (!v.en.trim()) throw new Error(`draft(): thiếu "en" — ${JSON.stringify(v)}`)
  const six: Six = { vi: v.vi, en: v.en, zh: v.zh ?? '', ko: v.ko ?? '', ja: v.ja ?? '', th: v.th ?? '' }
  if (full(six)) return loc(six)
  holes += LOCALES.filter((l) => !six[l].trim()).length
  return six
}

/** Bản nháp một khối Portable Text. Mỗi ngôn ngữ là một mảng đoạn văn;
 * đoạn bắt đầu bằng `- ` thành gạch đầu dòng (giống `blockLoc`). */
function draftBlock(v: {
  vi: string[]
  en: string[]
  zh?: string[]
  ko?: string[]
  ja?: string[]
  th?: string[]
}): Record<Locale, unknown[]> {
  const all: Record<Locale, string[]> = {
    vi: v.vi, en: v.en, zh: v.zh ?? [], ko: v.ko ?? [], ja: v.ja ?? [], th: v.th ?? [],
  }
  if (LOCALES.every((l) => all[l].length > 0)) return blockLoc(all)
  holes += LOCALES.filter((l) => all[l].length === 0).length
  const out = {} as Record<Locale, unknown[]>
  for (const l of LOCALES) {
    out[l] = all[l].map((text) => (text.startsWith('- ') ? li(text.slice(2)) : p(text)))
  }
  return out
}

/** Ảnh có `alt` bản nháp. Tra `assetId` theo TÊN FILE, y như `fig()`. */
function draftFig(name: string, alt: Six) {
  images += 1
  if (full(alt)) return fig(name, alt)
  const id = assetIdFor(name)
  if (!id) throw new Error(`draftFig(): không có ảnh "${name}" trong scripts/import/out/assets.json`)
  return {
    _type: 'figure',
    _key: key('img'),
    asset: { _type: 'reference', _ref: id },
    alt,
  }
}

/**
 * Ảnh nền THUẦN TRANG TRÍ (`heroSection.background`, `ctaBandSection.background`):
 * KHÔNG có `alt`. Hai component đó render bằng `<SanityImage decorative>`, tức
 * alt luôn là chuỗi rỗng theo đúng WCAG — viết mô tả vào đây thì không ai đọc
 * được nó, mà `assertFullyTranslated` lại báo thiếu năm ngôn ngữ mãi mãi.
 */
function bgFig(name: string) {
  images += 1
  const id = assetIdFor(name)
  if (!id) throw new Error(`bgFig(): không có ảnh "${name}"`)
  return { _type: 'figure', _key: key('img'), asset: { _type: 'reference', _ref: id } }
}

/** Biểu tượng tiện nghi — field `icon` là kiểu `image` TRẦN (không có `alt`),
 * khác `figure`. Xem `sanity/schemaTypes/documents/room.ts`. */
function icon(name: string) {
  const id = assetIdFor(name)
  if (!id) throw new Error(`icon(): không có ảnh "${name}"`)
  return { _type: 'image', asset: { _type: 'reference', _ref: id } }
}

function feature(iconName: string, label: Six) {
  return { _key: key('feat'), _type: 'feature', icon: icon(iconName), label }
}

// ───────────────────────────────────────────────────────────────────────────
// Nhãn có sẵn đủ sáu ngôn ngữ trong `scripts/content/GLOSSARY.md`. Dùng
// `loc()` thật, không phải bản nháp — đây là những chuỗi PHẢI khớp với trang
// Ẩm thực / Hội nghị / Trải nghiệm do nhóm khác dựng.
// ───────────────────────────────────────────────────────────────────────────
const G_ACCOMMODATION = loc({
  vi: 'LƯU TRÚ', en: 'ACCOMMODATION', zh: '住宿', ko: '객실', ja: '客室', th: 'ห้องพัก',
})
const G_BOOK_NOW = loc({
  vi: 'ĐẶT PHÒNG', en: 'BOOK NOW', zh: '立即预订', ko: '지금 예약', ja: '今すぐ予約', th: 'จองเลย',
})
const G_VIEW_DETAILS = loc({
  vi: 'XEM CHI TIẾT', en: 'VIEW DETAILS', zh: '查看详情', ko: '자세히 보기', ja: '詳細を見る', th: 'ดูรายละเอียด',
})

// ───────────────────────────────────────────────────────────────────────────
// 15 tiện nghi chung cho cả bốn loại phòng, đúng thứ tự và đúng biểu tượng
// của bản clone (`#room-features` trong `deluxe/index.html`). Bốn dòng đầu
// (diện tích / sức chứa / hướng / giường) khác nhau theo phòng nên nhận từ
// ngoài vào; 11 dòng còn lại giống hệt nhau ở cả bốn trang clone.
// ───────────────────────────────────────────────────────────────────────────
function amenityFeatures() {
  return [
    feature('smart-tv.png', draft({
      vi: 'LCD TV', en: 'LCD television',
      zh: '液晶电视', ko: 'LCD TV', ja: '液晶テレビ', th: 'โทรทัศน์ LCD',
    })),
    feature('telephone.png', draft({
      vi: 'Điện thoại quốc tế', en: 'International direct-dial telephone',
      zh: '国际直拨电话', ko: '국제 직통 전화', ja: '国際直通電話', th: 'โทรศัพท์ทางไกลต่างประเทศ',
    })),
    feature('wifi.png', draft({
      vi: 'Wifi', en: 'Wi-Fi',
      zh: '无线网络', ko: '무선 인터넷', ja: 'Wi-Fi', th: 'Wi-Fi',
    })),
    feature('minibar.png', draft({
      vi: 'Quầy bar mini', en: 'Minibar',
      zh: '迷你吧', ko: '미니바', ja: 'ミニバー', th: 'มินิบาร์',
    })),
    feature('bathtub.png', draft({
      vi: 'Bồn tắm và vòi hoa sen', en: 'Bathtub and shower',
      zh: '浴缸与淋浴', ko: '욕조 및 샤워 시설', ja: 'バスタブ・シャワー', th: 'อ่างอาบน้ำและฝักบัว',
    })),
    feature('hairdryer.png', draft({
      vi: 'Máy sấy', en: 'Hairdryer',
      zh: '吹风机', ko: '헤어드라이어', ja: 'ヘアドライヤー', th: 'ไดร์เป่าผม',
    })),
    feature('ironing.png', draft({
      vi: 'Bàn là', en: 'Iron',
      zh: '熨斗', ko: '다리미', ja: 'アイロン', th: 'เตารีด',
    })),
    feature('air-conditioner.png', draft({
      vi: 'Máy điều hòa', en: 'Air conditioning',
      zh: '空调', ko: '에어컨', ja: 'エアコン', th: 'เครื่องปรับอากาศ',
    })),
    feature('no-smoking.png', draft({
      vi: 'Phòng không hút thuốc: có', en: 'Non-smoking rooms available',
      zh: '提供无烟客房', ko: '금연 객실 이용 가능', ja: '禁煙ルームあり', th: 'มีห้องปลอดบุหรี่',
    })),
    feature('smoking.png', draft({
      vi: 'Phòng hút thuốc: có', en: 'Smoking rooms available',
      zh: '提供吸烟客房', ko: '흡연 객실 이용 가능', ja: '喫煙ルームあり', th: 'มีห้องสูบบุหรี่',
    })),
    feature('room-service.png', draft({
      vi: 'Dịch vụ phòng', en: 'Room service',
      zh: '客房送餐服务', ko: '룸서비스', ja: 'ルームサービス', th: 'บริการรูมเซอร์วิส',
    })),
  ]
}

function specFeatures(spec: { area: Six; capacity: Six; view: Six; bed: Six }) {
  return [
    feature('area.png', spec.area),
    feature('traveling.png', spec.capacity),
    feature('sunrise.png', spec.view),
    feature('bed.png', spec.bed),
  ]
}

// ───────────────────────────────────────────────────────────────────────────
// TRANG: page.luu-tru-phong-khach-san-villas
//
// Chồng section cũ là hero + roomListSection + SÁU richTextSection không ảnh
// chép lại đúng nội dung bốn thẻ phòng ngay bên trên. Bản này thay bằng:
//   hero → giới thiệu có ảnh → danh sách phòng → hai khối ảnh-chữ theo khu
//   (khách sạn / villas) → băng ảnh → dải CTA đặt phòng.
// Không còn richTextSection nào; mỗi khối hoặc mang ảnh, hoặc mang thông tin
// mà danh sách phòng không nói.
// ───────────────────────────────────────────────────────────────────────────
function pageSections() {
  return [
    {
      _key: key('sec'),
      _type: 'heroSection',
      heading: draft({
        vi: 'Phòng Khách Sạn & Villas', en: 'Rooms & Villas',
        zh: '客房与别墅', ko: '호텔 객실 & 빌라', ja: 'ホテルルーム＆ヴィラ', th: 'ห้องพักและวิลล่า',
      }),
      // Component in hoa bằng CSS (`uppercase`), nên dữ liệu viết thường.
      subheading: draft({
        vi: 'Trải nghiệm sang trọng và thư giãn tại phòng khách sạn & villas 5 sao',
        en: 'Five-star calm across our hotel rooms and garden villas',
        zh: '五星级客房与花园别墅，尽享静谧奢华',
        ko: '5성급 호텔 객실과 가든 빌라에서 누리는 여유로운 휴식',
        ja: '5つ星のホテルルームとガーデンヴィラで過ごす、静かなひととき',
        th: 'ความหรูหราและผ่อนคลายระดับห้าดาว ทั้งห้องพักในโรงแรมและวิลล่าริมสวน',
      }),
      background: bgFig('Royal-Halong-Hotel-Suite-01.jpg'),
      height: 'medium',
    },

    {
      _key: key('sec'),
      _type: 'imageTextSection',
      eyebrow: G_ACCOMMODATION,
      heading: draft({
        vi: 'Hai khu nghỉ trong cùng một khuôn viên', en: 'Two places to stay, one set of grounds',
        zh: '同一园区，两种住宿选择', ko: '하나의 부지, 두 가지 머무름',
        ja: '一つの敷地に、二つの滞在', th: 'สองที่พักในพื้นที่เดียวกัน',
      }),
      content: draftBlock({
        vi: [
          'Royal Hạ Long Hotel có 156 phòng khách sạn tiêu chuẩn và phòng suite, kết hợp phong cách thiết kế cổ điển và hiện đại, nằm trong toà nhà chính.',
          'Cách đó vài bước chân là khu Royal Villas mang phong cách kết hợp giữa hiện đại và Châu Âu cổ điển. Mỗi phòng nghỉ được trang bị theo tiêu chuẩn 4 sao, ban công riêng mở ra vườn cây.',
          'Dù ở toà nhà chính hay khu villas, phòng nào cũng có sẵn:',
          '- Bồn tắm và vòi hoa sen riêng, máy sấy tóc, bàn là',
          '- Bàn làm việc với ổ điện thông minh an toàn, wifi và màn hình LCD 46 inch',
          '- Quầy bar mini, máy điều hoà, điện thoại quốc tế và dịch vụ phòng',
          '- Có cả phòng hút thuốc và phòng không hút thuốc',
        ],
        en: [
          'Royal Ha Long Hotel has 156 standard rooms and suites in the main building, where a classical frame and a contemporary fit-out sit side by side.',
          'A few steps away, Royal Villas takes the same classical European feeling at a lower scale. Every villa room is furnished to four-star standard and opens onto its own balcony above the garden.',
          'Whichever you choose, every room comes with:',
          '- A bathtub with separate shower, a hairdryer and an iron',
          '- A desk with safe smart sockets, Wi-Fi and a 46-inch LCD screen',
          '- A minibar, air conditioning, an international telephone line and room service',
          '- A choice of smoking or non-smoking rooms',
        ],
        zh: [
          'Royal Ha Long Hotel 主楼共有 156 间标准客房与套房，古典格局与当代装修相得益彰。',
          '几步之遥便是 Royal Villas 别墅区，融合现代手法与欧陆古典细节。每间客房均按四星标准布置，设有独立阳台，推门即见花园。',
          '无论入住主楼还是别墅区，每间客房均配备：',
          '- 浴缸与独立淋浴、吹风机、熨斗',
          '- 配安全智能插座的书桌、无线网络与 46 英寸液晶电视',
          '- 迷你吧、空调、国际直拨电话与客房送餐服务',
          '- 吸烟与无烟客房均可选择',
        ],
        ko: [
          'Royal Ha Long Hotel 본관에는 156실의 스탠다드 객실과 스위트가 있으며, 고전적인 구조와 현대적인 인테리어가 조화를 이룹니다.',
          '몇 걸음 떨어진 곳에는 현대적 감각과 유럽 고전미를 함께 담은 Royal Villas가 있습니다. 모든 객실은 4성급 기준으로 꾸며졌으며, 정원으로 열리는 전용 발코니를 갖추고 있습니다.',
          '본관이든 빌라든, 모든 객실에는 다음이 갖추어져 있습니다.',
          '- 욕조와 별도 샤워 시설, 헤어드라이어, 다리미',
          '- 안전 스마트 콘센트가 있는 책상, 무선 인터넷, 46인치 LCD 화면',
          '- 미니바, 에어컨, 국제 직통 전화, 룸서비스',
          '- 흡연 객실과 금연 객실 모두 선택 가능',
        ],
        ja: [
          'Royal Ha Long Hotel の本館には、156室のスタンダードルームとスイートがあります。クラシックな造りと現代的な内装が調和しています。',
          '数歩先には、モダンとヨーロッパ・クラシックを重ねた Royal Villas があります。各室は4つ星基準の設えで、庭に面した専用バルコニーが付いています。',
          '本館でもヴィラでも、すべての客室に次の設備が備わります。',
          '- バスタブと独立シャワー、ヘアドライヤー、アイロン',
          '- 安全なスマートコンセント付きのデスク、Wi-Fi、46インチの液晶画面',
          '- ミニバー、エアコン、国際直通電話、ルームサービス',
          '- 喫煙ルーム・禁煙ルームのどちらも選べます',
        ],
        th: [
          'อาคารหลักของ Royal Ha Long Hotel มีห้องพักมาตรฐานและห้องสวีทรวม 156 ห้อง ผสานโครงสร้างคลาสสิกเข้ากับการตกแต่งร่วมสมัย',
          'ห่างออกไปเพียงไม่กี่ก้าวคือ Royal Villas ที่ผสานงานออกแบบร่วมสมัยเข้ากับรายละเอียดคลาสสิกแบบยุโรป ทุกห้องตกแต่งตามมาตรฐานสี่ดาว พร้อมระเบียงส่วนตัวที่เปิดออกสู่สวน',
          'ไม่ว่าจะพักในอาคารหลักหรือวิลล่า ทุกห้องมีสิ่งอำนวยความสะดวกเหล่านี้:',
          '- อ่างอาบน้ำพร้อมฝักบัวแยก ไดร์เป่าผม และเตารีด',
          '- โต๊ะทำงานพร้อมปลั๊กอัจฉริยะแบบปลอดภัย Wi-Fi และจอ LCD ขนาด 46 นิ้ว',
          '- มินิบาร์ เครื่องปรับอากาศ โทรศัพท์ทางไกลต่างประเทศ และบริการรูมเซอร์วิส',
          '- มีทั้งห้องสูบบุหรี่และห้องปลอดบุหรี่ให้เลือก',
        ],
      }),
      image: draftFig('Royal-Ha-Long-Hotel-Overview-01.jpg', draft({
        vi: 'Bể bơi ngoài trời với toà nhà khách sạn mang biển hiệu đỏ trên nóc ở phía xa và dãy villas ba tầng rợp cọ bên phải',
        en: 'The outdoor pool, with the hotel tower and its red rooftop sign behind and the three-storey villa wing under palm trees on the right',
        zh: '户外泳池，远处是楼顶挂红色招牌的酒店主楼，右侧是掩映在棕榈树下的三层别墅楼',
        ko: '야외 수영장, 뒤편에는 옥상에 붉은 간판이 달린 호텔 본관, 오른쪽에는 야자수에 둘러싸인 3층 빌라동',
        ja: '屋外プール。奥には屋上に赤い看板を掲げたホテル本館、右手にはヤシの木に囲まれた3階建てのヴィラ棟',
        th: 'สระว่ายน้ำกลางแจ้ง ด้านหลังคืออาคารโรงแรมที่มีป้ายสีแดงบนดาดฟ้า และด้านขวาคืออาคารวิลล่าสามชั้นใต้ร่มต้นปาล์ม',
      })),
      imageSide: 'right',
      tone: 'cream',
    },

    {
      _key: key('sec'),
      _type: 'roomListSection',
      heading: draft({
        vi: 'Các loại phòng', en: 'Room types',
        zh: '客房类型', ko: '객실 타입', ja: '客室タイプ', th: 'ประเภทห้องพัก',
      }),
      // `rooms` để trống -> hiển thị TẤT CẢ loại phòng theo `order`
      // (xem `SECTIONS` trong `sanity/lib/queries.ts`). Liệt kê tay bốn
      // reference ở đây sẽ làm loại phòng thứ năm thêm sau bị rơi khỏi trang
      // mà không ai nhận ra — chính chỗ này đã cứu `room.suite` ở vòng 2.
    },

    {
      _key: key('sec'),
      _type: 'imageTextSection',
      eyebrow: draft({
        vi: 'TOÀ NHÀ CHÍNH', en: 'MAIN BUILDING',
        zh: '主楼', ko: '본관', ja: '本館', th: 'อาคารหลัก',
      }),
      heading: draft({
        vi: 'Phòng khách sạn', en: 'Hotel rooms',
        zh: '酒店客房', ko: '호텔 객실', ja: 'ホテルルーム', th: 'ห้องพักในโรงแรม',
      }),
      content: draftBlock({
        vi: [
          'Tận hưởng không gian sang trọng và ấm cúng tại khách sạn Royal Hạ Long, nơi mang đến một kỳ nghỉ dưỡng trọn vẹn. 156 phòng khách sạn tiêu chuẩn và phòng suite kết hợp phong cách thiết kế cổ điển và hiện đại.',
          'Phòng Deluxe và phòng Premium cùng rộng 39 m²: Deluxe nhìn ra Vịnh Hạ Long, Premium nhìn sang đồi núi và khu dân cư.',
          'Phòng Suite rộng 95 m², hướng biển, chia thành ba khu vực riêng biệt: phòng ngủ, phòng khách và phòng làm việc — nay có trang riêng với đầy đủ ảnh và tiện nghi.',
        ],
        en: [
          'The main building holds 156 standard rooms and suites, put together so that a classical shell and a contemporary fit-out work as one.',
          'Deluxe and Premium rooms are both 39 m²: the Deluxe looks out over Ha Long Bay, the Premium towards the hills and the town below.',
          'The 95 m² Suite faces the sea and is laid out as three separate areas — bedroom, sitting room and study; it now has a page of its own, with the full set of photographs and amenities.',
        ],
        zh: [
          '主楼共有 156 间标准客房与套房，古典设计与当代格调融为一体，是一处让人安心放松的落脚处。',
          '豪华客房与高级客房同为 39 平方米：豪华客房面向下龙湾，高级客房则朝向山峦与城区。',
          '95 平方米的套房面朝大海，分为卧室、客厅与书房三个独立区域；现已设有专属页面，可查看全部照片与配套设施。',
        ],
        ko: [
          '본관에는 스탠다드 객실과 스위트를 합쳐 156실이 있습니다. 고전적인 설계와 현대적인 감각이 하나로 어우러져 편안한 휴식을 선사합니다.',
          '디럭스 룸과 프리미엄 룸은 모두 39 m²입니다. 디럭스 룸은 하롱베이를, 프리미엄 룸은 언덕과 시가지를 바라봅니다.',
          '95 m² 스위트는 바다를 바라보며 침실과 거실, 서재의 세 공간으로 나뉩니다. 이제 전용 페이지에서 전체 사진과 편의 시설을 확인하실 수 있습니다.',
        ],
        ja: [
          '本館にはスタンダードルームとスイートを合わせて156室。クラシックな設計と現代的な設えが一体となり、落ち着いた滞在をお約束します。',
          'デラックスルームとプレミアムルームはいずれも39 m²。デラックスはハロン湾を、プレミアムは丘陵と市街を望みます。',
          '95 m² のスイートは海に面し、寝室・リビング・書斎の三つの空間に分かれています。専用ページで、写真と設備のすべてをご覧いただけます。',
        ],
        th: [
          'อาคารหลักมีห้องพักมาตรฐานและห้องสวีทรวม 156 ห้อง งานออกแบบคลาสสิกและการตกแต่งร่วมสมัยหลอมรวมเป็นหนึ่งเดียว เพื่อการพักผ่อนที่สงบ',
          'ห้องดีลักซ์และห้องพรีเมียมมีขนาดเท่ากันที่ 39 ตร.ม. ห้องดีลักซ์หันออกสู่อ่าวฮาลอง ส่วนห้องพรีเมียมมองเห็นเนินเขาและตัวเมือง',
          'ห้องสวีทขนาด 95 ตร.ม. หันออกสู่ทะเล แบ่งเป็นสามส่วนคือห้องนอน ห้องนั่งเล่น และห้องทำงาน ขณะนี้มีหน้าเฉพาะของตนเองพร้อมภาพและสิ่งอำนวยความสะดวกครบถ้วน',
        ],
      }),
      image: draftFig('Royal-Halong-Hotel-Deluxe-07.jpg', draft({
        vi: 'Phòng khách sạn với giường lớn trải khăn cam, ghế bành vàng và dải cửa kính cao nhìn ra vịnh',
        en: 'A hotel room with a large bed under an orange runner, yellow armchairs and a run of tall windows over the bay',
        zh: '酒店客房内的大床铺着橙色床旗，黄色扶手椅与一排落地窗外是海湾景色',
        ko: '오렌지색 러너를 덮은 큰 침대, 노란색 안락의자, 만이 내다보이는 높은 창이 늘어선 호텔 객실',
        ja: 'オレンジのランナーを掛けた大きなベッド、黄色のアームチェア、湾を望む背の高い窓が並ぶホテルの客室',
        th: 'ห้องพักในโรงแรมกับเตียงใหญ่ปูผ้าคาดสีส้ม เก้าอี้อาร์มแชร์สีเหลือง และแนวหน้าต่างสูงที่มองออกไปเห็นอ่าว',
      })),
      imageSide: 'left',
      tone: 'cream',
      // Đoạn 3 nói tới phòng Suite; từ vòng 2 nó đã có document riêng nên
      // khối này dẫn thẳng sang đó thay vì để người đọc tự tìm trong lưới.
      cta: linkTo('room.suite', G_VIEW_DETAILS),
    },

    {
      _key: key('sec'),
      _type: 'imageTextSection',
      eyebrow: draft({
        vi: 'KHU ROYAL VILLAS', en: 'ROYAL VILLAS',
        zh: 'ROYAL VILLAS 别墅区', ko: 'ROYAL VILLAS', ja: 'ROYAL VILLAS', th: 'ROYAL VILLAS',
      }),
      heading: draft({
        vi: 'Phòng Villas', en: 'Villa rooms',
        zh: '别墅客房', ko: '빌라 객실', ja: 'ヴィラルーム', th: 'ห้องพักในวิลล่า',
      }),
      content: draftBlock({
        vi: [
          'Mang phong cách thiết kế kết hợp giữa hiện đại và Châu Âu cổ điển, Royal Villas mang đến một không gian gần gũi và thư giãn. Mỗi phòng nghỉ được trang bị theo tiêu chuẩn 4 sao với đầy đủ các tiện nghi.',
          'Villas Suite rộng 72 m², gồm một phòng khách lớn và một phòng ngủ; ban công kê bàn ghế ngoài trời và ô che.',
          'Villas Deluxe rộng 36 m², sàn gỗ bóng, cửa sổ lớn chống côn trùng và ban công hướng vườn.',
        ],
        en: [
          'Royal Villas sets a modern plan against classical European detail: low buildings, timber floors and rooms that open straight onto the garden. Each is furnished to four-star standard.',
          'The Villas Suite is 72 m², with one large sitting room and one bedroom; the balcony is set with outdoor chairs and a parasol.',
          'The Villas Deluxe is 36 m², with polished timber floors, large insect-screened windows and a balcony facing the garden.',
        ],
        zh: [
          'Royal Villas 以现代格局搭配欧陆古典细节：低矮的楼体、木质地板，客房推门即是花园。每间均按四星标准布置。',
          'Villas Suite 面积 72 平方米，含一间宽敞客厅与一间卧室；阳台上备有户外桌椅与遮阳伞。',
          'Villas Deluxe 面积 36 平方米，铺设抛光木地板，配大面积防虫纱窗，阳台朝向花园。',
        ],
        ko: [
          'Royal Villas는 현대적인 구조에 유럽 고전의 디테일을 더했습니다. 낮은 건물과 원목 바닥, 정원으로 바로 이어지는 객실. 모든 객실은 4성급 기준으로 꾸며졌습니다.',
          'Villas Suite는 72 m² 규모로, 넓은 거실 하나와 침실 하나로 이루어져 있습니다. 발코니에는 야외 테이블과 의자, 파라솔이 놓여 있습니다.',
          'Villas Deluxe는 36 m²로, 광택 원목 바닥과 방충망을 갖춘 큰 창, 정원을 향한 발코니가 있습니다.',
        ],
        ja: [
          'Royal Villas は、現代的な間取りにヨーロッパ・クラシックの細部を重ねました。低層の建物、木の床、そして庭へ直接つながる客室。いずれも4つ星基準の設えです。',
          'Villas Suite は72 m²。広いリビングと寝室がそれぞれ一室ずつあり、バルコニーには屋外用のテーブルと椅子、パラソルを備えています。',
          'Villas Deluxe は36 m²。磨き上げた木の床、防虫網付きの大きな窓、そして庭に面したバルコニーがあります。',
        ],
        th: [
          'Royal Villas วางผังแบบร่วมสมัยคู่กับรายละเอียดคลาสสิกยุโรป อาคารเตี้ย พื้นไม้ และห้องพักที่เปิดออกสู่สวนได้โดยตรง ทุกห้องตกแต่งตามมาตรฐานสี่ดาว',
          'Villas Suite มีขนาด 72 ตร.ม. ประกอบด้วยห้องนั่งเล่นขนาดใหญ่หนึ่งห้องและห้องนอนหนึ่งห้อง ระเบียงจัดวางโต๊ะเก้าอี้กลางแจ้งพร้อมร่มกันแดด',
          'Villas Deluxe มีขนาด 36 ตร.ม. พื้นไม้ขัดเงา หน้าต่างบานใหญ่พร้อมมุ้งลวด และระเบียงที่หันออกสู่สวน',
        ],
      }),
      image: draftFig('Double-Villa_goc-2.jpg', draft({
        vi: 'Phòng khách villa với ba ghế sofa vải sọc quanh bàn trà gỗ, hai đèn cây và cửa kính trượt mở ra ban công lan can con tiện',
        en: 'A villa sitting room: three striped fabric sofas around a wooden coffee table, two floor lamps and sliding doors onto a balustraded balcony',
        zh: '别墅客厅里三张条纹布艺沙发围着木质茶几，两盏落地灯，推拉玻璃门通往带宝瓶栏杆的阳台',
        ko: '빌라 거실: 줄무늬 패브릭 소파 세 개가 원목 티테이블을 둘러싸고, 플로어 램프 두 개와 난간 기둥이 있는 발코니로 이어지는 유리 미닫이문',
        ja: 'ヴィラのリビング。ストライプ地のソファ3脚が木のローテーブルを囲み、フロアランプ2灯と、装飾手すりのバルコニーへ続くガラスの引き戸',
        th: 'ห้องนั่งเล่นในวิลล่า โซฟาผ้าลายทางสามตัวล้อมโต๊ะกลางไม้ โคมไฟตั้งพื้นสองดวง และประตูกระจกบานเลื่อนออกสู่ระเบียงที่มีลูกกรงเสาหลอก',
      })),
      imageSide: 'right',
      tone: 'white',
    },

    /*
     * Băng ảnh, KHÔNG phải `cardGridSection`.
     *
     * Đã dựng thử lưới thẻ (ảnh lớn, tên khối đè lên ảnh) rồi đo lại bằng
     * Playwright ở 1440px: `.scrim-bottom` để tiêu đề nằm ở 41–58% chiều cao
     * khối chữ, tức alpha của lớp phủ chỉ 0.16–0.39 — chữ trắng 24px trên
     * ảnh phòng khách sạn (toàn tường kem, ga trắng) đo được **1.4–1.75:1**
     * ở 5% điểm ảnh sáng nhất, mean 2.9–3.5:1. Đã thử cả 22 ảnh phòng trong
     * kho: ảnh tối nhất cũng chỉ lên tới 2.9:1 ở p90. Kho ảnh của khách sạn
     * này quá sáng cho kiểu "chữ đè lên ảnh" — không phải lỗi chọn ảnh.
     * (Mốc gradient của `.scrim-bottom` đã được sửa ở `app/globals.css` sau
     * đó; bố cục băng ảnh vẫn giữ vì nó chạy tốt.)
     *
     * Băng ảnh thì chữ nằm trên nền kem (SectionHeading), ảnh không phải cõng
     * chữ, và `galleryAlbum.luu-tru` có sẵn 20 ảnh.
     *
     * Album do NHÓM E giữ; ở đây chỉ tham chiếu, không ghi.
     */
    {
      _key: key('sec'),
      _type: 'galleryCarouselSection',
      heading: draft({
        vi: 'Thư viện phòng nghỉ', en: 'Rooms in pictures',
        zh: '客房图集', ko: '객실 사진', ja: '客室の写真', th: 'ภาพห้องพัก',
      }),
      album: { _type: 'reference', _ref: 'galleryAlbum.luu-tru' },
    },

    {
      _key: key('sec'),
      _type: 'ctaBandSection',
      heading: draft({
        vi: 'Đặt phòng tại Royal Hạ Long Hotel', en: 'Book your stay at Royal Ha Long Hotel',
        zh: '预订 Royal Ha Long Hotel',
        ko: 'Royal Ha Long Hotel 예약하기',
        ja: 'Royal Ha Long Hotel を予約する',
        th: 'จองห้องพักที่ Royal Ha Long Hotel',
      }),
      description: draft({
        vi: 'Chọn ngày và loại phòng, hoặc gọi hotline (+84) 2033 848 777 để được hỗ trợ.',
        en: 'Choose your dates and room type, or call (+84) 2033 848 777 and we will help.',
        zh: '选择入住日期与房型，或致电 (+84) 2033 848 777 由我们代为安排。',
        ko: '날짜와 객실 타입을 선택하시거나, (+84) 2033 848 777 로 전화 주시면 도와드리겠습니다.',
        ja: 'ご希望の日程と客室タイプをお選びください。お電話 (+84) 2033 848 777 でも承ります。',
        th: 'เลือกวันเข้าพักและประเภทห้อง หรือโทร (+84) 2033 848 777 แล้วเราจะช่วยจัดการให้',
      }),
      background: bgFig('GTJ-2020-0221-36.jpeg'),
      // `linkTo` giải đường dẫn qua `reference->slug`, nên nút vẫn đúng khi
      // trang Đặt phòng đổi slug hoặc có slug riêng theo ngôn ngữ.
      cta: linkTo('page.reservation', G_BOOK_NOW),
    },
  ]
}

// ───────────────────────────────────────────────────────────────────────────
// NĂM LOẠI PHÒNG
//
// `heroImage` được `RoomPage` render `decorative` (ảnh nền hero), NHƯNG
// `RoomListSection` render CÙNG ảnh đó kèm alt trên trang Lưu trú — nên nó
// vẫn cần `alt` thật.
// ───────────────────────────────────────────────────────────────────────────

/**
 * PHÒNG SUITE — 95 m², hướng biển. Document MỚI ở vòng 2.
 *
 * Bản clone quảng cáo NĂM loại phòng nhưng chỉ có bốn trang chi tiết; phòng
 * Suite chỉ tồn tại dưới dạng thẻ giới thiệu, lặp y hệt ở năm chỗ (trang Lưu
 * trú + khối "PHÒNG LƯU TRÚ KHÁC" của deluxe/premium/villas-deluxe/villas-suite).
 * Thẻ đó cho đúng hai con số: `DIỆN TÍCH: 95 M2 | HƯỚNG BIỂN`.
 *
 * VÌ VẬY:
 * - `capacity` và `bedType` KHÔNG được đặt. Không nguồn nào trong bản clone
 *   nói sức chứa hay loại giường của phòng Suite, và `GLOSSARY.md` cấm bịa số
 *   liệu. Cả hai field đều `optional` trong `sanity/schemaTypes/documents/room.ts`,
 *   nên thẻ trên trang Lưu trú in ra đúng "95 m² | Hướng biển" — khớp từng
 *   chữ với bản clone. Bỏ luôn hai dòng `traveling.png` / `bed.png` trong
 *   `features` thay vì điền bừa.
 * - 11 tiện nghi chung thì CÓ: bảng tiện nghi của cả bốn trang phòng clone
 *   giống hệt nhau, và đoạn mở đầu trang Lưu trú nói rõ 156 phòng tiêu chuẩn
 *   VÀ phòng suite dùng chung bộ trang bị này.
 *
 * Ảnh: 10 ảnh `…Suite-*` trong kho. `Royal-Halong-Hotel-Suite-01.jpg` là ảnh
 * bản clone gắn cho thẻ Suite, nhưng Agent 1 đã dùng nó làm ẢNH NỀN HERO của
 * chính trang Lưu trú — để nó làm `heroImage` nữa thì cùng một khung hình xuất
 * hiện ba lần (hero trang, thẻ phòng, hero trang phòng). Nên `heroImage` lấy
 * `…Suite-03.jpg` (cũng phòng khách, góc khác) và `…Suite-01.jpg` xuống ảnh
 * đầu của gallery.
 */
function suiteDoc() {
  return {
    title: draft({
      vi: 'Phòng Suite', en: 'Suite',
      zh: '套房', ko: '스위트 룸', ja: 'スイートルーム', th: 'ห้องสวีท',
    }),
    // `localeSlug` cố ý chỉ có `vi`: `resolveSlug()` rơi về đường dẫn tiếng
    // Việt cho cả sáu ngôn ngữ (xem `IGNORED_PATHS` trong `audit.ts`).
    slug: { vi: { _type: 'slug', current: 'suite' } },
    category: 'hotel',
    areaSqm: 95,
    view: draft({
      vi: 'Hướng biển', en: 'Sea view',
      zh: '海景', ko: '오션뷰', ja: 'オーシャンビュー', th: 'วิวทะเล',
    }),
    // Đứng đầu danh sách: phòng lớn nhất của toà nhà chính, và bản clone cũng
    // xếp Suite trước Premium/Deluxe trong tab "PHÒNG KHÁCH SẠN".
    order: 0,
    summary: draft({
      vi: 'Căn phòng 95 m² hướng Vịnh Hạ Long, chia thành ba khu vực riêng biệt: phòng ngủ, phòng khách và phòng làm việc.',
      en: 'A 95 m² room facing Ha Long Bay, laid out as three separate areas: bedroom, sitting room and study.',
      zh: '95 平方米的客房面朝下龙湾，分为卧室、客厅与书房三个独立区域。',
      ko: '하롱베이를 마주한 95 m² 객실로, 침실과 거실, 서재의 세 공간으로 나뉩니다.',
      ja: 'ハロン湾に面した95 m² の客室。寝室・リビング・書斎の三つの空間に分かれています。',
      th: 'ห้องขนาด 95 ตร.ม. หันหน้าสู่อ่าวฮาลอง แบ่งเป็นสามส่วน คือห้องนอน ห้องนั่งเล่น และห้องทำงาน',
    }),
    description: draftBlock({
      vi: [
        'Có tầm nhìn hướng ra Vịnh Hạ Long, phòng Suite khách sạn được thiết kế thông minh tạo sự thoải mái tối đa. Căn phòng rộng 95 m², chia thành ba khu vực riêng biệt: phòng ngủ, phòng khách và phòng làm việc.',
        'Phòng khách kê bộ sofa vàng quanh bàn trà mặt kính, dải cửa kính cao mở ra vịnh. Phòng làm việc riêng có bàn viết dài và cả một mảng tường kệ gỗ có đèn hắt.',
        'Phòng tắm ốp đá sáng màu với bồn tắm đặt sàn bên ô cửa góc nhìn ra vịnh, buồng tắm kính và hai bồn rửa. Phòng có quầy bar mini, máy điều hoà, điện thoại quốc tế và dịch vụ phòng; khách chọn được phòng hút thuốc hoặc không hút thuốc.',
      ],
      en: [
        'Looking out over Ha Long Bay, the hotel Suite is planned for comfort at every turn. It measures 95 m² and falls into three separate areas: bedroom, sitting room and study.',
        'The sitting room is set with a yellow sofa suite around a glass table, with tall windows onto the bay. The study has a long writing desk and a whole wall of lit timber shelving.',
        'The bathroom is clad in pale stone, with a freestanding tub beside the corner window over the bay, a glass shower and twin basins. The room has a minibar, air conditioning, an international telephone line and room service; smoking and non-smoking rooms are both available.',
      ],
      zh: [
        '套房远眺下龙湾，处处以舒适为先。面积 95 平方米，分为卧室、客厅与书房三个独立区域。',
        '客厅内黄色沙发组围着玻璃茶几，一排落地窗外便是海湾。独立书房设有长条书桌，以及整面带灯槽的木质书架墙。',
        '浴室铺浅色石材，独立浴缸设于可望海湾的转角窗边，另有玻璃淋浴间与双洗手盆。客房配迷你吧、空调、国际直拨电话与客房送餐服务；吸烟与无烟客房均可选择。',
      ],
      ko: [
        '하롱베이를 바라보는 호텔 스위트는 구석구석 편안함을 염두에 두고 꾸며졌습니다. 면적은 95 m²이며 침실과 거실, 서재의 세 공간으로 나뉩니다.',
        '거실에는 노란 소파 세트가 유리 테이블을 둘러싸고, 높은 창 너머로 만이 펼쳐집니다. 독립된 서재에는 긴 책상과 조명을 넣은 원목 책장 벽이 있습니다.',
        '욕실은 밝은 석재로 마감했으며, 만이 보이는 코너 창가에 독립형 욕조와 유리 샤워 부스, 두 개의 세면대를 두었습니다. 객실에는 미니바, 에어컨, 국제 직통 전화, 룸서비스가 제공되며 흡연 객실과 금연 객실 모두 선택하실 수 있습니다.',
      ],
      ja: [
        'ハロン湾を望むホテルのスイートは、隅々まで心地よさを考えて整えられています。広さは95 m²、寝室・リビング・書斎の三つの空間に分かれています。',
        'リビングは黄色のソファセットがガラステーブルを囲み、背の高い窓の向こうに湾が広がります。独立した書斎には長いデスクと、間接照明を入れた木の書棚の壁があります。',
        'バスルームは明るい石張りで、湾を望むコーナー窓のそばに置き型のバスタブ、ガラスのシャワー、洗面台を2つ備えます。客室にはミニバー、エアコン、国際直通電話、ルームサービスをご用意。喫煙・禁煙のどちらもお選びいただけます。',
      ],
      th: [
        'ห้องสวีทของโรงแรมมองออกไปเห็นอ่าวฮาลอง วางผังโดยคำนึงถึงความสบายในทุกจุด มีขนาด 95 ตร.ม. แบ่งเป็นสามส่วน คือห้องนอน ห้องนั่งเล่น และห้องทำงาน',
        'ห้องนั่งเล่นจัดชุดโซฟาสีเหลืองล้อมโต๊ะกลางกระจก พร้อมแนวหน้าต่างสูงที่เปิดออกสู่อ่าว ส่วนห้องทำงานแยกต่างหากมีโต๊ะเขียนหนังสือตัวยาวและผนังชั้นวางไม้พร้อมไฟส่องเต็มผนัง',
        'ห้องน้ำปูหินสีอ่อน มีอ่างอาบน้ำแบบตั้งพื้นข้างหน้าต่างมุมที่มองเห็นอ่าว ตู้อาบน้ำกระจก และอ่างล้างหน้าสองอ่าง ภายในห้องมีมินิบาร์ เครื่องปรับอากาศ โทรศัพท์ทางไกลต่างประเทศ และบริการรูมเซอร์วิส เลือกได้ทั้งห้องสูบบุหรี่และห้องปลอดบุหรี่',
      ],
    }),
    heroImage: draftFig('Royal-Halong-Hotel-Suite-03.jpg', draft({
      vi: 'Phòng khách Suite: sofa vàng và hai ghế bành quây quanh bàn trà mặt kính đen bày rượu vang và hoa quả, đèn thả trụ tròn, cửa sổ bên trái nhìn ra vịnh',
      en: 'The Suite sitting room: a yellow sofa and two armchairs around a black glass table set with wine and fruit, a drum pendant lamp, and a window onto the bay on the left',
      zh: '套房客厅：黄色沙发与两把扶手椅围着黑色玻璃茶几，桌上摆着红酒与水果，圆筒吊灯，左侧窗外是海湾',
      ko: '스위트 거실: 노란 소파와 안락의자 두 개가 와인과 과일을 올린 검은 유리 테이블을 둘러싸고, 원통형 펜던트 조명이 걸려 있으며 왼쪽 창 너머로 만이 보입니다',
      ja: 'スイートのリビング。黄色のソファとアームチェア2脚が、ワインと果物を置いた黒いガラステーブルを囲む。円筒形のペンダントライト、左手の窓の外には湾',
      th: 'ห้องนั่งเล่นของห้องสวีท โซฟาสีเหลืองและเก้าอี้อาร์มแชร์สองตัวล้อมโต๊ะกระจกสีดำที่วางไวน์และผลไม้ โคมไฟแขวนทรงกระบอก และหน้าต่างทางซ้ายที่มองเห็นอ่าว',
    })),
    gallery: [
      draftFig('Royal-Halong-Hotel-Suite-01.jpg', draft({
        vi: 'Phòng khách Suite nhìn từ lối vào: dải cửa kính cao mở ra Vịnh Hạ Long, bộ sofa vàng quanh hai bàn trà mặt kính, tường gương phản chiếu đèn thả',
        en: 'The Suite sitting room from the doorway: tall windows onto Ha Long Bay, a yellow sofa suite around two glass tables, and a mirrored wall reflecting the pendant lamp',
        zh: '从门口望向套房客厅：一排落地窗外是下龙湾，黄色沙发组围着两张玻璃茶几，镜面墙映出吊灯',
        ko: '문가에서 바라본 스위트 거실: 하롱베이가 펼쳐지는 높은 창, 유리 테이블 두 개를 둘러싼 노란 소파 세트, 펜던트 조명을 비추는 거울 벽',
        ja: '入口から見たスイートのリビング。ハロン湾を望む背の高い窓、ガラステーブル2台を囲む黄色のソファセット、ペンダントライトを映す鏡の壁',
        th: 'ห้องนั่งเล่นของห้องสวีทมองจากประตู แนวหน้าต่างสูงเปิดออกสู่อ่าวฮาลอง ชุดโซฟาสีเหลืองล้อมโต๊ะกระจกสองตัว และผนังกระจกที่สะท้อนโคมไฟแขวน',
      })),
      draftFig('Royal-Halong-Hotel-Suite-11.jpg', draft({
        vi: 'Phòng khách Suite với bộ sofa vàng và TV màn hình lớn gắn trên vách gỗ, lối cửa phía trong dẫn sang phòng làm việc',
        en: 'The Suite sitting room with its yellow sofa suite and a large television on the timber wall, an opening at the back leading through to the study',
        zh: '套房客厅内的黄色沙发组与嵌在木墙上的大屏电视，里侧门洞通向书房',
        ko: '노란 소파 세트와 원목 벽에 설치된 대형 텔레비전이 있는 스위트 거실, 안쪽 문으로 서재가 이어집니다',
        ja: '黄色のソファセットと木の壁に据えた大型テレビのあるスイートのリビング。奥の開口部から書斎へ続きます',
        th: 'ห้องนั่งเล่นของห้องสวีทกับชุดโซฟาสีเหลืองและโทรทัศน์จอใหญ่ติดผนังไม้ มีช่องประตูด้านในเชื่อมไปยังห้องทำงาน',
      })),
      draftFig('Royal-Halong-Hotel-Suite-15.jpg', draft({
        vi: 'Phòng ngủ Suite với giường lớn gấp khăn hình đôi thiên nga, TV trên vách gỗ, tủ áo âm tường và lối mở bên trái nhìn sang phòng khách',
        en: 'The Suite bedroom: a large bed dressed with swan-folded towels, the television on a timber panel, fitted wardrobes, and an opening on the left through to the sitting room',
        zh: '套房卧室：大床上摆着折成天鹅的毛巾，木饰面墙上装着电视，整面嵌入式衣柜，左侧开口通往客厅',
        ko: '스위트 침실: 백조 모양으로 접은 타월을 올린 큰 침대, 원목 벽면의 텔레비전, 붙박이 옷장, 왼쪽으로 거실이 이어지는 개구부',
        ja: 'スイートの寝室。白鳥の形に折ったタオルを置いた大きなベッド、木の壁面のテレビ、造り付けのクローゼット、左手の開口からリビングへ',
        th: 'ห้องนอนของห้องสวีท เตียงใหญ่ประดับผ้าเช็ดตัวพับรูปหงส์ โทรทัศน์บนผนังไม้ ตู้เสื้อผ้าบิลท์อิน และช่องเปิดทางซ้ายที่มองเห็นห้องนั่งเล่น',
      })),
      draftFig('Royal-Halong-Hotel-Suite-08.jpg', draft({
        vi: 'Giường Suite trước vách đầu giường bọc nệm kem viền gỗ, khăn gấp hình thiên nga và cánh hồng xếp thành trái tim, ghế bành vàng bên phải và cửa mở sang phòng tắm bên trái',
        en: 'The Suite bed against a cream padded headboard framed in timber, with swan-folded towels and a heart of rose petals, a yellow armchair to the right and the bathroom door open on the left',
        zh: '套房大床靠着米色软包、木框收边的床头墙，床上摆着天鹅毛巾与玫瑰花瓣拼成的心形，右侧是黄色扶手椅，左侧门通向浴室',
        ko: '나무 테두리를 두른 크림색 쿠션 헤드보드 앞의 스위트 침대, 백조 모양 타월과 장미 꽃잎으로 만든 하트, 오른쪽의 노란 안락의자, 왼쪽으로 열린 욕실 문',
        ja: '木枠で縁取ったクリーム色の張り地のヘッドボードに寄せたスイートのベッド。白鳥のタオルとバラの花びらのハート、右手に黄色いアームチェア、左手は開いた浴室のドア',
        th: 'เตียงห้องสวีทหน้าผนังหัวเตียงบุนวมสีครีมกรอบไม้ ประดับผ้าเช็ดตัวพับรูปหงส์และกลีบกุหลาบเรียงเป็นรูปหัวใจ เก้าอี้อาร์มแชร์สีเหลืองทางขวา และประตูห้องน้ำเปิดอยู่ทางซ้าย',
      })),
      draftFig('Royal-Halong-Hotel-Suite-13.jpg', draft({
        vi: 'Phòng làm việc riêng của Suite: mảng tường kệ gỗ có đèn hắt, bàn viết dài kê màn hình máy tính, hai ghế và bình hoa',
        en: 'The Suite study: a wall of lit timber shelving, a long desk with a computer monitor, two chairs and a vase of flowers',
        zh: '套房独立书房：整面带灯槽的木质书架墙，长书桌上放着显示器，两把椅子与一瓶鲜花',
        ko: '스위트의 독립 서재: 조명을 넣은 원목 책장 벽, 모니터를 올린 긴 책상, 의자 두 개와 꽃병',
        ja: 'スイートの独立した書斎。間接照明を入れた木の書棚の壁、モニターを置いた長いデスク、椅子2脚と花',
        th: 'ห้องทำงานส่วนตัวของห้องสวีท ผนังชั้นวางไม้พร้อมไฟส่อง โต๊ะเขียนหนังสือตัวยาววางจอคอมพิวเตอร์ เก้าอี้สองตัวและแจกันดอกไม้',
      })),
      draftFig('Royal-Halong-Hotel-Suite-05.jpg', draft({
        vi: 'Phòng tắm Suite với bồn tắm đặt sàn bên ô cửa kính góc nhìn ra vịnh, buồng tắm kính và bàn đá dài trên tủ gỗ',
        en: 'The Suite bathroom: a freestanding tub beside the corner windows over the bay, a glass shower cubicle and a long stone counter on a timber vanity',
        zh: '套房浴室：独立浴缸摆在转角窗边，窗外是海湾，另有玻璃淋浴间与木柜上的长条石台面',
        ko: '스위트 욕실: 만이 내다보이는 코너 창가의 독립형 욕조, 유리 샤워 부스, 원목 하부장 위의 긴 석재 상판',
        ja: 'スイートのバスルーム。湾を望むコーナー窓のそばの置き型バスタブ、ガラスのシャワーブース、木製の台に載る長い石のカウンター',
        th: 'ห้องน้ำของห้องสวีท อ่างอาบน้ำแบบตั้งพื้นข้างหน้าต่างมุมที่มองเห็นอ่าว ตู้อาบน้ำกระจก และเคาน์เตอร์หินตัวยาวบนตู้ไม้',
      })),
      draftFig('Royal-Halong-Hotel-Suite-06.jpg', draft({
        vi: 'Phòng tắm Suite với hai bồn rửa trên bàn đá dài, tường gương suốt, buồng tắm kính và cửa sổ nhìn ra vịnh',
        en: 'The Suite bathroom with twin basins set in a long stone counter, a full mirrored wall, a glass shower and windows over the bay',
        zh: '套房浴室内长条石台面上设双洗手盆，整面镜墙，玻璃淋浴间，窗外是海湾',
        ko: '긴 석재 상판에 세면대 두 개를 둔 스위트 욕실, 벽 전체를 덮은 거울, 유리 샤워 부스, 만이 보이는 창',
        ja: '長い石のカウンターに洗面台を2つ備えたスイートのバスルーム。壁一面の鏡、ガラスのシャワー、湾を望む窓',
        th: 'ห้องน้ำของห้องสวีท อ่างล้างหน้าสองอ่างบนเคาน์เตอร์หินตัวยาว ผนังกระจกเต็มบาน ตู้อาบน้ำกระจก และหน้าต่างที่มองเห็นอ่าว',
      })),
    ],
    // Chỉ hai dòng thông số (không có sức chứa / loại giường — xem chú thích
    // đầu hàm), rồi tới 11 tiện nghi chung.
    features: [
      feature('area.png', draft({
        vi: 'Diện tích: 95 m²', en: 'Room size: 95 m²',
        zh: '面积：95 平方米', ko: '면적: 95 m²', ja: '広さ：95 m²', th: 'ขนาดห้อง: 95 ตร.ม.',
      })),
      feature('sunrise.png', draft({
        vi: 'Hướng phòng: Hướng biển', en: 'View: Ha Long Bay',
        zh: '景观：下龙湾', ko: '전망: 하롱베이', ja: '眺望：ハロン湾', th: 'วิว: อ่าวฮาลอง',
      })),
      ...amenityFeatures(),
    ],
  }
}

/** PHÒNG DELUXE — 39 m², 2 khách, hướng biển, giường đôi. */
function deluxeDoc() {
  const capacity = draft({
    vi: '2 khách', en: '2 guests',
    zh: '2 位客人', ko: '2명', ja: '2名', th: '2 ท่าน',
  })
  const view = draft({
    vi: 'Hướng biển', en: 'Sea view',
    zh: '海景', ko: '오션뷰', ja: 'オーシャンビュー', th: 'วิวทะเล',
  })
  const bedType = draft({
    vi: 'Giường đôi', en: 'Double bed',
    zh: '双人床', ko: '더블 베드', ja: 'ダブルベッド', th: 'เตียงดับเบิล',
  })
  return {
    title: draft({
      vi: 'Phòng Deluxe', en: 'Deluxe Room',
      zh: '豪华客房', ko: '디럭스 룸', ja: 'デラックスルーム', th: 'ห้องดีลักซ์',
    }),
    areaSqm: 39,
    capacity,
    view,
    bedType,
    summary: draft({
      vi: 'Phòng 39 m² hướng Vịnh Hạ Long, thiết kế đương thời với tường ốp gương, sofa dài và phòng tắm lát đá cẩm thạch.',
      en: 'A 39 m² room facing Ha Long Bay, with mirrored wall panels, a long sofa and a marble-clad bathroom.',
      zh: '39 平方米的客房，面向下龙湾，镜面墙饰、长沙发与大理石浴室构成当代格调。',
      ko: '하롱베이를 마주한 39 m² 객실. 거울 벽 패널과 긴 소파, 대리석 욕실을 갖추었습니다.',
      ja: 'ハロン湾に面した39 m² の客室。鏡張りの壁面、ロングソファ、大理石張りのバスルームを備えます。',
      th: 'ห้องขนาด 39 ตร.ม. หันหน้าสู่อ่าวฮาลอง พร้อมผนังกระจก โซฟาตัวยาว และห้องน้ำปูหินอ่อน',
    }),
    description: draftBlock({
      vi: [
        'Phòng Deluxe hướng biển tại khách sạn có diện tích 39 m², tầm nhìn hướng ra Vịnh Hạ Long. Phong cách thiết kế đương thời với tường ốp gương sang trọng, sofa dài, phòng tắm lát đá cẩm thạch.',
        'Bàn làm việc lớn với ổ điện thông minh an toàn, wifi và một màn hình TV LCD 46 inch được trang bị đầy đủ tạo không gian tiện nghi.',
        'Phòng kê giường đôi, có quầy bar mini, bồn tắm và vòi hoa sen riêng, máy điều hoà và dịch vụ phòng. Khách chọn được phòng hút thuốc hoặc không hút thuốc.',
      ],
      en: [
        'The sea-facing Deluxe room measures 39 m² and looks out over Ha Long Bay. The fit-out is contemporary: mirrored wall panels, a long sofa and a bathroom clad in marble.',
        'A generous desk with safe smart sockets, Wi-Fi and a 46-inch LCD screen keeps the room workable as well as restful.',
        'The room is made up with a double bed and comes with a minibar, a bathtub with separate shower, air conditioning and room service. Smoking and non-smoking rooms are both available.',
      ],
      zh: [
        '面海的豪华客房面积 39 平方米，可远眺下龙湾。设计取当代格调：镜面墙饰、长沙发，以及大理石铺就的浴室。',
        '宽大的书桌配安全智能插座、无线网络与 46 英寸液晶电视，休憩之余亦可安心办公。',
        '客房配双人床，另有迷你吧、浴缸与独立淋浴、空调及客房送餐服务。吸烟与无烟客房均可选择。',
      ],
      ko: [
        '바다를 향한 디럭스 룸은 39 m² 규모로 하롱베이를 바라봅니다. 거울 벽 패널과 긴 소파, 대리석을 두른 욕실이 현대적인 분위기를 만듭니다.',
        '넉넉한 책상에는 안전 스마트 콘센트와 무선 인터넷, 46인치 LCD 화면이 마련되어 휴식과 업무를 함께 챙길 수 있습니다.',
        '객실에는 더블 베드가 놓이며 미니바, 욕조와 별도 샤워 시설, 에어컨, 룸서비스가 제공됩니다. 흡연 객실과 금연 객실 모두 선택하실 수 있습니다.',
      ],
      ja: [
        '海に面したデラックスルームは39 m²、ハロン湾を望みます。鏡張りの壁面、ロングソファ、大理石のバスルームが現代的な趣をつくります。',
        'ゆとりのあるデスクには安全なスマートコンセント、Wi-Fi、46インチの液晶画面。休息にも仕事にも応えます。',
        '客室はダブルベッド仕様で、ミニバー、バスタブと独立シャワー、エアコン、ルームサービスを備えます。喫煙・禁煙のどちらもお選びいただけます。',
      ],
      th: [
        'ห้องดีลักซ์วิวทะเลมีขนาด 39 ตร.ม. มองออกไปเห็นอ่าวฮาลอง ตกแต่งร่วมสมัยด้วยผนังกระจก โซฟาตัวยาว และห้องน้ำปูหินอ่อน',
        'โต๊ะทำงานขนาดใหญ่พร้อมปลั๊กอัจฉริยะแบบปลอดภัย Wi-Fi และจอ LCD ขนาด 46 นิ้ว ทำให้ห้องนี้ทั้งพักผ่อนและทำงานได้',
        'ห้องจัดเตียงดับเบิล พร้อมมินิบาร์ อ่างอาบน้ำและฝักบัวแยก เครื่องปรับอากาศ และบริการรูมเซอร์วิส เลือกได้ทั้งห้องสูบบุหรี่และห้องปลอดบุหรี่',
      ],
    }),
    heroImage: draftFig('Royal-Halong-Hotel-Deluxe-01.jpg', draft({
      vi: 'Phòng Deluxe với hai giường trải khăn cam trước vách đầu giường bọc nệm kem, cửa sổ nhìn ra vịnh và TV trên tủ gỗ',
      en: 'A Deluxe room with two beds under orange runners against a cream padded headboard wall, a window over the bay and the television on a wooden cabinet',
      zh: '豪华客房内两张床铺着橙色床旗，背后是米色软包床头墙，窗外是海湾，木柜上放着电视',
      ko: '오렌지색 러너를 덮은 침대 두 개, 뒤편의 크림색 쿠션 헤드보드 벽, 만이 보이는 창, 원목 캐비닛 위의 텔레비전이 있는 디럭스 룸',
      ja: 'オレンジのランナーを掛けたベッド2台、クリーム色の張り地のヘッドボード壁、湾を望む窓、木製キャビネットの上のテレビがあるデラックスルーム',
      th: 'ห้องดีลักซ์ เตียงสองเตียงปูผ้าคาดสีส้มหน้าผนังหัวเตียงบุนวมสีครีม หน้าต่างมองเห็นอ่าว และโทรทัศน์บนตู้ไม้',
    })),
    gallery: [
      draftFig('Royal-Halong-Hotel-Deluxe-02.jpg', draft({
        vi: 'Toàn cảnh phòng Deluxe: hai giường đơn trải khăn cam, ghế sofa vàng với bàn trà tròn mặt kính và lối vào ốp gỗ phía trái',
        en: 'The full Deluxe room: two single beds under orange runners, a yellow sofa with a round glass table, and the timber-panelled entrance on the left',
        zh: '豪华客房全景：两张单人床铺橙色床旗，黄色沙发配圆形玻璃茶几，左侧是木饰面的入口通道',
        ko: '디럭스 룸 전경: 오렌지색 러너의 싱글 베드 두 개, 노란 소파와 둥근 유리 티테이블, 왼쪽의 원목 마감 현관',
        ja: 'デラックスルームの全景。オレンジのランナーを掛けたシングルベッド2台、黄色のソファと丸いガラステーブル、左手に木張りの入口',
        th: 'ภาพรวมห้องดีลักซ์: เตียงเดี่ยวสองเตียงปูผ้าคาดสีส้ม โซฟาสีเหลืองกับโต๊ะกลางกระจกทรงกลม และทางเข้าบุไม้ทางซ้าย',
      })),
      draftFig('Royal-Halong-Hotel-Deluxe-04.jpg', draft({
        vi: 'Góc làm việc trong phòng Deluxe với bàn dài, ghế xoay và bàn tròn bày hoa cùng đĩa trái cây, hai giường ở phía sau',
        en: 'The work corner of a Deluxe room: a long desk with a swivel chair and a round table set with flowers and a plate of fruit, the two beds behind',
        zh: '豪华客房的工作区：长书桌配转椅，圆桌上摆着鲜花与果盘，两张床在后方',
        ko: '디럭스 룸의 업무 공간: 긴 책상과 회전의자, 꽃과 과일 접시를 올린 둥근 테이블, 뒤쪽에 놓인 두 개의 침대',
        ja: 'デラックスルームのワークスペース。長いデスクと回転椅子、花と果物の皿を置いた丸テーブル、奥にベッド2台',
        th: 'มุมทำงานในห้องดีลักซ์ โต๊ะยาวกับเก้าอี้หมุน โต๊ะกลมวางดอกไม้และจานผลไม้ และเตียงสองเตียงด้านหลัง',
      })),
      draftFig('Royal-Halong-Hotel-Deluxe-05.jpg', draft({
        vi: 'Hai giường đơn kê sát nhau trước vách đầu giường bọc nệm kem viền gỗ, tủ đầu giường đặt điện thoại ở giữa',
        en: 'Two single beds side by side against a cream padded headboard wall framed in timber, with a nightstand and telephone between them',
        zh: '两张单人床并排靠着米色软包、木框收边的床头墙，中间床头柜上放着电话',
        ko: '나무 테두리를 두른 크림색 쿠션 헤드보드 벽 앞에 나란히 놓인 싱글 베드 두 개, 가운데 협탁에는 전화기',
        ja: '木枠で縁取ったクリーム色の張り地のヘッドボード壁に沿って並ぶシングルベッド2台、間のナイトテーブルには電話',
        th: 'เตียงเดี่ยวสองเตียงวางชิดกันหน้าผนังหัวเตียงบุนวมสีครีมกรอบไม้ มีโทรศัพท์บนโต๊ะข้างเตียงตรงกลาง',
      })),
      draftFig('Royal-Halong-Hotel-Deluxe-07.jpg', draft({
        vi: 'Phòng Deluxe giường lớn nhìn ra vịnh qua dải cửa kính cao, ghế bành vàng và đèn thả cạnh cửa sổ',
        en: 'A Deluxe room with a large bed, tall windows onto the bay, yellow armchairs and a pendant lamp beside the glass',
        zh: '豪华客房的大床，一排落地窗外是海湾，窗边有黄色扶手椅与吊灯',
        ko: '큰 침대가 놓인 디럭스 룸, 높은 창 너머로 보이는 만, 창가의 노란 안락의자와 펜던트 조명',
        ja: '大きなベッドのデラックスルーム。背の高い窓の向こうに湾が広がり、窓辺には黄色のアームチェアとペンダントライト',
        th: 'ห้องดีลักซ์เตียงใหญ่ มองเห็นอ่าวผ่านแนวหน้าต่างสูง มีเก้าอี้อาร์มแชร์สีเหลืองและโคมไฟแขวนข้างหน้าต่าง',
      })),
      draftFig('Royal-Halong-Hotel-Deluxe-06.jpg', draft({
        vi: 'Phòng tắm ốp đá kem với bồn tắm dài, buồng tắm kính, bồn rửa trên mặt đá và mảng gạch mosaic nâu đỏ',
        en: 'A cream stone bathroom with a long tub, a glass shower cubicle, a basin on a stone counter and a panel of red-brown mosaic tile',
        zh: '米色石材浴室，配长浴缸、玻璃淋浴间、石台面洗手盆与一片红棕色马赛克瓷砖',
        ko: '크림색 석재 욕실: 긴 욕조, 유리 샤워 부스, 석재 상판의 세면대, 적갈색 모자이크 타일 벽면',
        ja: 'クリーム色の石張りのバスルーム。長いバスタブ、ガラスのシャワーブース、石のカウンターの洗面台、赤茶色のモザイクタイル',
        th: 'ห้องน้ำปูหินสีครีม อ่างอาบน้ำทรงยาว ตู้อาบน้ำกระจก อ่างล้างหน้าบนเคาน์เตอร์หิน และแผงกระเบื้องโมเสกสีน้ำตาลแดง',
      })),
    ],
    features: [
      ...specFeatures({
        area: draft({
          vi: 'Diện tích: 39 m²', en: 'Room size: 39 m²',
          zh: '面积：39 平方米', ko: '면적: 39 m²', ja: '広さ：39 m²', th: 'ขนาดห้อง: 39 ตร.ม.',
        }),
        capacity: draft({
          vi: 'Sức chứa: 2 khách', en: 'Capacity: 2 guests',
          zh: '容纳人数：2 位客人', ko: '수용 인원: 2명', ja: '収容人数：2名', th: 'ความจุ: 2 ท่าน',
        }),
        view: draft({
          vi: 'Hướng phòng: Hướng biển', en: 'View: Ha Long Bay',
          zh: '景观：下龙湾', ko: '전망: 하롱베이', ja: '眺望：ハロン湾', th: 'วิว: อ่าวฮาลอง',
        }),
        bed: draft({
          vi: 'Loại giường: Giường đôi', en: 'Bed type: double bed',
          zh: '床型：双人床', ko: '베드 타입: 더블 베드', ja: 'ベッドタイプ：ダブルベッド', th: 'ประเภทเตียง: เตียงดับเบิล',
        }),
      }),
      ...amenityFeatures(),
    ],
  }
}

/** PHÒNG PREMIUM — 39 m², 2 khách, hướng đồi/thành phố, giường đôi. */
function premiumDoc() {
  return {
    title: draft({
      vi: 'Phòng Premium', en: 'Premium Room',
      zh: '高级客房', ko: '프리미엄 룸', ja: 'プレミアムルーム', th: 'ห้องพรีเมียม',
    }),
    areaSqm: 39,
    capacity: draft({
      vi: '2 khách', en: '2 guests',
      zh: '2 位客人', ko: '2명', ja: '2名', th: '2 ท่าน',
    }),
    view: draft({
      vi: 'Hướng đồi/thành phố', en: 'Hill and city view',
      zh: '山景／城景', ko: '언덕·시가지 전망', ja: '丘陵・市街ビュー', th: 'วิวเนินเขาและตัวเมือง',
    }),
    bedType: draft({
      vi: 'Giường đôi', en: 'Double bed',
      zh: '双人床', ko: '더블 베드', ja: 'ダブルベッド', th: 'เตียงดับเบิล',
    }),
    summary: draft({
      vi: 'Phòng 39 m² với cửa sổ lớn nhìn ra đồi núi và khu dân cư, có thể ghép phòng connecting cho gia đình.',
      en: 'A 39 m² room with a wide window over the hills and the town, with connecting rooms available for families.',
      zh: '39 平方米客房，大窗外是山峦与城区，可按需安排相连房，适合家庭入住。',
      ko: '39 m² 객실로 큰 창 너머 언덕과 시가지가 펼쳐집니다. 가족을 위한 커넥팅 룸도 마련할 수 있습니다.',
      ja: '39 m² の客室。大きな窓から丘陵と市街を望みます。ご家族にはコネクティングルームもご用意できます。',
      th: 'ห้องขนาด 39 ตร.ม. หน้าต่างบานใหญ่มองเห็นเนินเขาและตัวเมือง มีห้องเชื่อมต่อสำหรับครอบครัวตามคำขอ',
    }),
    description: draftBlock({
      vi: [
        'Căn phòng có diện tích 39 m² với một cửa sổ lớn bao trọn khung cảnh đồi núi và khu dân cư. Phòng Premium mang đến một cảm giác thoải mái với phong cách thiết kế đương thời và thanh lịch.',
        'Bàn ghế sofa, bàn làm việc với ổ cắm thông minh, màn hình TV LCD 46 inch được trang bị đầy đủ. Ngoài ra còn có thêm lựa chọn phòng connecting cho các gia đình tùy theo yêu cầu.',
        'Phòng kê giường đôi, có quầy bar mini, bồn tắm và vòi hoa sen riêng, máy điều hoà và dịch vụ phòng. Khách chọn được phòng hút thuốc hoặc không hút thuốc.',
      ],
      en: [
        'The Premium room is 39 m², with one wide window that takes in the hills and the neighbourhood below. The look is contemporary and understated.',
        'A sofa and armchairs, a desk with smart sockets and a 46-inch LCD screen come as standard. Connecting rooms can be arranged for families on request.',
        'The room is made up with a double bed and comes with a minibar, a bathtub with separate shower, air conditioning and room service. Smoking and non-smoking rooms are both available.',
      ],
      zh: [
        '高级客房面积 39 平方米，一扇大窗将山峦与周边街区尽收眼底。格调当代而内敛。',
        '沙发与扶手椅、配智能插座的书桌以及 46 英寸液晶电视均为标准配置。家庭出行可按需安排相连房。',
        '客房配双人床，另有迷你吧、浴缸与独立淋浴、空调及客房送餐服务。吸烟与无烟客房均可选择。',
      ],
      ko: [
        '프리미엄 룸은 39 m² 규모이며, 큰 창 하나가 언덕과 아래 동네를 담아냅니다. 분위기는 현대적이고 절제되어 있습니다.',
        '소파와 안락의자, 스마트 콘센트가 있는 책상, 46인치 LCD 화면이 기본으로 마련됩니다. 가족 단위 손님께는 요청에 따라 커넥팅 룸을 배정해 드립니다.',
        '객실에는 더블 베드가 놓이며 미니바, 욕조와 별도 샤워 시설, 에어컨, 룸서비스가 제공됩니다. 흡연 객실과 금연 객실 모두 선택하실 수 있습니다.',
      ],
      ja: [
        'プレミアムルームは39 m²。大きな窓一面に丘陵と街並みが広がります。設えは現代的で、控えめです。',
        'ソファとアームチェア、スマートコンセント付きのデスク、46インチの液晶画面を標準で備えます。ご家族にはご要望に応じてコネクティングルームもご用意します。',
        '客室はダブルベッド仕様で、ミニバー、バスタブと独立シャワー、エアコン、ルームサービスを備えます。喫煙・禁煙のどちらもお選びいただけます。',
      ],
      th: [
        'ห้องพรีเมียมมีขนาด 39 ตร.ม. หน้าต่างบานใหญ่หนึ่งบานเก็บภาพเนินเขาและย่านบ้านเรือนเบื้องล่างไว้ทั้งหมด บรรยากาศร่วมสมัยและเรียบง่าย',
        'โซฟาและเก้าอี้อาร์มแชร์ โต๊ะทำงานพร้อมปลั๊กอัจฉริยะ และจอ LCD ขนาด 46 นิ้ว เป็นอุปกรณ์มาตรฐาน สำหรับครอบครัวสามารถจัดห้องเชื่อมต่อได้ตามคำขอ',
        'ห้องจัดเตียงดับเบิล พร้อมมินิบาร์ อ่างอาบน้ำและฝักบัวแยก เครื่องปรับอากาศ และบริการรูมเซอร์วิส เลือกได้ทั้งห้องสูบบุหรี่และห้องปลอดบุหรี่',
      ],
    }),
    heroImage: draftFig('Royal-Halong-Hotel-Premiun-02.jpg', draft({
      vi: 'Phòng Premium với hai giường trải khăn cam, TV lớn trên tủ gỗ và cửa sổ nhìn ra sườn đồi cây xanh',
      en: 'A Premium room with two beds under orange runners, a large television on a wooden cabinet and a window onto the green hillside',
      zh: '高级客房内两张床铺着橙色床旗，木柜上放着大屏电视，窗外是绿树覆盖的山坡',
      ko: '오렌지색 러너를 덮은 침대 두 개, 원목 캐비닛 위의 큰 텔레비전, 초록빛 언덕이 보이는 창이 있는 프리미엄 룸',
      ja: 'オレンジのランナーを掛けたベッド2台、木製キャビネットの上の大型テレビ、緑の丘を望む窓があるプレミアムルーム',
      th: 'ห้องพรีเมียม เตียงสองเตียงปูผ้าคาดสีส้ม โทรทัศน์จอใหญ่บนตู้ไม้ และหน้าต่างที่มองเห็นเนินเขาเขียวขจี',
    })),
    gallery: [
      draftFig('Royal-Halong-Hotel-Premiun-01.jpg', draft({
        vi: 'Hai giường trải khăn cam trong phòng Premium, cửa sổ nhìn ra sườn đồi rợp cây và ghế bành vàng cạnh cửa',
        en: 'Two beds under orange runners in a Premium room, a window onto the wooded hillside and a yellow armchair beside it',
        zh: '高级客房内两张铺橙色床旗的床，窗外是林木葱茏的山坡，窗边一把黄色扶手椅',
        ko: '프리미엄 룸의 오렌지색 러너를 덮은 침대 두 개, 숲이 우거진 언덕이 보이는 창, 창 옆의 노란 안락의자',
        ja: 'プレミアムルームのオレンジのランナーを掛けたベッド2台、木々の茂る丘を望む窓、その脇の黄色いアームチェア',
        th: 'เตียงสองเตียงปูผ้าคาดสีส้มในห้องพรีเมียม หน้าต่างมองเห็นเนินเขาที่เต็มไปด้วยต้นไม้ และเก้าอี้อาร์มแชร์สีเหลืองข้างหน้าต่าง',
      })),
      draftFig('Royal-Halong-Hotel-Premiun-05.jpg', draft({
        vi: 'Phòng Premium có giường lớn và bộ sofa vàng ba chỗ, bàn trà tròn mặt kính, vách gương ngăn khu ngủ với lối vào',
        en: 'A Premium room with a large bed and a three-seat yellow sofa, a round glass table, and a mirrored partition between the sleeping area and the entrance',
        zh: '高级客房内的大床与三人位黄色沙发、圆形玻璃茶几，镜面隔断将睡眠区与入口分开',
        ko: '큰 침대와 3인용 노란 소파, 둥근 유리 티테이블이 있는 프리미엄 룸, 거울 파티션이 침실 공간과 현관을 나눕니다',
        ja: '大きなベッドと3人掛けの黄色いソファ、丸いガラステーブルを備えたプレミアムルーム。鏡張りの仕切りが寝室側と入口を分けています',
        th: 'ห้องพรีเมียมกับเตียงใหญ่และโซฟาสีเหลืองสามที่นั่ง โต๊ะกลางกระจกทรงกลม และฉากกั้นกระจกที่แยกส่วนนอนออกจากทางเข้า',
      })),
      draftFig('Royal-Halong-Hotel-Premiun-06.jpg', draft({
        vi: 'Bàn làm việc dài chạy dọc tường với ghế xoay da đen và gương dài phía trên, giường lớn và ghế sofa vàng bên trái',
        en: 'A long desk running the length of the wall with a black swivel chair and a mirror strip above it, the bed and a yellow sofa to the left',
        zh: '沿墙延展的长书桌，配黑色皮质转椅，上方是长条镜，左侧是大床与黄色沙发',
        ko: '벽을 따라 길게 놓인 책상과 검은 가죽 회전의자, 그 위의 긴 거울, 왼쪽에는 큰 침대와 노란 소파',
        ja: '壁沿いに伸びる長いデスクと黒革の回転椅子、その上の細長い鏡。左手には大きなベッドと黄色いソファ',
        th: 'โต๊ะทำงานตัวยาวเลียบผนัง เก้าอี้หมุนหนังสีดำ กระจกบานยาวด้านบน และเตียงใหญ่กับโซฟาสีเหลืองทางซ้าย',
      })),
      draftFig('Royal-Halong-Hotel-Premiun-04.jpg', draft({
        vi: 'Phòng tắm ốp đá kem với bồn tắm dài, buồng tắm kính, bồn rửa trên mặt đá và mảng gạch mosaic nâu đỏ',
        en: 'A cream stone bathroom with a long tub, a glass shower cubicle, a basin on a stone counter and a panel of red-brown mosaic tile',
        zh: '米色石材浴室，配长浴缸、玻璃淋浴间、石台面洗手盆与一片红棕色马赛克瓷砖',
        ko: '크림색 석재 욕실: 긴 욕조, 유리 샤워 부스, 석재 상판의 세면대, 적갈색 모자이크 타일 벽면',
        ja: 'クリーム色の石張りのバスルーム。長いバスタブ、ガラスのシャワーブース、石のカウンターの洗面台、赤茶色のモザイクタイル',
        th: 'ห้องน้ำปูหินสีครีม อ่างอาบน้ำทรงยาว ตู้อาบน้ำกระจก อ่างล้างหน้าบนเคาน์เตอร์หิน และแผงกระเบื้องโมเสกสีน้ำตาลแดง',
      })),
    ],
    features: [
      ...specFeatures({
        area: draft({
          vi: 'Diện tích: 39 m²', en: 'Room size: 39 m²',
          zh: '面积：39 平方米', ko: '면적: 39 m²', ja: '広さ：39 m²', th: 'ขนาดห้อง: 39 ตร.ม.',
        }),
        capacity: draft({
          vi: 'Sức chứa: 2 khách', en: 'Capacity: 2 guests',
          zh: '容纳人数：2 位客人', ko: '수용 인원: 2명', ja: '収容人数：2名', th: 'ความจุ: 2 ท่าน',
        }),
        view: draft({
          vi: 'Hướng phòng: Hướng đồi/thành phố', en: 'View: hills and town',
          zh: '景观：山峦与城区', ko: '전망: 언덕과 시가지', ja: '眺望：丘陵と市街', th: 'วิว: เนินเขาและตัวเมือง',
        }),
        bed: draft({
          vi: 'Loại giường: Giường đôi', en: 'Bed type: double bed',
          zh: '床型：双人床', ko: '베드 타입: 더블 베드', ja: 'ベッドタイプ：ダブルベッド', th: 'ประเภทเตียง: เตียงดับเบิล',
        }),
      }),
      ...amenityFeatures(),
    ],
  }
}

/**
 * VILLAS SUITE — 72 m², 2–4 khách, giường King Size.
 *
 * MÂU THUẪN TRONG BẢN CLONE: tiêu đề trang `villas-suite/index.html` ghi
 * "HƯỚNG PHÒNG: HƯỚNG BIỂN/VƯỜN" nhưng bảng tiện nghi ngay dưới ghi
 * "Hướng phòng: Hướng biển". Lấy theo tiêu đề (rộng hơn, và ảnh của phòng
 * đều nhìn ra vườn cọ chứ không ra vịnh).
 */
function villasSuiteDoc() {
  return {
    title: draft({
      vi: 'Villas Suite', en: 'Villas Suite',
      zh: 'Villas Suite', ko: 'Villas Suite', ja: 'Villas Suite', th: 'Villas Suite',
    }),
    areaSqm: 72,
    capacity: draft({
      vi: '2 – 4 khách', en: '2 – 4 guests',
      zh: '2 – 4 位客人', ko: '2 – 4명', ja: '2 – 4名', th: '2 – 4 ท่าน',
    }),
    view: draft({
      vi: 'Hướng biển / vườn', en: 'Bay and garden view',
      zh: '海景／园景', ko: '베이·가든 전망', ja: '湾・庭ビュー', th: 'วิวอ่าวและสวน',
    }),
    bedType: draft({
      vi: 'King Size', en: 'King-size bed',
      zh: '特大号床', ko: '킹 사이즈 베드', ja: 'キングサイズベッド', th: 'เตียงคิงไซซ์',
    }),
    summary: draft({
      vi: 'Căn 72 m² gồm một phòng khách lớn và một phòng ngủ, ban công kê bàn ghế ngoài trời và ô che.',
      en: 'A 72 m² villa with a large sitting room, one bedroom and a balcony set with outdoor furniture and a parasol.',
      zh: '72 平方米的别墅套房，含一间宽敞客厅与一间卧室，阳台备有户外桌椅与遮阳伞。',
      ko: '72 m² 규모의 빌라 스위트로 넓은 거실과 침실을 갖추었으며, 발코니에는 야외 가구와 파라솔이 놓여 있습니다.',
      ja: '72 m² のヴィラスイート。広いリビングと寝室を備え、バルコニーには屋外用の家具とパラソルを置いています。',
      th: 'วิลล่าสวีทขนาด 72 ตร.ม. มีห้องนั่งเล่นขนาดใหญ่และห้องนอน พร้อมระเบียงที่จัดวางเฟอร์นิเจอร์กลางแจ้งและร่มกันแดด',
    }),
    description: draftBlock({
      vi: [
        'Với diện tích 72 m², phòng Suite villas gồm 1 phòng khách lớn và 1 phòng ngủ với đầy đủ tiện nghi cho một chuyến đi đáng nhớ.',
        'Khu vực ban công được kê thêm bàn ghế ngoài trời và ô che, thuận tiện để bạn tận hưởng không khí và cảnh quan của thành phố cả ban ngày và ban đêm.',
        'Phòng ngủ dùng giường King Size. Phòng tắm ốp đá có bồn sục, buồng tắm kính riêng và cửa sổ vòm lấy sáng tự nhiên.',
      ],
      en: [
        'At 72 m², the Villas Suite is laid out as one large sitting room and one bedroom, fully equipped for a longer stay.',
        'The balcony is set with outdoor chairs and a parasol — a good place to take in the air and the view over the town, by day or after dark.',
        'The bedroom has a king-size bed. The marble bathroom has a whirlpool tub, a separate glass shower and an arched window that brings in daylight.',
      ],
      zh: [
        '面积 72 平方米的 Villas Suite 由一间宽敞客厅与一间卧室组成，配套齐备，适合长住。',
        '阳台上备有户外桌椅与遮阳伞，无论白天或入夜，都适合在此吹风、眺望城市景致。',
        '卧室配特大号床。石材浴室设有按摩浴缸、独立玻璃淋浴间，拱形窗引入自然光。',
      ],
      ko: [
        '72 m²의 Villas Suite는 넓은 거실 하나와 침실 하나로 구성되어 있으며, 장기 체류에도 부족함 없는 설비를 갖추었습니다.',
        '발코니에는 야외 의자와 파라솔이 놓여 있어, 낮이든 밤이든 바람을 쐬며 시가지 풍경을 바라보기 좋습니다.',
        '침실에는 킹 사이즈 베드가 놓입니다. 석재 욕실에는 월풀 욕조와 별도의 유리 샤워 부스가 있고, 아치형 창으로 자연광이 들어옵니다.',
      ],
      ja: [
        '72 m² の Villas Suite は、広いリビングと寝室がそれぞれ一室ずつ。長期の滞在にも十分な設備を備えています。',
        'バルコニーには屋外用の椅子とパラソル。昼も夜も、風に当たりながら街の景色を眺められます。',
        '寝室はキングサイズベッド。石張りのバスルームにはジェットバスと独立したガラスのシャワーがあり、アーチ窓から自然光が差し込みます。',
      ],
      th: [
        'Villas Suite ขนาด 72 ตร.ม. ประกอบด้วยห้องนั่งเล่นขนาดใหญ่หนึ่งห้องและห้องนอนหนึ่งห้อง พร้อมสิ่งอำนวยความสะดวกครบครันสำหรับการพักยาว',
        'ระเบียงจัดวางเก้าอี้กลางแจ้งและร่มกันแดด เหมาะแก่การรับลมและชมทิวทัศน์ของเมืองทั้งกลางวันและยามค่ำ',
        'ห้องนอนใช้เตียงคิงไซซ์ ห้องน้ำปูหินมีอ่างน้ำวน ตู้อาบน้ำกระจกแยกส่วน และหน้าต่างทรงโค้งที่รับแสงธรรมชาติ',
      ],
    }),
    heroImage: draftFig('Royal-Ha-Long-Villas-03.jpg', draft({
      vi: 'Phòng khách villa nhìn từ lối vào: bàn console gỗ bày lan trắng dưới bức tranh sơn mài, bộ sofa vải sọc và cửa kính trượt mở ra ban công',
      en: 'The villa sitting room from the entrance: a wooden console with white orchids under a lacquer painting, striped sofas, and sliding doors onto the balcony',
      zh: '从入口望向别墅客厅：木质边柜上摆着白色兰花，上方挂漆画，条纹布艺沙发，推拉玻璃门通往阳台',
      ko: '현관에서 바라본 빌라 거실: 옻칠 그림 아래 흰 난을 올린 원목 콘솔, 줄무늬 패브릭 소파, 발코니로 이어지는 유리 미닫이문',
      ja: '入口から見たヴィラのリビング。漆絵の下の木製コンソールに白い蘭、ストライプ地のソファ、バルコニーへ続くガラスの引き戸',
      th: 'ห้องนั่งเล่นวิลล่ามองจากทางเข้า โต๊ะคอนโซลไม้วางกล้วยไม้สีขาวใต้ภาพเขียนแล็กเกอร์ โซฟาผ้าลายทาง และประตูกระจกบานเลื่อนออกสู่ระเบียง',
    })),
    gallery: [
      draftFig('Royal-Halong-Hotel-Villas-05.jpg', draft({
        vi: 'Phòng khách villa với bàn console gỗ bày lan đỏ dưới bức tranh treo tường, bộ sofa vải sọc và bàn ăn gỗ ở tiền cảnh',
        en: 'A villa sitting room with a wooden console holding red orchids beneath a framed painting, striped sofas and a wooden dining table in the foreground',
        zh: '别墅客厅中木质边柜上摆着红色兰花，上方挂着画作，条纹布艺沙发，前景是木质餐桌',
        ko: '빌라 거실: 액자 그림 아래 붉은 난을 올린 원목 콘솔, 줄무늬 패브릭 소파, 앞쪽의 원목 식탁',
        ja: 'ヴィラのリビング。額装の絵の下の木製コンソールに赤い蘭、ストライプ地のソファ、手前に木のダイニングテーブル',
        th: 'ห้องนั่งเล่นวิลล่า โต๊ะคอนโซลไม้วางกล้วยไม้สีแดงใต้ภาพเขียนที่แขวนผนัง โซฟาผ้าลายทาง และโต๊ะอาหารไม้ด้านหน้า',
      })),
      draftFig('Royal-Halong-Hotel-Villas-06.jpg', draft({
        vi: 'Ba ghế sofa vải sọc quây quanh bàn trà gỗ bày hoa và đĩa trái cây, TV đặt trên tủ gỗ chạm phía trong',
        en: 'Three striped sofas around a wooden coffee table with flowers and a plate of fruit, the television on a carved cabinet beyond',
        zh: '三张条纹布艺沙发围着木质茶几，桌上摆着鲜花与果盘，里侧雕花木柜上放着电视',
        ko: '줄무늬 패브릭 소파 세 개가 꽃과 과일 접시를 올린 원목 티테이블을 둘러싸고, 안쪽 조각 장식 원목 캐비닛 위에 텔레비전',
        ja: 'ストライプ地のソファ3脚が、花と果物の皿を置いた木のローテーブルを囲む。奥の彫刻入り木製キャビネットにテレビ',
        th: 'โซฟาผ้าลายทางสามตัวล้อมโต๊ะกลางไม้ที่วางดอกไม้และจานผลไม้ ด้านในมีโทรทัศน์วางบนตู้ไม้แกะสลัก',
      })),
      draftFig('Royal-Halong-Hotel-Villas-01.jpg', draft({
        vi: 'Phòng ngủ villa với giường lớn trải khăn cam, TV trên tủ gỗ chạm, bàn tròn hai ghế và cửa kính trượt mở ra ban công xanh cây',
        en: 'A villa bedroom with a large bed under an orange runner, the television on a carved cabinet, a round table with two chairs, and sliding doors onto a balcony full of greenery',
        zh: '别墅卧室内的大床铺着橙色床旗，雕花木柜上放着电视，圆桌配两把椅子，推拉玻璃门外是绿意盎然的阳台',
        ko: '오렌지색 러너를 덮은 큰 침대, 조각 장식 원목 캐비닛 위의 텔레비전, 둥근 테이블과 의자 두 개, 초록이 우거진 발코니로 이어지는 유리 미닫이문이 있는 빌라 침실',
        ja: 'オレンジのランナーを掛けた大きなベッド、彫刻入り木製キャビネットの上のテレビ、丸テーブルと椅子2脚、緑あふれるバルコニーへ続くガラスの引き戸があるヴィラの寝室',
        th: 'ห้องนอนวิลล่ากับเตียงใหญ่ปูผ้าคาดสีส้ม โทรทัศน์บนตู้ไม้แกะสลัก โต๊ะกลมพร้อมเก้าอี้สองตัว และประตูกระจกบานเลื่อนออกสู่ระเบียงที่เขียวชอุ่ม',
      })),
      draftFig('Royal-Halong-Hotel-Villas-02.jpg', draft({
        vi: 'Giường lớn với đầu giường mây bọc nệm vàng, tủ đầu giường đặt điện thoại, tranh treo tường và cửa kính trượt mở ra ban công',
        en: 'A large bed with a rattan headboard and yellow padding, a nightstand with a telephone, a framed painting and sliding doors onto the balcony',
        zh: '大床配藤编与黄色软包床头，床头柜上放着电话，墙上挂画，推拉玻璃门通往阳台',
        ko: '라탄과 노란 쿠션을 덧댄 헤드보드의 큰 침대, 전화기가 놓인 협탁, 벽에 걸린 그림, 발코니로 이어지는 유리 미닫이문',
        ja: 'ラタンと黄色い張り地のヘッドボードの大きなベッド、電話を置いたナイトテーブル、壁の絵、バルコニーへ続くガラスの引き戸',
        th: 'เตียงใหญ่หัวเตียงหวายบุนวมสีเหลือง โต๊ะข้างเตียงวางโทรศัพท์ ภาพเขียนแขวนผนัง และประตูกระจกบานเลื่อนออกสู่ระเบียง',
      })),
      draftFig('Royal-Halong-Hotel-Villas-03.jpg', draft({
        vi: 'Phòng ngủ villa với giường lớn, ghế bành vải hoạ tiết cam kèm đôn gác chân và lối đi dẫn sang phòng khách',
        en: 'A villa bedroom with a large bed, a patterned orange armchair and footstool, and a passage through to the sitting room',
        zh: '别墅卧室内的大床，橙色花纹布艺扶手椅配脚凳，一条通道通向客厅',
        ko: '큰 침대가 놓인 빌라 침실, 오렌지색 무늬 패브릭 안락의자와 발받침, 거실로 이어지는 통로',
        ja: '大きなベッドのあるヴィラの寝室。オレンジの柄地のアームチェアとオットマン、リビングへ続く通路',
        th: 'ห้องนอนวิลล่ากับเตียงใหญ่ เก้าอี้อาร์มแชร์ผ้าลายสีส้มพร้อมที่วางเท้า และทางเดินเชื่อมไปยังห้องนั่งเล่น',
      })),
      draftFig('Royal-Ha-Long-Villas-04.jpg', draft({
        vi: 'Phòng tắm villa ốp đá với bồn sục đặt dưới cửa sổ vòm, buồng tắm kính có tay vịn và bồn rửa trên mặt đá đỏ',
        en: 'A marble villa bathroom with a whirlpool tub beneath an arched window, a glass shower with grab rails, and a basin on red stone',
        zh: '别墅石材浴室，按摩浴缸设于拱形窗下，玻璃淋浴间配扶手，洗手盆嵌在红色石台面上',
        ko: '석재를 두른 빌라 욕실: 아치형 창 아래의 월풀 욕조, 손잡이가 달린 유리 샤워 부스, 붉은 석재 상판의 세면대',
        ja: '石張りのヴィラのバスルーム。アーチ窓の下のジェットバス、手すり付きのガラスシャワー、赤い石のカウンターの洗面台',
        th: 'ห้องน้ำวิลล่าปูหิน อ่างน้ำวนใต้หน้าต่างทรงโค้ง ตู้อาบน้ำกระจกพร้อมราวจับ และอ่างล้างหน้าบนเคาน์เตอร์หินสีแดง',
      })),
    ],
    features: [
      ...specFeatures({
        area: draft({
          vi: 'Diện tích: 72 m²', en: 'Room size: 72 m²',
          zh: '面积：72 平方米', ko: '면적: 72 m²', ja: '広さ：72 m²', th: 'ขนาดห้อง: 72 ตร.ม.',
        }),
        capacity: draft({
          vi: 'Sức chứa: 2 – 4 khách', en: 'Capacity: 2 – 4 guests',
          zh: '容纳人数：2 – 4 位客人', ko: '수용 인원: 2 – 4명', ja: '収容人数：2 – 4名', th: 'ความจุ: 2 – 4 ท่าน',
        }),
        view: draft({
          vi: 'Hướng phòng: Hướng biển/vườn', en: 'View: bay and garden',
          zh: '景观：海景与园景', ko: '전망: 베이와 가든', ja: '眺望：湾と庭', th: 'วิว: อ่าวและสวน',
        }),
        bed: draft({
          vi: 'Loại giường: King Size', en: 'Bed type: king-size',
          zh: '床型：特大号床', ko: '베드 타입: 킹 사이즈', ja: 'ベッドタイプ：キングサイズ', th: 'ประเภทเตียง: คิงไซซ์',
        }),
      }),
      ...amenityFeatures(),
    ],
  }
}

/**
 * VILLAS DELUXE — 36 m², 2–4 khách, hướng vườn, giường Double/Twin.
 *
 * HAI MÂU THUẪN TRONG BẢN CLONE:
 * 1. Hướng phòng — tiêu đề `villas-deluxe/index.html` ghi "HƯỚNG PHÒNG:
 *    HƯỚNG VƯỜN" và đoạn mô tả ghi "ban công hướng vườn", nhưng bảng tiện
 *    nghi ghi "Hướng phòng: Hướng biển". Lấy theo tiêu đề + mô tả + ảnh
 *    (ban công nhìn xuống vườn cây), tức HƯỚNG VƯỜN.
 * 2. Sức chứa — bảng tiện nghi ghi "2 khách", còn thẻ giới thiệu trên trang
 *    Lưu trú VÀ trên cả bốn trang phòng đều ghi "2 – 4 KHÁCH". Lấy 2 – 4
 *    (năm chỗ nói vậy, và ảnh cho thấy phòng kê hai giường).
 */
function villasDeluxeDoc() {
  return {
    title: draft({
      vi: 'Villas Deluxe', en: 'Villas Deluxe',
      zh: 'Villas Deluxe', ko: 'Villas Deluxe', ja: 'Villas Deluxe', th: 'Villas Deluxe',
    }),
    areaSqm: 36,
    capacity: draft({
      vi: '2 – 4 khách', en: '2 – 4 guests',
      zh: '2 – 4 位客人', ko: '2 – 4명', ja: '2 – 4名', th: '2 – 4 ท่าน',
    }),
    view: draft({
      vi: 'Hướng vườn', en: 'Garden view',
      zh: '园景', ko: '가든뷰', ja: 'ガーデンビュー', th: 'วิวสวน',
    }),
    bedType: draft({
      vi: 'Giường đôi hoặc hai giường đơn', en: 'Double or twin beds',
      zh: '双人床或两张单人床', ko: '더블 베드 또는 트윈 베드', ja: 'ダブルベッドまたはツインベッド', th: 'เตียงดับเบิลหรือเตียงเดี่ยวสองเตียง',
    }),
    summary: draft({
      vi: 'Căn 36 m² sàn gỗ, cửa sổ lớn chống côn trùng và ban công hướng vườn.',
      en: 'A 36 m² villa room with timber floors, large insect-screened windows and a balcony facing the garden.',
      zh: '36 平方米的别墅客房，抛光木地板，大面积防虫纱窗，阳台朝向花园。',
      ko: '광택 원목 바닥과 방충망을 갖춘 큰 창, 정원을 향한 발코니가 있는 36 m² 빌라 객실.',
      ja: '磨き上げた木の床、防虫網付きの大きな窓、庭に面したバルコニーを備えた36 m² のヴィラルーム。',
      th: 'ห้องพักวิลล่าขนาด 36 ตร.ม. พื้นไม้ขัดเงา หน้าต่างบานใหญ่พร้อมมุ้งลวด และระเบียงที่หันออกสู่สวน',
    }),
    description: draftBlock({
      vi: [
        'Tận hưởng không khí trong lành cho một chuyến nghỉ dưỡng thư giãn và thoải mái. Không gian rộng rãi, thoáng đãng với ban công hướng vườn, phòng Villas Deluxe mang đến những tiện nghi hoàn hảo cho du khách.',
        'Sàn gỗ bóng, cửa sổ lớn chống côn trùng, TV và bồn tắm được trang bị đầy đủ.',
        'Phòng kê giường đôi hoặc hai giường đơn, phù hợp cho 2 đến 4 khách. Phòng tắm ốp gạch xanh có bồn tắm và buồng tắm kính riêng.',
      ],
      en: [
        'The Villas Deluxe is built around fresh air and an easy pace: a generous, open room with a balcony facing the garden.',
        'Polished timber floors, large insect-screened windows, a television and a bathtub all come as standard.',
        'The room takes either a double bed or twin beds and sleeps two to four. The green-tiled bathroom has a tub and a separate glass shower.',
      ],
      zh: [
        'Villas Deluxe 围绕清新的空气与从容的节奏而设：房间宽敞通透，阳台朝向花园。',
        '抛光木地板、大面积防虫纱窗、电视与浴缸均为标准配置。',
        '客房可布置双人床或两张单人床，可入住 2 至 4 人。绿色瓷砖浴室设有浴缸与独立玻璃淋浴间。',
      ],
      ko: [
        'Villas Deluxe는 맑은 공기와 느긋한 리듬을 중심에 둔 객실입니다. 넉넉하고 트인 공간에 정원을 향한 발코니가 딸려 있습니다.',
        '광택 원목 바닥, 방충망을 갖춘 큰 창, 텔레비전과 욕조가 기본으로 마련됩니다.',
        '객실은 더블 베드 또는 트윈 베드로 준비되며 2~4명이 묵을 수 있습니다. 초록 타일 욕실에는 욕조와 별도의 유리 샤워 부스가 있습니다.',
      ],
      ja: [
        'Villas Deluxe は、澄んだ空気とゆるやかな時間を軸にした客室です。ゆとりある開放的な空間に、庭へ向いたバルコニーが付きます。',
        '磨き上げた木の床、防虫網付きの大きな窓、テレビ、バスタブを標準で備えます。',
        '客室はダブルベッドまたはツインベッドで、2〜4名までご利用いただけます。緑のタイルのバスルームにはバスタブと独立したガラスシャワーがあります。',
      ],
      th: [
        'Villas Deluxe ออกแบบรอบแนวคิดอากาศบริสุทธิ์และจังหวะที่ผ่อนคลาย ห้องกว้างโปร่ง พร้อมระเบียงที่หันออกสู่สวน',
        'พื้นไม้ขัดเงา หน้าต่างบานใหญ่พร้อมมุ้งลวด โทรทัศน์ และอ่างอาบน้ำ เป็นอุปกรณ์มาตรฐาน',
        'ห้องจัดได้ทั้งเตียงดับเบิลและเตียงเดี่ยวสองเตียง รองรับ 2 ถึง 4 ท่าน ห้องน้ำกระเบื้องสีเขียวมีอ่างอาบน้ำและตู้อาบน้ำกระจกแยกส่วน',
      ],
    }),
    heroImage: draftFig('Royal-Ha-Long-Villas-room-01.jpg', draft({
      vi: 'Phòng villa với hai giường trải khăn cam, bàn gỗ và hai ghế bọc vàng, cửa kính trượt mở ra ban công rợp bóng cọ',
      en: 'A villa room with two beds under orange runners, a wooden table with two yellow-upholstered chairs and sliding doors onto a balcony shaded by palms',
      zh: '别墅客房内两张床铺着橙色床旗，木桌配两把黄色软包椅，推拉玻璃门外是棕榈树荫下的阳台',
      ko: '오렌지색 러너를 덮은 침대 두 개, 원목 테이블과 노란 천을 씌운 의자 두 개, 야자수 그늘이 드리운 발코니로 이어지는 유리 미닫이문이 있는 빌라 객실',
      ja: 'オレンジのランナーを掛けたベッド2台、木のテーブルと黄色い張り地の椅子2脚、ヤシの木陰のバルコニーへ続くガラスの引き戸があるヴィラの客室',
      th: 'ห้องพักวิลล่ากับเตียงสองเตียงปูผ้าคาดสีส้ม โต๊ะไม้พร้อมเก้าอี้หุ้มผ้าสีเหลืองสองตัว และประตูกระจกบานเลื่อนออกสู่ระเบียงใต้ร่มเงาต้นปาล์ม',
    })),
    gallery: [
      draftFig('Royal-Halong-Hotel-Villas-07.jpg', draft({
        vi: 'Phòng villa sàn gỗ với hai giường trải khăn cam, đầu giường bọc nệm vàng, cửa kính trượt mở ra ban công và bàn gỗ bày hoa',
        en: 'A villa room with timber floors, two beds under orange runners, yellow padded headboards, sliding doors onto the balcony and a wooden table set with flowers',
        zh: '铺木地板的别墅客房，两张床铺橙色床旗，黄色软包床头，推拉玻璃门通往阳台，木桌上摆着鲜花',
        ko: '원목 바닥의 빌라 객실: 오렌지색 러너를 덮은 침대 두 개, 노란 쿠션 헤드보드, 발코니로 이어지는 유리 미닫이문, 꽃을 올린 원목 테이블',
        ja: '木の床のヴィラの客室。オレンジのランナーを掛けたベッド2台、黄色い張り地のヘッドボード、バルコニーへ続くガラスの引き戸、花を置いた木のテーブル',
        th: 'ห้องพักวิลล่าพื้นไม้ เตียงสองเตียงปูผ้าคาดสีส้ม หัวเตียงบุนวมสีเหลือง ประตูกระจกบานเลื่อนออกสู่ระเบียง และโต๊ะไม้วางดอกไม้',
      })),
      draftFig('Royal-Halong-Hotel-Villas-08.jpg', draft({
        vi: 'Hai giường đơn đầu giường bọc nệm vàng, gối trang trí thêu chữ lồng, tranh hoa treo giữa tường và ghế bành vải hoạ tiết cam bên phải',
        en: 'Two single beds with yellow padded headboards and monogrammed cushions, a floral painting on the wall between them and a patterned orange armchair to the right',
        zh: '两张单人床配黄色软包床头，抱枕上绣有字母组合图案，墙上挂着花卉画，右侧是橙色花纹布艺扶手椅',
        ko: '노란 쿠션 헤드보드의 싱글 베드 두 개, 모노그램을 수놓은 쿠션, 벽 가운데 걸린 꽃 그림, 오른쪽의 오렌지색 무늬 패브릭 안락의자',
        ja: '黄色い張り地のヘッドボードのシングルベッド2台、モノグラム刺繍のクッション、壁の中央に花の絵、右手にオレンジの柄地のアームチェア',
        th: 'เตียงเดี่ยวสองเตียงหัวเตียงบุนวมสีเหลือง หมอนอิงปักอักษรย่อ ภาพดอกไม้แขวนกลางผนัง และเก้าอี้อาร์มแชร์ผ้าลายสีส้มทางขวา',
      })),
      draftFig('Royal-Halong-Hotel-Villas-09.jpg', draft({
        vi: 'Phòng villa nhìn từ lối vào: hai giường trải khăn cam, ghế bành vải hoạ tiết, bàn gỗ tròn bày hoa hồng và TV bên trái',
        en: 'A villa room seen from the entrance: two beds under orange runners, a patterned armchair, a round wooden table with pink roses and the television on the left',
        zh: '从入口望向别墅客房：两张床铺橙色床旗，花纹布艺扶手椅，圆形木桌上摆着粉玫瑰，左侧是电视',
        ko: '현관에서 바라본 빌라 객실: 오렌지색 러너를 덮은 침대 두 개, 무늬 패브릭 안락의자, 분홍 장미를 올린 둥근 원목 테이블, 왼쪽의 텔레비전',
        ja: '入口から見たヴィラの客室。オレンジのランナーを掛けたベッド2台、柄地のアームチェア、ピンクのバラを飾った丸い木のテーブル、左手にテレビ',
        th: 'ห้องพักวิลล่ามองจากทางเข้า เตียงสองเตียงปูผ้าคาดสีส้ม เก้าอี้อาร์มแชร์ผ้าลาย โต๊ะไม้ทรงกลมวางกุหลาบสีชมพู และโทรทัศน์ทางซ้าย',
      })),
      draftFig('Royal-Halong-Hotel-Villas-10.jpg', draft({
        vi: 'Phòng villa với TV trên tủ gỗ chạm, bàn gỗ bày trái cây và hoa, ghế sofa vải hoạ tiết cam kê trước hai giường',
        en: 'A villa room with the television on a carved wooden cabinet, a wooden table laid with fruit and flowers, and a patterned orange sofa in front of the two beds',
        zh: '别墅客房内雕花木柜上放着电视，木桌上摆着水果与鲜花，橙色花纹布艺沙发摆在两张床前',
        ko: '조각 장식 원목 캐비닛 위의 텔레비전, 과일과 꽃을 올린 원목 테이블, 침대 두 개 앞에 놓인 오렌지색 무늬 패브릭 소파가 있는 빌라 객실',
        ja: '彫刻入り木製キャビネットの上のテレビ、果物と花を並べた木のテーブル、ベッド2台の前に置かれたオレンジの柄地のソファがあるヴィラの客室',
        th: 'ห้องพักวิลล่ากับโทรทัศน์บนตู้ไม้แกะสลัก โต๊ะไม้วางผลไม้และดอกไม้ และโซฟาผ้าลายสีส้มตั้งอยู่หน้าเตียงสองเตียง',
      })),
      draftFig('Royal-Halong-Hotel-Villas-11.jpg', draft({
        vi: 'Phòng tắm villa ốp gạch xanh với bồn tắm, buồng tắm kính, bồn rửa tròn trên mặt đá đen và tranh gạch hoa sen',
        en: 'A villa bathroom in green tile with a tub, a glass shower, a round basin on a black stone counter and a lotus tile panel',
        zh: '别墅浴室铺绿色瓷砖，配浴缸、玻璃淋浴间、黑色石台面上的圆形洗手盆与荷花瓷砖画',
        ko: '초록 타일의 빌라 욕실: 욕조, 유리 샤워 부스, 검은 석재 상판의 둥근 세면대, 연꽃 타일 그림',
        ja: '緑のタイルのヴィラのバスルーム。バスタブ、ガラスのシャワー、黒い石のカウンターの丸い洗面台、蓮のタイル画',
        th: 'ห้องน้ำวิลล่ากระเบื้องสีเขียว อ่างอาบน้ำ ตู้อาบน้ำกระจก อ่างล้างหน้าทรงกลมบนเคาน์เตอร์หินสีดำ และภาพกระเบื้องรูปดอกบัว',
      })),
    ],
    features: [
      ...specFeatures({
        area: draft({
          vi: 'Diện tích: 36 m²', en: 'Room size: 36 m²',
          zh: '面积：36 平方米', ko: '면적: 36 m²', ja: '広さ：36 m²', th: 'ขนาดห้อง: 36 ตร.ม.',
        }),
        capacity: draft({
          vi: 'Sức chứa: 2 – 4 khách', en: 'Capacity: 2 – 4 guests',
          zh: '容纳人数：2 – 4 位客人', ko: '수용 인원: 2 – 4명', ja: '収容人数：2 – 4名', th: 'ความจุ: 2 – 4 ท่าน',
        }),
        view: draft({
          vi: 'Hướng phòng: Hướng vườn', en: 'View: garden',
          zh: '景观：园景', ko: '전망: 가든', ja: '眺望：庭', th: 'วิว: สวน',
        }),
        bed: draft({
          vi: 'Loại giường: Double/Twin', en: 'Bed type: double or twin',
          zh: '床型：双人床／双床', ko: '베드 타입: 더블 또는 트윈', ja: 'ベッドタイプ：ダブル／ツイン', th: 'ประเภทเตียง: ดับเบิล/ทวิน',
        }),
      }),
      ...amenityFeatures(),
    ],
  }
}

async function main() {
  resetKeys()

  const page = {
    title: draft({
      vi: 'Phòng Khách Sạn & Villas', en: 'Rooms & Villas',
      zh: '客房与别墅', ko: '호텔 객실 & 빌라', ja: 'ホテルルーム＆ヴィラ', th: 'ห้องพักและวิลล่า',
    }),
    sections: pageSections(),
    seo: {
      _type: 'seo',
      metaDescription: draft({
        vi: '156 phòng khách sạn nhìn ra Vịnh Hạ Long và khu Royal Villas với ban công hướng vườn — năm loại phòng từ 36 đến 95 m² tại Bãi Cháy, Hạ Long.',
        en: '156 hotel rooms looking over Ha Long Bay plus the Royal Villas with garden balconies — five room types from 36 to 95 m² in Bai Chay, Ha Long.',
        zh: '156 间俯瞰下龙湾的酒店客房，加上带花园阳台的 Royal Villas 别墅区——拜寨五种房型，面积 36 至 95 平方米。',
        ko: '하롱베이가 내다보이는 156실의 호텔 객실과 정원 발코니를 갖춘 Royal Villas — 바이짜이에 자리한 36~95 m²의 다섯 가지 객실 타입.',
        ja: 'ハロン湾を望む156室のホテルルームと、庭に面したバルコニーを持つ Royal Villas。バイチャイにある36〜95 m² の5つの客室タイプ。',
        th: 'ห้องพัก 156 ห้องที่มองเห็นอ่าวฮาลอง และ Royal Villas ที่มีระเบียงหันสู่สวน — ห้องพักห้าประเภท ขนาด 36 ถึง 95 ตร.ม. ที่บ๊ายจ๋าย ฮาลอง',
      }),
    },
  }

  // `room.suite` phải tồn tại TRƯỚC khi ghi trang: section "Phòng khách sạn"
  // có `cta` trỏ tới nó bằng reference, và Sanity từ chối reference tới
  // document chưa có.
  await upsertDoc('room.suite', 'room', suiteDoc())
  await patchDoc('page.luu-tru-phong-khach-san-villas', page)
  await patchDoc('room.deluxe', deluxeDoc())
  await patchDoc('room.premium', premiumDoc())
  await patchDoc('room.villas-suite', villasSuiteDoc())
  await patchDoc('room.villas-deluxe', villasDeluxeDoc())

  console.log(`\n  ${images} ảnh đã gắn · ${holes} ô ngôn ngữ còn trống\n`)

  let total = 0
  for (const id of [
    'page.luu-tru-phong-khach-san-villas',
    'room.suite',
    'room.deluxe',
    'room.premium',
    'room.villas-suite',
    'room.villas-deluxe',
  ]) {
    total += await assertFullyTranslated(id)
  }
  console.log(`\nTổng: ${total} field chưa đủ 6 ngôn ngữ.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
