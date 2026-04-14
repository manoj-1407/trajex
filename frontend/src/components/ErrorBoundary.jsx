import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './ui/Button';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-primary)', padding: '24px' }}>
          <AlertTriangle size={64} className="text-danger" color="var(--danger)" style={{ marginBottom: '24px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>Something went wrong.</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '400px', textAlign: 'center' }}>
            We're sorry, an unexpected error has occurred. Our team has been notified.
          </p>
          <Button onClick={() => window.location.reload()} size="lg">Reload Page</Button>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{ marginTop: '32px', background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', maxWidth: '800px', overflowX: 'auto', fontSize: '13px', color: 'var(--danger)' }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
