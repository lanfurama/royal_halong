# Màn hình chờ — vì sao `loading.tsx` bị gỡ

`components/ui/LoadingScreen.tsx` vẫn còn trong repo và vẫn chạy được, nhưng
**không còn được nối vào route nào**. File `app/(site)/[lang]/loading.tsx` —
thứ dùng nó làm Suspense fallback cấp route — đã bị gỡ.

## Lý do — đo trên bản production (`pnpm build && pnpm start`)

`loading.tsx` tạo một ranh giới Suspense bao trọn `{children}` của layout. Với
React streaming, phần nội dung đến sau được nhả ra trong các khối
`<div hidden>` rồi một script nội tuyến mới gắn chúng vào đúng chỗ. **Script
đó cần JavaScript.**

Tắt JavaScript, mọi trang của site:

```
/vi           main cao 0px · chữ nhìn thấy: "Bỏ qua điều hướng ĐANG TẢI" · 5 div[hidden]
/vi/wedding   main cao 0px · chữ nhìn thấy: "Bỏ qua điều hướng ĐANG TẢI" · 5 div[hidden]
/vi/culinary  main cao 0px · chữ nhìn thấy: "Bỏ qua điều hướng ĐANG TẢI" · 5 div[hidden]
```

Gỡ `loading.tsx`, cùng trang, cùng điều kiện:

```
/vi/wedding   main cao 4104px · "Bỏ qua điều hướng VI LƯU TRÚ CASINO ẨM THỰC HỘI NGHỊ & TIỆC …"
```

Hệ quả kéo theo, cũng đo được:

- **Ba test trong `tests/e2e/forms.spec.ts` đỏ** — cả ba nằm trong nhóm "hành
  vi khi tắt JavaScript (request thật tới server)". Chúng timeout 30s vì
  `#field-name` có trong DOM nhưng tổ tiên là một `<div hidden>`. Nhóm test
  này tồn tại nghĩa là dự án **cố ý** yêu cầu form gửi được khi không có JS.
- **Skip link không focus được lúc trang đang tải.** `Header` nằm trong ranh
  giới bị treo, nên bấm Tab ngay sau `load` cho `activeElement === BODY`.
  Đã sửa riêng bằng cách đưa skip link lên `layout.tsx` (ngoài ranh giới
  Suspense) — bản sửa đó **giữ nguyên**, nó đúng dù có `loading.tsx` hay không.

## Muốn dùng lại màn hình chờ

Đừng nối lại bằng `loading.tsx`. Hai hướng không phá render không-JS:

1. **Chỉ báo chuyển trang phía client** — nghe `usePathname()`/`useRouter()`
   và hiện `LoadingScreen` trong lúc điều hướng giữa các trang. Lần tải đầu
   vẫn là HTML tĩnh đầy đủ.
2. **Suspense hẹp** — bọc riêng phần thật sự chậm (nếu sau này có), không bọc
   cả `{children}` của layout. Các trang hiện tại đều prerender được, nên
   không có gì để chờ.

Cách nào cũng phải chạy lại `pnpm exec playwright test` — ba test form nói
trên chính là lưới an toàn cho đúng lỗi này.
