import { Link, useLocation } from 'react-router-dom';
import { Layout, Package, Map as MapIcon, BarChart3, Settings, Truck } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function BottomNav() {
  const location = useLocation();
  const role = useAuthStore(s => s.user?.role) || 'staff';
  const isOwnerOrManager = role === 'owner' || role === 'manager';

  const tabs = [
    { label: 'Dash', icon: Layout, path: '/dashboard', show: true },
    { label: 'Orders', icon: Package, path: '/orders', show: true },
    { label: 'Map', icon: MapIcon, path: '/live-map', show: true },
    { label: 'Analytics', icon: BarChart3, path: '/analytics', show: isOwnerOrManager },
    { label: 'Settings', icon: Settings, path: '/settings', show: isOwnerOrManager },
    { label: 'Deliver', icon: Truck, path: '/my-deliveries', show: !isOwnerOrManager }
  ].filter(t => t.show);

  return (
    <div className="bottom-nav glass-strong" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 'calc(56px + env(safe-area-inset-bottom, 8px))',
      borderTop: '1px solid var(--border)', zIndex: 150,
      display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 8px)'
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) { .bottom-nav { display: none !important; } }
      `}} />

      {tabs.map(tab => {
        const isActive = location.pathname === tab.path || location.pathname.startsWith(`${tab.path}/`);
        return (
          <Link
            key={tab.path}
            to={tab.path}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              borderTop: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent', transition: 'var(--transition-fast)',
              paddingTop: '2px', textDecoration: 'none'
            }}
            // tap animation active state simulated via CSS active
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <tab.icon size={20} style={{ marginBottom: '2px' }} />
            <span style={{ fontSize: '10px', fontWeight: 600 }}>{tab.label}</span>
          </Link>
        )
      })}
    </div>
  );
}
