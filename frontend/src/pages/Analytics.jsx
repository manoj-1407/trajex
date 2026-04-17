import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Download, Calendar, TrendingUp, Clock, Package, Trophy } from 'lucide-react';
import Button from '../components/ui/Button';
import { SkeletonChart, SkeletonKPI } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import api from '../api/client';

const COLORS = {
  primary: 'var(--accent)',
  secondary: 'var(--info)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  muted: 'var(--text-muted)'
};

export default function Analytics() {
  const [tab, setTab] = useState('delivery');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: null,
    trend: [],
    timeTrend: [],
    topRiders: []
  });

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const from = new Date(Date.now() - days * 86400000).toISOString();
        const to = new Date().toISOString();
        const [dashRes, trendRes, timeRes, ridersRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get(`/analytics/orders/trend?from=${from}&to=${to}`),
          api.get(`/analytics/trend?days=${days}`),
          api.get(`/analytics/top-riders?days=${days}&limit=5`),
        ]);
        if (mounted) {
          setData({
            summary: dashRes.data,
            trend: trendRes.data.map(d => ({
              day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
              onTime: d.delivered - d.delayed,
              delayed: d.delayed,
              total: d.total
            })),
            timeTrend: timeRes.data.map(d => ({
              date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              avgTime: Math.round(d.avgMinutes)
            })),
            topRiders: ridersRes.data
          });
        }
      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [days]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong" style={{ padding: '12px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
          {payload.map(p => (
            <p key={p.dataKey} style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: p.color || p.fill }} />
              <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span> <span style={{ fontFamily: 'var(--font-mono)' }}>{p.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>Analytics</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
             {[7, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  style={{
                    background: days === d ? 'var(--accent-dim)' : 'transparent',
                    color: days === d ? 'var(--accent-text)' : 'var(--text-secondary)',
                    border: 'none', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    transition: 'background var(--transition-fast)'
                  }}
                >
                  {d}D
                </button>
             ))}
          </div>
          <Button variant="secondary" icon={<Download />}>Export Report</Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '2px' }}>
        <button
          onClick={() => setTab('delivery')}
          style={{
            background: 'none', border: 'none', padding: '8px 4px', fontSize: '14px', fontWeight: 600,
            color: tab === 'delivery' ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: tab === 'delivery' ? '2px solid var(--accent)' : '2px solid transparent',
            cursor: 'pointer', transition: 'var(--transition-fast)'
          }}
        >
          Delivery Performance
        </button>
        <button
          onClick={() => setTab('fleet')}
          style={{
            background: 'none', border: 'none', padding: '8px 4px', fontSize: '14px', fontWeight: 600,
            color: tab === 'fleet' ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: tab === 'fleet' ? '2px solid var(--accent)' : '2px solid transparent',
            cursor: 'pointer', transition: 'var(--transition-fast)'
          }}
        >
          Fleet Efficiency
        </button>
      </div>

      <div className="grid-auto">
        {loading ? (
           <>
             <SkeletonKPI />
             <SkeletonKPI />
             <SkeletonKPI />
           </>
        ) : (
          <>
            <div className="glass-card hover-lift" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>DELIVERY SUCCESS</div>
                <TrendingUp size={16} color={COLORS.primary} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{data.summary?.orders?.deliveryRate || 0}%</div>
              </div>
            </div>
            <div className="glass-card hover-lift" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>DELAYED RECENTLY</div>
                <Clock size={16} color={COLORS.danger} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{data.summary?.orders?.delayedLast7Days || 0}</div>
              </div>
            </div>
            <div className="glass-card hover-lift" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TOTAL ORDERS</div>
                <Package size={16} color={COLORS.secondary} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{data.summary?.orders?.total || 0}</div>
              </div>
            </div>
          </>
        )}
      </div>

      {tab === 'delivery' && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '400px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Order Volume vs SLA</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
             {loading ? <SkeletonChart height="100%" /> : data.trend.length === 0 ? <EmptyState icon={Package} title="No data available" compact /> : (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.trend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                   <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                   <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                   <Bar dataKey="onTime" name="On Time" stackId="a" fill="var(--accent)" radius={[0, 0, 4, 4]} />
                   <Bar dataKey="delayed" name="Delayed" stackId="a" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             )}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '400px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Average Delivery Time</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            {loading ? <SkeletonChart height="100%" /> : data.timeTrend.length === 0 ? <EmptyState icon={Clock} title="No time data" compact /> : (
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={data.timeTrend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3}/>
                       <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                   <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                   <Tooltip content={<CustomTooltip />} />
                   <Area type="monotone" dataKey="avgTime" name="Avg Minutes" stroke={COLORS.secondary} strokeWidth={2} fill="url(#timeGrad)" activeDot={{ r: 4, fill: COLORS.secondary }} />
                 </AreaChart>
               </ResponsiveContainer>
             )}
          </div>
        </div>
      </div>
      )}

      {tab === 'fleet' && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '400px', gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><Trophy size={18} color="var(--warning)" /> Top Performers</h3>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? <SkeletonChart height="100%" /> : data.topRiders.length === 0 ? <EmptyState icon={Trophy} title="No rider data found" compact /> : (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', fontSize: '12px', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 0', fontWeight: 600 }}>Rider Name</th>
                    <th style={{ padding: '12px 0', fontWeight: 600 }}>Deliveries</th>
                    <th style={{ padding: '12px 0', fontWeight: 600 }}>Avg Time</th>
                    <th style={{ padding: '12px 0', fontWeight: 600 }}>Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topRiders.map((rider, i) => (
                    <tr key={rider.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '16px 0', fontWeight: 500, color: 'var(--text-primary)' }}>{rider.fullName}</td>
                      <td style={{ padding: '16px 0', color: 'var(--text-secondary)' }}>{rider.deliveries}</td>
                      <td style={{ padding: '16px 0', color: 'var(--text-secondary)' }}>{rider.avgMinutes.toFixed(1)}m</td>
                      <td style={{ padding: '16px 0', color: 'var(--text-secondary)' }}>{(rider.successRate * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
