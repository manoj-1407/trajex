import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';

export default function Select({
  label,
  value,
  onChange,
  options = [], // { value: any, label: string }
  error,
  disabled,
  placeholder = 'Select...',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : '';
  const floating = isOpen || value != null;

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative', width: '100%' }} className={className}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative', 
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${error ? 'var(--danger)' : isOpen ? 'var(--accent)' : 'var(--border)'}`,
          boxShadow: isOpen && !error ? '0 0 0 3px var(--accent-glow)' : 'none',
          transition: 'var(--transition-fast)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '48px', padding: '16px 16px 0 16px',
          opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left', width: '100%'
        }}
      >
        <span style={{ 
          fontSize: '14px', 
          color: selectedOption ? 'var(--text-primary)' : 'transparent',
          position: 'relative', top: '-2px'
        }}>
          {displayLabel || ' '}
        </span>

        {label && (
          <label style={{
            position: 'absolute',
            left: '16px',
            top: floating ? '6px' : '14px',
            fontSize: floating ? '11px' : '14px',
            color: error ? 'var(--danger)' : floating ? 'var(--text-secondary)' : 'var(--text-muted)',
            fontWeight: floating ? 500 : 400,
            pointerEvents: 'none',
            transition: 'all var(--transition-fast)'
          }}>
            {label}
          </label>
        )}
        
        {!floating && placeholder && (
           <span style={{ position: 'absolute', left: '16px', top: '14px', fontSize: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }}>
            {placeholder}
          </span>
        )}

        <ChevronDown 
          size={16} 
          color="var(--text-muted)" 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform var(--transition-base)' }} 
        />
      </button>

      {isOpen && (
        <div 
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            maxHeight: '240px', overflowY: 'auto', zIndex: 100,
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
            padding: '4px', animation: 'fadeIn 150ms ease'
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>No options</div>
          ) : (
            options.map((opt, i) => (
              <button
                key={`${opt.value}-${i}`}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                style={{
                  width: '100%', height: '40px', padding: '0 12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: opt.value === value ? 'var(--accent-dim)' : 'transparent',
                  color: opt.value === value ? 'var(--accent-text)' : 'var(--text-primary)',
                  border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  fontSize: '14px', transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={e => {
                   if (opt.value !== value) e.currentTarget.style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={e => {
                   if (opt.value !== value) e.currentTarget.style.background = 'transparent';
                }}
              >
                {opt.sublabel ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span>{opt.label}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{opt.sublabel}</span>
                  </div>
                ) : (
                  <span>{opt.label}</span>
                )}
                {opt.value === value && <Check size={16} />}
              </button>
            ))
          )}
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontSize: '12px', marginTop: '2px' }}>
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
