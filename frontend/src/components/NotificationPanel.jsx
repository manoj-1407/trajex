import { useState, useEffect } from 'react';
import { X, BellOff, Info, Clock, WifiOff, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import api from '../api/client';

export default function NotificationPanel({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.get('/notifications')
        .then(res => setNotifications(res.data?.notifications || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!socket) return;
    const handleNotif = (data) => {
      setNotifications(prev => [data, ...prev]);
    };
    socket.on('notification', handleNotif);
    return () => socket.off('notification', handleNotif);
  }, [socket]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({...n, isRead: true})));
    } catch(e) {}
  };

  const handleNotifClick = async (n) => {
    if (!n.isRead) {
      try {
        await api.patch(`/notifications/${n.id}/read`);
        setNotifications(prev => prev.map(x => x.id === n.id ? {...x, isRead: true} : x));
      } catch(e) {}
    }
    onClose();
    if (n.type === 'order_update' && n.data?.orderId) navigate(`/orders?id=${n.data.orderId}`);
    if (n.type === 'rider_offline' && n.data?.riderId) navigate(`/riders?id=${n.data.riderId}`);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'order_update': return <Info size={16} />;
      case 'sla_breach': return <Clock size={16} />;
      case 'rider_offline': return <WifiOff size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const getBg = (type) => {
    switch(type) {
      case 'order_update': return 'var(--info-dim)';
      case 'sla_breach': return 'var(--warning-dim)';
      case 'rider_offline': return 'var(--danger-dim)';
      default: return 'var(--bg-elevated)';
    }
  };

  const getColor = (type) => {
    switch(type) {
      case 'order_update': return 'var(--info)';
      case 'sla_breach': return 'var(--warning)';
      case 'rider_offline': return 'var(--danger)';
      default: return 'var(--text-secondary)';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <div 
        className="notif-backdrop"
        style={{ 
          position: 'fixed', inset: 0, background: 'var(--overlay)', 
          zIndex: 249, display: isOpen ? 'block' : 'none' 
        }} 
        onClick={onClose} 
      />
      <div 
        className="glass-strong"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '380px', maxWidth: '100vw',
          borderLeft: '1px solid var(--border)', zIndex: 250,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 250ms var(--transition-spring)',
          display: 'flex', flexDirection: 'column'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {notifications.length === 0 && !loading && (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <BellOff size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>All caught up</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>You don't have any new notifications.</div>
            </div>
          )}
          
          {loading && (
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
              <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
            </div>
          )}

          {!loading && notifications.map((n, i) => (
            <button
              key={n.id || i}
              onClick={() => handleNotifClick(n)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '16px', width: '100%',
                padding: '16px 24px', background: 'transparent',
                border: 'none', borderBottom: '1px solid var(--border-subtle)',
                textAlign: 'left', cursor: 'pointer', transition: 'background var(--transition-fast)',
                position: 'relative'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: getBg(n.type), color: getColor(n.type),
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {getIcon(n.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>{n.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '6px' }}>{n.message}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleTimeString()}</div>
              </div>
              {!n.isRead && (
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', marginTop: '8px', flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
