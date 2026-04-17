import React from 'react';
import { Sun, Moon, Monitor, Zap } from 'lucide-react';
import useThemeStore from '../store/useThemeStore';

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  const themes = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'midnight', icon: Zap, label: 'Midnight' },
    { id: 'system', icon: Monitor, label: 'System' }
  ];

  return (
    <div className="glass" style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}>
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            aria-label={`Switch to ${t.label} theme`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: isActive ? 'var(--bg-elevated)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-base)',
            }}
            onMouseEnter={e => !isActive && (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => !isActive && (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}
