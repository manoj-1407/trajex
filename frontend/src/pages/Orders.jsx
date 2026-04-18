import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Plus, Search, X, MoreHorizontal, Copy, MapPin, Package, Clock, Navigation, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import api from '../api/client';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import { SkeletonTableRow, SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { formatTimeAgo, formatDate } from '../utils/format';
import { SYSTEM_CONFIG } from '../config/constants';
import { motion } from 'framer-motion';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const isOwnerOrManager = ['owner', 'manager'].includes(user?.role);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get('id');

  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [newOrderModal, setNewOrderModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null); // holds order object
  const [assignModal, setAssignModal] = useState(null); // holds order object
  
  const fetchOrders = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (filters.status !== 'all') params.status = filters.status;
      const res = await api.get('/orders', { params });
      setOrders(res.data?.orders || []);
      setTotalPages(res.data?.pages || 1);
      setTotalCount(res.data?.total || 0);
      if (initialId && !detailModal) {
        const o = res.data?.orders?.find(x => x.id === initialId);
        if (o) setDetailModal(o);
      }
    } catch(e) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(page); }, [page, filters.status]);

  const statuses = ['all', 'pending', 'confirmed', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed'];

  const filteredOrders = orders.filter(o => {
    if (filters.status !== 'all' && o.status !== filters.status) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      return o.customerName?.toLowerCase().includes(q) || 
             o.id.toLowerCase().includes(q) || 
             o.dropAddress?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCopyLink = (order) => {
    navigator.clipboard.writeText(`${window.location.origin}/track/${order.trackingToken}`);
    toast.success('Tracking link copied');
  };

  const NewOrderModal = () => {
    const [form, setForm] = useState({ customerName: '', customerPhone: '', deliveryAddress: '', notes: '' });
    const [submitting, setSubmitting] = useState(false);
    
    // items table mock logic
    const [items, setItems] = useState([{ name: '', qty: 1 }]);

    const submit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        const phone = form.customerPhone.startsWith('+') ? form.customerPhone : `+91${form.customerPhone.replace(/\D/g, '')}`;
        await api.post('/orders', { 
          ...form,
          customerPhone: phone,
          dropAddress: form.deliveryAddress,
          pickupLat: SYSTEM_CONFIG.COORDS.BASE_LAT,  
          pickupLng: SYSTEM_CONFIG.COORDS.BASE_LNG, 
          dropLat: SYSTEM_CONFIG.COORDS.BASE_LAT + 0.01, // simulation step   
          dropLng: SYSTEM_CONFIG.COORDS.BASE_LNG + 0.01,
          items 
        });
        toast.success('Order created');
        setNewOrderModal(false);
        fetchOrders();
      } catch(err) {
        toast.error('Failed to create order');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Modal isOpen={newOrderModal} onClose={() => setNewOrderModal(false)} title="New Order" size="lg">
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px' }} className="flex-col-mobile">
            <div style={{ flex: 1 }}><Input label="Customer Name" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} required disabled={submitting} /></div>
            <div style={{ flex: 1 }}><Input label="Customer Phone" value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} required disabled={submitting} /></div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Delivery Address</label>
            <textarea 
              value={form.deliveryAddress} onChange={e => setForm({...form, deliveryAddress: e.target.value})}
              required disabled={submitting}
              style={{ padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none', height: '80px', resize: 'none', fontFamily: 'inherit' }}
            />
          </div>

          <div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Items</label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setItems([...items, { name: '', qty: 1 }])}>+ Add Row</Button>
             </div>
             {items.map((it, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}><Input placeholder="Item name" value={it.name} onChange={e => { const n = [...items]; n[i].name = e.target.value; setItems(n); }} /></div>
                  <div style={{ width: '80px' }}><Input type="number" placeholder="Qty" value={it.qty} onChange={e => { const n = [...items]; n[i].qty = Number(e.target.value); setItems(n); }} /></div>
                  <Button type="button" variant="danger" size="md" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>X</Button>
                </div>
             ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Notes (optional)</label>
             <textarea 
              value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              disabled={submitting}
              style={{ padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none', height: '60px', resize: 'none', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button type="submit" loading={submitting}>Create Order</Button>
          </div>
        </form>
      </Modal>
    );
  };

  const AssignRiderModal = () => {
    const [suggested, setSuggested] = useState([]);
    const [loadingS, setLoadingS] = useState(false);
    
    useEffect(() => {
      if (assignModal) {
        setLoadingS(true);
        // API spec match: GET /api/v1/assignment/suggest?orderId=X
        api.get(`/assignment/suggest?orderId=${assignModal.id}`)
          .then(res => setSuggested(res.data.suggestions || []))
          .catch(()=>{})
          .finally(()=>setLoadingS(false));
      }
    }, [assignModal]);

    const assign = async (riderId) => {
      try {
        await api.post(`/orders/${assignModal.id}/assign`, { riderId });
        toast.success('Rider assigned');
        setAssignModal(null);
        fetchOrders();
      } catch (err) {
        toast.error('Assignment failed');
      }
    };

    if (!assignModal) return null;

    return (
      <Modal isOpen={!!assignModal} onClose={() => setAssignModal(null)} title={`Assign Rider: #${assignModal.id.substring(0,8).toUpperCase()}`}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Top 5 suggested riders based on distance and workload.</p>
        
        {loadingS && <div className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-md)' }} />}
        
        {!loadingS && suggested.map(r => (
           <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--success-dim)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 600 }}>{r.name.substring(0,2).toUpperCase()}</div>
                <div>
                   <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</div>
                   <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.distKm} km away • {r.activeOrders} active</div>
                   <div style={{ marginTop: '4px', width: '100px', height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${r.reliabilityScore || 80}%`, height: '100%', background: 'var(--accent)' }} />
                   </div>
                </div>
              </div>
              <Button onClick={() => assign(r.id)}>Assign</Button>
           </div>
        ))}
        
        <div style={{ marginTop: '24px' }}>
           <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Manual Search</h4>
           <Select placeholder="Select a rider..." options={[]} />
        </div>
      </Modal>
    )
  }

  const DetailModal = () => {
    const [tab, setTab] = useState('details');
    if (!detailModal) return null;

    return (
      <Modal 
        isOpen={!!detailModal} onClose={() => setDetailModal(null)} 
        title={`Order #${detailModal.id.substring(0,8).toUpperCase()}`} size="lg"
        footer={(
          <>
            {isOwnerOrManager && detailModal.status === 'confirmed' && (
              <Button onClick={() => { setDetailModal(null); setAssignModal(detailModal); }}>Assign Rider</Button>
            )}
            {isOwnerOrManager && !['delivered','cancelled','failed'].includes(detailModal.status) && (
              <Button variant="danger" ghost onClick={async () => {
                try {
                  await api.patch(`/orders/${detailModal.id}/status`, { status: 'cancelled' });
                  toast.success('Order cancelled');
                  setDetailModal(null);
                  fetchOrders(page);
                } catch(e) {
                  toast.error('Failed to cancel order');
                }
              }}>Cancel Order</Button>
            )}
          </>
        )}
      >
        <div style={{ borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px', marginBottom: '24px' }}>
           {['details', 'timeline', 'items'].map(t => (
             <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 4px', fontSize: '14px', fontWeight: 600, background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}>
               {t.charAt(0).toUpperCase() + t.slice(1)}
             </button>
           ))}
        </div>

        {tab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Badge status={detailModal.status} />
              <Button variant="secondary" size="sm" icon={<Copy />} onClick={() => handleCopyLink(detailModal)}>Copy Tracking Link</Button>
            </div>
            
            <div className="grid-auto">
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>Customer Details</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{detailModal.customerName}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{detailModal.customerPhone}</div>
              </div>
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>Delivery Address</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <MapPin size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{detailModal.dropAddress}</div>
                </div>
              </div>
            </div>

            {detailModal.riderName && (
              <div className="glass-card" style={{ padding: '20px' }}>
                 <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>Assigned Rider</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--info-dim)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{detailModal.riderName.substring(0,2).toUpperCase()}</div>
                    <div>
                       <div style={{ fontSize: '14px', fontWeight: 600 }}>{detailModal.riderName}</div>
                       <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{detailModal.riderPhone || '—'}</div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}

        {tab === 'timeline' && (
          <div style={{ padding: '16px' }}>
             {[
               { s: 'confirmed', label: 'Order Confirmed', icon: Package },
               { s: 'assigned', label: 'Rider Assigned', icon: Clock },
               { s: 'in_transit', label: 'Out for Delivery', icon: Navigation },
               { s: 'delivered', label: 'Delivered', icon: CheckCircle }
             ].map((st, i) => {
                const reached = ['confirmed','assigned','in_transit','delivered'].indexOf(detailModal.status) >= i;
                return (
                  <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                       <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: reached ? 'var(--accent)' : 'var(--bg-elevated)', border: reached ? 'none' : '2px solid var(--border)', color: reached ? 'var(--bg)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <st.icon size={16} />
                       </div>
                       {i < 3 && <div style={{ width: '2px', height: '40px', background: reached ? 'var(--accent)' : 'var(--border)', margin: '4px 0' }} />}
                    </div>
                    <div style={{ paddingTop: '6px' }}>
                       <div style={{ fontSize: '15px', fontWeight: 600, color: reached ? 'var(--text-primary)' : 'var(--text-muted)' }}>{st.label}</div>
                       <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{reached ? formatTimeAgo(detailModal.updatedAt) : '—'}</div>
                    </div>
                  </div>
                )
             })}
          </div>
        )}

        {tab === 'items' && (
          <div style={{ padding: '16px' }}>
             <EmptyState compact icon={Package} title="No items details saved" subtitle="This order was created without sub-items." />
          </div>
        )}

      </Modal>
    );
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>Orders</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" icon={<Download />} onClick={async () => { try { const res = await api.get('/orders/export', { params: { status: filters.status !== 'all' ? filters.status : undefined }, responseType: 'blob' }); const url = URL.createObjectURL(new Blob([res.data])); const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click(); URL.revokeObjectURL(url); toast.success('Export downloaded'); } catch(e) { toast.error('Export failed'); } }}>Export</Button>
          {isOwnerOrManager && <Button icon={<Plus />} onClick={() => setNewOrderModal(true)}>New Order</Button>}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {statuses.map(s => {
            const active = filters.status === s;
            return (
              <button
                key={s}
                onClick={() => setFilters({ ...filters, status: s })}
                style={{
                  padding: '6px 12px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  fontSize: '13px', fontWeight: 500, transition: 'var(--transition-fast)',
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--on-accent)' : 'var(--text-secondary)',
                  boxShadow: active ? 'none' : 'inset 0 0 0 1px var(--border)'
                }}
              >
                {s === 'all' ? 'All Orders' : s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}
              </button>
            )
          })}
        </div>
        
        {/* Search */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <Input 
            placeholder="Search customer, ID, address..." leftIcon={Search} 
            value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})}
          />
          {(filters.search || filters.status !== 'all') && (
            <Button variant="ghost" icon={<X />} onClick={() => setFilters({ status: 'all', search: '' })}>Clear</Button>
          )}
        </div>
      </div>

      {/* Advanced Data Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(360px, 100%), 1fr))', gap: '20px' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filteredOrders.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState compact icon={Package} title="No orders found" subtitle="Try adjusting your filters" />
          </div>
        ) : (
          filteredOrders.map(o => (
            <motion.div
              layout
              key={o.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => setDetailModal(o)}
              className="glass-card glass-stack"
              style={{ padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    ID: {o.id.substring(0, 10).toUpperCase()}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{o.customerName}</h3>
                </div>
                <Badge status={o.status} size="sm" />
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={16} color="var(--text-secondary)" />
                </div>
                <div className="truncate-2" style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {o.dropAddress}
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {o.riderName ? (
                    <>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                        {o.riderName.charAt(0)}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{o.riderName}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>UNASSIGNED</span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
                  <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {formatTimeAgo(o.createdAt)}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="glass" style={{ marginTop: '32px', padding: '16px 24px', borderRadius: 'var(--radius-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          PAGE {page} OF {totalPages} — {totalCount} ORDERS
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      <NewOrderModal />
      <DetailModal />
      <AssignRiderModal />
    </div>
  );
}
