import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  error,
  disabled,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  placeholder = ' ',
  hint,
  className = '',
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const currentType = isPassword && showPassword ? 'text' : type;
  
  const hasValue = value != null && value !== '';
  const floating = focused || hasValue;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }} className={className}>
      <div 
        style={{ 
          position: 'relative', 
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${error ? 'var(--danger)' : focused ? 'var(--accent)' : 'var(--border)'}`,
          boxShadow: focused && !error ? '0 0 0 3px var(--accent-glow)' : 'none',
          transition: 'var(--transition-fast)',
          display: 'flex',
          alignItems: 'center',
          opacity: disabled ? 0.5 : 1,
          height: '48px', // Ensuring solid click target area even if input is smaller natively
        }}
      >
        {LeftIcon && (
          <div style={{ paddingLeft: '16px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
            <LeftIcon size={16} />
          </div>
        )}
        
        <div style={{ position: 'relative', flex: 1, height: '100%', display: 'flex', alignItems: 'center' }}>
          <input
            {...props}
            type={currentType}
            value={value}
            onChange={onChange}
            disabled={disabled}
            onFocus={(e) => { setFocused(true); if (props.onFocus) props.onFocus(e); }}
            onBlur={(e) => { setFocused(false); if (props.onBlur) props.onBlur(e); }}
            placeholder={floating ? placeholder : ''}
            style={{
              width: '100%', height: '100%',
              background: 'transparent', border: 'none', outline: 'none',
              padding: `16px 16px 0 ${LeftIcon ? '12px' : '16px'}`,
              fontSize: '14px', color: 'var(--text-primary)',
              fontFamily: 'inherit', cursor: disabled ? 'not-allowed' : 'text'
            }}
          />
          {label && (
            <label
              style={{
                position: 'absolute',
                left: LeftIcon ? '12px' : '16px',
                top: floating ? '6px' : '14px',
                fontSize: floating ? '11px' : '14px',
                color: error ? 'var(--danger)' : floating ? 'var(--text-secondary)' : 'var(--text-muted)',
                fontWeight: floating ? 500 : 400,
                pointerEvents: 'none',
                transition: 'all var(--transition-fast)'
              }}
            >
              {label}
            </label>
          )}
        </div>

        <div style={{ paddingRight: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {RightIcon && !isPassword && <RightIcon size={16} color="var(--text-muted)" />}
          
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              style={{
                background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
      </div>
      
      {error ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontSize: '12px', marginTop: '2px' }}>
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      ) : hint ? (
        <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>{hint}</span>
      ) : null}
    </div>
  );
}
