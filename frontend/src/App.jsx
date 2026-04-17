import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import useThemeStore from './store/useThemeStore';
import api from './api/client';
import ErrorBoundary from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// Components
import Layout from './components/Layout';
import CommandPalette from './components/CommandPalette';
import OnboardingTour from './components/OnboardingTour';
import { SocketProvider } from './hooks/SocketProvider';
import { AnimatePresence } from 'framer-motion';

// Async Imports (Code Splitting)
const Landing = React.lazy(() => import('./pages/Landing'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const CustomerTracking = React.lazy(() => import('./pages/CustomerTracking'));
const Contact = React.lazy(() => import('./pages/Contact'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Protected Pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Orders = React.lazy(() => import('./pages/Orders'));
const Riders = React.lazy(() => import('./pages/Riders'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const LiveMap = React.lazy(() => import('./pages/LiveMap'));
const MyDeliveries = React.lazy(() => import('./pages/MyDeliveries'));
const RiderView = React.lazy(() => import('./pages/RiderView'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));

function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore(state => ({ 
    isAuthenticated: state.isAuthenticated, 
    user: state.user 
  }));
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" />;

  // Force redirection to settings if password change is mandatory
  if (user?.mustChangePassword && location.pathname !== '/settings') {
    return <Navigate to="/settings?force_password_change=true" />;
  }

  return children;
}

function RoleRoute({ children, allowedRoles }) {
  const user = useAuthStore(state => state.user);
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
}

export default function App() {
  useThemeStore(state => state.theme);
  const location = useLocation();
  const setAuth = useAuthStore(state => state.setAuth);
  const logout = useAuthStore(state => state.logout);
  const [isHydrating, setIsHydrating] = React.useState(true);

  React.useEffect(() => {
    async function hydrate() {
      try {
        // Silent refresh to restore session from HttpOnly cookie on boot
        const { data } = await api.post('/auth/refresh');
        if (data?.accessToken) {
          const me = await api.get('/auth/me');
          if (me.data?.user) {
            setAuth(data.accessToken, me.data.user);
          } else {
            throw new Error('User Profile Failure');
          }
        } else {
          throw new Error('Session Refresh Failure');
        }
      } catch (err) {
        // If refresh fails, we are just logged out (no error shown to user as it's a silent boot check)
        logout();
      } finally {
        setIsHydrating(false);
      }
    }
    hydrate();
  }, [setAuth, logout]);

  if (isHydrating) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <Loader2 className="animate-spin text-brand" size={40} color="var(--brand)" />
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Initializing Trajex...</span>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <SocketProvider>
      <Suspense fallback={<div className="flex-center" style={{ minHeight: '100vh' }}><div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '50%' }} /></div>}>
      <CommandPalette />
      <OnboardingTour />
      <AnimatePresence mode="wait">
        <div key={location.pathname} style={{ overflowX: 'hidden' }}>
          <Routes location={location}>
            {/* Public Routes */}
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/track/:token" element={<CustomerTracking />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

            {/* Special App Routes */}
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            
            {/* Main App Layout Routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="riders" element={<RoleRoute allowedRoles={['owner', 'manager']}><Riders /></RoleRoute>} />
              <Route path="analytics" element={<RoleRoute allowedRoles={['owner', 'manager']}><Analytics /></RoleRoute>} />
              <Route path="live-map" element={<LiveMap />} />
              <Route path="my-deliveries" element={<MyDeliveries />} />
              <Route path="rider-view" element={<RiderView />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </AnimatePresence>
      </Suspense>
      </SocketProvider>
    </ErrorBoundary>
  );
}
