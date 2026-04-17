import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import CommandPalette, { usePalette } from './CommandPalette';
import NotificationPanel from './NotificationPanel';
import usePageTitle from '../hooks/usePageTitle';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const title = usePageTitle();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar 
        onMenuOpen={() => setSidebarOpen(true)} 
        pageTitle={title}
        onNotificationClick={() => setNotifOpen(true)}
        unreadCount={0} // Ideally pulled from context/store
      />
      <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      
      <main className="layout-main" key={location.pathname} style={{
        flex: 1,
        padding: '24px',
        paddingTop: 'calc(var(--topbar-height, 64px) + 24px)',
        paddingBottom: 'calc(var(--bottom-nav-height, 64px) + 24px + env(safe-area-inset-bottom, 0px))',
        marginLeft: '240px',
        transition: 'margin var(--transition-base), padding var(--transition-base)'
      }}>
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 1023px) {
            .layout-main { 
              margin-left: 0 !important; 
              padding: 16px !important; 
              padding-top: calc(var(--topbar-height, 64px) + 16px) !important; 
              padding-bottom: calc(var(--bottom-nav-height, 64px) + 16px + env(safe-area-inset-bottom, 0px)) !important; 
            }
          }
        `}} />
        <div className="container">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
