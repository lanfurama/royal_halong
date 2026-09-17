/**
 * Trang CASINO — Câu lạc bộ Quốc tế Hoàng Gia.
 *
 * Document lớn nhất site: 94 field đa ngữ, trong đó ba `tableSection` (luật
 * rút lá thứ 3 của Baccarat cho Player và cho Banker, bảng cược Roulette)
 * chiếm hơn một nửa. Script này làm ba việc:
 *
 *  1. Dịch đủ sáu ngôn ngữ cho MỌI field, kể cả từng ô của ba bảng.
 *  2. Gắn `alt` sáu ngôn ngữ cho mọi ảnh (bản import cũ không có ảnh nào có
 *     alt ngoài ảnh hero, và chính ảnh hero cũng trống).
 *  3. Sửa nhịp trang: bản import trải phẳng 16 khối, trong đó 12 khối là
 *     `richTextSection` KHÔNG ẢNH xếp liền nhau — luật Baccarat/Roulette/
 *     Blackjack thành một bức tường chữ, đẩy ảnh sòng bài và số hotline ra
 *     ngoài tầm mắt. Bản này: giới thiệu trò chơi bằng `imageTextSection` có
 *     ảnh thật, còn phần tra cứu (9 khối luật + bảng) gập lại bằng cờ
 *     `collapsible` — đúng thứ `CollapsibleGroup` được viết ra để phục vụ.
 *
 * NGUỒN SỰ THẬT là `casino/index.html` (bản clone WordPress). Không thêm một
 * con số, một tỉ lệ trả thưởng hay một điều luật nào mà bản clone không có.
 * Hai chỗ bản clone thiếu dữ liệu được ghi rõ bằng comment ngay tại chỗ.
 *
 * Câu lạc bộ chỉ đón khách mang quốc tịch nước ngoài (luật Việt Nam), nên
 * năm bản dịch en/zh/ko/ja/th mới là bản dành cho đúng đối tượng khách của
 * trang này — chúng được viết như tài liệu hướng dẫn của một câu lạc bộ cao
 * cấp: mô tả luật chơi, không mời chào, không hứa hẹn thắng thua.
 *
 * Chạy: `npx tsx scripts/content/casino.ts` — chạy lại nhiều lần ra cùng
 * kết quả (mọi `_key` đều tất định).
 */
import { LOCALES, type Locale } from '../../lib/i18n'
import { loc, blockLoc, fig, p, li, linkTo, resetKeys } from './build'
import { patchDoc, assertFullyTranslated } from './write'

resetKeys()

type Six = Record<Locale, string>

/** Sáu ngôn ngữ theo đúng thứ tự `LOCALES` — gọn hơn object literal khi phải
 * viết hàng trăm chuỗi. `loc()` vẫn là nơi kiểm tra thiếu ngôn ngữ. */
const L = (vi: string, en: string, zh: string, ko: string, ja: string, th: string): Six =>
  loc({ vi, en, zh, ko, ja, th })

/**
 * Như `blockLoc` nhưng hiểu thêm tiền tố `## ` = tiêu đề phụ (style `h4`).
 *
 * `blockLoc` chỉ sinh đoạn thường và gạch đầu dòng; nội dung gốc của trang
 * này có hai tiêu đề phụ thật ("Cược bổ sung:", "Cược cộng:") đứng giữa thân
 * bài. Bỏ chúng đi thì hai gạch đầu dòng ngay dưới mất chỗ dựa; đổi chúng
 * thành đoạn thường thì mất phân cấp. Dựng trên `p`/`li` của `build.ts` để
 * `_key` vẫn do một nguồn duy nhất sinh ra.
 */
function richLoc(v: Record<Locale, string[]>): Record<Locale, unknown[]> {
  const out = {} as Record<Locale, unknown[]>
  for (const l of LOCALES) {
    const lines = v[l]
    if (!lines || lines.length === 0) throw new Error(`richLoc(): thiếu bản dịch "${l}"`)
    out[l] = lines.map((line) =>
      line.startsWith('## ') ? p(line.slice(3), 'h4') : line.startsWith('- ') ? li(line.slice(2)) : p(line),
    )
  }
  return out
}

/** Một ô của `tableSection`. `_key` do nơi gọi đặt để bảng chạy lại ra cùng
 * kết quả; `_type` bắt buộc vì schema khai `of: [{ type: 'localeString' }]`. */
const cell = (k: string, v: Six) => ({ _key: k, _type: 'localeString', ...v })
const row = (k: string, cells: Six[]) => ({
  _key: k,
  _type: 'row',
  cells: cells.map((c, i) => cell(`td-${i}`, c)),
})

/** Ô trống trong bản clone. Không bịa nội dung thay vào — gạch ngang là cách
 * đọc đúng cho screen reader ("không có dữ liệu") và giữ bảng đủ 6 ngôn ngữ. */
const DASH = L('—', '—', '—', '—', '—', '—')

// ───────────────────────────────────────────────────────────── ẢNH + ALT ───

const ALT_HERO = L(
  'Sàn chơi của câu lạc bộ với dãy bàn bài mặt nỉ xanh, ghế xoay bọc da và trần ô vuông hắt sáng tím',
  'The club gaming floor: rows of green-baize tables, tan leather swivel chairs and a coffered ceiling washed in violet light',
  '俱乐部游戏厅：一排排绿色台面赌桌、浅棕皮质转椅，方格天花板泛着紫色灯光',
  '클럽 게임 플로어 — 초록색 테이블과 가죽 회전의자가 늘어서 있고 격자 천장에 보라색 조명이 비칩니다',
  'クラブのゲームフロア。緑のテーブルと革張りの回転椅子が並び、格天井に紫色の照明が広がる',
  'โถงเกมของคลับ โต๊ะหน้าสักหลาดสีเขียวเรียงเป็นแถว เก้าอี้หมุนหุ้มหนัง และเพดานลายตารางอาบแสงสีม่วง',
)

const HERO_IMAGE = fig('Royal-Halong-Hotel-Casino-header.jpg', ALT_HERO)
const OG_IMAGE = fig('Royal-Halong-Hotel-Casino-header.jpg', ALT_HERO)

const CARD_IMAGES = [
  fig(
    'Royal-Halong-Hotel-Casino-01.jpg',
    L(
      'Bàn chơi lớn ở giữa sảnh, phía sau là dãy máy trò chơi điện tử dưới đèn chùm pha lê',
      'A large gaming table in the middle of the hall, rows of electronic gaming machines behind it under crystal chandeliers',
      '大厅中央的大型赌桌，身后是成排电子游戏机，头顶悬挂水晶吊灯',
      '홀 가운데 놓인 대형 게임 테이블과 그 뒤로 늘어선 전자 게임기, 위로는 크리스털 샹들리에',
      'ホール中央の大型ゲームテーブルと、その奥に並ぶ電子ゲーム機、頭上にはクリスタルシャンデリア',
      'โต๊ะเกมขนาดใหญ่กลางโถง ด้านหลังเป็นแถวเครื่องเกมอิเล็กทรอนิกส์ใต้โคมระย้าคริสตัล',
    ),
  ),
  fig(
    'Royal-Halong-Hotel-Casino-03.jpg',
    L(
      'Hai bàn bài mặt nỉ xanh nhìn về quầy thu ngân, bên phải là dãy máy trò chơi',
      'Two green-baize card tables facing the cashier counter, gaming machines along the right-hand wall',
      '两张绿色台面赌桌面朝收银台，右侧墙边是一排游戏机',
      '캐셔 카운터를 향한 초록색 카드 테이블 두 대, 오른쪽 벽면에는 게임기가 늘어서 있습니다',
      'キャッシャーカウンターに向かって置かれた緑のカードテーブル2台と、右手の壁沿いに並ぶゲーム機',
      'โต๊ะไพ่หน้าสักหลาดสีเขียวสองตัวหันไปทางเคาน์เตอร์แคชเชียร์ ด้านขวาเป็นแถวเครื่องเกม',
    ),
  ),
  fig(
    'Royal-Halong-Hotel-Casino-14.jpg',
    L(
      'Dãy máy trò chơi điện tử màn hình sáng rực, mỗi máy một ghế xoay đen',
      'A row of electronic gaming machines with bright screens, a black swivel chair at each',
      '一排屏幕明亮的电子游戏机，每台前放置一张黑色转椅',
      '화면이 밝게 빛나는 전자 게임기가 줄지어 있고 각 기기 앞에 검은색 회전의자가 놓여 있습니다',
      '明るい画面の電子ゲーム機が並び、それぞれの前に黒い回転椅子が置かれている',
      'แถวเครื่องเกมอิเล็กทรอนิกส์จอสว่าง พร้อมเก้าอี้หมุนสีดำหน้าเครื่องแต่ละเครื่อง',
    ),
  ),
  fig(
    'Royal-Halong-Hotel-Casino-12.jpg',
    L(
      'Tay người chia bài đặt lá bài lên mặt bàn Blackjack, các lá bài lưng đỏ xếp thành vòng cung',
      'A dealer placing a card on a Blackjack table, red-backed cards laid out in an arc',
      '荷官的手在二十一点赌桌上发牌，红色背面的扑克牌沿弧线排开',
      '블랙잭 테이블 위에 카드를 놓는 딜러의 손과 호를 그리며 놓인 붉은 뒷면 카드',
      'ブラックジャックテーブルにカードを置くディーラーの手と、弧を描いて並ぶ赤い裏面のカード',
      'มือของเจ้ามือวางไพ่บนโต๊ะแบล็คแจ็ค พร้อมไพ่หลังสีแดงเรียงเป็นเส้นโค้ง',
    ),
  ),
  fig(
    'Royal-Halong-Hotel-Casino-15.jpg',
    L(
      'Mặt bàn xúc xắc điện tử phát sáng với các ô đặt cược, một tay đặt chồng phỉnh vàng lên một ô',
      'A glowing electronic dice table layout, a hand placing a stack of yellow chips on one of the betting squares',
      '发光的电子骰宝桌面投注区，玩家将一叠黄色筹码放在其中一格上',
      '빛나는 전자 다이사이 테이블 레이아웃 위, 한 베팅 칸에 노란색 칩을 올려놓는 손',
      '光る電子ダイステーブルのレイアウトに、黄色いチップの山を置く手',
      'หน้าโต๊ะไฮโลอิเล็กทรอนิกส์ที่เรืองแสง พร้อมมือวางกองชิปสีเหลืองลงบนช่องเดิมพัน',
    ),
  ),
  fig(
    'Royal-Halong-Hotel-Casino-05.jpg',
    L(
      'Quầy bar cong mặt đá với dãy ghế đẩu gỗ và tủ rượu hắt sáng phía sau',
      'A curved stone-topped bar counter with wooden stools and backlit bottle shelves behind',
      '弧形石面吧台，配木质高脚凳，后方是打光的酒架',
      '나무 스툴이 놓인 곡선형 석재 바 카운터와 조명을 받은 뒤편 주류 선반',
      '木製スツールが並ぶ曲線の石天板バーカウンターと、背後のライトアップされた酒棚',
      'เคาน์เตอร์บาร์โค้งหน้าหิน พร้อมเก้าอี้สตูลไม้และชั้นวางขวดที่ส่องไฟด้านหลัง',
    ),
  ),
]

const BACCARAT_IMAGE = fig(
  'Royal-Halong-Hotel-Casino-07.jpg',
  L(
    'Nhân viên chia bài bên bàn Baccarat, mặt bàn in các ô Player và Banker',
    'A dealer at a baccarat table, the layout marked with the Player and Banker boxes',
    '百家乐赌桌旁的荷官，桌面印有闲家与庄家的投注区',
    '바카라 테이블 앞의 딜러와 플레이어·뱅커 베팅 구역이 표시된 테이블 레이아웃',
    'バカラテーブルに立つディーラーと、プレイヤー・バンカーのベットエリアが印されたレイアウト',
    'เจ้ามือประจำโต๊ะบาคาร่า หน้าโต๊ะมีช่องเดิมพันฝั่งผู้เล่นและฝั่งเจ้ามือ',
  ),
)

const ROULETTE_IMAGE = fig(
  'Royal-Ha-Long-casino-games-02.jpg',
  L(
    'Cận cảnh bánh xe Roulette với trục đồng ở giữa và các ô số đỏ đen xen kẽ',
    'A close-up of a roulette wheel, brass spindle at the centre and alternating red and black numbered pockets',
    '轮盘特写，中央为铜制转轴，红黑号码格交替排列',
    '룰렛 휠 클로즈업 — 가운데 황동 스핀들과 빨강·검정이 번갈아 놓인 숫자 칸',
    'ルーレットホイールのクローズアップ。中央の真鍮製スピンドルと、赤と黒が交互に並ぶ数字のポケット',
    'ภาพระยะใกล้ของวงล้อรูเล็ต แกนทองเหลืองตรงกลางและช่องตัวเลขสีแดงสลับดำ',
  ),
)

const BLACKJACK_IMAGE = fig(
  'Royal-Ha-Long-casino-games-04.jpg',
  L(
    'Bàn tay cầm hai lá bích Át và K trên mặt nỉ xanh, bên cạnh là chồng phỉnh đỏ',
    'A hand holding the Ace and King of spades over green baize, a stack of red chips beside them',
    '手中握着黑桃 A 与黑桃 K，绿色台面旁是一叠红色筹码',
    '초록색 펠트 위로 스페이드 에이스와 킹을 든 손, 옆에는 붉은 칩 더미',
    '緑のフェルトの上でスペードのエースとキングを持つ手と、脇に積まれた赤いチップ',
    'มือถือไพ่โพดำเอซและคิง เหนือโต๊ะสักหลาดสีเขียว ข้าง ๆ เป็นกองชิปสีแดง',
  ),
)

const BAR_IMAGE = fig(
  'Royal-Halong-Hotel-Casino-06.jpg',
  L(
    'Các hốc tủ gương viền thép trên tường đá, bày chai rượu và ly thuỷ tinh',
    'Mirror-backed display niches set into a stone wall, holding bottles and glassware',
    '嵌入石墙的镜面展示格，陈列着酒瓶与玻璃器皿',
    '석재 벽면에 설치된 거울 진열 니치에 주류 병과 글라스가 놓여 있습니다',
    '石張りの壁に設けられた鏡張りの飾り棚に、ボトルとグラスが並ぶ',
    'ช่องโชว์บุกระจกเงาฝังในผนังหิน จัดวางขวดเครื่องดื่มและแก้ว',
  ),
)

const CONTACT_IMAGE = fig(
  'casino-app.png',
  L(
    'Ba mã QR để kết nối với câu lạc bộ, lần lượt là Zalo, WeChat và LINE',
    'Three QR codes for contacting the club — Zalo, WeChat and LINE',
    '三个联系俱乐部的二维码，依次为 Zalo、微信和 LINE',
    '클럽 연락용 QR 코드 세 개 — 순서대로 Zalo, WeChat, LINE',
    'クラブへの連絡用QRコード3種。左からZalo、WeChat、LINE',
    'คิวอาร์โค้ดสามรหัสสำหรับติดต่อคลับ ได้แก่ Zalo, WeChat และ LINE',
  ),
)

const CTA_IMAGE = fig(
  'Royal-Ha-Long-Suite-02.jpg',
  L(
    'Phòng khách của suite với ghế sofa vàng, cửa kính lớn nhìn ra vịnh, phía trong là phòng ngủ rải cánh hoa hồng',
    'The living room of a suite — yellow sofas, full-height windows onto the bay, and beyond the partition a bedroom with rose petals on the bed',
    '套房起居室：黄色沙发、落地窗外的海湾景色，隔断之后是铺着玫瑰花瓣的卧室',
    '스위트 거실 — 노란색 소파, 만이 내다보이는 통창, 칸막이 너머에는 장미 꽃잎을 올린 침대가 있는 침실',
    'スイートのリビング。黄色のソファ、湾を望む大きな窓、仕切りの奥にはバラの花びらを飾ったベッドの寝室',
    'ห้องนั่งเล่นของห้องสวีท โซฟาสีเหลือง กระจกบานสูงมองเห็นอ่าว และเลยฉากกั้นเข้าไปเป็นห้องนอนที่โรยกลีบกุหลาบบนเตียง',
  ),
)

// ──────────────────────────────────────────────────── NHÃN DÙNG NHIỀU LẦN ───

const EYEBROW_GAMES = L('TRÒ CHƠI', 'THE GAMES', '游戏', '게임', 'ゲーム', 'เกม')
const HOW_TO_PLAY = L('Hướng dẫn cách chơi', 'How to play', '玩法说明', '게임 방법', '遊び方', 'วิธีการเล่น')
const PAYOUT_TABLE = L('Bảng trả thưởng', 'Payouts', '派彩说明', '배당 안내', '配当について', 'อัตราการจ่าย')
const VIEW_DETAILS = L('XEM CHI TIẾT', 'VIEW DETAILS', '查看详情', '자세히 보기', '詳細を見る', 'ดูรายละเอียด')

// ─────────────────────────────────────────────────────────── CÁC SECTION ───

const sections = [
  {
    _key: 'sec-0',
    _type: 'heroSection',
    heading: L('CASINO', 'CASINO', '娱乐场', '카지노', 'カジノ', 'คาสิโน'),
    subheading: L(
      'CÂU LẠC BỘ QUỐC TẾ HOÀNG GIA',
      'ROYAL INTERNATIONAL CLUB',
      '皇家国际俱乐部',
      '로열 인터내셔널 클럽',
      'ロイヤル国際クラブ',
      'รอยัล อินเตอร์เนชั่นแนล คลับ',
    ),
    background: HERO_IMAGE,
    height: 'medium',
  },

  // Giới thiệu + ĐIỀU KIỆN VÀO CỬA. Điều kiện phải HIỆN SẴN, không gập —
  // khách bay tới nơi rồi mới biết mình không được vào là lỗi nặng nhất trang
  // này có thể mắc. (Xem ghi chú "KHÔNG dùng cho ... điều kiện vào cửa" trong
  // `components/sections/CollapsibleGroup.tsx`.)
  {
    _key: 'sec-1',
    _type: 'richTextSection',
    tone: 'white',
    narrow: true,
    content: blockLoc({
      // "thỏa sức đám mình" trong bản clone là lỗi gõ của "đắm mình" — sửa
      // chính tả, không đổi nghĩa.
      vi: [
        'Đến với thành phố Hạ Long, khách quốc tế có thể ghé thăm Câu lạc bộ Quốc tế Hoàng Gia (Casino) dành cho người nước ngoài. Sở hữu 18 bàn chơi trực tiếp và 62 máy trò chơi điện tử, câu lạc bộ mang đến một không gian giải trí để quý khách thoả sức đắm mình.',
        'Câu lạc bộ Quốc tế Hoàng Gia hứa hẹn mang đến một địa điểm vui chơi không thể bỏ lỡ cho người nước ngoài tại Việt Nam và khách du lịch quốc tế trên thế giới.',
        '- Giờ mở cửa: 24/7',
        '- Điều kiện vào cửa: khách mang quốc tịch nước ngoài và từ đủ 18 tuổi.',
      ],
      en: [
        'In Ha Long, international visitors are welcome at the Royal International Club (Casino), reserved for foreign passport holders. With 18 live gaming tables and 62 electronic gaming machines, the club offers an evening that can be taken at your own pace.',
        'The Royal International Club is a destination in its own right, both for foreign residents in Vietnam and for travellers from further afield.',
        '- Opening hours: 24/7',
        '- Entry: foreign passport holders aged 18 and over.',
      ],
      zh: [
        '来到下龙市，持外国护照的宾客可前往专为外籍人士开设的皇家国际俱乐部（娱乐场）。俱乐部设有 18 张现场游戏桌与 62 台电子游戏机，为宾客提供从容自在的娱乐空间。',
        '皇家国际俱乐部是在越外籍人士与国际旅客不容错过的休闲去处。',
        '- 营业时间：24 小时全天候',
        '- 入场条件：持外国国籍且年满 18 周岁。',
      ],
      ko: [
        '하롱시를 찾은 외국 국적의 손님은 외국인 전용 로열 인터내셔널 클럽(카지노)을 이용하실 수 있습니다. 라이브 게임 테이블 18대와 전자 게임기 62대를 갖춘 공간에서 여유로운 시간을 보내실 수 있습니다.',
        '로열 인터내셔널 클럽은 베트남에 거주하는 외국인에게도, 해외에서 오신 여행객에게도 들러 볼 만한 공간입니다.',
        '- 운영 시간: 24시간 연중무휴',
        '- 입장 조건: 외국 국적이며 만 18세 이상.',
      ],
      ja: [
        'ハロン市を訪れる外国籍のお客様は、外国人専用のロイヤル国際クラブ（カジノ）をご利用いただけます。ライブゲームテーブル18卓と電子ゲーム機62台を備えた空間で、ご自分のペースでお過ごしいただけます。',
        'ロイヤル国際クラブは、ベトナム在住の外国籍の方にも、海外からのお客様にも、訪れる価値のある場所です。',
        '- 営業時間：24時間・年中無休',
        '- ご入場条件：外国籍かつ18歳以上の方。',
      ],
      th: [
        'เมื่อมาเยือนเมืองฮาลอง ผู้ถือหนังสือเดินทางต่างชาติสามารถแวะเยี่ยมชมรอยัล อินเตอร์เนชั่นแนล คลับ (คาสิโน) ซึ่งเปิดเฉพาะชาวต่างชาติ ภายในมีโต๊ะเกมสด 18 โต๊ะ และเครื่องเกมอิเล็กทรอนิกส์ 62 เครื่อง สำหรับช่วงเวลาผ่อนคลายตามจังหวะของท่านเอง',
        'รอยัล อินเตอร์เนชั่นแนล คลับ เป็นจุดหมายที่ชาวต่างชาติซึ่งพำนักในเวียดนามและนักเดินทางจากทั่วโลกไม่ควรพลาด',
        '- เวลาเปิดบริการ: ตลอด 24 ชั่วโมงทุกวัน',
        '- เงื่อนไขการเข้าใช้บริการ: ผู้ถือสัญชาติต่างชาติและมีอายุ 18 ปีขึ้นไป',
      ],
    }),
  },

  // Sáu ảnh thật của câu lạc bộ. Bản clone để chúng trong một băng carousel
  // không chú thích; ở đây mỗi ảnh được gọi đúng tên khu vực nó chụp, nên
  // khách biết mình sắp thấy gì trước khi bước vào.
  {
    _key: 'sec-2',
    _type: 'cardGridSection',
    columns: 3,
    heading: L('KHÔNG GIAN CÂU LẠC BỘ', 'INSIDE THE CLUB', '俱乐部空间', '클럽 공간', 'クラブの空間', 'ภายในคลับ'),
    cards: [
      {
        _key: 'card-0',
        _type: 'card',
        title: L('SÀN CHƠI CHÍNH', 'MAIN GAMING FLOOR', '主游戏厅', '메인 게임 플로어', 'メインゲームフロア', 'โซนเกมหลัก'),
        image: CARD_IMAGES[0],
      },
      {
        _key: 'card-1',
        _type: 'card',
        title: L('BÀN CHƠI TRỰC TIẾP', 'LIVE TABLES', '现场游戏桌', '라이브 테이블', 'ライブテーブル', 'โต๊ะเกมสด'),
        image: CARD_IMAGES[1],
      },
      {
        _key: 'card-2',
        _type: 'card',
        title: L(
          'MÁY TRÒ CHƠI ĐIỆN TỬ',
          'ELECTRONIC GAMING MACHINES',
          '电子游戏机',
          '전자 게임기',
          '電子ゲーム機',
          'เครื่องเกมอิเล็กทรอนิกส์',
        ),
        image: CARD_IMAGES[2],
      },
      {
        _key: 'card-3',
        _type: 'card',
        title: L('BÀN BLACKJACK', 'BLACKJACK TABLES', '二十一点桌', '블랙잭 테이블', 'ブラックジャックテーブル', 'โต๊ะแบล็คแจ็ค'),
        image: CARD_IMAGES[3],
      },
      {
        _key: 'card-4',
        _type: 'card',
        title: L(
          'BÀN XÚC XẮC ĐIỆN TỬ',
          'ELECTRONIC DICE TABLE',
          '电子骰宝桌',
          '전자 다이사이 테이블',
          '電子ダイステーブル',
          'โต๊ะไฮโลอิเล็กทรอนิกส์',
        ),
        image: CARD_IMAGES[4],
      },
      {
        _key: 'card-5',
        _type: 'card',
        // Tên riêng của quầy bar trong bản clone — giữ nguyên ở cả sáu ngôn ngữ.
        title: L('BAR CASINO', 'BAR CASINO', 'BAR CASINO', 'BAR CASINO', 'BAR CASINO', 'BAR CASINO'),
        image: CARD_IMAGES[5],
      },
    ],
  },

  // ── BACCARAT ──────────────────────────────────────────────────────────
  {
    _key: 'sec-3',
    _type: 'imageTextSection',
    tone: 'white',
    imageSide: 'left',
    imageFit: 'cover',
    eyebrow: EYEBROW_GAMES,
    heading: L('BACCARAT', 'BACCARAT', '百家乐', '바카라', 'バカラ', 'บาคาร่า'),
    image: BACCARAT_IMAGE,
    content: blockLoc({
      vi: [
        'Trong trò chơi Bài cào Baccarat, cửa Khách Chơi (Player) hoặc cửa Nhà Cái (Banker) sẽ thắng khi tổng điểm các lá bài được chia cho mỗi cửa đạt được điểm cao hơn và số điểm cao nhất là 9 điểm. Quy định chia bài (Tableau) sẽ không được thay đổi và không cần Khách Chơi đưa ra quyết định.',
      ],
      en: [
        'In Baccarat, either Player or Banker wins by holding the hand with the higher total, nine being the highest possible score. The drawing rules — the Tableau — are fixed and call for no decision from the player.',
      ],
      zh: [
        '百家乐中，闲家（Player）或庄家（Banker）以两方点数较高的一方获胜，最高点数为 9 点。补牌规则（Tableau）固定不变，无需玩家做出任何决定。',
      ],
      ko: [
        '바카라에서는 플레이어(Player) 또는 뱅커(Banker) 중 합계 점수가 높은 쪽이 이기며, 최고 점수는 9점입니다. 카드 분배 규칙(타블로)은 고정되어 있어 플레이어가 따로 결정하실 사항은 없습니다.',
      ],
      ja: [
        'バカラでは、プレイヤー（Player）またはバンカー（Banker）のうち合計点の高い方が勝ちとなり、最高点は9です。カードの配り方（タブロー）は固定されており、お客様が判断される必要はありません。',
      ],
      th: [
        'ในบาคาร่า ฝั่งผู้เล่น (Player) หรือฝั่งเจ้ามือ (Banker) ที่มีแต้มรวมสูงกว่าจะเป็นฝ่ายชนะ โดยแต้มสูงสุดคือ 9 กติกาการแจกไพ่ (Tableau) เป็นกติกาตายตัว ผู้เล่นไม่ต้องตัดสินใจเพิ่มเติม',
      ],
    }),
  },
  {
    _key: 'sec-4',
    _type: 'richTextSection',
    tone: 'white',
    narrow: false,
    collapsible: true,
    heading: L('Luật chơi', 'Rules of play', '游戏规则', '게임 규칙', 'ゲームのルール', 'กติกาการเล่น'),
    content: richLoc({
      vi: [
        'Dealer sẽ chia 2 lá bài đầu tiên cho mỗi Banker (Nhà cái) và Player (Người chơi). Tùy theo tổng điểm mỗi bên và luật chia bài (Tableau) mà Dealer sẽ chia lá bài thứ 3 cho Player hoặc Banker, hoặc cả 2 bên, hoặc không.',
        'Ngoài các cược chính của cửa Player và Banker, có thể đặt cược vào cửa Hòa, Người chơi theo cặp, Nhà cái theo cặp và Super Six (không bao gồm thuế trong cửa của Banker và tỷ lệ thắng 1 ăn 11).',
        'Cược phải được đặt trước khi người chia bài thông báo Không Cược nữa và bắt đầu vòng chơi.',
        'Bài cào không bị đánh thuế: Cược thắng ở cửa Player và Banker sẽ được trả bằng số tiền đặt cược. Nhưng trong trường hợp Banker thắng với 6 điểm, tiền cược thắng sẽ chỉ được trả một nửa số tiền đặt cược.',
        '## Cược bổ sung',
        '- Cược Hòa sẽ thắng khi kết quả vòng đấu là hòa (tổng điểm của Player và Banker bằng nhau) và sẽ được trả gấp 8 lần số tiền đặt cược.',
        '- Đặt cược vào Đôi Player hoặc Đôi Banker sẽ thắng khi 2 lá bài đầu tiên giống nhau (không bắt buộc phải cùng chất) và sẽ được trả gấp 11 lần số tiền đặt cược.',
      ],
      en: [
        'The dealer deals the first two cards to both Banker and Player. Depending on each side’s total and on the Tableau, the dealer then draws a third card for the Player, for the Banker, for both, or for neither.',
        'Besides the main Player and Banker bets, side bets are available on Tie, Player Pair, Banker Pair and Super Six (no commission on the Banker side, paying 11 to 1).',
        'All bets must be placed before the dealer calls no more bets and starts the round.',
        'Commission-free baccarat: winning Player and Banker bets are paid at the amount staked. When the Banker wins with a total of 6, however, the winning bet is paid at half the stake.',
        '## Side bets',
        '- The Tie bet wins when the round ends level (Player and Banker totals are equal) and pays 8 times the stake.',
        '- A Player Pair or Banker Pair bet wins when that side’s first two cards match in value (they need not share a suit) and pays 11 times the stake.',
      ],
      zh: [
        '荷官先为庄家与闲家各发两张牌。随后根据双方点数与补牌规则（Tableau），荷官会为闲家、庄家、双方补发第三张牌，或双方均不补牌。',
        '除闲家与庄家两个主注外，还可投注和局、闲对、庄对以及 Super Six（庄家一方不收佣金，赔率 1 赔 11）。',
        '所有投注须在荷官宣布停止下注并开始该局之前完成。',
        '免佣百家乐：闲家与庄家的中奖注按投注额派彩；但若庄家以 6 点获胜，中奖注只按投注额的一半派彩。',
        '## 副注',
        '- 和局注在该局为和局（闲家与庄家点数相同）时获胜，派彩为投注额的 8 倍。',
        '- 闲对或庄对注在该方前两张牌点数相同时获胜（无需同花色），派彩为投注额的 11 倍。',
      ],
      ko: [
        '딜러는 뱅커와 플레이어에게 각각 두 장의 카드를 먼저 나눠 줍니다. 이후 양측의 합계와 타블로 규칙에 따라 플레이어, 뱅커, 양쪽 모두에게 세 번째 카드를 주거나 어느 쪽에도 주지 않습니다.',
        '플레이어와 뱅커의 기본 베팅 외에 타이, 플레이어 페어, 뱅커 페어, 슈퍼 식스(뱅커 쪽 커미션 없음, 배당 11 대 1)에도 베팅하실 수 있습니다.',
        '모든 베팅은 딜러가 베팅 종료를 알리고 라운드를 시작하기 전에 마치셔야 합니다.',
        '무커미션 바카라: 플레이어와 뱅커의 당첨 베팅은 베팅액과 같은 금액으로 지급됩니다. 다만 뱅커가 6점으로 이긴 경우 당첨 베팅은 베팅액의 절반만 지급됩니다.',
        '## 추가 베팅',
        '- 타이 베팅은 라운드가 무승부(플레이어와 뱅커의 합계가 같음)로 끝날 때 당첨되며 베팅액의 8배를 지급합니다.',
        '- 플레이어 페어 또는 뱅커 페어 베팅은 해당 쪽의 첫 두 장이 같은 숫자일 때(무늬는 달라도 됩니다) 당첨되며 베팅액의 11배를 지급합니다.',
      ],
      ja: [
        'ディーラーはバンカーとプレイヤーにそれぞれ最初の2枚を配ります。その後、双方の合計点とタブローに従い、プレイヤー、バンカー、両方に3枚目を配るか、いずれにも配りません。',
        'プレイヤーとバンカーのメインベットのほか、タイ、プレイヤーペア、バンカーペア、スーパーシックス（バンカー側はコミッションなし、配当11対1）へのベットもご利用いただけます。',
        'ベットは、ディーラーがノーモアベットを告げてゲームを開始する前にお済ませください。',
        'ノーコミッション・バカラ：プレイヤーおよびバンカーの勝ちベットは賭け金と同額をお支払いします。ただしバンカーが6で勝った場合、勝ちベットの配当は賭け金の半額となります。',
        '## サイドベット',
        '- タイベットは、そのラウンドが引き分け（プレイヤーとバンカーの合計が同じ）のときに的中し、賭け金の8倍をお支払いします。',
        '- プレイヤーペアまたはバンカーペアのベットは、その側の最初の2枚が同じ数字のとき（スートは問いません）に的中し、賭け金の11倍をお支払いします。',
      ],
      th: [
        'เจ้ามือแจกไพ่สองใบแรกให้ทั้งฝั่งเจ้ามือและฝั่งผู้เล่น จากนั้นจะจั่วไพ่ใบที่สามให้ฝั่งผู้เล่น ฝั่งเจ้ามือ ทั้งสองฝั่ง หรือไม่จั่วเลย ขึ้นอยู่กับแต้มรวมของแต่ละฝั่งและกติกา Tableau',
        'นอกจากเดิมพันหลักฝั่งผู้เล่นและฝั่งเจ้ามือ ยังมีเดิมพันเสมอ (Tie) ไพ่คู่ฝั่งผู้เล่น ไพ่คู่ฝั่งเจ้ามือ และ Super Six (ไม่มีค่าคอมมิชชันฝั่งเจ้ามือ อัตราจ่าย 1 ต่อ 11)',
        'ต้องวางเดิมพันให้เสร็จก่อนที่เจ้ามือจะประกาศปิดรับเดิมพันและเริ่มรอบการเล่น',
        'บาคาร่าแบบไม่หักค่าคอมมิชชัน: เดิมพันที่ชนะทั้งฝั่งผู้เล่นและฝั่งเจ้ามือจ่ายเท่ากับเงินเดิมพัน แต่หากฝั่งเจ้ามือชนะด้วยแต้ม 6 เดิมพันที่ชนะจะจ่ายเพียงครึ่งหนึ่งของเงินเดิมพัน',
        '## เดิมพันเสริม',
        '- เดิมพันเสมอจะชนะเมื่อผลของรอบนั้นเสมอกัน (แต้มรวมของฝั่งผู้เล่นและฝั่งเจ้ามือเท่ากัน) และจ่าย 8 เท่าของเงินเดิมพัน',
        '- เดิมพันไพ่คู่ฝั่งผู้เล่นหรือฝั่งเจ้ามือจะชนะเมื่อไพ่สองใบแรกของฝั่งนั้นมีค่าเท่ากัน (ไม่จำเป็นต้องดอกเดียวกัน) และจ่าย 11 เท่าของเงินเดิมพัน',
      ],
    }),
  },
  {
    _key: 'sec-5',
    _type: 'tableSection',
    collapsible: true,
    heading: L(
      'Nguyên tắc rút lá thứ 3 (đối với Player)',
      'Third-card rule — Player',
      '第三张牌规则（闲家）',
      '세 번째 카드 규칙 (플레이어)',
      '3枚目のカードのルール（プレイヤー）',
      'กติกาไพ่ใบที่สาม (ฝั่งผู้เล่น)',
    ),
    headers: [
      cell(
        'th-0',
        L(
          'TỔNG ĐIỂM 2 LÁ BÀI ĐẦU TIÊN',
          'TOTAL OF THE FIRST TWO CARDS',
          '前两张牌点数合计',
          '첫 두 장의 합계',
          '最初の2枚の合計',
          'แต้มรวมของไพ่สองใบแรก',
        ),
      ),
      cell('th-1', L('PLAYER', 'PLAYER', '闲家', '플레이어', 'プレイヤー', 'ผู้เล่น')),
    ],
    rows: [
      row('tr-0', [
        L('0-1-2-3-4-5', '0-1-2-3-4-5', '0-1-2-3-4-5', '0-1-2-3-4-5', '0-1-2-3-4-5', '0-1-2-3-4-5'),
        L('Rút thêm bài', 'Draws a card', '补牌', '카드를 받습니다', 'カードを引く', 'จั่วไพ่เพิ่ม'),
      ]),
      row('tr-1', [
        L('6-7', '6-7', '6-7', '6-7', '6-7', '6-7'),
        L('Không rút thêm bài', 'Stands', '不补牌', '카드를 받지 않습니다', 'カードを引かない', 'ไม่จั่วไพ่เพิ่ม'),
      ]),
      // Bản clone ghi đúng chữ "Rút thêm cho cả 2 cửa" ở hàng 8-9. Dịch sát
      // nguyên văn, KHÔNG "sửa" theo luật Baccarat quốc tế (8-9 là bài tự
      // nhiên, hai cửa đều dừng) — nghi vấn này đã ghi lại trong báo cáo để
      // chủ đầu tư xác nhận với quản lý sàn.
      row('tr-2', [
        L('8-9', '8-9', '8-9', '8-9', '8-9', '8-9'),
        L(
          'Rút thêm cho cả 2 cửa',
          'Cards drawn for both sides',
          '双方均补牌',
          '양쪽 모두 카드를 받습니다',
          '両者ともカードを引く',
          'จั่วไพ่ให้ทั้งสองฝั่ง',
        ),
      ]),
    ],
  },
  {
    _key: 'sec-6',
    _type: 'tableSection',
    collapsible: true,
    heading: L(
      'Nguyên tắc rút lá thứ 3 (đối với Banker)',
      'Third-card rule — Banker',
      '第三张牌规则（庄家）',
      '세 번째 카드 규칙 (뱅커)',
      '3枚目のカードのルール（バンカー）',
      'กติกาไพ่ใบที่สาม (ฝั่งเจ้ามือ)',
    ),
    headers: [
      cell(
        'th-0',
        L(
          'TỔNG ĐIỂM 2 LÁ BÀI ĐẦU TIÊN',
          'TOTAL OF THE FIRST TWO CARDS',
          '前两张牌点数合计',
          '첫 두 장의 합계',
          '最初の2枚の合計',
          'แต้มรวมของไพ่สองใบแรก',
        ),
      ),
      cell(
        'th-1',
        L(
          'RÚT THÊM NẾU ĐIỂM LÁ THỨ 3 CỦA PLAYER LÀ',
          'DRAWS IF THE PLAYER’S THIRD CARD IS',
          '当闲家第三张牌为下列点数时补牌',
          '플레이어의 세 번째 카드가 다음일 때 받습니다',
          'プレイヤーの3枚目が次の場合に引く',
          'จั่วเมื่อไพ่ใบที่สามของฝั่งผู้เล่นเป็น',
        ),
      ),
      cell(
        'th-2',
        L(
          'KHÔNG RÚT THÊM NẾU ĐIỂM LÁ THỨ 3 CỦA PLAYER LÀ',
          'STANDS IF THE PLAYER’S THIRD CARD IS',
          '当闲家第三张牌为下列点数时不补牌',
          '플레이어의 세 번째 카드가 다음일 때 받지 않습니다',
          'プレイヤーの3枚目が次の場合は引かない',
          'ไม่จั่วเมื่อไพ่ใบที่สามของฝั่งผู้เล่นเป็น',
        ),
      ),
    ],
    rows: (() => {
      const DRAW = L(
        'Rút lá thứ 3',
        'Draws the third card',
        '补第三张牌',
        '세 번째 카드를 받습니다',
        '3枚目を引く',
        'จั่วไพ่ใบที่สาม',
      )
      const STAND = L(
        'Không rút lá thứ 3',
        'Does not draw',
        '不补第三张牌',
        '세 번째 카드를 받지 않습니다',
        '3枚目を引かない',
        'ไม่จั่วไพ่ใบที่สาม',
      )
      /** Ô chỉ chứa chữ số — giống hệt ở cả sáu ngôn ngữ. */
      const N = (s: string) => L(s, s, s, s, s, s)
      return [
        row('tr-0', [N('0-1-2'), DRAW, DRAW]),
        row('tr-1', [N('3'), N('0,1,2,3,4,5,6,7,9'), N('8')]),
        row('tr-2', [N('4'), N('2,3,4,5,6,7'), N('0,1,8,9')]),
        row('tr-3', [N('5'), N('4,5,6,7'), N('0,1,2,3,8,9')]),
        row('tr-4', [N('6'), N('6,7'), N('0,1,2,3,4,5,8,9')]),
        row('tr-5', [N('7'), STAND, STAND]),
        row('tr-6', [N('8,9'), STAND, STAND]),
      ]
    })(),
  },
  {
    _key: 'sec-7',
    _type: 'richTextSection',
    tone: 'white',
    narrow: false,
    collapsible: true,
    heading: L('Bảng hoàn trả', 'Payouts', '派彩说明', '배당 안내', '配当について', 'อัตราการจ่าย'),
    content: richLoc({
      vi: [
        'Cược thắng của Banker sẽ được thanh toán theo tỷ lệ cược từ 19 đến 20. Player có thể trả toàn bộ 5% hoa hồng hoặc một phần và khoản này sẽ được thu trước khi thanh toán. Ví dụ: Banker sẽ nói “Đặt cược là 10.000 USD, trả 9.500 USD”, nhận 500 USD hoa hồng.',
        '## Cược cộng',
        '- Cược Hòa sẽ thắng với tỷ lệ 1 ăn 8 nếu cửa Banker và Player bằng nhau, và thua nếu điểm không bằng nhau.',
        '- Ngoài ra, người chơi có thể đặt cược vào các Cặp trên tay của Banker hoặc Player. Một ván bài được coi là Đôi nếu hai quân bài đầu tiên của một bên tạo thành một cặp (hai quân bài có cùng giá trị, bất kể màu sắc hay chất) — ví dụ J và Q không phải là Đôi nhưng J và J là Đôi. Mỗi cược thắng được thanh toán theo tỷ lệ 1 ăn 11.',
      ],
      en: [
        'Winning Banker bets are paid at odds of 19 to 20. The 5% commission may be settled in full or in part and is collected before the payout. For example, the Banker will call: a 10,000 USD bet pays 9,500 USD, with 500 USD taken as commission.',
        '## Side bets',
        '- The Tie bet pays 8 to 1 when Banker and Player finish level, and loses when the totals differ.',
        '- Bets may also be placed on a Pair in the Banker’s or the Player’s hand. A hand counts as a Pair when its first two cards share the same value, regardless of colour or suit — J and Q is not a Pair, J and J is. Each winning bet pays 11 to 1.',
      ],
      zh: [
        '庄家中奖注按 19 比 20 的赔率派彩。5% 佣金可一次付清或分次支付，并在派彩前收取。例如：投注 10,000 美元，派彩 9,500 美元，收取 500 美元佣金。',
        '## 副注',
        '- 和局注在庄闲点数相同时按 1 赔 8 派彩，点数不同则输。',
        '- 玩家亦可投注庄家或闲家手牌成对。若一方前两张牌点数相同即为对子，与颜色或花色无关——J 与 Q 不算对子，J 与 J 才算。每注中奖按 1 赔 11 派彩。',
      ],
      ko: [
        '뱅커의 당첨 베팅은 19 대 20의 배당으로 지급됩니다. 5% 커미션은 전액 또는 일부를 지불하실 수 있으며 지급 전에 징수합니다. 예를 들어 10,000 USD 베팅은 9,500 USD를 지급하고 500 USD를 커미션으로 받습니다.',
        '## 추가 베팅',
        '- 타이 베팅은 뱅커와 플레이어의 점수가 같으면 1 대 8로 지급되고, 점수가 다르면 잃게 됩니다.',
        '- 뱅커 또는 플레이어 손의 페어에도 베팅하실 수 있습니다. 첫 두 장이 같은 숫자면 페어로 인정되며 색이나 무늬는 상관없습니다 — J와 Q는 페어가 아니고 J와 J는 페어입니다. 당첨 베팅은 1 대 11로 지급됩니다.',
      ],
      ja: [
        'バンカーの勝ちベットは19対20の配当でお支払いします。5%のコミッションは全額または一部をお支払いいただき、配当前に申し受けます。例：10,000 USDのベットに対し9,500 USDをお支払いし、500 USDをコミッションとして申し受けます。',
        '## サイドベット',
        '- タイベットはバンカーとプレイヤーが同点のとき1対8で配当となり、点数が異なる場合は負けとなります。',
        '- バンカーまたはプレイヤーの手札のペアにベットすることもできます。最初の2枚が同じ数字であればペアとなり、色やスートは問いません。JとQはペアではなく、JとJはペアです。的中したベットは1対11でお支払いします。',
      ],
      th: [
        'เดิมพันที่ชนะฝั่งเจ้ามือจ่ายในอัตรา 19 ต่อ 20 ผู้เล่นสามารถชำระค่าคอมมิชชัน 5% เต็มจำนวนหรือบางส่วน โดยจะเรียกเก็บก่อนการจ่ายเงิน ตัวอย่างเช่น เดิมพัน 10,000 USD จ่าย 9,500 USD และเก็บค่าคอมมิชชัน 500 USD',
        '## เดิมพันเสริม',
        '- เดิมพันเสมอจ่าย 1 ต่อ 8 เมื่อแต้มฝั่งเจ้ามือและฝั่งผู้เล่นเท่ากัน และแพ้เมื่อแต้มไม่เท่ากัน',
        '- ผู้เล่นยังสามารถเดิมพันไพ่คู่ในมือฝั่งเจ้ามือหรือฝั่งผู้เล่นได้ ไพ่จะนับเป็นคู่เมื่อไพ่สองใบแรกของฝั่งนั้นมีค่าเท่ากัน ไม่ว่าจะสีหรือดอกใด เช่น J กับ Q ไม่ใช่คู่ แต่ J กับ J เป็นคู่ เดิมพันที่ชนะจ่าย 1 ต่อ 11',
      ],
    }),
  },

  // ── ROULETTE ──────────────────────────────────────────────────────────
  {
    _key: 'sec-8',
    _type: 'imageTextSection',
    tone: 'cream',
    imageSide: 'right',
    imageFit: 'contain',
    eyebrow: EYEBROW_GAMES,
    heading: L('ROULETTE', 'ROULETTE', '轮盘', '룰렛', 'ルーレット', 'รูเล็ต'),
    image: ROULETTE_IMAGE,
    content: blockLoc({
      vi: [
        'Roulette hay còn gọi là trò Cò Quay, là trò chơi có một quả banh xoay tròn trên một bánh xe mà trên đó có 37 ngăn chứa các con số từ 0 – 36, gồm 18 con số màu đen và 18 con số màu đỏ được sắp xếp xen kẽ nhau trên vòng bánh xe. Số 0 là số có màu xanh lá cây và cũng được đặt cược như những con số khác.',
      ],
      en: [
        'Roulette is played with a ball spun around a wheel of 37 pockets numbered 0 to 36 — eighteen black and eighteen red, alternating around the rim. Zero is green and can be backed like any other number.',
      ],
      zh: [
        '轮盘以一颗小球在转盘上旋转，转盘共有 37 个号码格，从 0 到 36，其中 18 个黑色号码与 18 个红色号码沿转盘交替排列。0 为绿色，同样可以像其他号码一样投注。',
      ],
      ko: [
        '룰렛은 0부터 36까지 37개의 숫자 칸이 있는 휠 위로 볼을 굴리는 게임입니다. 검은색 18개와 빨간색 18개의 숫자가 휠을 따라 번갈아 배치되며, 0은 초록색으로 다른 숫자와 마찬가지로 베팅하실 수 있습니다.',
      ],
      ja: [
        'ルーレットは、0から36までの37のポケットを備えたホイールにボールを回して行うゲームです。黒18・赤18の数字がホイールの縁に交互に並び、0は緑色で、他の数字と同じようにベットできます。',
      ],
      th: [
        'รูเล็ตเล่นด้วยลูกบอลที่หมุนไปบนวงล้อซึ่งมีช่องตัวเลข 37 ช่อง ตั้งแต่ 0 ถึง 36 โดยมีตัวเลขสีดำ 18 ตัวและสีแดง 18 ตัวเรียงสลับกันรอบวงล้อ เลข 0 เป็นสีเขียวและวางเดิมพันได้เช่นเดียวกับตัวเลขอื่น',
      ],
    }),
  },
  {
    _key: 'sec-9',
    _type: 'richTextSection',
    tone: 'cream',
    narrow: false,
    collapsible: true,
    heading: L('Phỉnh / Chip', 'Chips', '筹码', '칩', 'チップ', 'ชิป'),
    content: blockLoc({
      vi: [
        '- Phỉnh tiền mặt và phỉnh màu đều được sử dụng trong trò chơi Roulette.',
        '- Phỉnh tiền mặt có thể được quy đổi tại bàn hoặc tại quầy thu ngân.',
        '- Chơi phỉnh màu sẽ phân biệt được những người chơi khác nhau trên cùng một bàn và phỉnh màu sẽ chỉ có giá trị trên bàn chơi độc lập đó.',
        '- Khi đổi phỉnh màu, người chơi khác nhau sẽ được đổi những màu khác nhau trên cùng một bàn trò chơi.',
        '- Mệnh giá của phỉnh màu thông thường sẽ là giá trị đặt cược tối thiểu của bàn trò chơi. Nhưng phỉnh màu cũng có thể được quy đổi với mệnh giá cao hơn theo yêu cầu.',
        '- Phỉnh màu phải được đổi lại phỉnh tiền mặt khi kết thúc trò chơi hoặc khi dời sang bàn trò chơi khác.',
        '- Phỉnh tiền mặt được chấp nhận ở bất kỳ bàn trò chơi nào trong câu lạc bộ.',
        'Để biết thêm chi tiết về trò chơi Roulette, vui lòng đặt câu hỏi cho bất kỳ nhân viên nào phụ trách bàn trò chơi Roulette.',
      ],
      en: [
        '- Both cash chips and colour chips are used at roulette.',
        '- Cash chips can be exchanged at the table or at the cashier.',
        '- Colour chips tell players at the same table apart, and are valid only at the table where they were issued.',
        '- When colour chips are issued, each player at that table receives a different colour.',
        '- A colour chip is normally worth the table minimum, but a higher denomination can be arranged on request.',
        '- Colour chips must be exchanged back into cash chips when you finish playing or move to another table.',
        '- Cash chips are accepted at every table in the club.',
        'For anything else about roulette, please ask any member of staff at the roulette table.',
      ],
      zh: [
        '- 轮盘游戏中同时使用现金筹码与颜色筹码。',
        '- 现金筹码可在赌桌或收银台兑换。',
        '- 颜色筹码用于区分同一赌桌上的不同玩家，且仅在发放筹码的该赌桌有效。',
        '- 兑换颜色筹码时，同一赌桌上的每位玩家会获得不同颜色。',
        '- 颜色筹码的面值通常为该赌桌的最低投注额，亦可应要求兑换为更高面值。',
        '- 结束游戏或转至其他赌桌时，须将颜色筹码换回现金筹码。',
        '- 现金筹码在俱乐部内任何一张赌桌均可使用。',
        '如需了解轮盘游戏的更多细节，欢迎向轮盘赌桌的任何一位工作人员咨询。',
      ],
      ko: [
        '- 룰렛에서는 캐시 칩과 컬러 칩을 모두 사용합니다.',
        '- 캐시 칩은 테이블이나 캐셔에서 교환하실 수 있습니다.',
        '- 컬러 칩은 같은 테이블의 플레이어를 구분하기 위한 것으로, 발급된 해당 테이블에서만 유효합니다.',
        '- 컬러 칩을 교환하실 때 같은 테이블의 플레이어마다 다른 색이 배정됩니다.',
        '- 컬러 칩의 액면가는 보통 해당 테이블의 최소 베팅액이며, 요청하시면 더 높은 액면가로도 교환하실 수 있습니다.',
        '- 게임을 마치거나 다른 테이블로 이동하실 때에는 컬러 칩을 캐시 칩으로 다시 교환하셔야 합니다.',
        '- 캐시 칩은 클럽 내 모든 테이블에서 사용하실 수 있습니다.',
        '룰렛에 관해 더 궁금하신 점은 룰렛 테이블 담당 직원에게 언제든 문의해 주십시오.',
      ],
      ja: [
        '- ルーレットではキャッシュチップとカラーチップの両方を使用します。',
        '- キャッシュチップはテーブルまたはキャッシャーで交換できます。',
        '- カラーチップは同じテーブルのお客様を区別するためのもので、発行されたそのテーブルでのみ有効です。',
        '- カラーチップへの交換時には、同じテーブルのお客様ごとに異なる色をお渡しします。',
        '- カラーチップの額面は通常そのテーブルのミニマムベットですが、ご希望に応じて高額面での交換も承ります。',
        '- ゲームを終えるとき、または別のテーブルへ移動されるときは、カラーチップをキャッシュチップにお戻しください。',
        '- キャッシュチップはクラブ内のすべてのテーブルでご利用いただけます。',
        'ルーレットについてご不明な点は、ルーレットテーブルの担当スタッフまでお気軽にお尋ねください。',
      ],
      th: [
        '- เกมรูเล็ตใช้ทั้งชิปเงินสดและชิปสี',
        '- ชิปเงินสดสามารถแลกได้ที่โต๊ะเกมหรือที่เคาน์เตอร์แคชเชียร์',
        '- ชิปสีใช้แยกผู้เล่นแต่ละคนบนโต๊ะเดียวกัน และใช้ได้เฉพาะที่โต๊ะซึ่งออกชิปนั้นเท่านั้น',
        '- เมื่อแลกชิปสี ผู้เล่นแต่ละคนบนโต๊ะเดียวกันจะได้รับสีที่แตกต่างกัน',
        '- มูลค่าของชิปสีโดยทั่วไปเท่ากับเดิมพันขั้นต่ำของโต๊ะนั้น แต่สามารถขอแลกเป็นมูลค่าที่สูงกว่าได้',
        '- ต้องแลกชิปสีกลับเป็นชิปเงินสดเมื่อเลิกเล่นหรือย้ายไปโต๊ะอื่น',
        '- ชิปเงินสดใช้ได้ทุกโต๊ะภายในคลับ',
        'หากต้องการทราบรายละเอียดเพิ่มเติมเกี่ยวกับรูเล็ต กรุณาสอบถามพนักงานประจำโต๊ะรูเล็ตได้ทุกท่าน',
      ],
    }),
  },
  {
    _key: 'sec-10',
    _type: 'richTextSection',
    tone: 'cream',
    narrow: false,
    collapsible: true,
    heading: HOW_TO_PLAY,
    content: blockLoc({
      vi: [
        '- Dùng phỉnh đặt cược vào bất cứ con số độc lập hoặc tổ hợp những con số mà bạn cho là may mắn trên mặt bàn trò chơi.',
        '- Nhân viên điều khiển trò chơi sẽ giúp bạn đặt cược vào các con số trên bàn nếu được yêu cầu, và bạn cần kiểm tra lại những cược đó đã đặt đúng như yêu cầu.',
        '- Nhân viên điều khiển trò chơi sẽ đánh quả banh trên vòng bánh xe.',
        '- Khi này bạn vẫn có thể đặt cược đến khi nhân viên điều khiển trò chơi ra hiệu không được đặt nữa.',
        '- Sau khi quả banh rơi vào một trong những con số trên bánh xe, nhân viên điều khiển trò chơi sẽ thông báo con số trúng thưởng và đặt một quân cờ (dolly) lên con số đó trên mặt bàn trò chơi.',
        '- Các cược thắng được giữ lại trên mặt bàn trò chơi để thanh toán sau khi nhân viên điều khiển trò chơi thu vào các cược thua.',
      ],
      en: [
        '- Place your chips on any single number, or on any combination of numbers, on the layout.',
        '- The dealer will place bets on your behalf on request; please check that they have been placed as you intended.',
        '- The dealer then spins the ball around the wheel.',
        '- You may keep betting until the dealer signals that no more bets are accepted.',
        '- Once the ball settles in a pocket, the dealer calls the winning number and marks it on the layout with the dolly.',
        '- Winning bets stay on the layout and are paid once the dealer has cleared the losing bets.',
      ],
      zh: [
        '- 用筹码在桌面上投注任意单个号码，或您认为幸运的号码组合。',
        '- 如有需要，荷官可代为下注，请您确认下注与要求一致。',
        '- 随后荷官会将小球投入转盘。',
        '- 此时仍可继续下注，直至荷官示意停止下注。',
        '- 小球落入号码格后，荷官会宣布中奖号码，并在桌面对应号码上放置标记（dolly）。',
        '- 中奖注保留在桌面，待荷官收走输注后进行派彩。',
      ],
      ko: [
        '- 칩을 사용해 레이아웃 위의 단일 숫자 또는 원하시는 숫자 조합에 베팅하십시오.',
        '- 요청하시면 딜러가 대신 베팅해 드립니다. 요청하신 대로 놓였는지 확인해 주십시오.',
        '- 이어서 딜러가 휠 위로 볼을 굴립니다.',
        '- 딜러가 베팅 종료를 알릴 때까지 계속 베팅하실 수 있습니다.',
        '- 볼이 한 칸에 멈추면 딜러가 당첨 숫자를 알리고 레이아웃 위 해당 숫자에 마커(돌리)를 놓습니다.',
        '- 당첨 베팅은 레이아웃에 그대로 두었다가, 딜러가 잃은 베팅을 수거한 뒤 지급합니다.',
      ],
      ja: [
        '- チップをレイアウト上の任意の単一数字、またはお好みの数字の組み合わせに置いてベットします。',
        '- ご要望があればディーラーが代わりにベットをお置きします。ご希望どおりに置かれているかご確認ください。',
        '- その後、ディーラーがホイールにボールを回します。',
        '- ディーラーがノーモアベットの合図をするまでは、引き続きベットできます。',
        '- ボールがポケットに収まると、ディーラーが当たり番号を告げ、レイアウト上のその数字にマーカー（ドリー）を置きます。',
        '- 的中したベットはレイアウト上に残され、ディーラーが外れベットを回収した後にお支払いします。',
      ],
      th: [
        '- ใช้ชิปวางเดิมพันบนตัวเลขเดี่ยวหรือกลุ่มตัวเลขใดก็ได้บนหน้าโต๊ะ',
        '- พนักงานประจำโต๊ะจะช่วยวางเดิมพันให้เมื่อได้รับการร้องขอ กรุณาตรวจสอบว่าวางตรงตามที่ต้องการ',
        '- จากนั้นพนักงานจะปล่อยลูกบอลให้หมุนบนวงล้อ',
        '- ในช่วงนี้ยังวางเดิมพันได้จนกว่าพนักงานจะให้สัญญาณปิดรับเดิมพัน',
        '- เมื่อลูกบอลตกลงในช่องใดช่องหนึ่ง พนักงานจะประกาศเลขที่ชนะและวางตัวมาร์ก (dolly) บนเลขนั้นบนหน้าโต๊ะ',
        '- เดิมพันที่ชนะจะคงอยู่บนหน้าโต๊ะ และจะจ่ายหลังจากพนักงานเก็บเดิมพันที่แพ้แล้ว',
      ],
    }),
  },
  {
    _key: 'sec-11',
    _type: 'tableSection',
    collapsible: true,
    heading: L('Bảng trả thưởng', 'Bet types', '投注类型', '베팅 종류', 'ベットの種類', 'ประเภทเดิมพัน'),
    headers: [
      cell('th-0', L('CƯỢC TRONG', 'INSIDE BETS', '内围投注', '인사이드 베팅', 'インサイドベット', 'เดิมพันวงใน')),
      // Cột giữa trong bản clone KHÔNG có tiêu đề; nó chứa các chữ cái A–H
      // đánh dấu vị trí cược trên sơ đồ mặt bàn. Đặt tên "Ký hiệu" cho cột —
      // `<th>` rỗng là ô mà screen reader đọc ra khoảng lặng, và đây là mô tả
      // đúng nội dung cột chứ không phải dữ liệu bịa thêm.
      cell('th-1', L('KÝ HIỆU', 'KEY', '标示', '표기', '記号', 'สัญลักษณ์')),
      cell('th-2', L('CHÚ THÍCH', 'NOTES', '说明', '설명', '備考', 'หมายเหตุ')),
    ],
    rows: [
      row('tr-0', [
        L('Cược thẳng', 'Straight up', '直注', '스트레이트 업', 'ストレートアップ', 'เดิมพันเลขเดี่ยว'),
        L('A', 'A', 'A', 'A', 'A', 'A'),
        L(
          'Đặt con số đơn độc bao gồm số 0',
          'A single number, including zero',
          '投注单个号码，包括 0',
          '0을 포함한 단일 숫자',
          '0を含む単一の数字',
          'วางบนตัวเลขเดียว รวมถึงเลข 0',
        ),
      ]),
      row('tr-1', [
        L('Cược tách', 'Split', '分注', '스플릿', 'スプリット', 'เดิมพันสองเลขติดกัน'),
        L('B', 'B', 'B', 'B', 'B', 'B'),
        L(
          'Đặt 2 số liền kề trên mặt bàn',
          'Two numbers adjacent on the layout',
          '投注桌面上相邻的 2 个号码',
          '레이아웃에서 서로 붙은 숫자 2개',
          'レイアウト上で隣り合う2つの数字',
          'วางบนตัวเลข 2 ตัวที่ติดกันบนหน้าโต๊ะ',
        ),
      ]),
      row('tr-2', [
        L('Cược 3 số', 'Street', '街注', '스트리트', 'ストリート', 'เดิมพันสามเลข'),
        L('C', 'C', 'C', 'C', 'C', 'C'),
        L(
          'Đặt 3 con số cùng hàng',
          'Three numbers in the same row',
          '投注同一行的 3 个号码',
          '같은 줄의 숫자 3개',
          '同じ列の3つの数字',
          'วางบนตัวเลข 3 ตัวในแถวเดียวกัน',
        ),
      ]),
      row('tr-3', [
        L('Cược góc', 'Corner', '角注', '코너', 'コーナー', 'เดิมพันสี่เลขมุม'),
        L('D', 'D', 'D', 'D', 'D', 'D'),
        L(
          'Đặt 4 số liền kề nhau trên mặt bàn',
          'Four numbers meeting at a corner on the layout',
          '投注桌面上相邻的 4 个号码',
          '레이아웃에서 서로 붙은 숫자 4개',
          'レイアウト上で隣接する4つの数字',
          'วางบนตัวเลข 4 ตัวที่ติดกันบนหน้าโต๊ะ',
        ),
      ]),
      row('tr-4', [
        L('Cược 4 số đầu', 'First four', '首四号注', '퍼스트 포', 'ファーストフォー', 'เดิมพันสี่เลขแรก'),
        L('D', 'D', 'D', 'D', 'D', 'D'),
        L(
          'Đặt 4 số (0, 1, 2 và 3)',
          'The four numbers 0, 1, 2 and 3',
          '投注 0、1、2、3 四个号码',
          '0, 1, 2, 3 네 숫자',
          '0・1・2・3の4つの数字',
          'วางบนเลข 0, 1, 2 และ 3',
        ),
      ]),
      row('tr-5', [
        L('Cược 6 số', 'Six line', '线注（6 个号码）', '식스 라인', 'シックスライン', 'เดิมพันหกเลข'),
        L('D', 'D', 'D', 'D', 'D', 'D'),
        L(
          'Đặt 6 số liền kề nhau trên mặt bàn',
          'Six numbers adjacent on the layout',
          '投注桌面上相邻的 6 个号码',
          '레이아웃에서 서로 붙은 숫자 6개',
          'レイアウト上で隣接する6つの数字',
          'วางบนตัวเลข 6 ตัวที่ติดกันบนหน้าโต๊ะ',
        ),
      ]),
      // Hàng phân nhóm giữa bảng, y như bản clone: chỉ có nhãn, hai ô còn lại
      // để trống.
      row('tr-6', [
        L('CƯỢC NGOÀI', 'OUTSIDE BETS', '外围投注', '아웃사이드 베팅', 'アウトサイドベット', 'เดิมพันวงนอก'),
        DASH,
        DASH,
      ]),
      row('tr-7', [
        L('Cược cột', 'Column', '列注', '컬럼', 'コラム', 'เดิมพันคอลัมน์'),
        L('F', 'F', 'F', 'F', 'F', 'F'),
        DASH,
      ]),
      row('tr-8', [
        L(
          'Cược nhóm 12 số liên tục',
          'Dozen — twelve consecutive numbers',
          '打注（连续 12 个号码）',
          '더즌 — 연속된 12개 숫자',
          'ダズン（連続する12の数字）',
          'เดิมพันโหล (เลขต่อเนื่อง 12 ตัว)',
        ),
        L('G', 'G', 'G', 'G', 'G', 'G'),
        DASH,
      ]),
      row('tr-9', [
        L(
          'Bao gồm 3 khu vực cá cược trong đó cơ sở bao gồm 12 số',
          'Three betting areas, each covering twelve numbers',
          '包含 3 个投注区域，每个区域涵盖 12 个号码',
          '각각 12개 숫자를 포함하는 3개의 베팅 구역',
          'それぞれ12の数字を含む3つのベッティングエリア',
          'ประกอบด้วยพื้นที่เดิมพัน 3 ส่วน แต่ละส่วนครอบคลุมเลข 12 ตัว',
        ),
        L('H', 'H', 'H', 'H', 'H', 'H'),
        DASH,
      ]),
    ],
  },

  // ── BLACKJACK ─────────────────────────────────────────────────────────
  {
    _key: 'sec-12',
    _type: 'imageTextSection',
    tone: 'white',
    imageSide: 'left',
    imageFit: 'contain',
    eyebrow: EYEBROW_GAMES,
    heading: L('BLACKJACK', 'BLACKJACK', '二十一点', '블랙잭', 'ブラックジャック', 'แบล็คแจ็ค'),
    image: BLACKJACK_IMAGE,
    content: blockLoc({
      vi: [
        'Xì dách là một trong số những trò chơi phổ biến trong các sòng bài lá trên khắp thế giới, một trò chơi dễ chơi và hấp dẫn người chơi với nhiều thử thách. Mục tiêu trò chơi là đánh bại Nhà Cái bằng các quyết định kéo bài để có được tổng số điểm đạt gần đến 21 điểm, tránh vượt quá 21 điểm để tồn tại trong vòng chơi. Tay bài mà 2 lá đầu tiên gồm 1 lá Át (Ace) và một lá có giá trị 10 là tay bài Xì dách (Blackjack), nhưng nếu có 2 lá bài trên sau khi tách tụ thì chỉ được tính là 21 điểm.',
      ],
      en: [
        'Blackjack is one of the best-known card games in casinos worldwide: simple to pick up, and full of small decisions. The aim is to beat the dealer by drawing a hand that comes as close to 21 as possible without going over. A first two cards made up of an Ace and a ten-value card is a Blackjack — though the same two cards drawn after a split count only as 21.',
      ],
      zh: [
        '二十一点是全球娱乐场中最广为人知的纸牌游戏之一，规则易懂，却处处需要判断。游戏目标是通过要牌决策，使手牌点数尽可能接近 21 点而不超过，从而击败庄家。前两张牌为一张 A 加一张 10 点牌即为 Blackjack；但若为分牌之后拿到这两张牌，则只按 21 点计算。',
      ],
      ko: [
        '블랙잭은 전 세계 카지노에서 가장 널리 알려진 카드 게임 중 하나로, 규칙은 간단하지만 매 순간 판단이 필요합니다. 21을 넘지 않으면서 21에 가장 가까운 패를 만들어 딜러를 이기는 것이 목표입니다. 처음 두 장이 에이스와 10 값 카드로 이루어지면 블랙잭이며, 스플릿 이후에 같은 두 장을 받으신 경우에는 21점으로만 계산됩니다.',
      ],
      ja: [
        'ブラックジャックは世界中のカジノで最もよく知られたカードゲームのひとつで、ルールは簡単ながら判断のしどころが多いゲームです。21を超えないようにしながら21に近い手をつくり、ディーラーに勝つことが目的です。最初の2枚がエースと10の価値を持つカードであればブラックジャックとなりますが、スプリット後に同じ2枚が揃った場合は21点として扱われます。',
      ],
      th: [
        'แบล็คแจ็คเป็นหนึ่งในเกมไพ่ที่รู้จักกันดีที่สุดในคาสิโนทั่วโลก เล่นง่ายแต่เต็มไปด้วยการตัดสินใจ เป้าหมายคือเอาชนะเจ้ามือด้วยการทำแต้มรวมให้ใกล้ 21 มากที่สุดโดยไม่เกิน 21 หากไพ่สองใบแรกประกอบด้วยเอซและไพ่ที่มีค่า 10 จะถือเป็นแบล็คแจ็ค แต่หากได้ไพ่สองใบนี้หลังจากแยกไพ่ จะนับเป็น 21 แต้มเท่านั้น',
      ],
    }),
  },
  {
    _key: 'sec-13',
    _type: 'richTextSection',
    tone: 'white',
    narrow: false,
    collapsible: true,
    heading: HOW_TO_PLAY,
    content: blockLoc({
      vi: [
        '- Tiền cược phải được đặt trước khi nhân viên chia bài thông báo Không Được Đặt Cược Nữa và bắt đầu chia bài: 2 lá bài cho Khách Chơi và 1 lá bài cho Nhà Cái.',
        '- Tùy vào giá trị bài mà Khách Chơi có những lựa chọn sau:',
        '- Thêm bài (Hit): khi thấy điểm không đủ lớn để thắng Nhà Cái. Không giới hạn số lần thêm bài đến khi đạt được điểm số mong muốn, nhưng cược sẽ thua khi số điểm vượt quá 21.',
        '- Dừng (Stand): không kéo thêm lá bài nào nữa khi thấy điểm đã đủ lớn, và nhân viên chia bài sẽ tiếp tục cho tụ đặt cược kế tiếp.',
        '- Nhân đôi (Double down): có thể nhân đôi số tiền cược với 2 lá bài đầu tiên bằng cách đặt thêm một khoản tiền cược bằng với số tiền cược ban đầu, và sau đó mỗi tụ cũng sẽ có những lựa chọn như trên. Tối đa có thể tách thành 4 tụ từ 1 tụ ban đầu, nhưng tách tụ cho đôi Át chỉ được 1 lần duy nhất.',
        '- Bảo hiểm (Insurance): người chơi được mua bảo hiểm khi lá bài đầu tiên của Nhà Cái là con Át, và tiền bảo hiểm sẽ được trả gấp đôi khi Nhà Cái có Xì dách (Blackjack).',
      ],
      en: [
        '- Bets must be placed before the dealer calls no more bets and begins dealing: two cards to the player and one to the dealer.',
        '- Depending on the value of the hand, the player has the following options:',
        '- Hit: take another card when the total is not high enough to beat the dealer. There is no limit on the number of cards, but the bet is lost as soon as the total passes 21.',
        '- Stand: take no further cards when the total is high enough; the dealer then moves on to the next betting box.',
        '- Double down: on the first two cards the stake may be doubled by placing a second bet equal to the first, after which each hand has the same options as above. One hand may be split into up to four, but a pair of Aces may be split only once.',
        '- Insurance: available when the dealer’s first card is an Ace; the insurance stake is paid double if the dealer has Blackjack.',
      ],
      zh: [
        '- 下注须在荷官宣布停止下注并开始发牌前完成：玩家两张牌，庄家一张牌。',
        '- 根据手牌点数，玩家可作出以下选择：',
        '- 要牌（Hit）：当点数不足以战胜庄家时继续要牌，次数不限，但点数一旦超过 21 即输。',
        '- 停牌（Stand）：认为点数已足够时不再要牌，荷官随即处理下一个注区。',
        '- 加倍（Double down）：可在前两张牌时追加一份与原注相同的投注使赌注加倍，之后每一手同样拥有上述选择。一手牌最多可分成 4 手，但对 A 仅可分牌一次。',
        '- 保险（Insurance）：当庄家首张牌为 A 时可购买保险；若庄家为 Blackjack，保险金按双倍派彩。',
      ],
      ko: [
        '- 베팅은 딜러가 베팅 종료를 알리고 카드를 돌리기 전에 마치셔야 합니다. 플레이어에게 두 장, 딜러에게 한 장이 배분됩니다.',
        '- 패의 값에 따라 플레이어는 다음 선택을 하실 수 있습니다:',
        '- 히트(Hit): 딜러를 이기기에 점수가 부족할 때 카드를 더 받습니다. 횟수 제한은 없지만 합계가 21을 넘으면 베팅은 잃게 됩니다.',
        '- 스탠드(Stand): 점수가 충분하다고 판단되면 더 이상 카드를 받지 않으며, 딜러는 다음 베팅 박스로 넘어갑니다.',
        '- 더블다운(Double down): 처음 두 장에서 최초 베팅과 같은 금액을 추가해 베팅을 두 배로 하실 수 있으며, 이후 각 핸드는 위와 같은 선택을 하게 됩니다. 한 핸드는 최대 4개까지 나눌 수 있지만 에이스 페어는 한 번만 스플릿할 수 있습니다.',
        '- 인슈어런스(Insurance): 딜러의 첫 카드가 에이스일 때 가입하실 수 있으며, 딜러가 블랙잭이면 보험금은 두 배로 지급됩니다.',
      ],
      ja: [
        '- ベットは、ディーラーがノーモアベットを告げて配り始める前にお済ませください。お客様に2枚、ディーラーに1枚が配られます。',
        '- 手札の値に応じて、お客様は次の選択ができます。',
        '- ヒット（Hit）：ディーラーに勝つには点数が足りないときにカードを追加します。回数の制限はありませんが、合計が21を超えた時点で負けとなります。',
        '- スタンド（Stand）：点数が十分と判断された場合はカードを引かず、ディーラーは次のベッティングボックスへ進みます。',
        '- ダブルダウン（Double down）：最初の2枚の時点で、最初と同額のベットを追加して賭け金を倍にできます。その後、各ハンドは上記と同じ選択が可能です。1つのハンドは最大4つまで分けられますが、エースのペアのスプリットは1回のみです。',
        '- インシュアランス（Insurance）：ディーラーの1枚目がエースのときにお申し込みいただけます。ディーラーがブラックジャックの場合、インシュアランスは2倍でお支払いします。',
      ],
      th: [
        '- ต้องวางเดิมพันก่อนที่เจ้ามือจะประกาศปิดรับเดิมพันและเริ่มแจกไพ่ โดยแจกให้ผู้เล่น 2 ใบ และเจ้ามือ 1 ใบ',
        '- ขึ้นอยู่กับค่าไพ่ในมือ ผู้เล่นมีตัวเลือกดังนี้',
        '- ขอไพ่เพิ่ม (Hit): เมื่อแต้มยังไม่พอชนะเจ้ามือ ขอเพิ่มได้ไม่จำกัดจำนวนครั้ง แต่จะแพ้ทันทีเมื่อแต้มเกิน 21',
        '- อยู่ (Stand): ไม่ขอไพ่เพิ่มเมื่อเห็นว่าแต้มเพียงพอแล้ว จากนั้นเจ้ามือจะไปยังช่องเดิมพันถัดไป',
        '- เพิ่มเดิมพันสองเท่า (Double down): เมื่อได้ไพ่สองใบแรก สามารถวางเดิมพันเพิ่มเท่ากับเดิมพันเริ่มต้นเพื่อเพิ่มเป็นสองเท่า จากนั้นแต่ละมือจะมีตัวเลือกเช่นเดียวกับข้างต้น หนึ่งมือแยกได้สูงสุด 4 มือ แต่ไพ่คู่เอซแยกได้เพียงครั้งเดียว',
        '- ประกัน (Insurance): ซื้อได้เมื่อไพ่ใบแรกของเจ้ามือเป็นเอซ และจะจ่ายสองเท่าหากเจ้ามือได้แบล็คแจ็ค',
      ],
    }),
  },
  {
    _key: 'sec-14',
    _type: 'richTextSection',
    tone: 'white',
    narrow: false,
    collapsible: true,
    heading: PAYOUT_TABLE,
    content: blockLoc({
      vi: [
        '- Các cược Bảo Hiểm thắng được trả theo tỉ lệ 1 trả 2 và sẽ được thanh toán khi kết thúc lượt chơi.',
        '- Khi Vòng Chia Bài Đầu Tiên kết thúc và trước khi rút bài cho vòng tiếp theo, nếu người chơi có Xì Dách và lá bài đầu tiên của Nhà Cái không phải là một lá 10 hay lá Át, thì người chơi ngay lập tức sẽ được thanh toán cho tiền cược đó với tỷ lệ 2 trả 3.',
      ],
      en: [
        '- Winning insurance bets pay 2 to 1 and are settled at the end of the round.',
        '- After the first round of dealing and before any further cards are drawn, a player holding Blackjack is paid immediately at 2 to 3, provided the dealer’s first card is neither a ten-value card nor an Ace.',
      ],
      zh: [
        '- 中奖的保险注按 1 赔 2 派彩，于该局结束时结算。',
        '- 首轮发牌结束、补牌开始之前，若玩家持有 Blackjack 而庄家首张牌既非 10 点牌也非 A，则该注立即按 2 赔 3 派彩。',
      ],
      ko: [
        '- 당첨된 인슈어런스 베팅은 1 대 2로 지급되며 라운드가 끝날 때 정산됩니다.',
        '- 첫 배분이 끝나고 다음 카드를 받기 전에, 딜러의 첫 카드가 10 값 카드나 에이스가 아닐 경우 블랙잭을 가진 플레이어에게는 2 대 3으로 즉시 지급합니다.',
      ],
      ja: [
        '- 的中したインシュアランスのベットは1対2でお支払いし、ラウンド終了時に精算します。',
        '- 最初の配り札が終わり、次のカードを引く前の時点で、ディーラーの1枚目が10の価値を持つカードでもエースでもない場合、ブラックジャックをお持ちのお客様には2対3で直ちにお支払いします。',
      ],
      th: [
        '- เดิมพันประกันที่ชนะจ่าย 1 ต่อ 2 และจะจ่ายเมื่อจบรอบการเล่น',
        '- เมื่อจบการแจกไพ่รอบแรกและก่อนจั่วไพ่รอบถัดไป หากผู้เล่นมีแบล็คแจ็คและไพ่ใบแรกของเจ้ามือไม่ใช่ไพ่ค่า 10 หรือเอซ ผู้เล่นจะได้รับเงินทันทีในอัตรา 2 ต่อ 3',
      ],
    }),
  },

  // ── BAR + LIÊN HỆ ─────────────────────────────────────────────────────
  {
    _key: 'sec-15',
    _type: 'imageTextSection',
    tone: 'cream',
    imageSide: 'right',
    imageFit: 'cover',
    heading: L('BAR CASINO', 'BAR CASINO', 'BAR CASINO', 'BAR CASINO', 'BAR CASINO', 'BAR CASINO'),
    image: BAR_IMAGE,
    content: blockLoc({
      vi: [
        'Bar Casino là lựa chọn tuyệt vời cho những phút giây thư giãn tại câu lạc bộ, thoả mãn khách hàng với bộ sưu tập đồ uống đa dạng từ rượu mạnh đến nước ngọt nhẹ trong một không gian sang trọng và thoải mái.',
      ],
      en: [
        'Bar Casino is where the evening slows down: a drinks list running from spirits to soft drinks, served in a comfortable, quietly elegant room.',
      ],
      zh: [
        'Bar Casino 是俱乐部中放松片刻的好去处，从烈酒到软饮的丰富酒单，配以舒适而雅致的空间。',
      ],
      ko: [
        'Bar Casino는 클럽에서 잠시 숨을 고르기 좋은 공간입니다. 증류주부터 부담 없는 음료까지 폭넓은 드링크 리스트를 편안하고 품격 있는 분위기에서 즐기실 수 있습니다.',
      ],
      ja: [
        'Bar Casinoは、クラブでひと息つくのにふさわしい空間です。スピリッツからソフトドリンクまで幅広いドリンクを、落ち着いた上質な雰囲気の中でお楽しみいただけます。',
      ],
      th: [
        'Bar Casino คือมุมพักผ่อนภายในคลับ พร้อมรายการเครื่องดื่มหลากหลายตั้งแต่สุรากลั่นไปจนถึงเครื่องดื่มไม่มีแอลกอฮอล์ ในบรรยากาศสบายและหรูหราอย่างเรียบง่าย',
      ],
    }),
  },
  {
    _key: 'sec-16',
    _type: 'imageTextSection',
    tone: 'white',
    imageSide: 'right',
    // Dải 3 mã QR (935×340). `contain` là bắt buộc: khung 4:3 mặc định cắt
    // mất hai mã ngoài cùng và xén góc định vị của mã còn lại — quét không ra.
    imageFit: 'contain',
    heading: L('THÔNG TIN LIÊN HỆ', 'CONTACT', '联系我们', '문의하기', 'お問い合わせ', 'ติดต่อเรา'),
    image: CONTACT_IMAGE,
    content: blockLoc({
      vi: [
        '- Casino VIP Hotline: (+84) 203.3848.888',
        '- Dịch vụ khách hàng (qua ứng dụng): 0395 383 003',
        'Quét mã QR bên cạnh để kết nối với câu lạc bộ qua Zalo, WeChat hoặc LINE.',
      ],
      en: [
        '- Casino VIP hotline: (+84) 203.3848.888',
        '- Guest service via messaging apps: 0395 383 003',
        'Scan the QR codes alongside to reach the club on Zalo, WeChat or LINE.',
      ],
      zh: [
        '- 娱乐场贵宾热线：(+84) 203.3848.888',
        '- 客户服务（通过应用）：0395 383 003',
        '扫描旁边的二维码，即可通过 Zalo、微信或 LINE 与俱乐部联系。',
      ],
      ko: [
        '- 카지노 VIP 핫라인: (+84) 203.3848.888',
        '- 메신저 앱 고객 서비스: 0395 383 003',
        '옆의 QR 코드를 스캔하시면 Zalo, WeChat, LINE으로 클럽에 연락하실 수 있습니다.',
      ],
      ja: [
        '- カジノVIPホットライン：(+84) 203.3848.888',
        '- アプリでのお客様サービス：0395 383 003',
        '横のQRコードを読み取ると、Zalo・WeChat・LINEでクラブにご連絡いただけます。',
      ],
      th: [
        '- สายด่วนวีไอพีคาสิโน: (+84) 203.3848.888',
        '- บริการลูกค้าผ่านแอปพลิเคชัน: 0395 383 003',
        'สแกนคิวอาร์โค้ดด้านข้างเพื่อติดต่อคลับผ่าน Zalo, WeChat หรือ LINE',
      ],
    }),
  },
  {
    _key: 'sec-17',
    _type: 'ctaBandSection',
    heading: L('LƯU TRÚ', 'ACCOMMODATION', '住宿', '객실', '客室', 'ห้องพัก'),
    description: L(
      'Tận hưởng không gian sang trọng và ấm cúng tại khách sạn Royal Hạ Long.',
      'Round off the evening in the quiet comfort of a room at Royal Ha Long Hotel.',
      '在皇家下龙酒店的客房中，享受舒适而雅致的休憩时光。',
      '로열 하롱 호텔의 객실에서 편안하고 품격 있는 휴식을 누려 보십시오.',
      'ロイヤル・ハロン・ホテルの客室で、心地よく上質なひとときをお過ごしください。',
      'พักผ่อนอย่างสบายและหรูหราในห้องพักของโรงแรมรอยัล ฮาลอง',
    ),
    background: CTA_IMAGE,
    cta: linkTo('page.luu-tru-phong-khach-san-villas', VIEW_DETAILS),
  },
]

// ───────────────────────────────────────────────── TIÊU ĐỀ · SLUG · SEO ───

const TITLE = L('CASINO', 'CASINO', '娱乐场', '카지노', 'カジノ', 'คาสิโน')

/** Đường dẫn giữ nguyên `casino` ở cả sáu ngôn ngữ: đây là từ quốc tế, viết
 * bằng chữ Latinh ở mọi thị trường, và mọi liên kết ngoài đang trỏ vào
 * `/casino`. Khai tường minh thay vì dựa vào fallback để `audit.ts` không
 * còn coi `slug` là field thiếu bản dịch. */
const SLUG = Object.fromEntries(
  LOCALES.map((l) => [l, { _type: 'slug', current: 'casino' }]),
) as Record<Locale, { _type: string; current: string }>

const SEO = {
  _type: 'seo',
  // KHÔNG dùng gạch ngang trong `metaTitle`: `buildMetadata` (lib/seo.ts) tự
  // nối ` — <tên khách sạn>` phía sau, nên một gạch nữa ở đây cho ra thẻ
  // `<title>` hai gạch. Dạng ngoặc đơn cũng đúng với cách trang chủ gọi khối
  // này trong GLOSSARY.md.
  metaTitle: L(
    'Câu lạc bộ Quốc tế Hoàng Gia (Casino)',
    'Royal International Club (Casino)',
    '皇家国际俱乐部（娱乐场）',
    '로열 인터내셔널 클럽 (카지노)',
    'ロイヤル国際クラブ（カジノ）',
    'รอยัล อินเตอร์เนชั่นแนล คลับ (คาสิโน)',
  ),
  metaDescription: L(
    'Câu lạc bộ Quốc tế Hoàng Gia tại Royal Hạ Long: 18 bàn chơi trực tiếp, 62 máy trò chơi điện tử và Bar Casino. Mở cửa 24/7, dành cho khách quốc tịch nước ngoài từ đủ 18 tuổi.',
    'The Royal International Club at Royal Ha Long: 18 live tables, 62 electronic gaming machines and Bar Casino. Open 24/7 to foreign passport holders aged 18 and over.',
    '皇家下龙的皇家国际俱乐部：18 张现场游戏桌、62 台电子游戏机与 Bar Casino。24 小时营业，仅限年满 18 周岁的外籍宾客。',
    '로열 하롱의 로열 인터내셔널 클럽 — 라이브 테이블 18대, 전자 게임기 62대, Bar Casino. 24시간 운영, 만 18세 이상 외국 국적 손님 전용.',
    'ロイヤル・ハロンのロイヤル国際クラブ。ライブテーブル18卓、電子ゲーム機62台、Bar Casino。24時間営業、18歳以上の外国籍のお客様限定。',
    'รอยัล อินเตอร์เนชั่นแนล คลับ ที่รอยัล ฮาลอง: โต๊ะเกมสด 18 โต๊ะ เครื่องเกมอิเล็กทรอนิกส์ 62 เครื่อง และ Bar Casino เปิดตลอด 24 ชั่วโมง เฉพาะผู้ถือหนังสือเดินทางต่างชาติอายุ 18 ปีขึ้นไป',
  ),
  ogImage: OG_IMAGE,
  noIndex: false,
}

async function main() {
  await patchDoc('page.casino', {
    title: TITLE,
    slug: SLUG,
    seo: SEO,
    sections,
  })

  const holes = await assertFullyTranslated('page.casino')
  process.exit(holes ? 1 : 0)
}

main()
