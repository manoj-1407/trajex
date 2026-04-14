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
  const palette = usePalette();
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
      <CommandPalette isOpen={palette.isOpen} onClose={palette.close} />
      <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      
      <main className="layout-main page-enter" key={location.pathname} style={{
        flex: 1,
        padding: '24px',
        paddingTop: 'calc(56px + 24px)', // topbar height + padding
        paddingBottom: 'calc(56px + 24px + env(safe-area-inset-bottom, 8px))', // bottom nav buffer
        marginLeft: '240px', // desktop sidebar width
        transition: 'margin 200ms ease'
      }}>
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 767px) {
            .layout-main { margin-left: 0 !important; padding: 16px !important; padding-top: calc(56px + 16px) !important; }
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
