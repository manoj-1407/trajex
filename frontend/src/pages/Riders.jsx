import { useState, useEffect } from 'react';
import { Users, UserPlus, Phone, MapPin, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import api from '../api/client';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { motion } from 'framer-motion';

// Mock Star Component for reliability
function StarRating({ score, max = 5 }) {
  const scaled = (score / 100) * max;
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < scaled ? "var(--warning)" : "var(--bg-elevated)"} stroke={i < scaled ? "var(--warning)" : "var(--border)"} strokeWidth="1">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [inviteModal, setInviteModal] = useState(false);
  const [detailPanel, setDetailPanel] = useState(null); // rider object
  
  const { user } = useAuthStore();
  const isManager = ['owner', 'manager'].includes(user?.role);

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/riders');
      setRiders(res.data?.riders || []);
    } catch(e) {
      toast.error('Failed to load riders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRiders(); }, []);

  const filteredRiders = riders.filter(r => {
    if (tab !== 'all' && r.status !== tab) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const tabs = [
    { id: 'all', label: 'All Riders' },
    { id: 'available', label: 'Available' },
    { id: 'busy', label: 'Busy' },
    { id: 'offline', label: 'Offline' }
  ];

  const InviteModal = () => {
    const [form, setForm] = useState({ name: '', email: '', phone: '', vehicleType: 'bike' });
    const [submitting, setSubmitting] = useState(false);

    const vehicleOptions = [
      { value: 'bike', label: 'Bicycle / E-Bike' },
      { value: 'scooter', label: 'Motor Scooter' },
      { value: 'car', label: 'Compact Car' },
      { value: 'van', label: 'Delivery Van' }
    ];
    
    const submit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        const phone = form.phone.startsWith('+') ? form.phone : `+91${form.phone.replace(/\D/g, '')}`;
        // Use the specialized /invite endpoint which creates both User and Profile
        await api.post('/riders/invite', { ...form, phone });
        toast.success(`Invitation sent to ${form.email}`);
        setInviteModal(false);
        fetchRiders();
      } catch(err) {
        toast.error('Failed to invite rider');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Modal isOpen={inviteModal} onClose={() => setInviteModal(false)} title="Invite Rider">
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required disabled={submitting} />
          <Input label="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required disabled={submitting} />
          <Input label="Phone Number" placeholder="+1..." value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required disabled={submitting} />
          <Select 
            label="Vehicle Type" 
            value={form.vehicleType} 
            onChange={v => setForm({...form, vehicleType: v})} 
            options={vehicleOptions}
            disabled={submitting}
          />
          <Button type="submit" loading={submitting} style={{ marginTop: '16px' }}>Send Invite / Add Rider</Button>
        </form>
      </Modal>
    );
  };

  const getAvatarBg = (status) => {
    if (status === 'available') return 'var(--success-dim)';
    if (status === 'busy') return 'var(--warning-dim)';
    return 'var(--bg-elevated)';
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>Riders</h1>
        {isManager && <Button icon={<UserPlus />} onClick={() => setInviteModal(true)}>Invite Rider</Button>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {tabs.map(t => {
            const count = t.id === 'all' ? riders.length : riders.filter(r => r.status === t.id).length;
            const active = tab === t.id;
            return (
              <button
                key={t.id} onClick={() => setTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 16px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 500, transition: 'var(--transition-fast)',
                  background: active ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: active ? 'var(--bg)' : 'var(--text-primary)',
                }}
              >
                {t.label}
                <span style={{ 
                  background: active ? 'rgba(7,7,15,0.2)' : 'var(--border)', 
                  color: active ? 'var(--bg)' : 'var(--text-secondary)',
                  padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 700 
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <Input 
          placeholder="Search riders by name..." 
          value={search} onChange={e => setSearch(e.target.value)} 
          style={{ maxWidth: '400px' }}
        />
      </div>

      {/* Fleet Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filteredRiders.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
             <EmptyState icon={Users} title="No riders found" subtitle="Clear your filters or onboard new riders to expand your fleet." />
          </div>
        ) : (
          filteredRiders.map(r => (
            <motion.div
              layout
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass-card glass-stack"
              style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}
            >
              <div style={{ padding: '24px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.status === 'offline' ? 'var(--text-muted)' : r.status === 'busy' ? 'var(--warning)' : 'var(--success)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{r.status}</span>
                  </div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 800 }}>STABLE_CONNECTION</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ 
                    width: '60px', height: '60px', borderRadius: '16px', flexShrink: 0,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    boxShadow: 'inset 0 0 10px rgba(255,255,255,0.02)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)'
                  }}>
                    {r.name.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '4px' }}>{r.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={12} color="var(--accent)" />
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>{r.phone}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg-surface)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 800, letterSpacing: '0.05em' }}>Current Load</div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{r.active_orders} ORDERS</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 800, letterSpacing: '0.05em' }}>Trust Score</div>
                    <StarRating score={r.reliability_score || 85} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                <button 
                  onClick={() => setDetailPanel(r)}
                  style={{ flex: 1, padding: '14px', background: 'transparent', border: 'none', borderRight: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', transition: 'var(--transition-fast)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                >
                  View Profile
                </button>
                {r.status === 'available' && (
                  <button 
                    style={{ flex: 1, padding: '14px', background: 'var(--accent-dim)', border: 'none', color: 'var(--accent)', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: 'var(--transition-fast)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-glow)'}
                  >
                    Assign Task
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <InviteModal />

      {/* Side Panel for Details */}
      {detailPanel && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 300 }} onClick={() => setDetailPanel(null)} />
          <div className="glass-strong fade-in-up" style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', maxWidth: '100vw',
            zIndex: 301, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>{detailPanel.name}</div>
              <button onClick={() => setDetailPanel(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                   <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: getAvatarBg(detailPanel.status), color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 600 }}>
                    {detailPanel.name.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <Badge type="rider" status={detailPanel.status} />
                    <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>{detailPanel.phone}</div>
                  </div>
                </div>

                <div className="divider" />

                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Performance</div>
                  <div className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RELIABILITY</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{detailPanel.reliability_score || 85}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ACTIVE</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{detailPanel.active_orders}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
