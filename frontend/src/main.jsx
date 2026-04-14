import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './styles/globals.css'

const getToastStyle = () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    background: isDark ? 'var(--bg-elevated)' : 'var(--bg-surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)'
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: getToastStyle(),
            duration: 4000,
            success: {
              style: { borderLeft: '4px solid var(--success)' },
              iconTheme: { primary: 'var(--success)', secondary: '#fff' }
            },
            error: {
              style: { borderLeft: '4px solid var(--danger)' },
              iconTheme: { primary: 'var(--danger)', secondary: '#fff' }
            }
          }} 
        />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
