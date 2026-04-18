import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock, User, Building, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import api from '../api/client';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { AuthSplitLayout } from './Login';

export default function Register() {
  const [form, setForm] = useState({ businessName: '', name: '', email: '', password: '', role: 'owner' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const setAuth = useAuthStore(s => s.setAuth);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  if (isAuthenticated) return <Navigate to="/dashboard" />;

  const pScore = Math.min(Math.floor(form.password.length / 3), 4);
  const scoreColor = ['var(--border)', 'var(--danger)', 'var(--warning)', 'var(--success)', 'var(--accent)'][pScore] || 'var(--border)';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', form);
      setAuth(res.data.accessToken, res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/auth/google/init`;
  };

  return (
    <AuthSplitLayout title="Scale Your Operations." subtitle="Set up your fleet workspace and manage your logistical movements with professional precision.">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card glass-stack" style={{ padding: 'clamp(20px, 5vw, 40px)', borderRadius: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 850, marginBottom: '8px', letterSpacing: '-0.03em' }}>Create account</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>Set up your organization's workspace.</p>

        {error && (
          <div style={{ background: 'var(--danger-dim)', color: 'var(--danger)', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', marginBottom: '24px', border: '1px solid var(--danger-dim)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '12px' }}>
            <Input label="Business Name" value={form.businessName} onChange={e => setForm({...form, businessName: e.target.value})} leftIcon={Building} disabled={loading} placeholder="e.g. Trajex India" />
            <Input label="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} leftIcon={User} disabled={loading} placeholder="Your Name" />
          </div>
          
          <Input label="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} leftIcon={Mail} disabled={loading} placeholder="name@company.com" />
          
          <div>
            <Input label="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} leftIcon={Lock} disabled={loading} placeholder="••••••••" />
            {form.password && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                {[1,2,3,4].map(n => (
                  <div key={n} style={{ flex: 1, height: '3px', borderRadius: '2px', background: n <= pScore ? scoreColor : 'var(--bg-elevated)', transition: 'background 0.3s' }} />
                ))}
              </div>
            )}
          </div>

          <Select
            label="Role"
            value={form.role}
            onChange={v => setForm({...form, role: v})}
            disabled={loading}
            options={[
              { value: 'owner', label: 'Agency Owner', sublabel: 'Full administrative control over organization' },
              { value: 'manager', label: 'Fleet Manager', sublabel: 'Operational control & dispatch authorization' }
            ]}
          />

          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} style={{ marginTop: '8px' }}>
            Create Account
          </Button>
        </form>

        <div style={{ position: 'relative', margin: '24px 0', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ position: 'relative', background: 'var(--bg-surface)', padding: '0 16px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>MNC Identity Sync</span>
        </div>

        <button 
          disabled 
          style={{ 
            width: '100%', padding: '14px', borderRadius: '12px', 
            border: '1px solid var(--border)', background: 'var(--bg-elevated)', 
            color: 'var(--text-muted)', fontSize: '15px', fontWeight: 600, 
            cursor: 'not-allowed', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', gap: '10px', opacity: 0.5 
          }}
        >
          <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--border)', display: 'inline-block' }} />
          Google Sign-In (Coming Soon)
        </button>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/login" style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Already have an account? <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Login →</span>
          </Link>
        </div>
      </motion.div>
    </AuthSplitLayout>
  );
}
