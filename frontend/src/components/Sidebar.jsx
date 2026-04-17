import { Link, useLocation } from 'react-router-dom';
import { 
  Layout, Package, Users, Map as MapIcon, 
  Truck, BarChart3, Settings, LogOut, Zap
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../api/client';
import { motion } from 'framer-motion';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const role = user?.role || 'staff';

  const isOwnerOrManager = role === 'owner' || role === 'manager';

  const navGroups = [
    {
      label: 'DISPATCH',
      items: [
        { id: 'nav-dashboard', label: 'Dashboard', icon: Layout, path: '/dashboard', show: true },
        { id: 'nav-orders', label: 'Orders', icon: Package, path: '/orders', show: true },
        { id: 'nav-riders', label: 'Riders', icon: Users, path: '/riders', show: isOwnerOrManager },
        { id: 'nav-live-map', label: 'Live Map', icon: MapIcon, path: '/live-map', show: true },
        { id: 'nav-my-deliveries', label: 'My Deliveries', icon: Truck, path: '/my-deliveries', show: role === 'staff' },
      ].filter(item => item.show)
    },
    {
      label: 'INSIGHTS',
      items: [
        { id: 'nav-analytics', label: 'Analytics', icon: BarChart3, path: '/analytics', show: isOwnerOrManager },
      ].filter(item => item.show)
    },
    {
      label: 'SYSTEM',
      items: [
        { id: 'nav-settings', label: 'Settings', icon: Settings, path: '/settings', show: isOwnerOrManager },
      ].filter(item => item.show)
    }
  ].filter(group => group.items.length > 0);

  const getRoleLabel = () => {
    if (role === 'owner') return 'ADMIN';
    if (role === 'manager') return 'OPERATIONS_MANAGER';
    return 'FIELD_AGENT';
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
          position: 'fixed', inset: 0, background: 'var(--overlay)',
          zIndex: 199, display: isOpen ? 'block' : 'none'
        }}
        onClick={onClose}
      />
      <div 
        className={`glass sidebar-panel glass-stack ${isOpen ? 'sidebar-open' : ''}`}
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: '260px',
          zIndex: 200, display: 'flex', flexDirection: 'column',
          borderRight: '1px solid var(--border)', transition: 'transform var(--transition-spring)',
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          .sidebar-panel { transform: translateX(0); }
          @media (max-width: 1023px) {
            .sidebar-panel { transform: translateX(-100%); }
            .sidebar-panel.sidebar-open { transform: translateX(0); }
          }
        `}} />

        <div style={{ padding: '32px 24px', flexShrink: 0 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px var(--accent-glow)' }}>
              <Zap size={18} color="var(--bg-surface)" fill="currentColor" />
            </div>
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '22px', letterSpacing: '-0.04em' }}>Trajex</span>
          </Link>
          
          <div style={{ 
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            fontSize: '10px', fontWeight: 800, padding: '4px 10px', 
            borderRadius: 'var(--radius-sm)', display: 'inline-block',
            textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-text)'
          }}>
            {getRoleLabel()}
          </div>
        </div>

        <div style={{ flex: 1, padding: '0 16px', overflowY: 'auto' }}>
          {navGroups.map((group, idx) => (
            <div key={idx} style={{ marginBottom: '32px' }}>
              <div style={{ 
                fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, 
                textTransform: 'uppercase', letterSpacing: '0.1em',
                marginBottom: '12px', paddingLeft: '12px'
              }}>
                {group.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {group.items.map(item => {
                  const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      id={item.id}
                      onClick={() => { if (window.innerWidth < 768) onClose(); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        height: '44px', padding: '0 12px', borderRadius: '12px',
                        fontSize: '14px', fontWeight: 600,
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        background: isActive ? 'var(--bg-elevated)' : 'transparent',
                        border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                        transition: 'var(--transition-base)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <item.icon size={18} color={isActive ? 'var(--accent)' : 'currentColor'} />
                      {item.label}
                      {isActive && <motion.div layoutId="nav-glow" style={{ position: 'absolute', right: '4px', width: '4px', height: '20px', borderRadius: '2px', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }} />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '50%', 
              background: 'var(--accent-dim)', color: 'var(--accent)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '14px', fontWeight: 800, flexShrink: 0,
              border: '1px solid var(--accent-glow)'
            }}>
              {getInitials(user?.name)}
            </div>
            <div className="truncate" style={{ flex: 1 }}>
              <div className="truncate" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name || 'Commander'}</div>
              <div className="truncate" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Connected</div>
            </div>
          </div>
          <button 
            onClick={async () => { try { await api.post('/auth/logout'); } catch(e) {} logout(); }}
            style={{ 
              background: 'none', border: 'none', padding: '8px', cursor: 'pointer', 
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius-sm)', transition: 'var(--transition-base)' 
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
