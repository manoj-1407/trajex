import { useState, useEffect } from 'react';
import { Truck, CheckCircle, Package, ArrowRight, MapPin, Phone, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import api from '../api/client';
import useSocket from '../hooks/useSocket';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard, SkeletonTableRow } from '../components/ui/Skeleton';
import { formatTimeAgo } from '../utils/format';

export default function MyDeliveries() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const { user } = useAuthStore();
  const socket = useSocket();

  const fetchMyOrders = async () => {
    try {
      const res = await api.get('/orders');
      // For a staff member, /orders returns their assigned orders if backed is scoped,
      // but let's defensively filter just in case. Assuming API returns assigned orders.
      setOrders(res.data?.orders || []);
    } catch(e) {
      toast.error('Failed to load your deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyOrders(); }, []);

  useEffect(() => {
    if (!socket) return;
    const onOrderUpdate = (data) => {
      setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o));
    };
    socket.on('order-updated', onOrderUpdate);
    return () => socket.off('order-updated', onOrderUpdate);
  }, [socket]);

  const activeOrders = orders.filter(o => ['assigned', 'picked_up', 'in_transit'].includes(o.status));
  const pendingOrders = orders.filter(o => o.status === 'confirmed'); // mock logic for "next"
  const completedOrders = orders.filter(o => o.status === 'delivered').slice(0, 5);

  const currentOrder = activeOrders[0];

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.patch(`/orders/${id}`, { status });
      toast.success(`Order marked as ${status.replace('_', ' ')}`);
      fetchMyOrders();
    } catch(e) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, padding: '0 8px' }}>My Deliveries</h1>

      {loading ? (
        <SkeletonCard lines={4} />
      ) : currentOrder ? (
         <div className="glass-card hover-lift" style={{ 
          border: '2px solid var(--accent)', boxShadow: '0 8px 32px rgba(0, 229, 204, 0.1)', overflow: 'hidden'
        }}>
          <div style={{ background: 'var(--accent)', color: 'var(--on-accent)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Delivery</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700 }}>#{currentOrder.id.substring(0,8).toUpperCase()}</div>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <Badge status={currentOrder.status} />
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <Clock size={14} style={{ marginRight: '4px' }} /> Assigned {formatTimeAgo(currentOrder.updated_at)}
              </div>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{currentOrder.customer_name}</h2>
            
            <a href={`tel:${currentOrder.customer_phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '24px', padding: '6px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', fontSize: '14px', fontWeight: 500 }}>
              <Phone size={14} /> {currentOrder.customer_phone}
            </a>

            <div className="divider" style={{ margin: '0 0 24px 0' }} />

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Destination</div>
                <div style={{ fontSize: '16px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{currentOrder.delivery_address}</div>
                {/* Simulated Maps Link */}
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentOrder.delivery_address)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '12px', fontSize: '14px', color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
                  Open in Maps →
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentOrder.status === 'assigned' && (
                <Button size="lg" fullWidth onClick={() => updateStatus(currentOrder.id, 'picked_up')} loading={updating === currentOrder.id}>
                  I've picked this up
                </Button>
              )}
              {currentOrder.status === 'picked_up' && (
                <Button size="lg" fullWidth onClick={() => updateStatus(currentOrder.id, 'in_transit')} loading={updating === currentOrder.id}>
                  Start Route
                </Button>
              )}
              {currentOrder.status === 'in_transit' && (
                <Button size="lg" fullWidth onClick={() => updateStatus(currentOrder.id, 'delivered')} loading={updating === currentOrder.id} icon={<CheckCircle />}>
                  Mark Delivered
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState icon={Truck} title="No active deliveries" subtitle="You are available for new assignments." />
      )}

      {/* Next Up */}
      {pendingOrders.length > 0 && (
        <div style={{ padding: '0 8px' }}>
           <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>Next in queue</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingOrders.map(o => (
              <div key={o.id} className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{o.customer_name}</div>
                  <div className="truncate" style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '200px' }}>{o.delivery_address}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>#{o.id.substring(0,6).toUpperCase()}</div>
              </div>
            ))}
           </div>
        </div>
      )}

      {/* Recently Completed */}
      {completedOrders.length > 0 && (
        <div style={{ padding: '0 8px', marginTop: '16px' }}>
           <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>Completed today</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {completedOrders.map(o => (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle size={16} color="var(--success)" />
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{o.customer_name}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatTimeAgo(o.updated_at)}</div>
              </div>
            ))}
           </div>
        </div>
      )}

    </div>
  );
}
