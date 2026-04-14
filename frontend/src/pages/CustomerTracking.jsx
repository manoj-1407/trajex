import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Package, Clock, Phone, MapPin, CheckCircle, Navigation } from 'lucide-react';
import api from '../api/client';
import useSocket from '../hooks/useSocket';
import Badge from '../components/ui/Badge';
import { formatTimeAgo } from '../utils/format';

import 'leaflet/dist/leaflet.css';

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
    // We assume backend has a public endpoint to GET order by token, or /orders/:token public
    // Per schema, orders table has tracking_token. Route /api/v1/orders/track/:token 
    api.get(`/tracking/${token}`).then(res => {
      setOrder(res.data.order);
      if (res.data.rider) {
        setRiderLoc({ lat: res.data.rider.last_lat, lng: res.data.rider.last_lng, name: res.data.rider.name, phone: res.data.rider.phone });
      }
    }).catch(() => {
      setError(true);
    }).finally(() => {
      setLoading(false);
    });
  }, [token]);

  useEffect(() => {
    if (riderLoc?.lat && riderLoc?.lng && order?.drop_lat && order?.drop_lng) {
      fetch(`https://router.project-osrm.org/route/v1/driving/${riderLoc.lng},${riderLoc.lat};${order.drop_lng},${order.drop_lat}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes[0]) {
             setRoutePath(data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
             setEta(Math.round(data.routes[0].duration / 60)); // seconds to minutes
          }
        }).catch(err => console.error("OSRM Routing Error:", err));
    }
  }, [riderLoc?.lat, riderLoc?.lng, order?.drop_lat, order?.drop_lng]);

  useEffect(() => {
    if (!socket || !order) return;
    
    // Listen for order status updates
    const onOrderUpd = (data) => {
      if (data.orderId === order.id) {
        setOrder(prev => ({ ...prev, status: data.status, updated_at: new Date().toISOString() }));
      }
    };
    
    // Listen for rider location if assigned
    const onRiderLoc = (data) => {
      if (order.rider_id && data.riderId === order.rider_id) {
        setRiderLoc(prev => ({ ...prev, lat: data.lat, lng: data.lng }));
      }
    };

    socket.on('order-updated', onOrderUpd);
    socket.on('rider-location', onRiderLoc);

    return () => {
      socket.off('order-updated', onOrderUpd);
      socket.off('rider-location', onRiderLoc);
    };
  }, [socket, order]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="skeleton" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-primary)', padding: '24px', textAlign: 'center' }}>
        <Package size={48} color="var(--border)" style={{ marginBottom: '24px' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>Tracking Link Invalid</h1>
        <p style={{ color: 'var(--text-secondary)' }}>This link may be expired or incorrect.</p>
      </div>
    );
  }

  // Determine standard steps layout
  const steps = [
    { id: 'confirmed', label: 'Order Confirmed', icon: Package },
    { id: 'assigned', label: 'Preparing', icon: Clock },
    { id: 'in_transit', label: 'Out for Delivery', icon: Navigation },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle }
  ];

  const currentStepIdx = steps.findIndex(s => s.id === order.status) !== -1 ? steps.findIndex(s => s.id === order.status) : 
                         (order.status === 'picked_up' ? 2 : 0);
  
  const mapCenter = riderLoc?.lat ? [riderLoc.lat, riderLoc.lng] : [17.3850, 78.4867];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', position: 'relative' }}>
      
      {/* Absolute Header Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, padding: '16px 24px', background: 'linear-gradient(to bottom, var(--bg-surface) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
             <path d="M12 4H6v4h6v20h4V8h16V4H12z M16 4c0 0 8 0 12 12" fill="var(--accent)"/>
          </svg>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>Trajex</span>
        </div>
      </div>

      {/* Map filling remaining space */}
      <div style={{ flex: 1, zIndex: 1 }}>
        <style dangerouslySetInnerHTML={{__html: `
          [data-theme="dark"] .leaflet-layer, [data-theme="dark"] .leaflet-control-zoom-in, [data-theme="dark"] .leaflet-control-zoom-out, [data-theme="dark"] .leaflet-control-attribution { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
          .leaflet-container { background-color: var(--bg); font-family: var(--font-ui); }
        `}} />
        <MapContainer center={mapCenter} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {routePath && (
            <Polyline positions={routePath} color="var(--accent)" weight={4} opacity={0.8} />
          )}

          {order?.drop_lat && order?.drop_lng && (
            <Marker position={[order.drop_lat, order.drop_lng]}>
              <Popup>Delivery Destination</Popup>
            </Marker>
          )}

          {riderLoc?.lat && (
            <Marker position={[riderLoc.lat, riderLoc.lng]}>
              <Popup>
                {riderLoc.name} <br/>
                {eta != null ? `${eta} mins away` : 'Updating ETA...'}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Slide UP Panel */}
      <div className="glass-strong" style={{
        padding: '32px 24px', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.1)', position: 'relative', zIndex: 400,
        marginTop: '-24px', flexShrink: 0
      }}>
        
        <div style={{ width: '48px', height: '4px', background: 'var(--border)', borderRadius: '2px', position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>#{order.id.split('-')[0].toUpperCase()}</div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Delivery Tracker</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Badge status={order.status} />
            {eta != null && <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', marginTop: '8px' }}>ETA: {eta} mins</div>}
          </div>
        </div>

        {/* Status Timeline */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '12px', left: '20px', right: '20px', height: '2px', background: 'var(--border)', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: '12px', left: '20px', height: '2px', background: 'var(--accent)', zIndex: 1, width: `calc(${(currentStepIdx / (steps.length - 1)) * 100}% - 40px)`, transition: 'width 0.5s ease' }} />
          
          {steps.map((st, idx) => {
            const isDone = currentStepIdx >= idx;
            const isCurrent = currentStepIdx === idx;
            return (
              <div key={st.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2, position: 'relative' }}>
                <div style={{ 
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: isDone ? 'var(--accent)' : 'var(--bg-surface)',
                  border: isDone ? 'none' : '2px solid var(--border)',
                  color: isDone ? 'var(--on-accent)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: isCurrent ? '0 0 0 4px var(--accent-glow)' : 'none'
                }}>
                  {isDone ? <CheckCircle size={14} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-muted)' }}/>}
                </div>
                <span style={{ fontSize: '11px', fontWeight: isCurrent ? 600 : 500, color: isCurrent ? 'var(--accent)' : isDone ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'center', maxWidth: '60px' }}>
                  {st.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Rider Info if available */}
        {riderLoc?.name && (
          <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--info-dim)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 600 }}>
                {riderLoc.name.substring(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Your Rider</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{riderLoc.name}</div>
              </div>
            </div>
            <a href={`tel:${riderLoc.phone}`} style={{ textDecoration: 'none', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'filter 0.2s' }} onMouseEnter={e => e.currentTarget.style.filter='brightness(1.2)'} onMouseLeave={e => e.currentTarget.style.filter='none'}>
              <Phone size={16} />
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
