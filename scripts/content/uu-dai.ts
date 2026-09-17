/**
 * Nhóm F — ƯU ĐÃI.
 *
 * Ghi lại `page.offers` + ba document `offer.*`.
 *
 * Trước script này, `page.offers` là một trang hỏng về mặt đọc được: tiêu đề
 * trang chính là tên MỘT chương trình buffet, và ba `richTextSection` nhồi
 * toàn văn ba chương trình (giá, ngày, điều kiện, emoji, hotline) vào những
 * khối chữ liền mạch không phân cấp, không ảnh — trong khi cả ba chương trình
 * ĐÃ có document `offer.*` riêng với trang chi tiết riêng mà trang danh mục
 * không hề liên kết tới.
 *
 * Sau script này `page.offers` là một trang danh mục đúng nghĩa (hero → dẫn
 * nhập → lưới thẻ trỏ sang ba trang chi tiết → hai khối ảnh-chữ → dải CTA), và
 * toàn văn chương trình nằm đúng chỗ của nó: trong `offer.body`, có tiêu đề
 * `h3` và danh sách gạch đầu dòng cho giá/điều kiện.
 *
 * NGUỒN SỐ LIỆU: `offers/index.html` (bản clone) — không bịa thêm gì. Ba con
 * số duy nhất KHÔNG có trong phần chữ của bản clone mà lấy từ chính ấn phẩm
 * của chương trình (ảnh KV đã nằm trong Sanity) là khung "giờ vàng" và mức
 * giảm 20% của bún bề bề; xem ghi chú tại chỗ.
 *
 * VÒNG 2 (dịch): đủ SÁU ngôn ngữ ở mọi field. Vì thế script không còn helper
 * `draft*` nữa mà dùng thẳng `loc()` / `fig()` / `linkTo()` / `linkOut()` của
 * `build.ts` — chúng ném lỗi ngay khi thiếu một ngôn ngữ, nên chỗ sót không
 * thể lọt lên dataset. Riêng khối Portable Text vẫn dùng `richLoc()` bên dưới
 * (xem lý do ở `line()`).
 *
 * Chạy: `npx tsx scripts/content/uu-dai.ts`  (idempotent)
 */
import { LOCALES, type Locale } from '../../lib/i18n'
import { key, resetKeys, loc, fig, linkTo, linkOut } from './build'
import { patchDoc, assertFullyTranslated } from './write'

/* -------------------------------------------------------------------------
   Khối Portable Text có phân cấp + liên kết.
   ---------------------------------------------------------------------- */

/**
 * Một dòng nội dung -> một block Portable Text.
 *
 * Cú pháp rút gọn dùng trong bảng nội dung bên dưới:
 *   `### …`  -> tiêu đề h3
 *   `#### …` -> tiêu đề h4
 *   `- …`    -> mục gạch đầu dòng
 *   `[chữ](https://…)` -> liên kết (ở bất kỳ đâu trong dòng)
 *
 * Tự viết thay vì dùng `p()`/`li()` của `build.ts` vì hai hàm đó không dựng
 * được `markDefs` — mà ba chương trình đều có ít nhất một liên kết thật
 * (bảng giá tiệc cưới, website khách sạn, hai số đường dây nóng) cần bấm được
 * chứ không phải chữ trần.
 *
 * `blank` chỉ bật cho `http(s)`: mở `tel:` trong tab mới để lại một tab trắng
 * trên máy tính để bàn.
 */
function line(text: string) {
  let style = 'normal'
  let listItem: string | undefined
  let body = text

  if (body.startsWith('#### ')) {
    style = 'h4'
    body = body.slice(5)
  } else if (body.startsWith('### ')) {
    style = 'h3'
    body = body.slice(4)
  } else if (body.startsWith('- ')) {
    listItem = 'bullet'
    body = body.slice(2)
  }

  const markDefs: Record<string, unknown>[] = []
  const children: Record<string, unknown>[] = []
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g
  let cursor = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(body)) !== null) {
    if (match.index > cursor) {
      children.push({ _key: key('s'), _type: 'span', text: body.slice(cursor, match.index), marks: [] })
    }
    const markKey = key('m')
    const href = match[2]
    markDefs.push({ _key: markKey, _type: 'link', href, blank: /^https?:\/\//.test(href) })
    children.push({ _key: key('s'), _type: 'span', text: match[1], marks: [markKey] })
    cursor = match.index + match[0].length
  }
  if (cursor < body.length) {
    children.push({ _key: key('s'), _type: 'span', text: body.slice(cursor), marks: [] })
  }

  return {
    _key: key('b'),
    _type: 'block',
    style,
    markDefs,
    children,
    ...(listItem ? { listItem, level: 1 } : {}),
  }
}

/**
 * `blockLoc()` của `build.ts` cho sáu ngôn ngữ, nhưng đi qua `line()` nên giữ
 * được `### ` và `[chữ](url)`. Kiểu `Record<Locale, string[]>` bắt trình biên
 * dịch báo lỗi ngay khi thiếu một ngôn ngữ.
 */
function richLoc(v: Record<Locale, string[]>): Record<Locale, unknown[]> {
  const out = {} as Record<Locale, unknown[]>
  for (const l of LOCALES) {
    const lines = v[l]
    if (!lines || lines.length === 0) throw new Error(`richLoc(): thiếu bản dịch "${l}"`)
    out[l] = lines.map(line)
  }
  return out
}

/* -------------------------------------------------------------------------
   Số liệu chung — lấy nguyên từ bản clone. Giá, ngày, số điện thoại và tên
   món giữ NGUYÊN ở cả sáu ngôn ngữ; chỉ phần diễn giải được dịch.
   ---------------------------------------------------------------------- */

const HOTLINE = '0904 030 222 – 0904 120 900'
const EMAIL = 'info@royalhalonghotel.com'
const WEBSITE = 'www.royalhalonghotel.com'
/**
 * Địa chỉ website hiện dưới dạng CHỮ THUẦN, không phải liên kết.
 *
 * Bản trước trỏ `[www.royalhalonghotel.com](https://www.royalhalonghotel.com/)`
 * — tức một liên kết dẫn khách RỜI KHỎI site này sang site gốc. Đó đúng là
 * thứ `tests/e2e/routes.spec.ts` ("không còn LIÊN KẾT trỏ domain gốc") sinh
 * ra để chặn, và nó bắt được ở cả ba trang ưu đãi × hai locale.
 *
 * Giữ nguyên chuỗi chữ vì bản clone có in địa chỉ đó trên tờ thông tin
 * chương trình — chỉ bỏ phần `href`. Khách đang ở đúng website ấy rồi; một
 * nút bấm quay về chính nơi họ đang đứng không thêm gì, mà lại gửi họ sang
 * một máy chủ khác.
 */
const WEBSITE_MD = WEBSITE
/** Hai số đường dây nóng, bấm gọi được — dùng TRONG Portable Text. */
const HOTLINE_MD = '[0904 030 222](tel:+84904030222) – [0904 120 900](tel:+84904120900)'
const EMAIL_MD = `[${EMAIL}](mailto:${EMAIL})`

const OFFER_BUFFET = 'offer.buffet-mung-dai-le-2-9-hao-khi-viet-nam-tinh-hoa-hoi-tu-chi-tu-500-000vnd-khach'
const OFFER_WEDDING = 'offer.dam-cuoi-co-tich-ben-vinh-di-san-tu-400-000-vnd-khach'
const OFFER_BUNBEBE = 'offer.series-am-thuc-di-san-bun-be-be'

/**
 * Tên Cung Hội nghị ở bốn ngôn ngữ mới.
 *
 * `page.royal-international-convention-palace` (nhóm C) hiện mới có `vi` + `en`,
 * nên bốn dạng dưới đây là do nhóm F đặt. Đã ghi vào sổ cặp để nhóm C dùng
 * CÙNG dạng — hai trang gọi cùng một toà nhà bằng hai cái tên là lỗi nặng hơn
 * cả chưa dịch.
 */
const PALACE = {
  vi: 'Cung Hội nghị Quốc tế Hoàng Gia Hạ Long',
  en: 'Royal International Convention Palace',
  zh: '下龙皇家国际会议宫',
  ko: '하롱 로열 인터내셔널 컨벤션 팰리스',
  ja: 'ロイヤル・インターナショナル・コンベンション・パレス（ハロン）',
  th: 'รอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ ฮาลอง',
}

/** Nhãn lặp lại — lấy đúng dạng đã chốt trong `GLOSSARY.md`. */
const VIEW_DETAILS = loc({
  vi: 'XEM CHI TIẾT',
  en: 'VIEW DETAILS',
  zh: '查看详情',
  ko: '자세히 보기',
  ja: '詳細を見る',
  th: 'ดูรายละเอียด',
})

/** CTA của hai chương trình ẩm thực — đích là trang Ẩm thực, xem ghi chú ở `CTA_DINING`. */
const CTA_DINING = linkTo('page.culinary', {
  vi: 'XEM NHÀ HÀNG & BAR',
  en: 'SEE OUR RESTAURANTS & BARS',
  zh: '查看餐厅与酒吧',
  ko: '레스토랑 & 바 보기',
  ja: 'レストラン・バーを見る',
  th: 'ดูร้านอาหารและบาร์',
})

/* -------------------------------------------------------------------------
   Ảnh (10 ảnh của trang `offers` trong IMAGES.md + 1 ảnh ưu đãi dùng cho dải
   CTA). Alt tả THỨ CÓ TRONG ẢNH — ba ảnh chương trình là ấn phẩm quảng cáo
   có chữ in sẵn, nên alt nói rõ "áp phích" và nhắc thông tin chính trên đó.
   ---------------------------------------------------------------------- */

const ALT_BUFFET = {
  vi: 'Áp phích đỏ chương trình buffet "Hào Khí Việt Nam": dãy khay hâm nóng, hải sản và bánh ngọt bày kín bàn tiệc, phía trên là lá cờ đỏ sao vàng và pháo hoa trên nền thành phố',
  en: 'A red poster for the "Spirit of Vietnam" buffet: rows of chafing dishes, seafood and pastries filling a banquet table, with the Vietnamese flag and fireworks above a city skyline',
  zh: '「越南豪情」自助晚宴的红色海报：成排保温餐炉、海鲜与甜点摆满宴会长桌，上方是金星红旗与城市夜空中绽放的烟花',
  ko: '"베트남의 기상" 뷔페를 알리는 붉은 포스터: 연회 테이블을 가득 채운 보온 용기와 해산물, 디저트가 놓이고 그 위로 금성홍기와 도시 하늘의 불꽃이 보입니다',
  ja: '「ベトナムの気概」ビュッフェの赤いポスター。宴会テーブルを埋める保温皿と魚介、洋菓子が並び、上部には金星紅旗と街並みの上に広がる花火が描かれています',
  th: 'โปสเตอร์สีแดงของบุฟเฟ่ต์ "จิตวิญญาณเวียดนาม" มีถาดอุ่นอาหารเรียงเป็นแถว อาหารทะเลและของหวานวางเต็มโต๊ะเลี้ยง ด้านบนเป็นธงแดงดาวเหลืองและพลุเหนือเส้นขอบฟ้าของเมือง',
}
const ALT_WEDDING_KV = {
  vi: 'Áp phích tiệc cưới nền xanh lá: cô dâu mặc váy trắng đội khăn voan và chú rể mặc vest nâu đứng đối diện nhau, bên trái là khóm hoa và lá xanh',
  en: 'A green wedding poster: a bride in a white gown and veil facing a groom in a brown suit, with flowers and greenery at the left',
  zh: '绿色背景的婚礼海报：身穿白色婚纱、戴头纱的新娘与身着棕色西装的新郎面对面站立，左侧是一丛鲜花与绿叶',
  ko: '초록색 배경의 웨딩 포스터: 흰 드레스에 베일을 쓴 신부와 갈색 정장을 입은 신랑이 마주 보고 서 있고, 왼쪽에는 꽃과 초록 잎이 놓여 있습니다',
  ja: '緑を背景にした婚礼のポスター。白いドレスにベールの花嫁と、茶色のスーツの花婿が向かい合って立ち、左手には花と緑の葉が配されています',
  th: 'โปสเตอร์งานแต่งงานพื้นหลังสีเขียว เจ้าสาวในชุดขาวสวมผ้าคลุมหน้ายืนหันหน้าเข้าหาเจ้าบ่าวในชุดสูทสีน้ำตาล ด้านซ้ายมีช่อดอกไม้และใบไม้สีเขียว',
}
const ALT_BUNBEBE = {
  vi: 'Áp phích nâu chương trình bún bề bề: tô bún nóng với bề bề bóc vỏ xếp thành hàng, cà chua, hành lá và rau mùi',
  en: 'A brown poster for the mantis shrimp noodle programme: a steaming bowl of noodles topped with a row of peeled mantis shrimp, tomato, spring onion and coriander',
  zh: '棕色背景的 Bún bề bề 海报：一碗热气腾腾的米粉，上面整齐排列着剥壳皮皮虾，配番茄、葱花与香菜',
  ko: '갈색 배경의 Bún bề bề 포스터: 김이 오르는 쌀국수 한 그릇 위에 껍질을 벗긴 갯가재가 줄지어 놓이고 토마토와 쪽파, 고수가 곁들여져 있습니다',
  ja: '茶色を背景にした Bún bề bề のポスター。湯気の立つ米麺の丼に殻をむいたシャコが一列に並び、トマト、青ねぎ、パクチーが添えられています',
  th: 'โปสเตอร์สีน้ำตาลของ Bún bề bề ชามก๋วยเตี๋ยวร้อน ๆ วางกุ้งตั๊กแตนแกะเปลือกเรียงเป็นแถว พร้อมมะเขือเทศ ต้นหอม และผักชี',
}

/**
 * Ảnh cho BA THẺ ở trang danh mục là ẢNH CHỤP, không phải ba ấn phẩm ở trên.
 *
 * `cardGridSection` đè tiêu đề + mô tả + nút lên chính bức ảnh (xem
 * `components/sections/CardGridSection.tsx`) và cắt ảnh vào khung 16:10. Ba ấn
 * phẩm kia vuông và đã có sẵn tên chương trình in cỡ lớn ở giữa: chữ của thẻ
 * rơi đúng lên chữ của ấn phẩm, đọc ra hai lớp chữ chồng nhau — đã dựng và
 * chụp lại ở 1440px để xác nhận. Ấn phẩm vẫn còn nguyên, ở đúng chỗ dùng được
 * nó: trang chi tiết, nơi nó hiện TRỌN VẸN, không cắt, không có gì đè lên.
 */
const ALT_CARD_BUFFET = {
  vi: 'Quầy buffet bánh: giỏ mây đựng bánh mì, bánh sừng bò và bánh ngọt xếp quanh một chiếc sừng dồi dào đan bằng bánh nướng, dưới ánh đèn vàng',
  en: 'A buffet bread station: wicker baskets of bread, croissants and pastries arranged around a cornucopia woven from baked dough, under warm light',
  zh: '自助餐面包台：藤编篮里盛着面包、可颂与各式甜点，环绕一只用烘焙面团编成的丰饶角，笼罩在暖黄灯光下',
  ko: '뷔페 베이커리 코너: 등나무 바구니에 담긴 빵과 크루아상, 페이스트리가 구운 반죽으로 엮은 풍요의 뿔을 둘러싸고 있으며 따뜻한 조명이 비칩니다',
  ja: 'ビュッフェのパンコーナー。籐のかごに盛られたパン、クロワッサン、ペストリーが、焼いた生地で編んだ豊穣の角を囲み、暖色の照明に照らされています',
  th: 'เคาน์เตอร์ขนมปังบุฟเฟ่ต์ ตะกร้าหวายใส่ขนมปัง ครัวซองต์ และเพสตรี วางล้อมรอบเขาแห่งความอุดมสมบูรณ์ที่สานจากแป้งอบ ภายใต้แสงไฟสีอบอุ่น',
}
const ALT_CARD_WEDDING = {
  vi: 'Tiệc cưới ngoài trời buổi tối bên hồ bơi: ban nhạc bốn người mặc vest trắng chơi saxophone và guitar trước bậc thềm phủ hoa, dây đèn giăng trên tán cây',
  en: 'An evening poolside wedding: a four-piece band in white suits playing saxophone and guitar in front of flower-covered steps, with string lights through the trees',
  zh: '泳池畔的夜间户外婚礼：四人乐队身着白色西装，在铺满鲜花的台阶前演奏萨克斯与吉他，串灯挂满树冠',
  ko: '수영장 옆에서 열린 저녁 야외 결혼식: 흰색 정장을 입은 4인조 밴드가 꽃으로 덮인 계단 앞에서 색소폰과 기타를 연주하고, 나무 사이로 전구 조명이 걸려 있습니다',
  ja: 'プールサイドの夜の屋外ウエディング。白いスーツの4人編成バンドが花で覆われた階段の前でサックスとギターを演奏し、木々にストリングライトが渡されています',
  th: 'งานแต่งงานกลางแจ้งยามค่ำริมสระว่ายน้ำ วงดนตรีสี่คนในชุดสูทสีขาวบรรเลงแซกโซโฟนและกีตาร์หน้าบันไดที่ประดับด้วยดอกไม้ มีไฟสายห้อยอยู่ตามเรือนยอดไม้',
}
const ALT_CARD_BUNBEBE = {
  vi: 'Bàn ăn dọn sẵn: cá chiên nguyên con, món xào trong chảo đá nóng, đĩa thịt thái lát, khăn ăn gấp nhọn ở mỗi chỗ ngồi và ghế bọc nhung xanh ô liu',
  en: 'A laid dining table: a whole fried fish, a stir-fry in a hot stone pan, plates of sliced meats, a peaked folded napkin at each place and olive-green velvet chairs',
  zh: '已摆好的餐桌：整条炸鱼、石锅小炒、切片肉类拼盘，每个座位前折成尖角的餐巾，配橄榄绿丝绒座椅',
  ko: '차려진 식탁: 통째로 튀긴 생선, 뜨거운 돌솥에 담긴 볶음 요리, 얇게 썬 고기 접시, 자리마다 뾰족하게 접은 냅킨, 올리브색 벨벳 의자',
  ja: 'セッティングされた食卓。姿揚げの魚、熱した石鍋の炒め物、薄切り肉の皿、各席に尖らせて折られたナプキン、オリーブグリーンのベルベットの椅子',
  th: 'โต๊ะอาหารที่จัดไว้พร้อม ปลาทอดทั้งตัว อาหารผัดในกระทะหินร้อน จานเนื้อหั่นบาง ผ้าเช็ดปากพับเป็นยอดแหลมทุกที่นั่ง และเก้าอี้กำมะหยี่สีเขียวมะกอก',
}

const ALT_LOBBY = {
  vi: 'Sảnh đón xe của khách sạn lúc chạng vạng, nhân viên mặc đồng phục trắng mở cửa ô tô dưới mái đón đèn sáng',
  en: 'The hotel porte-cochère at dusk, a doorman in white uniform opening a car door beneath the lit canopy',
  zh: '暮色中的酒店门廊，身着白色制服的门童在灯光明亮的雨棚下为轿车开门',
  ko: '해 질 무렵 호텔 현관 차량 진입로에서 흰색 유니폼을 입은 도어맨이 조명이 켜진 캐노피 아래 자동차 문을 열고 있습니다',
  ja: '夕暮れのホテル車寄せで、白い制服のドアマンが照明の灯るキャノピーの下で車のドアを開けています',
  th: 'ทางรถเข้าโรงแรมยามพลบค่ำ พนักงานในเครื่องแบบสีขาวเปิดประตูรถใต้หลังคาคลุมที่มีไฟสว่าง',
}

/* -------------------------------------------------------------------------
   TRANG DANH MỤC — page.offers
   ---------------------------------------------------------------------- */

resetKeys()

const PAGE_SECTIONS = [
  {
    _key: 'sec-hero',
    _type: 'heroSection',
    heading: loc({
      vi: 'ƯU ĐÃI',
      en: 'OFFERS',
      zh: '优惠',
      ko: '프로모션',
      ja: '特別プラン',
      th: 'โปรโมชัน',
    }),
    subheading: loc({
      vi: 'Những chương trình đang mở tại Royal Hạ Long Hotel',
      en: 'Programmes currently open at Royal Ha Long Hotel',
      zh: 'Royal Ha Long Hotel 正在推出的限时活动',
      ko: 'Royal Ha Long Hotel에서 진행 중인 프로그램',
      ja: 'Royal Ha Long Hotel で実施中のプログラム',
      th: 'โปรแกรมที่กำลังเปิดให้บริการที่ Royal Ha Long Hotel',
    }),
    background: fig('Royal-Ha-Long-Lobby-01.jpg', ALT_LOBBY),
    height: 'medium',
  },

  {
    _key: 'sec-intro',
    _type: 'richTextSection',
    tone: 'white',
    narrow: true,
    content: richLoc({
      vi: [
        'Mỗi mùa, Royal Hạ Long Hotel mở một vài chương trình ngắn hạn: một đêm buffet lễ, một gói tiệc cưới bên vịnh, một món ăn di sản được đưa trở lại thực đơn. Trang này gom các chương trình đang giới thiệu, kèm giá và điều kiện áp dụng của từng chương trình.',
        `Để giữ chỗ hoặc hỏi thêm, quý khách gọi ${HOTLINE_MD}, hoặc gửi thư tới ${EMAIL_MD}.`,
      ],
      en: [
        'Each season Royal Ha Long Hotel opens a handful of short programmes: a holiday buffet evening, a wedding package beside the bay, a heritage dish brought back to the menu. This page gathers the programmes on offer, each with its own prices and conditions.',
        `To hold a place or ask a question, call ${HOTLINE_MD} or write to ${EMAIL_MD}.`,
      ],
      zh: [
        '每一季，Royal Ha Long Hotel 都会推出几项限时活动：一场节庆自助晚宴、一份海湾畔的婚宴套餐、一道重回菜单的下龙名菜。本页汇集正在推出的活动，并列出各自的价格与适用条件。',
        `如需预留席位或进一步咨询，请致电 ${HOTLINE_MD}，或发送邮件至 ${EMAIL_MD}。`,
      ],
      ko: [
        '계절마다 Royal Ha Long Hotel은 짧은 기간의 프로그램을 몇 가지 선보입니다. 국경일 뷔페의 밤, 만을 마주한 웨딩 패키지, 메뉴로 다시 돌아온 하롱의 유산 요리가 그것입니다. 이 페이지에는 진행 중인 프로그램을 가격과 적용 조건과 함께 정리했습니다.',
        `자리를 예약하시거나 문의하실 때에는 ${HOTLINE_MD}으로 전화하시거나 ${EMAIL_MD}으로 메일을 보내 주시기 바랍니다.`,
      ],
      ja: [
        '季節ごとに、Royal Ha Long Hotel では短期のプログラムをいくつかご用意しています。祝祭日のビュッフェの夜、湾を望むウエディングプラン、メニューに戻ってきたハロンの伝統料理などです。このページでは実施中のプログラムを、それぞれの料金と適用条件とともにまとめています。',
        `ご予約やお問い合わせは、${HOTLINE_MD} までお電話いただくか、${EMAIL_MD} までメールをお送りください。`,
      ],
      th: [
        'ในแต่ละฤดูกาล Royal Ha Long Hotel จะเปิดโปรแกรมระยะสั้นหลายรายการ ทั้งค่ำคืนบุฟเฟ่ต์ฉลองวันชาติ แพ็กเกจงานแต่งงานริมอ่าว และเมนูมรดกที่กลับมาอยู่บนรายการอาหารอีกครั้ง หน้านี้รวบรวมโปรแกรมที่กำลังเปิดให้บริการ พร้อมราคาและเงื่อนไขของแต่ละรายการ',
        `หากต้องการสำรองที่นั่งหรือสอบถามเพิ่มเติม กรุณาโทร ${HOTLINE_MD} หรือส่งอีเมลถึง ${EMAIL_MD}`,
      ],
    }),
  },

  {
    _key: 'sec-cards',
    _type: 'cardGridSection',
    columns: 3,
    heading: loc({
      vi: 'CHƯƠNG TRÌNH ĐANG GIỚI THIỆU',
      en: 'PROGRAMMES ON OFFER',
      zh: '正在推出的活动',
      ko: '진행 중인 프로그램',
      ja: '実施中のプログラム',
      th: 'โปรแกรมที่กำลังเปิดให้บริการ',
    }),
    cards: [
      {
        _key: 'card-buffet',
        _type: 'card',
        // Tiêu đề thẻ giữ MỘT dòng ở 1440px: khối chữ đè lên ảnh neo ở đáy
        // thẻ, nên tiêu đề hai dòng đẩy cả khối lên cao, vào đoạn
        // `.scrim-bottom` còn trong suốt và chữ trắng rơi lên vùng sáng của
        // ảnh. Chữ Hán/Kana/Hangul rộng gấp đôi chữ Latin nên ngưỡng ký tự
        // thấp hơn hẳn — đã đo `scrollWidth`/`clientWidth` ở cả sáu ngôn ngữ.
        title: loc({
          vi: 'Buffet mừng Quốc khánh 2/9',
          en: 'National Day buffet',
          zh: '国庆自助晚宴',
          ko: '국경일 뷔페',
          ja: '建国記念日ビュッフェ',
          th: 'บุฟเฟ่ต์วันชาติ',
        }),
        // Mô tả thẻ bị `line-clamp-2` cắt (xem `CardGridSection.tsx`). Đã đo
        // `scrollHeight` so với `clientHeight` ở cả sáu ngôn ngữ tại 1440px,
        // 768px và 390px để câu kết thúc trọn vẹn thay vì đứt sau dấu "…".
        description: loc({
          vi: 'Hào khí Việt Nam — từ 500.000 VNĐ net/khách, tối 01.09.2026.',
          en: 'The Spirit of Vietnam — 500,000 VND net per guest, 1 Sept 2026.',
          zh: '「越南豪情」之夜 — 每位净价 500,000 VND，2026.09.01。',
          ko: '베트남의 기상 — 1인 500,000 VND net, 2026.09.01 저녁.',
          ja: '「ベトナムの気概」— お一人様 500,000 VND net、2026.09.01。',
          th: 'จิตวิญญาณเวียดนาม — ท่านละ 500,000 VND net คืน 01.09.2026',
        }),
        image: fig('Royal-Halong-Hotel-Restaurant-09.jpg', ALT_CARD_BUFFET),
        cta: linkTo(OFFER_BUFFET, VIEW_DETAILS),
      },
      {
        _key: 'card-wedding',
        _type: 'card',
        title: loc({
          vi: 'Đám cưới cổ tích bên Vịnh di sản',
          en: 'A fairy-tale wedding by the bay',
          zh: '海湾畔的童话婚礼',
          ko: '하롱베이의 동화 같은 결혼식',
          ja: 'ハロン湾の童話の結婚式',
          th: 'งานแต่งงานเทพนิยายริมอ่าว',
        }),
        description: loc({
          vi: 'Gói tiệc từ 400.000 VNĐ/khách, ưu đãi lên tới 89 triệu đồng.',
          en: 'Packages from 400,000 VND per guest, savings up to 89 million VND.',
          zh: '套餐每位 400,000 VND 起，优惠最高 8,900 万 VND。',
          ko: '패키지 1인 400,000 VND부터, 최대 8,900만 VND 혜택.',
          ja: 'プランはお一人様 400,000 VND から、最大 8,900万 VND の特典。',
          th: 'แพ็กเกจเริ่มต้นท่านละ 400,000 VND ลดสูงสุด 89 ล้าน VND',
        }),
        image: fig('Royal-Ha-Long-Gallery-Wedding-21.jpg', ALT_CARD_WEDDING),
        cta: linkTo(OFFER_WEDDING, VIEW_DETAILS),
      },
      {
        _key: 'card-bunbebe',
        _type: 'card',
        // Tên món giữ NGUYÊN dạng tiếng Việt ở cả sáu ngôn ngữ (yêu cầu của
        // brief); phần giải thích nằm ở `description` chứ không nhét vào tiêu
        // đề — thêm ngoặc giải nghĩa vào đây là tiêu đề tràn sang dòng hai.
        title: loc({
          vi: 'Ẩm thực di sản — Bún bề bề',
          en: 'Heritage series: bún bề bề',
          zh: '遗产美食系列 — Bún bề bề',
          ko: '유산 미식 시리즈 — Bún bề bề',
          ja: '伝統料理シリーズ — Bún bề bề',
          th: 'ซีรีส์อาหารมรดก — Bún bề bề',
        }),
        description: loc({
          vi: 'Do Chef Hồng nấu. Giảm 20% khung giờ 10:00 – 16:00 và 20:00 – 22:00.',
          en: 'Mantis shrimp noodles by Chef Hong. 20% off, 10:00 – 16:00, 20:00 – 22:00.',
          zh: '皮皮虾米粉，Chef Hong 主理。10:00–16:00、20:00–22:00 享 8 折。',
          ko: '갯가재 쌀국수, Chef Hong. 10:00–16:00, 20:00–22:00 20% 할인.',
          ja: 'シャコの米麺、Chef Hong。10:00–16:00 と 20:00–22:00 は 20% 割引。',
          th: 'ก๋วยเตี๋ยวกุ้งตั๊กแตน โดย Chef Hong ลด 20% 10:00–16:00, 20:00–22:00',
        }),
        image: fig('Royal-Halong-Hotel-Restaurant-08.jpg', ALT_CARD_BUNBEBE),
        cta: linkTo(OFFER_BUNBEBE, VIEW_DETAILS),
      },
    ],
  },

  {
    _key: 'sec-wedding',
    _type: 'imageTextSection',
    eyebrow: loc({
      vi: 'TIỆC CƯỚI',
      en: 'WEDDINGS',
      zh: '婚礼',
      ko: '웨딩',
      ja: 'ウエディング',
      th: 'งานแต่งงาน',
    }),
    heading: loc({
      vi: 'Hôn lễ bên vịnh di sản',
      en: 'A ceremony beside the heritage bay',
      zh: '遗产海湾畔的婚礼',
      ko: '유산의 만 곁에서 올리는 혼례',
      ja: '世界遺産の湾のほとりで挙げる婚礼',
      th: 'พิธีวิวาห์ริมอ่าวมรดกโลก',
    }),
    image: fig('Royal-Ha-Long-Gallery-Wedding-12.jpg', {
      vi: 'Cô dâu cầm bó hoa trắng đứng cạnh chú rể mặc vest sẫm dưới cổng hoa kết bằng hoa trắng và kem, người dẫn chương trình cầm micro đứng bên phải',
      en: 'A bride holding a white bouquet stands beside a groom in a dark suit under an arch of white and cream flowers, with the host holding a microphone at the right',
      zh: '新娘手捧白色花束，与身着深色西装的新郎站在白色与奶油色鲜花扎成的花门下，右侧司仪手持话筒',
      ko: '흰 부케를 든 신부가 짙은 색 정장을 입은 신랑과 함께 흰색과 크림색 꽃으로 엮은 아치 아래 서 있고, 오른쪽에는 마이크를 든 사회자가 있습니다',
      ja: '白いブーケを持つ花嫁が、濃色のスーツの花婿と並んで、白とクリーム色の花で作られたアーチの下に立ち、右手にはマイクを持つ司会者がいます',
      th: 'เจ้าสาวถือช่อดอกไม้สีขาวยืนเคียงข้างเจ้าบ่าวในชุดสูทสีเข้ม ใต้ซุ้มดอกไม้สีขาวและครีม โดยมีพิธีกรถือไมโครโฟนอยู่ทางขวา',
    }),
    imageSide: 'left',
    imageFit: 'cover',
    tone: 'white',
    content: richLoc({
      vi: [
        'Trong ánh hoàng hôn bên Vịnh di sản, hôn lễ diễn ra trong một không gian riêng tư, nơi từng khoảnh khắc thiêng liêng được giữ trọn.',
        'Đội ngũ chuyên gia sự kiện của khách sạn chăm chút từng chi tiết của ngày trọng đại: nghi thức thành hôn, bàn tiệc mang dấu ấn riêng của hai gia đình và phần trang trí không gian.',
        `Gói tiệc bắt đầu từ 400.000 VNĐ/khách, kèm ưu đãi lên tới 89 triệu đồng, tổ chức tại ${PALACE.vi}.`,
      ],
      en: [
        'In the late light over the heritage bay, the ceremony unfolds in a space of its own, where each moment is kept whole.',
        "The hotel's events team looks after every detail of the day: the vows, tables that carry the mark of both families, and the styling of the room.",
        `Packages start at 400,000 VND per guest and carry savings of up to 89 million VND, held at the ${PALACE.en} in Ha Long.`,
      ],
      zh: [
        '夕阳映照遗产海湾，婚礼在一处私密的空间中举行，每一个庄重的瞬间都被完整留存。',
        '酒店的宴会策划团队悉心打理大喜之日的每一处细节：成婚仪式、承载两家人印记的餐桌，以及空间的整体布置。',
        `婚宴套餐每位 400,000 VND 起，优惠最高 8,900 万 VND，于${PALACE.zh}举行。`,
      ],
      ko: [
        '유산의 만 위로 노을이 내릴 무렵, 혼례는 오롯이 두 분만을 위한 공간에서 치러지며 경건한 순간들이 온전히 남습니다.',
        '호텔의 이벤트 전문 팀이 그날의 모든 세부를 살핍니다. 성혼 예식, 두 가문의 색을 담은 연회 테이블, 공간 장식까지 함께 준비해 드립니다.',
        `연회 패키지는 1인 400,000 VND부터이며 최대 8,900만 VND의 혜택이 더해집니다. 장소는 ${PALACE.ko}입니다.`,
      ],
      ja: [
        '世界遺産の湾に夕日が降りるころ、婚礼はおふたりだけの静かな空間で執り行われ、厳かなひとときがそのまま残ります。',
        'ホテルのイベント専門チームが、当日の細部までお手伝いします。挙式の進行、ご両家の趣を映した披露宴のテーブル、会場装花までを整えます。',
        `披露宴プランはお一人様 400,000 VND から、最大 8,900万 VND の特典付きで、${PALACE.ja} にて承ります。`,
      ],
      th: [
        'ในแสงอาทิตย์อัสดงเหนืออ่าวมรดกโลก พิธีวิวาห์จัดขึ้นในพื้นที่ส่วนตัว ทุกช่วงเวลาอันศักดิ์สิทธิ์จึงถูกเก็บรักษาไว้อย่างครบถ้วน',
        'ทีมผู้เชี่ยวชาญด้านอีเวนต์ของโรงแรมดูแลทุกรายละเอียดของวันสำคัญ ตั้งแต่พิธีมงคลสมรส โต๊ะเลี้ยงที่สะท้อนตัวตนของทั้งสองครอบครัว ไปจนถึงการตกแต่งพื้นที่',
        `แพ็กเกจเริ่มต้นท่านละ 400,000 VND พร้อมส่วนลดสูงสุด 89 ล้าน VND จัดขึ้นที่${PALACE.th}`,
      ],
    }),
    cta: linkTo(OFFER_WEDDING, {
      vi: 'XEM GÓI TIỆC CƯỚI',
      en: 'SEE THE WEDDING PACKAGE',
      zh: '查看婚宴套餐',
      ko: '웨딩 패키지 보기',
      ja: 'ウエディングプランを見る',
      th: 'ดูแพ็กเกจงานแต่งงาน',
    }),
  },

  {
    _key: 'sec-palace',
    _type: 'imageTextSection',
    eyebrow: loc({
      vi: 'ĐỊA ĐIỂM',
      en: 'THE VENUE',
      zh: '举办场地',
      ko: '행사 장소',
      ja: '会場',
      th: 'สถานที่จัดงาน',
    }),
    heading: loc(PALACE),
    image: fig('ROYAL-INTERNATIONAL-CONVENTION-PALACE2.jpg', {
      vi: 'Sảnh dài lát đá bóng in hoa văn tròn, tường ốp panel trắng viền vàng, ba chùm đèn pha lê treo dưới trần vẽ mây trời, hai bàn hoa tươi ở giữa lối đi',
      en: 'A long hall of polished stone inlaid with circular patterns, walls in white panelling with gilt trim, three crystal chandeliers under ceiling roundels painted with clouds, and two flower tables along the walkway',
      zh: '狭长的大堂铺着抛光石材并嵌有圆形纹样，墙面为描金白色护墙板，三盏水晶吊灯悬于绘有云天的穹顶之下，通道中央摆放两张鲜花台',
      ko: '원형 문양을 새긴 광택 석재로 마감한 긴 홀, 금테를 두른 흰색 패널 벽, 구름이 그려진 천장 아래 매달린 세 개의 크리스털 샹들리에, 통로 가운데 놓인 두 개의 생화 테이블',
      ja: '円形の文様を象嵌した磨き石の長いホール。金縁の白いパネル壁、雲を描いた天井に吊られた三基のクリスタルシャンデリア、通路の中央に置かれた二台の生花のテーブル',
      th: 'โถงยาวปูหินขัดเงาฝังลวดลายวงกลม ผนังบุแผงไม้สีขาวขอบทอง โคมระย้าคริสตัลสามช่อแขวนใต้เพดานที่วาดลายเมฆ และโต๊ะดอกไม้สดสองตัวกลางทางเดิน',
    }),
    imageSide: 'right',
    imageFit: 'cover',
    tone: 'cream',
    content: richLoc({
      vi: [
        'Phần lớn tiệc cưới và sự kiện lớn của khách sạn diễn ra tại đây: sảnh tiếp khách lát đá bóng, hệ đèn pha lê, mở thẳng sang các phòng tiệc.',
        'Sơ đồ từng sảnh và sức chứa theo cách bố trí nằm ở trang Cung Hội nghị.',
      ],
      en: [
        "Most of the hotel's weddings and larger events take place here: a reception hall in polished stone, lit by chandeliers, opening straight onto the banquet rooms.",
        'Floor plans and the capacity of each hall by layout are set out on the convention palace page.',
      ],
      zh: [
        '酒店大多数婚宴与大型活动都在此举行：抛光石材铺就的迎宾大堂、成组的水晶吊灯，可直接通往各宴会厅。',
        '各宴会厅的平面图与不同布置下的容纳人数，详见会议宫页面。',
      ],
      ko: [
        '호텔의 웨딩과 대형 행사 대부분이 이곳에서 열립니다. 광택 석재로 마감한 리셉션 홀과 크리스털 조명이 연회장으로 바로 이어집니다.',
        '각 홀의 평면도와 배치별 수용 인원은 컨벤션 팰리스 페이지에 정리되어 있습니다.',
      ],
      ja: [
        'ホテルの婚礼と大規模イベントの多くはここで行われます。磨き石のレセプションホールとクリスタルの照明が、そのまま宴会場へと続きます。',
        '各ホールの平面図とレイアウト別の収容人数は、コンベンションパレスのページにまとめています。',
      ],
      th: [
        'งานแต่งงานและอีเวนต์ขนาดใหญ่ส่วนใหญ่ของโรงแรมจัดขึ้นที่นี่ โถงต้อนรับปูหินขัดเงาและโคมระย้าคริสตัลเชื่อมตรงไปยังห้องจัดเลี้ยง',
        'ผังของแต่ละห้องและความจุตามรูปแบบการจัดวาง ดูได้ที่หน้าศูนย์ประชุม',
      ],
    }),
    cta: linkTo('page.royal-international-convention-palace', {
      vi: 'XEM CUNG HỘI NGHỊ',
      en: 'VISIT THE CONVENTION PALACE',
      zh: '前往会议宫页面',
      ko: '컨벤션 팰리스 보기',
      ja: 'コンベンションパレスを見る',
      th: 'ดูศูนย์ประชุม',
    }),
  },

  {
    _key: 'sec-cta',
    _type: 'ctaBandSection',
    heading: loc({
      vi: 'Giữ chỗ cho dịp của quý khách',
      en: 'Hold a place for your occasion',
      zh: '为您的重要时刻预留位置',
      ko: '소중한 날의 자리를 미리 마련해 드립니다',
      ja: '大切な日のお席をご用意します',
      th: 'สำรองที่นั่งสำหรับโอกาสพิเศษของท่าน',
    }),
    description: loc({
      vi: `Đường dây nóng ${HOTLINE} · ${EMAIL}`,
      en: `Hotline ${HOTLINE} · ${EMAIL}`,
      zh: `热线 ${HOTLINE} · ${EMAIL}`,
      ko: `전화 ${HOTLINE} · ${EMAIL}`,
      ja: `お電話 ${HOTLINE} · ${EMAIL}`,
      th: `สายด่วน ${HOTLINE} · ${EMAIL}`,
    }),
    // Ảnh nền của dải CTA phải TỐI ở đúng dải giữa nơi có tiêu đề: `.scrim-hero`
    // trong suốt hoàn toàn ở đỉnh và chỉ đậm dần xuống đáy. `Royal-Ha-Long-offer-02`
    // (ảnh ưu đãi của bản clone) đo được L=164 với 65% điểm ảnh sáng ngay sau
    // dòng tiêu đề — chữ trắng gần như biến mất vào khung cửa sổ nhìn ra vịnh.
    // Ảnh phòng tiệc đo được L=74 ở cùng vùng.
    background: fig('Royal-Ha-Long-Wedding-07.jpg', {
      vi: 'Tiệc cưới trong phòng tiệc lớn: các bàn tròn kín khách dưới những chùm đèn pha lê, cô dâu đứng trên sân khấu trắng ở cuối phòng',
      en: 'A wedding banquet in the grand ballroom: round tables filled with guests beneath crystal chandeliers, the bride on a white stage at the far end',
      zh: '大宴会厅中的婚宴：水晶吊灯下圆桌坐满宾客，新娘站在厅尾的白色舞台上',
      ko: '대연회장에서 열린 결혼 피로연: 크리스털 샹들리에 아래 원형 테이블마다 하객이 가득하고, 홀 끝 흰색 무대 위에 신부가 서 있습니다',
      ja: '大宴会場での婚礼披露宴。クリスタルシャンデリアの下、円卓は招待客で埋まり、奥の白いステージに花嫁が立っています',
      th: 'งานเลี้ยงฉลองมงคลสมรสในห้องบอลรูมใหญ่ โต๊ะกลมเต็มไปด้วยแขกใต้โคมระย้าคริสตัล เจ้าสาวยืนอยู่บนเวทีสีขาวสุดห้อง',
    }),
    cta: linkTo('page.reservation', {
      vi: 'ĐẶT PHÒNG',
      en: 'BOOK NOW',
      zh: '立即预订',
      ko: '지금 예약',
      ja: '今すぐ予約',
      th: 'จองเลย',
    }),
  },
]

const PAGE_FIELDS = {
  // Tiêu đề TRANG, không phải tên một chương trình. Trước script này field
  // `title.vi` là "BUFFET MỪNG ĐẠI LỄ 2/9 | HÀO KHÍ VIỆT NAM…" — tên một
  // chương trình buffet đứng làm tên trang danh mục, kéo theo cả thẻ
  // <title> và breadcrumb.
  title: loc({
    vi: 'ƯU ĐÃI',
    en: 'OFFERS',
    zh: '优惠',
    ko: '프로모션',
    ja: '特別プラン',
    th: 'โปรโมชัน',
  }),
  sections: PAGE_SECTIONS,
  seo: {
    _type: 'seo',
    metaTitle: loc({
      vi: 'Ưu đãi & chương trình đặc biệt',
      en: 'Offers & seasonal programmes',
      zh: '优惠与季节特别活动',
      ko: '프로모션 및 시즌 특별 프로그램',
      ja: '特別プランと季節のプログラム',
      th: 'โปรโมชันและโปรแกรมพิเศษประจำฤดูกาล',
    }),
    metaDescription: loc({
      vi: 'Chương trình đang giới thiệu tại Royal Hạ Long Hotel: buffet mừng Quốc khánh, gói tiệc cưới bên Vịnh Hạ Long và series ẩm thực di sản — kèm giá và điều kiện.',
      en: 'Programmes at Royal Ha Long Hotel: a National Day buffet, wedding packages beside Ha Long Bay and the heritage flavours series, with prices and conditions.',
      zh: 'Royal Ha Long Hotel 正在推出的活动：国庆自助晚宴、下龙湾畔婚宴套餐与遗产美食系列，各自附有价格、举行时间与适用条件，欢迎来电预留席位。',
      ko: 'Royal Ha Long Hotel에서 진행 중인 프로그램입니다. 국경일 뷔페, 하롱베이 웨딩 패키지, 유산 미식 시리즈를 가격과 일정, 적용 조건과 함께 안내해 드립니다.',
      ja: 'Royal Ha Long Hotel で実施中のプログラム。建国記念日ビュッフェ、ハロン湾のウエディングプラン、伝統料理シリーズを、料金と期間、適用条件とともにご案内します。',
      th: 'โปรแกรมที่กำลังเปิดให้บริการที่ Royal Ha Long Hotel ทั้งบุฟเฟ่ต์ฉลองวันชาติ แพ็กเกจงานแต่งงานริมอ่าวฮาลอง และซีรีส์อาหารมรดก พร้อมราคา ช่วงเวลา และเงื่อนไข',
    }),
    ogImage: fig('Royal-Ha-Long-Lobby-01.jpg', ALT_LOBBY),
    noIndex: false,
  },
}

/* -------------------------------------------------------------------------
   CHƯƠNG TRÌNH 1 — Buffet Hào Khí Việt Nam
   Ngày/giá/điều kiện lấy nguyên từ phần chữ của `offers/index.html`.
   Lưu ý: ấn phẩm KV ghi "18:30 – 21:00" và chỉ nhắc "La Terrasse", trong khi
   phần chữ ghi "18:00 – 21:00" và "La Terrasse Bar và Phúc Viên". Lấy theo
   PHẦN CHỮ (nguồn sự thật theo brief) — mâu thuẫn đã ghi vào NOTES của cặp.
   Chương trình diễn ra 01.09.2026 và đã qua so với hôm nay; giữ nguyên ngày
   thật, không "làm mới".
   ---------------------------------------------------------------------- */

const BUFFET_FIELDS = {
  title: loc({
    vi: 'BUFFET MỪNG ĐẠI LỄ 2/9 — HÀO KHÍ VIỆT NAM, TINH HOA HỘI TỤ',
    en: 'NATIONAL DAY BUFFET — THE SPIRIT OF VIETNAM',
    zh: '国庆自助晚宴 —「越南豪情，精粹荟萃」',
    ko: '국경일 뷔페 — 베트남의 기상, 정수의 만남',
    ja: '建国記念日ビュッフェ —「ベトナムの気概、粋の集い」',
    th: 'บุฟเฟ่ต์ฉลองวันชาติ — จิตวิญญาณเวียดนาม รวมสุดยอดรสชาติ',
  }),
  excerpt: loc({
    vi: 'Đêm buffet mừng Quốc khánh 2/9 với hơn 60 món Á – Âu, hải sản tươi theo mùa và Cooking Show cá ngừ đại dương nướng đá tảng, khép lại bằng pháo hoa bên bờ Vịnh Di sản.',
    en: 'A National Day buffet of more than sixty Asian and European dishes, seasonal fresh seafood and a live ocean-tuna cooking show, closing with fireworks over the heritage bay.',
    zh: '国庆之夜的自助晚宴，汇集 60 余道亚欧佳肴、当季鲜活海产，以及金枪鱼石板烧现场烹饪秀，最后在遗产海湾畔的烟花中落幕。',
    ko: '국경일을 기념하는 뷔페의 밤. 60가지가 넘는 아시아·유럽 요리와 제철 해산물, 참치 돌판구이 쿠킹쇼가 이어지고 유산의 만 위로 터지는 불꽃으로 마무리됩니다.',
    ja: '建国記念日を祝うビュッフェの夜。60種を超えるアジア・ヨーロッパ料理と旬の魚介、マグロの石焼きクッキングショーに続き、世界遺産の湾に上がる花火で締めくくります。',
    th: 'ค่ำคืนบุฟเฟ่ต์ฉลองวันชาติ กับอาหารเอเชียและยุโรปกว่า 60 รายการ อาหารทะเลสดตามฤดูกาล และคุกกิ้งโชว์ปลาทูน่าย่างบนแผ่นหิน ปิดท้ายด้วยพลุเหนืออ่าวมรดกโลก',
  }),
  image: fig('1786351273937_4917286860413604745_4917286860413604745_h.jpg', ALT_BUFFET),
  priceNote: loc({
    vi: 'CHỈ TỪ 500.000 VNĐ/KHÁCH',
    en: 'FROM 500,000 VND PER GUEST',
    zh: '每位仅 500,000 VND 起',
    ko: '1인 500,000 VND부터',
    ja: 'お一人様 500,000 VND から',
    th: 'เริ่มต้นท่านละ 500,000 VND',
  }),
  validFrom: '2026-09-01',
  validTo: '2026-09-01',
  order: 1,
  // `cta` ở CẤP DOCUMENT giờ được `DOC_BY_SLUG_QUERY` mở thành `LINK` (có
  // `internalSlug`), nên liên kết nội bộ không còn rơi về trang chủ. Buffet
  // diễn ra tại La Terrasse Bar và Nhà hàng Phúc Viên — hai địa điểm nằm
  // trong trang Ẩm thực, nên đó là đích đúng. Hai số đường dây nóng vẫn bấm
  // gọi được ngay trong `body` (mục "Đặt bàn"), nên không mất hành động gọi.
  cta: CTA_DINING,
  body: richLoc({
    vi: [
      'Quốc khánh 2/9 là dịp để tôn vinh những giá trị Việt qua những trải nghiệm xứng tầm. Lấy cảm hứng từ tinh thần ấy, buffet "Hào Khí Việt Nam" tại Royal Hạ Long Hotel quy tụ hơn 60 món tinh tuyển: hải sản tươi theo mùa, các dòng thịt cao cấp và tinh hoa ẩm thực Á – Âu.',
      'Điểm nhấn của đêm tiệc là Cooking Show cá ngừ đại dương nướng đá tảng, giữ nguyên vị tươi của nguyên liệu. Thực khách được tặng đồ uống chủ đề Quốc khánh, hoà mình vào chương trình nghệ thuật, các hoạt động tương tác, bốc thăm may mắn và ngắm pháo hoa bên bờ Vịnh Di sản.',
      '### Thời gian & địa điểm',
      '- Tối 01.09.2026, 18:00 – 21:00',
      '- La Terrasse Bar và Nhà hàng Phúc Viên',
      '### Giá vé',
      '- Người lớn: 500.000 VNĐ net/khách',
      '- Trẻ em từ 6 đến 11 tuổi: 250.000 VNĐ/trẻ',
      '- Trẻ em dưới 6 tuổi: miễn phí hoàn toàn',
      '### Ưu đãi đặt trước',
      '- Đặt trước ngày 15/08/2026: chỉ từ 400.000 VNĐ/khách',
      '- Giảm 20% khi đặt kèm combo phòng',
      '- Tặng 01 ly đồ uống chủ đề Quốc khánh',
      '- Bốc thăm trúng thưởng nhiều phần quà giá trị',
      'Chương trình không áp dụng cùng các ưu đãi khác.',
      '### Đặt bàn',
      `Đường dây nóng: ${HOTLINE_MD}`,
      `Email: ${EMAIL_MD}`,
      `Website: ${WEBSITE_MD}`,
    ],
    en: [
      'Vietnam\'s National Day is an occasion to honour Vietnamese craft through experiences worthy of it. In that spirit, the "Spirit of Vietnam" buffet at Royal Ha Long Hotel brings together more than sixty selected dishes: seasonal fresh seafood, premium cuts and the best of Asian and European cooking.',
      'The centrepiece of the evening is a live cooking show of ocean tuna grilled on hot stone, which keeps the flavour of the fish intact. Guests receive a National Day themed drink and join the performances, interactive activities and prize draw, with fireworks over the heritage bay to close.',
      '### Date & venue',
      '- The evening of 1 September 2026, 18:00 – 21:00',
      '- La Terrasse Bar and Phuc Vien Restaurant',
      '### Prices',
      '- Adults: 500,000 VND net per guest',
      '- Children aged 6 to 11: 250,000 VND per child',
      '- Children under 6: complimentary',
      '### Early booking',
      '- Booked before 15 August 2026: from 400,000 VND per guest',
      '- A further 20% off when booked with a room package',
      '- One complimentary National Day themed drink',
      '- Entry to the prize draw',
      'The programme cannot be combined with other offers.',
      '### Reservations',
      `Hotline: ${HOTLINE_MD}`,
      `Email: ${EMAIL_MD}`,
      `Website: ${WEBSITE_MD}`,
    ],
    zh: [
      '九月二日国庆，是以匹配的体验致敬越南价值的日子。循着这份心意，Royal Ha Long Hotel 的「越南豪情」自助晚宴集合 60 余道精选菜式：当季鲜活海产、高级肉品，以及亚欧料理的精粹。',
      '当晚的重头戏是金枪鱼石板烧现场烹饪秀，最大限度保留食材的鲜味。宾客可获赠一杯国庆主题饮品，并可欣赏文艺演出、参与互动环节与幸运抽奖，在遗产海湾畔观赏烟花。',
      '### 时间与地点',
      '- 2026 年 9 月 1 日晚 18:00 – 21:00',
      '- La Terrasse Bar 与福缘中餐厅',
      '### 价格',
      '- 成人：每位净价 500,000 VND',
      '- 6 至 11 岁儿童：每位 250,000 VND',
      '- 6 岁以下儿童：全免',
      '### 早鸟优惠',
      '- 2026 年 8 月 15 日前预订：每位仅 400,000 VND 起',
      '- 与客房套餐同时预订可再享 8 折',
      '- 赠送国庆主题饮品 1 杯',
      '- 参与幸运抽奖，赢取多重好礼',
      '本活动不可与其他优惠同时使用。',
      '### 预订',
      `热线：${HOTLINE_MD}`,
      `邮箱：${EMAIL_MD}`,
      `网站：${WEBSITE_MD}`,
    ],
    ko: [
      '9월 2일 국경일은 베트남의 가치를 그에 걸맞은 경험으로 기리는 날입니다. 그 정신에서 출발한 Royal Ha Long Hotel의 "베트남의 기상" 뷔페는 제철 해산물과 고급 육류, 아시아·유럽 요리의 정수까지 엄선한 60가지 이상의 메뉴를 한자리에 모았습니다.',
      '이 밤의 백미는 참치를 돌판에 구워 내는 쿠킹쇼로, 재료 본연의 신선한 맛을 그대로 살립니다. 모든 손님께 국경일 테마 음료를 한 잔 드리며, 공연과 참여 프로그램, 행운의 추첨이 이어지고 유산의 만 위로 오르는 불꽃을 감상하실 수 있습니다.',
      '### 일시 & 장소',
      '- 2026년 9월 1일 저녁 18:00 – 21:00',
      '- La Terrasse Bar와 푹비엔 레스토랑',
      '### 요금',
      '- 성인: 1인 500,000 VND net',
      '- 6세 ~ 11세 어린이: 1인 250,000 VND',
      '- 6세 미만 어린이: 무료',
      '### 사전 예약 혜택',
      '- 2026년 8월 15일 이전 예약 시: 1인 400,000 VND부터',
      '- 객실 패키지와 함께 예약하시면 20% 추가 할인',
      '- 국경일 테마 음료 1잔 증정',
      '- 다양한 경품이 준비된 행운의 추첨 참여',
      '본 프로그램은 다른 혜택과 중복 적용되지 않습니다.',
      '### 예약 문의',
      `전화: ${HOTLINE_MD}`,
      `이메일: ${EMAIL_MD}`,
      `웹사이트: ${WEBSITE_MD}`,
    ],
    ja: [
      '9月2日の建国記念日は、ベトナムの価値をそれにふさわしい体験でたたえる日です。その精神から生まれた Royal Ha Long Hotel のビュッフェ「ベトナムの気概」には、旬の魚介、上質な肉、そしてアジアとヨーロッパの料理の粋を集めた60種類以上のメニューが並びます。',
      '夜の見どころは、マグロを石板で焼き上げるクッキングショーです。素材の鮮度をそのまま生かします。お客様には建国記念日にちなんだドリンクを1杯ご用意し、ステージ演目や参加型の催し、抽選会に続いて、世界遺産の湾に上がる花火をお楽しみいただけます。',
      '### 日時・会場',
      '- 2026年9月1日の夜 18:00 – 21:00',
      '- La Terrasse Bar およびフックヴィエン・レストラン',
      '### 料金',
      '- 大人：お一人様 500,000 VND net',
      '- 6歳～11歳のお子様：お一人様 250,000 VND',
      '- 6歳未満のお子様：無料',
      '### 事前予約特典',
      '- 2026年8月15日までのご予約：お一人様 400,000 VND から',
      '- 客室プランと合わせてご予約でさらに20%割引',
      '- 建国記念日にちなんだドリンクを1杯進呈',
      '- 賞品が当たる抽選会にご参加いただけます',
      '本プログラムは他の特典との併用はできません。',
      '### ご予約',
      `お電話：${HOTLINE_MD}`,
      `メール：${EMAIL_MD}`,
      `ウェブサイト：${WEBSITE_MD}`,
    ],
    th: [
      'วันชาติ 2 กันยายนเป็นโอกาสเชิดชูคุณค่าของเวียดนามผ่านประสบการณ์ที่คู่ควร ด้วยแรงบันดาลใจนั้น บุฟเฟ่ต์ "จิตวิญญาณเวียดนาม" ที่ Royal Ha Long Hotel จึงรวบรวมเมนูคัดสรรกว่า 60 รายการ ทั้งอาหารทะเลสดตามฤดูกาล เนื้อคุณภาพสูง และสุดยอดรสชาติจากเอเชียและยุโรป',
      'ไฮไลต์ของค่ำคืนคือคุกกิ้งโชว์ปลาทูน่าย่างบนแผ่นหินร้อน ซึ่งคงความสดของวัตถุดิบไว้อย่างเต็มที่ แขกทุกท่านจะได้รับเครื่องดื่มธีมวันชาติ พร้อมร่วมชมการแสดง กิจกรรมร่วมสนุก จับฉลากรับรางวัล และชมพลุเหนืออ่าวมรดกโลก',
      '### เวลาและสถานที่',
      '- ค่ำวันที่ 1 กันยายน 2026 เวลา 18:00 – 21:00',
      '- La Terrasse Bar และภัตตาคารฟุกเวียน',
      '### ราคา',
      '- ผู้ใหญ่: ท่านละ 500,000 VND net',
      '- เด็กอายุ 6 – 11 ปี: คนละ 250,000 VND',
      '- เด็กอายุต่ำกว่า 6 ปี: ไม่มีค่าใช้จ่าย',
      '### สิทธิพิเศษเมื่อจองล่วงหน้า',
      '- จองก่อนวันที่ 15 สิงหาคม 2026: เริ่มต้นท่านละ 400,000 VND',
      '- ลดเพิ่มอีก 20% เมื่อจองพร้อมแพ็กเกจห้องพัก',
      '- รับเครื่องดื่มธีมวันชาติ 1 แก้ว',
      '- ร่วมจับฉลากลุ้นรับของรางวัลมากมาย',
      'โปรแกรมนี้ไม่สามารถใช้ร่วมกับโปรโมชันอื่นได้',
      '### สำรองที่นั่ง',
      `สายด่วน: ${HOTLINE_MD}`,
      `อีเมล: ${EMAIL_MD}`,
      `เว็บไซต์: ${WEBSITE_MD}`,
    ],
  }),
  seo: {
    _type: 'seo',
    metaTitle: loc({
      vi: 'Buffet Quốc khánh 2/9 — Hào khí Việt Nam',
      en: 'National Day buffet — The Spirit of Vietnam',
      zh: '国庆自助晚宴 — 越南豪情',
      ko: '국경일 뷔페 — 베트남의 기상',
      ja: '建国記念日ビュッフェ — ベトナムの気概',
      th: 'บุฟเฟ่ต์วันชาติ — จิตวิญญาณเวียดนาม',
    }),
    metaDescription: loc({
      vi: 'Buffet mừng Quốc khánh tối 01.09.2026, 18:00 – 21:00 tại La Terrasse và Phúc Viên: hơn 60 món, 500.000 VNĐ net/người lớn, trẻ 6–11 tuổi 250.000 VNĐ.',
      en: 'National Day buffet, 1 September 2026, 18:00 – 21:00 at La Terrasse and Phuc Vien: over sixty dishes, 500,000 VND net per adult, 250,000 VND for ages 6 to 11.',
      zh: '2026 年 9 月 1 日 18:00–21:00，于 La Terrasse 与福缘中餐厅举行的国庆自助晚宴：60 余道菜式，成人每位净价 500,000 VND，6–11 岁儿童 250,000 VND。',
      ko: '2026년 9월 1일 18:00–21:00, La Terrasse와 푹비엔 레스토랑에서 열리는 국경일 뷔페. 60가지가 넘는 요리, 성인 1인 500,000 VND net, 6~11세 어린이 250,000 VND.',
      ja: '2026年9月1日18:00–21:00、La Terrasse とフックヴィエン・レストランで開く建国記念日ビュッフェ。60種以上の料理、大人お一人様 500,000 VND net、6〜11歳 250,000 VND。',
      th: 'บุฟเฟ่ต์วันชาติ 1 กันยายน 2026 เวลา 18:00–21:00 ที่ La Terrasse และภัตตาคารฟุกเวียน อาหารกว่า 60 รายการ ผู้ใหญ่ท่านละ 500,000 VND net เด็ก 6–11 ปี 250,000 VND',
    }),
    ogImage: fig('1786351273937_4917286860413604745_4917286860413604745_h.jpg', ALT_BUFFET),
    noIndex: false,
  },
}

/* -------------------------------------------------------------------------
   CHƯƠNG TRÌNH 2 — Đám cưới cổ tích bên Vịnh di sản
   Bản clone KHÔNG nêu ngày bắt đầu/kết thúc -> `validFrom`/`validTo` để
   trống, không bịa.
   ---------------------------------------------------------------------- */

const WEDDING_FIELDS = {
  title: loc({
    vi: 'ĐÁM CƯỚI CỔ TÍCH BÊN VỊNH DI SẢN',
    en: 'A FAIRY-TALE WEDDING BESIDE THE HERITAGE BAY',
    zh: '遗产海湾畔的童话婚礼',
    ko: '유산의 만에서 여는 동화 같은 결혼식',
    ja: '世界遺産の湾で叶える童話のような結婚式',
    th: 'งานแต่งงานในเทพนิยายริมอ่าวมรดกโลก',
  }),
  excerpt: loc({
    vi: `Gói tiệc cưới trọn vẹn tại ${PALACE.vi}, từ 400.000 VNĐ/khách, kèm ưu đãi lên tới 89 triệu đồng.`,
    en: `A complete wedding package at the ${PALACE.en} in Ha Long, from 400,000 VND per guest, with savings of up to 89 million VND.`,
    zh: `${PALACE.zh}的一站式婚宴套餐，每位 400,000 VND 起，优惠最高 8,900 万 VND。`,
    ko: `${PALACE.ko}에서 준비하는 웨딩 패키지. 1인 400,000 VND부터이며 최대 8,900만 VND의 혜택이 함께합니다.`,
    ja: `${PALACE.ja}で叶える婚礼プラン。お一人様 400,000 VND から、最大 8,900万 VND の特典付きです。`,
    th: `แพ็กเกจงานแต่งงานครบวงจรที่${PALACE.th} เริ่มต้นท่านละ 400,000 VND พร้อมส่วนลดสูงสุด 89 ล้าน VND`,
  }),
  image: fig('Cuoi-la-terrasse-05-scaled.jpg', ALT_WEDDING_KV),
  priceNote: loc({
    vi: 'TỪ 400.000 VNĐ/KHÁCH',
    en: 'FROM 400,000 VND PER GUEST',
    zh: '每位 400,000 VND 起',
    ko: '1인 400,000 VND부터',
    ja: 'お一人様 400,000 VND から',
    th: 'เริ่มต้นท่านละ 400,000 VND',
  }),
  order: 2,
  // Đích trong site: `page.wedding` là nơi duy nhất có `leadFormSection`
  // (`formType: wedding`) — tức là biểu mẫu tư vấn thật, đúng hành động mà
  // trang chi tiết gói tiệc kêu gọi. Bảng giá `byvn.net/1L12` vẫn còn nguyên
  // trong `body` dưới dạng liên kết bấm được, nên không mất đích ngoài.
  cta: linkTo('page.wedding', {
    vi: 'TƯ VẤN TIỆC CƯỚI',
    en: 'PLAN YOUR WEDDING',
    zh: '婚礼咨询',
    ko: '웨딩 상담 신청',
    ja: 'ウエディングのご相談',
    th: 'ปรึกษาการจัดงานแต่งงาน',
  }),
  body: richLoc({
    vi: [
      'Hôn lễ trong mơ của bạn đang chờ đón.',
      'Trong ánh hoàng hôn mơ màng bên Vịnh di sản kỳ vĩ, hôn lễ của bạn tựa như bước ra từ một câu chuyện cổ tích: không gian lãng mạn, riêng tư, giữ trọn từng khoảnh khắc thiêng liêng.',
      'Hãy để Royal Hạ Long Hotel và đội ngũ chuyên gia sự kiện chăm chút từng chi tiết của buổi lễ, từ nghi thức thành hôn, bàn tiệc mang dấu ấn riêng của hai gia đình, đến không gian trang trí. Mỗi đám cưới ở đây không chỉ là một buổi tiệc mà là một hành trình được viết từ xúc cảm và sự tinh tế.',
      '### Gói tiệc cưới',
      '- Giá gói từ 400.000 VNĐ/khách',
      '- Ưu đãi lên tới 89 triệu đồng',
      `- Địa điểm: ${PALACE.vi}, đường Hạ Long, phường Bãi Cháy, tỉnh Quảng Ninh`,
      'Bảng giá đầy đủ của gói tiệc: [byvn.net/1L12](https://byvn.net/1L12)',
      '### Liên hệ',
      `Đường dây nóng: ${HOTLINE_MD}`,
      `Email: ${EMAIL_MD}`,
      `Website: ${WEBSITE_MD}`,
    ],
    en: [
      'The wedding you have pictured is waiting.',
      'In the soft light of sunset over the heritage bay, the ceremony reads like something out of a fairy tale: a romantic, private setting that keeps each solemn moment whole.',
      "Let Royal Ha Long Hotel and its events team look after every detail of the day, from the vows to tables that carry the mark of both families and the styling of the room. A wedding here is less a banquet than a day written out of feeling and care.",
      '### The package',
      '- Packages from 400,000 VND per guest',
      '- Savings of up to 89 million VND',
      `- Held at the ${PALACE.en}, Ha Long road, Bai Chay ward, Quang Ninh province`,
      'Full price list for the package: [byvn.net/1L12](https://byvn.net/1L12)',
      '### Contact',
      `Hotline: ${HOTLINE_MD}`,
      `Email: ${EMAIL_MD}`,
      `Website: ${WEBSITE_MD}`,
    ],
    zh: [
      '您梦想中的婚礼正在等待。',
      '在壮阔遗产海湾的朦胧夕照中，您的婚礼宛如自童话中走来：浪漫而私密的空间，将每一个庄重的瞬间完整留存。',
      '请让 Royal Ha Long Hotel 与宴会策划团队悉心打理婚礼的每一处细节，从成婚仪式、承载两家人印记的餐桌，到空间布置。这里的每一场婚礼都不只是一顿宴席，而是一段以情感与细致写成的旅程。',
      '### 婚宴套餐',
      '- 套餐每位 400,000 VND 起',
      '- 优惠最高 8,900 万 VND',
      `- 地点：${PALACE.zh}，广宁省拜寨坊下龙路`,
      '套餐完整价目表：[byvn.net/1L12](https://byvn.net/1L12)',
      '### 联系我们',
      `热线：${HOTLINE_MD}`,
      `邮箱：${EMAIL_MD}`,
      `网站：${WEBSITE_MD}`,
    ],
    ko: [
      '꿈꾸시던 결혼식이 기다리고 있습니다.',
      '웅장한 유산의 만 위로 노을이 번질 무렵, 결혼식은 한 편의 동화처럼 펼쳐집니다. 낭만적이면서도 오롯이 두 분만을 위한 공간이 경건한 순간들을 온전히 담아냅니다.',
      'Royal Ha Long Hotel과 이벤트 전문 팀이 성혼 예식부터 두 가문의 색을 담은 연회 테이블, 공간 장식까지 그날의 모든 세부를 살펴 드립니다. 이곳의 결혼식은 한 번의 연회가 아니라 감정과 섬세함으로 써 내려간 하루입니다.',
      '### 웨딩 패키지',
      '- 패키지 1인 400,000 VND부터',
      '- 최대 8,900만 VND 혜택',
      `- 장소: ${PALACE.ko}, 꽝닌성 바이짜이동 하롱로`,
      '패키지 전체 가격표: [byvn.net/1L12](https://byvn.net/1L12)',
      '### 문의하기',
      `전화: ${HOTLINE_MD}`,
      `이메일: ${EMAIL_MD}`,
      `웹사이트: ${WEBSITE_MD}`,
    ],
    ja: [
      '思い描いてこられた結婚式が待っています。',
      '雄大な世界遺産の湾に夕日がにじむころ、婚礼はまるで童話の一場面のように進みます。ロマンティックで、おふたりだけの静かな空間が、厳かなひとときをそのまま包み込みます。',
      'Royal Ha Long Hotel のイベント専門チームが、挙式の進行から、ご両家の趣を映した披露宴のテーブル、会場装花まで、当日の細部までお手伝いします。ここでの結婚式は単なる宴ではなく、心づかいと繊細さで綴る一日です。',
      '### ウエディングプラン',
      '- プランはお一人様 400,000 VND から',
      '- 最大 8,900万 VND の特典',
      `- 会場：${PALACE.ja}、クアンニン省バイチャイ坊ハロン通り`,
      'プランの詳しい料金表：[byvn.net/1L12](https://byvn.net/1L12)',
      '### お問い合わせ',
      `お電話：${HOTLINE_MD}`,
      `メール：${EMAIL_MD}`,
      `ウェブサイト：${WEBSITE_MD}`,
    ],
    th: [
      'งานแต่งงานในฝันของท่านกำลังรออยู่',
      'ในแสงอาทิตย์อัสดงอันนุ่มนวลเหนืออ่าวมรดกโลกอันยิ่งใหญ่ พิธีวิวาห์ของท่านราวกับก้าวออกมาจากเทพนิยาย พื้นที่แสนโรแมนติกและเป็นส่วนตัวเก็บรักษาทุกช่วงเวลาอันศักดิ์สิทธิ์ไว้อย่างครบถ้วน',
      'ให้ Royal Ha Long Hotel และทีมผู้เชี่ยวชาญด้านอีเวนต์ดูแลทุกรายละเอียดของพิธี ตั้งแต่พิธีมงคลสมรส โต๊ะเลี้ยงที่สะท้อนตัวตนของทั้งสองครอบครัว ไปจนถึงการตกแต่งพื้นที่ งานแต่งงานที่นี่ไม่ใช่เพียงงานเลี้ยง แต่เป็นการเดินทางที่เขียนขึ้นจากความรู้สึกและความประณีต',
      '### แพ็กเกจงานแต่งงาน',
      '- แพ็กเกจเริ่มต้นท่านละ 400,000 VND',
      '- ส่วนลดสูงสุด 89 ล้าน VND',
      `- สถานที่: ${PALACE.th} ถนนฮาลอง แขวงบ๊ายจ๋าย จังหวัดกว๋างนิญ`,
      'ตารางราคาแพ็กเกจฉบับเต็ม: [byvn.net/1L12](https://byvn.net/1L12)',
      '### ติดต่อเรา',
      `สายด่วน: ${HOTLINE_MD}`,
      `อีเมล: ${EMAIL_MD}`,
      `เว็บไซต์: ${WEBSITE_MD}`,
    ],
  }),
  seo: {
    _type: 'seo',
    metaTitle: loc({
      vi: 'Gói tiệc cưới bên Vịnh Hạ Long',
      en: 'Wedding packages beside Ha Long Bay',
      zh: '下龙湾畔婚宴套餐',
      ko: '하롱베이 웨딩 패키지',
      ja: 'ハロン湾のウエディングプラン',
      th: 'แพ็กเกจงานแต่งงานริมอ่าวฮาลอง',
    }),
    metaDescription: loc({
      vi: 'Gói tiệc cưới tại Cung Hội nghị Quốc tế Hoàng Gia Hạ Long từ 400.000 VNĐ/khách, ưu đãi tới 89 triệu đồng, do đội ngũ sự kiện Royal Hạ Long Hotel tổ chức.',
      en: 'Wedding packages at the Royal International Convention Palace, Ha Long, from 400,000 VND per guest, savings up to 89 million VND, planned by our events team.',
      zh: '下龙皇家国际会议宫婚宴套餐，每位 400,000 VND 起，优惠最高 8,900 万 VND，由 Royal Ha Long Hotel 的宴会策划团队从筹备到当日全程打理。',
      ko: '하롱 로열 인터내셔널 컨벤션 팰리스의 웨딩 패키지. 1인 400,000 VND부터, 최대 8,900만 VND 혜택, Royal Ha Long Hotel 이벤트 팀이 준비합니다.',
      ja: 'ハロンのロイヤル・インターナショナル・コンベンション・パレスで叶える婚礼プラン。お一人様 400,000 VND から、最大 8,900万 VND の特典。イベントチームが担当します。',
      th: 'แพ็กเกจงานแต่งงานที่รอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ ฮาลอง เริ่มต้นท่านละ 400,000 VND ส่วนลดสูงสุด 89 ล้าน VND ดูแลโดยทีมอีเวนต์ของโรงแรม',
    }),
    ogImage: fig('Cuoi-la-terrasse-05-scaled.jpg', ALT_WEDDING_KV),
    noIndex: false,
  },
}

/* -------------------------------------------------------------------------
   CHƯƠNG TRÌNH 3 — Series ẩm thực di sản: bún bề bề
   Phần chữ của bản clone không có giá, không có ngày, chỉ nói "điểm dừng chân
   tháng 6". Khung "giờ vàng" 10:00–16:00 và 20:00–22:00 cùng mức giảm 20% lấy
   từ chính ấn phẩm của chương trình (`z5503602919624_…jpg`, ảnh đã nằm trong
   Sanity và chính là ảnh bản clone dùng cho bài này) — không có nguồn nào
   khác nêu điều kiện áp dụng, và một "ưu đãi" không có điều kiện nào thì
   không phải ưu đãi. Đã ghi lại trong NOTES của cặp.
   `validFrom`/`validTo` để trống: bản clone chỉ có "tháng 6", không có năm.

   TÊN MÓN: `Bún bề bề` giữ NGUYÊN dạng tiếng Việt ở cả sáu ngôn ngữ; bốn
   ngôn ngữ mới kèm một giải thích ngắn trong ngoặc ngay lần nhắc đầu tiên.
   ---------------------------------------------------------------------- */

const BUNBEBE_FIELDS = {
  title: loc({
    vi: 'SERIES ẨM THỰC DI SẢN — BÚN BỀ BỀ',
    en: 'HERITAGE FLAVOURS SERIES — MANTIS SHRIMP NOODLE SOUP',
    zh: '遗产美食系列 — Bún bề bề（皮皮虾米粉）',
    ko: '유산 미식 시리즈 — Bún bề bề (갯가재 쌀국수)',
    ja: '伝統料理シリーズ — Bún bề bề（シャコの米麺）',
    th: 'ซีรีส์อาหารมรดก — Bún bề bề (ก๋วยเตี๋ยวกุ้งตั๊กแตน)',
  }),
  excerpt: loc({
    vi: 'Một chặng của series Ẩm thực Di sản: bún bề bề Hạ Long do Chef Hồng nấu, giảm 20% trong khung giờ vàng.',
    en: 'A stop on the Heritage Flavours series: Ha Long mantis shrimp noodle soup cooked by Chef Hong, 20% off during happy hours.',
    zh: '「遗产美食」系列的一站：由 Chef Hong 主理的下龙 Bún bề bề（皮皮虾米粉），黄金时段享 8 折。',
    ko: '유산 미식 시리즈의 한 여정. Chef Hong이 끓여 내는 하롱 Bún bề bề(갯가재 쌀국수)를 골든아워에 20% 할인해 드립니다.',
    ja: '「伝統料理」シリーズの一皿。Chef Hong が仕立てるハロンの Bún bề bề（シャコの米麺）を、ゴールデンタイムは20%割引でご用意します。',
    th: 'หนึ่งในซีรีส์อาหารมรดก: Bún bề bề (ก๋วยเตี๋ยวกุ้งตั๊กแตน) แห่งฮาลอง โดย Chef Hong ลด 20% ในช่วงเวลาทอง',
  }),
  image: fig('z5503602919624_e9c46293112b9a49bfc0250c5dfba4b5.jpg', ALT_BUNBEBE),
  priceNote: loc({
    vi: 'GIỜ VÀNG GIẢM 20%',
    en: 'HAPPY HOUR — 20% OFF',
    zh: '黄金时段 8 折',
    ko: '골든아워 20% 할인',
    ja: 'ゴールデンタイム 20% 割引',
    th: 'ช่วงเวลาทอง ลด 20%',
  }),
  order: 3,
  // Cùng lý do với buffet: món nằm trong thực đơn nhà hàng của khách sạn, nên
  // đích trong site là trang Ẩm thực. Số gọi bàn nằm ngay trong `body`.
  cta: CTA_DINING,
  body: richLoc({
    vi: [
      'Series Ẩm thực Di sản của Royal Hạ Long Hotel lần lượt đưa những món gắn với vùng đất Hạ Long trở lại thực đơn. Điểm dừng chân tháng 6 là bún bề bề — một trong mười món ăn di sản nhất định phải thử khi đến Hạ Long.',
      'Nước vùng vịnh không quá sâu, thuỷ triều ra vào liên tục và độ mặn vừa phải, nên bề bề Hạ Long ngon, ngọt và chắc thịt hơn hẳn những miền biển khác.',
      'Bằng sự tinh tế và đam mê với nghề, Chef Hồng giữ trọn hương vị đặc trưng của món ăn dân dã: bề bề trắng được đánh bắt trực tiếp, còn tươi sống, và nước dùng ngọt thanh, thơm dịu.',
      '### Giờ vàng',
      '- Giảm 20% trong khung giờ 10:00 – 16:00 và 20:00 – 22:00',
      '### Liên hệ',
      `Đường dây nóng: ${HOTLINE_MD}`,
      `Email: ${EMAIL_MD}`,
      `Website: ${WEBSITE_MD}`,
    ],
    en: [
      'The Heritage Flavours series at Royal Ha Long Hotel brings the dishes tied to this stretch of coast back to the menu one at a time. June\'s stop is mantis shrimp noodle soup — one of the ten heritage dishes to try in Ha Long.',
      'The water in the bay is shallow, the tide moves constantly and the salinity is moderate, which is why Ha Long mantis shrimp is sweeter and firmer than that of other coasts.',
      'Chef Hong keeps the character of this everyday dish intact through the ingredients: white mantis shrimp landed directly and still live, and a clear, gently fragrant broth.',
      '### Happy hours',
      '- 20% off between 10:00 – 16:00 and 20:00 – 22:00',
      '### Contact',
      `Hotline: ${HOTLINE_MD}`,
      `Email: ${EMAIL_MD}`,
      `Website: ${WEBSITE_MD}`,
    ],
    zh: [
      'Royal Ha Long Hotel 的「遗产美食」系列，逐一将与下龙这片土地相连的菜肴请回菜单。六月的一站是 Bún bề bề（皮皮虾米粉）——到下龙必尝的十道遗产名菜之一。',
      '海湾水域不深，潮汐往复不息，盐度适中，因此下龙的皮皮虾比其他海域更鲜甜、肉质更紧实。',
      'Chef Hong 以细致与对厨艺的热忱，完整保留了这道家常菜的本味：直接捕捞、仍然鲜活的白皮皮虾，配上清甜而香气柔和的汤底。',
      '### 黄金时段',
      '- 10:00 – 16:00 与 20:00 – 22:00 享 8 折',
      '### 联系我们',
      `热线：${HOTLINE_MD}`,
      `邮箱：${EMAIL_MD}`,
      `网站：${WEBSITE_MD}`,
    ],
    ko: [
      'Royal Ha Long Hotel의 유산 미식 시리즈는 하롱 땅에 뿌리를 둔 요리를 하나씩 메뉴로 되돌려 놓습니다. 6월의 여정은 Bún bề bề(갯가재 쌀국수)입니다. 하롱에 오시면 꼭 맛보아야 할 열 가지 유산 요리 가운데 하나입니다.',
      '만의 바다는 그리 깊지 않고 조수가 끊임없이 드나들며 염도도 적당합니다. 그래서 하롱의 갯가재는 다른 바다의 것보다 달고 살이 단단합니다.',
      'Chef Hong은 섬세함과 요리에 대한 애정으로 이 소박한 음식의 본래 맛을 지켜냅니다. 직접 잡아 올린 살아 있는 흰 갯가재와 맑고 은은하게 향이 도는 육수가 그 비결입니다.',
      '### 골든아워',
      '- 10:00 – 16:00, 20:00 – 22:00 20% 할인',
      '### 문의하기',
      `전화: ${HOTLINE_MD}`,
      `이메일: ${EMAIL_MD}`,
      `웹사이트: ${WEBSITE_MD}`,
    ],
    ja: [
      'Royal Ha Long Hotel の伝統料理シリーズは、ハロンの土地に根ざした料理をひと皿ずつメニューに呼び戻していきます。6月の一皿は Bún bề bề（シャコの米麺）。ハロンを訪れたらぜひ味わいたい十の伝統料理のひとつです。',
      '湾の海はさほど深くなく、潮の出入りが絶えず、塩分も穏やかです。そのためハロンのシャコは、ほかの海のものより甘みがあり身が締まっています。',
      'Chef Hong は繊細さと料理への情熱で、この素朴な一杯の持ち味をそのまま生かします。水揚げされたばかりの生きた白いシャコと、澄んだ甘みのやさしい香りのスープがその要です。',
      '### ゴールデンタイム',
      '- 10:00 – 16:00 と 20:00 – 22:00 は 20% 割引',
      '### お問い合わせ',
      `お電話：${HOTLINE_MD}`,
      `メール：${EMAIL_MD}`,
      `ウェブサイト：${WEBSITE_MD}`,
    ],
    th: [
      'ซีรีส์อาหารมรดกของ Royal Ha Long Hotel ทยอยนำเมนูที่ผูกพันกับผืนดินฮาลองกลับมาอยู่บนรายการอาหารอีกครั้ง จุดแวะของเดือนมิถุนายนคือ Bún bề bề (ก๋วยเตี๋ยวกุ้งตั๊กแตน) หนึ่งในสิบเมนูมรดกที่ต้องลองเมื่อมาเยือนฮาลอง',
      'น้ำในอ่าวไม่ลึกนัก กระแสน้ำขึ้นลงตลอดเวลา และความเค็มพอเหมาะ กุ้งตั๊กแตนฮาลองจึงหวานและเนื้อแน่นกว่าทะเลแห่งอื่น',
      'ด้วยความประณีตและความรักในวิชาชีพ Chef Hong คงรสชาติดั้งเดิมของเมนูพื้นบ้านนี้ไว้อย่างครบถ้วน ทั้งกุ้งตั๊กแตนขาวที่จับสด ๆ ยังเป็น ๆ และน้ำซุปรสหวานใส หอมอ่อน ๆ',
      '### ช่วงเวลาทอง',
      '- ลด 20% ในช่วงเวลา 10:00 – 16:00 และ 20:00 – 22:00',
      '### ติดต่อเรา',
      `สายด่วน: ${HOTLINE_MD}`,
      `อีเมล: ${EMAIL_MD}`,
      `เว็บไซต์: ${WEBSITE_MD}`,
    ],
  }),
  seo: {
    _type: 'seo',
    metaTitle: loc({
      vi: 'Bún bề bề Hạ Long — series ẩm thực di sản',
      en: 'Ha Long mantis shrimp noodles — heritage series',
      zh: '下龙 Bún bề bề — 遗产美食系列',
      ko: '하롱 Bún bề bề — 유산 미식 시리즈',
      ja: 'ハロンの Bún bề bề — 伝統料理シリーズ',
      th: 'Bún bề bề ฮาลอง — ซีรีส์อาหารมรดก',
    }),
    metaDescription: loc({
      vi: 'Bún bề bề Hạ Long do Chef Hồng nấu tại Royal Hạ Long Hotel, một trong mười món ăn di sản nên thử. Giảm 20% trong khung giờ 10:00 – 16:00 và 20:00 – 22:00.',
      en: 'Ha Long mantis shrimp noodle soup by Chef Hong at Royal Ha Long Hotel, one of the ten heritage dishes to try. 20% off between 10:00–16:00 and 20:00–22:00.',
      zh: '由 Chef Hong 在 Royal Ha Long Hotel 主理的下龙 Bún bề bề（皮皮虾米粉），到下龙必尝的十道遗产名菜之一。10:00–16:00 与 20:00–22:00 享 8 折。',
      ko: 'Royal Ha Long Hotel에서 Chef Hong이 끓여 내는 하롱 Bún bề bề(갯가재 쌀국수). 하롱의 열 가지 유산 요리 중 하나이며 10:00–16:00, 20:00–22:00에 20% 할인됩니다.',
      ja: 'Royal Ha Long Hotel で Chef Hong が仕立てるハロンの Bún bề bề（シャコの米麺）。ぜひ味わいたい十の伝統料理のひとつで、10:00–16:00 と 20:00–22:00 は20%割引です。',
      th: 'Bún bề bề (ก๋วยเตี๋ยวกุ้งตั๊กแตน) แห่งฮาลอง โดย Chef Hong ที่ Royal Ha Long Hotel หนึ่งในสิบเมนูมรดกที่ต้องลอง ลด 20% ช่วง 10:00–16:00 และ 20:00–22:00',
    }),
    ogImage: fig('z5503602919624_e9c46293112b9a49bfc0250c5dfba4b5.jpg', ALT_BUNBEBE),
    noIndex: false,
  },
}

/* ---------------------------------------------------------------------- */

async function main() {
  await patchDoc('page.offers', PAGE_FIELDS)
  await patchDoc(OFFER_BUFFET, BUFFET_FIELDS)
  await patchDoc(OFFER_WEDDING, WEDDING_FIELDS)
  await patchDoc(OFFER_BUNBEBE, BUNBEBE_FIELDS)

  console.log('')
  let holes = 0
  for (const id of ['page.offers', OFFER_BUFFET, OFFER_WEDDING, OFFER_BUNBEBE]) {
    holes += await assertFullyTranslated(id)
  }

  console.log('')
  console.log(holes > 0 ? `${holes} field còn thiếu ngôn ngữ.` : 'Cả 4 document đủ 6 ngôn ngữ.')
}

main()
