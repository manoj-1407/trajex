import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import { 
  Package, Clock, Phone, MapPin, 
  CheckCircle, Navigation, Shield, 
  Zap, ArrowDown, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';
import useSocket from '../hooks/useSocket';
import Badge from '../components/ui/Badge';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export default function PublicTracking() {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [riderLoc, setRiderLoc] = useState(null);
  const [routePath, setRoutePath] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    api.get(`/tracking/${token}`).then(res => {
      setOrder(res.data);
      if (res.data.riderLat && res.data.riderLng) {
        setRiderLoc({ lat: res.data.riderLat, lng: res.data.riderLng, name: res.data.riderName, phone: res.data.riderPhone });
      }
    }).catch(() => {
      setError(true);
    }).finally(() => {
      setLoading(false);
    });
  }, [token]);

  useEffect(() => {
    if (riderLoc?.lat && riderLoc?.lng && order?.dropLat && order?.dropLng) {
      fetch(`https://router.project-osrm.org/route/v1/driving/${riderLoc.lng},${riderLoc.lat};${order.dropLng},${order.dropLat}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes[0]) {
             setRoutePath(data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
             setEta(Math.round(data.routes[0].duration / 60));
          }
        }).catch(err => console.error("OSRM Error:", err));
    }
  }, [riderLoc, order]);

  useEffect(() => {
    if (!socket || !order) return;
    const onOrderUpd = (data) => {
      if (data.orderId === order.id) setOrder(prev => ({ ...prev, status: data.status, updatedAt: new Date().toISOString() }));
    };
    const onRiderLoc = (data) => {
      // Data from socket emission uses lastLat/lastLng as standardized in previous steps
      if (order.riderId && data.riderId === order.riderId) setRiderLoc(prev => ({ ...prev, lat: data.lastLat, lng: data.lastLng }));
    };

    socket.on('order-updated', onOrderUpd);
    socket.on('rider-location', onRiderLoc);
    return () => {
      socket.off('order-updated', onOrderUpd);
      socket.off('rider-location', onRiderLoc);
    };
  }, [socket, order]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <Activity className="pulse" color="var(--accent)" size={48} />
      <div style={{ marginTop: '20px', color: 'var(--text-secondary)', fontWeight: 600 }}>Syncing with Dispatch Network...</div>
    </div>
  );

  if (error || !order) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-primary)', padding: '40px', textAlign: 'center' }}>
      <Shield size={64} color="var(--danger)" style={{ marginBottom: '24px' }} />
      <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '16px' }}>Terminal Unauthorized.</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>Your tracking session has expired or the token is invalid.</p>
    </div>
  );

  const steps = [
    { id: 'confirmed', label: 'Order Confirmed', sub: 'Deployment Authorized', icon: Package },
    { id: 'assigned', label: 'Rider Dispatched', sub: 'Asset moving to base', icon: Clock },
    { id: 'picked_up', label: 'Order Picked Up', sub: 'In final mission leg', icon: Navigation },
    { id: 'in_transit', label: 'Out for Delivery', sub: 'Sub-5km radius', icon: Zap },
    { id: 'delivered', label: 'Delivered', sub: 'Mission Accomplished', icon: CheckCircle }
  ];

  const currentIdx = steps.findIndex(s => s.id === order.status);
  const mapCenter = riderLoc?.lat ? [riderLoc.lat, riderLoc.lng] : [order.dropLat, order.dropLng];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', overflow: 'hidden' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        [data-theme="dark"] .leaflet-layer, [data-theme="midnight"] .leaflet-layer { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
        .leaflet-container { background-color: var(--bg); font-family: var(--font-ui); }
        .timeline-pulse { position: absolute; left: -7px; top: 0; width: 14px; height: 14px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 15px var(--accent-glow); z-index: 10; }
      `}} />

      {/* Hero Tracking Header */}
      <div className="glass-strong" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="var(--bg-surface)" fill="currentColor" />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.02em' }}>Trajex Tracker</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Secure Mission Telemetry</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800 }}>ESTIMATED ARRIVAL</div>
           <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent)' }}>{eta || '--'} MINS</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1fr) 2fr', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Side: Timeline HUD */}
        <div style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '40px' }}>
           <div style={{ marginBottom: '48px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>ORDER_ID // {order.id.split('-')[0].toUpperCase()}</div>
              <h2 style={{ fontSize: '32px', fontWeight: 900 }}>Tracking</h2>
           </div>

           <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '48px', paddingLeft: '32px' }}>
              <div style={{ position: 'absolute', left: '0', top: '10px', bottom: '10px', width: '2px', background: 'var(--border)' }} />
              <div style={{ position: 'absolute', left: '0', top: '10px', width: '2px', height: `${(currentIdx / (steps.length - 1)) * 100}%`, background: 'var(--accent)', transition: 'height 1s ease' }} />
              
              {steps.map((st, idx) => {
                const isPast = currentIdx > idx;
                const isCurrent = currentIdx === idx;
                const Future = idx > currentIdx;
                const Icon = st.icon;
                
                return (
                  <motion.div 
                    key={st.id} 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                    style={{ position: 'relative', opacity: Future ? 0.4 : 1 }}
                  >
                    {isCurrent && <div className="timeline-pulse pulse" />}
                    {!isCurrent && (
                      <div style={{ 
                        position: 'absolute', left: '-36px', top: '2px', width: '10px', height: '10px', 
                        borderRadius: '50%', background: isPast ? 'var(--accent)' : 'var(--border)',
                        zIndex: 10
                      }} />
                    )}

                    <div style={{ display: 'flex', gap: '20px' }}>
                       <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: isCurrent ? 'var(--accent-dim)' : 'var(--bg-elevated)', border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isCurrent ? 'var(--accent)' : 'var(--text-primary)' }}>
                          <Icon size={20} />
                       </div>
                       <div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: isCurrent ? 'var(--accent)' : 'var(--text-primary)' }}>{st.label}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{st.sub}</div>
                       </div>
                    </div>
                  </motion.div>
                );
              })}
           </div>

           <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
              {riderLoc && (
                <div className="glass-card glass-stack" style={{ padding: '24px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Users size={20} color="var(--accent)" />
                    </div>
                    <div>
                       <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lead Courier</div>
                       <div style={{ fontSize: '16px', fontWeight: 800 }}>{riderLoc.name}</div>
                    </div>
                  </div>
                  <a href={`tel:${riderLoc.phone}`} className="glass-stack" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--brand)', color: 'var(--on-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={18} />
                  </a>
                </div>
              )}
           </div>
        </div>

        {/* Right Side: Map HUD */}
        <div style={{ position: 'relative' }}>
           <MapContainer center={mapCenter} zoom={14} style={{ width: '100%', height: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {routePath && <Polyline positions={routePath} color="var(--accent)" weight={5} opacity={0.6} />}
              
              <Marker position={[order.dropLat, order.dropLng]}>
                 <Popup>Mission Objective</Popup>
              </Marker>

              {riderLoc && (
                <Marker position={[riderLoc.lat, riderLoc.lng]}>
                   <Popup>{riderLoc.name} is in motion.</Popup>
                </Marker>
              )}
           </MapContainer>
           
           <div style={{ position: 'absolute', bottom: '32px', right: '32px', zIndex: 1000 }}>
              <div className="glass-strong" style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                GPS_FEED: ACTIVE_ENCRYPTED
              </div>
           </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
           div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
           div[style*="minmax(380px, 1fr)"] { height: 50% !important; border-right: none !important; border-top: 1px solid var(--border) !important; order: 2; }
           div[style*="height: 100%"] { height: 50% !important; order: 1; }
        }
      `}} />
    </div>
  );
}
