// Chỗ đặt global test setup.
//
// `sanity/env.ts` throw nếu thiếu biến môi trường project/dataset — nó chỉ
// được import gián tiếp bởi các test import component UI (vd. SanityImage)
// qua `sanity/lib/image.ts`. Hai giá trị này công khai theo thiết kế (nhúng
// vào JS trình duyệt), nên đặt giá trị giả ở đây an toàn cho test — không
// test nào ở đây gọi mạng thật, chỉ cần module import không throw.
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= 'test-project'
process.env.NEXT_PUBLIC_SANITY_DATASET ??= 'test-dataset'

// jsdom không tự cài `window.matchMedia` — `components/ui/Reveal.tsx` gọi nó
// trong `useEffect` để tôn trọng `prefers-reduced-motion`, và `Reveal` được
// dùng bởi nhiều section (CardGridSection, ImageTextSection, RoomListSection,
// PostListSection...). Thiếu polyfill này, MỌI test `@vitest-environment
// jsdom` render một trong các section đó (kể cả khi không liên quan gì tới
// bug đang kiểm) đều nổ `TypeError: window.matchMedia is not a function` —
// phát hiện khi viết bộ test bảng cho toàn bộ registry section (Fix c9-2).
// Chỉ áp cho môi trường jsdom (`environment: 'node'` mặc định không có
// `window`), và không ghi đè nếu đã có sẵn.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList
}

// Cùng lý do với `matchMedia` ở trên: `Reveal.tsx` còn dùng
// `IntersectionObserver` (để chỉ kích hoạt animation khi cuộn tới), jsdom
// không cài sẵn global này. Polyfill giả tối thiểu — không có test nào ở đây
// cần hành vi observe thật, chỉ cần constructor tồn tại để không throw.
if (typeof window !== 'undefined' && typeof (window as any).IntersectionObserver !== 'function') {
  class FakeIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  ;(window as any).IntersectionObserver = FakeIntersectionObserver
  ;(globalThis as any).IntersectionObserver = FakeIntersectionObserver
}

export {}
