import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, Zap, Map, Clock, Smartphone, 
  Users, Package, ChevronDown, Monitor, Share2, 
  ShieldCheck, Globe, Activity 
} from 'lucide-react';
import useThemeStore from '../store/useThemeStore';
import ThemeToggle from '../components/ThemeToggle';

function AmbientBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute', top: '-10%', left: '-5%', width: '60%', height: '60%',
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          filter: 'blur(120px)', opacity: 0.2
        }}
      />
    </div>
  );
}

export default function Landing() {
  const { theme } = useThemeStore();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'var(--font-ui)', transition: 'background 0.5s ease' }}>
      
      <AmbientBackground />

      {/* Navbar */}
      <nav className="glass" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '80px', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 min(5vw, 80px)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px var(--accent-glow)' }}>
            <Zap size={20} color="var(--bg-surface)" fill="currentColor" />
          </div>
          <span style={{ fontSize: '24px', fontWeight: 850, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Trajex</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div className="desktop-only" style={{ display: 'flex', gap: '24px' }}>
             <a href="#features" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Solutions</a>
             <a href="https://github.com/manoj-1407/trajex" target="_blank" rel="noreferrer" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Archive</a>
          </div>
          <div style={{ height: '24px', width: '1px', background: 'var(--border)', margin: '0 8px' }} />
          <ThemeToggle />
          <Link to="/login" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>Sign in</Link>
          <Link to="/register" className="glass-stack" style={{ textDecoration: 'none', padding: '12px 24px', background: 'var(--brand)', color: 'var(--bg-surface)', fontSize: '14px', fontWeight: 700, borderRadius: '12px', boxShadow: '0 10px 20px -5px var(--accent-glow)' }}>Deploy Now</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ 
        position: 'relative', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 min(5vw, 80px)', 
        paddingTop: '80px', 
        overflow: 'hidden' 
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', 
          gap: 'clamp(32px, 5vw, 80px)', 
          alignItems: 'center', 
          width: '100%', 
          zIndex: 1 
        }}>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'var(--accent-dim)', borderRadius: '999px', fontSize: '12px', fontWeight: 700, color: 'var(--accent)', marginBottom: '32px', border: '1px solid var(--accent-glow)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <Activity size={14} /> Fleet Operational — v1.2.5
            </div>
            
            <h1 style={{ fontSize: 'clamp(40px, 8vw, 84px)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.05em', marginBottom: '32px' }}>
              Professional Fleet <br/>
              <span className="text-gradient" style={{ filter: 'drop-shadow(0 0 30px var(--accent-glow))' }}>Logistics Platform.</span>
            </h1>
            
            <p style={{ fontSize: 'clamp(18px, 2vw, 22px)', color: 'var(--text-secondary)', marginBottom: '48px', lineHeight: 1.5, maxWidth: '640px', fontWeight: 450 }}>
              The high-performance solution for field logistics and delivery tracking. 
              Real-time synchronization, automated routing, and enterprise organizational security.
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <Link to="/register" className="glass-stack" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', padding: 'min(5vw, 20px) min(10vw, 40px)', background: 'var(--brand)', color: 'var(--bg-surface)', fontSize: '18px', fontWeight: 700, borderRadius: '16px' }}>
                Join the Network <ArrowRight size={20} />
              </Link>
              <a href="#features" className="glass" style={{ textDecoration: 'none', padding: 'min(5vw, 20px) min(10vw, 36px)', color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600, borderRadius: '16px' }}>
                View Solutions
              </a>
            </div>
          </motion.div>
 
          <motion.div 
            className="desktop-only"
            initial={{ opacity: 0, scale: 0.95 }} 
            whileInView={{ opacity: 1, scale: 1 }} 
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
          >
             <div className="glass-card glass-stack" style={{ padding: '8px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
                <img 
                  src="/dashboard_preview.png" 
                  alt="Trajex Interface" 
                  style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '18px', filter: theme === 'midnight' ? 'brightness(1.2) contrast(1.1)' : 'none' }} 
                />
             </div>
          </motion.div>
        </div>
 
        <motion.div 
          style={{ opacity, position: 'absolute', bottom: '40px', left: '50%', x: '-50%', color: 'var(--text-muted)' }} 
          animate={{ y: [0, 10, 0] }} 
          transition={{ repeat: Infinity, duration: 2 }}
        >
           <ChevronDown size={32} />
        </motion.div>
      </header>

      {/* Feature Grid */}
      <section id="features" style={{ padding: '160px min(5vw, 80px)', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '120px' }}>
           <h2 style={{ fontSize: '56px', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '24px' }}>Core Capabilities.</h2>
           <p style={{ fontSize: '22px', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto' }}>Reliable tools for organizations that prioritize operational efficiency.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '32px', maxWidth: '1400px', margin: '0 auto' }}>
          {[
            { icon: Globe, title: 'Network Distribution', text: 'Optimized routing nodes ensure low-latency data sync for your fleet, across any geography.', color: 'var(--brand)' },
            { icon: ShieldCheck, title: 'Data Sovereignty', text: 'Enterprise-grade security and encrypted audit trails keep your operational data private.', color: 'var(--success)' },
            { icon: Zap, title: 'Logistics Intelligence', text: 'Our assignment system optimizes field movements in real-time to maximize efficiency.', color: 'var(--warning)' },
            { icon: Map, title: 'Operational Interface', text: 'Precision live tracking with smooth movement pathing and visual trip histories.', color: 'var(--accent)' },
            { icon: Smartphone, title: 'Rider Interface', text: 'Field teams connect via a high-performance web app. No complex setup required.', color: 'var(--info)' },
            { icon: Share2, title: 'Integrations', text: 'Robust API and webhook support to connect Trajex with your existing business tools.', color: 'var(--danger)' },
          ].map((f, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -5, scale: 1.02 }}
              className="glass-card glass-stack" 
              style={{ padding: '48px', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--bg-elevated)', border: `1px solid ${f.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
                <f.icon size={28} color={f.color} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '16px' }}>{f.title}</h3>
              <p style={{ fontSize: '17px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final Call */}
      <section style={{ padding: '140px min(5vw, 80px)', background: 'var(--bg-elevated)', textAlign: 'center' }}>
         <h2 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '48px', letterSpacing: '-0.03em' }}>Ready to optimize your fleet?</h2>
         <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="glass-stack" style={{ textDecoration: 'none', padding: '20px 60px', background: 'var(--brand)', color: 'var(--bg-surface)', fontSize: '20px', fontWeight: 700, borderRadius: '16px' }}>Create Account</Link>
            <Link to="/login" className="glass" style={{ textDecoration: 'none', padding: '20px 60px', color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, borderRadius: '16px' }}>Login</Link>
         </div>
      </section>

      <footer style={{ padding: '100px min(5vw, 80px)', background: 'var(--bg)', borderTop: '1px solid var(--border-subtle)' }}>
         <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '64px' }}>
            <div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                  <Zap size={28} color="var(--brand)" />
                  <span style={{ fontSize: '24px', fontWeight: 900 }}>Trajex</span>
               </div>
               <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '320px', lineHeight: 1.6 }}>A high-performance logistics management platform. Secured by RLS, built for reliability.</p>
            </div>
            <div style={{ display: 'flex', gap: '100px' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Operations</h4>
                  <Link to="/login" style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Dashboard</Link>
                  <Link to="/riders" style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Fleet Status</Link>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Platform</h4>
                  <Link to="/privacy" style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Privacy Policy</Link>
                  <Link to="/privacy" style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Security Standards</Link>
               </div>
            </div>
         </div>
         <div style={{ maxWidth: '1400px', margin: '64px auto 0', padding: '32px 0 0', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '14px' }}>
            © 2026 Trajex India. Professional Logistics Systems.
         </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .text-gradient {
          background: linear-gradient(135deg, var(--brand) 0%, var(--info) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @media (max-width: 1024px) {
          .desktop-only { display: none !important; }
          header { text-align: center; }
          header > div { grid-template-columns: 1fr !important; }
          header > div > div { display: flex; flex-direction: column; align-items: center; }
        }
      `}} />
    </div>
  );
}
