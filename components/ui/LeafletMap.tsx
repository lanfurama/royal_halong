'use client'

import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Leaflet mặc định trỏ icon marker ra CDN; trỏ về asset cục bộ để không phụ thuộc mạng ngoài.
const icon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

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
  return (
    <MapContainer center={[lat, lng]} zoom={zoom} scrollWheelZoom={false} className={className}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={icon} />
    </MapContainer>
  )
}
