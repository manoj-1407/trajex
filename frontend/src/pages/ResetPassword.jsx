import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, LogIn, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import api from '../api/client';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pScore = Math.min(Math.floor(password.length / 3), 4);
  const scoreColor = ['var(--bg-elevated)', 'var(--danger)', 'var(--warning)', 'var(--success)', 'var(--success)'][pScore] || 'var(--bg-elevated)';

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', maxWidth: '440px' }}>
          <h1 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '16px' }}>Invalid link</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password"><Button>Request new link</Button></Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirm) return setError('Passwords do not match');

    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)' }}>
      <div className="glass-card fade-in-up" style={{ width: '100%', maxWidth: '440px', padding: '48px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>Set new password</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Please enter your new 8+ character password below.</p>
        </div>
        
        {error && (
          <div style={{ background: 'var(--danger-dim)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              leftIcon={Lock}
              disabled={loading}
            />
            {password && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                {[1,2,3,4].map(n => (
                  <div key={n} style={{ flex: 1, height: '4px', borderRadius: '2px', background: n <= pScore ? scoreColor : 'var(--bg-elevated)', transition: 'background 0.3s' }} />
                ))}
              </div>
            )}
          </div>
          
          <Input
            label="Confirm Password"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            leftIcon={Lock}
            disabled={loading}
          />
          
          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} style={{ marginTop: '8px' }}>
            Reset password
          </Button>
        </form>
      </div>
    </div>
  );
}
