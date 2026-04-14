import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, MailCheck, ArrowLeft } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import api from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setError('Email is required');
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)' }}>
      <div className="glass-card fade-in-up" style={{ width: '100%', maxWidth: '440px', padding: '48px 32px', textAlign: 'center' }}>
        {success ? (
          <>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--success-dim)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <MailCheck size={32} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>Check your inbox</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>We've sent a password reset link to <strong>{email}</strong></p>
            <Link to="/login">
              <Button fullWidth variant="secondary">Back to sign in</Button>
            </Link>
          </>
        ) : (
          <>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <KeyRound size={32} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>Reset your password</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Enter your email and we'll send you a link to reset your password.</p>
            
            {error && (
              <div style={{ background: 'var(--danger-dim)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '24px', textAlign: 'left' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                leftIcon={Mail}
                disabled={loading}
              />
              <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                Send reset link
              </Button>
            </form>

            <div style={{ marginTop: '32px' }}>
              <Link to="/login" style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                <ArrowLeft size={16} /> Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
