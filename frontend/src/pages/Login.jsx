import { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock, CheckCircle, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import api from '../api/client';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export function AuthSplitLayout({ children, title, subtitle }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'var(--bg)' }}>
      <div 
        className="auth-sidebar"
        style={{
          flex: '0 0 45%', background: 'var(--bg-surface)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', padding: '60px', position: 'relative', overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)', filter: 'blur(80px)', opacity: 0.5 }} />
        
        <Link to="/" style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '80px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Smartphone size={18} color="var(--bg-surface)" fill="currentColor" />
          </div>
          <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Trajex</span>
        </Link>

        <div style={{ flex: 1, position: 'relative', zIndex: 10 }}>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.04em' }}
          >
            {title || "Precision Logistics Engine."}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '400px' }}
          >
            {subtitle || "The command center for your entire fleet. Real-time telemetry, automated dispatch, and total organizational control."}
          </motion.p>
        </div>

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '20px' }}>
           {[
             'Sub-50ms Event Propagation',
             'Encrypted Organization RLS',
             'Advanced Rider Telemetry'
           ].map((text, i) => (
             <motion.div 
               key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + (i * 0.1) }}
               style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}
             >
               <CheckCircle size={18} color="var(--accent)" /> {text}
             </motion.div>
           ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {children}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          .auth-sidebar { display: none !important; }
        }
      `}} />
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const setAuth = useAuthStore(s => s.setAuth);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  if (isAuthenticated) return <Navigate to="/dashboard" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.accessToken, res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication sequence failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // In a production environment, this would redirect to the Google OAuth consent screen
    // or trigger the Google Identity Services popup.
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/auth/google/init`;
  };

  return (
    <AuthSplitLayout title="Fleet Management Portal." subtitle="Enter your credentials to access your organization's delivery dashboard.">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card glass-stack" style={{ padding: '48px', borderRadius: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 850, marginBottom: '8px', letterSpacing: '-0.03em' }}>Welcome back</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>Sign in to your private workspace.</p>

        {error && (
          <div style={{ background: 'var(--danger-dim)', color: 'var(--danger)', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', marginBottom: '24px', border: '1px solid var(--danger-dim)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} leftIcon={Mail} disabled={loading} placeholder="name@company.com" />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Key</label>
              <Link to="/forgot-password" style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700 }}>Recovery Required?</Link>
            </div>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} leftIcon={Lock} disabled={loading} placeholder="••••••••" hideLabel />
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            Sign In
          </Button>
        </form>

        <div style={{ position: 'relative', margin: '32px 0', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ position: 'relative', background: 'var(--bg-surface)', padding: '0 16px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>MNC Identity Sync</span>
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

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link to="/register" style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            New to the network? <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Deploy your agency →</span>
          </Link>
        </div>
      </motion.div>
    </AuthSplitLayout>
  );
}
