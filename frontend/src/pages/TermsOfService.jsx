import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const navigate = useNavigate();
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text-primary)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative gradient blobs */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', background: 'var(--accent)', filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%' }} />
      
      <nav className="glass" style={{ padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path d="M12 4H6v4h6v20h4V8h16V4H12z M16 4c0 0 8 0 12 12" fill="var(--accent)"/></svg>
          <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>Trajex</span>
        </div>
      </nav>

      <div className="fade-in-up" style={{ maxWidth: '800px', margin: '48px auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div className="glass-strong" style={{ padding: '48px', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          <h1 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '8px', background: 'linear-gradient(135deg, white 0%, var(--text-muted) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Terms of Service
          </h1>
          <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '48px' }}>
            Effective Date: January 1, 2024
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>1. Acceptance of Terms</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                By accessing and using Trajex, you accept and agree to be bound by the terms and provision of this agreement. Any participation in this service will constitute acceptance of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>
            
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>2. Provision of Services</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Trajex is provided "as is" and "as available". We reserve the right to modify, suspend, or discontinue the service with or without notice. We provide logistics tracking using open protocols and assume no liability for the physical delivery of packages.
              </p>
            </section>
            
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>3. Fair Use Policy</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                You agree not to misuse our API endpoints or attempt to circumvent tenant isolation rules. Excessive, automated crawling or injection of malicious data into the application will result in immediate workspace termination.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>4. Account Security</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                You are strictly responsible for maintaining the confidentiality of your workspace credentials. All actions performed inside your workspace are the liability of the workspace owner.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
