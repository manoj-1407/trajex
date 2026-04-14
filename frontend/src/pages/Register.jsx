import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock, User, Building } from 'lucide-react';
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
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/dashboard" />;

  const pScore = Math.min(Math.floor(form.password.length / 3), 4); // basic visual score
  const scoreColor = ['var(--bg-elevated)', 'var(--danger)', 'var(--warning)', 'var(--success)', 'var(--success)'][pScore] || 'var(--bg-elevated)';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.businessName || !form.name || !form.email || !form.password) return setError('All fields are required');
    if (form.password.length < 8) return setError('Password must be at least 8 characters');

    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', form);
      if (res.data?.accessToken) {
        setAuth(res.data.accessToken, res.data.user);
        navigate('/onboarding');
      }
    } catch (err) {
      if (err.response?.data?.details?.length > 0) {
        setError(err.response.data.details[0].message);
      } else {
        setError(err.response?.data?.error || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="fade-in-up">
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Create your workspace</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Set up Trajex for your delivery business</p>

        {error && (
          <div style={{ background: 'var(--danger-dim)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Business Name"
            value={form.businessName}
            onChange={e => setForm({...form, businessName: e.target.value})}
            leftIcon={Building}
            disabled={loading}
          />
          <Input 
            label="Full Name"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            leftIcon={User}
            disabled={loading}
          />
          <Input 
            label="Email address"
            type="email"
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            leftIcon={Mail}
            disabled={loading}
          />
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Input 
                label="Password" 
                type="password" 
                value={form.password} 
                onChange={e => setForm({...form, password: e.target.value})} 
                leftIcon={Lock}
                required 
                disabled={loading}
                placeholder="••••••••"
              />
              <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                 <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.05em' }}>PASSWORD REQUIREMENTS</div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                    {[
                      { label: '8+ Characters', met: form.password.length >= 8 },
                      { label: 'Uppercase', met: /[A-Z]/.test(form.password) },
                      { label: 'Lowercase', met: /[a-z]/.test(form.password) },
                      { label: 'Number', met: /[0-9]/.test(form.password) },
                      { label: 'Special Symbol', met: /[!@#$%^&*]/.test(form.password) }
                    ].map((req, i) => (
                      <div key={i} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', color: req.met ? 'var(--success)' : 'var(--text-muted)' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: req.met ? 'var(--success)' : 'var(--border)' }} />
                        {req.label}
                      </div>
                    ))}
                 </div>
              </div>
            </div>
            {form.password && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                {[1,2,3,4].map(n => (
                  <div key={n} style={{ flex: 1, height: '4px', borderRadius: '2px', background: n <= pScore ? scoreColor : 'var(--bg-elevated)', transition: 'background 0.3s' }} />
                ))}
              </div>
            )}
          </div>

          <Select
            label="I am joining as"
            value={form.role}
            onChange={v => setForm({...form, role: v})}
            disabled={loading}
            options={[
              { value: 'owner', label: 'Owner', sublabel: 'Full control over the workspace and billing' },
              { value: 'manager', label: 'Manager', sublabel: 'Can dispatch riders and view analytics' },
              { value: 'staff', label: 'Staff', sublabel: 'Can create orders, but limited visibility' }
            ]}
          />

          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} style={{ marginTop: '8px' }}>
            Create workspace
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link to="/login" style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Already have a workspace? <span style={{ color: 'var(--accent-text)' }}>Sign in</span>
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
