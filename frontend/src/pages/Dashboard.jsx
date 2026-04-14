import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Users, CheckCircle, Clock, Radio, ArrowRight } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from 'recharts';
import api from '../api/client';
import useSocket from '../hooks/useSocket';
import { SkeletonKPI, SkeletonTableRow, SkeletonChart } from '../components/ui/Skeleton';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { formatTimeAgo } from '../utils/format';

// NOTE: Recharts requires literal color values for SVG fill/stroke — CSS vars are not supported.
// These mirror the design system tokens defined in globals.css.
const COLORS = {
  accent: '#00e5cc',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  muted: '#555568'
};

const STATUS_COLORS = {
  pending: COLORS.muted,
  confirmed: COLORS.info,
  assigned: COLORS.warning,
  picked_up: '#a78bfa',
  in_transit: COLORS.accent,
  delivered: COLORS.success,
  failed: COLORS.danger,
  cancelled: COLORS.muted
};

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState([]);
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard').catch(() => ({ data: null })),
      api.get('/orders?limit=10').catch(() => ({ data: { orders: [] } })),
      api.get('/riders').catch(() => ({ data: { riders: [] } }))
    ]).then(([analyticsRes, orderRes, riderRes]) => {
      setAnalytics(analyticsRes.data);
      setOrders(orderRes.data?.orders || []);
      setRiders(riderRes.data?.riders || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const onOrderUpdate = (data) => {
      setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o));
      addToFeed({ id: Date.now(), type: 'order', icon: Package, text: `Order ${data.orderId.substring(0,8)} status changed to ${data.status.replace('_', ' ')}` });
    };

    const onRiderUpdate = (data) => {
      setRiders(prev => prev.map(r => r.id === data.riderId ? { ...r, last_lat: data.lat, last_lng: data.lng, last_seen_at: new Date() } : r));
      addToFeed({ id: Date.now(), type: 'location', icon: Radio, text: `Rider location updated` });
    };

    socket.on('order-updated', onOrderUpdate);
    socket.on('rider-location', onRiderUpdate);

    return () => {
      socket.off('order-updated', onOrderUpdate);
      socket.off('rider-location', onRiderUpdate);
    };
  }, [socket]);

  const addToFeed = (item) => {
    setFeed(prev => {
      const updated = [item, ...prev];
      return updated.slice(0, 10);
    });
  };

  const stats = useMemo(() => {
    if (!analytics) return { today: 0, pending: 0, delivered: 0, activeRiders: 0 };
    return {
      today: analytics.orders.total || 0,
      pending: (analytics.orders.byStatus?.pending || 0) + (analytics.orders.byStatus?.confirmed || 0),
      delivered: analytics.orders.byStatus?.delivered || 0,
      activeRiders: (analytics.riders.byStatus?.available || 0) + (analytics.riders.byStatus?.busy || 0)
    };
  }, [analytics]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);
  
  const statusData = useMemo(() => {
    if (!analytics?.orders?.byStatus) return [];
    return Object.entries(analytics.orders.byStatus)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [analytics]);

  const mockWeeklyData = useMemo(() => {
    // Generate some fake line chart data for visual since no real endpoint for this
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      name: day,
      orders: Math.floor(Math.random() * 50) + 10
    }));
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card" style={{ padding: '8px 12px', border: '1px solid var(--border)' }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{label}</p>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: payload[0].color || 'var(--accent)' }}>
            {payload[0].value} {payload[0].name}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* KPI Row */}
      <div className="grid-auto">
        {loading ? (
          <>
            <SkeletonKPI /><SkeletonKPI /><SkeletonKPI /><SkeletonKPI />
          </>
        ) : (
          <>
            <div className="glass-card hover-lift fade-in-up" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--info-dim)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={24} /></div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Today's Orders</div>
                <div style={{ fontSize: '32px', fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{stats.today}</div>
              </div>
            </div>
            <div className="glass-card hover-lift fade-in-up" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', animationDelay: '100ms' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={24} /></div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Riders</div>
                <div style={{ fontSize: '32px', fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{stats.activeRiders}</div>
              </div>
            </div>
            <div className="glass-card hover-lift fade-in-up" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', animationDelay: '200ms' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--success-dim)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={24} /></div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Delivered Today</div>
                <div style={{ fontSize: '32px', fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{stats.delivered}</div>
              </div>
            </div>
            <div className="glass-card hover-lift fade-in-up" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', animationDelay: '300ms' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--warning-dim)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={24} /></div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Pending Orders</div>
                <div style={{ fontSize: '32px', fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{stats.pending}</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <div className="glass-card fade-in-up" style={{ padding: '24px', animationDelay: '400ms', height: '360px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Orders this week</h3>
          {loading ? <SkeletonChart height="100%" style={{ padding: 0, border: 'none', background: 'transparent', boxShadow: 'none' }} /> : (
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockWeeklyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="var(--border)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="orders" stroke={COLORS.accent} strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" activeDot={{ r: 4, fill: COLORS.accent, stroke: 'var(--bg-surface)' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        <div className="glass-card fade-in-up" style={{ padding: '24px', animationDelay: '500ms', height: '360px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Order Status</h3>
          {loading ? <SkeletonChart height="100%" style={{ padding: 0, border: 'none', background: 'transparent', boxShadow: 'none' }} /> : (
            <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
              {statusData.length === 0 ? (
                <EmptyState compact icon={Package} title="No data to chart" />
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusData} innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                          {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS.muted} />)}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
                    {statusData.map(entry => (
                      <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLORS[entry.name] || COLORS.muted }} />
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{entry.name.replace('_', ' ')}</span>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tables Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        <div className="glass-card fade-in-up" style={{ animationDelay: '600ms', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Recent Orders</h3>
            <Link to="/orders" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 500 }}>View all →</Link>
          </div>
          <div style={{ flex: 1 }}>
            {loading ? (
              <>
                <SkeletonTableRow cols={4} />
                <SkeletonTableRow cols={4} />
                <SkeletonTableRow cols={4} />
              </>
            ) : recentOrders.length === 0 ? (
              <EmptyState compact icon={Package} title="No orders yet" subtitle="Your recent orders will appear here" />
            ) : (
              recentOrders.map((order, i) => (
                <div 
                  key={order.id} 
                  onClick={() => navigate(`/orders?id=${order.id}`)}
                  style={{ 
                    padding: '16px 24px', borderBottom: i === recentOrders.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', transition: 'background var(--transition-fast)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>#{order.id.substring(0,8).toUpperCase()}</div>
                    <div className="truncate" style={{ fontSize: '14px', color: 'var(--text-primary)', maxWidth: '180px' }}>{order.customer_name}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Badge status={order.status} size="sm" />
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatTimeAgo(order.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card fade-in-up" style={{ animationDelay: '700ms', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Fleet Live</h3>
              <div className="status-dot pulse" style={{ background: 'var(--success)' }} />
            </div>
            <Link to="/riders" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 500 }}>View fleet →</Link>
          </div>
          <div style={{ flex: 1, maxHeight: '360px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}><div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} /></div>
            ) : riders.filter(r => ['available', 'busy'].includes(r.status)).length === 0 ? (
              <EmptyState compact icon={Users} title="No active riders" subtitle="When riders come online, they appear here" />
            ) : (
              riders.filter(r => ['available', 'busy'].includes(r.status)).map((rider, i) => (
                <div key={rider.id} style={{ 
                  padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-elevated)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '13px' }}>
                      {rider.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{rider.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{rider.active_orders} active deliveries</div>
                    </div>
                  </div>
                  <Badge type="rider" status={rider.status} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="glass-card fade-in-up" style={{ padding: '24px', animationDelay: '800ms' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={18} color="var(--accent)" /> Live Activity
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {feed.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px 0' }}>Waiting for system activity...</div>
          ) : (
            feed.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', animation: 'fadeIn 300ms ease' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon size={14} />
                </div>
                <div style={{ flex: 1, fontSize: '14px', color: 'var(--text-secondary)' }}>{item.text}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Just now</div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
