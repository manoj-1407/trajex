import { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../api/client';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export function AuthSplitLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <div 
        className="auth-left desktop-only"
        data-theme="dark"
        style={{
          flex: '0 0 55%', background: 'var(--bg)', position: 'relative',
          display: 'flex', flexDirection: 'column', color: 'var(--text-primary)', padding: '48px',
          overflow: 'hidden'
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 1024px) { .desktop-only { display: none !important; } .auth-right { flex: 1 !important; } }
          .grid-bg {
            position: absolute; inset: 0; opacity: 0.1;
            background-size: 40px 40px;
            background-image: linear-gradient(to right, var(--accent) 1px, transparent 1px), linear-gradient(to bottom, var(--accent) 1px, transparent 1px);
            mask-image: radial-gradient(ellipse at center, black 0%, transparent 80%);
            -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 80%);
          }
        `}} />
        <div className="grid-bg" />
        
        <Link to="/" style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
             <path d="M12 4H6v4h6v20h4V8h16V4H12z M16 4c0 0 8 0 12 12" fill="var(--accent)"/>
          </svg>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>Trajex</span>
        </Link>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 10, maxWidth: '480px' }}>
          <h2 style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.1, marginBottom: '16px' }}>Every delivery,<br/>on track.</h2>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
            The dispatch platform that keeps your fleet moving and your customers happy.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><CheckCircle size={18} color="var(--accent)" /> <span>Smart order assignment</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><CheckCircle size={18} color="var(--accent)" /> <span>Real-time GPS tracking</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><CheckCircle size={18} color="var(--accent)" /> <span>Automated customer updates</span></div>
        </div>
      </div>

      <div 
        className="auth-right"
        style={{
          flex: '0 0 45%', background: 'var(--bg-surface)', 
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '48px 24px'
        }}
      >
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Mobile Logo */}
          <Link to="/" className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '48px', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
               <path d="M12 4H6v4h6v20h4V8h16V4H12z M16 4c0 0 8 0 12 12" fill="var(--accent)"/>
            </svg>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Trajex</span>
          </Link>
          <style dangerouslySetInnerHTML={{__html: `@media (min-width: 1025px) { .mobile-only { display: none !important; } }`}} />
          
          {children}
        </div>
      </div>
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

  useEffect(() => {
    // Ensure we have a CSRF token before login attempt
    api.get('/health').catch(() => {});
  }, []);

  if (isAuthenticated) return <Navigate to="/dashboard" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError('Email and password required');
    
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.accessToken) {
        setAuth(res.data.accessToken, res.data.user);
        // Navigate happens via App.jsx protected route redirect naturally
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="fade-in-up">
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Welcome back</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Sign in to your dispatch workspace</p>

        {error && (
          <div style={{ background: 'var(--danger-dim)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            leftIcon={Mail}
            disabled={loading}
          />
          <div>
            <Input 
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              leftIcon={Lock}
              disabled={loading}
            />
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--accent-text)', fontWeight: 500 }}>Forgot password?</Link>
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} style={{ marginTop: '8px' }}>
            Sign in
          </Button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '32px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <div style={{ padding: '0 16px', fontSize: '12px', color: 'var(--text-muted)' }}>or</div>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link to="/register" style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            New to Trajex? <span style={{ color: 'var(--accent-text)' }}>Create workspace →</span>
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
