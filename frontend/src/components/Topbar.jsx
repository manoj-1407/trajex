import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, Sun, Moon, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useThemeStore from '../store/useThemeStore';
import useAuthStore from '../store/useAuthStore';

export default function Topbar({ onMenuOpen, pageTitle, onNotificationClick, unreadCount }) {
  const { theme, toggleTheme } = useThemeStore();
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

  const openCommandPalette = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div 
      className="glass" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        right: 0, 
        height: '56px', 
        borderBottom: '1px solid var(--border)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderLeft: 'none'
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 767px) {
          .glass[style*="height: 56px"] { left: 0 !important; padding: 0 16px !important; }
          .desktop-only { display: none !important; }
        }
        @media (min-width: 768px) {
          .glass[style*="height: 56px"] { left: 240px !important; }
          .mobile-only { display: none !important; }
        }
      `}} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          className="mobile-only"
          onClick={onMenuOpen}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', padding: '4px', cursor: 'pointer' }}
        >
          <Menu size={20} />
        </button>
        <h1 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
          {pageTitle || 'Dashboard'}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
          <button
            onClick={openCommandPalette}
            style={{
              background: 'none', border: 'none', padding: '8px',
              color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center',
              borderRadius: 'var(--radius-sm)', transition: 'var(--transition-fast)'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Search size={18} />
          </button>
          <kbd className="desktop-only" style={{
            fontSize: '11px', color: 'var(--text-muted)', padding: '2px 6px',
            border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-elevated)',
            fontFamily: 'var(--font-mono)'
          }}>⌘K</kbd>
        </div>

        <button
          onClick={onNotificationClick}
          style={{
            background: 'none', border: 'none', padding: '8px', position: 'relative',
            color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center',
            borderRadius: 'var(--radius-sm)', transition: 'var(--transition-fast)'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: '4px', right: '4px',
              background: 'var(--accent)', color: 'var(--on-accent)',
              fontSize: '10px', fontWeight: 700, width: '16px', height: '16px',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={toggleTheme}
          style={{
            background: 'none', border: 'none', width: '36px', height: '36px',
            color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%', transition: 'color var(--transition-fast)'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: theme === 'dark' ? 'rotate(0)' : 'rotate(180deg)',
            transition: 'transform var(--transition-base)'
          }}>
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </div>
        </button>

        <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 8px' }} />

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              background: 'none', border: 'none', padding: '4px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              borderRadius: 'var(--radius-full)', transition: 'background var(--transition-fast)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <span className="desktop-only" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              {user?.name?.split(' ')[0] || 'User'}
            </span>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--accent)', color: 'var(--on-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 600
            }}>
              {getInitials(user?.name)}
            </div>
          </button>

          {dropdownOpen && (
            <div className="glass-card" style={{
              position: 'absolute', top: 'calc(100% + 4px)', right: '0',
              width: '180px', padding: '8px',
              display: 'flex', flexDirection: 'column',
              animation: 'scaleIn 100ms ease'
            }}>
              <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                <div className="truncate" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
                <div className="truncate" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
              
              <button 
                onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                  background: 'none', border: 'none', width: '100%', textAlign: 'left',
                  fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                <User size={16} /> Profile
              </button>
              
              <button 
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                  background: 'none', border: 'none', width: '100%', textAlign: 'left',
                  fontSize: '13px', fontWeight: 500, color: 'var(--danger)',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-dim)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
