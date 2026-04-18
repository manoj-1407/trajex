import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import { 
  Search, Navigation, Users, Package, RefreshCw, 
  Map as MapIcon, Activity, Zap, Compass 
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../api/client';
import useSocket from '../hooks/useSocket';
import Badge from '../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icon paths in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

function MovingMarker({ rider, onClick }) {
  const [position, setPosition] = useState([rider.lastLat, rider.lastLng]);

  useEffect(() => {
    // Basic interpolation logic
    const startPos = position;
    const endPos = [rider.lastLat, rider.lastLng];
    if (startPos[0] === endPos[0] && startPos[1] === endPos[1]) return;

    let startTime = null;
    const duration = 1000; // 1s glide

    function animate(time) {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      
      const currentLat = startPos[0] + (endPos[0] - startPos[0]) * progress;
      const currentLng = startPos[1] + (endPos[1] - startPos[1]) * progress;
      
      setPosition([currentLat, currentLng]);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }
    
    requestAnimationFrame(animate);
  }, [rider.lastLat, rider.lastLng]);

  return (
    <Marker position={position} eventHandlers={{ click: onClick }}>
      <Popup>
        <div style={{ minWidth: '200px', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
             <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, border: '1px solid var(--border)' }}>{rider.name.charAt(0)}</div>
             <div>
               <div style={{ fontSize: '15px', fontWeight: 800 }}>{rider.name}</div>
               <Badge type="rider" status={rider.status} size="sm" />
             </div>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '6px', letterSpacing: '0.05em' }}>Rider Metrics</div>
          <div style={{ padding: '8px', background: 'var(--bg-hover)', borderRadius: '8px', fontSize: '12px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>TASKS</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{rider.activeOrders} ACTIVE</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>RELIABILITY</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{rider.reliabilityScore}/5.0</span>
             </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function LiveMap() {
  const [riders, setRiders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);
  const [mapMode, setMapMode] = useState('dark'); // dark, satellite
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
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onRiderLoc = (data) => {
      setRiders(prev => prev.map(r => r.id === data.riderId ? { ...r, lastLat: data.lastLat, lastLng: data.lastLng, moving: true } : r));
    };
    socket.on('rider-location', onRiderLoc);
    return () => socket.off('rider-location', onRiderLoc);
  }, [socket]);

  const activeRiders = useMemo(() => riders.filter(r => ['available', 'busy'].includes(r.status)), [riders]);
  const transitOrders = useMemo(() => orders.filter(o => o.status === 'in_transit'), [orders]);

  // Map settings
  const center = activeRiders.find(r => r.lastLat) ? [activeRiders.find(r => r.lastLat).lastLat, activeRiders.find(r => r.lastLat).lastLng] : [17.3850, 78.4867];

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 120px)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container { background-color: #000; font-family: var(--font-ui); }
        [data-theme="dark"] .leaflet-layer,
        [data-theme="midnight"] .leaflet-layer {
          filter: ${mapMode === 'dark' ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' : 'none'};
        }
        .leaflet-popup-content-wrapper { background: var(--bg-surface); color: var(--text-primary); border-radius: 12px; box-shadow: var(--shadow-lg); border: 1px solid var(--border); padding: 5px; }
        .leaflet-popup-tip { background: var(--bg-surface); }
        .leaflet-v-path { stroke-dasharray: 8 8; animation: dash 20s linear infinite; }
        @keyframes dash { to { stroke-dashoffset: -1000; } }
      `}} />

      <MapContainer center={center} zoom={13} zoomControl={false} style={{ width: '100%', height: '100%', zIndex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url={mapMode === 'dark' ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"}
        />
        
        {/* Destination Polylines */}
        {transitOrders.map(order => {
          const rider = activeRiders.find(r => r.id === order.riderId);
          if (rider && rider.lastLat && order.dropLat) {
            return (
              <Polyline 
                key={`path-${order.id}`}
                positions={[[rider.lastLat, rider.lastLng], [order.dropLat, order.dropLng]]}
                pathOptions={{ color: 'var(--accent)', weight: 3, opacity: 0.6 }}
                className="leaflet-v-path"
              />
            );
          }
          return null;
        })}

        {/* Rider Markers */}
        {activeRiders.map(rider => rider.lastLat && (
          <MovingMarker key={rider.id} rider={rider} onClick={() => setSelectedRider(rider)} />
        ))}
      </MapContainer>

      {/* Control Overlay */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', zIndex: 400, display: 'flex', flexDirection: 'column', gap: '16px', pointerEvents: 'none' }}>
        <div className="glass-strong glass-stack" style={{ pointerEvents: 'all', width: '340px', maxWidth: 'calc(100vw - 32px)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Compass size={20} /></div>
                <div>
                   <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Fleet Dispatch</h2>
                   <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Live Logistics Interface</div>
                </div>
             </div>
             <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setMapMode(mapMode === 'dark' ? 'satellite' : 'dark')} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', padding: '6px', cursor: 'pointer' }}><MapIcon size={16} /></button>
                <button onClick={fetchData} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', padding: '6px', cursor: 'pointer' }}><RefreshCw size={16} className={refreshing ? 'spin' : ''} /></button>
             </div>
          </div>

          <div style={{ padding: '20px', display: 'flex', gap: '12px' }}>
             <div style={{ flex: 1, padding: '16px', background: 'var(--bg-hover)', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '24px', fontWeight: 950, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{activeRiders.length}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Riders</div>
             </div>
             <div style={{ flex: 1, padding: '16px', background: 'var(--bg-hover)', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '24px', fontWeight: 950, color: 'var(--warning)', fontFamily: 'var(--font-mono)' }}>{transitOrders.length}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>In-Transit</div>
             </div>
          </div>

          <div style={{ padding: '0 20px 20px', maxHeight: '300px', overflowY: 'auto' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeRiders.map(r => (
                  <motion.div 
                    key={r.id} whileHover={{ x: 4 }}
                    style={{ padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: r.status === 'busy' ? 'var(--warning)' : 'var(--success)' }} />
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{r.name}</span>
                     </div>
                     <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 900 }}>ACTIVE</span>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>
      </div>

    </div>
  );
}
