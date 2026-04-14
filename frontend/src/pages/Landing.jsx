import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Zap, Map, Navigation, MessageCircle, Clock, Smartphone, UserPlus, Users, Package, ChevronDown, Monitor, Share2, ShieldCheck } from 'lucide-react';

export default function Landing() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener('resize', setSize);

    const particles = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 1.5 + 0.5,
      a: Math.random() * 0.3 + 0.1
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 204, ${p.a})`;
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div data-theme="dark" style={{ background: 'var(--bg)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'var(--font-ui)', overflowX: 'hidden' }}>
      
      {/* Dynamic Background */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.6 }} />

      {/* Navbar */}
      <nav className="glass" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '72px', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 min(5vw, 80px)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="var(--bg-surface)" fill="currentColor" />
          </div>
          <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Trajex</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link to="/login" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Sign in</Link>
          <Link to="/register" className="button-glow" style={{ textDecoration: 'none', padding: '10px 20px', background: 'var(--brand)', color: 'var(--bg-surface)', fontSize: '14px', fontWeight: 700, borderRadius: '10px' }}>Get started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '0 min(5vw, 80px)', paddingTop: '72px' }}>
        <div className="grid-hero" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '64px', alignItems: 'center', width: '100%' }}>
          
          <div className="fade-in-up" style={{ zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'var(--info-dim)', borderRadius: '999px', fontSize: '13px', fontWeight: 600, color: 'var(--info)', marginBottom: '32px', border: '1px solid var(--info-subtle)' }}>
              <Monitor size={14} /> Open Source Dispatch v1.0
            </div>
            
            <h1 style={{ fontSize: 'clamp(44px, 5vw, 72px)', fontWeight: 850, lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: '28px' }}>
              Modern logistics for <span className="text-gradient">every business.</span>
            </h1>
            
            <p style={{ fontSize: '20px', color: 'var(--text-secondary)', marginBottom: '44px', lineHeight: 1.6, maxWidth: '580px' }}>
              Automate your last-mile delivery with real-time tracking, smart driver assignment, and deep analytics. 
              <span style={{ display: 'block', marginTop: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>Pro-grade infrastructure, completely free and self-hosted.</span>
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/register" className="button-glow" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '18px 36px', background: 'var(--brand)', color: 'var(--bg-surface)', fontSize: '16px', fontWeight: 700, borderRadius: '14px' }}>
                Start your workspace <ArrowRight size={18} />
              </Link>
              <a href="#features" style={{ textDecoration: 'none', padding: '18px 32px', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>
                Explore features
              </a>
            </div>
          </div>

          <div className="fade-in-up" style={{ animationDelay: '200ms', position: 'relative' }}>
             <div className="glass-card" style={{ padding: '4px', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                <img 
                  src="/dashboard_preview.png" 
                  alt="Trajex Dashboard" 
                  style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '16px' }} 
                />
             </div>
             {/* Floating elements for depth */}
             <div className="glass floating" style={{ position: 'absolute', top: '10%', right: '-5%', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 2 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} className="pulse" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Live Tracking Active</span>
             </div>
             <div className="glass floating-reverse" style={{ position: 'absolute', bottom: '15%', left: '-8%', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--info)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 2 }}>
                <Package size={16} color="var(--info)" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Optimized Route Found</span>
             </div>
          </div>

        </div>

        <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', color: 'var(--text-muted)', animation: 'float 2s ease-in-out infinite' }}>
           <ChevronDown size={28} />
        </div>
      </header>

      {/* Trust / Stats Section */}
      <section style={{ padding: '100px min(5vw, 80px)', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px', maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Built for Privacy</h3>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>End-to-end audit logs and multi-tenant isolation out of the box.</p>
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--info)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Lightning Fast</h3>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Real-time updates via WebSockets and optimized PostgreSQL RLS.</p>
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Zero Friction</h3>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>No app stores needed. Clean PWA for riders and web UI for you.</p>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" style={{ padding: '160px min(5vw, 80px)', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '100px' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 850, letterSpacing: '-0.03em', marginBottom: '20px' }}>Powerful features, simple logic.</h2>
          <p style={{ fontSize: '20px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>Everything you need to run a high-performance delivery fleet.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px' }}>
          {[
            { icon: Map, title: 'Smart Live Dispatch', text: 'Monitor your entire fleet on a high-precision live map. See status transitions in real-time as they happen.', color: 'var(--accent)' },
            { icon: Zap, title: 'Intelligent Assignment', text: 'Leverage our scoring engine to assign orders based on distance, reliability, and current workload auto-magically.', color: 'var(--brand)' },
            { icon: Share2, title: 'One-Click Tracking', text: 'Share tracking links via WhatsApp or SMS. Customers track their deliveries without downloading any app.', color: 'var(--info)' },
            { icon: ShieldCheck, title: 'Audit & Compliance', text: 'Professional-grade audit logs and role-based access control (RBAC) ensure your operations remain secure.', color: 'var(--success)' },
            { icon: Clock, title: 'Dynamic SLA Engine', text: 'Define custom SLA windows per business or per order. Stay ahead of delays with proactive system alerts.', color: 'var(--warning)' },
            { icon: Smartphone, title: 'Rider PWA Experience', text: 'Clean, high-performance web app for riders with real-time location streaming and delivery evidence.', color: 'var(--danger)' },
          ].map((f, i) => (
            <div key={i} className="glass-card hover-lift" style={{ padding: '40px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-elevated)', border: `1px solid ${f.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <f.icon size={24} color={f.color} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px' }}>{f.title}</h3>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integration Bar */}
      <section style={{ padding: '120px min(5vw, 80px)', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h2 style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '48px' }}>Ready to deploy?</h2>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
               <Link to="/register" className="button-glow" style={{ textDecoration: 'none', padding: '18px 48px', background: 'var(--brand)', color: 'var(--bg-surface)', fontSize: '18px', fontWeight: 700, borderRadius: '14px' }}>Create Workspace</Link>
               <a href="https://github.com" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', padding: '18px 48px', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: '18px', fontWeight: 700, borderRadius: '14px' }}>View Source</a>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '80px min(5vw, 80px)', background: 'var(--bg)' }}>
         <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '48px' }}>
            <div style={{ maxWidth: '300px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <Zap size={24} color="var(--brand)" />
                  <span style={{ fontSize: '20px', fontWeight: 800 }}>Trajex</span>
               </div>
               <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>The open-source logistics platform for modern delivery teams. Scale your business, not your overhead.</p>
            </div>
            
            <div style={{ display: 'flex', gap: '64px' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Platform</h4>
                  <Link to="/login" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
                  <Link to="/register" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Register</Link>
                  <Link to="/login" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Rider Login</Link>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Legal</h4>
                  <Link to="/terms" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</Link>
                  <Link to="/privacy" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</Link>
               </div>
            </div>
         </div>
         <div style={{ maxWidth: '1200px', margin: '48px auto 0', paddingTop: '32px', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '13px' }}>
            © 2026 Trajex Logistics Systems. MIT Licensed.
         </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .text-gradient {
          background: linear-gradient(135deg, var(--brand) 0%, var(--info) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .grid-hero { grid-template-columns: 1.1fr 0.9fr; }
        @media (max-width: 968px) {
          .grid-hero { grid-template-columns: 1fr; text-align: center; }
          .grid-hero div { display: flex; flex-direction: column; align-items: center; }
          header { padding-top: 120px; }
        }
        .button-glow {
          box-shadow: 0 0 20px rgba(0, 229, 204, 0.2);
          transition: all 0.3s ease;
        }
        .button-glow:hover {
          box-shadow: 0 0 35px rgba(0, 229, 204, 0.4);
          transform: translateY(-1px);
        }
        .floating {
          animation: floating 3s ease-in-out infinite;
        }
        .floating-reverse {
          animation: floating 3s ease-in-out infinite reverse;
        }
        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        .pulse {
          box-shadow: 0 0 0 rgba(0, 229, 204, 0.4);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(0, 229, 204, 0.6); }
          70% { box-shadow: 0 0 0 10px rgba(0, 229, 204, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 229, 204, 0); }
        }
      `}} />
    </div>
  );
}
