import React, { useState, useEffect, useRef, useContext, createContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, Navigation, Users, Settings, Package, LayoutDashboard, Map as MapIcon, X } from 'lucide-react';

const PaletteContext = createContext({ open: false, setOpen: () => {} });

export const usePalette = () => useContext(PaletteContext);

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const commands = [
    { id: 'dash', title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', category: 'Navigation' },
    { id: 'map', title: 'Live Map', icon: MapIcon, path: '/live-map', category: 'Navigation' },
    { id: 'orders', title: 'Orders', icon: Package, path: '/orders', category: 'Navigation' },
    { id: 'riders', title: 'Riders', icon: Users, path: '/riders', category: 'Navigation' },
    { id: 'settings', title: 'Settings', icon: Settings, path: '/settings', category: 'Navigation' },
    { id: 'new-order', title: 'Create New Order', icon: Package, action: () => navigate('/orders?new=true'), category: 'Actions' },
  ];

  const [dynamicResults, setDynamicResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setDynamicResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [oRes, rRes] = await Promise.all([
          api.get('/orders').catch(() => ({ data: { orders: [] } })),
          api.get('/riders').catch(() => ({ data: { riders: [] } }))
        ]);

        const q = query.toLowerCase();
        const orders = (oRes.data?.orders || [])
          .filter(o => o.id.toLowerCase().includes(q) || o.customer_name?.toLowerCase().includes(q))
          .map(o => ({
            id: `order-${o.id}`,
            title: `Order: ${o.customer_name}`,
            subtitle: `#${o.id.substring(0,8).toUpperCase()}`,
            icon: Package,
            path: `/orders?id=${o.id}`,
            category: 'Orders'
          }))
          .slice(0, 3);

        const riders = (rRes.data?.riders || [])
          .filter(r => r.name.toLowerCase().includes(q))
          .map(r => ({
            id: `rider-${r.id}`,
            title: `Rider: ${r.name}`,
            subtitle: r.status.toUpperCase(),
            icon: Users,
            path: `/riders?id=${r.id}`,
            category: 'Riders'
          }))
          .slice(0, 3);

        setDynamicResults([...orders, ...riders]);
      } catch (e) {
        console.error('Search failed', e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const filtered = query === ''
    ? commands
    : [
        ...commands.filter(c => c.title.toLowerCase().includes(query.toLowerCase())),
        ...dynamicResults
      ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (cmd) => {
    if (cmd.path) navigate(cmd.path);
    if (cmd.action) cmd.action();
    setIsOpen(false);
  };

  return (
    <PaletteContext.Provider value={{ open: isOpen, setOpen: setIsOpen }}>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              style={{
                position: 'fixed', top: '20%', left: '50%', x: '-50%',
                width: '90%', maxWidth: '600px', zIndex: 1001,
                background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
                overflow: 'hidden', border: '1px solid var(--border)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border)' }}>
                <Search size={20} color="var(--text-muted)" style={{ marginRight: '12px' }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search commands or navigation..."
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    color: 'var(--text-primary)', fontSize: '16px', outline: 'none'
                  }}
                />
                <div className="glass" style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>ESC</div>
              </div>

              <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
                {filtered.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  const active = idx === selectedIndex;
                  return (
                    <div
                      key={cmd.id}
                      onClick={() => handleSelect(cmd)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                        borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        background: active ? 'var(--bg-elevated)' : 'transparent',
                        color: active ? 'var(--accent)' : 'var(--text-primary)'
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: active ? 'var(--accent-dim)' : 'var(--bg-hover)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{cmd.title}</div>
                        <div style={{ fontSize: '11px', color: active ? 'var(--accent)' : 'var(--text-muted)', opacity: active ? 0.8 : 1 }}>{cmd.subtitle || cmd.category}</div>
                      </div>
                      {active && <Command size={14} />}
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No results found for "{query}"
                  </div>
                )}
              </div>

              <div style={{ padding: '12px 16px', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Navigation size={12} /> to navigate</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>↵ to select</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PaletteContext.Provider>
  );
}
