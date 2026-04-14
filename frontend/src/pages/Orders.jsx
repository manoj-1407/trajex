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
import { SkeletonTableRow } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { formatTimeAgo, formatDate } from '../utils/format';

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

  const [newOrderModal, setNewOrderModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null); // holds order object
  const [assignModal, setAssignModal] = useState(null); // holds order object
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data?.orders || []);
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

  useEffect(() => { fetchOrders(); }, []);

  const statuses = ['all', 'pending', 'confirmed', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed'];

  const filteredOrders = orders.filter(o => {
    if (filters.status !== 'all' && o.status !== filters.status) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      return o.customer_name?.toLowerCase().includes(q) || 
             o.id.toLowerCase().includes(q) || 
             o.delivery_address?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCopyLink = (order) => {
    navigator.clipboard.writeText(`${window.location.origin}/track/${order.tracking_token}`);
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
        const phone = form.customerPhone.startsWith('+') ? form.customerPhone : `+1${form.customerPhone.replace(/\D/g, '')}`;
        await api.post('/orders', { 
          ...form,
          customerPhone: phone,
          dropAddress: form.deliveryAddress,
          pickupLat: 40.7128,  // Simulated base coords (NYC) 
          pickupLng: -74.0060, // for haversine routing
          dropLat: 40.7200,    
          dropLng: -74.0100,
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
            {isOwnerOrManager && detailModal.status !== 'delivered' && (
              <Button variant="danger" ghost>Cancel Order</Button>
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
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{detailModal.customer_name}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{detailModal.customer_phone}</div>
              </div>
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>Delivery Address</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <MapPin size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{detailModal.delivery_address}</div>
                </div>
              </div>
            </div>

            {detailModal.rider_name && (
              <div className="glass-card" style={{ padding: '20px' }}>
                 <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>Assigned Rider</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--info-dim)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{detailModal.rider_name.substring(0,2).toUpperCase()}</div>
                    <div>
                       <div style={{ fontSize: '14px', fontWeight: 600 }}>{detailModal.rider_name}</div>
                       <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{detailModal.rider_phone || '—'}</div>
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
                       <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{reached ? formatTimeAgo(detailModal.updated_at) : '—'}</div>
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
          <Button variant="secondary" icon={<Download />}>Export</Button>
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

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Order ID</th>
                <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Customer</th>
                <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Address</th>
                <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Rider</th>
                <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Created</th>
                <th style={{ padding: '16px 20px', width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonTableRow cols={7} style={{ padding: '16px 20px', border: 'none' }} />
                  <SkeletonTableRow cols={7} style={{ padding: '16px 20px', border: 'none' }} />
                  <SkeletonTableRow cols={7} style={{ padding: '16px 20px', border: 'none' }} />
                  <SkeletonTableRow cols={7} style={{ padding: '16px 20px', border: 'none' }} />
                  <SkeletonTableRow cols={7} style={{ padding: '16px 20px', border: 'none' }} />
                </>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px' }}>
                    <EmptyState compact icon={Package} title="No orders found" subtitle="Try adjusting your filters" />
                  </td>
                </tr>
              ) : filteredOrders.map(o => (
                <tr 
                  key={o.id} 
                  onClick={() => setDetailModal(o)}
                  style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent)' }}>
                    #{o.id.substring(0, 8).toUpperCase()}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{o.customer_name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{o.customer_phone}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                     <div className="truncate" style={{ maxWidth: '200px', fontSize: '14px', color: 'var(--text-primary)' }} title={o.delivery_address}>
                       {o.delivery_address}
                     </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}><Badge status={o.status} size="sm" /></td>
                  <td style={{ padding: '16px 20px', fontSize: '14px' }}>
                    {o.rider_name ? <span style={{ color: 'var(--text-primary)' }}>{o.rider_name}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-secondary)' }} title={formatDate(o.created_at)}>
                    {formatTimeAgo(o.created_at)}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <button onClick={(e) => { e.stopPropagation(); setDetailModal(o); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Showing 1 - {filteredOrders.length} of {filteredOrders.length} orders</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" disabled>Previous</Button>
            <Button variant="secondary" size="sm" disabled>Next</Button>
          </div>
        </div>
      </div>

      <NewOrderModal />
      <DetailModal />
      <AssignRiderModal />
    </div>
  );
}
