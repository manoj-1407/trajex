import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageCircle, MapPin } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import usePageTitle from '../hooks/usePageTitle';

export default function Contact() {
  usePageTitle('Contact Sales');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1000);
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Topbar for public pages */}
      <nav className="glass" style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '64px', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
             <path d="M12 4H6v4h6v20h4V8h16V4H12z M16 4c0 0 8 0 12 12" fill="var(--accent)"/>
          </svg>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>Trajex</span>
        </div>
      </nav>

      <div style={{ flex: 1, padding: '120px 24px 64px', maxWidth: '1000px', margin: '0 auto', width: '100%', display: 'flex', gap: '48px', alignItems: 'flex-start' }} className="flex-col-mobile">
        <div className="fade-in-up" style={{ flex: '1 1 40%' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: 'var(--radius-full)', fontSize: '13px', fontWeight: 600, marginBottom: '24px' }}>
            Get in touch
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, marginBottom: '24px', lineHeight: 1.2, color: 'var(--text-primary)' }}>
            Let's talk about your fleet.
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '48px', lineHeight: 1.6 }}>
            Whether you have questions about deployment, integration, or self-hosting, our team is here to help you get Trajex running.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Mail size={20} color="var(--accent)" /></div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Email us</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>manojkumar148700@gmail.com</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><MessageCircle size={20} color="var(--accent)" /></div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Community Discord</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Join 1,200+ fleet owners</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>GitHub</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}><a href="https://github.com/manoj-1407" target="_blank" rel="noreferrer" style={{color: 'var(--accent-text)'}}>@manoj-1407</a></div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card fade-in-up" style={{ flex: '1 1 60%', padding: '40px', animationDelay: '100ms' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--success-dim)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Mail size={32} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>Message sent!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>We'll get back to you within 24 hours.</p>
              <Button onClick={() => setSuccess(false)}>Send another message</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Send us a message</h2>
              <div style={{ display: 'flex', gap: '20px' }} className="flex-col-mobile">
                <Input label="First Name" required />
                <Input label="Last Name" required />
              </div>
              <Input label="Work Email" type="email" required />
              <Input label="Organization Name" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '16px' }}>How can we help?</label>
                <textarea required style={{ 
                  borderRadius: 'var(--radius-md)', padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', minHeight: '120px', resize: 'vertical', outline: 'none', fontFamily: 'inherit'
                }} />
              </div>
              <Button type="submit" size="lg" loading={loading} style={{ marginTop: '12px' }}>Send Message</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
