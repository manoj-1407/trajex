import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, var(--bg-elevated) 0%, var(--bg) 100%)',
      padding: '24px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: '10%', left: '20%', width: '300px', height: '300px', background: 'var(--accent)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: '300px', height: '300px', background: 'var(--secondary, #3b82f6)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%' }} />

      <div className="glass-strong fade-in-up" style={{ 
        padding: '56px 40px', 
        borderRadius: 'var(--radius-xl)', 
        maxWidth: '500px', 
        width: '100%',
        position: 'relative',
        zIndex: 1,
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        <div style={{ 
          fontSize: '120px', 
          fontWeight: 900, 
          fontFamily: 'var(--font-mono)',
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--secondary, #3b82f6) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
          marginBottom: '24px',
          textShadow: '0 0 40px rgba(0, 229, 204, 0.2)'
        }}>
          404
        </div>
        
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '-0.02em' }}>
          Page not found
        </h1>
        
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: 1.6 }}>
          The page you are looking for doesn't exist, has been moved, or you don't have access.
        </p>
        
        <Link to="/" style={{ textDecoration: 'none', display: 'block' }}>
          <Button size="lg" icon={<ArrowLeft />} fullWidth>
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
