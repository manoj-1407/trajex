import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_TITLES = {
  '/dashboard': 'Dashboard',
  '/orders': 'Orders',
  '/riders': 'Riders',
  '/live-map': 'Live Map',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
  '/my-deliveries': 'My Deliveries',
  '/onboarding': 'Onboarding',
};

export default function usePageTitle() {
  const { pathname } = useLocation();

  const title = useMemo(() => {
    return ROUTE_TITLES[pathname] || pathname.split('/').filter(Boolean).map(
      s => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')
    ).join(' — ') || 'Dashboard';
  }, [pathname]);

  useEffect(() => {
    document.title = title ? `${title} — Trajex` : 'Trajex';
    return () => { document.title = 'Trajex'; };
  }, [title]);

  return title;
}
