import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  children,
  type = 'button',
  style = {},
  className = '',
  ...props
}) {
  const [ripples, setRipples] = useState([]);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => setRipples([]), 600);
      return () => clearTimeout(timer);
    }
  }, [ripples]);

  const handleClick = (e) => {
    if (disabled || loading) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples(prev => [...prev, { x, y, id: Date.now() }]);
    if (onClick) onClick(e);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary': return { background: 'var(--accent)', color: 'var(--on-accent)' };
      case 'secondary': return { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)' };
      case 'ghost': return { background: 'transparent', color: 'var(--text-secondary)' };
      case 'danger': return { background: 'var(--danger)', color: '#ffffff' };
      case 'accent-ghost': return { background: 'var(--accent-dim)', color: 'var(--accent-text)' };
      default: return { background: 'var(--accent)', color: 'var(--on-accent)' };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm': return { height: '32px', padding: '0 12px', fontSize: '13px' };
      case 'lg': return { height: '48px', padding: '0 20px', fontSize: '15px' };
      case 'md': default: return { height: '40px', padding: '0 16px', fontSize: '14px' };
    }
  };

  const getHoverStyles = () => {
    switch (variant) {
      case 'primary': return 'brightness(1.1)';
      case 'secondary': return 'var(--bg-hover)';
      case 'ghost': return 'var(--bg-hover)';
      case 'danger': return 'brightness(1.1)';
      case 'accent-ghost': return 'rgba(0, 229, 204, 0.15)'; // slightly darker accent-dim
      default: return 'brightness(1.1)';
    }
  };

  const isTextHover = variant === 'secondary' || variant === 'ghost' || variant === 'accent-ghost';

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      className={className}
      style={{
        ...getVariantStyles(),
        ...getSizeStyles(),
        position: 'relative',
        overflow: 'hidden',
        border: variant === 'secondary' ? '1px solid var(--border)' : 'none',
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'var(--transition-fast)',
        userSelect: 'none',
        ...style
      }}
      onMouseEnter={e => {
        if (!disabled && !loading) {
          if (isTextHover) {
            e.currentTarget.style.background = getHoverStyles();
            if (variant === 'ghost') e.currentTarget.style.color = 'var(--text-primary)';
          } else {
            e.currentTarget.style.filter = getHoverStyles();
          }
        }
      }}
      onMouseLeave={e => {
        if (!disabled && !loading) {
          if (isTextHover) {
            e.currentTarget.style.background = variant === 'accent-ghost' ? 'var(--accent-dim)' : 'transparent';
            if (variant === 'ghost') e.currentTarget.style.color = 'var(--text-secondary)';
          } else {
            e.currentTarget.style.filter = 'none';
          }
        }
      }}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        <>
          {Icon && iconPosition === 'left' && (typeof Icon === 'function' ? <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} /> : Icon)}
          {children && <span>{children}</span>}
          {Icon && iconPosition === 'right' && (typeof Icon === 'function' ? <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} /> : Icon)}
        </>
      )}
      
      {/* Ripple Container */}
      {ripples.map(rip => (
        <span
          key={rip.id}
          style={{
            position: 'absolute', top: rip.y, left: rip.x, width: 2, height: 2,
            background: isTextHover ? 'var(--text-primary)' : '#ffffff',
            borderRadius: '50%', transform: 'translate(-50%, -50%)',
            pointerEvents: 'none', opacity: 0,
            animation: 'ripple 600ms linear'
          }}
        />
      ))}
    </button>
  );
}
