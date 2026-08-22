import { useEffect } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import { MapPin } from 'lucide-react'

export interface MapMarker {
  id: string
  lat: number
  lng: number
  label: string
  sublabel?: string
  kind: 'destination' | 'activity'
  active?: boolean
}

function markerIcon(kind: MapMarker['kind'], active?: boolean) {
  const color = kind === 'destination' ? '#0d8f86' : '#f97316'
  const size = active ? 40 : 32
  const html = renderToStaticMarkup(
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: color,
        border: '2.5px solid white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
        color: 'white',
      }}
    >
      <MapPin size={size * 0.55} fill="white" strokeWidth={1} />
    </div>,
  )
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap()
  useEffect(() => {
    if (markers.length === 0) return
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 12)
      return
    }
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]))
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [markers, map])
  return null
}

interface MapViewProps {
  markers: MapMarker[]
  showRoute?: boolean
  onMarkerClick?: (marker: MapMarker) => void
  height?: string | number
  className?: string
}

export function MapView({ markers, showRoute, onMarkerClick, height = 400, className }: MapViewProps) {
  const center: [number, number] = markers.length > 0 ? [markers[0].lat, markers[0].lng] : [20, 0]

  return (
    <div className={className} style={{ height }}>
      <MapContainer center={center} zoom={markers.length ? 11 : 2} scrollWheelZoom style={{ height: '100%', width: '100%', borderRadius: '1rem' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={markers} />
        {showRoute && markers.length > 1 && (
          <Polyline positions={markers.map((m) => [m.lat, m.lng])} pathOptions={{ color: '#0d8f86', weight: 3, dashArray: '6 8' }} />
        )}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={markerIcon(marker.kind, marker.active)}
            eventHandlers={{ click: () => onMarkerClick?.(marker) }}
          >
            <Popup>
              <p className="font-semibold">{marker.label}</p>
              {marker.sublabel && <p className="text-xs text-ink-500">{marker.sublabel}</p>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
