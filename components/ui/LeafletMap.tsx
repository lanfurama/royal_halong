'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Leaflet mặc định trỏ icon marker ra CDN; trỏ về asset cục bộ để không phụ thuộc mạng ngoài.
// `tests/e2e/routes.spec.ts` fetch thẳng đúng hai đường dẫn này — đổi ở đây thì đổi cả ở đó.
const icon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

/**
 * Bản đồ dựng bằng **Leaflet thuần**, cố ý KHÔNG dùng `react-leaflet`.
 *
 * `react-leaflet` 5 tách vòng đời làm hai: `MapContainer` huỷ map trong
 * cleanup của nó (`context.map.remove()`), còn `<TileLayer>`/`<Marker>` gắn
 * layer trong effect RIÊNG của chúng. Ở dev, React gắn → tháo → gắn lại
 * (StrictMode khi mount, Fast Refresh khi lưu file), và thứ tự đó để lại một
 * map đã chết mà con vẫn gắn vào:
 *
 * - `map.remove()` của Leaflet đặt `this._panes = []`, nên `getPane()` trả
 *   `undefined` -> `GridLayer._initContainer()` nổ
 *   `Cannot read properties of undefined (reading 'appendChild')`;
 * - `map.remove()` cũng xoá dấu `_leaflet_id` trên `<div>`, và lần dựng map
 *   kế tiếp trên đúng node cũ ném `Map container is being reused by another
 *   instance`.
 *
 * Bản này miễn nhiễm vì hai lý do, đừng phá:
 *
 * 1. **Map và layer sinh/diệt trong CÙNG một effect.** Không có effect thứ hai
 *    nào giữ tham chiếu tới map, nên không thể gắn layer vào map đã huỷ.
 * 2. **Map luôn dựng trên một `<div>` con do effect tự tạo và tự xoá**, không
 *    phải trên node mà React quản lý. Node bị Leaflet đóng dấu chết cùng effect,
 *    nên không bao giờ có chuyện "dùng lại container".
 */
export function LeafletMap({
  lat,
  lng,
  zoom,
  // Chiều cao trước đây khoá cứng `h-96`. Khối "đánh giá + bản đồ" ở trang
  // chủ đặt bản đồ cạnh một cột chữ cao hơn thế, nên nó cần kéo đầy cột.
  // Mặc định giữ nguyên `h-96` để mọi nơi gọi cũ không đổi hành vi — và để
  // khung chờ tải trong `MapSection` vẫn khớp đúng chiều cao.
  className = 'h-96 w-full',
}: {
  lat: number
  lng: number
  zoom: number
  className?: string
}) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    // `position: absolute; inset: 0` chứ không `height: 100%`: nơi gọi truyền
    // `h-full min-h-[460px]`, mà `height: 100%` của con tính theo chiều cao
    // ĐÃ GIẢI ĐƯỢC của cha — cha chỉ có `min-height` thì con sập về 0.
    const node = document.createElement('div')
    node.style.position = 'absolute'
    node.style.inset = '0'
    host.appendChild(node)

    const map = L.map(node, { center: [lat, lng], zoom, scrollWheelZoom: false })
    // Dòng ghi công CHỊU RÀNG BUỘC GIẤY PHÉP OSM — không bỏ, không che.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    L.marker([lat, lng], { icon }).addTo(map)

    return () => {
      map.remove()
      node.remove()
    }
  }, [lat, lng, zoom])

  // `position: relative` để `inset: 0` của node bên trong neo vào đúng khung
  // này. Đặt bằng style thay vì class vì `className` do nơi gọi truyền vào và
  // không nơi nào bảo đảm có `relative`.
  return <div ref={hostRef} className={className} style={{ position: 'relative' }} />
}
