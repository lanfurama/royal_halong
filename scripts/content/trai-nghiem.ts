/**
 * Nhóm D — TRẢI NGHIỆM.
 *
 * Ghi vào đúng 5 document: `page.experiences` và bốn tiện ích
 * `venue.fitness-center`, `venue.renata-spa`, `venue.be-boi`,
 * `venue.outdoor-swimming-pool`. Không chạm document của nhóm khác.
 *
 * Nguồn sự thật: `experiences/index.html` (bản clone WordPress). Mọi số liệu
 * dưới đây (tầng, giờ mở cửa, "miễn phí cho khách lưu trú", danh mục dịch vụ
 * spa, "5:00am - 22:00pm hằng ngày") đều lấy nguyên từ đó. Phần mô tả không
 * gian (tường kính, thảm xanh, giàn squat, bàn mây bên bể, quầy lễ tân ốp gỗ,
 * hàng cọ quanh bể ngoài trời) tả ĐÚNG những gì có trong 22 tấm ảnh đã xem —
 * không phải số liệu bịa.
 *
 * ── LỖI DỮ LIỆU ĐÃ SỬA ────────────────────────────────────────────────────
 * `page.experiences` sec-5 và `venue.outdoor-swimming-pool.description` để
 * NGUYÊN một đoạn tiếng Anh trong field `vi` ("The outdoor swimming pool
 * offers an exciting venue for night parties..."), nên trang tiếng Việt hiện
 * chữ tiếng Anh. `t()` không fallback ngược từ `en` về `vi` được — `vi` là
 * nguồn, `vi` sai thì không ai cứu. Ở đây:
 *   - `vi`  ← viết mới bằng tiếng Việt, đúng nội dung đoạn gốc.
 *   - `en`  ← chính đoạn tiếng Anh cũ, đặt về đúng chỗ của nó.
 * Cùng lớp lỗi: `venue.outdoor-swimming-pool.name.vi` là "OUTDOOR SWIMMING
 * POOL" → đổi sang "BỂ BƠI NGOÀI TRỜI"; `venue.be-boi.name.vi` là "BỂ BƠI"
 * (mơ hồ khi site có hai bể) → "BỂ BƠI TRONG NHÀ". Slug giữ nguyên để không
 * gãy URL.
 *
 * ── ĐỦ SÁU NGÔN NGỮ ───────────────────────────────────────────────────────
 * Vòng dựng (Agent 1) chỉ có `vi` + `en` và dùng bốn helper nháp `*D` nới
 * điều kiện xuống "đủ vi + en". Vòng dịch (Agent 2) đã điền `zh/ko/ja/th`,
 * nên các helper bên dưới gọi thẳng `loc()` / `blockLoc()` / `fig()` /
 * `linkTo()` trong `build.ts`: xoá nhầm một bản dịch là script ném lỗi ngay
 * lúc nạp module, KHÔNG âm thầm đẩy một field rỗng lên Sanity. Thứ tự tham
 * số ở mọi helper là (vi, en, zh, ko, ja, th).
 *
 * Thuật ngữ lấy từ `GLOSSARY.md`. Tên riêng giữ nguyên ở cả sáu ngôn ngữ:
 * `Renata Spa`, `Royal Villas`, `Royal Ha Long Hotel`. Tên "Cung Hội nghị
 * Quốc tế Hoàng Gia Hạ Long" ở zh/ko/ja/th lấy ĐÚNG dạng đã chốt trong
 * document dùng chung `navigation` (皇家国际会议宫 / 로열 인터내셔널 컨벤션
 * 팰리스 / ロイヤル国際コンベンションパレス / รอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ) —
 * đừng dịch lại một dạng thứ hai, khách sẽ thấy hai cái tên cho một nơi.
 */
import { loc, blockLoc, fig, linkTo, key, resetKeys } from './build'
import { assetIdFor } from './assets'
import { patchDoc, assertFullyTranslated } from './write'
import type { Locale } from '../../lib/i18n'

// ── Helper: thứ tự tham số luôn là (vi, en, zh, ko, ja, th) ───────────────

/** Chuỗi đa ngữ. `loc()` ném lỗi nếu thiếu bất kỳ ngôn ngữ nào. */
function D(vi: string, en: string, zh: string, ko: string, ja: string, th: string) {
  return loc({ vi, en, zh, ko, ja, th })
}

/** Khối Portable Text đa ngữ. Dòng mở đầu bằng "- " thành gạch đầu dòng. */
function blockD(
  vi: string[],
  en: string[],
  zh: string[],
  ko: string[],
  ja: string[],
  th: string[],
) {
  return blockLoc({ vi, en, zh, ko, ja, th })
}

/** Ảnh CÓ alt. `alt` tả thứ đang có trong ảnh, không lặp lại tiêu đề khối. */
function figD(
  name: string,
  vi: string,
  en: string,
  zh: string,
  ko: string,
  ja: string,
  th: string,
) {
  return fig(name, { vi, en, zh, ko, ja, th })
}

/**
 * Ảnh NỀN thuần trang trí — cố ý KHÔNG có field `alt`.
 * `HeroSection` và `CtaBandSection` truyền `decorative` xuống `SanityImage`,
 * nên alt luôn bị ép về rỗng dù dữ liệu có gì (xem `resolveImageAlt`). Ghi
 * một `alt` sáu ngôn ngữ vào đây là dịch một chuỗi không bao giờ tới tai ai.
 * Schema `figure` cũng nói đúng thế: "Để trống nếu ảnh chỉ mang tính trang
 * trí (ảnh nền, hoạ tiết)".
 */
function figBg(name: string) {
  const id = assetIdFor(name)
  if (!id) throw new Error(`figBg(): không có ảnh "${name}" trong scripts/import/out/assets.json`)
  return { _type: 'figure', _key: key('bg'), asset: { _type: 'reference', _ref: id } }
}

/** Liên kết nội bộ (reference, KHÔNG href). */
function linkD(
  docId: string,
  vi: string,
  en: string,
  zh: string,
  ko: string,
  ja: string,
  th: string,
) {
  return linkTo(docId, { vi, en, zh, ko, ja, th })
}

/**
 * Danh sách chip "điểm nhấn" của venue.
 * `_key` đánh theo chỉ số TRONG chính mảng này (không dùng bộ đếm toàn cục):
 * thêm một chip cho phòng tập thì khoá của spa không được phép đổi theo.
 * `_type` là BẮT BUỘC với phần tử mảng thuộc một kiểu object có tên — thiếu
 * nó Studio không biết render bằng gì (xem `scripts/import/transform.ts`).
 */
function hls(...rows: [vi: string, en: string, zh: string, ko: string, ja: string, th: string][]) {
  return rows.map(([vi, en, zh, ko, ja, th], i) => ({
    _key: `h-${i}`,
    _type: 'localeString',
    ...loc({ vi, en, zh, ko, ja, th }),
  }))
}

/** Slug giống nhau ở cả sáu locale — giữ một URL duy nhất cho mọi ngôn ngữ. */
function slug6(current: string) {
  return Object.fromEntries(
    (['vi', 'en', 'zh', 'ko', 'ja', 'th'] as Locale[]).map((l) => [l, { _type: 'slug', current }]),
  )
}

// `key()` dùng một bộ đếm module-level trong `build.ts`. Các hằng bên dưới
// được dựng ngay khi module được nạp, TRƯỚC `main()`, nên phải gọi ở đây chứ
// không phải trong `main()` — gọi muộn là reset sau khi khoá đã sinh xong,
// trông như idempotent mà không phải.
resetKeys()

// ── Bốn tiện ích ──────────────────────────────────────────────────────────

const FLOOR_3 = () =>
  D(
    'Tầng 3, khách sạn Royal Hạ Long',
    'Third floor, Royal Ha Long Hotel',
    'Royal Ha Long Hotel 三楼',
    'Royal Ha Long Hotel 3층',
    'Royal Ha Long Hotel 3階',
    'ชั้น 3 Royal Ha Long Hotel',
  )

// "24/7" giữ nguyên ký tự ở cả sáu — đây là cách viết giờ, không phải câu.
const ALL_HOURS = () => D('24/7', '24/7', '24/7', '24/7', '24/7', '24/7')

const FITNESS = {
  name: D(
    'FITNESS CENTER',
    'FITNESS CENTER',
    '健身中心',
    '피트니스 센터',
    'フィットネスセンター',
    'ฟิตเนสเซ็นเตอร์',
  ),
  slug: slug6('fitness-center'),
  kind: 'facility',
  order: 1,
  location: FLOOR_3(),
  hours: ALL_HOURS(),
  description: blockD(
    [
      'Phòng tập thể hình của khách sạn nằm trên tầng 3, một mặt là tường kính chạy suốt nhìn ra vịnh. Máy chạy bộ, xe đạp tập, giàn squat và khu tạ đơn đều có sẵn.',
      'Khách lưu trú tại Royal Hạ Long Hotel vào cửa miễn phí, và phòng không đóng cửa giờ nào.',
    ],
    [
      'The hotel gym sits on the third floor behind a full wall of glass facing the bay. Treadmills, exercise bikes, a squat rack and a free-weight area are all in place.',
      'Entry is free for guests staying at Royal Ha Long Hotel, and the room never closes.',
    ],
    [
      '酒店健身中心位于三楼，一整面落地玻璃正对下龙湾。跑步机、健身单车、深蹲架与哑铃区一应俱全。',
      '入住 Royal Ha Long Hotel 的宾客可免费使用，且全天候开放，不设闭馆时间。',
    ],
    [
      '호텔 피트니스 센터는 3층에 있으며, 한쪽 벽면 전체가 하롱베이를 향한 유리창입니다. 러닝머신과 실내 자전거, 스쿼트 랙, 프리웨이트 구역을 갖추고 있습니다.',
      'Royal Ha Long Hotel 투숙객은 무료로 이용하실 수 있으며, 문을 닫는 시간 없이 24시간 열려 있습니다.',
    ],
    [
      'ホテルのフィットネスセンターは3階にあり、一面のガラス壁がハロン湾に向いています。ランニングマシン、エアロバイク、スクワットラック、フリーウエイトエリアを備えています。',
      'Royal Ha Long Hotel にご宿泊のお客様は無料でご利用いただけ、閉館時間はありません。',
    ],
    [
      'ฟิตเนสเซ็นเตอร์ของโรงแรมอยู่ชั้น 3 ด้านหนึ่งเป็นผนังกระจกตลอดแนวหันออกสู่อ่าวฮาลอง มีทั้งลู่วิ่ง จักรยานออกกำลังกาย แร็กสควอท และโซนดัมเบล',
      'ผู้เข้าพักที่ Royal Ha Long Hotel ใช้บริการได้ฟรี และเปิดตลอดไม่มีเวลาปิด',
    ],
  ),
  highlights: hls(
    [
      'Miễn phí cho khách lưu trú',
      'Free for in-house guests',
      '住客免费使用',
      '투숙객 무료 이용',
      '宿泊者は無料',
      'ผู้เข้าพักใช้ฟรี',
    ],
    [
      'Máy chạy bộ hướng ra vịnh',
      'Treadmills facing the bay',
      '跑步机正对海湾',
      '하롱베이를 향한 러닝머신',
      '湾に面したランニングマシン',
      'ลู่วิ่งหันออกสู่อ่าว',
    ],
    [
      'Khu tạ và giàn squat',
      'Free weights and squat rack',
      '哑铃区与深蹲架',
      '프리웨이트와 스쿼트 랙',
      'フリーウエイトとスクワットラック',
      'โซนดัมเบลและแร็กสควอท',
    ],
    [
      'Xe đạp tập và bóng tập',
      'Exercise bikes and stability balls',
      '健身单车与健身球',
      '실내 자전거와 짐볼',
      'エアロバイクとバランスボール',
      'จักรยานออกกำลังกายและลูกบอลโยคะ',
    ],
  ),
  image: figD(
    'Royal-Ha-Long-GYM-01.jpg',
    'Phòng tập trải thảm hoa văn xanh, dãy máy chạy bộ và xe đạp tập xếp dọc tường kính cao nhìn ra thành phố',
    'A gym floored in blue patterned carpet, with treadmills and exercise bikes lined up along tall windows looking over the city',
    '铺着蓝色花纹地毯的健身房，跑步机与健身单车沿着可俯瞰城市的高大玻璃窗排成一列',
    '푸른 무늬 카펫이 깔린 헬스장, 도시가 내려다보이는 큰 유리창을 따라 러닝머신과 실내 자전거가 늘어서 있습니다',
    '青い模様のカーペットを敷いたジム。街を見下ろす高いガラス窓に沿って、ランニングマシンとエアロバイクが並んでいます',
    'ห้องออกกำลังกายปูพรมลายสีน้ำเงิน ลู่วิ่งและจักรยานออกกำลังกายเรียงอยู่ตามแนวหน้าต่างกระจกสูงที่มองเห็นตัวเมือง',
  ),
  gallery: [
    figD(
      'Royal-Ha-Long-GYM-02.jpg',
      'Khu tạ của phòng tập: giàn squat, giá tạ đơn và tường gương chạy dọc phòng',
      'The weights area of the gym: a squat rack, dumbbell racks and a mirrored wall running the length of the room',
      '健身房的力量训练区：深蹲架、哑铃架，以及贯穿整个房间的镜面墙',
      '헬스장의 웨이트 구역: 스쿼트 랙과 덤벨 랙, 그리고 벽면을 따라 이어지는 거울',
      'ジムのウエイトエリア。スクワットラックとダンベルラック、部屋の端まで続く鏡張りの壁',
      'โซนเวทของห้องออกกำลังกาย มีแร็กสควอท ชั้นวางดัมเบล และผนังกระจกเงายาวตลอดห้อง',
    ),
    figD(
      'Royal-Ha-Long-GYM-03.jpg',
      'Phòng tập buổi tối dưới ánh đèn xanh, máy chạy bộ và ghế đẩy tạ ở giữa sàn, hai quả bóng tập đặt ở góc',
      'The gym at night under blue lighting, treadmills and a weight bench in the middle of the floor, two stability balls in the corner',
      '夜晚蓝色灯光下的健身房，跑步机与卧推凳置于场地中央，两只健身球放在角落',
      '푸른 조명이 켜진 밤의 헬스장, 바닥 가운데에 러닝머신과 웨이트 벤치가 놓여 있고 구석에 짐볼 두 개가 있습니다',
      '青い照明に照らされた夜のジム。フロア中央にランニングマシンとウエイトベンチ、隅にバランスボールが2つ置かれています',
      'ห้องออกกำลังกายยามค่ำใต้แสงไฟสีน้ำเงิน ลู่วิ่งและม้านั่งยกเวทอยู่กลางห้อง ลูกบอลโยคะสองลูกวางอยู่ที่มุมห้อง',
    ),
    figD(
      'Royal-Ha-Long-GYM-04.jpg',
      'Ba máy chạy bộ quay ra dãy cửa sổ kính cao, một người khách đang chạy trên máy ở giữa',
      'Three treadmills facing a run of floor-to-ceiling windows, one guest running on the middle machine',
      '三台跑步机正对一排落地玻璃窗，一位客人在中间那台上跑步',
      '통유리창을 향해 놓인 러닝머신 세 대, 가운데 기계에서 한 손님이 달리고 있습니다',
      '床から天井までの窓に向いた3台のランニングマシン。真ん中のマシンで1人のお客様が走っています',
      'ลู่วิ่งสามเครื่องหันเข้าหาแนวหน้าต่างกระจกสูงจรดเพดาน แขกคนหนึ่งกำลังวิ่งอยู่บนเครื่องตรงกลาง',
    ),
  ],
}

const RENATA = {
  // Tên riêng — giữ nguyên ở cả sáu ngôn ngữ (GLOSSARY.md).
  name: D('RENATA SPA', 'RENATA SPA', 'RENATA SPA', 'RENATA SPA', 'RENATA SPA', 'RENATA SPA'),
  slug: slug6('renata-spa'),
  kind: 'facility',
  order: 4,
  location: FLOOR_3(),
  hours: ALL_HOURS(),
  description: blockD(
    [
      'Renata Spa là khu trị liệu trên tầng 3, ốp gỗ sẫm và giữ ánh sáng thấp. Dịch vụ gồm massage toàn thân, massage trị liệu da mặt, xông hơi, chăm sóc móng và tạo kiểu tóc.',
      'Có phòng một giường và phòng hai giường kê song song cho khách đi cùng nhau. Spa mở cửa 24/7.',
    ],
    [
      'Renata Spa is the treatment suite on the third floor, finished in dark wood and kept deliberately dim. Treatments cover full-body massage, facial massage, steam, nail care and hair styling.',
      'There are single rooms and twin rooms with two beds side by side for guests travelling together. The spa is open 24/7.',
    ],
    [
      'Renata Spa 是位于三楼的理疗区，以深色木饰面装点，灯光刻意调得柔和。服务涵盖全身按摩、面部按摩、蒸汽浴、美甲与美发造型。',
      '设有单床房，也有两张床并排的双床房，适合结伴同行的宾客。水疗中心 24/7 开放。',
    ],
    [
      'Renata Spa는 3층에 자리한 트리트먼트 공간으로, 짙은 원목으로 마감하고 조명을 낮게 유지합니다. 전신 마사지, 페이셜 마사지, 사우나, 네일 케어, 헤어 스타일링을 제공합니다.',
      '1인실과 베드 두 개를 나란히 둔 2인실이 있어 동행이 있는 분도 함께 이용하실 수 있습니다. 스파는 24/7 운영합니다.',
    ],
    [
      'Renata Spa は3階のトリートメントエリアです。濃い色の木で仕上げ、照明を抑えた空間になっています。全身マッサージ、フェイシャルマッサージ、スチーム、ネイルケア、ヘアスタイリングをご用意しています。',
      'ベッド1台のお部屋と、2台を並べたツインのお部屋があり、お連れ様とご一緒にご利用いただけます。スパは24/7営業です。',
    ],
    [
      'Renata Spa คือโซนทรีตเมนต์บนชั้น 3 ตกแต่งด้วยไม้สีเข้มและคุมแสงให้นวลตา บริการครอบคลุมนวดทั่วตัว นวดหน้า อบไอน้ำ ดูแลเล็บ และจัดแต่งทรงผม',
      'มีทั้งห้องเตียงเดี่ยวและห้องสองเตียงวางเรียงข้างกันสำหรับผู้ที่เดินทางมาด้วยกัน สปาเปิด 24/7',
    ],
  ),
  highlights: hls(
    ['Massage toàn thân', 'Full-body massage', '全身按摩', '전신 마사지', '全身マッサージ', 'นวดทั่วตัว'],
    ['Massage trị liệu da mặt', 'Facial massage', '面部按摩', '페이셜 마사지', 'フェイシャルマッサージ', 'นวดหน้า'],
    ['Xông hơi', 'Steam', '蒸汽浴', '사우나', 'スチームバス', 'อบไอน้ำ'],
    ['Chăm sóc móng', 'Nail care', '美甲护理', '네일 케어', 'ネイルケア', 'ดูแลเล็บ'],
    ['Tạo kiểu tóc', 'Hair styling', '美发造型', '헤어 스타일링', 'ヘアスタイリング', 'จัดแต่งทรงผม'],
  ),
  image: figD(
    'Royal-Halong-Hotel-Spa-01.jpg',
    'Kỹ thuật viên mặc đồng phục be xoa bóp vai cho một khách nữ nằm sấp trên giường trị liệu, hoa vàng cài trên tóc',
    'A therapist in a beige uniform working on the shoulders of a woman lying face down on a treatment bed, a yellow flower in her hair',
    '身着米色制服的理疗师为俯卧在理疗床上的女宾客按摩肩部，她的发间别着一朵黄花',
    '베이지색 유니폼을 입은 테라피스트가 트리트먼트 베드에 엎드린 여성 손님의 어깨를 마사지하고 있으며, 머리에는 노란 꽃이 꽂혀 있습니다',
    'ベージュのユニフォームのセラピストが、トリートメントベッドにうつ伏せの女性客の肩をほぐしています。髪には黄色い花が挿されています',
    'นักบำบัดในชุดยูนิฟอร์มสีเบจกำลังนวดไหล่ให้แขกหญิงที่นอนคว่ำบนเตียงทรีตเมนต์ โดยมีดอกไม้สีเหลืองทัดผม',
  ),
  gallery: [
    figD(
      'Royal-Halong-Hotel-Spa-07.jpg',
      'Quầy lễ tân spa bằng đá sáng trước tường ốp gỗ sẫm, hai chậu cây lớn và kệ gỗ bày lọ tinh dầu',
      'A pale stone spa reception desk against a dark wood-panelled wall, two large potted plants and wooden shelves holding oil bottles',
      '浅色石材的水疗前台立于深色木饰面墙前，两侧各有一盆大型绿植，木架上陈列着精油瓶',
      '짙은 원목 벽 앞에 놓인 밝은 석재 스파 리셉션 데스크, 양옆의 큰 화분 두 개와 오일 병이 놓인 나무 선반',
      '濃い色の木パネルの壁の前に置かれた、淡い石材のスパ・レセプションカウンター。大きな観葉植物が2鉢と、オイルの瓶が並ぶ木の棚',
      'เคาน์เตอร์ต้อนรับสปาทำจากหินสีอ่อนตั้งอยู่หน้าผนังบุไม้สีเข้ม มีต้นไม้กระถางใหญ่สองต้นและชั้นไม้วางขวดน้ำมันหอม',
    ),
    figD(
      'Royal-Halong-Hotel-Spa-02.jpg',
      'Phòng trị liệu hai giường gỗ kê song song, khăn trắng gấp sẵn và hoa lan đặt trên mỗi giường, tranh hoa súng treo trên tường',
      'A twin treatment room with two wooden beds side by side, folded white towels and orchids on each, a water-lily painting on the wall',
      '双床理疗房内两张木床并排摆放，每张床上叠放着白毛巾并点缀兰花，墙上挂着一幅睡莲画',
      '나무 베드 두 개가 나란히 놓인 2인 트리트먼트 룸, 각 베드에 흰 수건이 개어져 있고 난꽃이 놓여 있으며 벽에는 수련 그림이 걸려 있습니다',
      '木製のベッドを2台並べたツインのトリートメントルーム。各ベッドに白いタオルがたたまれ、蘭の花が置かれ、壁には睡蓮の絵が掛かっています',
      'ห้องทรีตเมนต์เตียงคู่ เตียงไม้สองเตียงวางเรียงข้างกัน มีผ้าขนหนูสีขาวพับไว้และดอกกล้วยไม้วางบนแต่ละเตียง ผนังแขวนภาพดอกบัว',
    ),
    figD(
      'Royal-Halong-Hotel-Spa-09.jpg',
      'Cận cảnh đôi bàn tay kỹ thuật viên xoa bóp lưng một khách nữ, hoa vàng đặt trên khăn trắng',
      'Close-up of a therapist’s hands working across a woman’s back, yellow flowers resting on the white sheet',
      '理疗师双手为女宾客按摩背部的特写，白色床单上放着黄色花朵',
      '테라피스트의 두 손이 여성 손님의 등을 마사지하는 모습을 가까이 담은 장면, 흰 시트 위에 노란 꽃이 놓여 있습니다',
      'セラピストの両手が女性客の背中をほぐす様子のクローズアップ。白いシーツの上に黄色い花が置かれています',
      'ภาพระยะใกล้ของมือนักบำบัดที่กำลังนวดหลังแขกหญิง มีดอกไม้สีเหลืองวางอยู่บนผ้าปูสีขาว',
    ),
    figD(
      'Royal-Halong-Hotel-Spa-08.jpg',
      'Kỹ thuật viên đứng bên giường trị liệu xoa bóp lưng cho khách, tranh hoa súng treo phía sau',
      'A therapist standing beside the treatment bed working on a guest’s back, the water-lily painting behind her',
      '理疗师站在理疗床旁为宾客按摩背部，身后是那幅睡莲画',
      '테라피스트가 트리트먼트 베드 옆에 서서 손님의 등을 마사지하고 있으며, 뒤로 수련 그림이 보입니다',
      'トリートメントベッドの脇に立ち、お客様の背中をほぐすセラピスト。背後に睡蓮の絵が掛かっています',
      'นักบำบัดยืนอยู่ข้างเตียงทรีตเมนต์และนวดหลังให้แขก ด้านหลังเป็นภาพดอกบัว',
    ),
    figD(
      'Royal-Halong-Hotel-Spa-03.jpg',
      'Dãy lọ gốm men xanh hình quả bầu, nắp tạo hình chiếc lá, xếp thẳng hàng trên kệ gỗ sẫm',
      'A row of green-glazed ceramic bottles with leaf-shaped stoppers, lined up on a dark wooden shelf',
      '一排葫芦形青釉陶瓶，瓶盖做成叶片造型，整齐排列在深色木架上',
      '잎 모양 마개를 얹은 호리병 형태의 청자빛 도자기 병들이 짙은 나무 선반 위에 일렬로 놓여 있습니다',
      '葉の形の栓をした瓢箪形の緑釉の陶器の瓶が、濃い色の木棚に一列に並んでいます',
      'ขวดเซรามิกเคลือบสีเขียวทรงน้ำเต้า ฝาทำเป็นรูปใบไม้ วางเรียงเป็นแถวบนชั้นไม้สีเข้ม',
    ),
    figD(
      'Royal-Halong-Hotel-Spa-04.jpg',
      'Hai tập gấp in chữ Renata Urban Spa dựng cạnh chiếc bình gốm màu đất vẽ hoạ tiết trên mặt quầy',
      'Two folded brochures printed “Renata Urban Spa” standing beside a patterned terracotta vase on the counter',
      '两本印有 “Renata Urban Spa” 字样的折页立在柜台上，旁边是一只绘有纹样的陶土色花瓶',
      '카운터 위에 “Renata Urban Spa”라고 인쇄된 접이식 브로슈어 두 부가 세워져 있고, 그 옆에 무늬가 그려진 테라코타 화병이 놓여 있습니다',
      'カウンターの上に「Renata Urban Spa」と印刷された二つ折りのパンフレットが2部立てられ、その横に文様の描かれたテラコッタの花瓶が置かれています',
      'โบรชัวร์พับสองแผ่นพิมพ์คำว่า “Renata Urban Spa” ตั้งอยู่บนเคาน์เตอร์ ข้าง ๆ เป็นแจกันดินเผาเขียนลาย',
    ),
  ],
}

const INDOOR_POOL = {
  // "BỂ BƠI" trong dữ liệu import là tên của bể TRONG NHÀ (ảnh gốc đặt tên
  // `four-season-swimming-pool`). Site có hai bể, nên tên trần "BỂ BƠI"
  // không phân biệt được — thêm "TRONG NHÀ". Slug giữ `be-boi`.
  name: D(
    'BỂ BƠI TRONG NHÀ',
    'INDOOR SWIMMING POOL',
    '室内泳池',
    '실내 수영장',
    '屋内プール',
    'สระว่ายน้ำในร่ม',
  ),
  slug: slug6('be-boi'),
  kind: 'facility',
  order: 7,
  location: FLOOR_3(),
  hours: ALL_HOURS(),
  description: blockD(
    [
      'Bể bơi trong nhà trên tầng 3, lấy sáng qua các ô kính trần. Nước luôn được giữ ở nhiệt độ phù hợp với thân nhiệt nên bơi được quanh năm.',
      'Dọc bờ bể kê bàn mây và ghế tựa: quý khách gọi đồ ăn, đồ uống ngay tại chỗ và ngồi lại sau khi bơi.',
    ],
    [
      'An indoor pool on the third floor, lit from above through roof glazing. The water is held at a temperature matched to the body, so it swims in any month of the year.',
      'Rattan tables and chairs line the deck, so food and drinks can be ordered without leaving the water’s edge.',
    ],
    [
      '三楼的室内泳池，光线自屋顶玻璃洒落而下。水温始终维持在贴近体温的区间，一年四季皆可畅泳。',
      '池畔摆放着藤编桌椅，宾客可在池边直接点选餐食与饮品，游罢小坐片刻。',
    ],
    [
      '3층의 실내 수영장으로, 천장 유리를 통해 자연광이 들어옵니다. 수온을 체온에 맞춰 유지하므로 계절과 관계없이 수영하실 수 있습니다.',
      '풀 사이드에는 라탄 테이블과 의자를 두어, 물가를 떠나지 않고 음식과 음료를 주문하고 수영 후 쉬어 가실 수 있습니다.',
    ],
    [
      '3階の屋内プールで、天井のガラスから光が差し込みます。水温は体温に近い温度に保たれ、一年を通して泳いでいただけます。',
      'プールサイドにはラタンのテーブルと椅子を並べており、水辺を離れずにお食事やお飲み物をご注文いただけます。',
    ],
    [
      'สระว่ายน้ำในร่มบนชั้น 3 รับแสงจากช่องกระจกบนเพดาน น้ำในสระคุมอุณหภูมิให้ใกล้เคียงอุณหภูมิร่างกาย จึงว่ายได้ตลอดทั้งปี',
      'ริมสระมีโต๊ะและเก้าอี้หวายวางเรียงไว้ สั่งอาหารและเครื่องดื่มได้ทันทีโดยไม่ต้องลุกไปไหน และนั่งพักต่อได้หลังว่ายน้ำ',
    ],
  ),
  highlights: hls(
    [
      'Bơi được quanh năm',
      'Swimming all year round',
      '四季皆可畅泳',
      '사계절 수영 가능',
      '一年中泳げます',
      'ว่ายน้ำได้ตลอดปี',
    ],
    [
      'Mái kính lấy sáng',
      'Daylight through the roof',
      '玻璃屋顶自然采光',
      '천장 유리로 드는 자연광',
      'ガラス屋根からの自然光',
      'แสงธรรมชาติจากหลังคากระจก',
    ],
    [
      'Phục vụ đồ ăn, đồ uống bên bể',
      'Food and drinks at the poolside',
      '池畔餐饮服务',
      '풀사이드 식음료 서비스',
      'プールサイドの飲食サービス',
      'บริการอาหารและเครื่องดื่มริมสระ',
    ],
    [
      'Bậc lên xuống có tay vịn',
      'Handrail steps into the water',
      '带扶手的下水阶梯',
      '손잡이가 있는 입수 계단',
      '手すり付きの入水ステップ',
      'บันไดลงสระพร้อมราวจับ',
    ],
  ),
  image: figD(
    'Royal-Halong-Hotel-four-season-swimming-pool-01.jpg',
    'Bể bơi trong nhà nước xanh ngọc, nền và thành bể lát gạch trắng, các ô kính trần lấy sáng phía trên',
    'An indoor pool of turquoise water, white tiled deck and surround, roof lights overhead',
    '室内泳池池水呈碧绿色，池畔与池壁铺白色瓷砖，头顶是采光的屋顶天窗',
    '청록빛 물이 담긴 실내 수영장, 바닥과 벽면은 흰 타일로 마감했고 천장에는 채광창이 나 있습니다',
    'ターコイズ色の水をたたえた屋内プール。デッキと周囲は白いタイル張りで、頭上には採光用の天窓があります',
    'สระว่ายน้ำในร่มน้ำสีเขียวเทอร์คอยซ์ พื้นและขอบสระปูกระเบื้องขาว ด้านบนเป็นช่องกระจกรับแสงบนหลังคา',
  ),
  gallery: [
    figD(
      'Royal-Halong-Hotel-four-season-swimming-pool-03.jpg',
      'Đầu nông của bể bơi trong nhà với bậc lên xuống và tay vịn inox, dãy cửa sổ nhìn ra vườn phía sau',
      'The shallow end of the indoor pool with steps and a stainless handrail, a run of windows onto the garden behind',
      '室内泳池的浅水区设有阶梯与不锈钢扶手，身后一排窗户可望见花园',
      '실내 수영장의 얕은 쪽에는 계단과 스테인리스 손잡이가 있고, 뒤로는 정원이 보이는 창이 이어집니다',
      '屋内プールの浅い側にはステップとステンレスの手すりがあり、その奥には庭に面した窓が並んでいます',
      'ฝั่งน้ำตื้นของสระในร่มมีบันไดและราวจับสเตนเลส ด้านหลังเป็นแนวหน้าต่างที่มองออกไปเห็นสวน',
    ),
    figD(
      'Royal-Halong-Hotel-four-season-swimming-pool-02.jpg',
      'Bàn mây tròn và ghế tựa kê thành từng cụm dọc bờ bể bơi trong nhà, trần giật cấp phía trên',
      'Round rattan tables and chairs set in groups along the indoor poolside, a stepped ceiling above',
      '圆形藤编桌椅成组摆放在室内泳池畔，头顶是层层跌级的吊顶',
      '실내 수영장 가장자리를 따라 라탄 원형 테이블과 의자가 무리 지어 놓여 있고, 위로는 단을 이룬 천장이 보입니다',
      '屋内プールサイドに沿って円形のラタンテーブルと椅子がいくつかのまとまりで置かれ、上には段状の天井が広がります',
      'โต๊ะหวายทรงกลมและเก้าอี้จัดเป็นกลุ่มตามแนวริมสระในร่ม ด้านบนเป็นฝ้าเพดานแบบลดระดับ',
    ),
    figD(
      'Royal-Halong-Hotel-four-season-swimming-pool-04.jpg',
      'Hai người khách ngồi trên ghế nằm gỗ bên bể bơi, mỗi người cầm một ly cocktail',
      'Two guests on wooden sun loungers by the pool, each holding a cocktail',
      '两位宾客坐在池畔的木质躺椅上，各自手持一杯鸡尾酒',
      '수영장 옆 나무 선베드에 앉은 두 명의 손님이 각자 칵테일 잔을 들고 있습니다',
      'プールサイドの木製サンラウンジャーに座る2人のお客様が、それぞれカクテルを手にしています',
      'แขกสองคนนั่งบนเตียงอาบแดดไม้ริมสระ ต่างถือแก้วค็อกเทลคนละแก้ว',
    ),
  ],
}

const OUTDOOR_POOL = {
  // Tên cũ trong field `vi` là chuỗi tiếng Anh "OUTDOOR SWIMMING POOL".
  name: D(
    'BỂ BƠI NGOÀI TRỜI',
    'OUTDOOR SWIMMING POOL',
    '室外泳池',
    '야외 수영장',
    '屋外プール',
    'สระว่ายน้ำกลางแจ้ง',
  ),
  slug: slug6('outdoor-swimming-pool'),
  kind: 'facility',
  order: 10,
  // Tên riêng — giữ nguyên ở cả sáu ngôn ngữ.
  location: D('Royal Villas', 'Royal Villas', 'Royal Villas', 'Royal Villas', 'Royal Villas', 'Royal Villas'),
  hours: D(
    '5:00 – 22:00 hằng ngày',
    '5:00 – 22:00 daily',
    '每日 5:00 – 22:00',
    '매일 5:00 – 22:00',
    '毎日 5:00 – 22:00',
    'ทุกวัน 5:00 – 22:00',
  ),
  description: blockD(
    [
      // `vi` viết mới — chỗ này trước đây là nguyên văn đoạn tiếng Anh bên dưới.
      'Bể bơi ngoài trời nằm trong khuôn viên Royal Villas, giữa hàng cọ cao và dãy lan can trắng. Ban ngày là chỗ tắm nắng, cuối ngày mặt nước hứng trọn ánh hoàng hôn của thành phố.',
      'Khi trời tối, khoảng sân quanh bể trở thành nơi tổ chức tiệc đêm và lễ cưới ngoài trời.',
    ],
    [
      // Nguyên văn đoạn tiếng Anh của bản clone, trả về đúng field của nó.
      'The outdoor swimming pool offers an exciting venue for night parties or outdoor weddings. It is also where you can soak in the sun while enjoying the romantic sunset of the city.',
      'It sits in the grounds of Royal Villas, ringed by tall palms and a white balustrade.',
    ],
    [
      '室外泳池位于 Royal Villas 园区内，四周是高大的棕榈树与白色栏杆。白天是晒太阳的好去处，傍晚水面则映满城市的落日余晖。',
      '入夜之后，池畔的场地便成为举办夜间派对与户外婚礼的所在。',
    ],
    [
      '야외 수영장은 Royal Villas 부지 안, 키 큰 야자수와 흰 난간 사이에 자리합니다. 낮에는 일광욕을 즐기는 자리가 되고, 해 질 무렵에는 수면 가득 도시의 노을이 내려앉습니다.',
      '밤이 되면 수영장을 둘러싼 테라스가 나이트 파티와 야외 웨딩이 열리는 공간으로 바뀝니다.',
    ],
    [
      '屋外プールは Royal Villas の敷地内、背の高いヤシの木と白い手すりに囲まれた場所にあります。日中は日光浴の場となり、夕暮れには水面が街の夕日を映します。',
      '夜になると、プールを囲むテラスはナイトパーティーや屋外ウエディングの会場になります。',
    ],
    [
      'สระว่ายน้ำกลางแจ้งตั้งอยู่ในพื้นที่ของ Royal Villas ท่ามกลางแนวต้นปาล์มสูงและราวระเบียงสีขาว กลางวันเป็นมุมอาบแดด ส่วนช่วงเย็นผิวน้ำจะสะท้อนแสงอาทิตย์ตกของเมืองไว้เต็มผืน',
      'เมื่อค่ำลง ลานรอบสระจะกลายเป็นพื้นที่จัดปาร์ตี้ยามค่ำคืนและงานแต่งงานกลางแจ้ง',
    ],
  ),
  highlights: hls(
    [
      'Ghế tắm nắng quanh bể',
      'Sun loungers around the pool',
      '池畔日光躺椅',
      '수영장을 두른 선베드',
      'プールを囲むサンラウンジャー',
      'เตียงอาบแดดรอบสระ',
    ],
    [
      'Ngắm hoàng hôn thành phố',
      'Sunset over the city',
      '眺望城市落日',
      '도시 위로 지는 노을',
      '街に沈む夕日',
      'ชมพระอาทิตย์ตกเหนือเมือง',
    ],
    ['Tiệc đêm', 'Night parties', '夜间派对', '나이트 파티', 'ナイトパーティー', 'ปาร์ตี้ยามค่ำคืน'],
    ['Lễ cưới ngoài trời', 'Outdoor weddings', '户外婚礼', '야외 웨딩', '屋外ウエディング', 'งานแต่งงานกลางแจ้ง'],
  ),
  // Ảnh cũ là `Royal-Ha-Long-Hotel-Overview-01.jpg` — bể bơi TRƯỚC toà khách
  // sạn, không phải bể trong khuôn viên Royal Villas mà thẻ này nói tới.
  image: figD(
    'Royal-Halong-Hotel-outdoor-swimming-pool-03.jpg',
    'Bể bơi ngoài trời trước toà villa ba tầng sơn trắng, hàng ô che trắng và cây cọ dọc bờ bể',
    'An outdoor pool in front of a three-storey white villa, a row of white parasols and palms along its edge',
    '室外泳池坐落在一栋三层白色别墅前，池边排列着白色遮阳伞与棕榈树',
    '3층짜리 흰 빌라 앞의 야외 수영장, 가장자리를 따라 흰 파라솔과 야자수가 늘어서 있습니다',
    '3階建ての白いヴィラの前に広がる屋外プール。縁に沿って白いパラソルとヤシの木が並んでいます',
    'สระว่ายน้ำกลางแจ้งหน้าวิลลาสีขาวสามชั้น ริมสระเรียงรายด้วยร่มสีขาวและต้นปาล์ม',
  ),
  gallery: [
    figD(
      'Royal-Halong-Hotel-outdoor-swimming-pool-02.jpg',
      'Bể bơi ngoài trời viền cong lát sân gạch sáng, toà villa trắng và hàng cọ phía sau',
      'An outdoor pool with a curved edge set in pale paving, the white villa and palms behind it',
      '弧形池沿的室外泳池嵌于浅色铺地之中，身后是白色别墅与成排棕榈',
      '밝은 포장 바닥에 자리한 곡선형 야외 수영장, 뒤로 흰 빌라와 야자수가 보입니다',
      '淡い色の舗装に囲まれた曲線的な屋外プール。奥に白いヴィラとヤシの木が見えます',
      'สระว่ายน้ำกลางแจ้งขอบโค้งอยู่บนลานปูพื้นสีอ่อน ด้านหลังเป็นวิลลาสีขาวและแนวต้นปาล์ม',
    ),
    figD(
      '294085727_1133921623854310_4298130230198940685_n.jpeg',
      'Một người khách mặc đồ bơi đen ngồi bên thành bể bơi ngoài trời, ba cây cọ cao và lan can trắng phía sau',
      'A guest in a black swimsuit sitting on the edge of the outdoor pool, three tall palms and a white balustrade behind',
      '一位身着黑色泳衣的客人坐在室外泳池边缘，身后是三棵高大棕榈与白色栏杆',
      '검은 수영복을 입은 손님이 야외 수영장 가장자리에 앉아 있고, 뒤로 키 큰 야자수 세 그루와 흰 난간이 보입니다',
      '黒い水着のお客様が屋外プールの縁に腰かけています。背後には背の高いヤシの木が3本と白い手すりがあります',
      'แขกในชุดว่ายน้ำสีดำนั่งอยู่ริมขอบสระกลางแจ้ง ด้านหลังเป็นต้นปาล์มสูงสามต้นและราวระเบียงสีขาว',
    ),
  ],
}

// ── Chồng section của `page.experiences` ──────────────────────────────────
//
// Trước: hero + venueListSection + BỐN `richTextSection` không ảnh, nội dung
// lặp đúng bốn thẻ tiện ích ngay bên trên. Sau: mỗi khối hoặc mang ảnh, hoặc
// mang thông tin khác với thẻ tiện ích — không còn `richTextSection` nào.
//
// Nhịp nền: hero (ảnh tối) → cream-alt → nền trang → cream-alt → nền trang →
// cream-alt → nền trang → cream-alt (cardGrid cố định) → ảnh (ctaBand).
// `tone: 'white'` của `ImageTextSection` là `bg-cream` — TRÙNG nền trang mà
// `venueListSection` đang dùng; muốn tách khối thì phải là `'cream'`
// (`bg-cream-alt`). Đừng đọc tên tone theo nghĩa đen.
const SECTIONS = [
  {
    // `_key` giữ nguyên 'sec-0': đây vẫn là hero cũ, chỉ thêm bản dịch.
    _key: 'sec-0',
    _type: 'heroSection',
    heading: D('TRẢI NGHIỆM', 'EXPERIENCES', '体验', '경험', '体験', 'ประสบการณ์'),
    subheading: D(
      'TẬN HƯỞNG NHỮNG TRẢI NGHIỆM SANG TRỌNG TINH TẾ',
      'SAVOUR THE REFINED SIDE OF A STAY',
      '尽享精致雅逸的度假体验',
      '섬세하고 품격 있는 머무름을 누리십시오',
      '洗練された滞在のひとときを',
      'ดื่มด่ำกับประสบการณ์พักผ่อนอันประณีต',
    ),
    background: figBg('DSC00801-scaled.jpg'),
    height: 'medium',
  },

  {
    _key: 'sec-intro',
    _type: 'imageTextSection',
    eyebrow: D('TRẢI NGHIỆM', 'EXPERIENCES', '体验', '경험', '体験', 'ประสบการณ์'),
    heading: D(
      'Bốn tiện ích trong cùng một khuôn viên',
      'Four facilities within the grounds',
      '同一园区内的四处设施',
      '한 부지 안의 네 가지 시설',
      'ひとつの敷地に四つの施設',
      'สี่สิ่งอำนวยความสะดวกในพื้นที่เดียวกัน',
    ),
    content: blockD(
      [
        'Ngoài phòng ngủ, Royal Hạ Long Hotel giữ cho khách bốn không gian riêng để nghỉ và vận động: phòng tập thể hình, Renata Spa, bể bơi trong nhà và bể bơi ngoài trời.',
        'Ba trong bốn nơi nằm gọn trên tầng 3 của khách sạn và không đóng cửa giờ nào — xuống bơi lúc năm giờ sáng hay lên máy chạy bộ lúc nửa đêm đều được. Bể bơi ngoài trời nằm trong khuôn viên Royal Villas, mở từ 5:00 đến 22:00 hằng ngày.',
        'Cả bốn đều nằm trong khuôn viên khách sạn ở Bãi Cháy, nên quý khách không phải rời cổng: từ phòng tới bể bơi chỉ là vài phút đi thang máy.',
      ],
      [
        'Beyond the bedrooms, Royal Ha Long Hotel keeps four separate spaces for rest and exercise: the gym, Renata Spa, an indoor pool and an outdoor pool.',
        'Three of the four sit together on the third floor and never close — a five o’clock swim and a midnight run are both possible. The outdoor pool lies in the grounds of Royal Villas and opens from 5:00 to 22:00 daily.',
        'All four are inside the hotel grounds at Bai Chay, so there is no need to leave: your room and the water are a short lift ride apart.',
      ],
      [
        '除了客房之外，Royal Ha Long Hotel 还为宾客保留了四处专属空间，用于休憩与运动：健身中心、Renata Spa、室内泳池与室外泳池。',
        '其中三处同在酒店三楼，且全天候开放——清晨五点下水，或是午夜登上跑步机，都不成问题。室外泳池位于 Royal Villas 园区，每日 5:00 至 22:00 开放。',
        '四处皆在拜寨的酒店园区之内，宾客无需出门：从客房到泳池，不过是几分钟的电梯路程。',
      ],
      [
        '객실 외에도 Royal Ha Long Hotel은 휴식과 운동을 위한 네 개의 공간을 따로 마련해 두었습니다. 피트니스 센터, Renata Spa, 실내 수영장, 그리고 야외 수영장입니다.',
        '이 가운데 세 곳은 호텔 3층에 나란히 있으며 문을 닫는 시간이 없습니다. 새벽 다섯 시의 수영도, 자정의 러닝도 가능합니다. 야외 수영장은 Royal Villas 부지에 있으며 매일 5:00부터 22:00까지 운영합니다.',
        '네 곳 모두 바이짜이의 호텔 부지 안에 있어 문을 나설 필요가 없습니다. 객실에서 수영장까지는 엘리베이터로 몇 분이면 닿습니다.',
      ],
      [
        '客室のほかに、Royal Ha Long Hotel は休息と運動のための四つの空間をご用意しています。フィットネスセンター、Renata Spa、屋内プール、屋外プールです。',
        'このうち三つはホテルの3階にまとまっており、閉まる時間がありません。朝5時のひと泳ぎも、深夜のランニングも可能です。屋外プールは Royal Villas の敷地内にあり、毎日5:00から22:00まで開いています。',
        '四つともバイチャイのホテル敷地内にあるため、外へ出る必要はありません。客室からプールまではエレベーターで数分です。',
      ],
      [
        'นอกเหนือจากห้องพัก Royal Ha Long Hotel ยังจัดพื้นที่ไว้อีกสี่แห่งสำหรับการพักผ่อนและออกกำลังกาย ได้แก่ ฟิตเนสเซ็นเตอร์ Renata Spa สระว่ายน้ำในร่ม และสระว่ายน้ำกลางแจ้ง',
        'สามในสี่แห่งนี้อยู่บนชั้น 3 ของโรงแรมและเปิดตลอดไม่มีเวลาปิด จะลงว่ายน้ำตอนตีห้าหรือขึ้นลู่วิ่งตอนเที่ยงคืนก็ได้ ส่วนสระว่ายน้ำกลางแจ้งอยู่ในพื้นที่ของ Royal Villas เปิดทุกวันตั้งแต่ 5:00 ถึง 22:00',
        'ทั้งสี่แห่งอยู่ในพื้นที่ของโรงแรมที่บ๊ายจ๋าย จึงไม่ต้องออกไปไหน จากห้องพักถึงสระว่ายน้ำใช้เวลาเพียงไม่กี่นาทีด้วยลิฟต์',
      ],
    ),
    image: figD(
      'Royal-Ha-Long-Hotel-Overview-01.jpg',
      'Bể bơi ngoài trời lát gạch xanh trước toà nhà trắng của khách sạn, hàng cọ và ghế tắm nắng che ô xanh dọc bờ bể',
      'A blue-tiled outdoor pool in front of the white hotel building, palms and sun loungers under blue parasols along its edge',
      '铺着蓝色瓷砖的室外泳池位于白色酒店大楼前，池畔是成排棕榈与蓝色遮阳伞下的日光躺椅',
      '흰 호텔 건물 앞의 파란 타일 야외 수영장, 가장자리를 따라 야자수와 파란 파라솔 아래 선베드가 놓여 있습니다',
      '白いホテル棟の前にある、青いタイル張りの屋外プール。縁に沿ってヤシの木と、青いパラソルの下のサンラウンジャーが並んでいます',
      'สระว่ายน้ำกลางแจ้งปูกระเบื้องสีฟ้าหน้าอาคารโรงแรมสีขาว ริมสระมีต้นปาล์มและเตียงอาบแดดใต้ร่มสีฟ้า',
    ),
    imageSide: 'left',
    imageFit: 'cover',
    tone: 'cream',
  },

  {
    _key: 'sec-facilities',
    _type: 'venueListSection',
    heading: D(
      'TIỆN ÍCH TRONG KHUÔN VIÊN',
      'ON-SITE FACILITIES',
      '园区内设施',
      '부지 내 시설',
      '敷地内の施設',
      'สิ่งอำนวยความสะดวกในโรงแรม',
    ),
    filterKind: 'facility',
  },

  {
    _key: 'sec-gym',
    _type: 'imageTextSection',
    eyebrow: D(
      'FITNESS CENTER',
      'FITNESS CENTER',
      '健身中心',
      '피트니스 센터',
      'フィットネスセンター',
      'ฟิตเนสเซ็นเตอร์',
    ),
    heading: D(
      'Phòng tập mở suốt ngày đêm, nhìn ra vịnh',
      'A gym over the bay that never closes',
      '面朝海湾、昼夜不打烊的健身房',
      '하롱베이를 마주한, 문 닫지 않는 헬스장',
      '湾を望む、閉まらないジム',
      'ห้องออกกำลังกายเปิดตลอดวันคืน มองเห็นอ่าว',
    ),
    content: blockD(
      [
        'Phòng tập chiếm trọn một mặt kính của tầng 3. Dàn máy chạy bộ và xe đạp tập quay thẳng ra cửa sổ, nên buổi chạy sáng diễn ra trước mặt vịnh chứ không trước một bức tường.',
        'Phía trong là khu tạ: giàn squat, ghế đẩy, giá tạ đơn và tường gương chạy dài, đủ cho một buổi tập nặng. Bóng tập để sẵn ở góc phòng.',
        'Phòng mở 24/7 và miễn phí với khách lưu trú — lệch múi giờ hay chuyến bay đêm cũng không làm lỡ buổi tập.',
      ],
      [
        'The gym takes the full glazed side of the third floor. The treadmills and bikes face the windows, so the morning run happens in front of the bay rather than a wall.',
        'Further in is the weights area: a squat rack, a bench, dumbbell racks and a long mirrored wall — enough for a heavy session. Stability balls wait in the corner.',
        'It is open 24/7 and free for in-house guests, so jet lag or a night flight need not cost you a session.',
      ],
      [
        '健身房占据三楼整面玻璃立面。跑步机与健身单车一律正对窗外，清晨的跑步于是面向海湾，而非面壁。',
        '再往里是力量区：深蹲架、卧推凳、哑铃架与一整面长镜，足以应付一场大重量训练。健身球就放在房间角落。',
        '健身房 24/7 开放，住客免费使用——时差或红眼航班，都不至于让训练落空。',
      ],
      [
        '피트니스 센터는 3층 유리면을 통째로 차지합니다. 러닝머신과 실내 자전거가 모두 창을 향해 놓여 있어, 아침 달리기는 벽이 아니라 하롱베이를 마주한 채 이어집니다.',
        '안쪽은 웨이트 구역입니다. 스쿼트 랙과 벤치, 덤벨 랙, 길게 이어지는 거울 벽까지 갖춰 고중량 훈련도 무리가 없습니다. 짐볼은 방 한쪽 구석에 놓여 있습니다.',
        '24시간 문을 닫지 않고 투숙객은 무료입니다. 시차나 야간 항공편 때문에 운동을 거를 일은 없습니다.',
      ],
      [
        'ジムは3階のガラス面をひと続きに使っています。ランニングマシンとエアロバイクはすべて窓に向いており、朝のランは壁ではなく湾を前に進みます。',
        '奥はウエイトエリアです。スクワットラック、ベンチ、ダンベルラック、そして長く続く鏡張りの壁があり、高重量のトレーニングにも十分です。バランスボールは部屋の隅に置いてあります。',
        '24時間年中無休で、ご宿泊のお客様は無料です。時差や夜行便でトレーニングを逃すことはありません。',
      ],
      [
        'ห้องออกกำลังกายกินพื้นที่ผนังกระจกทั้งด้านของชั้น 3 ลู่วิ่งและจักรยานออกกำลังกายทุกเครื่องหันออกหน้าต่าง การวิ่งตอนเช้าจึงเกิดขึ้นตรงหน้าอ่าว ไม่ใช่ตรงหน้ากำแพง',
        'ลึกเข้าไปเป็นโซนเวท มีแร็กสควอท ม้านั่งยกเวท ชั้นวางดัมเบล และผนังกระจกเงายาว เพียงพอสำหรับการเล่นหนัก ลูกบอลโยคะวางเตรียมไว้ที่มุมห้อง',
        'เปิด 24/7 และผู้เข้าพักใช้บริการได้ฟรี เจ็ตแล็กหรือไฟลต์ดึกจึงไม่ทำให้พลาดการออกกำลังกาย',
      ],
    ),
    image: figD(
      'Royal-Ha-Long-GYM-04.jpg',
      'Một người khách chạy trên máy chạy bộ ở giữa ba máy đặt quay ra dãy cửa sổ kính cao nhìn xuống vịnh',
      'A guest running on the middle of three treadmills set facing tall windows over the bay',
      '一位客人在三台跑步机中间那台上跑步，跑步机正对可俯瞰海湾的高大玻璃窗',
      '하롱베이가 내려다보이는 큰 유리창을 향해 놓인 러닝머신 세 대 가운데에서 한 손님이 달리고 있습니다',
      '湾を見下ろす高いガラス窓に向けて並ぶ3台のランニングマシンのうち、中央で走る1人のお客様',
      'แขกคนหนึ่งกำลังวิ่งบนลู่วิ่งตัวกลางจากสามตัวที่หันเข้าหาหน้าต่างกระจกสูงซึ่งมองลงไปเห็นอ่าว',
    ),
    imageSide: 'right',
    imageFit: 'cover',
    tone: 'cream',
  },

  {
    _key: 'sec-spa',
    _type: 'imageTextSection',
    eyebrow: D('RENATA SPA', 'RENATA SPA', 'RENATA SPA', 'RENATA SPA', 'RENATA SPA', 'RENATA SPA'),
    heading: D(
      'Một giờ chậm ở Renata Spa',
      'A slow hour at Renata Spa',
      'Renata Spa 的慢时光',
      'Renata Spa에서 보내는 느린 한 시간',
      'Renata Spa で過ごすゆるやかな一時間',
      'หนึ่งชั่วโมงที่เนิบช้าใน Renata Spa',
    ),
    content: blockD(
      [
        'Renata Spa nằm cùng tầng với phòng tập. Lối vào là quầy lễ tân đá sáng trước tường ốp gỗ sẫm, cây xanh trồng chậu hai bên và kệ bày những lọ gốm men xanh — đủ tối và đủ tĩnh để hạ nhịp ngay khi bước qua cửa.',
        'Phòng trị liệu có cả loại một giường và loại hai giường kê song song cho khách đi cùng nhau. Khăn trắng gấp sẵn và hoa tươi đặt trên mỗi giường trước từng lượt khách.',
        'Spa mở 24/7, nên một buổi trị liệu muộn sau chặng đường dài vẫn đặt được.',
      ],
      [
        'Renata Spa shares the third floor with the gym. You arrive at a pale stone desk set against dark wood panelling, plants on either side and shelves of green-glazed bottles — dim enough and quiet enough to slow you down at the door.',
        'Treatment rooms come as singles and as twins with two beds side by side for guests travelling together. Folded white towels and fresh flowers are laid on each bed before every guest.',
        'The spa runs 24/7, so a late treatment after a long journey is still possible.',
      ],
      [
        'Renata Spa 与健身房同在三楼。入口是一方浅色石材前台，背靠深色木饰面墙，两侧摆放盆栽，架上陈列着青釉陶瓶——光线与声响都收得恰到好处，跨进门便自然放慢了节奏。',
        '理疗房分单床与双床两种，双床并排摆放，便于结伴同行的宾客。每位客人到来之前，床上都会备好叠放的白毛巾与鲜花。',
        '水疗中心 24/7 开放，长途跋涉后想在深夜做一次理疗，也能如愿预约。',
      ],
      [
        'Renata Spa는 피트니스 센터와 같은 층에 있습니다. 들어서면 짙은 원목 벽을 등진 밝은 석재 리셉션이 맞이하고, 양옆에는 화분이, 선반에는 청자빛 도자기 병이 놓여 있습니다. 문을 지나는 순간 속도가 느려질 만큼 어둑하고 조용합니다.',
        '트리트먼트 룸은 1인용과, 베드 두 개를 나란히 둔 2인용이 있어 동행이 있는 분도 함께 이용하실 수 있습니다. 손님을 맞기 전마다 개어 둔 흰 수건과 생화를 각 베드에 올려 둡니다.',
        '스파는 24/7 운영하므로, 긴 여정을 마친 뒤 늦은 시간의 트리트먼트도 예약하실 수 있습니다.',
      ],
      [
        'Renata Spa はジムと同じ3階にあります。入口には濃い色の木壁を背にした淡い石材のレセプションがあり、両脇に鉢植え、棚には緑釉の陶器の瓶が並びます。扉をくぐった瞬間にペースが落ちる、ほどよく暗く静かな空間です。',
        'トリートメントルームは1台のタイプと、ベッドを2台並べたタイプがあり、お連れ様とご一緒にご利用いただけます。お客様をお迎えするたびに、たたんだ白いタオルと生花を各ベッドにご用意します。',
        'スパは24/7営業ですので、長旅のあとの遅い時間のトリートメントもご予約いただけます。',
      ],
      [
        'Renata Spa อยู่ชั้นเดียวกับห้องออกกำลังกาย ทางเข้าเป็นเคาน์เตอร์ต้อนรับหินสีอ่อนตั้งอยู่หน้าผนังบุไม้สีเข้ม มีต้นไม้กระถางขนาบสองข้างและชั้นวางขวดเซรามิกเคลือบเขียว แสงและเสียงถูกคุมไว้พอดีจนจังหวะช้าลงทันทีที่ก้าวเข้ามา',
        'ห้องทรีตเมนต์มีทั้งแบบเตียงเดี่ยวและแบบสองเตียงวางเรียงข้างกันสำหรับผู้ที่มาด้วยกัน ก่อนรับแขกแต่ละรอบ จะจัดผ้าขนหนูสีขาวพับไว้และดอกไม้สดวางบนทุกเตียง',
        'สปาเปิด 24/7 จึงจองทรีตเมนต์รอบดึกหลังเดินทางไกลได้',
      ],
    ),
    image: figD(
      'Royal-Halong-Hotel-Spa-02.jpg',
      'Phòng trị liệu hai giường gỗ kê song song, khăn trắng gấp sẵn và hoa lan đặt trên mỗi giường, tranh hoa súng treo trên tường',
      'A twin treatment room with two wooden beds side by side, folded white towels and orchids on each, a water-lily painting on the wall',
      '双床理疗房内两张木床并排摆放，每张床上叠放着白毛巾并点缀兰花，墙上挂着一幅睡莲画',
      '나무 베드 두 개가 나란히 놓인 2인 트리트먼트 룸, 각 베드에 흰 수건이 개어져 있고 난꽃이 놓여 있으며 벽에는 수련 그림이 걸려 있습니다',
      '木製のベッドを2台並べたツインのトリートメントルーム。各ベッドに白いタオルがたたまれ、蘭の花が置かれ、壁には睡蓮の絵が掛かっています',
      'ห้องทรีตเมนต์เตียงคู่ เตียงไม้สองเตียงวางเรียงข้างกัน มีผ้าขนหนูสีขาวพับไว้และดอกกล้วยไม้วางบนแต่ละเตียง ผนังแขวนภาพดอกบัว',
    ),
    imageSide: 'left',
    imageFit: 'cover',
    tone: 'white',
  },

  {
    _key: 'sec-indoor-pool',
    _type: 'imageTextSection',
    eyebrow: D(
      'BỂ BƠI TRONG NHÀ',
      'INDOOR SWIMMING POOL',
      '室内泳池',
      '실내 수영장',
      '屋内プール',
      'สระว่ายน้ำในร่ม',
    ),
    heading: D(
      'Bể trong nhà, bơi được cả bốn mùa',
      'An indoor pool for all four seasons',
      '室内泳池，四季常泳',
      '사계절 내내 열려 있는 실내 수영장',
      '四季を通じて泳げる屋内プール',
      'สระในร่ม ว่ายได้ทั้งสี่ฤดู',
    ),
    content: blockD(
      [
        'Bể nằm dưới một mái lấy sáng: ban ngày nắng rọi thẳng xuống mặt nước qua các ô kính trần, không cần bật đèn.',
        'Nước luôn được giữ ở nhiệt độ phù hợp với thân nhiệt, nên tháng Giêng hay tháng Bảy thì buổi bơi cũng như nhau. Đầu nông có bậc lên xuống với tay vịn inox.',
        'Dọc bờ bể là bàn mây và ghế tựa — chỗ để gọi đồ ăn, đồ uống và ngồi lại sau khi bơi.',
      ],
      [
        'The pool sits under a glazed roof: by day the light falls straight onto the water and nothing needs switching on.',
        'The water is held at a temperature matched to the body, so a swim in January is the same as a swim in July. At the shallow end there are steps with a stainless handrail.',
        'Rattan tables and chairs line the deck — somewhere to order food and drinks and to stay a while after swimming.',
      ],
      [
        '泳池置于采光屋顶之下：白天阳光透过天窗直落水面，无需开灯。',
        '池水始终维持在贴近体温的温度，一月与七月的下水体验并无二致。浅水端设有带不锈钢扶手的阶梯。',
        '池畔一线是藤编桌椅——可在此点选餐食饮品，游罢坐下歇息。',
      ],
      [
        '수영장은 채광 지붕 아래에 있습니다. 낮에는 천창을 통해 햇빛이 수면에 곧장 내려앉아 조명을 켤 일이 없습니다.',
        '수온은 늘 체온에 맞춰 유지되므로 1월이든 7월이든 같은 감각으로 수영하실 수 있습니다. 얕은 쪽에는 스테인리스 손잡이가 달린 계단이 있습니다.',
        '풀 사이드에는 라탄 테이블과 의자가 늘어서 있습니다. 음식과 음료를 주문하고, 수영을 마친 뒤 앉아 쉬어 가기 좋은 자리입니다.',
      ],
      [
        'プールは採光屋根の下にあります。日中は天窓から日差しが水面に直に落ち、照明をつける必要がありません。',
        '水温は常に体温に近い温度に保たれており、1月でも7月でも同じように泳げます。浅い側にはステンレスの手すり付きのステップがあります。',
        'プールサイドにはラタンのテーブルと椅子が並びます。お食事やお飲み物を注文し、泳いだあとに腰を下ろせる場所です。',
      ],
      [
        'สระอยู่ใต้หลังคารับแสง กลางวันแดดส่องผ่านช่องกระจกบนเพดานลงมาที่ผิวน้ำโดยตรง จึงไม่ต้องเปิดไฟ',
        'น้ำในสระคุมอุณหภูมิให้ใกล้เคียงอุณหภูมิร่างกายเสมอ เดือนมกราคมหรือกรกฎาคมจึงว่ายได้เหมือนกัน ฝั่งน้ำตื้นมีบันไดพร้อมราวจับสเตนเลส',
        'ริมสระเรียงด้วยโต๊ะและเก้าอี้หวาย เป็นที่สั่งอาหารและเครื่องดื่ม และนั่งพักหลังว่ายน้ำ',
      ],
    ),
    image: figD(
      'Royal-Halong-Hotel-four-season-swimming-pool-02.jpg',
      'Bàn mây tròn và ghế tựa kê thành từng cụm dọc bờ bể bơi trong nhà, trần giật cấp phía trên',
      'Round rattan tables and chairs set in groups along the indoor poolside, a stepped ceiling above',
      '圆形藤编桌椅成组摆放在室内泳池畔，头顶是层层跌级的吊顶',
      '실내 수영장 가장자리를 따라 라탄 원형 테이블과 의자가 무리 지어 놓여 있고, 위로는 단을 이룬 천장이 보입니다',
      '屋内プールサイドに沿って円形のラタンテーブルと椅子がいくつかのまとまりで置かれ、上には段状の天井が広がります',
      'โต๊ะหวายทรงกลมและเก้าอี้จัดเป็นกลุ่มตามแนวริมสระในร่ม ด้านบนเป็นฝ้าเพดานแบบลดระดับ',
    ),
    imageSide: 'right',
    imageFit: 'cover',
    tone: 'cream',
    cta: linkD(
      'page.culinary',
      'XEM ẨM THỰC',
      'SEE DINING',
      '查看餐饮',
      '다이닝 보기',
      'ダイニングを見る',
      'ดูร้านอาหาร',
    ),
  },

  {
    _key: 'sec-outdoor-pool',
    _type: 'imageTextSection',
    eyebrow: D(
      'BỂ BƠI NGOÀI TRỜI',
      'OUTDOOR SWIMMING POOL',
      '室外泳池',
      '야외 수영장',
      '屋外プール',
      'สระว่ายน้ำกลางแจ้ง',
    ),
    heading: D(
      'Bể bơi ngoài trời tại Royal Villas',
      'The outdoor pool at Royal Villas',
      'Royal Villas 的室外泳池',
      'Royal Villas의 야외 수영장',
      'Royal Villas の屋外プール',
      'สระว่ายน้ำกลางแจ้งที่ Royal Villas',
    ),
    content: blockD(
      [
        'Bể nằm trong khuôn viên Royal Villas, giữa hàng cọ cao và dãy lan can trắng, trước mặt là toà villa ba tầng sơn trắng.',
        'Ban ngày đây là chỗ tắm nắng: ghế nằm và ô che dựng dọc bờ bể. Cuối ngày, mặt nước hứng trọn ánh hoàng hôn của thành phố.',
        'Khi trời tối, khoảng sân quanh bể trở thành nơi tổ chức tiệc đêm và lễ cưới ngoài trời. Bể mở từ 5:00 đến 22:00 hằng ngày.',
      ],
      [
        'The pool lies in the grounds of Royal Villas, between tall palms and a white balustrade, with a three-storey white villa in front of it.',
        'By day it is a place to lie in the sun: loungers and parasols stand along the edge. Late in the afternoon the water takes the whole of the city’s sunset.',
        'After dark the terrace around it becomes a venue for night parties and outdoor weddings. The pool opens from 5:00 to 22:00 daily.',
      ],
      [
        '泳池位于 Royal Villas 园区，两侧是高大的棕榈与白色栏杆，正前方是一栋三层白色别墅。',
        '白天这里是晒太阳的去处：躺椅与遮阳伞沿池畔排开。傍晚时分，水面映满城市的落日。',
        '入夜之后，池畔场地便成为夜间派对与户外婚礼的举办地。泳池每日 5:00 至 22:00 开放。',
      ],
      [
        '수영장은 Royal Villas 부지 안, 키 큰 야자수와 흰 난간 사이에 있으며 앞으로는 3층 높이의 흰 빌라가 서 있습니다.',
        '낮에는 일광욕을 즐기는 자리입니다. 선베드와 파라솔이 물가를 따라 늘어섭니다. 하루가 저물 무렵이면 수면 가득 도시의 노을이 담깁니다.',
        '밤이 되면 수영장을 둘러싼 테라스는 나이트 파티와 야외 웨딩이 열리는 자리로 바뀝니다. 수영장은 매일 5:00부터 22:00까지 운영합니다.',
      ],
      [
        'プールは Royal Villas の敷地内、背の高いヤシの木と白い手すりの間にあり、正面には3階建ての白いヴィラが建っています。',
        '日中は日光浴の場になります。サンラウンジャーとパラソルが水辺に沿って並びます。一日の終わりには、水面が街の夕日を映し込みます。',
        '夜になると、プールを囲むテラスはナイトパーティーや屋外ウエディングの会場になります。プールは毎日5:00から22:00まで開いています。',
      ],
      [
        'สระตั้งอยู่ในพื้นที่ของ Royal Villas ท่ามกลางแนวต้นปาล์มสูงและราวระเบียงสีขาว ด้านหน้าเป็นวิลลาสีขาวสามชั้น',
        'กลางวันที่นี่คือมุมอาบแดด มีเตียงนอนและร่มกางเรียงตามริมสระ พอถึงปลายวัน ผิวน้ำจะรับแสงอาทิตย์ตกของเมืองไว้เต็มผืน',
        'เมื่อค่ำลง ลานรอบสระจะกลายเป็นที่จัดปาร์ตี้ยามค่ำคืนและงานแต่งงานกลางแจ้ง สระเปิดทุกวันตั้งแต่ 5:00 ถึง 22:00',
      ],
    ),
    image: figD(
      '294085727_1133921623854310_4298130230198940685_n.jpeg',
      'Một người khách mặc đồ bơi đen ngồi bên thành bể bơi ngoài trời, ba cây cọ cao và lan can trắng phía sau',
      'A guest in a black swimsuit sitting on the edge of the outdoor pool, three tall palms and a white balustrade behind',
      '一位身着黑色泳衣的客人坐在室外泳池边缘，身后是三棵高大棕榈与白色栏杆',
      '검은 수영복을 입은 손님이 야외 수영장 가장자리에 앉아 있고, 뒤로 키 큰 야자수 세 그루와 흰 난간이 보입니다',
      '黒い水着のお客様が屋外プールの縁に腰かけています。背後には背の高いヤシの木が3本と白い手すりがあります',
      'แขกในชุดว่ายน้ำสีดำนั่งอยู่ริมขอบสระกลางแจ้ง ด้านหลังเป็นต้นปาล์มสูงสามต้นและราวระเบียงสีขาว',
    ),
    imageSide: 'left',
    imageFit: 'cover',
    tone: 'white',
    cta: linkD(
      'page.luu-tru-phong-khach-san-villas',
      'XEM ROYAL VILLAS',
      'SEE ROYAL VILLAS',
      '查看 Royal Villas',
      'Royal Villas 보기',
      'Royal Villas を見る',
      'ดู Royal Villas',
    ),
  },

  {
    // Đúng hai thẻ — bản clone chỉ dẫn tiếp tới hai nơi này ở cuối trang
    // (`../wedding/index.html` và
    // `../royal-international-convention-palace/index.html`). Không thêm
    // "hoạt động quanh vịnh" nào khác: bản clone không có, và bịa ra một tour
    // du thuyền không tồn tại thì tệ hơn là để trống.
    _key: 'sec-nearby',
    _type: 'cardGridSection',
    heading: D('TIẾP TỤC KHÁM PHÁ', 'CONTINUE EXPLORING', '继续探索', '계속 둘러보기', 'さらに見る', 'สำรวจต่อ'),
    subheading: D(
      'Hai không gian khác trong khuôn viên Royal Hạ Long',
      'Two more spaces in the Royal Ha Long grounds',
      'Royal Ha Long 园区内的另外两处空间',
      'Royal Ha Long 부지 안의 또 다른 두 공간',
      'Royal Ha Long の敷地内にある、もう二つの空間',
      'อีกสองพื้นที่ในบริเวณ Royal Ha Long',
    ),
    columns: 2,
    cards: [
      {
        _key: 'card-wedding',
        _type: 'card',
        title: D('TIỆC CƯỚI', 'WEDDINGS', '婚礼', '웨딩', 'ウエディング', 'งานแต่งงาน'),
        description: D(
          'Trao lời yêu thương với một nửa của bạn tại Cung Hội nghị Quốc tế Hoàng Gia.',
          'Say your vows to the one beside you at the Royal International Convention Palace.',
          '在皇家国际会议宫，向身旁的那个人许下诺言。',
          '로열 인터내셔널 컨벤션 팰리스에서 곁에 선 사람에게 사랑의 약속을 건네십시오.',
          'ロイヤル国際コンベンションパレスで、隣にいる人へ愛の言葉を。',
          'กล่าวคำรักกับคนข้างกายที่รอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ',
        ),
        image: figD(
          'Royal-Ha-Long-Gallery-Wedding-12.jpg',
          'Cô dâu và chú rể đứng dưới cổng hoa trắng ngoài trời, người dẫn chương trình mặc váy hồng cầm micro bên cạnh',
          'A bride and groom standing under an outdoor arch of white flowers, a host in a pink dress holding a microphone beside them',
          '新郎新娘站在户外的白色花门下，身旁是身穿粉色礼服、手持麦克风的司仪',
          '신랑과 신부가 야외의 흰 꽃 아치 아래 서 있고, 옆에는 분홍 드레스를 입은 사회자가 마이크를 들고 있습니다',
          '屋外の白い花のアーチの下に立つ新郎新婦。傍らにはピンクのドレスでマイクを持つ司会者がいます',
          'เจ้าบ่าวและเจ้าสาวยืนอยู่ใต้ซุ้มดอกไม้สีขาวกลางแจ้ง ข้าง ๆ เป็นพิธีกรในชุดสีชมพูถือไมโครโฟน',
        ),
        cta: linkD('page.wedding', 'XEM THÊM', 'FIND OUT MORE', '了解更多', '더 알아보기', '詳しく見る', 'อ่านเพิ่มเติม'),
      },
      {
        _key: 'card-convention',
        _type: 'card',
        // Dạng zh/ko/ja/th lấy đúng `navigation` — xem chú thích đầu file.
        title: D(
          'CUNG HỘI NGHỊ QUỐC TẾ HOÀNG GIA HẠ LONG',
          'ROYAL INTERNATIONAL CONVENTION PALACE',
          '皇家国际会议宫',
          '로열 인터내셔널 컨벤션 팰리스',
          'ロイヤル国際コンベンションパレス',
          'รอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ',
        ),
        description: D(
          'Sảnh tiệc và phòng hội nghị ngay trong khuôn viên, dùng cho cả hội họp lẫn tiệc lớn.',
          // `CardGridSection` cắt mô tả ở `line-clamp-2`. Bản `en` cũ
          // ("…within the same grounds, for conferences and large banquets
          // alike.") tràn sang dòng thứ ba và bị cắt cụt ở 390 và 768px —
          // đo bằng trình duyệt, năm ngôn ngữ kia vừa đúng hai dòng.
          'Ballrooms and meeting rooms in the same grounds, for conferences and banquets.',
          '园区内的宴会厅与会议室，既可用于会议，也可承办大型宴席。',
          '같은 부지 안의 연회장과 회의실로, 회의와 대형 연회 모두 소화합니다.',
          '同じ敷地内の宴会場と会議室。会議にも大規模な宴席にもお使いいただけます。',
          'ห้องจัดเลี้ยงและห้องประชุมในบริเวณเดียวกัน รองรับทั้งการประชุมและงานเลี้ยงขนาดใหญ่',
        ),
        image: figD(
          'ROYAL-INTERNATIONAL-CONVENTION-PALACE2.jpg',
          'Sảnh dài lát đá bóng, đèn chùm pha lê treo dưới trần vẽ mây, tường ốp phào trắng xen ô hoạ tiết vàng',
          'A long hall in polished stone, crystal chandeliers under a painted sky ceiling, white mouldings framing gold-patterned panels',
          '铺着抛光石材的长廊，水晶吊灯悬于绘有云彩的天花之下，白色线脚围出金色纹样的墙板',
          '광택 나는 석재로 마감한 긴 홀, 구름이 그려진 천장 아래 크리스털 샹들리에가 걸려 있고 흰 몰딩이 금빛 무늬 패널을 감싸고 있습니다',
          '磨き上げた石張りの長いホール。雲を描いた天井の下にクリスタルのシャンデリアが下がり、白いモールディングが金色の文様パネルを縁取っています',
          'โถงยาวปูหินขัดเงา โคมระย้าคริสตัลห้อยอยู่ใต้เพดานเขียนลายเมฆ บัวปูนสีขาวล้อมกรอบแผงผนังลายทอง',
        ),
        cta: linkD(
          'page.royal-international-convention-palace',
          'XEM THÊM',
          'FIND OUT MORE',
          '了解更多',
          '더 알아보기',
          '詳しく見る',
          'อ่านเพิ่มเติม',
        ),
      },
    ],
  },

  {
    _key: 'sec-cta',
    _type: 'ctaBandSection',
    heading: D(
      'Đặt phòng để dùng trọn tiện ích',
      'Book a room and the facilities are yours',
      '预订客房，尽享全部设施',
      '객실을 예약하시면 모든 시설을 이용하실 수 있습니다',
      'ご予約いただければ、すべての施設をご利用いただけます',
      'จองห้องพัก แล้วใช้สิ่งอำนวยความสะดวกได้ครบ',
    ),
    description: D(
      'Phòng tập, Renata Spa và hai bể bơi đều nằm trong khuôn viên khách sạn tại Bãi Cháy.',
      'The gym, Renata Spa and both pools sit inside the hotel grounds at Bai Chay.',
      '健身中心、Renata Spa 与两座泳池，皆在拜寨的酒店园区之内。',
      '피트니스 센터와 Renata Spa, 두 곳의 수영장 모두 바이짜이의 호텔 부지 안에 있습니다.',
      'フィットネスセンター、Renata Spa、そして二つのプールは、いずれもバイチャイのホテル敷地内にあります。',
      'ฟิตเนสเซ็นเตอร์ Renata Spa และสระว่ายน้ำทั้งสองแห่ง อยู่ในพื้นที่ของโรงแรมที่บ๊ายจ๋าย',
    ),
    background: figBg('Royal-Halong-Hotel-outdoor-swimming-pool-02.jpg'),
    cta: linkD('page.reservation', 'ĐẶT PHÒNG', 'BOOK NOW', '立即预订', '지금 예약', '今すぐ予約', 'จองเลย'),
  },
]

const PAGE = {
  title: D('TRẢI NGHIỆM', 'EXPERIENCES', '体验', '경험', '体験', 'ประสบการณ์'),
  slug: slug6('experiences'),
  sections: SECTIONS,
  seo: {
    _type: 'seo',
    metaTitle: D('Trải nghiệm', 'Experiences', '体验', '경험', '体験', 'ประสบการณ์'),
    metaDescription: D(
      'Phòng tập nhìn ra vịnh mở 24/7, Renata Spa, bể bơi trong nhà bơi được bốn mùa và bể bơi ngoài trời tại Royal Villas — bốn tiện ích trong khuôn viên Royal Hạ Long Hotel.',
      'A 24/7 gym over the bay, Renata Spa, an indoor pool for all four seasons and an outdoor pool at Royal Villas — four facilities within the grounds of Royal Ha Long Hotel.',
      '24/7 开放、面朝下龙湾的健身中心，Renata Spa，四季可用的室内泳池，以及 Royal Villas 的室外泳池——Royal Ha Long Hotel 园区内的四处设施。',
      '하롱베이를 마주한 24시간 피트니스 센터, Renata Spa, 사계절 이용 가능한 실내 수영장, Royal Villas의 야외 수영장 — Royal Ha Long Hotel 부지 안의 네 가지 시설입니다.',
      'ハロン湾を望む24時間営業のフィットネスセンター、Renata Spa、四季を通じて泳げる屋内プール、そして Royal Villas の屋外プール。Royal Ha Long Hotel 敷地内の四つの施設です。',
      'ฟิตเนสเซ็นเตอร์เปิด 24/7 มองเห็นอ่าวฮาลอง Renata Spa สระว่ายน้ำในร่มที่ว่ายได้ทั้งสี่ฤดู และสระว่ายน้ำกลางแจ้งที่ Royal Villas — สี่สิ่งอำนวยความสะดวกในพื้นที่ Royal Ha Long Hotel',
    ),
    noIndex: false,
  },
}

async function main() {
  await patchDoc('venue.fitness-center', FITNESS)
  await patchDoc('venue.renata-spa', RENATA)
  await patchDoc('venue.be-boi', INDOOR_POOL)
  await patchDoc('venue.outdoor-swimming-pool', OUTDOOR_POOL)
  await patchDoc('page.experiences', PAGE)

  console.log('')
  let holes = 0
  for (const id of [
    'page.experiences',
    'venue.fitness-center',
    'venue.renata-spa',
    'venue.be-boi',
    'venue.outdoor-swimming-pool',
  ]) {
    holes += await assertFullyTranslated(id)
  }

  // Giờ đã đủ sáu ngôn ngữ: còn lỗ nghĩa là có người xoá bản dịch, nên thoát
  // khác 0 để CI/`&&` phía sau dừng lại thay vì im lặng đi tiếp.
  console.log(
    holes === 0
      ? '\n✓ Nhóm D đủ sáu ngôn ngữ ở mọi field.'
      : `\n✗ Còn ${holes} field chưa đủ sáu ngôn ngữ.`,
  )
  process.exit(holes === 0 ? 0 : 1)
}

main()
