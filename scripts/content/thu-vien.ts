/**
 * Nhóm E — Thư viện ảnh.
 *
 * Ghi vào:
 *   - page.our-gallery
 *   - galleryAlbum.khach-san-villas / luu-tru / cung-hoi-nghi / tiec-cuoi /
 *     nhan-vien   (toàn quyền: thứ tự, ảnh, alt)
 *   - galleryAlbum.trang-chu       (CHỈ alt + title/slug — trang chủ đang đọc
 *                                   album này, không đụng vào mảng `images`)
 *
 * Chạy:  npx tsx scripts/content/thu-vien.ts
 * Idempotent: mọi `_key` sinh theo thứ tự cố định từ `resetKeys()`, nên chạy
 * lại nhiều lần cho ra cùng một document.
 */
import { LOCALES, type Locale } from '../../lib/i18n'
import { key, resetKeys, p } from './build'
import { assetIdFor } from './assets'
import { patchDoc, assertFullyTranslated, writeClient } from './write'

// ---------------------------------------------------------------------------
// Helper nội dung — ĐỦ SÁU NGÔN NGỮ, không còn chỗ cho chuỗi rỗng.
//
// Vòng Agent 1 (Dựng) chỉ viết `vi` + `en` và để `zh/ko/ja/th` rỗng có chủ ý.
// Vòng Agent 2 (Dịch) đã điền hết, nên kiểu `Draft` giờ BẮT BUỘC cả sáu: bỏ
// sót một ngôn ngữ ở bất kỳ mục nào là lỗi BIÊN DỊCH (`pnpm typecheck` đỏ),
// bắt được trước cả khi script chạm vào Sanity. Đây là lưới an toàn thay cho
// việc chạy rồi mới đọc danh sách lỗ của `assertFullyTranslated()`.
//
// `draft()` vẫn kiểm lại lúc chạy: chuỗi chỉ toàn khoảng trắng qua được
// TypeScript nhưng `isEmpty()` trong `lib/i18n.ts` vẫn coi là rỗng, và khi đó
// trang `/ja` sẽ lặng lẽ hiện tiếng Anh thay vì tiếng Nhật.
// ---------------------------------------------------------------------------

/** Một chuỗi đa ngữ ở dạng thô: cả sáu ngôn ngữ đều bắt buộc. */
type Draft = { vi: string; en: string; zh: string; ko: string; ja: string; th: string }
type DraftBlock = {
  vi: string[]
  en: string[]
  zh: string[]
  ko: string[]
  ja: string[]
  th: string[]
}

function draft(v: Draft): Record<Locale, string> {
  const out = {} as Record<Locale, string>
  for (const l of LOCALES) {
    const value = v[l]
    if (!value?.trim()) throw new Error(`draft(): thiếu "${l}" cho ${JSON.stringify(v.vi)}`)
    out[l] = value
  }
  return out
}

function draftBlock(v: DraftBlock): Record<Locale, unknown[]> {
  const out = {} as Record<Locale, unknown[]>
  for (const l of LOCALES) {
    const paras = v[l]
    if (!paras?.length) throw new Error(`draftBlock(): thiếu "${l}" cho ${JSON.stringify(v.vi[0])}`)
    out[l] = paras.map((text) => p(text))
  }
  return out
}

/** Slug không cần dịch: album/trang này không có route riêng theo ngôn ngữ,
 * và slug latin dùng chung cho cả sáu giữ URL ổn định (`/ja/our-gallery` vẫn
 * là địa chỉ hợp lệ). Sáu locale cùng một giá trị là CHỦ ĐÍCH. */
function slugAll(current: string) {
  const out: Record<string, unknown> = {}
  for (const l of LOCALES) out[l] = { _type: 'slug', current }
  return out
}

/** `fig()` của build.ts gọi `loc()` -> ném lỗi khi thiếu ngôn ngữ. Bản này
 * nhận `Draft`. Vẫn ném lỗi khi tên file không có trong assets.json. */
function dfig(name: string, alt: Draft) {
  const id = assetIdFor(name)
  if (!id) throw new Error(`dfig(): không có ảnh "${name}" trong scripts/import/out/assets.json`)
  return {
    _type: 'figure',
    _key: key('img'),
    asset: { _type: 'reference', _ref: id },
    alt: draft(alt),
  }
}

function dlinkTo(docId: string, label: Draft) {
  return {
    _type: 'link',
    kind: 'internal',
    reference: { _type: 'reference', _ref: docId },
    label: draft(label),
  }
}

/** Neo cuộn trong trang. `GalleryCarouselSection` đặt `id="album-<slug>"` suy
 * từ `album._id`, và `scroll-margin-top` toàn cục (globals.css) đã chừa chỗ
 * cho header `fixed`. */
function dlinkAnchor(albumId: string, label: Draft) {
  return {
    _type: 'link',
    kind: 'external',
    href: `#album-${albumId.replace('galleryAlbum.', '')}`,
    blank: false,
    label: draft(label),
  }
}

// ---------------------------------------------------------------------------
// ALT — mô tả THỨ CÓ TRONG ẢNH.
//
// Mỗi mô tả dưới đây viết sau khi mở chính file ảnh trong
// `wp-content/uploads/...` ra xem. Vài tên file nói dối: `Royal-Ha-Long-Blue-
// Sea-02.jpg` là PHÒNG HỌP (đã chuyển sang album Cung Hội nghị), còn
// `Royal-Halong-Hotel-piano-bar-01.jpg` là SẢNH LỚN chứ không phải quầy bar.
// Đừng suy alt từ tên file.
// ---------------------------------------------------------------------------

const ALT = {
  // --- khách sạn & khuôn viên ---
  'Royal-Ha-Long-Gallery-Hotel-03.jpg': {
    vi: 'Toà tháp khách sạn sáng đèn lúc chạng vạng, bên phải là dãy cột trắng của cung hội nghị',
    en: 'The hotel tower lit at dusk, the white colonnade of the convention palace to its right',
    zh: '暮色中亮起灯光的酒店主楼，右侧是会议宫的白色列柱',
    ko: '해질 무렵 불을 밝힌 호텔 타워, 오른쪽에 컨벤션 팰리스의 흰 열주',
    ja: '夕暮れにライトアップされたホテルタワー、右手にコンベンションパレスの白い列柱',
    th: 'อาคารโรงแรมเปิดไฟยามพลบค่ำ ด้านขวาเป็นแถวเสาสีขาวของศูนย์ประชุม',
  },
  'Royal-Ha-Long-Gallery-Hotel-06.jpg': {
    vi: 'Toàn cảnh nhìn từ trên cao lúc bình minh: toà tháp trắng nổi giữa tán cây và dãy đồi phía sau',
    en: 'Aerial view at sunrise: the white tower rising above the treetops with hills behind',
    zh: '日出时分的航拍全景：白色主楼立于树冠之上，背后是连绵山丘',
    ko: '일출 무렵 항공 전경: 나무 우듬지 위로 솟은 흰색 타워와 그 뒤의 구릉',
    ja: '日の出の空撮：木立の上にそびえる白いタワーと背後の丘陵',
    th: 'ภาพมุมสูงยามอาทิตย์ขึ้น อาคารสีขาวตั้งเด่นเหนือยอดไม้ มีเนินเขาอยู่ด้านหลัง',
  },
  'Royal-Ha-Long-Lobby-01.jpg': {
    vi: 'Nhân viên mở cửa xe cho khách dưới mái đón, mặt tiền toà nhà hắt sáng xanh về đêm',
    en: 'A doorman opening a car door under the porte-cochère, the facade washed in blue light at night',
    zh: '门童在门廊下为客人开启车门，夜色中建筑立面泛着蓝光',
    ko: '현관 캐노피 아래에서 손님의 차 문을 열어 주는 도어맨, 밤에 푸른빛으로 물든 건물 외관',
    ja: '車寄せで客の車のドアを開けるドアマン、青くライトアップされた夜の外観',
    th: 'พนักงานเปิดประตูรถให้แขกใต้ชายคาทางเข้า อาคารด้านหน้าอาบแสงสีน้ำเงินยามค่ำคืน',
  },
  'Royal-Halong-Hotel-piano-bar-01.jpg': {
    vi: 'Sảnh lớn với hai chùm đèn pha lê hình bầu dục và thảm hoa văn đỏ vàng quanh ghế băng giữa sảnh',
    en: 'The main lobby under two oval crystal chandeliers, a red-and-gold patterned rug around the central ottoman',
    zh: '大堂内两盏椭圆形水晶吊灯，中央长凳四周铺着红金图案地毯',
    ko: '타원형 크리스털 샹들리에 두 개가 걸린 로비, 중앙 오토만을 감싼 붉은빛 금색 무늬 카펫',
    ja: '楕円形のクリスタルシャンデリアが二基下がるロビー、中央のオットマンを囲む赤と金の文様の絨毯',
    th: 'ล็อบบี้ใหญ่ใต้โคมระย้าคริสตัลทรงรีสองชุด พรมลายแดงทองล้อมรอบเบาะนั่งกลางห้อง',
  },
  'Royal-Ha-Long-Gallery-Hotel-09.jpg': {
    vi: 'Quầy lễ tân chạy dài trước bức tường ô trám mạ vàng, nhân viên áo cam đứng đón khách',
    en: 'The long reception counters in front of a gold diamond-lattice wall, staff in orange jackets on duty',
    zh: '金色菱格墙前的长条前台，身着橙色制服的员工在迎接宾客',
    ko: '금색 마름모 격자 벽 앞으로 길게 놓인 리셉션 카운터와 주황색 유니폼의 직원들',
    ja: '金色の菱形格子壁の前に伸びるレセプションカウンターと、オレンジの制服で客を迎えるスタッフ',
    th: 'เคาน์เตอร์ต้อนรับทอดยาวหน้าผนังลายข้าวหลามตัดสีทอง พนักงานชุดสีส้มยืนต้อนรับ',
  },
  'Royal-Halong-Hotel-news-header.jpg': {
    vi: 'Đôi khách kéo vali hồng đi qua sảnh, bên cạnh tấm bình phong chạm vàng và rèm màu mận',
    en: 'A couple wheeling a pink suitcase across the lobby, past a gilded screen and plum-coloured drapes',
    zh: '一对旅客拉着粉色行李箱穿过大堂，旁边是鎏金屏风和紫红色帷幔',
    ko: '분홍색 캐리어를 끌고 로비를 지나는 커플, 곁에는 금박 병풍과 자두색 커튼',
    ja: 'ピンクのスーツケースを引いてロビーを横切る二人連れ、傍らに金彩の衝立と梅色のカーテン',
    th: 'คู่แขกลากกระเป๋าเดินทางสีชมพูผ่านล็อบบี้ ข้าง ๆ เป็นฉากกั้นลายทองและผ้าม่านสีบ๊วย',
  },
  'Royal-Halong-Hotel-Gallery-header.jpg': {
    vi: 'Hai khách ngồi bàn sắt trắng trên bãi cỏ trước mặt tiền khách sạn, dù che nắng dựng hai bên',
    en: 'Two guests at a white wrought-iron table on the lawn in front of the hotel, parasols either side',
    zh: '两位客人坐在酒店前草坪的白色铁艺桌旁，两侧撑着遮阳伞',
    ko: '호텔 앞 잔디밭의 흰 주철 테이블에 앉은 두 손님, 양옆에 파라솔',
    ja: 'ホテル前の芝生に置かれた白いアイアンテーブルに座る二人の客、両脇にパラソル',
    th: 'แขกสองท่านนั่งที่โต๊ะเหล็กดัดสีขาวบนสนามหญ้าหน้าโรงแรม มีร่มกันแดดตั้งขนาบสองข้าง',
  },
  'Royal-Ha-Long-Gallery-Hotel-14.jpg': {
    vi: 'Lối gạch đỏ len giữa vườn cọ và cây cổ thụ, dẫn tới dãy nhà màu kem',
    en: 'A brick-red path winding between fan palms and old trees towards the cream-coloured wings',
    zh: '红砖小径穿过蒲葵与老树，通向米色的客房楼',
    ko: '부채야자와 고목 사이로 크림색 별관까지 이어지는 붉은 벽돌길',
    ja: '扇椰子と古木の間を抜け、クリーム色の棟へ続く赤煉瓦の小径',
    th: 'ทางเดินอิฐสีแดงลัดเลาะระหว่างต้นปาล์มพัดและไม้ใหญ่ ไปสู่อาคารสีครีม',
  },
  'Royal-Ha-Long-Gallery-Hotel-12.jpg': {
    vi: 'Căn villa mái ngói đỏ nằm trên thảm cỏ cao, bậc thang gỗ dẫn lên giữa rặng thông',
    en: 'A red-tiled villa set on a raised lawn, timber steps climbing to it through the pines',
    zh: '红瓦别墅坐落在高处草坪上，木质台阶自松林间拾级而上',
    ko: '높은 잔디밭 위에 자리한 붉은 기와 빌라, 소나무 사이로 오르는 나무 계단',
    ja: '高台の芝生に建つ赤瓦のヴィラ、松林の間を上る木の階段',
    th: 'วิลลาหลังคากระเบื้องแดงบนสนามหญ้ายกระดับ บันไดไม้ทอดขึ้นไประหว่างแนวสน',
  },
  'Royal-Ha-Long-Gallery-Hotel-11.jpg': {
    vi: 'Hai khối nhà villa hắt sáng vàng trong đêm xanh, bảng hiệu chữ Hán phát sáng ở lối vào',
    en: 'Two villa blocks washed in warm light at blue hour, an illuminated Chinese-character sign at the drive',
    zh: '蓝调时分暖光映照的两栋别墅楼，入口处的汉字招牌亮着灯',
    ko: '블루아워에 따뜻한 빛으로 물든 빌라 두 동, 진입로에는 불 밝힌 한자 간판',
    ja: 'ブルーアワーに暖色の光をまとうヴィラ二棟、車寄せには漢字の光る看板',
    th: 'อาคารวิลลาสองหลังอาบแสงสีอุ่นในยามฟ้าสีคราม ทางเข้ามีป้ายอักษรจีนเรืองแสง',
  },
  'Royal-Ha-Long-Gallery-Hotel-04.jpg': {
    vi: 'Bể bơi ngoài trời nhìn từ trên cao, hàng cọ hai bên và toà tháp trắng mang bảng hiệu đỏ phía xa',
    en: 'The outdoor pool seen from above, palms lining both sides and the white tower with its red rooftop sign beyond',
    zh: '俯瞰室外泳池，两侧棕榈成列，远处是顶着红色招牌的白色主楼',
    ko: '위에서 내려다본 야외 수영장, 양옆으로 늘어선 야자수와 멀리 붉은 옥상 사인을 단 흰 타워',
    ja: '上から見た屋外プール、両側に並ぶ椰子と、赤い屋上サインを掲げた白いタワー',
    th: 'สระว่ายน้ำกลางแจ้งมองจากมุมสูง มีต้นปาล์มเรียงสองข้าง และอาคารสีขาวพร้อมป้ายสีแดงบนหลังคาอยู่ไกลออกไป',
  },
  'Royal-Ha-Long-Hotel-Overview-01.jpg': {
    vi: 'Bể bơi ngoài trời sát dãy phòng ban công trắng, ghế tắm nắng xếp dưới hàng cọ',
    en: 'The outdoor pool beside the white balconied wing, sun loungers set out under the palms',
    zh: '室外泳池紧邻带白色阳台的客房楼，棕榈树下摆着日光躺椅',
    ko: '흰 발코니 객실동 옆의 야외 수영장, 야자수 아래 놓인 선베드',
    ja: '白いバルコニーの客室棟に隣り合う屋外プール、椰子の木陰に並ぶサンラウンジャー',
    th: 'สระว่ายน้ำกลางแจ้งข้างอาคารห้องพักระเบียงสีขาว มีเตียงอาบแดดวางใต้ต้นปาล์ม',
  },
  'Royal-Ha-Long-Hotel-Overview-03.jpg': {
    vi: 'Toà tháp khách sạn sáng đèn lúc hoàng hôn, nhìn qua công viên cây xanh phía trước',
    en: 'The hotel tower lit at sunset, seen across the park in front of it',
    zh: '日落时分亮灯的酒店主楼，隔着楼前的绿地公园望去',
    ko: '앞쪽 공원 너머로 바라본, 노을에 불을 밝힌 호텔 타워',
    ja: '手前の公園越しに望む、夕日の中で灯をともしたホテルタワー',
    th: 'อาคารโรงแรมเปิดไฟยามอาทิตย์ตก มองผ่านสวนสาธารณะด้านหน้า',
  },
  'Royal-Ha-Long-slider-01.jpg': {
    vi: 'Khách sạn nhìn từ vườn cỏ phía trước, bàn ghế mây và dù che đặt rải rác dưới nắng',
    en: 'The hotel seen from the front lawn, cane tables and parasols set out in the sun',
    zh: '从前草坪望向酒店，藤制桌椅与遮阳伞散布在阳光下',
    ko: '앞뜰 잔디에서 바라본 호텔, 햇살 아래 놓인 라탄 테이블과 파라솔',
    ja: '前庭の芝生から見たホテル、陽射しの下に点在する籐のテーブルとパラソル',
    th: 'โรงแรมมองจากสนามหญ้าด้านหน้า มีโต๊ะหวายและร่มกันแดดตั้งกระจายกลางแดด',
  },
  'Royal-Ha-Long-slider-02.jpg': {
    vi: 'Sảnh chính với chùm đèn pha lê hình bầu dục, thảm hoa văn tròn và rèm nhung màu mận bên dãy cửa sổ',
    en: 'The main lobby beneath an oval crystal chandelier, a round patterned rug and plum velvet drapes along the windows',
    zh: '大堂内的椭圆形水晶吊灯，圆形花纹地毯与窗边的紫红色天鹅绒帷幔',
    ko: '타원형 크리스털 샹들리에 아래의 메인 로비, 원형 무늬 카펫과 창가의 자두색 벨벳 커튼',
    ja: '楕円形のクリスタルシャンデリアの下のメインロビー、円形の文様絨毯と窓辺の梅色ベルベットのカーテン',
    th: 'ล็อบบี้หลักใต้โคมระย้าคริสตัลทรงรี พรมกลมลายวิจิตร และผ้าม่านกำมะหยี่สีบ๊วยริมหน้าต่าง',
  },
  'Royal-Halong-Hotel-four-season-swimming-pool-01.jpg': {
    vi: 'Bể bơi bốn mùa trong nhà lát gạch mosaic xanh ngọc, ánh sáng lọt qua ô cửa mái',
    en: 'The indoor four-season pool tiled in turquoise mosaic, daylight falling through the roof lights',
    zh: '室内四季泳池铺着湖绿色马赛克，天窗透入自然光',
    ko: '청록색 모자이크 타일로 마감한 사계절 실내 수영장, 천창으로 들어오는 자연광',
    ja: 'ターコイズのモザイクタイルで仕上げた屋内フォーシーズンプール、天窓から差す光',
    th: 'สระว่ายน้ำในร่มสี่ฤดูปูโมเสกสีเทอร์ควอยซ์ มีแสงธรรมชาติลอดผ่านช่องแสงบนหลังคา',
  },
  'Royal-Ha-Long-GYM-02.jpg': {
    vi: 'Phòng tập với thảm hoa văn xanh, xe đạp tập và giàn tạ trước bức tường gương',
    en: 'The fitness room: blue patterned carpet, exercise bikes and weight machines facing a mirrored wall',
    zh: '健身房铺蓝色花纹地毯，健身单车与力量器械正对镜面墙',
    ko: '파란 무늬 카펫이 깔린 피트니스룸, 거울 벽을 마주한 실내 자전거와 웨이트 머신',
    ja: '青い文様のカーペットのフィットネスルーム、鏡張りの壁に向かうバイクとウエイトマシン',
    th: 'ห้องออกกำลังกายปูพรมลายสีน้ำเงิน จักรยานออกกำลังกายและเครื่องเล่นน้ำหนักหันเข้าผนังกระจก',
  },
  'LNB03337-2.jpg': {
    vi: 'Đôi khách nắm tay nhau bên ô cửa kính nhìn ra vịnh và bờ biển phía xa',
    en: 'A couple holding hands at the window, the bay and coastline beyond',
    zh: '一对情侣在落地窗前牵手，窗外是海湾与远处的海岸线',
    ko: '창가에서 손을 맞잡은 커플, 창밖으로 만과 멀리 해안선',
    ja: '窓辺で手をつなぐ二人、窓の外には湾と遠くの海岸線',
    th: 'คู่รักจับมือกันริมหน้าต่าง มองเห็นอ่าวและแนวชายฝั่งไกลออกไป',
  },
  'LNB03302-2.jpg': {
    vi: 'Đôi khách đứng trong phòng suite cạnh bộ sofa vàng, bàn thấp đã bày rượu vang',
    en: 'A couple standing in a suite beside the yellow sofas, wine set out on the low table',
    zh: '一对客人站在套房内的黄色沙发旁，矮几上已备好葡萄酒',
    ko: '스위트룸 노란 소파 옆에 선 커플, 낮은 테이블에 차려진 와인',
    ja: 'スイートの黄色いソファの傍らに立つ二人、ローテーブルに用意されたワイン',
    th: 'คู่แขกยืนในห้องสวีทข้างโซฟาสีเหลือง มีไวน์จัดวางบนโต๊ะเตี้ย',
  },
  'Royal-Ha-Long-offer-02.jpg': {
    vi: 'Giường phủ cánh hồng và đôi thiên nga gấp bằng khăn, đôi khách đứng ngắm vịnh qua ô cửa',
    en: 'A bed strewn with rose petals and a pair of towel swans, a couple at the window looking out over the bay',
    zh: '床上撒满玫瑰花瓣并摆着一对毛巾天鹅，一对客人在窗前眺望海湾',
    ko: '장미 꽃잎을 뿌리고 수건 백조 한 쌍을 올린 침대, 창가에서 만을 바라보는 커플',
    ja: '薔薇の花びらを敷き、タオルの白鳥を一対置いたベッド、窓辺で湾を眺める二人',
    th: 'เตียงโรยกลีบกุหลาบพร้อมหงส์ผ้าขนหนูคู่หนึ่ง คู่แขกยืนมองอ่าวที่หน้าต่าง',
  },
  'Royal-Ha-Long-offer-01.jpg': {
    vi: 'Giường bày cánh hồng đỏ và đôi thiên nga gấp khăn, đôi khách đứng bên cửa sổ nhìn ra vịnh',
    en: 'Red rose petals and towel swans across the bed, a couple at the window looking out over the bay',
    zh: '红玫瑰花瓣与毛巾天鹅铺满床面，一对客人站在窗边远眺海湾',
    ko: '붉은 장미 꽃잎과 수건 백조가 놓인 침대, 창가에 서서 만을 바라보는 커플',
    ja: '赤い薔薇の花びらとタオルの白鳥を配したベッド、窓辺に立ち湾を望む二人',
    th: 'กลีบกุหลาบแดงและหงส์ผ้าขนหนูวางเต็มเตียง คู่แขกยืนที่หน้าต่างมองออกไปยังอ่าว',
  },
  'Royal-Halong-Hotel-Model-03.jpg': {
    vi: 'Bé gái cài lan tím nằm cười giữa hai chú voi gấp bằng khăn tắm trên sàn phòng',
    en: 'A girl with an orchid in her hair lying between two towel elephants on the bedroom floor',
    zh: '头戴紫色兰花的小女孩躺在客房地板上，两侧是毛巾折成的大象',
    ko: '머리에 난을 꽂고 객실 바닥에서 수건 코끼리 두 마리 사이에 누워 웃는 여자아이',
    ja: '蘭を髪に挿し、客室の床でタオルの象二頭の間に横たわって笑う女の子',
    th: 'เด็กหญิงประดับดอกกล้วยไม้สีม่วงนอนยิ้มอยู่ระหว่างช้างผ้าขนหนูสองตัวบนพื้นห้องพัก',
  },

  // --- lưu trú ---
  'Royal-Halong-Hotel-Deluxe-04.jpg': {
    vi: 'Phòng Deluxe hai giường đơn, bàn làm việc dài trước gương và bàn trà tròn bày hoa quả',
    en: 'A Deluxe twin room: a long desk beneath the mirror and a round table set with fruit',
    zh: '豪华双床房：镜前的长书桌与摆放水果的圆形茶几',
    ko: '디럭스 트윈룸: 거울 아래 긴 책상과 과일을 올린 원형 테이블',
    ja: 'デラックスツイン：鏡の下の長いデスクと、果物を置いた丸テーブル',
    th: 'ห้องดีลักซ์เตียงคู่ โต๊ะทำงานยาวใต้กระจก และโต๊ะกลมวางผลไม้',
  },
  'Royal-Halong-Hotel-Deluxe-07.jpg': {
    vi: 'Phòng Deluxe giường đôi, đầu giường ốp nan kem, cửa sổ nhìn ra vịnh và ghế bành vàng bên góc',
    en: 'A Deluxe double: a slatted cream headboard, a window over the bay and a yellow armchair in the corner',
    zh: '豪华大床房：米色板条床头、可望海湾的窗户与角落的黄色扶手椅',
    ko: '디럭스 더블룸: 크림색 살대 헤드보드, 만이 보이는 창, 모서리의 노란 안락의자',
    ja: 'デラックスダブル：クリーム色の格子ヘッドボード、湾を望む窓、隅の黄色いアームチェア',
    th: 'ห้องดีลักซ์เตียงใหญ่ หัวเตียงระแนงสีครีม หน้าต่างมองเห็นอ่าว และเก้าอี้นวมสีเหลืองที่มุมห้อง',
  },
  'Royal-Halong-Hotel-Premiun-01.jpg': {
    vi: 'Phòng Premium hai giường với gối thêu chữ R, đầu giường ốp nan kem và cửa sổ nhìn ra vườn cây',
    en: 'A Premium twin with R-monogrammed cushions, slatted cream headboards and a window onto the greenery',
    zh: '高级双床房：绣有字母 R 的抱枕、米色板条床头与望向绿树的窗',
    ko: 'R 이니셜 쿠션을 둔 프리미엄 트윈룸, 크림색 살대 헤드보드와 녹음이 보이는 창',
    ja: 'R の刺繍クッションを置いたプレミアムツイン、クリーム色の格子ヘッドボードと緑を望む窓',
    th: 'ห้องพรีเมียมเตียงคู่ หมอนอิงปักอักษร R หัวเตียงระแนงสีครีม และหน้าต่างมองเห็นต้นไม้',
  },
  'Royal-Halong-Hotel-Deluxe-09.jpg': {
    vi: 'Góc tiếp khách trong phòng với sofa vàng ba chỗ và bàn trà tròn, giường trải dải cam nằm phía sau',
    en: 'A sitting corner with a three-seat yellow sofa and round tables, the bed with its orange runner behind',
    zh: '房内会客角落：三人座黄色沙发与圆形茶几，身后是铺着橙色床旗的床',
    ko: '객실 내 응접 코너: 3인용 노란 소파와 원형 테이블, 뒤로는 주황색 러너를 덮은 침대',
    ja: '客室内の応接コーナー：三人掛けの黄色いソファと丸テーブル、奥にオレンジのランナーを掛けたベッド',
    th: 'มุมนั่งเล่นในห้องพัก โซฟาสีเหลืองสามที่นั่งกับโต๊ะกลม ด้านหลังเป็นเตียงคาดผ้าสีส้ม',
  },
  'Royal-Halong-Hotel-Premiun-02.jpg': {
    vi: 'Phòng Premium hai giường trải dải cam, TV đặt trên tủ dài và cửa sổ nhìn ra vòm cây',
    en: 'A Premium twin with orange bed runners, the television on a long cabinet and a window onto the trees',
    zh: '高级双床房：橙色床旗、长柜上的电视与望向树冠的窗',
    ko: '주황색 침대 러너를 두른 프리미엄 트윈룸, 긴 수납장 위의 TV와 나무가 보이는 창',
    ja: 'オレンジのベッドランナーを掛けたプレミアムツイン、長いキャビネット上のテレビと木立を望む窓',
    th: 'ห้องพรีเมียมเตียงคู่คาดผ้าสีส้ม โทรทัศน์วางบนตู้ยาว และหน้าต่างมองเห็นแมกไม้',
  },
  'Royal-Halong-Hotel-Suite-02.jpg': {
    vi: 'Giường phòng Suite bày trái tim cánh hồng và đôi thiên nga gấp khăn, phòng tắm mở thông bên trái',
    en: 'A Suite bed dressed with a heart of rose petals and towel swans, the bathroom opening to the left',
    zh: '套房床上以玫瑰花瓣摆出心形并配毛巾天鹅，左侧是通透的浴室',
    ko: '장미 꽃잎으로 하트를 만들고 수건 백조를 올린 스위트룸 침대, 왼쪽으로 열린 욕실',
    ja: '薔薇の花びらでハートを描き、タオルの白鳥を添えたスイートのベッド、左手に続くバスルーム',
    th: 'เตียงห้องสวีทจัดกลีบกุหลาบเป็นรูปหัวใจพร้อมหงส์ผ้าขนหนู ด้านซ้ายเปิดออกสู่ห้องน้ำ',
  },
  'Royal-Halong-Hotel-Suite-15.jpg': {
    vi: 'Phòng ngủ Suite mở thông sang phòng khách có sofa vàng, giường bày đôi thiên nga khăn và cánh hồng',
    en: 'A Suite bedroom opening through to the sitting room with its yellow sofas, the bed dressed with towel swans and rose petals',
    zh: '套房卧室与黄色沙发的客厅相通，床上摆着毛巾天鹅与玫瑰花瓣',
    ko: '노란 소파의 거실과 이어지는 스위트룸 침실, 침대에는 수건 백조와 장미 꽃잎',
    ja: '黄色いソファのリビングへ続くスイートの寝室、ベッドにはタオルの白鳥と薔薇の花びら',
    th: 'ห้องนอนสวีทเปิดทะลุถึงห้องนั่งเล่นโซฟาสีเหลือง บนเตียงมีหงส์ผ้าขนหนูและกลีบกุหลาบ',
  },
  'Royal-Halong-Hotel-Suite-03.jpg': {
    vi: 'Phòng khách Suite với sofa vàng, bàn kính đen bày rượu vang và hoa quả, cửa sổ nhìn ra vịnh',
    en: 'The Suite sitting room: yellow sofas, a black glass table set with wine and fruit, and a window over the bay',
    zh: '套房客厅：黄色沙发、摆着葡萄酒与水果的黑色玻璃茶几，窗外是海湾',
    ko: '스위트룸 거실: 노란 소파, 와인과 과일을 올린 검은 유리 테이블, 만이 보이는 창',
    ja: 'スイートのリビング：黄色いソファ、ワインと果物を並べた黒いガラステーブル、湾を望む窓',
    th: 'ห้องนั่งเล่นสวีท โซฟาสีเหลือง โต๊ะกระจกสีดำวางไวน์และผลไม้ และหน้าต่างมองเห็นอ่าว',
  },
  'Royal-Halong-Hotel-Suite-11.jpg': {
    vi: 'Phòng khách Suite có tường gương nhân đôi bộ sofa vàng, đèn thả hình trống và lối dẫn vào phòng ngủ',
    en: 'A Suite sitting room where a mirrored wall doubles the yellow sofas, drum pendants overhead and a corridor to the bedroom',
    zh: '套房客厅的镜面墙映出成双的黄色沙发，鼓形吊灯下是通往卧室的过道',
    ko: '거울 벽이 노란 소파를 두 배로 비추는 스위트룸 거실, 드럼형 펜던트 조명과 침실로 이어지는 복도',
    ja: '鏡の壁が黄色いソファを二重に映すスイートのリビング、ドラム型ペンダント照明と寝室へ続く廊下',
    th: 'ห้องนั่งเล่นสวีทที่ผนังกระจกสะท้อนโซฟาสีเหลืองเป็นสองเท่า โคมทรงกลองเหนือศีรษะ และทางเดินสู่ห้องนอน',
  },
  'Royal-Halong-Hotel-Suite-14.jpg': {
    vi: 'Góc làm việc trong Suite với bàn gỗ, màn hình máy tính và vách trượt mở ra hành lang dẫn vào phòng ngủ',
    en: 'The working corner of a Suite: a timber desk and monitor, the sliding partition open onto the corridor to the bedroom',
    zh: '套房的工作角落：木质书桌与显示器，推拉隔断开向通往卧室的走廊',
    ko: '스위트룸 업무 공간: 원목 책상과 모니터, 침실로 통하는 복도로 열린 미닫이 칸막이',
    ja: 'スイートのワークコーナー：木のデスクとモニター、寝室へ続く廊下に開いた引き戸の間仕切り',
    th: 'มุมทำงานในห้องสวีท โต๊ะไม้พร้อมจอคอมพิวเตอร์ และฉากเลื่อนที่เปิดสู่ทางเดินไปห้องนอน',
  },
  'Royal-Halong-Hotel-Suite-13.jpg': {
    vi: 'Phòng làm việc riêng của Suite với tường kệ gỗ có đèn hắt và bàn viết đặt hoa tươi',
    en: 'The private study of a Suite, one wall lined with lit timber shelving and a writing desk with fresh flowers',
    zh: '套房的独立书房：整面带灯的木质书架，书桌上插着鲜花',
    ko: '스위트룸의 독립 서재, 조명을 넣은 원목 서가 한 면과 생화를 올린 책상',
    ja: 'スイートの専用書斎、照明を仕込んだ木の書棚の壁と、生花を飾ったライティングデスク',
    th: 'ห้องทำงานส่วนตัวในสวีท ผนังหนึ่งด้านเป็นชั้นไม้พร้อมไฟส่อง และโต๊ะเขียนหนังสือประดับดอกไม้สด',
  },
  'Royal-Halong-Hotel-Suite-05.jpg': {
    vi: 'Phòng tắm Suite với bồn tắm đặt sàn bên ô cửa góc nhìn ra vịnh, buồng tắm kính và bàn đá dài',
    en: 'A Suite bathroom with a freestanding tub at the corner window over the bay, a glass shower cubicle and a long stone vanity',
    zh: '套房浴室：转角窗前的独立浴缸可望海湾，另设玻璃淋浴间与长条石台盆',
    ko: '만이 보이는 코너 창가의 독립형 욕조, 유리 샤워부스와 긴 석재 세면대를 갖춘 스위트룸 욕실',
    ja: '湾を望むコーナー窓際の独立浴槽、ガラスのシャワーブースと長い石のカウンターを備えたスイートのバスルーム',
    th: 'ห้องน้ำสวีท อ่างอาบน้ำตั้งพื้นริมหน้าต่างมุมที่มองเห็นอ่าว ห้องอาบน้ำกระจก และเคาน์เตอร์หินยาว',
  },
  'Royal-Halong-Hotel-Suite-06.jpg': {
    vi: 'Phòng tắm Suite hai bồn rửa trên tủ gỗ, tường gương và buồng tắm kính, cửa sổ hướng vịnh',
    en: 'A Suite bathroom with twin basins on a timber vanity, mirrored walls, a glass shower and a window facing the bay',
    zh: '套房浴室：木质台面上的双洗手盆、镜面墙、玻璃淋浴间与朝向海湾的窗',
    ko: '원목 세면대의 세면기 두 개, 거울 벽과 유리 샤워부스, 만을 향한 창이 있는 스위트룸 욕실',
    ja: '木のカウンターに並ぶ二つの洗面ボウル、鏡張りの壁とガラスのシャワー、湾に面した窓のスイートバスルーム',
    th: 'ห้องน้ำสวีท อ่างล้างหน้าคู่บนเคาน์เตอร์ไม้ ผนังกระจกเงา ห้องอาบน้ำกระจก และหน้าต่างหันสู่อ่าว',
  },
  'Royal-Halong-Hotel-Suite-01.jpg': {
    vi: 'Phòng khách Suite với sofa vàng quanh bàn kính, dãy cửa kính lớn nhìn ra vịnh',
    en: 'A Suite sitting room of yellow sofas around glass tables, tall windows looking out over the bay',
    zh: '套房客厅：黄色沙发围着玻璃茶几，整排落地窗望向海湾',
    ko: '유리 테이블을 둘러싼 노란 소파와 만을 향한 큰 창의 스위트룸 거실',
    ja: 'ガラステーブルを囲む黄色いソファと、湾を望む大きな窓のスイートリビング',
    th: 'ห้องนั่งเล่นสวีท โซฟาสีเหลืองล้อมโต๊ะกระจก และหน้าต่างบานสูงมองออกไปยังอ่าว',
  },
  'Royal-Halong-Hotel-Villas-05.jpg': {
    vi: 'Phòng khách villa với bàn console bày lan hồ điệp hồng, bộ sofa kẻ sọc và cửa lùa mở ra hiên',
    en: 'A villa sitting room: a console with a pink orchid, striped sofas and a sliding door to the terrace',
    zh: '别墅客厅：玄关柜上摆着粉色蝴蝶兰，条纹沙发旁的推拉门通向露台',
    ko: '빌라 거실: 콘솔 위 분홍 호접란, 줄무늬 소파, 테라스로 통하는 미닫이문',
    ja: 'ヴィラのリビング：コンソールに飾ったピンクの胡蝶蘭、ストライプのソファ、テラスへ続く引き戸',
    th: 'ห้องนั่งเล่นวิลลา โต๊ะคอนโซลวางกล้วยไม้สีชมพู โซฟาลายทาง และประตูบานเลื่อนออกสู่ระเบียง',
  },
  'Royal-Halong-Hotel-Villas-02.jpg': {
    vi: 'Phòng ngủ villa giường lớn trải dải cam, cửa lùa ra ban công và tủ gỗ kê TV trên thảm hoa văn',
    en: 'A villa bedroom with a king bed under an orange runner, sliding doors to the balcony and a timber cabinet with the television',
    zh: '别墅卧室：铺橙色床旗的大床、通往阳台的推拉门，木柜上摆着电视',
    ko: '주황색 러너를 덮은 킹 침대, 발코니로 나가는 미닫이문, TV를 올린 원목장이 있는 빌라 침실',
    ja: 'オレンジのランナーを掛けたキングベッド、バルコニーへの引き戸、テレビを載せた木のキャビネットのヴィラ寝室',
    th: 'ห้องนอนวิลลา เตียงคิงไซซ์คาดผ้าสีส้ม ประตูบานเลื่อนออกระเบียง และตู้ไม้วางโทรทัศน์',
  },
  'Royal-Halong-Hotel-Villas-08.jpg': {
    vi: 'Hai giường đơn đầu mây vàng trong phòng villa, sàn gỗ và ghế bành hoa văn cam bên cửa sổ',
    en: 'Two single beds with gilt rattan headboards in a villa room, timber floors and a patterned orange armchair by the window',
    zh: '别墅客房内两张单人床配金色藤编床头，木地板与窗边的橙色花纹扶手椅',
    ko: '금빛 라탄 헤드보드의 싱글 침대 두 개, 원목 바닥과 창가의 주황 무늬 안락의자',
    ja: '金色のラタンヘッドボードのシングルベッド二台、木の床と窓辺のオレンジ柄アームチェア',
    th: 'เตียงเดี่ยวสองเตียงหัวเตียงหวายสีทองในห้องวิลลา พื้นไม้ และเก้าอี้นวมลายส้มริมหน้าต่าง',
  },
  'Royal-Halong-Hotel-Villas-10.jpg': {
    vi: 'Phòng villa sàn gỗ với hai giường đơn, bàn ăn bày hoa quả và TV đang hiện logo khách sạn',
    en: 'A villa room with timber floors, two single beds, a table set with fruit and the hotel logo on the television',
    zh: '木地板的别墅客房：两张单人床、摆着水果的餐桌，电视上显示酒店标识',
    ko: '원목 바닥의 빌라 객실, 싱글 침대 두 개, 과일을 차린 테이블, 호텔 로고가 떠 있는 TV',
    ja: '木の床のヴィラ客室、シングルベッド二台、果物を並べたテーブル、ホテルのロゴを映すテレビ',
    th: 'ห้องวิลลาพื้นไม้ เตียงเดี่ยวสองเตียง โต๊ะจัดผลไม้ และโทรทัศน์แสดงโลโก้โรงแรม',
  },
  'Royal-Halong-Hotel-Villas-04.jpg': {
    vi: 'Phòng tắm villa lát gạch xanh rêu và sàn đỏ, bồn sục có rèm, buồng tắm kính và bức gốm hoa sen trên tường',
    en: 'A villa bathroom in moss-green tile with a red floor, a jacuzzi tub, glass shower and a lotus ceramic panel on the wall',
    zh: '别墅浴室铺苔绿色墙砖与红色地面，设按摩浴缸、玻璃淋浴间，墙上嵌荷花陶瓷画',
    ko: '이끼색 타일과 붉은 바닥의 빌라 욕실, 자쿠지 욕조와 유리 샤워부스, 벽에 걸린 연꽃 도자 부조',
    ja: '苔色のタイルと赤い床のヴィラ浴室、ジャグジーとガラスのシャワー、壁には蓮の陶板',
    th: 'ห้องน้ำวิลลาปูกระเบื้องสีเขียวมอสกับพื้นสีแดง อ่างจากุซซี่ ห้องอาบน้ำกระจก และแผ่นเซรามิกลายดอกบัวบนผนัง',
  },
  'Royal-Ha-Long-Villas-room-01.jpg': {
    vi: 'Phòng villa hai giường, rèm vàng mở ra ban công nhìn xuống hàng cọ, TV đang chiếu cảnh vịnh',
    en: 'A villa twin room, gold curtains framing the balcony over the palms, Ha Long Bay on the television',
    zh: '别墅双床房：金色窗帘框住可俯瞰棕榈的阳台，电视里播放着下龙湾风光',
    ko: '빌라 트윈룸, 야자수가 내려다보이는 발코니를 감싼 금색 커튼, TV에는 하롱베이 풍경',
    ja: 'ヴィラのツインルーム、椰子を見下ろすバルコニーを縁取る金色のカーテン、テレビにはハロン湾の景色',
    th: 'ห้องวิลลาเตียงคู่ ผ้าม่านสีทองกรอบระเบียงที่มองลงไปเห็นต้นปาล์ม และจอโทรทัศน์ฉายภาพอ่าวฮาลอง',
  },
  'Royal-Ha-Long-Villas-05.jpg': {
    vi: 'Phòng khách villa với hai bộ sofa kẻ sọc quanh bàn trà gỗ, cửa lùa ra ban công lan can đá',
    en: 'A villa lounge with two striped sofas around a timber coffee table and sliding doors onto a balustraded balcony',
    zh: '别墅起居室：两组条纹沙发围着木质茶几，推拉门通向石栏阳台',
    ko: '원목 테이블을 둘러싼 줄무늬 소파 두 벌과 석재 난간 발코니로 통하는 미닫이문의 빌라 라운지',
    ja: '木のコーヒーテーブルを囲むストライプのソファ二脚と、石の手すりのバルコニーへ続く引き戸のヴィララウンジ',
    th: 'ห้องนั่งเล่นวิลลา โซฟาลายทางสองชุดล้อมโต๊ะกลางไม้ และประตูบานเลื่อนออกสู่ระเบียงราวหิน',
  },
  'Royal-Ha-Long-Villas-04.jpg': {
    vi: 'Phòng tắm villa ốp đá vân kem, bồn sục đặt dưới ô cửa vòm và mặt bàn đá đỏ bên bồn rửa',
    en: 'A villa bathroom clad in cream marble, a jacuzzi tub beneath an arched window and a red granite counter at the basin',
    zh: '别墅浴室以米色大理石铺陈，拱窗下是按摩浴缸，洗手台面为红色花岗岩',
    ko: '크림색 대리석으로 마감한 빌라 욕실, 아치형 창 아래 자쿠지와 붉은 화강암 세면대',
    ja: 'クリーム色の大理石張りのヴィラ浴室、アーチ窓の下のジャグジーと赤い御影石の洗面カウンター',
    th: 'ห้องน้ำวิลลากรุหินอ่อนสีครีม อ่างจากุซซี่ใต้หน้าต่างโค้ง และเคาน์เตอร์หินแกรนิตสีแดง',
  },

  // --- cung hội nghị ---
  'ROYAL-INTERNATIONAL-CONVENTION-PALACE2.jpg': {
    vi: 'Tiền sảnh cung hội nghị: sàn đá đen khảm chỉ vàng, trần vẽ mây và bình tulip đỏ trên bàn tròn giữa sảnh',
    en: 'The convention palace foyer: black stone floors inlaid with gold, sky-painted ceiling domes and red tulips on the centre table',
    zh: '会议宫前厅：黑色石材地面嵌金线，穹顶绘有云天，中央圆桌摆着红色郁金香',
    ko: '컨벤션 팰리스 로비: 금선을 상감한 검은 석재 바닥, 하늘을 그린 돔 천장, 중앙 테이블의 붉은 튤립',
    ja: 'コンベンションパレスのホワイエ：金の象嵌を施した黒い石の床、空を描いたドーム天井、中央の円卓に赤いチューリップ',
    th: 'โถงต้อนรับศูนย์ประชุม พื้นหินสีดำฝังลายทอง เพดานโดมเขียนภาพท้องฟ้า และดอกทิวลิปแดงบนโต๊ะกลาง',
  },
  'Royal-Ha-Long-Gallery-Convention-13.jpg': {
    vi: 'Hàng ghế bành mạ vàng kê trước dãy ghế phủ áo trắng trong đại sảnh trần ô vuông và chùm đèn pha lê',
    en: 'Rows of gilt armchairs set ahead of white-covered seating in the grand hall, under coffered ceilings and crystal chandeliers',
    zh: '大宴会厅内成排的鎏金扶手椅列于白色椅套座席之前，头顶是方格天花与水晶吊灯',
    ko: '흰 커버를 씌운 좌석 앞에 늘어선 금박 안락의자, 격자 천장과 크리스털 샹들리에가 있는 대연회장',
    ja: '白いカバーの座席の前に並ぶ金彩のアームチェア、格天井とクリスタルシャンデリアの大ホール',
    th: 'แถวเก้าอี้นวมปิดทองตั้งอยู่หน้าที่นั่งคลุมผ้าขาวในห้องโถงใหญ่ ใต้เพดานลายกรอบและโคมระย้าคริสตัล',
  },
  'Royal-Ha-Long-Convention-01.jpg': {
    vi: 'Đại sảnh tiệc bày bàn tròn phủ khăn sa tanh vàng và ghế bọc trắng, chưa có khách',
    en: 'The ballroom laid with round tables in gold satin and white chair covers, before the guests arrive',
    zh: '宴会厅已铺好金色缎面圆桌与白色椅套，只待宾客入场',
    ko: '금색 새틴을 씌운 원형 테이블과 흰 의자 커버로 세팅을 마친, 손님을 맞기 전의 연회장',
    ja: '金色サテンの円卓と白い椅子カバーをセットし、開宴を待つ宴会場',
    th: 'ห้องจัดเลี้ยงจัดโต๊ะกลมคลุมผ้าซาตินสีทองและเก้าอี้คลุมผ้าขาว ก่อนแขกมาถึง',
  },
  'Royal-Ha-Long-Gallery-Convention-16.jpg': {
    vi: 'Bàn ghép hình chữ nhật rỗng giữa, phủ váy vàng, cho phiên họp APEC Business Advisory Council',
    en: 'A hollow-square table layout skirted in gold for an APEC Business Advisory Council session',
    zh: '为 APEC 企业咨询委员会会议布置的回字形会议桌，围以金色桌裙',
    ko: 'APEC 기업인자문위원회 회의를 위해 금색 테이블 스커트를 두른 ㅁ자형 좌석 배치',
    ja: 'APEC ビジネス諮問委員会の会合のため、金色のテーブルスカートで整えた口の字型レイアウト',
    th: 'การจัดโต๊ะทรงสี่เหลี่ยมกลวงคาดผ้าสีทองสำหรับการประชุมสภาที่ปรึกษาธุรกิจเอเปก',
  },
  'Royal-Ha-Long-Gallery-Convention-15.jpg': {
    vi: 'Đại biểu ngồi quanh bàn ghép chữ nhật rỗng giữa, màn chiếu dựng bên phải phòng',
    en: 'Delegates seated around a hollow-square table, a projection screen standing to the right',
    zh: '与会代表围坐在回字形会议桌旁，右侧立着投影幕',
    ko: 'ㅁ자형 회의 테이블에 둘러앉은 대표단, 오른쪽에 세워진 프로젝션 스크린',
    ja: '口の字型の会議テーブルを囲む出席者、右手に立てられたプロジェクションスクリーン',
    th: 'ผู้แทนนั่งล้อมโต๊ะประชุมทรงสี่เหลี่ยมกลวง มีจอฉายภาพตั้งอยู่ด้านขวา',
  },
  'Royal-Ha-Long-Gallery-Convention-22.jpg': {
    vi: 'Hội nghị bàn chữ U phủ váy vàng, phông xanh in cờ các nước và bục phát biểu ở giữa',
    en: 'A conference at U-shaped tables skirted in gold, a blue backdrop of national flags behind the lectern',
    zh: 'U 形会议桌围以金色桌裙，蓝色背景板印有各国国旗，中央设发言台',
    ko: '금색 스커트를 두른 ㄷ자형 테이블 회의, 각국 국기가 인쇄된 파란 배경막과 가운데 연단',
    ja: '金色のスカートを掛けたコの字型テーブルの会議、各国国旗を並べた青いバックドロップと中央の演台',
    th: 'การประชุมโต๊ะรูปตัวยูคาดผ้าสีทอง ฉากหลังสีน้ำเงินพิมพ์ธงชาตินานาประเทศ และแท่นพูดตรงกลาง',
  },
  'Royal-Ha-Long-Gallery-Convention-21.jpg': {
    vi: 'Phòng họp song phương kê hai hàng ghế bành kem đối diện nhau trên thảm hoa văn đỏ, phông nền in cờ các nước',
    en: 'A room set for bilateral talks: two facing rows of cream armchairs on a red patterned carpet, national flags on the backdrop',
    zh: '双边会谈布置：红色花纹地毯上两排米色扶手椅相对而设，背景板印有各国国旗',
    ko: '양자 회담 배치: 붉은 무늬 카펫 위 마주 놓인 크림색 안락의자 두 줄과 국기가 인쇄된 배경막',
    ja: '二国間会談の設え：赤い文様の絨毯に向かい合うクリーム色のアームチェア二列と、国旗を配したバックドロップ',
    th: 'ห้องจัดสำหรับการหารือทวิภาคี เก้าอี้นวมสีครีมสองแถวหันหน้าเข้าหากันบนพรมลายแดง ฉากหลังพิมพ์ธงชาติ',
  },
  'Royal-Ha-Long-Gallery-Convention-23.jpg': {
    vi: 'Phiên hội đàm song phương đang diễn ra, hai đoàn ngồi hai bên bục hoa dưới phông diễn đàn EATOF',
    en: 'A bilateral talk under way, the two delegations seated either side of the flowers beneath the EATOF forum backdrop',
    zh: '双边会谈进行中，两国代表团分坐花台两侧，背后是 EATOF 论坛背景板',
    ko: '진행 중인 양자 회담, EATOF 포럼 배경막 아래 꽃 장식을 사이에 두고 마주 앉은 두 대표단',
    ja: '進行中の二国間会談、EATOF フォーラムのバックドロップの下、花を挟んで向かい合う両代表団',
    th: 'การหารือทวิภาคีที่กำลังดำเนินอยู่ คณะผู้แทนสองฝ่ายนั่งขนาบแจกันดอกไม้ใต้ฉากหลังการประชุม EATOF',
  },
  'Royal-Ha-Long-Gallery-Convention-14.jpg': {
    vi: 'Đại biểu ngồi kín các dãy ghế bành mạ vàng, mỗi cặp ghế một bàn thấp đặt tài liệu',
    en: 'Delegates filling rows of gilt armchairs, a low table with papers between every pair',
    zh: '与会者坐满成排的鎏金扶手椅，每两张椅子间设一张放文件的矮几',
    ko: '금박 안락의자 줄을 가득 메운 참석자들, 의자 두 개마다 서류를 올린 낮은 탁자',
    ja: '金彩のアームチェアの列を埋める出席者、椅子二脚ごとに資料を置いたローテーブル',
    th: 'ผู้เข้าร่วมนั่งเต็มแถวเก้าอี้นวมปิดทอง มีโต๊ะเตี้ยวางเอกสารคั่นทุกสองที่นั่ง',
  },
  'HOANG-GIA-2.jpg': {
    vi: 'Sảnh Hoàng Gia kê hai dãy ghế bành dài đối diện trên thảm vòng tròn đỏ, màn chiếu xanh ở cuối phòng',
    en: 'The Hoang Gia hall with two long facing rows of armchairs on a red medallion carpet, a blue screen at the far end',
    zh: 'Hoang Gia 厅内两排扶手椅相对排列于红色团花地毯上，尽头是蓝色投影幕',
    ko: '붉은 메달리온 카펫 위에 마주 보는 두 줄의 안락의자가 놓인 Hoang Gia 홀, 안쪽 끝에는 파란 스크린',
    ja: '赤いメダリオン柄の絨毯に向かい合う二列のアームチェアを並べた Hoang Gia ホール、奥に青いスクリーン',
    th: 'ห้อง Hoang Gia จัดเก้าอี้นวมสองแถวยาวหันหน้าเข้าหากันบนพรมลายเหรียญสีแดง มีจอสีน้ำเงินอยู่สุดห้อง',
  },
  'Royal-Halong-Hotel-Convention-01.jpg': {
    vi: 'Phòng họp nhỏ ốp phào kem viền vàng, sàn gỗ đỏ và hai dãy ghế bành quanh bàn thấp dưới đèn chùm',
    en: 'A small ivory-and-gilt meeting room: red parquet, two rows of armchairs around low tables beneath a chandelier',
    zh: '小型会议厅：米色描金线脚、红色木地板，吊灯下两排扶手椅围着矮几',
    ko: '아이보리와 금장 몰딩의 소회의실, 붉은 마루와 샹들리에 아래 낮은 탁자를 둘러싼 두 줄의 안락의자',
    ja: 'アイボリーと金の装飾を施した小会議室、赤い寄木の床と、シャンデリアの下でローテーブルを囲む二列のアームチェア',
    th: 'ห้องประชุมขนาดเล็กตกแต่งบัวสีงาช้างขลิบทอง พื้นไม้สีแดง และเก้าอี้นวมสองแถวล้อมโต๊ะเตี้ยใต้โคมระย้า',
  },
  'Royal-Ha-Long-Blue-Sea-02.jpg': {
    vi: 'Phòng họp ốp gỗ vàng với bàn chữ U ghế bọc xanh lá, nhân viên đang chỉnh lại bàn trước giờ họp',
    en: 'A timber-panelled meeting room with a U-shaped table and green chairs, a member of staff straightening it before the session',
    zh: '木饰面会议厅内的 U 形会议桌配绿色座椅，一名员工正在会前整理桌面',
    ko: '목재 패널 회의실의 ㄷ자형 테이블과 녹색 의자, 회의 전 자리를 정돈하는 직원',
    ja: '木パネル張りの会議室のコの字型テーブルと緑の椅子、開会前に卓上を整えるスタッフ',
    th: 'ห้องประชุมกรุไม้ โต๊ะรูปตัวยูกับเก้าอี้สีเขียว และพนักงานกำลังจัดโต๊ะก่อนเริ่มประชุม',
  },
  'Royal-Ha-Long-Gallery-Convention-26.jpg': {
    vi: 'Phòng khách trắng viền vàng với ghế bành da kem và bàn cao chân đồng, bức tranh phong cảnh treo trên tường',
    en: 'A white-and-gold salon with cream leather tub chairs, brass-legged cocktail tables and a landscape painting on the wall',
    zh: '白金色调的休息厅：米色皮质圈椅、黄铜腿高几，墙上挂着风景画',
    ko: '흰색과 금색의 살롱, 크림색 가죽 라운지 체어와 황동 다리 칵테일 테이블, 벽에 걸린 풍경화',
    ja: '白と金のサロン、クリーム色のレザーチェアと真鍮脚のカクテルテーブル、壁の風景画',
    th: 'ห้องรับรองโทนขาวทอง เก้าอี้หนังสีครีม โต๊ะค็อกเทลขาทองเหลือง และภาพวาดทิวทัศน์บนผนัง',
  },
  'Royal-Ha-Long-Hotel-11.jpg': {
    vi: 'Phòng khách ốp phào kem viền vàng, hai dãy ghế bành quanh bàn thấp và bức tranh phong cảnh trên tường',
    en: 'An ivory-and-gilt salon, two rows of armchairs around low tables and a landscape painting on the wall',
    zh: '米色描金的休息厅：两排扶手椅围着矮几，墙上挂着风景画',
    ko: '아이보리와 금장의 살롱, 낮은 탁자를 둘러싼 두 줄의 안락의자와 벽의 풍경화',
    ja: 'アイボリーと金のサロン、ローテーブルを囲む二列のアームチェアと壁の風景画',
    th: 'ห้องรับรองสีงาช้างขลิบทอง เก้าอี้นวมสองแถวล้อมโต๊ะเตี้ย และภาพวาดทิวทัศน์บนผนัง',
  },
  'Royal-Ha-Long-Gallery-Convention-17.jpg': {
    vi: 'Hội nghị kê ghế thắt nơ vàng theo lối lớp học, sân khấu treo màn chiếu trước phông sao đen',
    en: 'A conference in classroom layout with gold chair sashes, the stage screen set against a dark star curtain',
    zh: '课桌式排列的会议现场，椅背系金色饰带，舞台投影幕前是深色星幕',
    ko: '금색 의자 리본을 두른 교실형 배치의 회의, 어두운 별무늬 커튼 앞에 놓인 무대 스크린',
    ja: '金色のチェアサッシュを結んだスクール形式の会議、暗い星幕の前に据えたステージスクリーン',
    th: 'การประชุมจัดที่นั่งแบบห้องเรียน เก้าอี้ผูกผ้าสีทอง และจอบนเวทีหน้าฉากดาวสีเข้ม',
  },
  'Royal-Ha-Long-Gallery-Convention-18.jpg': {
    vi: 'Phòng hội nghị kê bàn dài phủ khăn trắng, ghế thắt nơ vàng, bài trình chiếu đang mở trên màn hình',
    en: 'Long white-clothed tables and gold-bowed chairs, a presentation open on the screen',
    zh: '铺白色台布的长桌与系金色蝴蝶结的座椅，屏幕上正放映演示文稿',
    ko: '흰 테이블보를 씌운 긴 테이블과 금색 리본을 묶은 의자, 화면에 띄운 발표 자료',
    ja: '白いクロスの長テーブルと金のリボンを結んだ椅子、スクリーンに映されたプレゼン資料',
    th: 'โต๊ะยาวคลุมผ้าขาวกับเก้าอี้ผูกโบว์สีทอง และสไลด์นำเสนอบนจอ',
  },
  'Royal-Ha-Long-Gallery-Convention-19.jpg': {
    vi: 'Tiệc tối bày bàn tròn ghế nơ vàng trên thảm đỏ vàng, sân khấu LED ở cuối phòng',
    en: 'A dinner laid at round tables with gold-sashed chairs on a red-and-gold carpet, an LED stage at the end of the room',
    zh: '红金地毯上的圆桌晚宴，椅背系金色饰带，厅尾设 LED 舞台',
    ko: '붉은빛 금색 카펫 위 원형 테이블의 만찬, 금색 리본 의자와 안쪽의 LED 무대',
    ja: '赤と金の絨毯に円卓を並べた晩餐、金のサッシュを結んだ椅子と奥の LED ステージ',
    th: 'งานเลี้ยงค่ำจัดโต๊ะกลมบนพรมแดงทอง เก้าอี้ผูกผ้าสีทอง และเวที LED อยู่สุดห้อง',
  },
  'Royal-Ha-Long-Gallery-Convention-20.jpg': {
    vi: 'Tiệc gala kín bàn tròn, ghế thắt nơ vàng và sân khấu LED sáng xanh phía cuối đại sảnh',
    en: 'A gala filling the hall with round tables and gold-sashed chairs, the LED stage glowing blue at the far end',
    zh: '宾客坐满圆桌的晚会现场，金色饰带座椅，厅尾的 LED 舞台泛着蓝光',
    ko: '원형 테이블과 금색 리본 의자로 가득 찬 갈라, 홀 안쪽에서 푸르게 빛나는 LED 무대',
    ja: '円卓と金のサッシュの椅子で埋まったガラ、ホール奥で青く光る LED ステージ',
    th: 'งานกาลาที่เต็มไปด้วยโต๊ะกลมและเก้าอี้ผูกผ้าสีทอง เวที LED ส่องแสงสีน้ำเงินอยู่สุดห้อง',
  },
  'Convention-Center-Halong-04.jpg': {
    vi: 'Tiệc gala doanh nghiệp với bàn tròn phủ khăn trắng và sân khấu LED xanh vàng, đèn quét trên trần',
    en: 'A corporate gala of white round tables facing a blue-and-gold LED stage, moving lights sweeping the ceiling',
    zh: '企业晚会：白色圆桌面向蓝金色 LED 舞台，摇头灯扫过天花',
    ko: '기업 갈라, 흰 원형 테이블이 파랑과 금색 LED 무대를 향하고 천장에는 무빙 라이트',
    ja: '企業のガラ、白い円卓が青と金の LED ステージを向き、天井を走るムービングライト',
    th: 'งานกาลาองค์กร โต๊ะกลมผ้าขาวหันสู่เวที LED สีน้ำเงินทอง และไฟมูฟวิงเฮดกวาดเพดาน',
  },
  'Royal-Ha-Long-Gallery-Convention-05.jpg': {
    vi: 'Gần hai trăm người chụp ảnh tập thể trước sân khấu LED vàng xanh của một sự kiện doanh nghiệp',
    en: 'Some two hundred people gathered for a group photograph in front of a corporate event’s gold-and-blue LED stage',
    zh: '近两百人在企业活动的金蓝色 LED 舞台前合影',
    ko: '기업 행사의 금색과 파란색 LED 무대 앞에 모여 단체 사진을 찍는 200여 명',
    ja: '企業イベントの金と青の LED ステージの前に集まり記念撮影をする二百人近い参加者',
    th: 'ผู้ร่วมงานเกือบสองร้อยคนถ่ายภาพหมู่หน้าเวที LED สีทองน้ำเงินของงานองค์กร',
  },
  '313140337_799008504854810_8995538261083883442_n.jpeg': {
    vi: 'Tiết mục múa nón lá trên sân khấu trước màn hình chiếu thác nước, khán giả bên dưới giơ điện thoại ghi hình',
    en: 'A conical-hat dance on stage against a waterfall video backdrop, the audience below filming on their phones',
    zh: '舞台上表演斗笠舞，背景大屏播放瀑布画面，台下观众举着手机拍摄',
    ko: '폭포 영상을 배경으로 무대에서 펼쳐지는 논라(삿갓) 춤, 객석에서는 휴대전화로 촬영하는 관객',
    ja: '滝の映像を背に舞台で披露されるノンラー（笠）の踊り、客席ではスマートフォンを掲げる観客',
    th: 'การแสดงระบำหมวกงอบบนเวทีหน้าจอภาพน้ำตก ผู้ชมด้านล่างยกโทรศัพท์ถ่ายวิดีโอ',
  },
  'Royal-Ha-Long-Gallery-Convention-10.jpg': {
    vi: 'Ban nhạc biểu diễn trên sân khấu ngoài trời bên bể bơi, ánh đèn xanh tím in xuống mặt nước',
    en: 'A band on the open-air stage beside the pool, blue and violet lights reflected in the water',
    zh: '乐队在泳池畔的露天舞台演出，蓝紫灯光倒映在水面',
    ko: '수영장 옆 야외 무대에서 공연하는 밴드, 물에 비친 푸르고 보랏빛 조명',
    ja: 'プールサイドの野外ステージで演奏するバンド、水面に映る青と紫の照明',
    th: 'วงดนตรีเล่นบนเวทีกลางแจ้งริมสระ แสงไฟสีน้ำเงินม่วงสะท้อนผิวน้ำ',
  },
  'Royal-Ha-Long-slider-05.jpg': {
    vi: 'Đại sảnh tiệc bày bàn tròn khăn vàng, ghế bọc trắng dưới dãy đèn chùm pha lê',
    en: 'The banquet hall laid with gold-clothed round tables and white chair covers beneath rows of crystal chandeliers',
    zh: '宴会厅铺金色台布的圆桌与白色椅套，成排水晶吊灯高悬',
    ko: '금색 테이블보의 원형 테이블과 흰 의자 커버가 늘어선 연회장, 천장에는 줄지어 걸린 크리스털 샹들리에',
    ja: '金色のクロスの円卓と白い椅子カバーが並ぶ宴会場、天井に連なるクリスタルシャンデリア',
    th: 'ห้องจัดเลี้ยงจัดโต๊ะกลมคลุมผ้าสีทองและเก้าอี้คลุมผ้าขาว ใต้แถวโคมระย้าคริสตัล',
  },

  // --- tiệc cưới ---
  'Royal-Ha-Long-Gallery-Wedding-08.jpg': {
    vi: 'Cô dâu mặc áo choàng trắng ngồi bên cửa sổ, khay trang sức và bó hoa cưới đặt trên bàn tròn',
    en: 'The bride in a white robe by the window, her jewellery and bouquet laid out on the round table',
    zh: '身着白色晨袍的新娘坐在窗边，圆桌上摆着首饰盘与捧花',
    ko: '흰 가운을 입고 창가에 앉은 신부, 원형 테이블에 놓인 주얼리 트레이와 부케',
    ja: '白いローブ姿で窓辺に座る花嫁、丸テーブルにはジュエリートレイとブーケ',
    th: 'เจ้าสาวในชุดคลุมสีขาวนั่งริมหน้าต่าง ถาดเครื่องประดับและช่อดอกไม้วางบนโต๊ะกลม',
  },
  'Royal-Ha-Long-Wedding-03.jpg': {
    vi: 'Phù dâu áo hồng phấn lau má cho cô dâu đang bật cười giữa nhóm bạn',
    en: 'A bridesmaid in dusty pink dabbing the laughing bride’s cheek, friends gathered round',
    zh: '身穿藕粉色礼服的伴娘为笑开怀的新娘拭面，好友围在一旁',
    ko: '더스티 핑크 드레스의 들러리가 웃음을 터뜨린 신부의 볼을 닦아 주는 모습과 둘러선 친구들',
    ja: 'くすみピンクのドレスのブライズメイドが笑う花嫁の頬をそっと拭う様子と、囲む友人たち',
    th: 'เพื่อนเจ้าสาวในชุดสีชมพูหม่นซับแก้มให้เจ้าสาวที่กำลังหัวเราะ ท่ามกลางกลุ่มเพื่อน',
  },
  'JAN10TH-STUDIO-200-1.jpg': {
    vi: 'Cổng cưới khung đồng phủ hoa pastel mở lối thảm xanh vào sảnh tiệc, bảng chào dựng bên phải',
    en: 'A brass-framed wedding entrance banked with pastel flowers, a blue carpet aisle running in and a welcome sign at the right',
    zh: '黄铜框婚礼花门缀满柔彩鲜花，蓝色地毯通道通向宴会厅，右侧立着迎宾牌',
    ko: '파스텔 꽃으로 뒤덮인 황동 프레임의 웨딩 입구, 안으로 이어지는 푸른 카펫 통로와 오른쪽의 웰컴 사인',
    ja: 'パステルの花で覆われた真鍮フレームのウエディング入口、奥へ続く青いカーペットのアイルと右手のウェルカムサイン',
    th: 'ซุ้มทางเข้างานแต่งโครงทองเหลืองประดับดอกไม้โทนพาสเทล พรมสีน้ำเงินทอดเข้าไปด้านใน และป้ายต้อนรับอยู่ทางขวา',
  },
  'JAN10TH-STUDIO-231-1.jpg': {
    vi: 'Ba bảng ảnh cưới đen trắng dựng trên sàn đá bóng, chân bảng cắm hoa hồng và cẩm tú cầu',
    en: 'Three boards of black-and-white wedding photographs on the polished stone floor, roses and hydrangeas at their feet',
    zh: '三块黑白婚纱照展板立在抛光石地面上，底座点缀玫瑰与绣球',
    ko: '광택 있는 석재 바닥에 세운 흑백 웨딩 사진 보드 세 개, 발치에는 장미와 수국',
    ja: '磨かれた石の床に立てた白黒のウエディングフォトボード三枚、足元には薔薇と紫陽花',
    th: 'บอร์ดภาพแต่งงานขาวดำสามแผ่นตั้งบนพื้นหินขัดเงา ประดับกุหลาบและไฮเดรนเยียที่ฐาน',
  },
  'Royal-Ha-Long-Gallery-Wedding-09.jpg': {
    vi: 'Cổng hoa hình vòm ghi tên cô dâu chú rể, phía sau là dãy nhà và cây xanh trong khuôn viên',
    en: 'A floral arch lettered with the couple’s names, the hotel grounds visible through it',
    zh: '拱形花门上写着新人姓名，穿过花门可见酒店建筑与园景',
    ko: '신랑 신부의 이름을 새긴 아치형 꽃문, 그 너머로 보이는 호텔 건물과 정원',
    ja: '新郎新婦の名を掲げたアーチ型の花門、その向こうに広がるホテルの建物と庭',
    th: 'ซุ้มดอกไม้ทรงโค้งสลักชื่อบ่าวสาว มองทะลุเห็นอาคารและสวนของโรงแรม',
  },
  'Royal-Ha-Long-Gallery-Wedding-12.jpg': {
    vi: 'Cô dâu lau nước mắt bên chú rể trong lễ ngoài trời, người dẫn chương trình áo hồng cầm micro bên cạnh',
    en: 'The bride wiping away tears beside the groom at the outdoor ceremony, the host in pink holding the microphone',
    zh: '户外仪式上新娘在新郎身旁拭泪，粉衣司仪持麦克风站在一侧',
    ko: '야외 예식에서 신랑 곁에서 눈물을 닦는 신부와 마이크를 든 분홍 옷의 사회자',
    ja: '屋外の挙式で新郎の傍らで涙を拭う花嫁と、マイクを持つピンクの衣装の司会者',
    th: 'เจ้าสาวซับน้ำตาข้างเจ้าบ่าวในพิธีกลางแจ้ง พิธีกรชุดสีชมพูถือไมโครโฟนยืนอยู่ข้าง ๆ',
  },
  'Royal-Ha-Long-Wedding-02.jpg': {
    vi: 'Lễ cưới ngoài trời trên thảm cỏ: lối đi viền hoa trắng, phù rể một bên, phù dâu một bên và khách mời ngồi hai hàng',
    en: 'An outdoor lawn ceremony: a white-flowered aisle, groomsmen to one side, bridesmaids to the other and guests seated around',
    zh: '草坪户外仪式：白花铺就的通道两侧，一边是伴郎，一边是伴娘，宾客分坐两旁',
    ko: '잔디밭 야외 예식: 흰 꽃으로 장식한 통로 양옆에 선 들러리들과 양쪽에 앉은 하객들',
    ja: '芝生での屋外挙式：白い花で縁取ったバージンロードの両脇に立つ付添人と、両側に着席した招待客',
    th: 'พิธีกลางแจ้งบนสนามหญ้า ทางเดินประดับดอกไม้สีขาว เพื่อนเจ้าบ่าวอยู่ด้านหนึ่ง เพื่อนเจ้าสาวอีกด้าน และแขกนั่งสองฝั่ง',
  },
  'Royal-Ha-Long-Wedding-05.jpg': {
    vi: 'Cô dâu chú rể đứng trước cổng hoa, người dẫn chương trình áo hồng cầm micro bên cạnh',
    en: 'The bride and groom before the flower arch, the host in pink at the microphone beside them',
    zh: '新郎新娘站在花门前，粉衣司仪持麦克风在旁',
    ko: '꽃 아치 앞에 선 신랑 신부, 곁에서 마이크를 든 분홍 옷의 사회자',
    ja: '花のアーチの前に立つ新郎新婦と、傍らでマイクを持つピンクの衣装の司会者',
    th: 'บ่าวสาวยืนหน้าซุ้มดอกไม้ พิธีกรชุดสีชมพูถือไมโครโฟนอยู่ข้าง ๆ',
  },
  'Royal-Ha-Long-Gallery-Wedding-0.jpg': {
    vi: 'Sân khấu lễ thành hôn trong sảnh tiệc, phông sao xanh và lối đi viền hoa cùng đèn cầu dẫn lên bậc thảm',
    en: 'The wedding stage in the ballroom, a blue star curtain behind and an aisle of flowers and globe lamps leading up the carpeted steps',
    zh: '宴会厅内的婚礼舞台，蓝色星幕为背景，花与球形灯饰的通道通向铺地毯的台阶',
    ko: '푸른 별무늬 커튼을 배경으로 한 연회장의 웨딩 무대와, 꽃과 구형 조명이 늘어선 채 카펫 계단으로 이어지는 통로',
    ja: '青い星幕を背にした宴会場のウエディングステージと、花と球形ランプが並びカーペットの階段へ続くアイル',
    th: 'เวทีพิธีแต่งงานในห้องจัดเลี้ยง ฉากหลังผ้าม่านดาวสีน้ำเงิน ทางเดินประดับดอกไม้และโคมทรงกลมทอดขึ้นบันไดปูพรม',
  },
  'Royal-Ha-Long-Gallery-Wedding-05.jpg': {
    vi: 'Cận cảnh dải hoa pastel và đèn cầu trắng chạy dọc lối vào sân khấu',
    en: 'A close view of the aisle: pastel blooms and white globe lamps running towards the stage',
    zh: '通道特写：柔彩花艺与白色球形灯一路延伸至舞台',
    ko: '통로 클로즈업: 무대까지 이어지는 파스텔 꽃과 흰 구형 조명',
    ja: 'アイルの接写：ステージへ続くパステルの花と白い球形ランプ',
    th: 'ภาพใกล้ของทางเดิน ดอกไม้โทนพาสเทลและโคมทรงกลมสีขาวทอดยาวสู่เวที',
  },
  'Royal-Ha-Long-Gallery-Wedding-04.jpg': {
    vi: 'Tháp ly sâm banh dựng cạnh bình hoa hồng phấn, phía sau là sảnh tiệc đã bày bàn',
    en: 'A tower of champagne coupes beside a vase of blush roses, the laid banquet room behind',
    zh: '香槟塔立在粉玫瑰花瓶旁，身后是已布置好的宴会厅',
    ko: '연분홍 장미 화병 옆에 쌓아 올린 샴페인 잔 탑, 뒤로는 세팅을 마친 연회장',
    ja: '淡いピンクの薔薇を活けた花瓶の傍らに積み上げたシャンパンタワー、奥にはセッティングを終えた宴会場',
    th: 'หอแก้วแชมเปญตั้งข้างแจกันกุหลาบสีชมพูอ่อน ด้านหลังเป็นห้องจัดเลี้ยงที่จัดโต๊ะเรียบร้อย',
  },
  'Royal-Ha-Long-Gallery-Wedding-25.jpg': {
    vi: 'Cô dâu chú rể cùng rót sâm banh lên tháp ly, máy quay của thợ ảnh chĩa vào bên phải',
    en: 'The couple pouring champagne over the coupe tower, a videographer’s camera at the right of frame',
    zh: '新人共同将香槟倒入杯塔，右侧是摄像师的镜头',
    ko: '함께 샴페인 타워에 샴페인을 붓는 신랑 신부, 오른쪽에는 영상 촬영 카메라',
    ja: '二人でシャンパンタワーに注ぐ新郎新婦、右手にはビデオグラファーのカメラ',
    th: 'บ่าวสาวรินแชมเปญลงหอแก้วด้วยกัน ด้านขวาเป็นกล้องของช่างวิดีโอ',
  },
  'Royal-Ha-Long-Gallery-Wedding-15.jpg': {
    vi: 'Bánh cưới bốn tầng đặt trên khăn kim tuyến, hoa hồng phấn đổ xuống một bên, phông sao đen phía sau',
    en: 'A four-tier wedding cake on a sequinned cloth, blush roses spilling down one side against a dark star curtain',
    zh: '四层婚礼蛋糕摆在亮片桌布上，一侧垂落粉玫瑰，背景是深色星幕',
    ko: '시퀸 천 위의 4단 웨딩 케이크, 한쪽으로 흘러내린 연분홍 장미와 어두운 별무늬 커튼',
    ja: 'スパンコールのクロスに置いた四段のウエディングケーキ、片側に流れる淡いピンクの薔薇と暗い星幕',
    th: 'เค้กแต่งงานสี่ชั้นบนผ้าปักเลื่อม กุหลาบสีชมพูอ่อนไหลลงด้านหนึ่ง ฉากหลังผ้าม่านดาวสีเข้ม',
  },
  'Royal-Ha-Long-Gallery-Wedding-23.jpg': {
    vi: 'Cô dâu chú rể đi giữa hai hàng bàn tiệc, trẻ em chạy tới đưa tay và khách mời vỗ tay',
    en: 'The couple walking between the tables, children reaching out to them as the guests applaud',
    zh: '新人走过宾客席之间，孩子们伸手相迎，宾客鼓掌致意',
    ko: '하객 테이블 사이를 걷는 신랑 신부, 손을 내미는 아이들과 박수를 보내는 하객들',
    ja: '招待客のテーブルの間を歩く新郎新婦、手を伸ばす子どもたちと拍手する参列者',
    th: 'บ่าวสาวเดินผ่านระหว่างโต๊ะแขก เด็ก ๆ ยื่นมือมาทักทาย และแขกปรบมือให้',
  },
  'Royal-Ha-Long-Wedding-07.jpg': {
    vi: 'Toàn cảnh sảnh tiệc nhìn từ cuối phòng: chùm đèn pha lê, khách ngồi kín bàn tròn và cô dâu đứng trên sân khấu',
    en: 'The ballroom from the back: crystal chandeliers, guests filling the round tables and the bride on the stage',
    zh: '从厅尾望向宴会厅：水晶吊灯下圆桌坐满宾客，新娘立于舞台之上',
    ko: '홀 뒤편에서 본 연회장: 크리스털 샹들리에 아래 원형 테이블을 가득 채운 하객과 무대 위의 신부',
    ja: '会場後方から見た宴会場：クリスタルシャンデリアの下、円卓を埋める招待客と壇上の花嫁',
    th: 'ห้องจัดเลี้ยงมองจากด้านหลัง โคมระย้าคริสตัล แขกนั่งเต็มโต๊ะกลม และเจ้าสาวอยู่บนเวที',
  },
  'Royal-Ha-Long-Gallery-Wedding-07.jpg': {
    vi: 'Nghệ sĩ saxophone áo trắng biểu diễn dưới đèn chùm, sau lưng là cổng hoa và phông sao',
    en: 'A saxophonist in white playing beneath the chandelier, the flower arch and star curtain behind him',
    zh: '白衣萨克斯手在吊灯下演奏，身后是花门与星幕',
    ko: '샹들리에 아래에서 연주하는 흰 정장의 색소포니스트, 뒤로는 꽃 아치와 별무늬 커튼',
    ja: 'シャンデリアの下で演奏する白い衣装のサックス奏者、背後に花のアーチと星幕',
    th: 'นักแซกโซโฟนชุดขาวบรรเลงใต้โคมระย้า ด้านหลังเป็นซุ้มดอกไม้และฉากดาว',
  },
  'Royal-Ha-Long-Wedding-09.jpg': {
    vi: 'Ảnh đen trắng: đôi uyên ương ôm nhau trong vòng hoa tròn dưới ánh đèn sân khấu ban đêm',
    en: 'In black and white: the couple embracing inside a circular flower arch under the night stage lights',
    zh: '黑白影像：新人相拥于圆形花环之中，夜晚的舞台灯光洒下',
    ko: '흑백 사진: 밤 무대 조명 아래 원형 꽃 아치 안에서 서로를 안은 신랑 신부',
    ja: 'モノクロ写真：夜のステージ照明の下、円形の花のアーチの中で抱き合う二人',
    th: 'ภาพขาวดำ บ่าวสาวโอบกอดกันในซุ้มดอกไม้ทรงกลมใต้แสงไฟเวทียามค่ำ',
  },
  'Royal-Ha-Long-Gallery-Wedding-19.jpg': {
    vi: 'Lễ cưới bên bể bơi lúc chiều muộn: cổng hoa dựng trên bờ, bóng bay và nến thả trôi trên mặt nước',
    en: 'A poolside ceremony at dusk: a flower arch on the deck, balloons and candles floating on the water',
    zh: '黄昏时的泳池畔仪式：花门立于池边，水面漂着气球与烛灯',
    ko: '해질 녘 수영장 옆 예식: 데크 위의 꽃 아치와 수면에 띄운 풍선, 촛불',
    ja: '夕暮れのプールサイド挙式：デッキに立つ花のアーチと、水面に浮かぶ風船とキャンドル',
    th: 'พิธีริมสระยามพลบค่ำ ซุ้มดอกไม้ตั้งบนขอบสระ ลูกโป่งและเทียนลอยอยู่บนผิวน้ำ',
  },
  'Royal-Ha-Long-Gallery-Wedding-20.jpg': {
    vi: 'Bàn tiệc tròn phủ khăn trắng thắt nơ đỏ mận kê sát mép bể bơi dưới dây đèn giăng trên tán cây',
    en: 'Round tables in white with burgundy sashes set along the pool edge under festoon lights strung through the trees',
    zh: '系酒红色饰带的白色圆桌沿泳池边排开，树间垂挂着串灯',
    ko: '자주색 리본을 두른 흰 원형 테이블이 수영장 가장자리를 따라 놓이고, 나무 사이에 걸린 전구 조명',
    ja: 'ワインレッドのサッシュを掛けた白い円卓がプールサイドに並び、木々に渡されたストリングライト',
    th: 'โต๊ะกลมผ้าขาวคาดโบว์สีเบอร์กันดีเรียงริมขอบสระ ใต้สายไฟประดับที่ขึงระหว่างต้นไม้',
  },
  'Royal-Ha-Long-Wedding-10.jpg': {
    vi: 'Tiệc bên hồ lúc chạng vạng với ô và đèn lồng thả trôi trên mặt nước, dây đèn giăng trên cây',
    en: 'A poolside party at dusk, parasols and lanterns floating on the water beneath strings of festoon lights',
    zh: '暮色中的池畔晚宴，水面漂着纸伞与灯笼，树上挂满串灯',
    ko: '해질 무렵 수영장 파티, 물 위에 띄운 양산과 등롱, 나무에 걸린 전구 조명',
    ja: '夕暮れのプールサイドパーティー、水面に浮かぶ傘と灯籠、木々に渡したストリングライト',
    th: 'งานเลี้ยงริมสระยามพลบค่ำ ร่มและโคมลอยอยู่บนผิวน้ำ ใต้สายไฟประดับบนต้นไม้',
  },
  'Royal-Ha-Long-Gallery-Wedding-21.jpg': {
    vi: 'Ba nhạc công áo trắng chơi saxophone, guitar và keyboard trên sân khấu bên hồ, ánh đèn in xuống nước',
    en: 'Three musicians in white playing saxophone, guitar and keys on the poolside stage, the lights mirrored in the water',
    zh: '三位白衣乐手在池畔舞台演奏萨克斯、吉他与键盘，灯光映在水面',
    ko: '수영장 무대에서 색소폰과 기타, 키보드를 연주하는 흰 의상의 연주자 세 명, 물에 비친 조명',
    ja: 'プールサイドのステージでサックス、ギター、キーボードを奏でる白い衣装の三人と、水面に映る照明',
    th: 'นักดนตรีชุดขาวสามคนบรรเลงแซกโซโฟน กีตาร์ และคีย์บอร์ดบนเวทีริมสระ แสงไฟสะท้อนผิวน้ำ',
  },

  // --- nhân viên ---
  'Royal-Halong-Hotel-staff-04.jpg': {
    vi: 'Đội ngũ khách sạn xếp hàng trước mặt tiền có hàng cột và dòng chữ Royal Halong Hotel, các nữ nhân viên mặc áo dài đỏ',
    en: 'The hotel team lined up before the columned facade lettered Royal Halong Hotel, the women in red ao dai',
    zh: '酒店团队在写有 Royal Halong Hotel 的列柱门面前列队，女员工身着红色奥黛',
    ko: 'Royal Halong Hotel 글자가 적힌 열주 파사드 앞에 도열한 호텔 임직원, 여직원들은 붉은 아오자이 차림',
    ja: 'Royal Halong Hotel と記された列柱のファサード前に整列するホテルスタッフ、女性は赤いアオザイ姿',
    th: 'ทีมงานโรงแรมยืนเรียงแถวหน้าอาคารเสาสูงที่มีตัวอักษร Royal Halong Hotel พนักงานหญิงสวมอ่าวหญ่ายสีแดง',
  },
  'Royal-Halong-Hotel-staff-03.jpg': {
    vi: 'Các nữ nhân viên áo dài đỏ vẫy tay chào trên sân trước, quản lý mặc vest đen đứng giữa hàng',
    en: 'Staff in red ao dai waving from the forecourt, a manager in a black suit standing at the centre',
    zh: '身着红色奥黛的女员工在前庭挥手致意，黑西装的管理人员立于队列中央',
    ko: '붉은 아오자이를 입고 앞마당에서 손을 흔드는 직원들, 가운데에는 검은 정장의 매니저',
    ja: '赤いアオザイで前庭から手を振るスタッフと、中央に立つ黒いスーツのマネージャー',
    th: 'พนักงานหญิงในชุดอ่าวหญ่ายสีแดงโบกมือทักทายที่ลานหน้าอาคาร ผู้จัดการชุดสูทดำยืนกลางแถว',
  },
  'Royal-Halong-Hotel-staff-02.jpg': {
    vi: 'Tám nữ nhân viên áo dài đỏ đứng hai bên cửa chính kết hoa, thảm đỏ trải từ bậc thềm ra sân',
    en: 'Eight staff in red ao dai flanking the flower-dressed main entrance, a red carpet running down the steps',
    zh: '八位身着红色奥黛的员工分立在鲜花装饰的正门两侧，红毯自台阶铺到庭前',
    ko: '꽃으로 장식한 정문 양옆에 늘어선 붉은 아오자이의 직원 여덟 명, 계단에서 앞마당까지 깔린 레드카펫',
    ja: '花で飾られた正面玄関の両脇に並ぶ赤いアオザイのスタッフ八名と、階段から前庭へ伸びるレッドカーペット',
    th: 'พนักงานแปดคนในชุดอ่าวหญ่ายสีแดงยืนขนาบประตูหลักที่ประดับดอกไม้ พรมแดงทอดจากบันไดสู่ลานหน้า',
  },
  'Royal-Halong-Hotel-staff-05.jpg': {
    vi: 'Hai hàng nhân viên áo dài đỏ đón một đôi khách đi giữa sảnh, trên cao là chùm đèn pha lê hình vành khuyên',
    en: 'Two rows of staff in red ao dai welcoming a couple through the lobby beneath a ring-shaped crystal chandelier',
    zh: '两列红色奥黛员工在环形水晶吊灯下迎接一对宾客穿过大堂',
    ko: '고리 모양 크리스털 샹들리에 아래 로비를 지나는 두 손님을 맞이하는 붉은 아오자이 직원 두 줄',
    ja: '環状のクリスタルシャンデリアの下、ロビーを進む二人の客を迎える赤いアオザイのスタッフ二列',
    th: 'พนักงานชุดอ่าวหญ่ายสีแดงสองแถวต้อนรับแขกคู่หนึ่งที่เดินผ่านล็อบบี้ ใต้โคมระย้าคริสตัลทรงวงแหวน',
  },
  'Royal-Halong-Hotel-staff-08.jpg': {
    vi: 'Hai lễ tân áo vest kem, cà vạt cam đứng sau quầy trước bức tường mạ vàng nhiều mặt cắt',
    en: 'Two receptionists in cream jackets and orange ties behind the counter, a faceted gold wall behind them',
    zh: '两位身着米色制服、系橙色领带的前台员工站在柜台后，身后是多面切割的金色墙面',
    ko: '크림색 재킷과 주황색 넥타이 차림의 리셉션 직원 두 명과 뒤편의 금빛 커팅 벽',
    ja: 'クリーム色のジャケットにオレンジのネクタイのフロントスタッフ二名と、背後の金色の面取り壁',
    th: 'พนักงานต้อนรับสองคนในเสื้อสูทสีครีมผูกเนกไทสีส้มยืนหลังเคาน์เตอร์ ด้านหลังเป็นผนังสีทองเจียระไน',
  },
  'Royal-Halong-Hotel-staff-07.jpg': {
    vi: 'Hai lễ tân làm thủ tục cho một đôi khách trẻ tại quầy, tường vàng xếp ô phía sau',
    en: 'Two receptionists checking in a young couple at the counter, the gold latticed wall behind them',
    zh: '两位前台员工为一对年轻客人办理入住，身后是金色格纹墙',
    ko: '카운터에서 젊은 커플의 체크인을 돕는 리셉션 직원 두 명과 뒤편의 금색 격자 벽',
    ja: 'カウンターで若いカップルのチェックインを行うフロントスタッフ二名と、背後の金色の格子壁',
    th: 'พนักงานต้อนรับสองคนทำเช็กอินให้คู่แขกวัยหนุ่มสาวที่เคาน์เตอร์ ด้านหลังเป็นผนังลายตารางสีทอง',
  },
  'Royal-Halong-Hotel-staff-06.jpg': {
    vi: 'Lễ tân đón hai khách nước ngoài cầm ly nước chào mừng tại quầy, đồng nghiệp áo vest kem đứng đối diện',
    en: 'A receptionist welcoming two overseas guests with arrival drinks at the counter, a colleague in a cream jacket opposite',
    zh: '前台员工在柜台为两位外国客人奉上迎宾饮品，米色制服的同事站在对面',
    ko: '카운터에서 해외 손님 두 명에게 웰컴 드링크를 건네는 리셉션 직원과 맞은편의 크림색 제복 동료',
    ja: 'カウンターで海外からの客二名にウェルカムドリンクを渡すフロントスタッフと、向かいに立つクリーム色の制服の同僚',
    th: 'พนักงานต้อนรับเสิร์ฟเครื่องดื่มต้อนรับให้แขกชาวต่างชาติสองท่านที่เคาน์เตอร์ เพื่อนร่วมงานในชุดสีครีมยืนฝั่งตรงข้าม',
  },
  'Royal-Ha-Long-Gallery-Staff-04.jpg': {
    vi: 'Nhân viên buồng phòng áo hồng đẩy xe khăn sạch dọc hành lang có đèn tường vàng',
    en: 'A housekeeper in a pink uniform wheeling a linen trolley along a lamplit corridor',
    zh: '身穿粉色制服的客房服务员推着布草车走过壁灯映照的走廊',
    ko: '분홍색 유니폼의 하우스키핑 직원이 벽등이 밝힌 복도에서 린넨 카트를 미는 모습',
    ja: 'ピンクの制服のハウスキーパーが、壁灯の灯る廊下でリネンカートを押す様子',
    th: 'พนักงานแม่บ้านในชุดสีชมพูเข็นรถผ้าสะอาดไปตามทางเดินที่มีไฟผนังส่องสว่าง',
  },
  'Royal-Ha-Long-Restaurant-Phuc-Vien-05.jpg': {
    vi: 'Nữ đầu bếp đội mũ trắng gắp tôm nướng ra đĩa tại quầy chế biến tại chỗ, hơi nóng bốc lên',
    en: 'A chef in whites lifting grilled prawns onto a plate at the live-cooking station, steam rising',
    zh: '戴白帽的厨师在现场烹饪区将烤虾装盘，热气升腾',
    ko: '흰 조리복 차림의 셰프가 라이브 쿠킹 스테이션에서 구운 새우를 접시에 담아 올리는 모습과 피어오르는 김',
    ja: '白いコック帽のシェフがライブキッチンで焼き上げた海老を皿に盛る場面、立ちのぼる湯気',
    th: 'เชฟในชุดขาวตักกุ้งย่างลงจานที่สถานีปรุงสด มีไอร้อนลอยขึ้น',
  },
  'Royal-Ha-Long-Restaurant-Phuc-Vien-04.jpg': {
    vi: 'Ba đầu bếp áo đen làm việc tại quầy bếp mở dưới chụp hút inox, tô rau đặt sẵn trên mặt đá',
    en: 'Three chefs in black working the open kitchen beneath a steel extraction hood, bowls of vegetables lined up on the counter',
    zh: '三位黑色厨师服的厨师在不锈钢排烟罩下的开放厨房忙碌，石台上排着蔬菜盆',
    ko: '스테인리스 후드 아래 오픈 키친에서 일하는 검은 조리복의 셰프 세 명과 조리대에 놓인 채소 볼',
    ja: 'ステンレスのフードの下、オープンキッチンで働く黒い調理服のシェフ三名と、カウンターに並ぶ野菜のボウル',
    th: 'เชฟชุดดำสามคนทำงานในครัวเปิดใต้ฮูดสเตนเลส มีชามผักวางเรียงบนเคาน์เตอร์',
  },
  'Royal-Halong-Hotel-staff-09.jpg': {
    vi: 'Nhân viên áo be đứng sau quầy đá cẩm thạch của spa, phía sau là bức tranh và bình cây cảnh',
    en: 'A spa attendant in a beige uniform behind the marble counter, a framed painting and a tall plant behind her',
    zh: '米色制服的水疗接待员立于大理石柜台后，身后是画作与高大的盆栽',
    ko: '대리석 카운터 뒤에 선 베이지색 유니폼의 스파 직원, 뒤로는 액자 그림과 큰 화분',
    ja: '大理石のカウンターに立つベージュの制服のスパスタッフ、背後に額装の絵と大きな観葉植物',
    th: 'พนักงานสปาในชุดสีเบจยืนหลังเคาน์เตอร์หินอ่อน ด้านหลังมีภาพวาดใส่กรอบและต้นไม้ใหญ่',
  },
  'Royal-Halong-Hotel-Spa-05.jpg': {
    vi: 'Hai nhân viên spa đứng sau quầy đá, một người bên máy tính xách tay đặt trên mặt quầy',
    en: 'Two spa staff at the stone counter, one of them beside the laptop on the desk',
    zh: '两位水疗员工站在石质柜台后，其中一位身旁放着笔记本电脑',
    ko: '석재 카운터에 선 스파 직원 두 명, 한 사람 곁에는 노트북',
    ja: '石のカウンターに立つスパスタッフ二名、うち一人の傍らにはノートパソコン',
    th: 'พนักงานสปาสองคนยืนที่เคาน์เตอร์หิน คนหนึ่งอยู่ข้างโน้ตบุ๊กที่วางบนเคาน์เตอร์',
  },
  'Royal-Halong-Hotel-staff-10.jpg': {
    vi: 'Kỹ thuật viên áo be xoa bóp vùng đầu cho khách nằm trên giường trị liệu, bên gối là nhành hoa vàng',
    en: 'A therapist in beige giving a head massage on the treatment bed, yellow blossoms laid beside the pillow',
    zh: '米色制服的理疗师为躺在按摩床上的客人做头部按摩，枕边放着黄色花枝',
    ko: '베이지 유니폼의 테라피스트가 트리트먼트 베드에 누운 손님에게 두피 마사지를 하고, 베개 옆에는 노란 꽃',
    ja: 'ベージュの制服のセラピストがトリートメントベッドの客にヘッドマッサージを施し、枕元には黄色い花',
    th: 'นักบำบัดในชุดสีเบจนวดศีรษะให้แขกที่นอนบนเตียงทรีตเมนต์ ข้างหมอนวางดอกไม้สีเหลือง',
  },
  'Royal-Halong-Hotel-Spa-09.jpg': {
    vi: 'Kỹ thuật viên Renata Spa xoa bóp vai cho khách, làn khói xông và hoa vàng ở tiền cảnh',
    en: 'A Renata Spa therapist working on a guest’s shoulder, aromatic steam and a yellow bloom in the foreground',
    zh: 'Renata Spa 理疗师为客人做肩部按摩，前景是袅袅蒸汽与黄色花朵',
    ko: '손님의 어깨를 마사지하는 Renata Spa 테라피스트, 전경에는 아로마 증기와 노란 꽃',
    ja: '客の肩をほぐす Renata Spa のセラピスト、手前にはアロマの蒸気と黄色い花',
    th: 'นักบำบัดของ Renata Spa นวดไหล่ให้แขก ฉากหน้ามีไอน้ำหอมและดอกไม้สีเหลือง',
  },
  'Royal-Halong-Hotel-Casino-BACCARAT.jpg': {
    vi: 'Nhân viên chia bài áo gile đen, nơ đỏ đứng bên bàn baccarat với các chồng phỉnh',
    en: 'A dealer in a black waistcoat and red bow tie at the baccarat table, stacks of chips in front of her',
    zh: '身着黑色马甲、系红色领结的荷官立于百家乐赌桌旁，面前码放着筹码',
    ko: '검은 조끼에 붉은 보타이를 맨 딜러가 선 바카라 테이블과 앞에 쌓인 칩',
    ja: '黒いベストに赤い蝶ネクタイのディーラーが立つバカラテーブルと、積み上げられたチップ',
    th: 'ดีลเลอร์ในเสื้อกั๊กดำผูกโบว์แดงยืนประจำโต๊ะบาคาร่า พร้อมกองชิปวางอยู่ด้านหน้า',
  },

  // --- còn lại của album trang chủ (chỉ dùng cho alt, KHÔNG đổi thứ tự) ---
  'Royal-Halong-Hotel-Restaurant-10.jpg': {
    vi: 'Bàn ăn bày cá nướng, tôm rim và gỏi trên đĩa trắng, khăn ăn gấp hình chóp đặt từng chỗ',
    en: 'A table laid with grilled fish, prawns and a salad on white dishes, napkins folded into cones at each setting',
    zh: '餐桌上以白瓷盛着烤鱼、焖虾与凉拌菜，每个席位摆着折成锥形的餐巾',
    ko: '흰 접시에 담긴 구운 생선과 조린 새우, 겉절이가 놓인 식탁과 자리마다 원뿔로 접은 냅킨',
    ja: '白い器に盛った焼き魚、海老の煮付け、和え物を並べた食卓と、席ごとに円錐に折られたナプキン',
    th: 'โต๊ะอาหารจัดปลาย่าง กุ้งผัด และยำในจานขาว พร้อมผ้าเช็ดปากพับทรงกรวยทุกที่นั่ง',
  },
  'Royal-Halong-Hotel-Restaurant-07.jpg': {
    vi: 'Phòng ăn với ghế bọc xanh và bàn phủ khăn đỏ, quầy buffet chạy dọc tường và hoạ tiết nốt nhạc trang trí',
    en: 'The dining room with green upholstered chairs and red-clothed tables, the buffet counter along the wall and musical-note artwork',
    zh: '餐厅内绿色软包座椅与铺红色台布的餐桌，自助餐台沿墙排开，墙面饰以音符图案',
    ko: '초록 패브릭 의자와 붉은 테이블보의 식당, 벽을 따라 놓인 뷔페 카운터와 음표 장식',
    ja: '緑の張り椅子と赤いクロスのテーブルが並ぶレストラン、壁沿いのビュッフェカウンターと音符の装飾',
    th: 'ห้องอาหารที่มีเก้าอี้บุผ้าสีเขียวและโต๊ะปูผ้าสีแดง เคาน์เตอร์บุฟเฟต์เรียงตามผนัง และงานตกแต่งลายตัวโน้ต',
  },
  'Royal-Halong-Hotel-Restaurant-09.jpg': {
    vi: 'Quầy bánh buffet với giỏ baguette, bánh sừng bò và tác phẩm sô-cô-la hình sừng dê ở giữa',
    en: 'The bakery counter: baskets of baguettes and croissants around a chocolate cornucopia centrepiece',
    zh: '面包台上摆着法棍与可颂的藤篮，中央是巧克力雕成的羊角造型',
    ko: '바게트와 크루아상 바구니가 둘러싼 베이커리 코너, 가운데에는 초콜릿으로 만든 뿔 모양 장식',
    ja: 'バゲットとクロワッサンの籠が並ぶベーカリーコーナー、中央にはチョコレート細工の角形オブジェ',
    th: 'เคาน์เตอร์เบเกอรี่ ตะกร้าบาแกตต์และครัวซองต์ล้อมงานประติมากรรมช็อกโกแลตทรงเขาสัตว์ตรงกลาง',
  },
  'Royal-Halong-Hotel-Spa-07.jpg': {
    vi: 'Quầy đón của spa trước tường gỗ sẫm, kệ bày gốm và chậu cây lớn hai bên',
    en: 'The spa reception against a dark timber wall, ceramics on the shelves and large plants either side',
    zh: '水疗前台立于深色木墙前，置物架上陈列陶器，两侧摆着大型绿植',
    ko: '짙은 원목 벽을 배경으로 한 스파 리셉션, 선반의 도자기와 양옆의 큰 화분',
    ja: '濃い木目の壁を背にしたスパのレセプション、棚に並ぶ陶器と両脇の大きな観葉植物',
    th: 'เคาน์เตอร์ต้อนรับสปาหน้าผนังไม้สีเข้ม มีเครื่องปั้นดินเผาบนชั้นวางและต้นไม้ใหญ่สองข้าง',
  },
  'Royal-Halong-Hotel-Experiance-Header-02.jpg': {
    vi: 'Hai ly cocktail chạm nhau bên bể bơi, một vị khách mặc đồ bơi hồng ngồi phía sau',
    en: 'Two cocktails clinking beside the pool, a guest in a pink swimsuit seated behind',
    zh: '两杯鸡尾酒在泳池畔碰杯，身后是穿粉色泳装的客人',
    ko: '수영장 옆에서 잔을 부딪치는 칵테일 두 잔, 뒤에는 분홍 수영복 차림의 손님',
    ja: 'プールサイドで触れ合う二杯のカクテル、奥にはピンクの水着の客',
    th: 'ค็อกเทลสองแก้วชนกันริมสระ ด้านหลังเป็นแขกในชุดว่ายน้ำสีชมพู',
  },
} satisfies Record<string, Draft>

type AltName = keyof typeof ALT

/** Ảnh trong album: alt tra thẳng từ bảng ALT ở trên, không viết rời rạc ở
 * nhiều chỗ — cùng một tấm ảnh dùng lại ở album khác phải có cùng mô tả. */
function albumFig(name: AltName) {
  return dfig(name, ALT[name])
}

// ---------------------------------------------------------------------------
// Các album
// ---------------------------------------------------------------------------

/**
 * Thứ tự ảnh đi theo một vòng đến - ở - về, không theo thứ tự file của bản
 * clone. Ba tấm bị bỏ so với bản clone:
 *   - `Royal-Halong-Hotel-staff-07/08` -> chỉ còn ở album NHÂN VIÊN (bản clone
 *     đặt đúng hai tấm này mở đầu cả hai album, đọc thành lặp).
 *   - `Royal-Ha-Long-Blue-Sea-02` -> chuyển sang CUNG HỘI NGHỊ: đó là PHÒNG
 *     HỌP ốp gỗ, không phải cảnh khách sạn.
 */
const ALBUM_KHACH_SAN: AltName[] = [
  'Royal-Ha-Long-Gallery-Hotel-03.jpg',
  'Royal-Ha-Long-Gallery-Hotel-06.jpg',
  'Royal-Ha-Long-Lobby-01.jpg',
  'Royal-Halong-Hotel-piano-bar-01.jpg',
  'Royal-Halong-Hotel-news-header.jpg',
  'Royal-Halong-Hotel-Gallery-header.jpg',
  'Royal-Ha-Long-Gallery-Hotel-14.jpg',
  'Royal-Ha-Long-Gallery-Hotel-12.jpg',
  'Royal-Ha-Long-Gallery-Hotel-11.jpg',
  'Royal-Ha-Long-Gallery-Hotel-04.jpg',
  'Royal-Ha-Long-Hotel-Overview-01.jpg',
  'Royal-Halong-Hotel-four-season-swimming-pool-01.jpg',
  'Royal-Ha-Long-GYM-02.jpg',
  'LNB03337-2.jpg',
  'LNB03302-2.jpg',
  'Royal-Ha-Long-offer-02.jpg',
  'Royal-Halong-Hotel-Model-03.jpg',
]

/**
 * Deluxe -> Premium -> Suite -> Villa. Hai tấm của bản clone bị bỏ vì TRÙNG
 * ẢNH chứ không phải trùng chủ đề:
 *   - `Royal-Halong-Hotel-Premiun-05.jpg` giống `Deluxe-09.jpg` tới từng byte
 *     (cùng md5 -> cùng assetId), nên bản clone thực chất hiện một tấm hai lần.
 *   - `Royal-Ha-Long-Suite-08.jpg` và `Royal-Halong-Hotel-Suite-08.jpg` là
 *     hai bản chụp gần như trùng khít của `Suite-14` / `Suite-02`.
 */
const ALBUM_LUU_TRU: AltName[] = [
  'Royal-Halong-Hotel-Deluxe-04.jpg',
  'Royal-Halong-Hotel-Deluxe-07.jpg',
  'Royal-Halong-Hotel-Premiun-01.jpg',
  'Royal-Halong-Hotel-Deluxe-09.jpg',
  'Royal-Halong-Hotel-Suite-02.jpg',
  'Royal-Halong-Hotel-Suite-15.jpg',
  'Royal-Halong-Hotel-Suite-03.jpg',
  'Royal-Halong-Hotel-Suite-11.jpg',
  'Royal-Halong-Hotel-Suite-14.jpg',
  'Royal-Halong-Hotel-Suite-13.jpg',
  'Royal-Halong-Hotel-Suite-05.jpg',
  'Royal-Halong-Hotel-Suite-06.jpg',
  'Royal-Halong-Hotel-Villas-05.jpg',
  'Royal-Halong-Hotel-Villas-02.jpg',
  'Royal-Halong-Hotel-Villas-08.jpg',
  'Royal-Halong-Hotel-Villas-10.jpg',
  'Royal-Halong-Hotel-Villas-04.jpg',
  'Royal-Ha-Long-Villas-room-01.jpg',
  'Royal-Ha-Long-Villas-05.jpg',
  'Royal-Ha-Long-Villas-04.jpg',
]

/** Không gian trống -> các kiểu kê bàn -> sự kiện thật. Nhóm C (Hội nghị &
 * Tiệc cưới) tham chiếu album này, nên nó phải tự đứng được ngoài trang này. */
const ALBUM_HOI_NGHI: AltName[] = [
  'ROYAL-INTERNATIONAL-CONVENTION-PALACE2.jpg',
  'Royal-Ha-Long-Gallery-Convention-13.jpg',
  'Royal-Ha-Long-Convention-01.jpg',
  'Royal-Ha-Long-Gallery-Convention-16.jpg',
  'Royal-Ha-Long-Gallery-Convention-15.jpg',
  'Royal-Ha-Long-Gallery-Convention-22.jpg',
  'Royal-Ha-Long-Gallery-Convention-21.jpg',
  'Royal-Ha-Long-Gallery-Convention-23.jpg',
  'Royal-Ha-Long-Gallery-Convention-14.jpg',
  'HOANG-GIA-2.jpg',
  'Royal-Halong-Hotel-Convention-01.jpg',
  'Royal-Ha-Long-Blue-Sea-02.jpg',
  'Royal-Ha-Long-Gallery-Convention-26.jpg',
  'Royal-Ha-Long-Gallery-Convention-17.jpg',
  'Royal-Ha-Long-Gallery-Convention-18.jpg',
  'Royal-Ha-Long-Gallery-Convention-19.jpg',
  'Royal-Ha-Long-Gallery-Convention-20.jpg',
  'Convention-Center-Halong-04.jpg',
  'Royal-Ha-Long-Gallery-Convention-05.jpg',
  '313140337_799008504854810_8995538261083883442_n.jpeg',
  'Royal-Ha-Long-Gallery-Convention-10.jpg',
]

/** Chuẩn bị -> lễ -> tiệc trong sảnh -> tiệc bên bể bơi. */
const ALBUM_TIEC_CUOI: AltName[] = [
  'Royal-Ha-Long-Gallery-Wedding-08.jpg',
  'Royal-Ha-Long-Wedding-03.jpg',
  'JAN10TH-STUDIO-200-1.jpg',
  'JAN10TH-STUDIO-231-1.jpg',
  'Royal-Ha-Long-Gallery-Wedding-09.jpg',
  'Royal-Ha-Long-Gallery-Wedding-12.jpg',
  'Royal-Ha-Long-Wedding-02.jpg',
  'Royal-Ha-Long-Gallery-Wedding-0.jpg',
  'Royal-Ha-Long-Gallery-Wedding-05.jpg',
  'Royal-Ha-Long-Gallery-Wedding-04.jpg',
  'Royal-Ha-Long-Gallery-Wedding-25.jpg',
  'Royal-Ha-Long-Gallery-Wedding-15.jpg',
  'Royal-Ha-Long-Gallery-Wedding-23.jpg',
  'Royal-Ha-Long-Wedding-07.jpg',
  'Royal-Ha-Long-Gallery-Wedding-07.jpg',
  'Royal-Ha-Long-Wedding-09.jpg',
  'Royal-Ha-Long-Gallery-Wedding-19.jpg',
  'Royal-Ha-Long-Gallery-Wedding-20.jpg',
  'Royal-Ha-Long-Wedding-10.jpg',
  'Royal-Ha-Long-Gallery-Wedding-21.jpg',
]

/** Đón khách -> quầy lễ tân -> buồng phòng -> bếp -> spa -> casino. */
const ALBUM_NHAN_VIEN: AltName[] = [
  'Royal-Halong-Hotel-staff-04.jpg',
  'Royal-Halong-Hotel-staff-03.jpg',
  'Royal-Halong-Hotel-staff-02.jpg',
  'Royal-Halong-Hotel-staff-05.jpg',
  'Royal-Halong-Hotel-staff-08.jpg',
  'Royal-Halong-Hotel-staff-07.jpg',
  'Royal-Halong-Hotel-staff-06.jpg',
  'Royal-Ha-Long-Gallery-Staff-04.jpg',
  'Royal-Ha-Long-Restaurant-Phuc-Vien-05.jpg',
  'Royal-Ha-Long-Restaurant-Phuc-Vien-04.jpg',
  'Royal-Halong-Hotel-staff-09.jpg',
  'Royal-Halong-Hotel-Spa-05.jpg',
  'Royal-Halong-Hotel-staff-10.jpg',
  'Royal-Halong-Hotel-Spa-09.jpg',
  'Royal-Halong-Hotel-Casino-BACCARAT.jpg',
]

const ALBUMS = [
  {
    id: 'galleryAlbum.khach-san-villas',
    slug: 'khach-san-villas',
    order: 0,
    title: {
      vi: 'KHÁCH SẠN & VILLAS',
      en: 'THE HOTEL & VILLAS',
      zh: '酒店与别墅',
      ko: '호텔 & 빌라',
      ja: 'ホテル＆ヴィラ',
      th: 'โรงแรมและวิลลา',
    } as Draft,
    images: ALBUM_KHACH_SAN,
  },
  {
    id: 'galleryAlbum.luu-tru',
    slug: 'luu-tru',
    order: 1,
    title: {
      vi: 'LƯU TRÚ',
      en: 'ACCOMMODATION',
      zh: '住宿',
      ko: '객실',
      ja: '客室',
      th: 'ห้องพัก',
    } as Draft,
    images: ALBUM_LUU_TRU,
  },
  {
    id: 'galleryAlbum.cung-hoi-nghi',
    slug: 'cung-hoi-nghi',
    order: 2,
    title: {
      vi: 'CUNG HỘI NGHỊ',
      en: 'CONVENTION PALACE',
      zh: '会议宫',
      ko: '컨벤션 팰리스',
      ja: 'コンベンションパレス',
      th: 'ศูนย์ประชุม',
    } as Draft,
    images: ALBUM_HOI_NGHI,
  },
  {
    id: 'galleryAlbum.tiec-cuoi',
    slug: 'tiec-cuoi',
    order: 3,
    title: {
      vi: 'TIỆC CƯỚI',
      en: 'WEDDINGS',
      zh: '婚礼',
      ko: '웨딩',
      ja: 'ウエディング',
      th: 'งานแต่งงาน',
    } as Draft,
    images: ALBUM_TIEC_CUOI,
  },
  {
    id: 'galleryAlbum.nhan-vien',
    slug: 'nhan-vien',
    order: 4,
    title: {
      vi: 'NHÂN VIÊN',
      en: 'OUR PEOPLE',
      zh: '我们的团队',
      ko: '우리 직원들',
      ja: 'スタッフ',
      th: 'ทีมงานของเรา',
    } as Draft,
    images: ALBUM_NHAN_VIEN,
  },
] as const

// ---------------------------------------------------------------------------
// galleryAlbum.trang-chu — TRANG CHỦ ĐANG ĐỌC ALBUM NÀY.
//
// Chỉ được thêm `alt`. Không xoá ảnh, không đổi thứ tự, không đổi `title.vi`.
// Vì thế ở đây KHÔNG dựng lại mảng `images` mà vá từng phần tử theo `_key`
// (`images[_key=="img-3"].alt`) — kể cả khi ai đó vừa sửa album trong Studio,
// patch này cũng chỉ chạm đúng field `alt`.
// ---------------------------------------------------------------------------
/**
 * `Royal-Ha-Long-slider-02.jpg` là TÊN FILE DUY NHẤT trong cả kho bị trùng:
 * `2023/05/` (2560×1707) và `2023/07/` (1200×601) là hai bản cắt khác nhau
 * của cùng một khung cảnh sảnh, và đã lên Sanity thành HAI asset khác nhau.
 * `assetIdFor()` trả bản 2023/07 (đăng ký sau), còn album trang chủ đang trỏ
 * bản 2023/05 — nên ở đây phải ghim thẳng `_ref` thay vì tra theo tên, nếu
 * không guard bên dưới sẽ dừng script.
 */
const SLIDER_02_HOME_REF = 'image-7741ccd001610734a277ed3f7d57bb4817d03b75-2560x1707-jpg'

type HomeAlt = AltName | { name: AltName; ref: string }

const TRANG_CHU_ALT: HomeAlt[] = [
  'Royal-Halong-Hotel-staff-05.jpg',
  'Royal-Halong-Hotel-staff-07.jpg',
  'Royal-Ha-Long-offer-01.jpg',
  { name: 'Royal-Ha-Long-slider-02.jpg', ref: SLIDER_02_HOME_REF },
  'ROYAL-INTERNATIONAL-CONVENTION-PALACE2.jpg',
  'Royal-Ha-Long-Hotel-11.jpg',
  'Royal-Ha-Long-slider-05.jpg',
  'Royal-Halong-Hotel-Restaurant-10.jpg',
  'Royal-Halong-Hotel-Restaurant-07.jpg',
  'Royal-Halong-Hotel-Premiun-02.jpg',
  'Royal-Halong-Hotel-Suite-01.jpg',
  'Royal-Halong-Hotel-Spa-07.jpg',
  'Royal-Halong-Hotel-Spa-09.jpg',
  'Royal-Halong-Hotel-Experiance-Header-02.jpg',
  'Royal-Halong-Hotel-staff-10.jpg',
  'Royal-Halong-Hotel-Casino-BACCARAT.jpg',
  'Royal-Halong-Hotel-Restaurant-09.jpg',
  'Royal-Ha-Long-Gallery-Hotel-04.jpg',
]

async function patchTrangChuAlt() {
  const id = 'galleryAlbum.trang-chu'
  const doc = await writeClient.fetch<{ images?: { _key: string; asset?: { _ref: string } }[] }>(
    `*[_id == $id][0]{ images[]{ _key, asset } }`,
    { id },
  )
  const images = doc?.images ?? []
  if (images.length !== TRANG_CHU_ALT.length) {
    throw new Error(
      `${id}: album có ${images.length} ảnh nhưng bảng alt có ${TRANG_CHU_ALT.length}. ` +
        'Trang chủ đã đổi album — đối chiếu lại trước khi ghi, ĐỪNG đoán.',
    )
  }
  const patch: Record<string, unknown> = {}
  images.forEach((img, i) => {
    const entry = TRANG_CHU_ALT[i]
    const name = typeof entry === 'string' ? entry : entry.name
    const expected = typeof entry === 'string' ? assetIdFor(name) : entry.ref
    if (!expected || img.asset?._ref !== expected) {
      throw new Error(
        `${id}: ảnh thứ ${i + 1} (_key=${img._key}) không phải "${name}". ` +
          'Thứ tự album trang chủ đã đổi — dừng lại thay vì gắn nhầm alt.',
      )
    }
    patch[`images[_key=="${img._key}"].alt`] = draft(ALT[name])
  })
  // Thêm bản dịch cho `title`/`slug` (vi giữ NGUYÊN giá trị cũ) — không đụng
  // tới `images` ngoài field `alt`.
  patch.title = draft({
    vi: 'THƯ VIỆN ẢNH',
    en: 'GALLERY',
    zh: '图片库',
    ko: '갤러리',
    ja: 'ギャラリー',
    th: 'แกลเลอรี',
  })
  patch.slug = slugAll('trang-chu')
  await patchDoc(id, patch)
}

// ---------------------------------------------------------------------------
// page.our-gallery
// ---------------------------------------------------------------------------

function carousel(albumId: string, heading: Draft) {
  return {
    _key: key('sec'),
    _type: 'galleryCarouselSection',
    heading: draft(heading),
    album: { _type: 'reference', _ref: albumId },
  }
}

function imageText(opts: {
  eyebrow: Draft
  heading: Draft
  content: DraftBlock
  image: AltName
  imageSide: 'left' | 'right'
  tone: 'white' | 'cream' | 'ink'
}) {
  return {
    _key: key('sec'),
    _type: 'imageTextSection',
    eyebrow: draft(opts.eyebrow),
    heading: draft(opts.heading),
    content: draftBlock(opts.content),
    image: albumFig(opts.image),
    imageSide: opts.imageSide,
    imageFit: 'cover',
    tone: opts.tone,
  }
}

function buildSections() {
  return [
    // 1. Hero — PHẢI là section đầu tiên: header chỉ trong suốt khi
    //    `.rhl-hero` là con đầu của <main> (xem CLAUDE.md § Header).
    {
      _key: key('sec'),
      _type: 'heroSection',
      heading: draft({
    vi: 'THƯ VIỆN ẢNH',
    en: 'GALLERY',
    zh: '图片库',
    ko: '갤러리',
    ja: 'ギャラリー',
    th: 'แกลเลอรี',
  }),
      subheading: draft({
        vi: 'Khách sạn, phòng nghỉ, cung hội nghị, tiệc cưới — và những người làm nên tất cả.',
        en: 'The hotel, the rooms, the convention palace, the weddings — and the people behind them.',
        zh: '酒店、客房、会议宫、婚礼——以及成就这一切的人。',
        ko: '호텔과 객실, 컨벤션 팰리스, 웨딩 — 그리고 그 모든 것을 만드는 사람들.',
        ja: 'ホテル、客室、コンベンションパレス、ウエディング——そしてそれを支える人たち。',
        th: 'โรงแรม ห้องพัก ศูนย์ประชุม งานแต่งงาน และผู้คนเบื้องหลังทั้งหมดนี้',
      }),
      background: albumFig('Royal-Halong-Hotel-Gallery-header.jpg'),
      height: 'medium',
    },

    // 2. Mục lục. Nền `cream-alt` giống carousel, nên giữa hai khối này luôn
    //    có một `imageTextSection` tone `white` — hai dải cùng màu dính liền
    //    nhau thì mất hẳn nhịp.
    {
      _key: key('sec'),
      _type: 'cardGridSection',
      heading: draft({
        vi: 'NĂM ALBUM',
        en: 'FIVE ALBUMS',
        zh: '五个相册',
        ko: '다섯 개의 앨범',
        ja: '五つのアルバム',
        th: 'ห้าอัลบั้ม',
      }),
      subheading: draft({
        vi: 'Chọn nơi quý khách muốn xem trước — mỗi thẻ đưa thẳng tới album bên dưới.',
        en: 'Start wherever you like — each card jumps straight to its album below.',
        zh: '从您最想看的地方开始——每张卡片都会直接跳至下方对应的相册。',
        ko: '보고 싶은 곳부터 시작해 보세요. 각 카드는 아래의 해당 앨범으로 바로 이동합니다.',
        ja: 'ご覧になりたいところからどうぞ。各カードは下のアルバムへ直接移動します。',
        th: 'เริ่มจากส่วนที่ท่านอยากดูก่อนได้เลย แต่ละการ์ดจะพาไปยังอัลบั้มด้านล่างทันที',
      }),
      // HAI cột, không phải ba. `.scrim-bottom` (globals.css) là một dải
      // nâu vàng cao CỐ ĐỊNH theo nội dung chữ bên trong nó (`pt-20` + tiêu
      // đề + hai dòng mô tả + nút ≈ 210px). Ở ba cột, thẻ chỉ cao 276px tại
      // 1440px -> màn phủ nuốt 76% ảnh và năm tấm ảnh bìa thành năm khối
      // vàng gần như không phân biệt được. Hai cột cho thẻ cao ~395px, cùng
      // dải chữ đó còn 54% — ảnh bìa lại đọc ra được là ảnh gì, đúng việc mà
      // một mục lục album phải làm.
      columns: 2,
      cards: [
        {
          _key: key('card'),
          _type: 'card',
          title: draft({
      vi: 'KHÁCH SẠN & VILLAS',
      en: 'THE HOTEL & VILLAS',
      zh: '酒店与别墅',
      ko: '호텔 & 빌라',
      ja: 'ホテル＆ヴィラ',
      th: 'โรงแรมและวิลลา',
    }),
          description: draft({
            vi: 'Mặt tiền, sảnh lớn, vườn, hai bể bơi và khu villa trong khuôn viên.',
            en: 'The facade, the lobby, the gardens, both pools and the villa grounds.',
            zh: '建筑外观、大堂、园景、两座泳池与别墅区。',
            ko: '건물 외관과 로비, 정원, 두 곳의 수영장, 그리고 빌라 구역.',
            ja: '外観、ロビー、庭園、二つのプール、そしてヴィラエリア。',
            th: 'อาคารด้านหน้า ล็อบบี้ สวน สระว่ายน้ำสองแห่ง และโซนวิลลา',
          }),
          image: albumFig('Royal-Ha-Long-Gallery-Hotel-03.jpg'),
          cta: dlinkAnchor('galleryAlbum.khach-san-villas', {
            vi: 'XEM ẢNH',
            en: 'VIEW PHOTOS',
            zh: '查看照片',
            ko: '사진 보기',
            ja: '写真を見る',
            th: 'ดูรูปภาพ',
          }),
        },
        {
          _key: key('card'),
          _type: 'card',
          title: draft({
      vi: 'LƯU TRÚ',
      en: 'ACCOMMODATION',
      zh: '住宿',
      ko: '객실',
      ja: '客室',
      th: 'ห้องพัก',
    }),
          description: draft({
            vi: 'Deluxe, Premium, Suite và các căn villa — cả phòng tắm lẫn góc làm việc.',
            en: 'Deluxe, Premium, Suite and the villas — bathrooms and working corners included.',
            zh: '豪华房、高级房、套房与别墅——浴室与工作区一并收录。',
            ko: '디럭스, 프리미엄, 스위트와 빌라 — 욕실과 업무 공간까지.',
            ja: 'デラックス、プレミアム、スイート、ヴィラ——バスルームやワークスペースまで。',
            th: 'ดีลักซ์ พรีเมียม สวีท และวิลลา รวมถึงห้องน้ำและมุมทำงาน',
          }),
          image: albumFig('Royal-Halong-Hotel-Suite-02.jpg'),
          cta: dlinkAnchor('galleryAlbum.luu-tru', {
            vi: 'XEM ẢNH',
            en: 'VIEW PHOTOS',
            zh: '查看照片',
            ko: '사진 보기',
            ja: '写真を見る',
            th: 'ดูรูปภาพ',
          }),
        },
        {
          _key: key('card'),
          _type: 'card',
          title: draft({
      vi: 'CUNG HỘI NGHỊ',
      en: 'CONVENTION PALACE',
      zh: '会议宫',
      ko: '컨벤션 팰리스',
      ja: 'コンベンションパレス',
      th: 'ศูนย์ประชุม',
    }),
          description: draft({
            vi: 'Các phòng họp, hội nghị quốc tế và tiệc gala đã diễn ra tại đây.',
            en: 'The meeting rooms, the international conferences and the galas held here.',
            zh: '各类会议厅，以及在此举办过的国际会议与晚会。',
            ko: '회의실과 이곳에서 열린 국제 회의, 갈라 행사.',
            ja: '各会議室と、ここで開かれた国際会議やガラ。',
            th: 'ห้องประชุมต่าง ๆ การประชุมนานาชาติ และงานกาลาที่จัดขึ้นที่นี่',
          }),
          image: albumFig('Royal-Ha-Long-Gallery-Convention-13.jpg'),
          cta: dlinkAnchor('galleryAlbum.cung-hoi-nghi', {
            vi: 'XEM ẢNH',
            en: 'VIEW PHOTOS',
            zh: '查看照片',
            ko: '사진 보기',
            ja: '写真を見る',
            th: 'ดูรูปภาพ',
          }),
        },
        {
          _key: key('card'),
          _type: 'card',
          title: draft({
      vi: 'TIỆC CƯỚI',
      en: 'WEDDINGS',
      zh: '婚礼',
      ko: '웨딩',
      ja: 'ウエディング',
      th: 'งานแต่งงาน',
    }),
          description: draft({
            vi: 'Lễ ngoài trời, tiệc trong sảnh và tiệc bên bể bơi khi trời đã tối.',
            en: 'Lawn ceremonies, ballroom receptions and parties by the pool after dark.',
            zh: '草坪仪式、宴会厅喜宴，以及入夜后的池畔派对。',
            ko: '잔디밭 예식과 연회장 피로연, 그리고 해가 진 뒤의 수영장 파티.',
            ja: '芝生での挙式、宴会場の披露宴、そして日が落ちてからのプールサイドパーティー。',
            th: 'พิธีบนสนามหญ้า งานเลี้ยงในห้องบอลรูม และปาร์ตี้ริมสระหลังตะวันตกดิน',
          }),
          image: albumFig('Royal-Ha-Long-Gallery-Wedding-0.jpg'),
          cta: dlinkAnchor('galleryAlbum.tiec-cuoi', {
            vi: 'XEM ẢNH',
            en: 'VIEW PHOTOS',
            zh: '查看照片',
            ko: '사진 보기',
            ja: '写真を見る',
            th: 'ดูรูปภาพ',
          }),
        },
        {
          _key: key('card'),
          _type: 'card',
          title: draft({
      vi: 'NHÂN VIÊN',
      en: 'OUR PEOPLE',
      zh: '我们的团队',
      ko: '우리 직원들',
      ja: 'スタッフ',
      th: 'ทีมงานของเรา',
    }),
          description: draft({
            vi: 'Lễ tân, buồng phòng, bếp, spa và sòng bài.',
            en: 'Reception, housekeeping, the kitchens, the spa and the casino.',
            zh: '前台、客房、厨房、水疗与娱乐场。',
            ko: '리셉션, 하우스키핑, 주방, 스파, 그리고 카지노.',
            ja: 'フロント、ハウスキーピング、厨房、スパ、カジノ。',
            th: 'แผนกต้อนรับ แม่บ้าน ครัว สปา และคาสิโน',
          }),
          image: albumFig('Royal-Halong-Hotel-staff-02.jpg'),
          cta: dlinkAnchor('galleryAlbum.nhan-vien', {
            vi: 'XEM ẢNH',
            en: 'VIEW PHOTOS',
            zh: '查看照片',
            ko: '사진 보기',
            ja: '写真を見る',
            th: 'ดูรูปภาพ',
          }),
        },
      ],
    },

    // 3–12. Mỗi album một cặp: khối ảnh + chữ (nền kem sáng) rồi tới carousel
    //       (nền kem đậm). Cặp cuối đổi sang nền tối để trang không kết thúc
    //       bằng năm dải giống hệt nhau.
    imageText({
      eyebrow: {
        vi: 'ROYAL HẠ LONG HOTEL',
        en: 'ROYAL HA LONG HOTEL',
        zh: 'ROYAL HA LONG HOTEL',
        ko: 'ROYAL HA LONG HOTEL',
        ja: 'ROYAL HA LONG HOTEL',
        th: 'ROYAL HA LONG HOTEL',
      },
      heading: {
        vi: 'Nhìn tận nơi trước khi đặt phòng',
        en: 'See the place before you book',
        zh: '预订之前，先看清每一处',
        ko: '예약하기 전에 직접 확인해 보세요',
        ja: 'ご予約の前に、実際の姿をご覧ください',
        th: 'ดูสถานที่จริงก่อนตัดสินใจจอง',
      },
      content: {
        vi: [
          'Toàn bộ ảnh trong trang này chụp tại Royal Hạ Long Hotel ở Bãi Cháy: cùng một khuôn viên, cùng những căn phòng và cùng những con người quý khách sẽ gặp khi tới.',
          'Album đầu tiên đi một vòng quanh khuôn viên — mặt tiền lúc chạng vạng, sảnh lớn, lối gạch đỏ dẫn xuống khu villa, hai bể bơi và phòng tập.',
        ],
        en: [
          'Every photograph on this page was taken at Royal Ha Long Hotel in Bai Chay: the same grounds, the same rooms and the same people you will meet on arrival.',
          'The first album walks the grounds — the facade at dusk, the lobby, the brick path down to the villas, both pools and the fitness room.',
        ],
        zh: [
          '本页所有照片均摄于拜寨的 Royal Ha Long Hotel：同样的园区、同样的客房，以及您抵达时会遇见的同一批同事。',
          '第一个相册带您绕园一周——暮色中的建筑外观、大堂、通往别墅区的红砖小径、两座泳池与健身房。',
        ],
        ko: [
          '이 페이지의 모든 사진은 바이짜이의 Royal Ha Long Hotel에서 촬영했습니다. 같은 부지, 같은 객실, 그리고 도착하실 때 만나게 될 같은 사람들입니다.',
          '첫 번째 앨범은 부지를 한 바퀴 돌아봅니다. 해질 녘의 외관, 로비, 빌라로 내려가는 붉은 벽돌길, 두 곳의 수영장과 피트니스룸입니다.',
        ],
        ja: [
          'このページの写真はすべて、バイチャイの Royal Ha Long Hotel で撮影したものです。同じ敷地、同じ客室、そしてご到着の際にお会いするのと同じスタッフです。',
          '最初のアルバムは敷地を一周します。夕暮れの外観、ロビー、ヴィラへ下る赤煉瓦の小径、二つのプール、そしてフィットネスルーム。',
        ],
        th: [
          'ภาพทุกภาพในหน้านี้ถ่ายที่ Royal Ha Long Hotel ในบ๊ายจ๋าย ทั้งพื้นที่ ห้องพัก และผู้คนชุดเดียวกับที่ท่านจะพบเมื่อมาถึง',
          'อัลบั้มแรกพาเดินรอบพื้นที่ ตั้งแต่อาคารด้านหน้ายามพลบค่ำ ล็อบบี้ ทางเดินอิฐแดงลงไปยังโซนวิลลา สระว่ายน้ำสองแห่ง และห้องออกกำลังกาย',
        ],
      },
      image: 'Royal-Ha-Long-Hotel-Overview-03.jpg',
      imageSide: 'right',
      tone: 'white',
    }),
    carousel('galleryAlbum.khach-san-villas', {
      vi: 'KHÁCH SẠN & VILLAS',
      en: 'THE HOTEL & VILLAS',
      zh: '酒店与别墅',
      ko: '호텔 & 빌라',
      ja: 'ホテル＆ヴィラ',
      th: 'โรงแรมและวิลลา',
    }),

    imageText({
      eyebrow: {
      vi: 'LƯU TRÚ',
      en: 'ACCOMMODATION',
      zh: '住宿',
      ko: '객실',
      ja: '客室',
      th: 'ห้องพัก',
    },
      heading: {
        vi: 'Từ phòng Deluxe tới villa riêng',
        en: 'From Deluxe rooms to private villas',
        zh: '从豪华客房到独栋别墅',
        ko: '디럭스 객실에서 프라이빗 빌라까지',
        ja: 'デラックスルームからプライベートヴィラまで',
        th: 'ตั้งแต่ห้องดีลักซ์จนถึงวิลลาส่วนตัว',
      },
      content: {
        vi: [
          'Phòng trong toà tháp nhìn ra vịnh Hạ Long; các căn villa nằm thấp hơn, giữa vườn thông và lối gạch đỏ.',
          'Album này đi lần lượt Deluxe — Premium — Suite — villa, gồm cả phòng tắm, góc làm việc và phòng khách riêng.',
        ],
        en: [
          'The tower rooms look out over Ha Long Bay; the villas sit lower down among the pines and the brick-red paths.',
          'The album runs in order — Deluxe, Premium, Suite, villa — bathrooms, working corners and private sitting rooms included.',
        ],
        zh: [
          '主楼客房可眺望下龙湾；别墅则位于较低处，隐于松林与红砖小径之间。',
          '相册依次呈现豪华房、高级房、套房与别墅，包含浴室、工作区与独立客厅。',
        ],
        ko: [
          '타워 객실은 하롱베이를 바라보고, 빌라는 그보다 낮은 곳 소나무 숲과 붉은 벽돌길 사이에 자리합니다.',
          '앨범은 디럭스 — 프리미엄 — 스위트 — 빌라 순으로 이어지며 욕실과 업무 공간, 별도의 거실까지 담았습니다.',
        ],
        ja: [
          'タワーの客室はハロン湾を望み、ヴィラはその下、松林と赤煉瓦の小径の間に建っています。',
          'アルバムはデラックス、プレミアム、スイート、ヴィラの順に並び、バスルームやワークスペース、専用リビングも収めています。',
        ],
        th: [
          'ห้องพักในอาคารสูงมองเห็นอ่าวฮาลอง ส่วนวิลลาตั้งอยู่ต่ำลงมาท่ามกลางแนวสนและทางเดินอิฐแดง',
          'อัลบั้มเรียงตามลำดับ ดีลักซ์ พรีเมียม สวีท และวิลลา รวมถึงห้องน้ำ มุมทำงาน และห้องนั่งเล่นส่วนตัว',
        ],
      },
      image: 'Royal-Halong-Hotel-Suite-01.jpg',
      imageSide: 'left',
      tone: 'white',
    }),
    carousel('galleryAlbum.luu-tru', {
      vi: 'LƯU TRÚ',
      en: 'ACCOMMODATION',
      zh: '住宿',
      ko: '객실',
      ja: '客室',
      th: 'ห้องพัก',
    }),

    imageText({
      eyebrow: {
        vi: 'HỘI NGHỊ & SỰ KIỆN',
        en: 'MEETINGS & EVENTS',
        zh: '会议与活动',
        ko: '회의 & 행사',
        ja: '会議・イベント',
        th: 'การประชุมและอีเวนต์',
      },
      heading: {
        vi: 'Nơi đã tổ chức EATOF và APEC Business Advisory Council',
        en: 'Host to EATOF and the APEC Business Advisory Council',
        zh: 'EATOF 与 APEC 企业咨询委员会的举办地',
        ko: 'EATOF와 APEC 기업인자문위원회가 열린 곳',
        ja: 'EATOF と APEC ビジネス諮問委員会を迎えた場所',
        th: 'สถานที่จัดการประชุม EATOF และสภาที่ปรึกษาธุรกิจเอเปก',
      },
      content: {
        vi: [
          'Cung Hội nghị Quốc tế Hoàng Gia nằm liền kề khách sạn, có đại sảnh, các phòng họp nhỏ và tiền sảnh riêng.',
          'Ảnh chụp ở nhiều kiểu kê bàn khác nhau — chữ U, lớp học, nhà hát, tiệc bàn tròn — để quý khách hình dung được không gian ứng với sự kiện của mình.',
        ],
        en: [
          'The Royal International Convention Palace stands beside the hotel, with a grand hall, smaller meeting rooms and a foyer of its own.',
          'The album shows it in several layouts — U-shape, classroom, theatre and banquet rounds — so you can picture your own event in the room.',
        ],
        zh: [
          'Royal International Convention Palace 与酒店毗邻，设有大宴会厅、多间中小型会议室与独立前厅。',
          '相册收录多种布场方式——U 形、课桌式、剧院式与圆桌宴会——方便您想象自己的活动在其中的样子。',
        ],
        ko: [
          'Royal International Convention Palace는 호텔 바로 옆에 있으며 대연회장과 중소 회의실, 별도의 로비를 갖추고 있습니다.',
          '앨범에는 ㄷ자형, 교실형, 극장형, 원형 테이블 연회 등 여러 배치가 담겨 있어 행사를 그려 보시기 쉽습니다.',
        ],
        ja: [
          'Royal International Convention Palace はホテルの隣に建ち、大ホールと中小の会議室、専用のホワイエを備えています。',
          'アルバムにはコの字型、スクール形式、シアター形式、円卓の宴会など複数のレイアウトを収め、ご自身の催しを思い描いていただけます。',
        ],
        th: [
          'Royal International Convention Palace ตั้งอยู่ติดกับโรงแรม มีห้องโถงใหญ่ ห้องประชุมขนาดย่อม และโถงต้อนรับของตัวเอง',
          'อัลบั้มรวมการจัดผังหลายแบบ ทั้งรูปตัวยู แบบห้องเรียน แบบโรงละคร และโต๊ะกลมสำหรับงานเลี้ยง เพื่อให้ท่านนึกภาพงานของตนเองได้',
        ],
      },
      image: 'Royal-Ha-Long-slider-05.jpg',
      imageSide: 'right',
      tone: 'white',
    }),
    carousel('galleryAlbum.cung-hoi-nghi', {
      vi: 'CUNG HỘI NGHỊ',
      en: 'CONVENTION PALACE',
      zh: '会议宫',
      ko: '컨벤션 팰리스',
      ja: 'コンベンションパレス',
      th: 'ศูนย์ประชุม',
    }),

    imageText({
      eyebrow: {
      vi: 'TIỆC CƯỚI',
      en: 'WEDDINGS',
      zh: '婚礼',
      ko: '웨딩',
      ja: 'ウエディング',
      th: 'งานแต่งงาน',
    },
      heading: {
        vi: 'Trên cỏ, trong sảnh, hoặc bên mặt nước',
        en: 'On the lawn, in the ballroom, or beside the water',
        zh: '在草坪上，在宴会厅里，或在水畔',
        ko: '잔디 위에서, 연회장 안에서, 혹은 물가에서',
        ja: '芝生の上で、宴会場で、あるいは水辺で',
        th: 'บนสนามหญ้า ในห้องบอลรูม หรือริมน้ำ',
      },
      content: {
        vi: [
          'Ba nơi tổ chức lễ và tiệc: bãi cỏ trước khách sạn, sảnh tiệc có đèn chùm pha lê, và khu bể bơi ngoài trời khi trời đã tối.',
          'Album giữ lại cả những khoảnh khắc trước giờ lễ — cô dâu chuẩn bị, bảng ảnh dựng ở sảnh, tháp ly và bánh cưới.',
        ],
        en: [
          'Three settings for the ceremony and the party: the lawn in front of the hotel, the chandeliered ballroom, and the outdoor pool once the light has gone.',
          'The album keeps the quieter moments too — the bride getting ready, the photo boards in the lobby, the coupe tower and the cake.',
        ],
        zh: [
          '仪式与喜宴有三处选择：酒店前的草坪、悬挂水晶吊灯的宴会厅，以及入夜后的室外泳池区。',
          '相册也留下了仪式前的片刻——新娘梳妆、大堂的照片展板、香槟塔与婚礼蛋糕。',
        ],
        ko: [
          '예식과 피로연을 위한 세 곳: 호텔 앞 잔디밭, 크리스털 샹들리에가 걸린 연회장, 그리고 해가 진 뒤의 야외 수영장입니다.',
          '앨범에는 예식 전의 순간도 담았습니다. 신부의 준비, 로비의 사진 보드, 샴페인 타워와 웨딩 케이크입니다.',
        ],
        ja: [
          '挙式と披露宴の場は三つ。ホテル前の芝生、クリスタルシャンデリアの宴会場、そして日が暮れてからの屋外プールです。',
          'アルバムには式前のひとときも収めています。花嫁の支度、ロビーのフォトボード、シャンパンタワー、そしてケーキ。',
        ],
        th: [
          'สามพื้นที่สำหรับพิธีและงานเลี้ยง ได้แก่ สนามหญ้าหน้าโรงแรม ห้องบอลรูมใต้โคมระย้าคริสตัล และสระว่ายน้ำกลางแจ้งหลังตะวันตกดิน',
          'อัลบั้มยังเก็บช่วงเวลาก่อนพิธีไว้ด้วย ทั้งตอนเจ้าสาวเตรียมตัว บอร์ดภาพในล็อบบี้ หอแก้วแชมเปญ และเค้กแต่งงาน',
        ],
      },
      image: 'Royal-Ha-Long-Wedding-05.jpg',
      imageSide: 'left',
      tone: 'white',
    }),
    carousel('galleryAlbum.tiec-cuoi', {
      vi: 'TIỆC CƯỚI',
      en: 'WEDDINGS',
      zh: '婚礼',
      ko: '웨딩',
      ja: 'ウエディング',
      th: 'งานแต่งงาน',
    }),

    imageText({
      eyebrow: {
        vi: 'CON NGƯỜI',
        en: 'OUR PEOPLE',
        zh: '我们的团队',
        ko: '우리 직원들',
        ja: 'スタッフ',
        th: 'ทีมงานของเรา',
      },
      heading: {
        vi: 'Những người quý khách sẽ gặp',
        en: 'The people you will meet',
        zh: '您将遇见的人',
        ko: '이곳에서 만나게 될 사람들',
        ja: 'ここでお会いする人たち',
        th: 'ผู้คนที่ท่านจะได้พบ',
      },
      content: {
        vi: [
          'Lễ tân, buồng phòng, bếp, spa, sòng bài — album cuối cùng dành cho những người có mặt trước khi quý khách tới và ở lại sau khi quý khách đi.',
          'Ngày lễ lớn, các nữ nhân viên mặc áo dài đỏ đón khách ở bậc thềm; ngày thường, họ vẫn ở đúng những vị trí đó.',
        ],
        en: [
          'Reception, housekeeping, the kitchens, the spa, the casino — the last album belongs to the people who are there before you arrive and after you leave.',
          'On festival days the women wear red ao dai on the front steps; on ordinary days they are at the same posts.',
        ],
        zh: [
          '前台、客房、厨房、水疗、娱乐场——最后一个相册属于那些在您抵达前就已就位、在您离开后仍守在此处的人。',
          '每逢节庆，女员工身着红色奥黛在台阶前迎宾；平日里，她们依旧守在同样的岗位。',
        ],
        ko: [
          '리셉션, 하우스키핑, 주방, 스파, 카지노 — 마지막 앨범은 손님이 오시기 전부터 자리를 지키고, 떠나신 뒤에도 남아 있는 사람들의 몫입니다.',
          '명절에는 여직원들이 붉은 아오자이를 입고 현관 계단에서 손님을 맞고, 평소에도 같은 자리를 지킵니다.',
        ],
        ja: [
          'フロント、ハウスキーピング、厨房、スパ、カジノ——最後のアルバムは、お客様がいらっしゃる前から居て、お発ちになった後も残る人たちのためのものです。',
          '祝祭の日には女性スタッフが赤いアオザイで玄関前に立ち、普段も同じ持ち場にいます。',
        ],
        th: [
          'แผนกต้อนรับ แม่บ้าน ครัว สปา คาสิโน อัลบั้มสุดท้ายเป็นของผู้ที่มาถึงก่อนท่านและยังอยู่ต่อหลังท่านกลับ',
          'ในวันเทศกาล พนักงานหญิงสวมอ่าวหญ่ายสีแดงต้อนรับแขกที่บันไดหน้าอาคาร ส่วนวันปกติพวกเธอก็ยังอยู่ที่เดิม',
        ],
      },
      image: 'Royal-Ha-Long-Gallery-Hotel-09.jpg',
      imageSide: 'right',
      tone: 'ink',
    }),
    carousel('galleryAlbum.nhan-vien', {
      vi: 'NHÂN VIÊN',
      en: 'OUR PEOPLE',
      zh: '我们的团队',
      ko: '우리 직원들',
      ja: 'スタッフ',
      th: 'ทีมงานของเรา',
    }),

    // 13. Chốt trang.
    {
      _key: key('sec'),
      _type: 'ctaBandSection',
      heading: draft({
        vi: 'Đến xem tận nơi',
        en: 'Come and see for yourself',
        zh: '欢迎亲临体验',
        ko: '직접 오셔서 확인해 보세요',
        ja: 'ぜひ実際にお越しください',
        th: 'เชิญมาสัมผัสด้วยตัวท่านเอง',
      }),
      description: draft({
        vi: 'Ảnh chỉ nói được một phần. Kiểm tra phòng trống và đặt trực tiếp trên website để nhận mức giá tốt nhất.',
        en: 'Photographs only go so far. Check availability and book direct for the best rate.',
        zh: '照片所能呈现的终归有限。查询空房并在官网直接预订，即可享最优价格。',
        ko: '사진으로 전할 수 있는 것에는 한계가 있습니다. 잔여 객실을 확인하시고 공식 홈페이지에서 직접 예약하시면 가장 좋은 요금으로 이용하실 수 있습니다.',
        ja: '写真でお伝えできることには限りがあります。空室状況をご確認のうえ、公式サイトから直接ご予約いただくと最もお得です。',
        th: 'ภาพถ่ายบอกได้เพียงส่วนหนึ่ง ตรวจสอบห้องว่างและจองโดยตรงผ่านเว็บไซต์เพื่อรับราคาที่ดีที่สุด',
      }),
      background: albumFig('Royal-Ha-Long-slider-01.jpg'),
      cta: dlinkTo('page.reservation', {
        vi: 'ĐẶT PHÒNG',
        en: 'BOOK NOW',
        zh: '立即预订',
        ko: '지금 예약',
        ja: '今すぐ予約',
        th: 'จองเลย',
      }),
    },
  ]
}

// ---------------------------------------------------------------------------

async function main() {
  resetKeys()

  for (const album of ALBUMS) {
    await patchDoc(album.id, {
      title: draft(album.title),
      slug: slugAll(album.slug),
      order: album.order,
      images: album.images.map((name) => albumFig(name)),
    })
  }

  await patchTrangChuAlt()

  await patchDoc('page.our-gallery', {
    title: draft({
      vi: 'THƯ VIỆN ẢNH',
      en: 'Gallery',
      zh: '图片库',
      ko: '갤러리',
      ja: 'ギャラリー',
      th: 'แกลเลอรี',
    }),
    slug: slugAll('our-gallery'),
    seo: {
      _type: 'seo',
      metaTitle: draft({
        vi: 'Thư viện ảnh — Royal Hạ Long Hotel',
        en: 'Gallery — Royal Ha Long Hotel',
        zh: '图片库 — Royal Ha Long Hotel',
        ko: '갤러리 — Royal Ha Long Hotel',
        ja: 'ギャラリー — Royal Ha Long Hotel',
        th: 'แกลเลอรี — Royal Ha Long Hotel',
      }),
      metaDescription: draft({
        vi: 'Ảnh thật chụp tại Royal Hạ Long Hotel, Bãi Cháy: khuôn viên và bể bơi, phòng Deluxe tới villa, cung hội nghị, tiệc cưới và đội ngũ nhân viên.',
        en: 'Real photographs from Royal Ha Long Hotel, Bai Chay: the grounds and pools, Deluxe rooms through to the villas, the convention palace, weddings and the team.',
        zh: '拍摄于拜寨 Royal Ha Long Hotel 的实景照片：园区与泳池、从豪华客房到别墅、会议宫、婚礼现场与酒店团队。',
        ko: '바이짜이 Royal Ha Long Hotel에서 촬영한 실제 사진: 부지와 수영장, 디럭스 객실부터 빌라까지, 컨벤션 팰리스, 웨딩, 그리고 직원들.',
        ja: 'バイチャイの Royal Ha Long Hotel で撮影した実際の写真：敷地とプール、デラックスからヴィラまでの客室、コンベンションパレス、ウエディング、そしてスタッフ。',
        th: 'ภาพถ่ายจริงจาก Royal Ha Long Hotel บ๊ายจ๋าย ทั้งพื้นที่โรงแรมและสระว่ายน้ำ ห้องดีลักซ์จนถึงวิลลา ศูนย์ประชุม งานแต่งงาน และทีมงาน',
      }),
      noIndex: false,
    },
    sections: buildSections(),
  })

  console.log('\n— Kiểm tra bản dịch —')
  let holes = 0
  for (const id of [
    'page.our-gallery',
    ...ALBUMS.map((a) => a.id),
    'galleryAlbum.trang-chu',
  ]) {
    holes += await assertFullyTranslated(id)
  }
  console.log(
    holes === 0
      ? '\n✓ Đủ 6 ngôn ngữ ở mọi field.'
      : `\n${holes} field chưa đủ 6 ngôn ngữ — sửa trong bảng ALT / buildSections() rồi chạy lại.`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
