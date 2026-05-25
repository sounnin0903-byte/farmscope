'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 선택 여부에 따라 커스텀 핀 아이콘 생성
function makeIcon(selected) {
  return L.divIcon({
    className: '',
    html: `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2C8.48 2 4 6.48 4 12c0 8 10 22 10 22S24 20 24 12C24 6.48 19.52 2 14 2z"
        fill="${selected ? '#5da462' : '#4e7c52'}"
        stroke="${selected ? '#7dbf82' : '#2a3d2a'}"
        stroke-width="${selected ? '2' : '1.5'}"/>
      <circle cx="14" cy="12" r="4.5" fill="${selected ? '#ffffff' : '#c8ddc8'}"/>
    </svg>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -38],
  });
}

// 검색 결과 전체가 보이도록 지도 뷰 자동 조정
function FitBounds({ results }) {
  const map = useMap();
  useEffect(() => {
    if (!results.length) return;
    if (results.length === 1) {
      map.setView([results[0].lat, results[0].lon], 16);
    } else {
      const bounds = L.latLngBounds(results.map(r => [r.lat, r.lon]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
    }
  }, [results]);
  return null;
}

export default function MapView({ results, picked, onPick }) {
  if (!results.length) return null;
  const center = [results[0].lat, results[0].lon];

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: 230, width: '100%', borderRadius: '0 0 0 0' }}
      zoomControl={true}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds results={results} />
      {results.map((r, i) => (
        <Marker
          key={i}
          position={[r.lat, r.lon]}
          icon={makeIcon(picked === r)}
          eventHandlers={{ click: () => onPick(r) }}
        >
          <Popup>
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              <strong>{r.address}</strong><br />
              {r.type} · {r.area}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
