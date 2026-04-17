import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true
}) {
  const [render, setRender] = useState(isOpen);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      document.body.style.overflow = 'hidden';
      // tiny delay for entry animation to trigger
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const timer = setTimeout(() => {
        setRender(false);
        document.body.style.overflow = '';
      }, 150); // match exit transition ms
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!render) return null;

  const getSizeWidth = () => {
    switch(size) {
      case 'sm': return '400px';
      case 'lg': return '720px';
      case 'xl': return '900px';
      case 'md': default: return '560px';
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div 
        onClick={() => { if (closeOnBackdrop) onClose() }}
        style={{
          position: 'fixed', inset: 0,
          background: 'var(--overlay)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
          opacity: visible ? 1 : 0, transition: 'opacity 150ms ease'
        }}
      />
      <div
        className="glass-strong"
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%', maxWidth: getSizeWidth(), maxHeight: '90vh',
          borderRadius: 'var(--radius-xl)', zIndex: 501,
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          transform: visible ? 'scale(1)' : 'scale(0.96)',
          opacity: visible ? 1 : 0,
          transition: 'transform 150ms ease, opacity 150ms ease'
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', padding: '4px', display: 'flex', transition: 'color var(--transition-fast)'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1 }}>
          {children}
        </div>

        {footer && (
          <div style={{
            padding: '16px 24px', borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px'
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
