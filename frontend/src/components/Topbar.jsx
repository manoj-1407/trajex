import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, LogOut, User, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import ThemeToggle from './ThemeToggle';

export default function Topbar({ onMenuOpen, pageTitle, onNotificationClick, unreadCount }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const openPalette = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true }));
  };

  return (
    <div 
      className="glass" 
      style={{ 
        position: 'fixed', top: 0, right: 0, height: '64px', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', borderBottom: '1px solid var(--border)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1023px) {
          .glass[style*="height: 64px"] { left: 0 !important; padding: 0 16px !important; }
          .desktop-only { display: none !important; }
        }
        @media (min-width: 1024px) {
          .glass[style*="height: 64px"] { left: 260px !important; }
          .mobile-only { display: none !important; }
        }
      `}} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button 
          className="mobile-only" onClick={onMenuOpen}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px' }}
        >
          <Menu size={20} />
        </button>
        <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {pageTitle || 'Dashboard'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Command Palette Trigger */}
        <button
          onClick={openPalette}
          className="desktop-only glass-stack"
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '0 12px', height: '36px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600
          }}
        >
          <Search size={16} />
          <span>Quick Search</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', opacity: 0.6 }}>
             <Command size={10} />
             <span>K</span>
          </div>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThemeToggle />
          
          <button
            onClick={onNotificationClick}
            style={{
              width: '36px', height: '36px', borderRadius: '50%', background: 'transparent',
              border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg-surface)' }} />}
          </button>
        </div>

        <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 8px' }} />

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-dim)', 
              color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 800, border: '1px solid var(--accent-glow)'
            }}>
              {getInitials(user?.name)}
            </div>
          </button>

          {dropdownOpen && (
            <div className="glass-card glass-stack" style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: '220px', padding: '8px', zIndex: 1000, boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '8px' }}>
                 <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{user?.name}</div>
                 <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{user?.email}</div>
              </div>
              <button onClick={() => { setDropdownOpen(false); navigate('/settings'); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}>
                <User size={16} /> Access Profile
              </button>
              <button onClick={async () => { try { await import('../api/client').then(m => m.default.post('/auth/logout')); } catch(e) {} logout(); navigate('/login'); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: '13px', fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}>
                <LogOut size={16} /> Terminate Session
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
