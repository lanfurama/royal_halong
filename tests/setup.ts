// Chỗ đặt global test setup.
//
// `sanity/env.ts` throw nếu thiếu biến môi trường project/dataset — nó chỉ
// được import gián tiếp bởi các test import component UI (vd. SanityImage)
// qua `sanity/lib/image.ts`. Hai giá trị này công khai theo thiết kế (nhúng
// vào JS trình duyệt), nên đặt giá trị giả ở đây an toàn cho test — không
// test nào ở đây gọi mạng thật, chỉ cần module import không throw.
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= 'test-project'
process.env.NEXT_PUBLIC_SANITY_DATASET ??= 'test-dataset'

export {}
