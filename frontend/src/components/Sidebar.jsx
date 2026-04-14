import { Link, useLocation } from 'react-router-dom';
import { 
  Layout, Package, Users, Map as MapIcon, 
  Truck, BarChart3, Settings, LogOut 
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const role = user?.role || 'staff';

  const isOwnerOrManager = role === 'owner' || role === 'manager';

  const navGroups = [
    {
      label: 'DISPATCH',
      items: [
        { label: 'Dashboard', icon: Layout, path: '/dashboard', show: true },
        { label: 'Orders', icon: Package, path: '/orders', show: true },
        { label: 'Riders', icon: Users, path: '/riders', show: isOwnerOrManager },
        { label: 'Live Map', icon: MapIcon, path: '/live-map', show: true },
        { label: 'My Deliveries', icon: Truck, path: '/my-deliveries', show: role === 'staff' },
      ].filter(item => item.show)
    },
    {
      label: 'INSIGHTS',
      items: [
        { label: 'Analytics', icon: BarChart3, path: '/analytics', show: isOwnerOrManager },
      ].filter(item => item.show)
    },
    {
      label: 'ACCOUNT',
      items: [
        { label: 'Settings', icon: Settings, path: '/settings', show: isOwnerOrManager },
      ].filter(item => item.show)
    }
  ].filter(group => group.items.length > 0);

  const getRoleLabel = () => {
    if (role === 'owner') return 'OWNER WORKSPACE';
    if (role === 'manager') return 'MANAGER ACCESS';
    return 'STAFF ACCESS';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <>
      <div 
        className="sidebar-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--overlay)',
          zIndex: 199,
          display: isOpen ? 'block' : 'none'
        }}
        onClick={onClose}
        aria-label="Close sidebar overlay"
      />
      <div 
        className={`glass sidebar-panel ${isOpen ? 'sidebar-open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '240px',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border)',
          transition: 'transform var(--transition-spring)',
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          .sidebar-panel { transform: translateX(0); }
          @media (max-width: 767px) {
            .sidebar-panel { transform: translateX(-100%); }
            .sidebar-panel.sidebar-open { transform: translateX(0); }
          }
          @media (min-width: 768px) {
            .sidebar-backdrop { display: none !important; }
          }
        `}} />

        <div style={{ padding: '24px 20px', flexShrink: 0 }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4H6v4h6v20h4V8h16V4H12z M16 4c0 0 8 0 12 12" fill="var(--accent)"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '20px', color: 'var(--accent)' }}>Trajex</span>
          </Link>
          
          <div className="divider" style={{ margin: '0 0 20px 0' }} />
          
          <div style={{ 
            background: 'var(--accent-dim)', 
            color: 'var(--accent-text)', 
            fontSize: '10px', 
            fontWeight: 700, 
            padding: '6px 10px', 
            borderRadius: 'var(--radius-full)', 
            display: 'inline-block',
            textTransform: 'uppercase',
            letterSpacing: '0.12em'
          }}>
            {getRoleLabel()}
          </div>
        </div>

        <div style={{ flex: 1, padding: '0 16px', overflowY: 'auto' }}>
          {navGroups.map((group, idx) => (
            <div key={idx} style={{ marginBottom: '24px' }}>
              <div style={{ 
                fontSize: '10px', 
                color: 'var(--text-muted)', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em',
                marginBottom: '10px',
                paddingLeft: '12px'
              }}>
                {group.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {group.items.map(item => {
                  const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => { if (window.innerWidth < 768) onClose(); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        height: '40px',
                        padding: '0 12px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                        background: isActive ? 'var(--accent-dim)' : 'transparent',
                        borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                        transition: 'var(--transition-base)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'var(--bg-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <item.icon size={18} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', 
              background: 'var(--accent)', color: 'var(--on-accent)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '13px', fontWeight: 600, flexShrink: 0 
            }}>
              {getInitials(user?.name)}
            </div>
            <div className="truncate" style={{ flex: 1 }}>
              <div className="truncate" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{user?.name || 'User'}</div>
              <div className="truncate" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{role.charAt(0).toUpperCase() + role.slice(1)}</div>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            style={{ 
              background: 'none', border: 'none', padding: '8px', cursor: 'pointer', 
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius-sm)', transition: 'var(--transition-base)' 
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
