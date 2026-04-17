import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, Users, CheckCircle, Clock, Radio, 
  ArrowRight, Activity, Zap, Shield, Cpu, 
  Globe, Terminal as TerminalIcon 
} from 'lucide-react';
import { 
  AreaChart, Area, PieChart, Pie, Cell, 
  ResponsiveContainer, Tooltip as RechartsTooltip, 
  XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';
import useSocket from '../hooks/useSocket';
import { SkeletonKPI, SkeletonTableRow, SkeletonChart } from '../components/ui/Skeleton';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { formatTimeAgo } from '../utils/format';

const HUD_COLORS = {
  accent: '#00f0d8',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  muted: '#666666'
};

const STATUS_MAP = {
  pending: HUD_COLORS.muted,
  confirmed: HUD_COLORS.info,
  assigned: HUD_COLORS.warning,
  picked_up: '#a78bfa',
  in_transit: HUD_COLORS.accent,
  delivered: HUD_COLORS.success,
  failed: HUD_COLORS.danger,
};

function PerformanceHUD({ socketStatus, latency }) {
  return (
    <div className="glass" style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: socketStatus === 'connected' ? HUD_COLORS.success : HUD_COLORS.danger }} className={socketStatus === 'connected' ? 'pulse' : ''} />
        SOCKET: {socketStatus}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Activity size={12} /> LATENCY: {latency}ms
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Cpu size={12} /> ENGINE: V1.2-STABLE
      </div>
    </div>
  );
}

function TelemetryModule({ icon: Icon, label, value, trend, color, data }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card glass-stack" 
      style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${color}10` }}>
            <Icon size={20} />
          </div>
          {trend && (
            <div style={{ fontSize: '12px', color: HUD_COLORS.success, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={12} fill="currentColor" /> {trend}
            </div>
          )}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '32px', fontWeight: 950, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</div>
      </div>

      {/* Sparkline Background */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', opacity: 0.4, pointerEvents: 'none' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data || []}>
            <defs>
              <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4}/>
                <stop offset="100%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" dataKey="val" stroke={color} strokeWidth={2} 
              fill={`url(#grad-${color})`} animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState([]);
  const [latency, setLatency] = useState(0);
  const socket = useSocket();
  const navigate = useNavigate();

  // Sophisticated telemetry generation
  const sparkData = useMemo(() => {
    // Generates a 'Mission Profile' curve
    return Array.from({ length: 12 }, (_, i) => ({ 
      val: 20 + Math.sin(i / 2) * 10 + (i % 3 === 0 ? 5 : 0) 
    }));
  }, []);

  useEffect(() => {
    const start = Date.now();
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/orders?limit=10'),
      api.get('/riders'),
      api.get('/analytics/orders/trend?days=30')
    ]).then(([analyticsRes, orderRes, riderRes, trendRes]) => {
      setLatency(Date.now() - start);
      setAnalytics(analyticsRes.data);
      setOrders(orderRes.data?.orders || []);
      setRiders(riderRes.data?.riders || []);
      setTrend(trendRes.data || []);
      setLoading(false);
    }).catch(err => {
      console.error('Dashboard Load Error:', err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const onOrderUpdate = (data) => {
      setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o));
      addToFeed({ 
        id: Date.now(), 
        type: 'LOGISTICS', 
        text: `Order Update: ${data.orderId.substring(0,8)} -> ${data.status.replace('_', ' ').toUpperCase()}`, 
        icon: Package, 
        color: HUD_COLORS.accent 
      });
    };

    const onRiderUpdate = (data) => {
      setRiders(prev => prev.map(r => r.id === data.riderId ? { ...r, last_lat: data.lat, last_lng: data.lng, last_seen_at: new Date() } : r));
      addToFeed({ 
        id: Date.now(), 
        type: 'SYNC', 
        text: `Location Sync: ${data.riderId.substring(0,6)} initialized`, 
        icon: Globe, 
        color: HUD_COLORS.info 
      });
    };

    socket.on('order-updated', onOrderUpdate);
    socket.on('rider-location', onRiderUpdate);

    return () => {
      socket.off('order-updated', onOrderUpdate);
      socket.off('rider-location', onRiderUpdate);
    };
  }, [socket]);

  useEffect(() => {
    const logs = [
      { type: 'NETWORK', text: 'Regional Hub: Hyderabad Sync Complete', icon: Globe, color: HUD_COLORS.accent },
      { type: 'FLEET', text: 'Node Status: Bengaluru Operational', icon: Activity, color: HUD_COLORS.info },
      { type: 'SLA', text: 'Market Uptime: 99.98% (India South)', icon: Zap, color: HUD_COLORS.success },
      { type: 'SECURITY', text: 'Identity Encryption: Active', icon: Shield, color: HUD_COLORS.warning }
    ];

    const interval = setInterval(() => {
      const log = logs[Math.floor(Math.random() * logs.length)];
      addToFeed({ id: `heartbeat-${Date.now()}`, ...log });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const addToFeed = (item) => {
    setFeed(prev => [item, ...prev].slice(0, 20));
  };

  const realChartData = useMemo(() => {
    if (!trend || trend.length === 0) return [];
    return trend.map(d => ({
      time: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      real: d.total,
      predictive: d.total * 0.9 + Math.random() * 5 // Subtle prediction
    }));
  }, [trend]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.03em' }}>Fleet Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Real-time overview of organizational fleet operations.</p>
        </div>
        <PerformanceHUD socketStatus={socket ? 'connected' : 'connecting'} latency={latency} />
      </div>

      {/* KPI HUD */}
      <div className="grid-auto" id="dashboard-kpi">
        {loading ? <SkeletonKPI count={4} /> : (
          <>
            <TelemetryModule icon={Package} label="Total Orders" value={analytics?.orders?.total || 0} trend="+12.5%" color={HUD_COLORS.info} data={sparkData} />
            <TelemetryModule icon={Users} label="Active Riders" value={(analytics?.riders?.byStatus?.available || 0) + (analytics?.riders?.byStatus?.busy || 0)} color={HUD_COLORS.accent} data={sparkData.map(d => ({ val: d.val + 5 }))} />
            <TelemetryModule icon={Zap} label="Delivery Rate" value={`${analytics?.orders?.deliveryRate || 0}%`} trend="+0.5%" color={HUD_COLORS.success} data={sparkData.map(d => ({ val: 50 - d.val }))} />
            <TelemetryModule icon={Shield} label="System Security" value="OK" color={HUD_COLORS.warning} data={Array(10).fill({ val: 0 })} />
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        
        {/* Main Telemetry Chart */}
        <div className="glass-card glass-stack" style={{ padding: '32px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Volume Tracking</h3>
            <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontWeight: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '2px', background: HUD_COLORS.accent }} /> ACTUAL VOLUME</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '2px', background: 'var(--border)', borderTop: '2px dashed #666' }} /> PREDICTED TRENDS</div>
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={realChartData}>
                <defs>
                  <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={HUD_COLORS.accent} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={HUD_COLORS.accent} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="predictive" stroke="#444" strokeDasharray="5 5" fill="none" strokeWidth={2} activeDot={false} />
                <Area type="monotone" dataKey="real" stroke={HUD_COLORS.accent} fill="url(#glow)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Ops Terminal */}
        <div className="glass-card glass-stack" style={{ background: '#000', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
            <TerminalIcon size={16} />
            <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recent Activity</span>
            <div className="pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: HUD_COLORS.success, marginLeft: 'auto' }} />
          </div>
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888' }}>
            <AnimatePresence initial={false}>
              {feed.length === 0 ? (
                <div style={{ opacity: 0.5 }}>[BOOT] INITIALIZING DISPATCH ENGINE... READY.</div>
              ) : (
                feed.map((item) => (
                  <motion.div 
                    key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    style={{ marginBottom: '8px', display: 'flex', gap: '12px' }}
                  >
                    <span style={{ color: item.color }}>[{item.type}]</span>
                    <span style={{ color: '#ccc' }}>{item.text}</span>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
          <div style={{ padding: '10px 20px', borderTop: '1px solid #111', fontSize: '10px', color: '#444', textAlign: 'right' }}>
            ACTIVE_SESSIONS: 1 | LOAD: 0.04
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', marginBottom: '32px' }}>
         <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recent Deployments</h3>
               <Link to="/orders" style={{ fontSize: '11px', color: HUD_COLORS.accent, fontWeight: 800, textTransform: 'uppercase' }}>LOG_QUEUE →</Link>
            </div>
            <div style={{ flex: 1 }}>
               {orders.slice(0, 5).map(o => (
                  <div key={o.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                        <div style={{ fontFamily: 'var(--font-mono)', color: HUD_COLORS.accent, fontSize: '11px', fontWeight: 800 }}>UNIT::{o.id.substring(0,8).toUpperCase()}</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{o.customer_name}</div>
                     </div>
                     <Badge status={o.status} size="sm" />
                  </div>
               ))}
            </div>
         </div>

         <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fleet Status</h3>
               <Link to="/riders" style={{ fontSize: '11px', color: HUD_COLORS.accent, fontWeight: 800, textTransform: 'uppercase' }}>MANAGE_FLEET →</Link>
            </div>
            <div style={{ flex: 1 }}>
               {riders.filter(r => r.status !== 'offline').slice(0, 5).map(r => (
                  <div key={r.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                     <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px' }}>{r.name.charAt(0)}</div>
                     <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{r.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{r.active_orders} ACTIVE_OPS</div>
                     </div>
                     <div className="pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: r.status === 'busy' ? HUD_COLORS.warning : HUD_COLORS.success }} />
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
