import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import useSocket from '../hooks/useSocket';
import api from '../api/client';
import Button from '../components/ui/Button';

import 'leaflet/dist/leaflet.css';

export default function RiderView() {
  const { user } = useAuthStore();
  const socket = useSocket();
  const [online, setOnline] = useState(false);
  const [position, setPosition] = useState(null);

  const wakeLockRef = useRef(null);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) wakeLockRef.current = await navigator.wakeLock.request('screen');
    } catch (err) { console.error('WakeLock Error:', err); }
  };
  
  const releaseWakeLock = async () => {
    if (wakeLockRef.current !== null) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  useEffect(() => {
    let watchId;
    if (online && navigator.geolocation) {
      toast.success('You are now online');
      // Update backend status to available
      api.patch('/riders/by-user/status', { status: 'available' }).catch(()=>{});
      requestWakeLock();
      
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
          // Send location to backend API (which also emits socket event)
          api.patch('/riders/by-user/location', { lat: latitude, lng: longitude }).catch(()=>{});
        },
        (err) => {
          console.error('Geo Error:', err);
          if (err.code === 1) {
            toast.error('Location Access Denied. Please enable GPS in your browser settings to go online.');
            setOnline(false);
          } else {
            toast.error('Location Error: ' + err.message);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      if (online === false && navigator.geolocation && watchId) {
        api.patch('/riders/by-user/status', { status: 'offline' }).catch(()=>{});
      }
      if (watchId) navigator.geolocation.clearWatch(watchId);
      releaseWakeLock();
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      releaseWakeLock();
    };
  }, [online]);

  return (
    <div style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      
      {/* Absolute overlay for map */}
      <style dangerouslySetInnerHTML={{__html: `
        [data-theme="dark"] .leaflet-layer, [data-theme="dark"] .leaflet-control-zoom-in, [data-theme="dark"] .leaflet-control-zoom-out, [data-theme="dark"] .leaflet-control-attribution { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
        .leaflet-container { background-color: var(--bg); font-family: var(--font-ui); }
      `}} />
      
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) { .riderview-card { bottom: calc(64px + env(safe-area-inset-bottom, 0px) + 8px) !important; } }
      `}} />
      <div style={{ flex: 1, zIndex: 1, filter: online ? 'none' : 'grayscale(100%) opacity(50%)', transition: 'filter 0.5s' }}>
        <MapContainer center={position || [17.3850, 78.4867]} zoom={15} style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {position && <Circle center={position} radius={100} pathOptions={{ color: 'var(--accent)', fillColor: 'var(--accent)', fillOpacity: 0.2 }} />}
          {position && <Marker position={position}><Popup>You are here</Popup></Marker>}
        </MapContainer>
      </div>

      {/* Online Toggle Card Over Map */}
      <div className="glass-strong riderview-card" style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', zIndex: 400, borderRadius: 'var(--radius-xl)', padding: '24px', textAlign: 'center', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: online ? 'var(--success-dim)' : 'var(--bg-elevated)', border: `2px solid ${online ? 'var(--success)' : 'var(--border)'}`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
          <div className={online ? 'status-dot pulse' : 'status-dot'} style={{ background: online ? 'var(--success)' : 'var(--text-muted)' }} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {online ? 'You are Online' : 'You are Offline'}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {online ? 'Waiting for incoming deliveries...' : 'Go online to start receiving assignments.'}
        </p>

        <Button 
          size="lg" fullWidth 
          variant={online ? 'danger' : 'primary'}
          onClick={() => setOnline(!online)}
        >
          {online ? 'GO OFFLINE' : 'GO ONLINE'}
        </Button>
      </div>

    </div>
  );
}
