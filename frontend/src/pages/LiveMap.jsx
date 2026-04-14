import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Search, Navigation, Users, Package, RefreshCw } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../api/client';
import useSocket from '../hooks/useSocket';
import Badge from '../components/ui/Badge';

import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon paths in React
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

export default function LiveMap() {
  const [riders, setRiders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const socket = useSocket();

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [resR, resO] = await Promise.all([
        api.get('/riders').catch(() => ({ data: { riders: [] } })),
        api.get('/orders?limit=100').catch(() => ({ data: { orders: [] } }))
      ]);
      setRiders(resR.data?.riders || []);
      setOrders(resO.data?.orders || []);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onRiderLoc = (data) => {
      setRiders(prev => prev.map(r => r.id === data.riderId ? { ...r, last_lat: data.lat, last_lng: data.lng } : r));
    };
    socket.on('rider-location', onRiderLoc);
    return () => socket.off('rider-location', onRiderLoc);
  }, [socket]);

  // Center on first rider or default
  const firstWithLoc = riders.find(r => r.last_lat);
  const center = firstWithLoc ? [firstWithLoc.last_lat, firstWithLoc.last_lng] : [20.0, 77.0];

  const activeRiders = riders.filter(r => ['available', 'busy'].includes(r.status));
  const activeOrders = orders.filter(o => ['pending', 'in_transit'].includes(o.status));

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 56px - 48px)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }} className="fade-in-up">
      
      {/* Map styling hack to override Leaflet default light tiles with CSS filters if in dark mode */}
      <style dangerouslySetInnerHTML={{__html: `
        [data-theme="dark"] .leaflet-layer,
        [data-theme="dark"] .leaflet-control-zoom-in,
        [data-theme="dark"] .leaflet-control-zoom-out,
        [data-theme="dark"] .leaflet-control-attribution {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .leaflet-container { background-color: var(--bg); font-family: var(--font-ui); }
        .leaflet-popup-content-wrapper { background: var(--bg-surface); color: var(--text-primary); border-radius: var(--radius-md); box-shadow: var(--shadow-xl); border: 1px solid var(--border); }
        .leaflet-popup-tip { background: var(--bg-surface); }
      `}} />

      <MapContainer center={center} zoom={12} style={{ width: '100%', height: '100%', zIndex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {activeRiders.map(rider => rider.last_lat && (
          <Marker key={rider.id} position={[rider.last_lat, rider.last_lng]}>
            <Popup>
              <div style={{ fontWeight: 600 }}>{rider.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><Badge type="rider" status={rider.status} size="sm" /></div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Control Panel Overlay */}
      <div className="glass-strong" style={{
        position: 'absolute', top: '24px', left: '24px', width: '320px', zIndex: 400,
        borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column',
        maxHeight: 'calc(100% - 48px)', border: '1px solid var(--border)'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Navigation size={20} color="var(--accent)" />
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Fleet Map</h2>
          </div>
          <button 
            onClick={fetchData} 
            disabled={refreshing}
            style={{ 
              background: 'none', border: 'none', color: refreshing ? 'var(--accent)' : 'var(--text-muted)', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'transform 0.5s ease'
            }}
          >
            <RefreshCw size={18} style={{ transform: refreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s ease' }} />
          </button>
        </div>

        <div style={{ padding: '16px', display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{activeRiders.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px' }}>Active Riders</div>
          </div>
          <div style={{ flex: 1, background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--warning)' }}>{activeOrders.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px' }}>Pending</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', marginTop: '8px' }}>ONLINE FLEET</div>
          {activeRiders.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No riders currently online</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeRiders.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.status === 'busy' ? 'var(--warning)' : 'var(--success)' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{r.name}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{r.active_orders} ord</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
