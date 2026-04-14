import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Layout, Package, Users, Map as MapIcon, 
  BarChart3, Settings, Truck, Plus, Play, Link as LinkIcon 
} from 'lucide-react';

export function usePalette() {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return { isOpen, close: () => setIsOpen(false) };
}

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Store recent navigation internally
  useEffect(() => {
    if (location.pathname === '/login' || location.pathname === '/register') return;
    const recentStr = sessionStorage.getItem('trajex-recent-routes') || '[]';
    try {
      let recent = JSON.parse(recentStr);
      recent = recent.filter(r => r !== location.pathname);
      recent.unshift(location.pathname);
      if (recent.length > 5) recent = recent.slice(0, 5);
      sessionStorage.setItem('trajex-recent-routes', JSON.stringify(recent));
    } catch(e) {}
  }, [location.pathname]);

  const allItems = useMemo(() => [
    { type: 'PAGES', label: 'Dashboard', icon: Layout, action: () => navigate('/dashboard') },
    { type: 'PAGES', label: 'Orders', icon: Package, action: () => navigate('/orders') },
    { type: 'PAGES', label: 'Riders', icon: Users, action: () => navigate('/riders') },
    { type: 'PAGES', label: 'Analytics', icon: BarChart3, action: () => navigate('/analytics') },
    { type: 'PAGES', label: 'Live Map', icon: MapIcon, action: () => navigate('/live-map') },
    { type: 'PAGES', label: 'Settings', icon: Settings, action: () => navigate('/settings') },
    { type: 'PAGES', label: 'My Deliveries', icon: Truck, action: () => navigate('/my-deliveries') },
    
    { type: 'ACTIONS', label: 'New Order', icon: Plus, action: () => navigate('/orders', { state: { action: 'new_order' } }) },
    { type: 'ACTIONS', label: 'View Live Map', icon: MapIcon, action: () => navigate('/live-map') },
    { type: 'ACTIONS', label: 'Run Tests', icon: Play, action: () => navigate('/analytics') },
    { type: 'ACTIONS', label: 'Invite Rider', icon: Users, action: () => navigate('/riders', { state: { action: 'invite_rider' } }) },
    ...(location.pathname.startsWith('/orders') ? [
      { type: 'ACTIONS', label: 'Copy Tracking Link', icon: LinkIcon, action: () => console.log('Copy') } // Implemented in pages
    ] : [])
  ], [navigate, location.pathname]);

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Return 5 pages + actions
      return allItems.filter(i => i.type === 'PAGES').slice(0, 5)
        .concat(allItems.filter(i => i.type === 'ACTIONS').slice(0, 3));
    }
    return allItems.filter(item => item.label.toLowerCase().includes(q));
  }, [query, allItems]);

  useEffect(() => { setSelectedIndex(0); }, [filteredItems]);

  // Handle Keyboard Nav
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
        e.preventDefault();
        filteredItems[selectedIndex].action();
        onClose();
        setQuery('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 300 }} 
        onClick={() => { onClose(); setQuery(''); }} 
      />
      <div 
        className="glass-strong"
        style={{
          position: 'fixed', top: '15vh', left: '50%', transform: 'translateX(-50%)',
          width: '90vw', maxWidth: '580px', borderRadius: 'var(--radius-xl)',
          zIndex: 301, animation: 'scaleIn 150ms ease',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
          <Search size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, actions..."
            style={{
              flex: 1, height: '56px', background: 'transparent', border: 'none',
              padding: '0 16px', fontSize: '16px', color: 'var(--text-primary)', outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <kbd style={{
            fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
            padding: '2px 6px', background: 'var(--bg-elevated)', borderRadius: '4px', border: '1px solid var(--border)'
          }}>ESC</kbd>
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '12px' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              No results found for "{query}"
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filteredItems.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={`${item.type}-${item.label}`}
                    onClick={() => { item.action(); onClose(); setQuery(''); }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px', width: '100%', textAlign: 'left',
                      background: isSelected ? 'var(--accent-dim)' : 'transparent',
                      border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      color: isSelected ? 'var(--accent-text)' : 'var(--text-secondary)',
                      transition: 'background var(--transition-fast)'
                    }}
                  >
                    <item.icon size={16} />
                    <span style={{ fontSize: '15px', fontWeight: 500, flex: 1 }}>{item.label}</span>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {item.type}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
