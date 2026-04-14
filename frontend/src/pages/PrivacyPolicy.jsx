import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text-primary)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative gradient blob */}
      <div style={{ position: 'absolute', top: '10%', left: '-5%', width: '400px', height: '400px', background: 'var(--secondary, #3b82f6)', filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%' }} />

      <nav className="glass" style={{ padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path d="M12 4H6v4h6v20h4V8h16V4H12z M16 4c0 0 8 0 12 12" fill="var(--accent)"/></svg>
          <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>Trajex</span>
        </div>
      </nav>

      <div className="fade-in-up" style={{ maxWidth: '800px', margin: '48px auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div className="glass-strong" style={{ padding: '48px', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          <h1 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '8px', background: 'linear-gradient(135deg, white 0%, var(--text-muted) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Privacy Policy
          </h1>
          <p style={{ color: 'var(--secondary, #3b82f6)', fontWeight: 600, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '48px' }}>
            Effective Date: January 1, 2024
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>1. Information We Collect</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                We collect essential metadata required to operate the Trajex dispatch platform. This includes email addresses for authentication, real-time geolocation of active fleet members, and delivery metadata. We utilize localStorage to securely persist tokens on your device.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>2. How We Use Data</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                We use the data we collect solely to provide and improve the dispatch experience. We do not sell your personal data to third parties, nor do we employ behavioral tracking for third-party advertising. Real-time locations are transmitted only to authenticated workspace members.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>3. Enterprise Architecture & Isolation</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                To ensure maximum data protection, the Trajex backend utilizes Row-Level Security (RLS) on PostgreSQL. Operations are strictly filtered to ensure absolute tenant data isolation. A user from one workspace cannot programmatically access another's data.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>4. Third-Party Routing</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                We may utilize anonymous location coordinates to calculate transit paths via services such as OSRM (Open Source Routing Machine). No Personally Identifiable Information (PII) is transmitted alongside these calculation vectors.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
