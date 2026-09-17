// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { SectionRenderer, groupSections } from '@/components/sections/SectionRenderer'

afterEach(() => {
  cleanup()
})

function richTextFixture(overrides: Record<string, unknown> = {}) {
  return {
    _key: 'a',
    _type: 'richTextSection',
    heading: { vi: 'Tiêu đề' },
    content: {
      vi: [
        {
          _type: 'block',
          _key: 'b',
          style: 'normal',
          children: [{ _type: 'span', _key: 'c', text: 'Xin chào', marks: [] }],
        },
      ],
    },
    ...overrides,
  }
}

describe('SectionRenderer', () => {
  it('bỏ qua khối có _type không nhận diện được thay vì nổ', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() =>
      render(<SectionRenderer sections={[{ _key: 'a', _type: 'khongTonTai' }]} lang="vi" />),
    ).not.toThrow()
    warn.mockRestore()
  })

  it('render khối văn bản', () => {
    render(<SectionRenderer lang="vi" sections={[richTextFixture()]} />)
    expect(screen.getByText('Xin chào')).toBeDefined()
  })

  it('render mảng rỗng mà không lỗi', () => {
    expect(() => render(<SectionRenderer sections={[]} lang="vi" />)).not.toThrow()
  })

  // Bug đã xảy ra nhiều lần nhất trong dự án này: field màu nền của
  // richTextSection tên là `tone`, không phải `background` (`background` chỉ
  // tồn tại trên heroSection/ctaBandSection, kiểu ảnh). Test trước đây gửi
  // `background: 'white'` cho một fixture mà component chỉ đọc `tone` — nó
  // xanh y hệt dù đổi tên field trong component thành gì, không bắt được gì
  // cả. Hai test dưới đây cố tình đặt `tone` và `background` MÂU THUẪN nhau
  // trên cùng một fixture: nếu component đọc đúng `tone`, kết quả phải khớp
  // `tone`; nếu ai đó (lại) đổi component sang đọc `background`, kết quả sẽ
  // khớp `background` thay vào đó và test dưới đây FAIL.
  it('richTextSection tone="ink": nền tối + tiêu đề sáng (đọc đúng field `tone`, không phải `background`)', () => {
    const { container } = render(
      <SectionRenderer
        lang="vi"
        sections={[richTextFixture({ tone: 'ink', background: 'cream' })]}
      />,
    )
    const section = container.querySelector('section')
    expect(section?.className).toContain('bg-ink')
    expect(section?.className).not.toContain('bg-cream')

    // Từ bản redesign, tiêu đề KHÔNG còn tô vàng: trên nền tối nó là
    // `cream-hi`, trên nền sáng nó thừa hưởng màu chữ mặc định (nâu mực).
    // Điều test này canh vẫn là: nhánh màu phải đi theo `tone`, và hai nhánh
    // phải KHÁC nhau.
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.className).toContain('text-cream-hi')
  })

  it('richTextSection tone="cream": nền kem + tiêu đề nâu mực (đọc đúng field `tone`, không phải `background`)', () => {
    const { container } = render(
      <SectionRenderer
        lang="vi"
        sections={[richTextFixture({ tone: 'cream', background: 'ink' })]}
      />,
    )
    const section = container.querySelector('section')
    expect(section?.className).toContain('bg-cream-alt')
    expect(section?.className).not.toContain('bg-ink')

    // Nhánh sáng: không gắn class màu nào, tiêu đề thừa hưởng nâu mực. Điểm
    // cần canh là nó KHÔNG lẫn sang nhánh tối.
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.className).not.toContain('text-cream-hi')
  })
})

// --- Fix c9-2: bảng, chạy qua TOÀN BỘ registry, hình dạng GROQ thật -------
//
// Bug c9-1 (CardGridSection) sống sót qua review riêng của nó vì bộ test cũ
// ở trên chỉ có MỘT fixture (richTextSection), không có field nào bị null.
// Thực tế GROQ: `SECTIONS` projection trong `sanity/lib/queries.ts` áp
// `background/image/cta/cards[]{...}` lên MỌI section KHÔNG ĐIỀU KIỆN theo
// `_type` — với section nào không có field đó trên schema, GROQ trả về
// `null` TƯỜNG MINH (không phải `undefined`). Default parameter kiểu
// `cards = []` chỉ bắt `undefined`, không bắt `null` -> `cards.map` nổ ngay
// khi editor lưu một cardGridSection còn trống (xem c9-1). `resolved` (từ
// `select(...)` trong 4 nhánh `_type ==` khác) và `album` (từ nhánh
// galleryCarouselSection) cũng đi qua cùng con đường "field lạ trên _type
// khác thành null" nếu ai đó gộp field ẩu sau này — feed cả hai vào mọi
// fixture, không chỉ loại thật sự dùng chúng, để bài test này còn bắt được
// lớp lỗi đó nếu nó quay lại ở field khác.
//
// Chạy TỪNG _type có trong REGISTRY (`SectionRenderer.tsx`) — bảng dưới đây
// phải khớp 1-1 với `SECTION_TYPE_NAMES` (`sanity/schemaTypes/sections`);
// thiếu một loại là bỏ sót đúng lớp lỗi mà bài test này tồn tại để chặn.
const GROQ_NULLS = {
  background: null,
  image: null,
  cta: null,
  cards: null,
  resolved: null,
  album: null,
} as const

const HEADING = { vi: 'Tiêu đề kiểm thử' }
const RICH_CONTENT = {
  vi: [
    {
      _type: 'block',
      _key: 'b1',
      style: 'normal',
      children: [{ _type: 'span', _key: 's1', text: 'Nội dung kiểm thử', marks: [] }],
    },
  ],
}

const SECTION_FIXTURES: Record<string, Record<string, unknown>> = {
  heroSection: { heading: HEADING, ...GROQ_NULLS },
  richTextSection: { heading: HEADING, content: RICH_CONTENT, ...GROQ_NULLS },
  imageTextSection: { heading: HEADING, content: RICH_CONTENT, ...GROQ_NULLS },
  cardGridSection: { heading: HEADING, ...GROQ_NULLS },
  galleryCarouselSection: { heading: HEADING, ...GROQ_NULLS },
  venueListSection: { heading: HEADING, ...GROQ_NULLS },
  hallListSection: { heading: HEADING, ...GROQ_NULLS },
  roomListSection: { heading: HEADING, ...GROQ_NULLS },
  ctaBandSection: { heading: HEADING, ...GROQ_NULLS },
  mapSection: { heading: HEADING, ...GROQ_NULLS },
  // headers/rows không nằm trong SECTIONS projection chung (chỉ thuộc riêng
  // tableSection), nhưng cùng lớp lỗi: field mảng có default parameter, có
  // thể bị null tường minh nếu ai đó sau này gộp chung projection. Test luôn
  // để đóng luôn đường đó.
  tableSection: { heading: HEADING, headers: null, rows: null, ...GROQ_NULLS },
  bookingWidgetSection: { ...GROQ_NULLS },
  leadFormSection: { heading: HEADING, ...GROQ_NULLS },
  faqSection: { heading: HEADING, items: null, ...GROQ_NULLS },
  postListSection: { heading: HEADING, ...GROQ_NULLS },
}

describe('SectionRenderer — mọi _type trong registry sống sót qua hình dạng GROQ thật', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  afterEach(() => {
    warn.mockClear()
  })


  for (const [type, fixture] of Object.entries(SECTION_FIXTURES)) {
    it(`${type}: không throw với field null do projection chiếu vào, không render heading rỗng`, () => {
      const section = { _key: 'k', _type: type, ...fixture }

      expect(() =>
        render(<SectionRenderer sections={[section]} lang="vi" widgetId={undefined} />),
      ).not.toThrow()

      // Không có thẻ heading (h1..h6) nào render ra mà rỗng nội dung — dấu
      // hiệu component đọc field null/undefined rồi vẫn render heading trần
      // thay vì bỏ qua nó (CtaBandSection/LeadFormSection từng làm vậy).
      const headings = screen.queryAllByRole('heading')
      for (const heading of headings) {
        expect(heading.textContent?.trim()).not.toBe('')
      }
    })
  }
})

describe('groupSections() — khối gập liền nhau gộp thành một cụm accordion', () => {
  const collapsible = (key: string, type = 'richTextSection') => ({
    _key: key,
    _type: type,
    heading: { vi: key },
    content: { vi: [] },
    collapsible: true,
  })
  const plain = (key: string) => ({ _key: key, _type: 'richTextSection', content: { vi: [] } })

  it('gom đúng các khối gập ĐỨNG LIỀN NHAU, không nuốt khối thường ở giữa', () => {
    const items = groupSections([
      plain('p1'),
      collapsible('c1'),
      collapsible('c2', 'tableSection'),
      plain('p2'),
      collapsible('c3'),
    ])
    expect(items.map((i) => i.kind)).toEqual(['single', 'group', 'single', 'group'])
    expect((items[1] as any).sections.map((s: any) => s._key)).toEqual(['c1', 'c2'])
    expect((items[3] as any).sections.map((s: any) => s._key)).toEqual(['c3'])
  })

  it('giữ NGUYÊN chỉ số gốc của section — `isFirst` (priority ảnh hero) bám chỉ số đó', () => {
    const items = groupSections([collapsible('c1'), collapsible('c2'), plain('p1')])
    // `p1` là phần tử thứ 3 trong mảng gốc dù đứng thứ 2 sau khi gom.
    expect(items[1]).toMatchObject({ kind: 'single', index: 2 })
  })

  it('cờ `collapsible` trên _type KHÔNG hỗ trợ thì bỏ qua, khối vẫn render bằng component của nó', () => {
    const items = groupSections([
      { _key: 'h', _type: 'heroSection', collapsible: true },
      collapsible('c1'),
    ])
    expect(items.map((i) => i.kind)).toEqual(['single', 'group'])
  })

  it('không có khối gập nào -> mọi phần tử vẫn là "single", thứ tự không đổi', () => {
    const items = groupSections([plain('a'), plain('b'), plain('c')])
    expect(items.map((i) => (i as any).section._key)).toEqual(['a', 'b', 'c'])
  })
})
