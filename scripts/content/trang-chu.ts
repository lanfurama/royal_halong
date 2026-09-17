/**
 * Dịch TRANG CHỦ sang đủ sáu ngôn ngữ, và gắn `alt` cho ảnh của nó.
 *
 * Trang chủ không nằm trong sáu nhóm trang được chia cho các cặp agent, nhưng
 * nó là document dùng chung mà không ai được ghi — nên phần này do điều phối
 * viên làm. Không dịch nó thì `/en` `/zh` `/ko` `/ja` `/th` đều rơi về tiếng
 * Việt ngay ở trang đầu tiên khách nhìn thấy.
 *
 * Chạy: `npx tsx scripts/content/trang-chu.ts`
 * Chạy lại nhiều lần ra cùng kết quả.
 */
import type { Locale } from '../../lib/i18n'
import { patchDoc, assertFullyTranslated, writeClient } from './write'

type Six = Record<Locale, string>
const L = (vi: string, en: string, zh: string, ko: string, ja: string, th: string): Six =>
  ({ vi, en, zh, ko, ja, th })

/** Đoạn văn Portable Text — giữ `_key` cũ của bản tiếng Việt để không sinh
 * key mới mỗi lần chạy (script phải idempotent). */
function para(text: string, keyBase: string) {
  return [
    {
      _key: `${keyBase}0`,
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [{ _key: `${keyBase}1`, _type: 'span', text, marks: [] }],
    },
  ]
}

function blockSix(v: Six, keyBase: string) {
  return {
    vi: para(v.vi, keyBase),
    en: para(v.en, keyBase),
    zh: para(v.zh, keyBase),
    ko: para(v.ko, keyBase),
    ja: para(v.ja, keyBase),
    th: para(v.th, keyBase),
  }
}

const TITLE = L(
  'ROYAL HẠ LONG — ĐIỂM ĐẾN LÝ TƯỞNG ĐỂ CHIÊM NGƯỠNG TOÀN CẢNH DI SẢN THẾ GIỚI',
  'ROYAL HA LONG — WHERE THE WHOLE WORLD HERITAGE BAY OPENS BEFORE YOU',
  '皇家下龙——尽览世界遗产下龙湾全景的理想之地',
  '로열 하롱 — 세계유산 하롱베이의 전경을 품은 곳',
  'ロイヤル・ハロン — 世界遺産ハロン湾を一望する理想の滞在先',
  'รอยัล ฮาลอง — จุดหมายที่เปิดรับวิวอ่าวฮาลอง มรดกโลก แบบพาโนรามา',
)

const INTRO = L(
  'Toạ lạc tại khu vực trung tâm du lịch của tỉnh Quảng Ninh, Royal Hạ Long là một trong những điểm đến hấp dẫn dành cho du khách, bao gồm 156 phòng khách sạn tiêu chuẩn 5 sao và 11 toà Villas tiêu chuẩn 4 sao được trang bị đầy đủ tiện nghi. Với tổng cộng 4 nhà hàng và quầy bar, bể bơi bốn mùa và bể bơi ngoài trời, Cung Hội nghị, Câu lạc bộ giải trí có thưởng cho người nước ngoài và các tiện ích khác, Royal Hạ Long mang đến cho du khách những trải nghiệm thú vị và thư giãn khi nghỉ dưỡng tại nơi đây.',
  'Set in the heart of Quang Ninh’s tourism district, Royal Ha Long brings together 156 five-star hotel rooms and 11 fully equipped four-star villas. Four restaurants and bars, a four-season indoor pool and an outdoor pool, the Convention Palace and a members’ club for foreign passport holders make the stay as easy to enjoy as it is to unwind in.',
  '皇家下龙坐落于广宁省旅游中心地带，拥有 156 间五星级酒店客房与 11 栋设施齐备的四星级别墅。四间餐厅酒吧、四季恒温室内泳池与户外泳池、会议宫以及面向外籍宾客的娱乐俱乐部，让每一段停留都轻松而惬意。',
  '꽝닌성 관광 중심지에 자리한 로열 하롱은 5성급 객실 156실과 편의시설을 모두 갖춘 4성급 빌라 11동을 갖추고 있습니다. 레스토랑과 바 4곳, 사계절 실내 수영장과 야외 수영장, 컨벤션 팰리스, 외국인 전용 엔터테인먼트 클럽까지 — 머무는 내내 편안하게 즐기실 수 있습니다.',
  'クアンニン省の観光中心地に位置するロイヤル・ハロンは、5つ星の客室156室と、設備の整った4つ星ヴィラ11棟を擁しています。4つのレストラン＆バー、四季を通じて利用できる屋内プールと屋外プール、コンベンションパレス、外国籍のお客様向けエンターテインメントクラブが、滞在の一日一日を心地よく彩ります。',
  'รอยัล ฮาลอง ตั้งอยู่ใจกลางย่านท่องเที่ยวของจังหวัดกว๋างนิญ ประกอบด้วยห้องพักระดับห้าดาว 156 ห้อง และวิลล่าระดับสี่ดาวพร้อมสิ่งอำนวยความสะดวกครบครัน 11 หลัง ร้านอาหารและบาร์ 4 แห่ง สระว่ายน้ำในร่มสี่ฤดูและสระกลางแจ้ง คอนเวนชัน พาเลซ และคลับเอ็นเตอร์เทนเมนต์สำหรับผู้ถือหนังสือเดินทางต่างชาติ',
)

const LOCATION = L(
  'Royal Hạ Long nằm tại trung tâm du lịch Bãi Cháy, thuận tiện di chuyển tới những điểm đến chính: 2 phút tới bãi biển; 5 phút tới Sun World Complex; khoảng 5 phút tới Cảng tàu khách Quốc tế Hạ Long; khoảng 15 phút tới Cảng tàu khách Quốc tế Tuần Châu.',
  'Royal Ha Long sits in the middle of the Bai Chay tourist quarter, a short hop from everything: 2 minutes to the beach, 5 minutes to the Sun World complex, about 5 minutes to Ha Long International Cruise Port and about 15 minutes to Tuan Chau International Marina.',
  '皇家下龙位于拜寨旅游中心，前往各处都很便捷：步行 2 分钟到海滩、5 分钟到太阳世界综合体、约 5 分钟到下龙国际客运港、约 15 分钟到巡州国际客运港。',
  '로열 하롱은 바이짜이 관광 중심지에 있어 이동이 편리합니다. 해변까지 2분, 선월드 콤플렉스까지 5분, 하롱 국제 크루즈 터미널까지 약 5분, 뚜언쩌우 국제 마리나까지 약 15분이 걸립니다.',
  'ロイヤル・ハロンはバイチャイ観光地区の中心にあり、移動に便利です。ビーチまで2分、サンワールド複合施設まで5分、ハロン国際クルーズ港まで約5分、トゥアンチャウ国際マリーナまで約15分。',
  'รอยัล ฮาลอง อยู่ใจกลางย่านท่องเที่ยวบ๊ายจ๋าย เดินทางสะดวก: 2 นาทีถึงชายหาด 5 นาทีถึงซันเวิลด์คอมเพล็กซ์ ราว 5 นาทีถึงท่าเรือสำราญนานาชาติฮาลอง และราว 15 นาทีถึงท่าเรือนานาชาติต่วนโจว',
)

const WEDDING_BODY = L(
  'Trao lời yêu thương với một nửa của bạn tại Cung Hội nghị Quốc tế Hoàng Gia.',
  'Say your vows at the Royal International Convention Palace, with the heritage bay as your backdrop.',
  '在皇家国际会议宫许下誓言，以世界遗产海湾为背景。',
  '세계유산 하롱베이를 배경으로, 로열 인터내셔널 컨벤션 팰리스에서 서약을 나누세요.',
  '世界遺産の湾を背に、ロイヤル国際コンベンションパレスで誓いの言葉を。',
  'กล่าวคำสาบานรักที่รอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ โดยมีอ่าวมรดกโลกเป็นฉากหลัง',
)

const OFFERS_BODY = L(
  'Tận hưởng trọn vẹn kỳ nghỉ — khám phá các chương trình và gói ưu đãi đặc biệt của chúng tôi.',
  'Make the most of your stay — explore our current packages and special offers.',
  '让假期更尽兴——查看我们正在推出的套餐与特别优惠。',
  '머무는 시간을 더 알차게 — 진행 중인 패키지와 특별 프로모션을 확인해 보세요.',
  '滞在をより豊かに — 実施中のパッケージと特別プランをご覧ください。',
  'ใช้เวลาพักผ่อนให้คุ้มค่า — ดูแพ็กเกจและโปรโมชันพิเศษที่กำลังจัดอยู่',
)

/** Tiêu đề khối + nhãn nút, tra theo `_key` của section. */
const HEADINGS: Record<string, Six> = {
  'sec-3': L('THƯ VIỆN ẢNH', 'GALLERY', '图片库', '갤러리', 'ギャラリー', 'แกลเลอรี'),
  'sec-4': L(
    'CẢM NHẬN THIẾT KẾ HIỆN ĐẠI VÀ KHÔNG KHÍ THƯ GIÃN',
    'MODERN DESIGN, UNHURRIED DAYS',
    '现代设计，悠然时光',
    '모던한 디자인, 여유로운 하루',
    'モダンなデザインと、ゆるやかな時間',
    'ดีไซน์ร่วมสมัย กับวันเวลาที่ไม่เร่งรีบ',
  ),
  'sec-5': L(
    'TÌM CHÚNG TÔI TRÊN BẢN ĐỒ',
    'FIND US ON THE MAP',
    '在地图上找到我们',
    '지도에서 찾기',
    '地図で見る',
    'ค้นหาเราบนแผนที่',
  ),
  'sec-6': L('Tiệc cưới', 'Weddings', '婚礼', '웨딩', 'ウエディング', 'งานแต่งงาน'),
  'sec-7': L(
    'Chương trình ưu đãi',
    'Offers & packages',
    '优惠与套餐',
    '프로모션 & 패키지',
    '特別プラン',
    'โปรโมชันและแพ็กเกจ',
  ),
}

const CARD_TITLES: Record<string, Six> = {
  'card-0': L('KHÁCH SẠN VÀ VILLA', 'HOTEL & VILLAS', '酒店与别墅', '호텔 & 빌라', 'ホテル・ヴィラ', 'โรงแรมและวิลล่า'),
  'card-1': L(
    'CUNG HỘI NGHỊ QUỐC TẾ',
    'INTERNATIONAL CONVENTION PALACE',
    '国际会议宫',
    '인터내셔널 컨벤션 팰리스',
    '国際コンベンションパレス',
    'คอนเวนชัน พาเลซ นานาชาติ',
  ),
  'card-2': L(
    'CÂU LẠC BỘ QUỐC TẾ HOÀNG GIA (CASINO)',
    'ROYAL INTERNATIONAL CLUB (CASINO)',
    '皇家国际俱乐部（娱乐场）',
    '로열 인터내셔널 클럽 (카지노)',
    'ロイヤル国際クラブ（カジノ）',
    'รอยัล อินเตอร์เนชั่นแนล คลับ (คาสิโน)',
  ),
  'card-3': L('ẨM THỰC', 'DINING', '餐饮', '다이닝', 'ダイニング', 'ร้านอาหาร'),
}

const SEE_MORE = L('Xem thêm', 'Discover more', '了解更多', '자세히 보기', '詳しく見る', 'ดูเพิ่มเติม')
const EXPLORE = L('Khám phá', 'Explore offers', '查看优惠', '프로모션 보기', 'プランを見る', 'ดูโปรโมชัน')

/** `alt` cho từng ảnh của trang chủ, tra theo `_key` của section (ảnh album
 * `galleryAlbum.trang-chu` KHÔNG thuộc phạm vi file này — nhóm E phụ trách). */
const ALTS: Record<string, Six> = {
  'sec-0': L(
    'Toàn cảnh khách sạn Royal Hạ Long bên vịnh lúc hoàng hôn',
    'Royal Ha Long seen from the water at dusk, the bay behind it',
    '黄昏时分从水面望向皇家下龙酒店，身后是下龙湾',
    '해질 무렵 물 위에서 바라본 로열 하롱 호텔과 하롱베이',
    '夕暮れ時、水上から望むロイヤル・ハロン・ホテルとハロン湾',
    'โรงแรมรอยัล ฮาลอง มองจากผืนน้ำยามพลบค่ำ โดยมีอ่าวฮาลองเป็นฉากหลัง',
  ),
  'card-0': L(
    'Dãy villa thấp tầng mái ngói nhìn ra thảm cỏ và hàng cọ',
    'Low-rise tiled-roof villas looking out over lawn and palms',
    '低层瓦顶别墅，面朝草坪与棕榈树',
    '잔디밭과 야자수를 마주한 저층 기와지붕 빌라',
    '芝生とヤシの木に面した瓦屋根の低層ヴィラ',
    'วิลล่าหลังคากระเบื้องชั้นเตี้ย หันหน้าสู่สนามหญ้าและแนวต้นปาล์ม',
  ),
  'card-1': L(
    'Đại sảnh Cung Hội nghị với đèn chùm pha lê và hàng cột trắng',
    'Convention Palace ballroom under crystal chandeliers and white columns',
    '会议宫宴会厅，水晶吊灯与白色立柱',
    '크리스털 샹들리에와 흰 기둥이 늘어선 컨벤션 팰리스 볼룸',
    'クリスタルシャンデリアと白い柱が並ぶコンベンションパレスの大広間',
    'ห้องบอลรูมของคอนเวนชัน พาเลซ ใต้โคมระย้าคริสตัลและเสาสีขาว',
  ),
  'card-2': L(
    'Sảnh câu lạc bộ giải trí với bàn chơi và ánh đèn vàng ấm',
    'Club gaming floor with tables under warm amber light',
    '娱乐俱乐部大厅，赌桌沐浴在暖黄灯光中',
    '따뜻한 조명 아래 게임 테이블이 놓인 클럽 홀',
    '温かな灯りの下にゲームテーブルが並ぶクラブフロア',
    'โถงคลับพร้อมโต๊ะเกมใต้แสงไฟสีอำพันอบอุ่น',
  ),
  'card-3': L(
    'Bàn ăn bày sẵn nhìn ra cửa kính lớn hướng vịnh',
    'A laid table by full-height windows facing the bay',
    '临落地窗的餐桌，窗外是海湾',
    '만이 보이는 통창 옆에 세팅된 식탁',
    '湾に面した大きな窓辺にセッティングされたテーブル',
    'โต๊ะอาหารที่จัดไว้ริมกระจกบานสูงหันออกสู่อ่าว',
  ),
  'sec-6': L(
    'Lối đi lễ cưới trải hoa trắng dẫn tới cổng hoa trong đại sảnh',
    'A white-flowered aisle leading to the ceremony arch in the ballroom',
    '宴会厅内铺满白花的仪式通道，尽头是花门',
    '볼룸 안, 흰 꽃으로 장식된 버진로드 끝의 세리머니 아치',
    '白い花で飾られたバージンロードと、その先のセレモニーアーチ',
    'ทางเดินพิธีโรยดอกไม้ขาวทอดสู่ซุ้มดอกไม้ในห้องบอลรูม',
  ),
  'sec-7': L(
    'Khay đồ ăn nhẹ và ly cocktail bày bên bể bơi ngoài trời',
    'Snacks and cocktails laid out beside the outdoor pool',
    '户外泳池畔摆放的小食与鸡尾酒',
    '야외 수영장 옆에 차려진 스낵과 칵테일',
    '屋外プールサイドに並ぶ軽食とカクテル',
    'ของว่างและค็อกเทลจัดวางข้างสระว่ายน้ำกลางแจ้ง',
  ),
}

/** Bốn đánh giá thật của khách trên TripAdvisor.
 *
 * Nguyên văn là TIẾNG ANH — bản import trước đây đặt nhầm nguyên văn đó vào
 * field `vi`, nên khách Việt đọc trang tiếng Việt lại thấy tiếng Anh. Ở đây
 * nguyên văn được trả về đúng chỗ (`en`), năm ngôn ngữ còn lại là bản dịch
 * TRUNG THÀNH của chính câu đó — không rút gọn, không tô hồng thêm. Giữ
 * nguyên `author` và `source` để người đọc luôn thấy đây là lời của khách,
 * dẫn từ TripAdvisor.
 */
const TESTIMONIALS: Record<string, { heading: Six; quote: Six }> = {
  'testimonial.0': {
    heading: L(
      'Phòng đẹp, phục vụ tốt',
      'Good room and good service',
      '房间好，服务好',
      '좋은 객실과 좋은 서비스',
      '部屋もサービスも良い',
      'ห้องดี บริการดี',
    ),
    quote: L(
      'Tôi ở phòng hướng biển trên tầng cao, rất thích! Phòng rộng và đầy đủ tiện nghi. Tôi đã có quãng thời gian tuyệt vời ở đây. Dịch vụ xuất sắc và các bữa ăn rất ngon. Nếu có dịp, tôi nhất định sẽ quay lại.',
      'I’ve got a Seaview room on high floor, love that! The room is huge and equipped. I had a wonderful time here. The service was excellent and the meals were delicious. If I have a chance, I will definitely come back again.',
      '我住的是高层海景房，非常喜欢！房间很大，设施齐全。在这里度过了一段美好的时光，服务很棒，餐食也很好吃。有机会一定会再来。',
      '고층 오션뷰 객실에 묵었는데 정말 좋았습니다! 객실이 넓고 시설도 잘 갖춰져 있었어요. 아주 즐거운 시간을 보냈습니다. 서비스가 훌륭했고 식사도 맛있었습니다. 기회가 되면 꼭 다시 오고 싶어요.',
      '高層階のシービュールームに泊まりましたが、とても気に入りました。部屋は広く設備も充実。素晴らしい時間を過ごせました。サービスも申し分なく、食事も美味しかったです。機会があればぜひまた訪れたいです。',
      'ได้ห้องวิวทะเลชั้นสูง ชอบมาก! ห้องกว้างและมีสิ่งอำนวยความสะดวกครบ ช่วงเวลาที่นี่ดีมาก บริการยอดเยี่ยมและอาหารอร่อย ถ้ามีโอกาสจะกลับมาอีกแน่นอน',
    ),
  },
  'testimonial.1': {
    heading: L(
      'Nghỉ chân dễ chịu trước khi ra vịnh',
      'Nice stay before the bay',
      '游湾前的舒适停留',
      '베이 투어 전 편안한 하룻밤',
      '湾へ出る前の快適な滞在',
      'พักสบายก่อนออกไปเที่ยวอ่าว',
    ),
    quote: L(
      'Chúng tôi ở khu suite, nằm trong một toà riêng tách khỏi khối khách sạn và casino chính. Nhân viên thân thiện và nhiệt tình — gần như nhiệt tình quá mức: 9 giờ tối họ còn gọi hỏi phòng có ổn không và dặn cứ gọi nếu cần gì.',
      'We were in the suites which is a separate building separate to the main hotel / casino. The staff were friendly and helpful — almost too helpful — they called us at 9pm to ask if the room was ok and to tell us to call if we needed anything.',
      '我们住的是套房，位于与酒店主楼和娱乐场分开的独立楼栋。员工友善又热心——几乎热心过头了：晚上九点还打电话来问房间是否满意，并叮嘱有需要随时联系。',
      '저희는 메인 호텔과 카지노 건물과는 분리된 별동의 스위트에 묵었습니다. 직원들이 친절하고 세심했어요 — 오히려 과할 정도로요. 밤 9시에 전화해 객실이 괜찮은지 묻고 필요한 게 있으면 언제든 연락하라고 하더군요.',
      '本館とカジノとは別棟のスイートに滞在しました。スタッフは親切で気配りが行き届いていて、少し行き届きすぎるほど。夜9時に部屋の様子を尋ねる電話があり、何かあればいつでも連絡してほしいと伝えてくれました。',
      'เราพักในสวีทซึ่งอยู่คนละอาคารกับโรงแรมหลักและคาสิโน พนักงานเป็นมิตรและช่วยเหลือดีมาก — เกือบจะมากไปด้วยซ้ำ สามทุ่มยังโทรมาถามว่าห้องเรียบร้อยดีไหม และบอกให้โทรหาได้ทุกเมื่อ',
    ),
  },
  'testimonial.2': {
    heading: L(
      'Khách sạn đẹp, con người tử tế',
      'Beautiful hotel managed by kind hearted people',
      '美丽的酒店，由热心的人打理',
      '따뜻한 사람들이 운영하는 아름다운 호텔',
      '心温かいスタッフが迎える美しいホテル',
      'โรงแรมสวย ดูแลโดยผู้คนที่มีน้ำใจ',
    ),
    quote: L(
      'Khách sạn đẹp, được vận hành bởi những con người tử tế. Điểm cộng: khách sạn hướng biển; lễ tân cư xử rất chuẩn mực và sẵn lòng giúp đỡ; phòng bài trí đẹp; phòng tắm sạch sẽ đến bất ngờ, đẹp và có bồn tắm.',
      'Beautiful Hotel managed by kind hearted people. Pros: hotel — sea facing views. Reception — excellent behavior, very helpful. Room — beautifully done. Bathroom — exceptionally clean and beautiful with a tub.',
      '美丽的酒店，由一群热心的人打理。优点：酒店面朝大海；前台举止得体、乐于协助；房间布置精美；浴室格外干净漂亮，还配有浴缸。',
      '따뜻한 마음을 지닌 분들이 운영하는 아름다운 호텔입니다. 장점: 바다를 마주한 전망, 응대가 훌륭하고 도움을 아끼지 않는 프런트, 아름답게 꾸며진 객실, 욕조가 있고 유난히 깨끗하고 예쁜 욕실.',
      '心温かい人々が運営する美しいホテルです。良い点：海に面した眺め、応対が丁寧で親身なフロント、美しく整えられた客室、バスタブ付きで際立って清潔な浴室。',
      'โรงแรมสวยที่ดูแลโดยผู้คนซึ่งมีน้ำใจ ข้อดี: วิวหันออกทะเล พนักงานต้อนรับมารยาทดีและช่วยเหลือเต็มที่ ห้องตกแต่งสวย ห้องน้ำสะอาดเป็นพิเศษและสวยงาม มีอ่างอาบน้ำ',
    ),
  },
  'testimonial.3': {
    heading: L(
      'Khách sạn rất ổn và tử tế',
      'A very nice and decent hotel',
      '非常不错、体面的酒店',
      '아주 괜찮고 품위 있는 호텔',
      'とても良い、きちんとしたホテル',
      'โรงแรมที่ดีและได้มาตรฐาน',
    ),
    quote: L(
      'Tôi tới khách sạn này vì công việc, ở cùng đồng nghiệp trong ba ngày. Khách sạn thực sự mang lại chất lượng phục vụ đúng chuẩn 5 sao. Phòng rộng. Không khí chung của khách sạn rất dễ chịu. Thực đơn bữa sáng phong phú.',
      'I visited this hotel for the business purpose. I stayed there along with my colleagues for 3 days. This hotel really offers 5 star hospitality. The room size was big. The overall hotel ambiance was very pleasant. Variety of menu for the breakfast was available.',
      '我因公务入住这家酒店，和同事一起住了三天。酒店的服务确实达到五星水准。房间面积很大，整体氛围非常舒适，早餐菜式也很丰富。',
      '업무차 방문해 동료들과 사흘 묵었습니다. 이 호텔은 정말 5성급 수준의 서비스를 보여 줍니다. 객실이 넓었고 호텔 전체 분위기가 무척 쾌적했으며 조식 메뉴도 다양했습니다.',
      '出張でこのホテルを利用し、同僚と3日間滞在しました。まさに5つ星のもてなしです。客室は広く、ホテル全体の雰囲気もとても心地よく、朝食のメニューも豊富でした。',
      'ผมมาพักที่โรงแรมนี้เพื่อธุรกิจ พักร่วมกับเพื่อนร่วมงาน 3 วัน โรงแรมนี้ให้บริการระดับห้าดาวจริง ๆ ห้องพักกว้าง บรรยากาศโดยรวมน่าอยู่มาก และเมนูอาหารเช้ามีให้เลือกหลากหลาย',
    ),
  },
}

async function main() {
  const home: any = await writeClient.fetch(`*[_id == "homePage"][0]`)
  if (!home) throw new Error('Không có document `homePage`')

  for (const section of home.sections ?? []) {
    const heading = HEADINGS[section._key]
    if (heading) section.heading = { ...heading }

    if (section._key === 'sec-0') {
      section.heading = { ...TITLE }
      if (section.background) section.background.alt = { ...ALTS['sec-0'] }
    }
    if (section._key === 'sec-1') section.content = blockSix(INTRO, 'intro')
    if (section._key === 'sec-2') section.content = blockSix(LOCATION, 'loc')

    if (section._key === 'sec-4') {
      for (const card of section.cards ?? []) {
        const title = CARD_TITLES[card._key]
        if (!title) throw new Error(`CARD_TITLES thiếu "${card._key}"`)
        card.title = { ...title }
        if (card.cta) card.cta.label = { ...SEE_MORE }
        if (card.image) card.image.alt = { ...ALTS[card._key] }
      }
    }

    if (section._key === 'sec-6') {
      section.content = blockSix(WEDDING_BODY, 'wed')
      if (section.cta) section.cta.label = { ...SEE_MORE }
      if (section.image) section.image.alt = { ...ALTS['sec-6'] }
    }
    if (section._key === 'sec-7') {
      section.content = blockSix(OFFERS_BODY, 'off')
      if (section.cta) section.cta.label = { ...EXPLORE }
      if (section.image) section.image.alt = { ...ALTS['sec-7'] }
    }
  }

  await patchDoc('homePage', { title: TITLE, sections: home.sections })

  for (const [id, value] of Object.entries(TESTIMONIALS)) {
    await patchDoc(id, { heading: value.heading, quote: value.quote })
  }

  let holes = await assertFullyTranslated('homePage')
  for (const id of Object.keys(TESTIMONIALS)) holes += await assertFullyTranslated(id)
  process.exit(holes ? 1 : 0)
}

main()
