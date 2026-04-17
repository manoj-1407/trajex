import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import api from '../api/client';
import Button from './ui/Button';

export function ProfileSection() {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const getInitials = (n) => n?.split(' ').map(x => x[0]).join('').toUpperCase().substring(0, 2) || 'U';

  const handleSave = async () => {
    if (!name.trim()) return setIsEditing(false);
    if (name === user.name) return setIsEditing(false);
    
    setSaving(true);
    try {
      const res = await api.patch('/auth/profile', { name });
      setUser({ ...user, name: res.data.user?.name || name });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%',
        background: 'var(--accent)', color: 'var(--on-accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '24px', fontWeight: 600, flexShrink: 0
      }}>
        {getInitials(user?.name)}
      </div>

      <div style={{ flex: 1 }}>
        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              style={{
                background: 'var(--bg-surface)', border: '1px solid var(--accent)',
                color: 'var(--text-primary)', fontSize: '20px', fontWeight: 600,
                padding: '4px 8px', borderRadius: 'var(--radius-sm)', width: '200px',
                outline: 'none', boxShadow: '0 0 0 3px var(--accent-glow)'
              }}
            />
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving} icon={<Check />} />
            <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setName(user?.name); }} icon={<X />} disabled={saving} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              {user?.name || 'User'}
            </h2>
            <button 
              onClick={() => setIsEditing(true)}
              style={{ 
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', transition: 'var(--transition-fast)' 
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
              title="Edit name"
            >
              <Pencil size={14} />
            </button>
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{user?.email}</div>
          <div style={{
            background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
            fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)',
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            {user?.role || 'Staff'}
          </div>
        </div>
      </div>
    </div>
  );
}
